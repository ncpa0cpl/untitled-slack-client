import { Conversations } from "../../../quarks/slack/conversations";
import { Bound } from "../../../utils/decorators/bound";
import { Reactive } from "../../../utils/reactive";
import type { AsyncResult } from "../../../utils/result";
import { err, ok } from "../../../utils/result";
import type { SlackService } from "../../slack-service/slack-service";
import type { SlackMessage } from "../../slack-service/slack-types";
import type { SlackChannelService } from "../channels-service";
import type {
  SlackMessageGroup,
  UserTypingInfo,
  WsSlackNotification,
} from "./channel-types";

function msgCompare(a: SlackMessage, b: SlackMessage) {
  return (a.timestamp ?? 0) - (b.timestamp ?? 0);
}

export class SlackChannel extends Reactive {
  private static mapMessages(msgs: SlackMessage[]): SlackMessageGroup[] {
    msgs.sort(msgCompare);

    const groups: SlackMessageGroup[] = [];

    for (let i = 0; i < msgs.length; i++) {
      const message = msgs[i]!;
      const lastMsg = groups.at(-1);

      if (lastMsg?.userID === message?.userID) {
        lastMsg!.groups.push(message);
      } else {
        const g: SlackMessageGroup = {
          id: message.id,
          userID: message.userID,
          username: message.username,
          groups: [message],
        } as SlackMessageGroup;
        groups.push(g);
      }
    }

    return groups;
  }

  @Reactive.property
  private _messageGroups: SlackMessageGroup[] = [];
  @Reactive.property
  private _usersTyping: UserTypingInfo[] = [];
  @Reactive.property
  private _isLoading = false;
  private cursor?: string;

  private interval: NodeJS.Timeout | null = null;
  private activeChannelSub;
  public readonly conversationInfo;

  constructor(
    private readonly channelService: SlackChannelService,
    private readonly service: SlackService,
    private readonly ws: WebSocket,
    public readonly channelID: string,
  ) {
    super();

    this.loadMessages(undefined, true);
    this.ws.addEventListener("message", this.onWsEvent);

    let prevActive = this.channelService.activeChannel;
    this.activeChannelSub = this.channelService.on("changed", () => {
      if (prevActive !== this.channelService.activeChannel) {
        this.onActiveChannelChange(this.channelService.activeChannel);
        prevActive = this.channelService.activeChannel;
      }
    });

    this.interval = setInterval(() => this.flushUserTypings(), 1000);

    this.conversationInfo = Conversations.get().conversations.find(
      (c) => c.id === channelID,
    );
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
            this.updateMessage(msg);
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

            this._usersTyping = this._usersTyping.filter(
              (u) => u.uid !== data.user,
            );

            this.addNewMessage(msg);

            break;
          }
        }
        break;
      }
      case "user_typing": {
        this._usersTyping = this._usersTyping
          .filter((u) => u.uid !== data.user)
          .concat({
            uid: data.user,
            ts: Date.now(),
          });
        break;
      }
    }
  }

  @Bound()
  private onActiveChannelChange(active?: SlackChannel): void {
    if (active?.channelID !== this.channelID) {
      this._usersTyping = [];
      clearInterval(this.interval!);
      this.interval = null;
    } else if (this.interval == null) {
      this.interval = setInterval(() => this.flushUserTypings(), 1000);
    }
  }

  private flushUserTypings() {
    if (this._usersTyping.length > 0) {
      this._usersTyping = this._usersTyping.filter(
        (u) => Date.now() - u.ts < 5000,
      );
    }
  }

  private addNewMessage(msg: SlackMessage): void {
    const last = this._messageGroups.at(-1);

    if (last && last.userID === msg.userID) {
      this._messageGroups = this._messageGroups.slice(0, -1).concat({
        ...last,
        groups: last.groups.concat(msg),
      });
    }

    this._messageGroups = this._messageGroups.concat({
      userID: msg.userID,
      username: msg.username,
      id: msg.id,
      groups: [msg],
    } as SlackMessageGroup);
  }

  private updateMessage(msg: SlackMessage): void {
    const groups = this._messageGroups;

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i]!;
      const index = group.groups.findIndex((g) => g.id === msg.id);

      if (index !== -1) {
        const newGroup = { ...group, groups: group.groups.slice() };
        newGroup.groups[index] = msg;
        newGroup.groups[index]!.edited = true;
        const newState = groups.map((g) => (g.id === group.id ? newGroup : g));
        this._messageGroups = newState;
        return;
      }
    }
  }

  private async loadMessages(nextCursor?: string, reset = false): AsyncResult {
    if (this._isLoading) {
      return err(new Error("Message fetching is already in progress"));
    }

    this._isLoading = true;
    // using _ = defer(() => {
    //   this.isLoading = false;
    // });
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
        newMessages = newMessages.concat(this._messageGroups);
      } else {
        newMessages = newMessages.slice();
      }

      this._messageGroups = newMessages;
      this.cursor = result.value.cursor;

      return ok();
    } finally {
      this._isLoading = false;
    }
  }

  public async loadMore(): AsyncResult {
    return this.loadMessages(this.cursor);
  }

  public get isLoading(): boolean {
    return this._isLoading;
  }

  public get messages(): ReadonlyArray<SlackMessageGroup> {
    return this._messageGroups;
  }

  public get usersTyping(): ReadonlyArray<UserTypingInfo> {
    return this._usersTyping;
  }

  public dispose(): void {
    this.ws.removeEventListener("message", this.onWsEvent);
    this.activeChannelSub();
    clearInterval(this.interval!);
  }
}
