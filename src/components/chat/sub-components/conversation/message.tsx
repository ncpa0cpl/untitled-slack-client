import Gtk from "gi://Gtk";
import React from "react";
import {
  Align,
  Box,
  Button,
  ButtonBox,
  ButtonType,
  IconName,
  Image,
  Justification,
  LinkButton,
  Orientation,
  PackEnd,
  PackType,
  Revealer,
  Span,
  TextView,
  TextViewLink,
  TextViewSpan,
  TextViewWidget,
} from "react-gjs-renderer";
import { EmojiIndex } from "../../../../quarks/emoji-index";
import { ImageIndex } from "../../../../quarks/image-index";
import { FontSettings } from "../../../../quarks/settings/font-size";
import { SlackQuark } from "../../../../quarks/slack/slack-quark";
import { UsersIndex } from "../../../../quarks/users-index";
import { SlackGatewayService } from "../../../../services/slack-service/slack-service";
import type {
  MessageBlock,
  MessageFile,
  SlackMessage,
  SlackMessageReaction,
} from "../../../../services/slack-service/slack-types";
import { Component } from "../../../../utils/custom-component";
import { AppMarkup } from "../../../app-markup/app-markup";
import { FontMod, FontSize } from "../../../font-size/font-size-context";
import { Timestamp } from "../../../timestamp/timestamp";
import { UserProfilePicture } from "../../../user-profile-picture/user-profile-picture";
import type { SlackMessageGroup } from "./conversation";
import "./styles.css";
import { Thread } from "./thread";

type MessageBoxProps = {
  userID?: string;
  username?: string;
  subThreadMessage?: boolean;
  subthread?: SlackMessage[];
  entries: SlackMessageGroup["groups"];
};

const UserName = (props: { userID: string }) => {
  const userInfo = UsersIndex.useUser(props.userID);

  React.useEffect(() => {
    const service = SlackGatewayService.getService();
    if (!userInfo && props.userID && service) {
      service.users.getUser(props.userID);
    }
  }, [userInfo, props.userID]);

  return (
    <TextViewSpan
      fontWeight={"bold"}
      color="blue"
    >
      {userInfo?.name ?? ""}
    </TextViewSpan>
  );
};

const Emoji = (props: {
  workspaceID: string;
  emojiID: string;
  fontSize: number;
}) => {
  const emoji = EmojiIndex.useEmoji(props.workspaceID, props.emojiID);

  if (emoji) {
    const size = Math.round(props.fontSize * 1.5);
    return (
      <TextViewWidget>
        <Image
          horizontalAlign={Align.CENTER}
          verticalAlign={Align.CENTER}
          src={emoji.fileLocation}
          resizeToWidth={size}
          resizeToHeight={size}
          preserveAspectRatio
          // margin={[4]}
        />
      </TextViewWidget>
    );
  }

  return <></>;
};

const renderNode = (
  node: MessageBlock,
  options: { workspaceID: string; fontSize: number },
  key: string,
): JSX.Element => {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (node.type) {
    case "text": {
      return <TextViewSpan key={key}>{node.text}</TextViewSpan>;
    }
    case "link": {
      return (
        <TextViewLink
          key={key}
          href={node.url}
        >
          {node.text ?? node.url}
        </TextViewLink>
      );
    }
    case "emoji":
      return (
        <Emoji
          key={key}
          workspaceID={options.workspaceID}
          emojiID={node.name}
          fontSize={options.fontSize}
        />
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
        <TextViewSpan key={key}>
          {node.elements.map((elem, id) =>
            renderNode(elem, options, `${key}-${id}`),
          )}
        </TextViewSpan>
      );
    case "rich_text_section":
      return (
        <TextViewSpan key={key}>
          {node.elements.map((elem, id) =>
            renderNode(elem, options, `${key}-${id}`),
          )}
        </TextViewSpan>
      );
  }

  // Logger.log(node);
  return <TextViewSpan key={key}></TextViewSpan>;
};

