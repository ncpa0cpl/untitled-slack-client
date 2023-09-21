import Gio from "gi://Gio";
import React from "react";
import { BetterComponent, MapContext } from "react-better-components";
import {
  Align,
  Box,
  Label,
  Orientation,
  PositionType,
  ScrollBox,
  Spinner,
  WindowContext,
} from "react-gjs-renderer";
import type { ScrollBoxEvent } from "react-gjs-renderer/dist/gjs-elements/gtk3/scroll-box/scroll-box";
import type { WindowElement } from "react-gjs-renderer/dist/gjs-elements/rg-types";
import { ActiveConversation } from "../../../../quarks/slack/conversations";
import { SlackQuark } from "../../../../quarks/slack/slack-client";
import { UsersIndex } from "../../../../quarks/users-index";
import { SlackService } from "../../../../services/slack-service/slack-service";
import type {
  MessageBlock,
  MessageBlockRichText,
  MessageFile,
  SlackMessage,
} from "../../../../services/slack-service/slack-types";
import { $quark } from "../../../../utils/class-quark-hook";
import { Bound } from "../../../../utils/decorators/bound";
import { FontMod, FontSize } from "../../../font-size/font-size-context";
import { MessageEditor } from "../../../message-editor/message-editor";
import { ConversationHeader } from "./conversation-header";
import { MessageBox } from "./message";
import { UserTyping } from "./user-typing";

type WsHello = {
  type: "hello";
  fast_reconnect: boolean;
  region: string;
  start: boolean;
  host_id: string;
};

type WsUserTyping = {
  type: "user_typing";
  channel: string;
  id: number;
  user: string;
};

type MsgBlock = MessageBlockRichText;

type WsMessage = {
  type: "message";
  channel: string;
  text: string;
  blocks: Array<MsgBlock>;
  user: string;
  client_msg_id: string;
  team: string;
  source_team: string;
  user_team: string;
  suppress_notification: boolean;
  event_ts: string;
  ts: string;
};

type WsSlackNotification = WsHello | WsUserTyping | WsMessage;

type PostMessageResponse = {
  ok: boolean;
  channel: string;
  ts: string;
  message: {
    type: "message";
    text: string;
    user: string;
    ts: string;
    blocks: Array<MsgBlock>;
    team: string;
  };
};

export type SlackMessageGroup = {
  id: string;
  groups: Array<{
    id: string;
    contents?: MessageBlock[];
    files: MessageFile[];
    timestamp?: number;
  }>;
} & (
  | { userID: string; username?: undefined }
  | { userID?: undefined; username: string }
);

function sortMsgs(a: SlackMessage, b: SlackMessage) {
  return (a.timestamp ?? 0) - (b.timestamp ?? 0);
}

function selectCurrentWs(state: ReturnType<typeof SlackQuark.get>) {
  return state.workspaces.find((w) => w.team === state.activeWorkspace)?.socket;
}

// @ts-expect-error
@MapContext({ mainWindow: WindowContext })
export class ConversationBox extends BetterComponent {
  private declare mainWindow: WindowElement;

  private scrollBoxRef = React.createRef<Rg.Element.ScrollBoxElement | null>();
  private isFirstUserScroll = true;
  private lastPosFromBottom = 0;
  private loadingInProgress = false;

  private currentConversation = $quark(this, ActiveConversation);
  private ws = $quark(this, SlackQuark, selectCurrentWs);

  private isLoading = this.$state(false);
  private loadError = this.$state<Error | null>(null);
  private messages = this.$state<SlackMessageGroup[]>([]);
  private cursor = this.$state<string | undefined>(undefined);
  private usersTyping = this.$state<{ uid: string; ts: number }[]>([]);

  constructor(props: any) {
    super(props);

    this.$effect(() => {
      return this.connectWs();
    }, [this.currentConversation, this.ws]);

    this.$effect(() => {
      const timeouts = this.usersTyping.get().map((u) => {
        return setTimeout(() => {
          this.usersTyping.set((ut) => ut.filter((u2) => u2.uid !== u.uid));
        }, Math.max(0, 5000 - (Date.now() - u.ts)));
      });

      return () => {
        timeouts.forEach((t) => clearTimeout(t));
      };
    }, [this.usersTyping]);
  }

  private addNewMessage(msg: SlackMessage) {
    this.messages.set((current) => {
      const last = current.at(-1);

      if (last && last.userID === msg.userID) {
        return current.slice(0, -1).concat({
          ...last,
          groups: last.groups.concat(msg),
        });
      }

      return current.concat({
        userID: msg.userID,
        username: msg.username,
        id: msg.id,
        groups: [msg],
      } as SlackMessageGroup);
    });
  }

