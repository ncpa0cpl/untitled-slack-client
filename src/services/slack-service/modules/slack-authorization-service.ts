import { WebClient } from "@slack/web-api";
import { SlackClient } from "../../../quarks/slack/slack-client";
import { SlackUser } from "../../../quarks/user";
import type { SlackService } from "../slack-service";

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

export class SlackAuthorizationService {
  constructor(private readonly mainService: typeof SlackService) {}

  createClient(token?: string) {
    const client = new WebClient(token, {
      maxRequestConcurrency: 10,
      retryConfig: {
        minTimeout: 100,
        maxTimeout: 2500,
        randomize: true,
        retries: 5,
      },
    });

    SlackClient.set({ client });

    return client;
  }

  getOrCreateClient() {
    const client = SlackClient.get();

    if (client.client) {
      return client.client;
    }

    return this.createClient();
  }

  async logIn(team: string, email: string, password: string) {
    const client = this.createClient();

    const findTeamResponse = await client.apiCall("auth.findTeam", {
      domain: team,
    });

    if (!findTeamResponse.ok) {
      throw new AuthorizationError(AuthResultCode.InvalidTeam);
    }

    const signInResponse = await client.apiCall("auth.signin", {
      email,
      password,
      team: findTeamResponse.team_id,
    });

    if (!signInResponse.ok) {
      throw new AuthorizationError(AuthResultCode.UserAuthFailed);
    }

    const user = await this.authorizeUser(
      signInResponse.token as string,
      signInResponse.user as string
    );

    SlackUser.set({
      firsLoadCompleted: true,
      loggedIn: true,
      id: signInResponse.user as string,
      accessToken: signInResponse.token as string,
      email: signInResponse.user_email as string,
      teamID: signInResponse.team as string,
      name: user.name as string,
      realName: user.real_name,
      displayName: user.profile?.display_name,
      color: user.color,
      phone: user.profile?.phone,
      image: {
        original: user.profile?.image_original,
        px1024: user.profile?.image_1024,
        px512: user.profile?.image_512,
        px192: user.profile?.image_192,
        px72: user.profile?.image_72,
        px48: user.profile?.image_48,
        px32: user.profile?.image_32,
        px24: user.profile?.image_24,
      },
    });

    return user;
  }

  async authorizeUser(token: string, userID: string) {
    const client = this.createClient(token);

    SlackClient.set({
      client: client,
    });

    const userInfo = await client.users.info({
      user: userID,
    });

    if (!userInfo.ok || !userInfo.user) {
      throw new AuthorizationError(AuthResultCode.UserInfoFetchFailed);
    }

    return userInfo.user;
  }

  async signOut() {
    SlackClient.set({
      token: null,
      client: null,
    });
    SlackUser.set({
      firsLoadCompleted: true,
      loggedIn: false,
    });
  }
}
