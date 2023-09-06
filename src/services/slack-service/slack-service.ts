import type { WebClient } from "@slack/web-api";
import type { AxiosInstance } from "axios";
import { SlackQuark } from "../../quarks/slack/slack-client";
import { SlackAuthorizationService } from "./modules/slack-authorization-service";
import { SlackChannelsService } from "./modules/slack-channels-service";
import { SlackUsersService } from "./modules/slack-users-service";

export class SlackService {
  static auth = new SlackAuthorizationService();

  static getService(team?: string): SlackService | undefined {
    const state = SlackQuark.get();

    if (team) {
      return state.workspaces.find((w) => w.team === team)?.service;
    }

    return state.workspaces.find((w) => w.team === state.activeWorkspace)
      ?.service;
  }

  constructor(private readonly client: WebClient) {}

  users = new SlackUsersService(this);

  channels = new SlackChannelsService(this);

  getClient() {
    return this.client;
  }

  getAxios() {
    const client = this.getClient();
    // @ts-ignore
    return client.axios as AxiosInstance;
  }
}
