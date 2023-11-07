import type { WebClient } from "@slack/web-api";
import type { AxiosInstance } from "axios";
import { SlackQuark } from "../../quarks/slack/slack-quark";
import { SlackGatewayServiceAuthModule } from "./modules/slack-authorization.sm";
import { SlackGatewayServiceChannelModule } from "./modules/slack-channels.sm";
import { SlackGatewayServiceUserModule } from "./modules/slack-users.sm";
import { SlackGatewayServiceWorkspaceModule } from "./modules/slack-workspace.sm";

export class SlackGatewayService {
  static auth = new SlackGatewayServiceAuthModule();

  static getService(team?: string): SlackGatewayService | undefined {
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

  users = new SlackGatewayServiceUserModule(this);

  channels = new SlackGatewayServiceChannelModule(this);

  workspace = new SlackGatewayServiceWorkspaceModule(this);

  getClient() {
    return this.client;
  }

  getAxios() {
    const client = this.getClient();
    // @ts-ignore
    return client.axios as AxiosInstance;
  }
}
