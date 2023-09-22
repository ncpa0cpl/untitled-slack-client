import Gtk from "gi://Gtk";
import React from "react";
import {
  Align,
  Anchor,
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
import { SlackService } from "../../../../services/slack-service/slack-service";
import type {
  MessageBlock,
  MessageFile,
  SlackMessage,
} from "../../../../services/slack-service/slack-types";
import { AppMarkup } from "../../../app-markup/app-markup";
import { FontMod, FontSize } from "../../../font-size/font-size-context";
import { Timestamp } from "../../../timestamp/timestamp";
import { UserProfilePicture } from "../../../user-profile-picture/user-profile-picture";
import type { SlackMessageGroup } from "./conversation";
import { Thread } from "./thread";

type MessageBoxProps = {
  userID?: string;
  username?: string;
  subThreadMessage?: boolean;
  subthread?: SlackMessage[];
  groups: SlackMessageGroup["groups"];
};

const UserName = (props: { userID: string }) => {
  const userInfo = UsersIndex.useUser(props.userID);

  React.useEffect(() => {
    const service = SlackService.getService();
    if (!userInfo && props.userID && service) {
      service.users.getUser(props.userID);
    }
  }, [userInfo, props.userID]);

  return (
    <Span
      fontWeight={"bold"}
      color="blue"
    >
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
    case "link": {
      return (
        <Anchor
          key={key}
          href={node.url}
        >
          {node.text ?? node.url}
        </Anchor>
      );
    }
    case "emoji":
      return (
        <Span
          key={key}
          fontWeight="bold"
        >
          :{node.name}:
        </Span>
      );
    case "user":
      return (
        <UserName
          key={key}
          userID={node.user_id}
        />
      );
    case "rich_text":
      return (
        <Span key={key}>
          {node.elements.map((elem, id) => renderNode(elem, `${key}-${id}`))}
        </Span>
      );
    case "rich_text_section":
      return (
        <Span key={key}>
          {node.elements.map((elem, id) => renderNode(elem, `${key}-${id}`))}
        </Span>
      );
  }

  // Logger.log(node);
  return <Span key={key}></Span>;
};

const AttachmentImage = (props: { file: MessageFile }) => {
  const file = ImageIndex.useAttachmentImage(props.file.id);

  React.useEffect(() => {
    const service = SlackService.getService();
    if (!file && props.file.id != null && service) {
      service.channels.requestAttachmentFile(props.file);
    }
  }, [file]);

  if (file) {
    return (
      <Image
        horizontalAlign={Align.START}
        src={file?.fileLocation}
        resizeToWidth={250}
        resizeToHeight={250}
        preserveAspectRatio
      />
    );
  }

  return <></>;
};

const MessageBoxImpl = (props: MessageBoxProps) => {
  const userInfo = UsersIndex.useUser(props.userID);
  const font = FontSettings.use();

  const [showSubThread, setShowSubThread] = React.useState(false);

  React.useEffect(() => {
    const service = SlackService.getService();
    if (!userInfo && props.userID && service) {
      service.users.getUser(props.userID);
    }
  }, [userInfo]);

  const mainTs = props.groups[0]?.timestamp;

  const shouldNotDisplay = React.useMemo(() => {
    return !props.groups.some(
      (g) => (g.contents && g.contents.length) || g.files.length,
    );
  }, [props.groups]);

  if (shouldNotDisplay) {
    return <></>;
  }

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
            {mainTs ? <Timestamp timestamp={mainTs} /> : <></>}
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
          {props.groups.map((g) => {
            return (
              <Box
                key={g.id}
                margin={[0, 10]}
                expandHorizontal
                horizontalAlign={Align.FILL}
                orientation={Orientation.VERTICAL}
              >
                {g.contents && (
                  <Markup
                    margin={[6, 0]}
                    selectable
                    horizontalAlign={Align.START}
                    justify={Justification.LEFT}
                    style={{
                      caretColor: "rgba(0, 0, 0, 0)",
                    }}
                  >
                    <Span fontSize={font.value.msgSize}>
                      {g.contents.map((node, i) =>
                        renderNode(node, i.toString()),
                      )}
                    </Span>
                  </Markup>
                )}
                <Box
                  horizontalAlign={Align.START}
                  expandHorizontal
                >
                  {g.files.map((f, idx) =>
                    f.mimetype?.startsWith("image/") ? (
                      <AttachmentImage
                        key={f.id ?? idx}
                        file={f}
                      />
                    ) : (
                      <></>
                    ),
                  )}
                </Box>
              </Box>
            );
          })}
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
          <Thread messages={props.subthread} />
        </Revealer>
      ) : (
        <></>
      )}
    </Box>
  );
};

export const MessageBox = React.memo(MessageBoxImpl) as typeof MessageBoxImpl;
