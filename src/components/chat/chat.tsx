import React from "react";
import { Align, Orientation, Paned } from "react-gjs-renderer";
import { SlackQuark } from "../../quarks/slack/slack-client";
import { UserQuark } from "../../quarks/user";
import { SlackService } from "../../services/slack-service/slack-service";
import { ConversationList } from "./sub-components/conversation-list/conversation-list";
import { ConversationBox } from "./sub-components/conversation/conversation";

export const Chat = () => {
  const currentUser = UserQuark.use();
  const slackClient = SlackQuark.use();

  React.useEffect(() => {
    const service = SlackService.getService();
    if (!service) return;

    service.channels
      .getAllConversations()
      .then(() => service.channels.getConversationsInfo())
      .catch(console.error);
  }, [slackClient.value.activeWorkspace]);

  if (!currentUser.value.loggedIn) {
    return null;
  }

  return (
    <Paned
      expand
      verticalAlign={Align.FILL}
      horizontalAlign={Align.FILL}
      orientation={Orientation.HORIZONTAL}
    >
      <ConversationList />
      <ConversationBox />
    </Paned>
  );
};
