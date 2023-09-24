import type { WebClient } from "@slack/web-api";
import type { AxiosInstance } from "axios";
import { SlackQuark } from "../../quarks/slack/slack-quark";
import { SlackServiceAuthorizationModule } from "./modules/slack-authorization-service";
import { SlackServiceChannelsModule } from "./modules/slack-channels-service";
import { SlackServiceUsersModule } from "./modules/slack-users-service";

export class SlackService {
  static auth = new SlackServiceAuthorizationModule();

  static getService(team?: string): SlackService | undefined {
    const state = SlackQuark.get();

    if (team) {
      return state.workspaces.find((w) => w.workspaceID === team)?.service;
    }

    return state.workspaces.find((w) => w.workspaceID === state.activeWorkspace)
      ?.service;
  }

  constructor(
    private readonly client: WebClient,
    public readonly workspaceID: string,
  ) {}

  users = new SlackServiceUsersModule(this);

  channels = new SlackServiceChannelsModule(this);

  getClient() {
    return this.client;
  }

  getAxios() {
    const client = this.getClient();
    // @ts-ignore
    return client.axios as AxiosInstance;
  }
}
