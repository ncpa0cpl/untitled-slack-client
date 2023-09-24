import { SlackQuark } from "../../quarks/slack/slack-quark";
import type { SlackService } from "../slack-service/slack-service";
import { SlackChannel } from "./channel/channel";

export class SlackChannelService {
  private static instances: Array<SlackChannelService> = [];

  static getService(workspaceID: string) {
    return SlackChannelService.instances.find(
      (i) => i.workspaceID === workspaceID,
    );
  }

  static getChannelService(workspaceID: string, channelID: string) {
    const service = SlackChannelService.getService(workspaceID);

    if (service) {
      return service.getChannelService(channelID);
    }
  }

  static createServiceForWorkspace(
    service: SlackService,
    ws: WebSocket,
    workspaceID: string,
  ) {
    const existing = SlackChannelService.instances.find(
      (i) => i.workspaceID === workspaceID,
    );

    if (existing) {
      return existing;
    }

    const instance = new SlackChannelService(service, ws, workspaceID);
    SlackChannelService.instances.push(instance);

    return instance;
  }

  static disposeOfServiceForWorkspace(workspaceID: string) {
    const existing = SlackChannelService.instances.find(
      (i) => i.workspaceID === workspaceID,
    );

    if (existing) {
      SlackChannelService.instances = SlackChannelService.instances.filter(
        (i) => i.workspaceID !== workspaceID,
      );
      existing.dispose();
    }
  }

  private channels: Array<SlackChannel> = [];

  constructor(
    private readonly service: SlackService,
    private readonly ws: WebSocket,
    public readonly workspaceID: string,
  ) {}

  private createChannel(channelID: string): SlackChannel {
    const channel = new SlackChannel(
      this,
      this.service,
      this.ws,
      this.workspaceID,
      channelID,
    );

    this.channels.push(channel);

    return channel;
  }

  public getChannelService(channelID: string): SlackChannel {
    const existing = this.channels.find((c) => c.channelID === channelID);

    if (existing) {
      return existing;
    }

    return this.createChannel(channelID);
  }

  private dispose() {
    SlackQuark.removeWorkspace(this.workspaceID);
  }
}
