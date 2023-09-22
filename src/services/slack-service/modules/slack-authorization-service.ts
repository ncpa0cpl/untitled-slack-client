import { WebClient } from "@slack/web-api";
import type { User as SlackUser } from "@slack/web-api/dist/response/UsersInfoResponse";
import { SlackQuark } from "../../../quarks/slack/slack-client";
import { UserQuark, type User } from "../../../quarks/user";
import { RequestError } from "../../../utils/errors/fetch-error";
import { Logger } from "../../../utils/logger";
import type { AsyncResult } from "../../../utils/result";
import { err, ok, type Result } from "../../../utils/result";

export enum AuthResultCode {
  InvalidTeam = "invalid_team",
  UserAuthFailed = "user_auth_failed",
  UserInfoFetchFailed = "user_info_fetch_failed",
  Success = "success",
}

export class AuthorizationError extends Error {
  private static codeToMessage(code: AuthResultCode) {
    switch (code) {
      case AuthResultCode.InvalidTeam:
        return "Invalid team";
      case AuthResultCode.UserAuthFailed:
        return "User authentication failed";
      case AuthResultCode.UserInfoFetchFailed:
        return "Failed to fetch user info";
      case AuthResultCode.Success:
        return "Success";
    }
  }

  constructor(public code: AuthResultCode) {
    super(AuthorizationError.codeToMessage(code));
  }
}

export class SlackServiceAuthorizationModule {
  private createClient(token?: string): WebClient {
    const client = new WebClient(token, {
      maxRequestConcurrency: 10,
      retryConfig: {
        minTimeout: 100,
        maxTimeout: 2500,
        randomize: true,
        retries: 5,
      },
    });

    return client;
  }

  private async createWebSocket(
    client: WebClient,
  ): AsyncResult<WebSocket, Error> {
    const rtm = await client.rtm.connect();

    if (!rtm.ok) {
      return err(new RequestError(rtm.error, rtm));
    }

    if (!rtm.url) {
      return err(new Error("No url in response"));
    }

    const ws = new WebSocket(rtm.url);
    return ok(ws);
  }

  async logIn(
    teamDomain: string,
    email: string,
    password: string,
  ): Promise<Result<User, AuthorizationError | Error>> {
    const client = this.createClient();

    const findTeamResponse = await client.apiCall("auth.findTeam", {
      domain: teamDomain,
    });

    if (!findTeamResponse.ok) {
      return err(new AuthorizationError(AuthResultCode.InvalidTeam));
    }

    const signInResponse = await client.apiCall("auth.signin", {
      email,
      password,
      team: findTeamResponse.team_id,
    });

    if (!signInResponse.ok) {
      return err(new AuthorizationError(AuthResultCode.UserAuthFailed));
    }

    const authResult = await this.authorizeUser(
      findTeamResponse.team_id as string,
      signInResponse.token as string,
      signInResponse.user as string,
    );

    if (!authResult.ok) {
      return authResult;
    }

    const sUser = authResult.value;

    const user: User = {
      firsLoadCompleted: true,
      loggedIn: true,
      id: signInResponse.user as string,
      accessToken: signInResponse.token as string,
      email: signInResponse.user_email as string,
      teamID: signInResponse.team as string,
      name: sUser.name as string,
      realName: sUser.real_name,
      displayName: sUser.profile?.display_name,
      color: sUser.color,
      phone: sUser.profile?.phone,
      image: {
        original: sUser.profile?.image_original,
        px1024: sUser.profile?.image_1024,
        px512: sUser.profile?.image_512,
        px192: sUser.profile?.image_192,
        px72: sUser.profile?.image_72,
        px48: sUser.profile?.image_48,
        px32: sUser.profile?.image_32,
        px24: sUser.profile?.image_24,
      },
    };

    UserQuark.set(user);

    return ok(user);
  }

  async authorizeUser(
    team: string,
    token: string,
    userID: string,
  ): Promise<Result<SlackUser, AuthorizationError | Error>> {
    const client = this.createClient(token);
    const wsResult = await this.createWebSocket(client);

    if (!wsResult.ok) {
      return wsResult;
    }

    Logger.info("User has been authorized.");

    try {
      SlackQuark.activateWorkspace(team, client, wsResult.value);
    } catch (e) {
      Logger.error(e);
      return err(new AuthorizationError(AuthResultCode.UserInfoFetchFailed));
    }

    const userInfo = await client.users.info({
      user: userID,
    });

    if (!userInfo.ok || !userInfo.user) {
      Logger.error(userInfo.error);
      return err(new AuthorizationError(AuthResultCode.UserInfoFetchFailed));
    }

    return ok(userInfo.user);
  }

  async signOut(team: string) {
    SlackQuark.removeWorkspace(team);
    UserQuark.set({
      firsLoadCompleted: true,
      loggedIn: false,
    });
  }
}
