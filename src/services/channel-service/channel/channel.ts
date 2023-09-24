import type {
  ChannelData,
  MessageToAdd,
} from "../../../quarks/slack/slack-quark";
import { SlackQuark } from "../../../quarks/slack/slack-quark";
import { Bound } from "../../../utils/decorators/bound";
import type { AsyncResult } from "../../../utils/result";
import { err, ok } from "../../../utils/result";
import type { SlackService } from "../../slack-service/slack-service";
import type { SlackMessage } from "../../slack-service/slack-types";
import type { SlackChannelService } from "../channels-service";
import type {
  SlackMessageGroup,
  SlackMessageGroupEntry,
  WsSlackNotification,
} from "./channel-types";

function msgCompare(a: SlackMessage, b: SlackMessage) {
  return (a.timestamp ?? 0) - (b.timestamp ?? 0);
}

export class SlackChannel {
  private static mapMessages(msgs: SlackMessage[]): SlackMessageGroup[] {
    msgs.sort(msgCompare);

    const groups: SlackMessageGroup[] = [];

    for (let i = 0; i < msgs.length; i++) {
      const message = msgs[i]!;
      const lastMsg = groups.at(-1);

      if (lastMsg?.userID === message?.userID) {
        lastMsg!.entries.push(message);
      } else {
        const g: SlackMessageGroup = {
          id: message.id,
          userID: message.userID,
          username: message.username,
          entries: [message],
        } as SlackMessageGroup;
        groups.push(g);
      }
    }

    return groups;
  }

  constructor(
    private readonly channelService: SlackChannelService,
    private readonly service: SlackService,
    private readonly ws: WebSocket,
    public readonly workspaceID: string,
    public readonly channelID: string,
  ) {
    this.loadMessages(undefined, true);
    this.ws.addEventListener("message", this.onWsEvent);

    // let prevActive = this.channelService.activeChannel;
    // this.activeChannelSub = this.channelService.on("changed", () => {
    //   if (prevActive !== this.channelService.activeChannel) {
    //     this.onActiveChannelChange(this.channelService.activeChannel);
    //     prevActive = this.channelService.activeChannel;
    //   }
    // });

    // this.interval = setInterval(() => this.flushUserTypings(), 1000);

    // this.conversationInfo = Conversations.get().conversations.find(
    //   (c) => c.id === channelID,
    // );
  }

  @Bound()
  private onWsEvent(e: MessageEvent): void {
    const data = JSON.parse(e.data) as WsSlackNotification;

    if (this.channelID !== data.channel) {
      return;
    }

    switch (data.type) {
      case "message": {
        switch (data.subtype) {
          case "message_changed": {
            const msg: SlackMessage = {
              id: data.message.client_msg_id,
              contents: data.message.blocks,
              timestamp: Number(data.message.ts),
              userID: data.message.user,
              files: data.message.files ?? [],
            };
            this.handleMessageChanged(msg);
            break;
          }
          default: {
            const msg: SlackMessage = {
              id: data.client_msg_id,
              contents: data.blocks,
              timestamp: Number(data.ts),
              userID: data.user,
              files: data.files ?? [],
            };
            this.storeRemoveUserTyping(data.user);
            this.addNewMessage(msg);
            break;
          }
        }
        break;
      }
      case "user_typing": {
        this.storeAddUserTyping(data.user);
        setTimeout(() => this.storeClearUserTyping(), 5000);
        break;
      }
    }
  }

  private getChannelData(): ChannelData {
    const channel = SlackQuark.selectChannel(this.workspaceID, this.channelID);

    if (!channel) {
      throw new Error("Channel not found");
    }

    return channel;
  }

  private storeUpdateChannel(
    update: Partial<Omit<ChannelData, "info" | "channelID">>,
  ): void {
    SlackQuark.updateChannel(this.workspaceID, this.channelID, update);
  }

  private storeUpdateMessage(
    messageID: string,
    update: (prev: SlackMessageGroupEntry) => SlackMessageGroupEntry,
  ): void {
    SlackQuark.updateMessage(
      this.workspaceID,
      this.channelID,
      messageID,
      update,
    );
  }

  private storeAddMessage(msg: MessageToAdd) {
    SlackQuark.addMessage(this.workspaceID, this.channelID, msg);
  }

  private storeAddUserTyping(userID: string) {
    const channel = this.getChannelData();
    this.storeUpdateChannel({
      userTyping: channel.userTyping
        .filter((u) => u.uid !== userID)
        .concat({
          uid: userID,
          ts: Date.now(),
        }),
    });
  }

  private storeRemoveUserTyping(userID: string) {
    const channel = this.getChannelData();
    this.storeUpdateChannel({
      userTyping: channel.userTyping.filter((u) => u.uid !== userID),
    });
  }

  private storeClearUserTyping() {
    const channel = this.getChannelData();
    const now = Date.now();
    this.storeUpdateChannel({
      userTyping: channel.userTyping.filter((u) => {
        return now - u.ts < 5000;
      }),
    });
  }

  private addNewMessage(msg: SlackMessage): void {
    this.storeAddMessage(msg);
  }

  private handleMessageChanged(msg: SlackMessage): void {
    this.storeUpdateMessage(msg.id, (prev) => {
      return {
        id: prev.id,
        timestamp: prev.timestamp,
        contents: msg.contents,
        files: msg.files,
        edited: true,
      };
    });
  }

  private async loadMessages(nextCursor?: string, reset = false): AsyncResult {
    const channel = this.getChannelData();

    if (channel.isLoading) {
      return err(new Error("Message fetching is already in progress"));
    }

    this.storeUpdateChannel({ isLoading: true });

    try {
      const result = await this.service.channels.fetchMessages(
        this.channelID,
        nextCursor,
      );

      if (!result.ok) {
        return result;
      }

      let newMessages = SlackChannel.mapMessages(result.value.messages);

      if (!reset) {
        newMessages = newMessages.concat(channel.messages);
      } else {
        newMessages = newMessages.slice();
      }

      this.storeUpdateChannel({
        cursor: result.value.cursor,
        messages: newMessages,
        isLoading: false,
      });

      return ok();
    } catch (e) {
      this.storeUpdateChannel({ isLoading: false });
      throw e;
    }
  }

  public async loadMore(): AsyncResult {
    const channel = this.getChannelData();
    return this.loadMessages(channel.cursor);
  }

  public dispose(): void {
    this.ws.removeEventListener("message", this.onWsEvent);
  }
}
