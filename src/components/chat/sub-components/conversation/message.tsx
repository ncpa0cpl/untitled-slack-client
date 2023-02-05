import type { Node as MdNode } from "markdown-ast";
import React from "react";
import { Align, Box, Justification, Markup, Span } from "react-gjs-renderer";
import { useSlackMarkdown } from "../../../../hooks/use-slack-markdown";
import { FontSettings } from "../../../../quarks/settings/font-size";
import { UsersIndex } from "../../../../quarks/users-index";
import { SlackService } from "../../../../services/slack-service/slack-service";

type MessageBoxProps = {
  markdown?: string;
  userID?: string;
  username?: string;
};

type NodeType = MdNode["type"];

export const MessageBox = (props: MessageBoxProps) => {
  const userInfo = UsersIndex.useUser(props.userID);
  const mdNodes = useSlackMarkdown(props.markdown ?? "");
  const font = FontSettings.use();

  const renderNode = React.useCallback((node: MdNode, key: string) => {
    switch (node.type) {
      case "text":
        return <Span key={key}>{node.text}</Span>;
      case "bold":
        return (
          <Span key={key} fontWeight="bold">
            {node.block.map((subNode, i) => renderNode(subNode, i.toString()))}
          </Span>
        );
      case "italic":
        return (
          <Span key={key} fontStyle="italic">
            {node.block.map((subNode, i) => renderNode(subNode, i.toString()))}
          </Span>
        );
      case "strike":
        return (
          <Span key={key} textDecoration="line-through">
            {node.block.map((subNode, i) => renderNode(subNode, i.toString()))}
          </Span>
        );
      case "code":
        return (
          <Span key={key} fontFamily="monospace">
            {node.block.map((subNode, i) => renderNode(subNode, i.toString()))}
          </Span>
        );
      case "link":
        return (
          <Span key={key} color="#326aed" textDecoration="underline">
            {node.block.map((subNode, i) => renderNode(subNode, i.toString()))}
          </Span>
        );
    }
  }, []);

  React.useEffect(() => {
    if (!userInfo && props.userID) {
      SlackService.loadUserInfo(props.userID);
    }
  }, [userInfo]);

  return (
    <Box
      style={{
        background: "rgba(128, 128, 128, 0.1)",
        borderRadius: 10,
      }}
      margin={[5, 15]}
      verticalAlign={Align.END}
      horizontalAlign={Align.FILL}
    >
      <Box
        margin={[10, 10, 5]}
        verticalAlign={Align.END}
        horizontalAlign={Align.FILL}
      >
        <Markup horizontalAlign={Align.START} justify={Justification.LEFT}>
          <Span fontWeight={"bold"} fontSize={font.value.msgSize + 2}>
            {userInfo?.name ?? props.username ?? ""}
          </Span>
        </Markup>
        <Markup
          margin={10}
          selectable
          horizontalAlign={Align.START}
          justify={Justification.LEFT}
        >
          <Span fontSize={font.value.msgSize}>
            {mdNodes.map((node, i) => renderNode(node, i.toString()))}
          </Span>
        </Markup>
      </Box>
    </Box>
  );
};
