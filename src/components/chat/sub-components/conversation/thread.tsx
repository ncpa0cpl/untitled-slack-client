import React from "react";
import { Align, Box } from "react-gjs-renderer";
import type {
  MessageBlockRichText,
  SlackMessage,
} from "../../../../services/slack-service/slack-service";
import { MessageEditor } from "../../../message-editor/message-editor";
import { MessageBox } from "./message";

export type ThreadProps = {};

const textMock = (text: string): MessageBlockRichText[] => {
  return [
    {
      type: "rich_text",
      block_id: "",
      elements: [
        {
          type: "rich_text_section",
          elements: [
            {
              type: "text",
              text,
            },
          ],
        },
      ],
    },
  ];
};

export const Thread = (props: ThreadProps) => {
  // stub
  const messages: SlackMessage[] = [
    {
      id: "1",
      contents: textMock("Hello"),
      timestamp: 1675869151440,
      username: "John Doe",
      files: [],
    },
    {
      id: "2",
      contents: textMock("Oh, hi!"),
      timestamp: 1675869152440,
      username: "Jane Gondo",
      files: [],
    },
    {
      id: "3",
      contents: textMock("How are you?"),
      timestamp: 1675869153440,
      username: "John Doe",
      files: [],
    },
  ];

  return (
    <Box margin={[0, 0, 10, 45]} expandHorizontal horizontalAlign={Align.FILL}>
      {messages.map((message) => (
        <MessageBox
          key={message.id}
          contents={message.contents}
          userID={message.userID}
          username={message.username}
          sentAt={message.timestamp}
          files={message.files}
          subThreadMessage
        />
      ))}
      <MessageEditor />
    </Box>
  );
};
