import React from "react";
import { Align, Box } from "react-gjs-renderer";
import type { SlackMessage } from "../../../../services/slack-service/slack-types";
import { MessageEditor } from "../../../message-editor/message-editor";

export type ThreadProps = {
  messages: SlackMessage[];
};

// const textMock = (text: string): MessageBlockRichText[] => {
//   return [
//     {
//       type: "rich_text",
//       block_id: "",
//       elements: [
//         {
//           type: "rich_text_section",
//           elements: [
//             {
//               type: "text",
//               text,
//             },
//           ],
//         },
//       ],
//     },
//   ];
// };

export const Thread = (_: ThreadProps) => {
  // stub
  // const messages: SlackMessage[] = [
  //   {
  //     id: "1",
  //     contents: textMock("Hello"),
  //     timestamp: 1675869151440,
  //     username: "John Doe",
  //     files: [],
  //   },
  //   {
  //     id: "2",
  //     contents: textMock("Oh, hi!"),
  //     timestamp: 1675869152440,
  //     username: "Jane Gondo",
  //     files: [],
  //   },
  //   {
  //     id: "3",
  //     contents: textMock("How are you?"),
  //     timestamp: 1675869153440,
  //     username: "John Doe",
  //     files: [],
  //   },
  // ];

  return (
    <Box
      margin={[0, 0, 10, 45]}
      expandHorizontal
      horizontalAlign={Align.FILL}
    >
      {/* {props.messages.map((message) => (
        <MessageBox
          key={message.id}
          groups={message.contents}
          userID={message.userID}
          username={message.username}
          sentAt={message.timestamp}
          files={message.files}
          subThreadMessage
        />
      ))} */}
      <MessageEditor />
    </Box>
  );
};
