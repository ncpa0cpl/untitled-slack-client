import Gio from "gi://Gio";
import React from "react";
import { MapContext } from "react-better-components";
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
import { $ChannelService } from "../../../../comp-modules/channel-service";
import { UsersIndex } from "../../../../quarks/users-index";
import type { WsEventMessage } from "../../../../services/channel-service/channel/channel-types";
import { SlackService } from "../../../../services/slack-service/slack-service";
import type {
  MessageBlock,
  MessageFile,
} from "../../../../services/slack-service/slack-types";
import { Component } from "../../../../utils/custom-component";
import { Bound } from "../../../../utils/decorators/bound";
import { FontMod, FontSize } from "../../../font-size/font-size-context";
import { MessageEditor } from "../../../message-editor/message-editor";
import { ConversationHeader } from "./conversation-header";
import { MessageBox } from "./message";
import { UserTyping } from "./user-typing";

export type SlackMessageGroup = {
  id: string;
  groups: Array<{
    id: string;
    contents?: MessageBlock[];
    files: MessageFile[];
    timestamp?: number;
    edited?: true;
  }>;
} & (
  | { userID: string; username?: undefined }
  | { userID?: undefined; username: string }
);

// @ts-expect-error
@MapContext({ mainWindow: WindowContext })
export class ConversationBox extends Component {
  private declare mainWindow: WindowElement;

  private channelService = this.$mod($ChannelService);
  private scrollBoxRef = React.createRef<Rg.Element.ScrollBoxElement | null>();
  private isFirstUserScroll = true;
  private lastPosFromBottom = 0;
  private loadingInProgress = false;

  private loadError = this.$state<Error | null>(null);

  private get activeChannel() {
    return this.channelService.get()?.activeChannel;
  }

  private get isLoading() {
    return this.activeChannel?.isLoading;
  }

  private get messages() {
    return this.activeChannel?.messages;
  }

  private get userTyping() {
    return this.activeChannel?.usersTyping;
  }

  constructor(props: any) {
    super(props);
  }

  private displayNotification(data: WsEventMessage) {
    setTimeout(() => {
      if (this.mainWindow.getWidget().is_active) return;

      const user = UsersIndex.get().users.find((u) => u.id === data.user);
      const notification = new Gio.Notification();
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      notification.set_title(
        "New message" + (user ? " from " + user.name : ""),
      );
      notification.set_category("im.received");
      notification.set_priority(Gio.NotificationPriority.LOW);

      const notificationID = `slack-msg-${data.client_msg_id}`;
      Gio.Application.get_default()?.send_notification(
        notificationID,
        notification,
      );

      setTimeout(() => {
        Gio.Application.get_default()?.withdraw_notification(notificationID);
      }, 10 * 1000);
    });
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
    }>,
  ) {
    if (e.position === PositionType.TOP) {
      this.loadMore();
    }
  }

  private async loadMore(nextCursor?: string, reset = false) {
    if (this.loadingInProgress) {
      return Promise.resolve();
    }

    this.loadingInProgress = true;

    this.loadError.set(null);

    if (reset) {
      this.isFirstUserScroll = true;
    }

    const res = await this.activeChannel?.loadMore();

    if (res && !res.ok) {
      this.loadError.set(res.error);
    }

    this.loadingInProgress = false;

    // return new Promise<void>(async (resolve) => {
    //   setTimeout(() => {
    //     this.loadingInProgress = false;
    //     resolve();
    //   }, 100);
    // });
  }

  @Bound()
  private async handleSend(text: string) {
    const channelID = this.activeChannel?.channelID;
    const service = SlackService.getService();

    if (channelID && service) {
      await service.channels.sendMessage(channelID, text);
    }
  }

  public render() {
    if (this.messages == null) return <Box></Box>;

    return (
      <Box
        expand
        verticalAlign={Align.FILL}
        horizontalAlign={Align.FILL}
      >
        <ConversationHeader
          title={this.activeChannel?.conversationInfo?.name ?? ""}
        />
        {this.isLoading && (
          <Box
            expand={this.messages.length === 0}
            verticalAlign={Align.CENTER}
            horizontalAlign={Align.CENTER}
          >
            <Spinner margin={[15, 0]} />
          </Box>
        )}
        {this.messages.length > 0 && (
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
              verticalAlign={this.isLoading ? Align.CENTER : Align.END}
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
                this.messages.map((message) => (
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
          expand={this.messages.length === 0}
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
              {this.userTyping?.map((u) => (
                <UserTyping
                  key={u.ts.toString()}
                  userID={u.uid}
                />
              ))}
            </FontSize>
          </Box>
        </Box>
      </Box>
    );
  }
}
