import React from "react";
import { Align, Box } from "react-gjs-renderer";
import type { SlackMessage } from "../../../../services/slack-service/slack-service";
import { MessageEditor } from "../../../message-editor/message-editor";
import { MessageBox } from "./message";

export type ThreadProps = {};

export const Thread = (props: ThreadProps) => {
  // stub
  const messages: SlackMessage[] = [
    {
      id: "1",
      markdown: "Hello",
      timestamp: 1675869151440,
      username: "John Doe",
    },
    {
      id: "2",
      markdown: "Oh, hi!",
      timestamp: 1675869152440,
      username: "Jane Gondo",
    },
    {
      id: "3",
      markdown: "How are you?",
      timestamp: 1675869153440,
      username: "John Doe",
    },
  ];

  return (
    <Box margin={[0, 0, 10, 45]} expandHorizontal horizontalAlign={Align.FILL}>
      {messages.map((message) => (
        <MessageBox
          key={message.id}
          markdown={message.markdown}
          userID={message.userID}
          username={message.username}
          sentAt={message.timestamp}
          subThreadMessage
        />
      ))}
      <MessageEditor />
    </Box>
  );
};
