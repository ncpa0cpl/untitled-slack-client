import type { WebClient } from "@slack/web-api";
import type { FileElement } from "@slack/web-api/dist/response/ConversationsHistoryResponse";
import type { AxiosInstance } from "axios";
import { SlackClient } from "../../quarks/slack/slack-client";
import { SlackAuthorizationService } from "./modules/slack-authorization-service";
import { SlackChannelsService } from "./modules/slack-channels-service";
import { SlackUsersService } from "./modules/slack-users-service";

export type MessageBlockRichTextSection = {
  type: "rich_text_section";
  elements: Array<
    | MessageBlockText
    | MessageBlockEmoji
    | MessageBlockUser
    | MessageBlockButton
    | MessageBlockMarkdown
    | MessageBlockImage
    | MessageBlockDivider
  >;
};
export type MessageBlockRichText = {
  type: "rich_text";
  block_id: string;
  elements: MessageBlockRichTextSection[];
};
export type MessageBlockContext = {
  type: "context";
  block_id: string;
  elements: Array<
    | MessageBlockText
    | MessageBlockEmoji
    | MessageBlockUser
    | MessageBlockButton
    | MessageBlockMarkdown
    | MessageBlockImage
    | MessageBlockDivider
  >;
};

export type MessageBlockActions = {
  type: "actions";
  block_id: string;
  elements: Array<
    | MessageBlockText
    | MessageBlockEmoji
    | MessageBlockUser
    | MessageBlockButton
    | MessageBlockMarkdown
    | MessageBlockImage
    | MessageBlockDivider
  >;
};
export type MessageBlockSection = {
  type: "section";
  block_id: string;
  elements: Array<
    | MessageBlockText
    | MessageBlockEmoji
    | MessageBlockUser
    | MessageBlockButton
    | MessageBlockMarkdown
    | MessageBlockImage
    | MessageBlockDivider
  >;
};
export type MessageBlockText = {
  type: "text";
  text: string;
};
export type MessageBlockEmoji = {
  type: "emoji";
  name: string;
};
export type MessageBlockUser = {
  type: "user";
  user_id: string;
};
export type MessageBlockImage = {
  type: "image";
  image_url: string;
  alt_text: string;
};
export type MessageBlockMarkdown = {
  type: "mrkdwn";
  text: string;
  verbatim?: boolean;
};
export type MessageBlockButton = {
  type: "button";
  action_id: string;
  text: {
    type: "plain_text";
    text: string;
    emoji: boolean;
  };
  value: string;
  url?: string;
};
export type MessageBlockDivider = {
  type: "divider";
  block_id: string;
};

export type MessageBlock =
  | MessageBlockUser
  | MessageBlockText
  | MessageBlockEmoji
  | MessageBlockRichText
  | MessageBlockRichTextSection
  | MessageBlockContext
  | MessageBlockActions
  | MessageBlockSection
  | MessageBlockImage
  | MessageBlockMarkdown
  | MessageBlockButton
  | MessageBlockDivider;

export type MessageFile = FileElement;

export type SlackMessage =
  | {
      id: string;
      contents: MessageBlock[];
      userID: string;
      username?: undefined;
      timestamp?: number;
      files: MessageFile[];
    }
  | {
      id: string;
      contents: MessageBlock[];
      userID?: undefined;
      username: string;
      timestamp?: number;
      files: MessageFile[];
    };

class SlackServiceImpl {
  auth = new SlackAuthorizationService(this);

  users = new SlackUsersService(this);

  channels = new SlackChannelsService(this);

  getClient() {
    const state = SlackClient.get();
    if (!state.client) {
      throw new Error("Slack client not initialized");
    }
    return state.client as WebClient & { axios: AxiosInstance };
  }
}

export const SlackService = new SlackServiceImpl();
