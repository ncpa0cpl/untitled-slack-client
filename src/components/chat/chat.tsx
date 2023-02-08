import React from "react";
import { Align, Box, Orientation } from "react-gjs-renderer";
import { SlackClient } from "../../quarks/slack-client";
import { SlackUser } from "../../quarks/user";
import { SlackService } from "../../services/slack-service/slack-service";
import { ConversationList } from "./sub-components/conversation-list/conversation-list";
import { ConversationBox } from "./sub-components/conversation/conversation";

export const Chat = () => {
  const currentUser = SlackUser.use();
  const slackClient = SlackClient.use();

  React.useEffect(() => {
    if (!slackClient.value.client) return;

    SlackService.loadConversations();
  }, [slackClient.value.client]);

  if (!currentUser.value.loggedIn) {
    return null;
  }

  return (
    <Box
      expand
      verticalAlign={Align.FILL}
      horizontalAlign={Align.FILL}
      orientation={Orientation.HORIZONTAL}
    >
      <ConversationList />
      <ConversationBox />
    </Box>
  );
};
