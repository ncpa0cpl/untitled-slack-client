import type {
  MessageBlock,
  MessageBlockRichText,
  MessageFile,
} from "../../slack-service/slack-types";

export type WsEventUserTyping = {
  type: "user_typing";
  channel: string;
  id: number;
  user: string;
};

export type WsEventMessage = {
  type: "message";
  subtype?: undefined;
  channel: string;
  text: string;
  blocks: Array<MessageBlockRichText>;
  user: string;
  client_msg_id: string;
  team: string;
  source_team: string;
  user_team: string;
  suppress_notification: boolean;
  event_ts: string;
  ts: string;
  files: MessageFile[];
};

export type WsEventMessageChanged = {
  type: "message";
  subtype: "message_changed";
  message: WsEventMessage;
  previous_message: WsEventMessage;
  channel: string;
  hidden: boolean;
  ts: string;
  event_ts: string;
};

export type WsSlackNotification =
  | WsEventUserTyping
  | WsEventMessage
  | WsEventMessageChanged;

export type SlackMessageGroupEntry = {
  id: string;
  contents?: MessageBlock[];
  files: MessageFile[];
  timestamp?: number;
  edited?: true;
};

export type SlackMessageGroup = {
  id: string;
  entries: Array<SlackMessageGroupEntry>;
} & (
  | { userID: string; username?: undefined }
  | { userID?: undefined; username: string }
);

export type UserTypingInfo = { uid: string; ts: number };
