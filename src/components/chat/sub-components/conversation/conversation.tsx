import React from "react";
import { BetterComponent } from "react-better-components";
import {
  Align,
  Box,
  Label,
  Orientation,
  PositionType,
  ScrollBox,
  Spinner,
} from "react-gjs-renderer";
import type { ScrollBoxEvent } from "react-gjs-renderer/dist/gjs-elements/gtk3/scroll-box/scroll-box";
import { ActiveConversation } from "../../../../quarks/slack/conversations";
import { SlackClient } from "../../../../quarks/slack/slack-client";
import type {
  MessageBlockRichText,
  SlackMessage,
} from "../../../../services/slack-service/slack-service";
import { SlackService } from "../../../../services/slack-service/slack-service";
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

function sortMsgs(a: SlackMessage, b: SlackMessage) {
  return (a.timestamp ?? 0) - (b.timestamp ?? 0);
}

export class ConversationBox extends BetterComponent {
  private scrollBoxRef = React.createRef<Rg.Element.ScrollBoxElement | null>();
  private isFirstUserScroll = true;
  private lastPosFromBottom = 0;
  private loadingInProgress = false;
  private ws: WebSocket | null = null;

  private currentConversation = $quark(this, ActiveConversation);
  private slackClient = $quark(this, SlackClient, (s) => s.client);

  private isLoading = this.$state(false);
  private loadError = this.$state<any>(null);
  private messages = this.$state<SlackMessage[]>([]);
  private cursor = this.$state<string | undefined>(undefined);
  private usersTyping = this.$state<{ uid: string; ts: number }[]>([]);

  constructor(props: any) {
    super(props);

    this.$effect(() => {
      this.connectWs();
    }, [this.currentConversation, this.slackClient]);

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

  private async connectWs() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.slackClient.get()) {
      try {
        await this.loadMessages(undefined, true);

        this.isFirstUserScroll = true;

        const context = await this.slackClient.get()?.rtm.connect();

        if (context && context.ok) {
          this.ws = new WebSocket(context!.url!);
          this.ws.onmessage = this.onWsEvent;
        }
      } catch (err) {
        console.error(err);
      }
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

          const ut = this.usersTyping.get();
          if (!ut.some((u) => u.uid === data.user)) {
            this.usersTyping.set(ut.filter((u) => u.uid !== data.user));
          }
          this.messages.set(this.messages.get().concat(msg));
        }
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

    try {
      const response = await SlackService.channels.fetchMessages(
        this.currentConversation.get()!.id,
        nextCursor
      );

      let newMessages = response.messages;

      if (!reset) {
        newMessages = newMessages.concat(this.messages.get());
      } else {
        newMessages = newMessages.slice();
      }

      newMessages.sort(sortMsgs);

      this.messages.set(newMessages);
      this.cursor.set(response.cursor);
    } catch (err) {
      this.loadError.set(err);
    } finally {
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
    console.log(text);
    const channelID = this.currentConversation.get()?.id;
    const client = this.slackClient.get();

    if (channelID && client) {
      const response = await client.chat.postMessage({
        channel: channelID,
        mrkdwn: true,
        text,
        as_user: true,
      });

      console.log(response);
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
                  .map((message, i) => (
                    <MessageBox
                      key={message.id}
                      contents={message.contents}
                      userID={message.userID}
                      username={message.username}
                      sentAt={message.timestamp}
                      files={message.files}
                      subthread={
                        i === this.messages.get().length - 1
                          ? [{} as any]
                          : undefined
                      }
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
            heightRequest={16}
            horizontalAlign={Align.START}
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
