import { WebClient } from "@slack/web-api";
import { SlackClient } from "../../quarks/slack-client";
import { SlackUser } from "../../quarks/user";

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

export class AuthorizationAdapter {
  static async logIn(team: string, email: string, password: string) {
    const client = new WebClient();

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

    const { user } = await this.authorize(
      signInResponse.token as string,
      signInResponse.user as string
    );

    SlackUser.set({
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

    return AuthResultCode.Success;
  }

  static async authorize(token: string, userID: string) {
    const authorizedClient = new WebClient(token as string);

    const userInfo = await authorizedClient.users.info({
      user: userID,
    });

    if (!userInfo.ok || !userInfo.user) {
      throw new AuthorizationError(AuthResultCode.UserInfoFetchFailed);
    }

    SlackClient.set({
      client: authorizedClient,
    });

    return {
      authorizedClient,
      user: userInfo.user,
    };
  }

  static async signOut() {
    SlackClient.set({
      token: null,
      client: null,
    });
    SlackUser.set({
      loggedIn: false,
    });
  }
}
