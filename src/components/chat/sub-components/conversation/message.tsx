import Gtk from "gi://Gtk";
import React, { Fragment } from "react";
import {
  Align,
  Box,
  Button,
  ButtonType,
  IconName,
  Image,
  Justification,
  LinkButton,
  Markup,
  Orientation,
  PackEnd,
  PackType,
  Revealer,
  Span,
} from "react-gjs-renderer";
import { ImageIndex } from "../../../../quarks/image-index";
import { FontSettings } from "../../../../quarks/settings/font-size";
import { UsersIndex } from "../../../../quarks/users-index";
import type {
  MessageBlock,
  MessageBlockRichText,
  MessageFile,
  SlackMessage,
} from "../../../../services/slack-service/slack-service";
import { SlackService } from "../../../../services/slack-service/slack-service";
import { AppMarkup } from "../../../app-markup/app-markup";
import { FontMod, FontSize } from "../../../font-size/font-size-context";
import { Timestamp } from "../../../timestamp/timestamp";
import { UserProfilePicture } from "../../../user-profile-picture/user-profile-picture";
import { Thread } from "./thread";

type MessageBoxProps = {
  contents?: MessageBlockRichText[];
  userID?: string;
  username?: string;
  sentAt?: number;
  subThreadMessage?: boolean;
  subthread?: SlackMessage[];
  files: MessageFile[];
};

const UserName = (props: { userID: string }) => {
  const userInfo = UsersIndex.useUser(props.userID);

  React.useEffect(() => {
    if (!userInfo && props.userID) {
      SlackService.users.getUser(props.userID);
    }
  }, [userInfo, props.userID]);

  return (
    <Span fontWeight={"bold"} color="blue">
      {userInfo?.name ?? ""}
    </Span>
  );
};

const renderNode = (node: MessageBlock, key: string): JSX.Element => {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (node.type) {
    case "text": {
      return <Span key={key}>{node.text}</Span>;
    }
    case "emoji":
      return (
        <Span key={key} fontWeight="bold">
          :{node.name}:
        </Span>
      );
    case "user":
      return <UserName key={key} userID={node.user_id} />;
    case "rich_text":
      return (
        <Fragment key={key}>
          {node.elements.map((elem, id) => renderNode(elem, `${key}-${id}`))}
        </Fragment>
      );
    case "rich_text_section":
      return (
        <Fragment key={key}>
          {node.elements.map((elem, id) => renderNode(elem, `${key}-${id}`))}
        </Fragment>
      );
  }

  console.log(node);
  return <Fragment key={key}></Fragment>;
};

const AttachmentImage = (props: { file: MessageFile }) => {
  const file = ImageIndex.useAttachmentImage(props.file.id);

  React.useEffect(() => {
    if (!file && props.file.id != null) {
      SlackService.channels.getAttachmentFile(props.file);
    }
  }, [file]);

  if (file) {
    return <Image horizontalAlign={Align.START} src={file?.fileLocation} />;
  }

  return <></>;
};

const MessageBoxImpl = (props: MessageBoxProps) => {
  const userInfo = UsersIndex.useUser(props.userID);
  const font = FontSettings.use();

  const [showSubThread, setShowSubThread] = React.useState(false);

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
            <FontSize size={FontMod.enlarge.by10}>
              <AppMarkup
                verticalAlign={Align.CENTER}
                horizontalAlign={Align.START}
                justify={Justification.LEFT}
              >
                <Span fontWeight={"bold"}>
                  {userInfo?.name ?? props.username ?? ""}
                </Span>
              </AppMarkup>
            </FontSize>
            {props.sentAt ? <Timestamp timestamp={props.sentAt} /> : <></>}
            <PackEnd>
              <Box
                cpt:pack-type={PackType.END}
                orientation={Orientation.HORIZONTAL}
              >
                <Button
                  type={ButtonType.FLAT}
                  icon={IconName.FaceLaughSymbolic}
                  iconPixelSize={16}
                  tooltip="Add Reaction"
                />
                {!props.subThreadMessage && (
                  <Button
                    type={ButtonType.FLAT}
                    icon={IconName.MailReplySenderSymbolic}
                    iconPixelSize={16}
                    tooltip="Reply"
                  />
                )}
                <Button
                  type={ButtonType.FLAT}
                  icon={IconName.BookmarkNewSymbolic}
                  iconPixelSize={16}
                  tooltip="Save"
                />
              </Box>
            </PackEnd>
          </Box>
          {props.contents && (
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
                {props.contents.map((node, i) =>
                  renderNode(node, i.toString())
                )}
              </Span>
            </Markup>
          )}
          <Box horizontalAlign={Align.START} expandHorizontal>
            {props.files.map((f, idx) =>
              f.mimetype?.startsWith("image/") ? (
                <AttachmentImage key={f.id ?? idx} file={f} />
              ) : (
                <></>
              )
            )}
          </Box>
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