  private mapMessages(msgs: SlackMessage[]) {
    msgs.sort(sortMsgs);

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

  private connectWs() {
    try {
      this.loadMessages(undefined, true);
      this.isFirstUserScroll = true;
      const socket = this.ws.get();

      if (socket) {
        socket.addEventListener("message", this.onWsEvent);
        return () => socket.removeEventListener("message", this.onWsEvent);
      }
    } catch (err) {
      console.error(err);
    }
  }

  @Bound()
  private onWsEvent(e: MessageEvent) {
    const data = JSON.parse(e.data) as WsSlackNotification;

    switch (data.type) {
      case "message": {
        if (data.channel === this.currentConversation.get()?.id) {
          const msg: SlackMessage = {
            id: data.client_msg_id,
            contents: data.blocks,
            timestamp: Number(data.ts),
            userID: data.user,
            files: [],
          };

          this.usersTyping.set((current) =>
            current.filter((u) => u.uid !== data.user)
          );
          this.addNewMessage(msg);
        }

        setTimeout(() => {
          if (this.mainWindow.getWidget().is_active) return;

          const user = UsersIndex.get().users.find((u) => u.id === data.user);
          const notification = new Gio.Notification();
          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
          notification.set_title(
            "New message" + (user ? " from " + user.name : "")
          );
          notification.set_category("im.received");
          notification.set_priority(Gio.NotificationPriority.LOW);

          const notificationID = `slack-msg-${data.client_msg_id}`;
          Gio.Application.get_default()?.send_notification(
            notificationID,
            notification
          );

          setTimeout(() => {
            Gio.Application.get_default()?.withdraw_notification(
              notificationID
            );
          }, 10 * 1000);
        });

        break;
      }
      case "user_typing": {
        if (data.channel === this.currentConversation.get()?.id) {
          this.usersTyping.set((ut) =>
            ut
              .filter((u) => u.uid !== data.user)
              .concat({
                uid: data.user,
                ts: Date.now(),
              })
          );
        }
      }
    }
  }

  @Bound()
  private scrollHandler(e: ScrollBoxEvent) {
    if (this.loadingInProgress) {
      e.preventDefault();
    }

    this.isFirstUserScroll = false;

    if (this.scrollBoxRef.current) {
      this.lastPosFromBottom =
        this.scrollBoxRef.current.currentPosition("bottom");
    }
  }

  @Bound()
  private contentSizeChangeHandler() {
    const scrollBox = this.scrollBoxRef.current;
    if (!scrollBox) return;

    if (this.isFirstUserScroll) {
      scrollBox.scrollTo(0, "bottom");
    } else {
      scrollBox.scrollTo(this.lastPosFromBottom, "bottom");
    }
  }

  @Bound()
  private handleEdgeReached(
    e: ScrollBoxEvent<{
      position: PositionType;
    }>
  ) {
    if (e.position === PositionType.TOP) {
      this.loadMessages(this.cursor.get());
    }
  }

  private async loadMessages(nextCursor?: string, reset = false) {
    if (!this.currentConversation.get() || this.loadingInProgress) {
      return Promise.resolve();
    }

    this.loadingInProgress = true;

    this.isLoading.set(true);
    this.loadError.set(null);

    if (reset) {
      this.messages.set([]);
      this.cursor.set(undefined);
      this.isFirstUserScroll = true;
    }

    const service = SlackService.getService();

    if (service) {
      const result = await service.channels.fetchMessages(
        this.currentConversation.get()!.id,
        nextCursor
      );

      if (!result.ok) {
        this.loadError.set(result.error);
        this.isLoading.set(false);
        return;
      }

      let newMessages = this.mapMessages(result.value.messages);

      if (!reset) {
        newMessages = newMessages.concat(this.messages.get());
      } else {
        newMessages = newMessages.slice();
      }

      this.messages.set(newMessages);
      this.cursor.set(result.value.cursor);
      this.isLoading.set(false);
    }

    return new Promise<void>(async (resolve) => {
      setTimeout(() => {
        this.loadingInProgress = false;
        resolve();
      }, 100);
    });
  }

  @Bound()
  private async handleSend(text: string) {
    const channelID = this.currentConversation.get()?.id;
    const service = SlackService.getService();

    if (channelID && service) {
      await service.channels.sendMessage(channelID, text);
    }
  }

  public render() {
    return (
      <Box expand verticalAlign={Align.FILL} horizontalAlign={Align.FILL}>
        <ConversationHeader
          title={this.currentConversation.get()?.name ?? ""}
        />
        {this.isLoading.get() && (
          <Box
            expand={this.messages.get().length === 0}
            verticalAlign={Align.CENTER}
            horizontalAlign={Align.CENTER}
          >
            <Spinner margin={[15, 0]} />
          </Box>
        )}
        {this.messages.get().length > 0 && (
          <ScrollBox
            ref={this.scrollBoxRef}
            onScroll={this.scrollHandler}
            onContentSizeChange={this.contentSizeChangeHandler}
            onEdgeReached={this.handleEdgeReached}
            expand
            verticalAlign={Align.FILL}
            horizontalAlign={Align.FILL}
          >
            <Box
              expand
              orientation={Orientation.VERTICAL}
              margin={[0, 0, 15]}
              verticalAlign={this.isLoading.get() ? Align.CENTER : Align.END}
              horizontalAlign={Align.FILL}
            >
              {this.loadError.get() ? (
                <Label
                  verticalAlign={Align.CENTER}
                  horizontalAlign={Align.CENTER}
                >
                  Failed to load the conversation's messages.
                </Label>
              ) : (
                this.messages
                  .get()
                  .map((message) => (
                    <MessageBox
                      key={message.id}
                      userID={message.userID}
                      username={message.username}
                      groups={message.groups}
                    />
                  ))
              )}
            </Box>
          </ScrollBox>
        )}
        <Box
          expand={this.messages.get().length === 0}
          horizontalAlign={Align.FILL}
          verticalAlign={Align.END}
          margin={[5, 15, 5]}
        >
          <MessageEditor onSend={this.handleSend} />
          <Box
            heightRequest={18}
            horizontalAlign={Align.START}
            orientation={Orientation.HORIZONTAL}
            margin={[5, 0, 0, 0]}
          >
            <FontSize size={FontMod.shrink.by30}>
              {this.usersTyping.get().map((u) => (
                <UserTyping key={u.ts.toString()} userID={u.uid} />
              ))}
            </FontSize>
          </Box>
        </Box>
      </Box>
    );
  }
}
