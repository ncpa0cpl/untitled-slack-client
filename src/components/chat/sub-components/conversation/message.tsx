import Gtk from "gi://Gtk";
import type { Node as MdNode } from "markdown-ast";
import React from "react";
import {
  Align,
  Anchor,
  Box,
  Button,
  ButtonType,
  IconName,
  Justification,
  LinkButton,
  Markup,
  Orientation,
  PackEnd,
  Revealer,
  Span,
} from "react-gjs-renderer";
import { useSlackMarkdown } from "../../../../hooks/use-slack-markdown";
import { FontSettings } from "../../../../quarks/settings/font-size";
import { UsersIndex } from "../../../../quarks/users-index";
import type { SlackMessage } from "../../../../services/slack-service/slack-service";
import { SlackService } from "../../../../services/slack-service/slack-service";
import { AppMarkup } from "../../../app-markup/app-markup";
import { Timestamp } from "../../../timestamp/timestamp";
import { UserProfilePicture } from "../../../user-profile-picture/user-profile-picture";
import { Thread } from "./thread";

type MessageBoxProps = {
  markdown?: string;
  userID?: string;
  username?: string;
  sentAt?: number;
  subThreadMessage?: boolean;
  subthread?: SlackMessage[];
};

const MessageBoxImpl = (props: MessageBoxProps) => {
  const userInfo = UsersIndex.useUser(props.userID);
  const mdNodes = useSlackMarkdown(props.markdown ?? "");
  const font = FontSettings.use();

  const [showSubThread, setShowSubThread] = React.useState(false);

  const renderNode = React.useCallback((node: MdNode, key: string) => {
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (node.type) {
      case "text": {
        return <Span key={key}>{node.text}</Span>;
      }
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
          <Span key={key} strikethrough>
            {node.block.map((subNode, i) => renderNode(subNode, i.toString()))}
          </Span>
        );
      case "link":
        if (node.url) {
          return (
            <Anchor href={node.url} key={key}>
              {node.block.map((subNode, i) =>
                renderNode(subNode, i.toString())
              )}
            </Anchor>
          );
        } else {
          <Span key={key}>
            {node.block.map((subNode, i) => renderNode(subNode, i.toString()))}
          </Span>;
        }
    }
  }, []);

  React.useEffect(() => {
    if (!userInfo && props.userID) {
      SlackService.users.getUser(props.userID);
    }
  }, [userInfo]);

  return (
    <Box
      style={{
        background: props.subThreadMessage
          ? "rgba(128, 128, 128, 0.2)"
          : "rgba(128, 128, 128, 0.1)",
        borderRadius: 10,
      }}
      margin={[5, 15]}
      expandHorizontal
      verticalAlign={Align.END}
      horizontalAlign={Align.FILL}
    >
      <Box
        margin={[10, 10, 5]}
        expandHorizontal
        orientation={Orientation.HORIZONTAL}
        verticalAlign={Align.END}
        horizontalAlign={Align.FILL}
      >
        <UserProfilePicture
          userID={props.userID}
          margin={[10]}
          width={40}
          height={40}
        />
        <Box
          expandHorizontal
          verticalAlign={Align.END}
          horizontalAlign={Align.FILL}
        >
          <Box
            expandHorizontal
            orientation={Orientation.HORIZONTAL}
            horizontalAlign={Align.FILL}
          >
            <AppMarkup
              verticalAlign={Align.CENTER}
              horizontalAlign={Align.START}
              justify={Justification.LEFT}
              fontSizeMultiplier={1.1}
            >
              <Span fontWeight={"bold"}>
                {userInfo?.name ?? props.username ?? ""}
              </Span>
            </AppMarkup>
            {props.sentAt ? <Timestamp timestamp={props.sentAt} /> : <></>}
            <PackEnd element={Box} orientation={Orientation.HORIZONTAL}>
              <Button
                type={ButtonType.FLAT}
                icon={IconName.FaceLaughSymbolic}
                iconPixelSize={16}
              />
              {!props.subThreadMessage && (
                <Button
                  type={ButtonType.FLAT}
                  icon={IconName.MailReplySenderSymbolic}
                  iconPixelSize={16}
                />
              )}
              <Button
                type={ButtonType.FLAT}
                icon={IconName.BookmarkNewSymbolic}
                iconPixelSize={16}
              />
            </PackEnd>
          </Box>
          <Markup
            margin={10}
            selectable
            horizontalAlign={Align.START}
            justify={Justification.LEFT}
            style={{
              caretColor: "rgba(0, 0, 0, 0)",
            }}
          >
            <Span fontSize={font.value.msgSize}>
              {mdNodes.map((node, i) => renderNode(node, i.toString()))}
            </Span>
          </Markup>
          {props.subthread?.length ? (
            <LinkButton
              horizontalAlign={Align.START}
              label={
                showSubThread ? "Hide" : `${props.subthread?.length} replies`
              }
              onClick={() => setShowSubThread((b) => !b)}
            />
          ) : (
            <></>
          )}
        </Box>
      </Box>
      {props.subthread?.length ? (
        <Revealer
          expandHorizontal
          horizontalAlign={Align.FILL}
          transitionDuration={400}
          transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
          visible={showSubThread}
        >
          <Thread />
        </Revealer>
      ) : (
        <></>
      )}
    </Box>
  );
};

export const MessageBox = React.memo(MessageBoxImpl) as typeof MessageBoxImpl;
