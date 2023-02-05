import React from "react";
import { Align, Box, ScrollBox } from "react-gjs-renderer";
import {
  ActiveConversation,
  Conversations,
} from "../../../../quarks/conversations";
import { ConvListButton } from "./conv-list-button";

export const ConversationList = () => {
  const groupChannels = Conversations.useActiveGroupChannels();
  const activeConversation = ActiveConversation.use();

  return (
    <ScrollBox
      expandVertical
      minWidth={300}
      maxWidth={300}
      verticalAlign={Align.FILL}
      horizontalAlign={Align.START}
      style={{
        background: "rgba(128, 128, 128, 0.1)",
      }}
    >
      <Box expandHorizontal horizontalAlign={Align.FILL}>
        {groupChannels.map((channel) => (
          <ConvListButton
            key={channel.id}
            label={channel.name}
            isActive={activeConversation.value === channel.id}
            onClick={() => {
              activeConversation.set(channel.id);
            }}
          />
        ))}
      </Box>
    </ScrollBox>
  );
};