const AttachmentImage = (props: { file: MessageFile }) => {
  const file = ImageIndex.useAttachmentImage(props.file.id);

  React.useEffect(() => {
    const service = SlackGatewayService.getService();
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

const Reaction = (props: {
  workspaceID: string;
  reaction: SlackMessageReaction;
}) => {
  const emoji = EmojiIndex.useEmoji(props.workspaceID, props.reaction.emojiID);

  if (emoji) {
    return (
      <ButtonBox
        horizontalAlign={Align.START}
        className={"reaction-button"}
        margin={[0, 6]}
        onClick={() => {
          console.log(emoji.emojiID);
        }}
      >
        <Image
          horizontalAlign={Align.CENTER}
          verticalAlign={Align.CENTER}
          src={emoji.fileLocation}
          resizeToWidth={16}
          resizeToHeight={16}
          preserveAspectRatio
          margin={[2]}
        />
      </ButtonBox>
    );
  }

  return <></>;
};

export class MessageBox extends Component<MessageBoxProps> {
  private slack = this.$quark(SlackQuark);
  private users = this.$quark(UsersIndex);
  private font = this.$quark(FontSettings);

  private showSubThread = this.$state(false);

  private userInfo = this.$computed(() => {
    return this.users.get().users.find((u) => u.id === this.props.userID);
  }, [this.depend.userID, this.users]);

  constructor(props: MessageBoxProps) {
    super(props);

    this.$effect(() => {
      const service = SlackGatewayService.getService();
      if (!this.userInfo.get() && this.props.userID && service) {
        service.users.getUser(this.props.userID);
      }
    }, [this.depend.userID]);
  }

  render() {
    const workspace = this.slack.get().activeWorkspace;
    const mainTs = this.props.entries[0]?.timestamp;
    const hasContent = this.props.entries.some(
      (g) => (g.contents && g.contents.length) || g.files.length,
    );

    if (!hasContent) {
      return <></>;
    }

    const contentRenderOpt = {
      fontSize: this.font.get().msgSize,
      workspaceID: workspace!,
    };

    return (
      <Box
        style={{
          background: this.props.subThreadMessage
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
            userID={this.props.userID}
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
                    {this.userInfo?.get()?.name ?? this.props.username ?? ""}
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
                    className={"reaction-btn"}
                    type={ButtonType.FLAT}
                    icon={IconName.FaceLaughSymbolic}
                    iconPixelSize={16}
                    tooltip="Add Reaction"
                  />
                  {!this.props.subThreadMessage && (
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
            {this.props.entries.map((g) => {
              return (
                <Box
                  key={g.id}
                  margin={[0, 10]}
                  expandHorizontal
                  horizontalAlign={Align.FILL}
                  orientation={Orientation.VERTICAL}
                >
                  {g.contents && (
                    <TextView
                      className="msg-text-view"
                      margin={[6, 0]}
                      horizontalAlign={Align.FILL}
                      justification={Justification.LEFT}
                    >
                      <TextViewSpan fontSize={this.font.get().msgSize}>
                        {g.contents.map((node, i) =>
                          renderNode(node, contentRenderOpt, i.toString()),
                        )}
                      </TextViewSpan>
                    </TextView>
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
                        <React.Fragment key={f.id ?? idx}></React.Fragment>
                      ),
                    )}
                  </Box>
                  <Box
                    horizontalAlign={Align.START}
                    expandHorizontal
                    orientation={Orientation.HORIZONTAL}
                  >
                    {g.reactions.map((reaction) => {
                      return (
                        <Reaction
                          key={reaction.emojiID}
                          workspaceID={workspace!}
                          reaction={reaction}
                        />
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
            {this.props.subthread?.length ? (
              <LinkButton
                horizontalAlign={Align.START}
                label={
                  this.showSubThread.get()
                    ? "Hide"
                    : `${this.props.subthread?.length} replies`
                }
                onClick={() => this.showSubThread.set((b) => !b)}
              />
            ) : (
              <></>
            )}
          </Box>
        </Box>
        {this.props.subthread?.length ? (
          <Revealer
            expandHorizontal
            horizontalAlign={Align.FILL}
            transitionDuration={400}
            transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
            visible={this.showSubThread.get()}
          >
            <Thread messages={this.props.subthread} />
          </Revealer>
        ) : (
          <></>
        )}
      </Box>
    );
  }
}
