import React from "react";
import { Align, Box, ScrollBox, Separator } from "react-gjs-renderer";
import {
  ConversationType,
  SlackQuark,
} from "../../../../quarks/slack/slack-quark";
import { Component } from "../../../../utils/custom-component";
import { ConvListButton } from "./conv-list-button";

const List = (props: {
  activeChannelID: string;
  conversations: "private" | "group" | "direct";
}) => {
  const workspace = SlackQuark.useActiveWorkspace();
  const channels = React.useMemo(
    () =>
      workspace?.channels.filter((channel) => {
        switch (props.conversations) {
          case "private":
            return channel.info.type === ConversationType.PrivateGroup;
          case "group":
            return (
              channel.info.type === ConversationType.Group ||
              channel.info.type === ConversationType.DirectGroup
            );
          case "direct":
            return channel.info.type === ConversationType.Direct;
          default:
            return false;
        }
      }) ?? [],
    [workspace, props.conversations],
  );

  return (
    <>
      {channels.map((channel) => (
        <ConvListButton
          key={channel.channelID}
          label={channel.info.name}
          unreadCount={channel.info.unreadCount}
          isActive={props.activeChannelID === channel.channelID}
          onClick={() => {
            SlackQuark.openChannel(workspace!.workspaceID, channel.channelID);
          }}
        />
      ))}
    </>
  );
};

export class ConversationList extends Component {
  private slackData = this.$quark(SlackQuark);

  render() {
    const [, activeChannelID = ""] = this.slackData.get().activeChannel ?? [];

    return (
      <Box
        cpt:shrink={false}
        expand
        widthRequest={325}
        verticalAlign={Align.FILL}
        horizontalAlign={Align.FILL}
      >
        <ScrollBox
          expandVertical
          expandHorizontal
          useChildWidth
          verticalAlign={Align.FILL}
          horizontalAlign={Align.FILL}
          style={{
            background: "rgba(128, 128, 128, 0.1)",
          }}
        >
          <Box
            expandHorizontal
            horizontalAlign={Align.FILL}
          >
            <List
              activeChannelID={activeChannelID}
              conversations="direct"
            />
            <Separator
              margin={[3, 3]}
              style={{ borderTopWidth: 1, borderTopColor: "white" }}
            />
            <List
              activeChannelID={activeChannelID}
              conversations="group"
            />
            <Separator
              margin={[3, 3]}
              style={{ borderTopWidth: 1, borderTopColor: "white" }}
            />
            <List
              activeChannelID={activeChannelID}
              conversations="private"
            />
          </Box>
        </ScrollBox>
      </Box>
    );
  }
}
