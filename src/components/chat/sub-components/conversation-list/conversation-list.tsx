import React from "react";
import { Align, Box, ScrollBox } from "react-gjs-renderer";
import {
  ActiveConversation,
  Conversations,
} from "../../../../quarks/conversations";
import { ConvListButton } from "./conv-list-button";

export const ConversationList = () => {
  const groupChannels = Conversations.useGroupChannels();
  const privateChannels = Conversations.usePrivateChannels();
  const activeConversation = ActiveConversation.use();

  return (
    <ScrollBox
      expandVertical
      minWidth={325}
      maxWidth={325}
      verticalAlign={Align.FILL}
      horizontalAlign={Align.START}
      style={{
        background: "rgba(128, 128, 128, 0.1)",
      }}
    >
      <Box expandHorizontal horizontalAlign={Align.FILL}>
        {privateChannels.map((channel) => (
          <ConvListButton
            key={channel.id}
            label={channel.name}
            isActive={activeConversation.value?.id === channel.id}
            onClick={() => {
              activeConversation.set(channel);
            }}
          />
        ))}
        {groupChannels.map((channel) => (
          <ConvListButton
            key={channel.id}
            label={channel.name}
            isActive={activeConversation.value?.id === channel.id}
            onClick={() => {
              activeConversation.set(channel);
            }}
          />
        ))}
      </Box>
    </ScrollBox>
  );
};
