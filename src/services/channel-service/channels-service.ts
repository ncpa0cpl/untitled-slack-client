import { PersistentSession } from "../../quarks/persistent-session";
import { Reactive } from "../../utils/reactive";
import type { SlackService } from "../slack-service/slack-service";
import { SlackChannel } from "./channel/channel";

export class SlackChannelService extends Reactive {
  @Reactive.property
  private _activeChannel: SlackChannel | undefined = undefined;
  private readonly channels: SlackChannel[] = [];

  constructor(
    private readonly service: SlackService,
    private readonly ws: WebSocket,
  ) {
    super();
  }

  private createChannel(channelID: string): SlackChannel {
    const channel = this.make(
      SlackChannel,
      this,
      this.service,
      this.ws,
      channelID,
    );
    this.channels.push(channel);
    return channel;
  }

  public getChannel(channelID: string): SlackChannel {
    const existingChannel = this.channels.find(
      (channel) => channel.channelID === channelID,
    );

    if (existingChannel) {
      return existingChannel;
    }

    return this.createChannel(channelID);
  }

  public selectChannel(channelID: string): void {
    const channel = this.getChannel(channelID);
    this._activeChannel = channel;
    PersistentSession.setLastActiveConversation(channelID);
  }

  public get activeChannel(): SlackChannel | undefined {
    return this._activeChannel;
  }
}
