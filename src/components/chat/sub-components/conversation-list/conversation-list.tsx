import React from "react";
import { Align, Box, ScrollBox, Separator } from "react-gjs-renderer";
import { $ChannelService } from "../../../../comp-modules/channel-service";
import type { ConversationChannel } from "../../../../quarks/slack/conversations";
import {
  ActiveSlackChannelService,
  Conversations,
} from "../../../../quarks/slack/conversations";
import { Component } from "../../../../utils/custom-component";
import { ConvListButton } from "./conv-list-button";

const List = (props: {
  activeConvID: string;
  useConversations: () => ConversationChannel[];
}) => {
  const channels = props.useConversations();

  return (
    <>
      {channels.map((channel) => (
        <ConvListButton
          key={channel.id}
          label={channel.name}
          unreadCount={channel.unreadCount}
          isActive={props.activeConvID === channel.id}
          onClick={() => {
            const { service } = ActiveSlackChannelService.get();
            service?.selectChannel(channel.id);
          }}
        />
      ))}
    </>
  );
};

export class ConversationList extends Component {
  private channelService = this.$mod($ChannelService);
  private get activeChannel() {
    return this.channelService.get()?.activeChannel;
  }

  render() {
    const activeChannelID = this.activeChannel?.channelID ?? "";

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
              activeConvID={activeChannelID}
              useConversations={Conversations.useActiveDirectConversations}
            />
            <Separator margin={[5, 0]} />
            <List
              activeConvID={activeChannelID}
              useConversations={Conversations.useActiveGroupConversations}
            />
            <Separator margin={[5, 0]} />
            <List
              activeConvID={activeChannelID}
              useConversations={Conversations.useActivePrivateConversations}
            />
          </Box>
        </ScrollBox>
      </Box>
    );
  }
}
