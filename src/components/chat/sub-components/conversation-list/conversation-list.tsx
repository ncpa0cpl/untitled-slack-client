import React from "react";
import { Align, Box, ScrollBox, Separator } from "react-gjs-renderer";
import type { ConversationChannel } from "../../../../quarks/slack/conversations";
import {
  ActiveConversation,
  Conversations,
} from "../../../../quarks/slack/conversations";
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
            ActiveConversation.set(channel);
          }}
        />
      ))}
    </>
  );
};

export const ConversationList = () => {
  const activeConversation = ActiveConversation.use();

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
        <Box expandHorizontal horizontalAlign={Align.FILL}>
          <List
            activeConvID={activeConversation.value?.id ?? ""}
            useConversations={Conversations.useActiveDirectConversations}
          />
          <Separator margin={[5, 0]} />
          <List
            activeConvID={activeConversation.value?.id ?? ""}
            useConversations={Conversations.useActiveGroupConversations}
          />
          <Separator margin={[5, 0]} />
          <List
            activeConvID={activeConversation.value?.id ?? ""}
            useConversations={Conversations.useActivePrivateConversations}
          />
        </Box>
      </ScrollBox>
    </Box>
  );
};
