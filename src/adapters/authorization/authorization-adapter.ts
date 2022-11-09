import { WebClient } from "@slack/web-api";
import { SlackClientQuark } from "../../quarks/slack-client";
import { UserQuark } from "../../quarks/user";

export enum AuthResultCode {
  InvalidTeam = "invalid_team",
  UserAuthFailed = "user_auth_failed",
  UserInfoFetchFailed = "user_info_fetch_failed",
  Success = "success",
}

export class AuthorizationAdapter {
  static async authorize(team: string, email: string, password: string) {
    const client = new WebClient();

    const findTeamResponse = await client.apiCall("auth.findTeam", {
      domain: team,
    });

    if (!findTeamResponse.ok) {
      return AuthResultCode.InvalidTeam;
    }

    const signInResponse = await client.apiCall("auth.signin", {
      email,
      password,
      team: findTeamResponse.team_id,
    });

    if (!signInResponse.ok) {
      return AuthResultCode.UserAuthFailed;
    }

    const authorizedClient = new WebClient(signInResponse.token as string);

    const userInfo = await authorizedClient.users.info({
      user: signInResponse.user as string,
    });

    if (!userInfo.ok || !userInfo.user) {
      return AuthResultCode.UserInfoFetchFailed;
    }

    SlackClientQuark.set({
      client: authorizedClient,
    });

    UserQuark.set({
      loggedIn: true,
      id: signInResponse.user as string,
      accessToken: signInResponse.token as string,
      email: signInResponse.user_email as string,
      teamID: signInResponse.team as string,
      name: userInfo.user.name as string,
      realName: userInfo.user.real_name,
      displayName: userInfo.user.profile?.display_name,
      color: userInfo.user.color,
      phone: userInfo.user.profile?.phone,
      image: {
        original: userInfo.user.profile?.image_original,
        px1024: userInfo.user.profile?.image_1024,
        px512: userInfo.user.profile?.image_512,
        px192: userInfo.user.profile?.image_192,
        px72: userInfo.user.profile?.image_72,
        px48: userInfo.user.profile?.image_48,
        px32: userInfo.user.profile?.image_32,
        px24: userInfo.user.profile?.image_24,
      },
    });

    return AuthResultCode.Success;
  }

  static async signOut() {
    UserQuark.set({
      loggedIn: false,
    });
  }
}
