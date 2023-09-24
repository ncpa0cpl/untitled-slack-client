import type {
  Channel,
  ConversationsListResponse,
} from "@slack/web-api/dist/response/ConversationsListResponse";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { ImageIndex } from "../../../quarks/image-index";
import type { ChannelData } from "../../../quarks/slack/slack-quark";
import {
  ConversationType,
  SlackQuark,
} from "../../../quarks/slack/slack-quark";
import { RequestError } from "../../../utils/errors/fetch-error";
import { generateUID } from "../../../utils/generate-uid";
import type { AsyncResult, Result } from "../../../utils/result";
import { AsyncAll, err, ok } from "../../../utils/result";
import type { SlackService } from "../slack-service";
import type { MessageFile, SlackMessage } from "../slack-types";

export type ConversationChannel = {
  id: string;
  name: string;
  isOrgShared: boolean;
  memberCount: number;
  isMember: boolean;
  type: ConversationType;
  uid?: string;
  unreadCount?: number;
};

type UserCounts = {
  ok: boolean;
  channels: Array<{
    id: string;
    unread_count?: number;
    unread_count_display?: number;
    mention_count?: number;
    mention_count_display?: number;
    is_member?: boolean;
  }>;
  groups: Array<{
    id: string;
    unread_count?: number;
    unread_count_display?: number;
    mention_count?: number;
    mention_count_display?: number;
    is_member?: boolean;
  }>;
  ims: Array<{
    id: string;
    user_id: string;
    dm_count?: number;
  }>;
};

type FetchedMessages = {
  messages: SlackMessage[];
  hasMore: boolean;
  cursor?: string;
};

export class SlackServiceChannelsModule {
  constructor(private readonly mainService: SlackService) {}

  private get client() {
    return this.mainService.getClient();
  }

  private get axios() {
    return this.mainService.getAxios();
  }

  private async requestChannelInfo(channelID: string) {
    const client = this.mainService.getClient();

    await client.conversations.info({
      channel: channelID,
    });
  }

  private async requestAllConversations(): AsyncResult<
    ConversationChannel[],
    RequestError | Error[]
  > {
    const channels: Channel[] = [];
    let cursor: string | undefined = undefined;

    while (true) {
      const resp: ConversationsListResponse =
        await this.client.conversations.list({
          types: "public_channel,private_channel,im,mpim",
          exclude_archived: true,
          limit: 100,
          cursor: cursor,
        });

      if (!resp) {
        break;
      }

      if (!resp.ok) {
        return err(new RequestError(resp.error));
      }

      channels.push(...(resp.channels ?? []));
      if (resp.response_metadata?.next_cursor) {
        cursor = resp.response_metadata.next_cursor;
      } else {
        break;
      }
    }

    const conversations: AsyncResult<ConversationChannel>[] = [];

    for (const channel of channels) {
      if (!channel.id) {
        continue;
      }

      if (!channel.name && channel.user && channel.id) {
        conversations.push(
          new Promise<Result<ConversationChannel>>(async (resolve) => {
            const userResult = await this.mainService.users.getUser(
              channel.user!,
            );

            if (!userResult.ok) {
              return resolve(userResult);
            }

            const chan: ConversationChannel = {
              id: channel.id!,
              name: userResult.value.name,
              isMember: !!(channel.priority != null && channel.priority > 0),
              isOrgShared: !!channel.is_org_shared,
              memberCount: 2,
              type: ConversationType.Direct,
              uid: userResult.value.id,
              unreadCount: 0,
            };

            return resolve(ok(chan));
          }),
        );
      } else if (channel.name) {
        if (channel.is_private) {
          conversations.push(
            Promise.resolve(
              ok({
                id: channel.id,
                name: channel.name_normalized ?? channel.name,
                isMember: !!channel.is_member,
                isOrgShared: !!channel.is_org_shared,
                memberCount: channel.num_members ?? 0,
                type: ConversationType.PrivateGroup,
                unreadCount: 0,
              }),
            ),
          );
        } else {
          conversations.push(
            Promise.resolve(
              ok({
                id: channel.id,
                name: channel.name_normalized ?? channel.name,
                isMember: !!channel.is_member,
                isOrgShared: !!channel.is_org_shared,
                memberCount: channel.num_members ?? 0,
                type: channel.is_channel
                  ? ConversationType.Group
                  : ConversationType.DirectGroup,
                unreadCount: 0,
              }),
            ),
          );
        }
      }
    }

    Promise.all([Promise.resolve(""), Promise.resolve(1)]);

    const conversationsResult = await AsyncAll(conversations);

    if (!conversationsResult.ok) {
      return conversationsResult;
    }

    conversationsResult.value.sort((a, b) => a.name.localeCompare(b.name));

    return ok(conversationsResult.value);
  }

  async requestAttachmentFile(file: MessageFile): AsyncResult {
    const url = file.url_private_download;

    if (!url || !file.id) {
      return err(new Error("No file URL or ID"));
    }

    try {
      const config: AxiosRequestConfig = {
        responseType: "arraybuffer",
        data: {},
      };

      const response: AxiosResponse = await this.axios.get(url, config);

      if (response.status === 200) {
        ImageIndex.addAttachmentImage(file.id, new Uint8Array(response.data));
      }

      return ok();
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async fetchMessages(
    channelID: string,
    cursor?: string,
  ): AsyncResult<FetchedMessages> {
    const client = this.mainService.getClient();

    const response = await client.conversations.history({
      channel: channelID,
      limit: 16,
      cursor,
    });

    if (!response.ok || response.error) {
      return err(new Error(response.error));
    }

    const result: SlackMessage[] = [];

    for (const message of response.messages ?? []) {
      const timestamp = message.ts ? Number(message.ts) : undefined;

      if (!message.user) {
        result.push({
          id: message.client_msg_id ?? generateUID(36),
          contents: (message.blocks as any) ?? [],
          timestamp: timestamp,
          username: message.username ?? message.bot_profile?.name ?? "",
          files: message.files ?? [],
        });
        continue;
      }

      result.push({
        id: message.client_msg_id ?? generateUID(36),
        contents: (message.blocks as any) ?? "",
        timestamp: timestamp,
        userID: message.user,
        files: message.files ?? [],
      });
    }

    return ok({
      messages: result.reverse(),
      hasMore: !!response.has_more,
      cursor: response.response_metadata?.next_cursor,
    });
  }

  async getAllConversations(): AsyncResult<void, Error | Error[]> {
    const client = this.mainService.getClient();
    const conversations = await this.requestAllConversations();

    if (!conversations.ok) {
      return conversations;
    }

    const counts: UserCounts = (await client.apiCall("users.counts")) as any;

    if (!counts.ok) {
      return err(new Error("Failed to get user counts"));
    }

    const channels = conversations.value.map((c): ChannelData => {
      let unreadCount = 0;
      for (const channel of counts.channels) {
        if (channel.is_member && channel.id === c.id) {
          unreadCount =
            channel.unread_count_display ?? channel.unread_count ?? 0;
        }
      }

      return {
        channelID: c.id,
        messages: [],
        userTyping: [],
        isLoading: false,
        cursor: undefined,
        info: {
          isMember: c.isMember,
          isOrgShared: c.isOrgShared,
          memberCount: c.memberCount,
          name: c.name,
          type: c.type,
          unreadCount,
        },
      };
    });

    SlackQuark.addChannels(this.mainService.workspaceID, channels);

    return ok();
  }

  async sendMessage(
    channelID: string,
    message: string,
  ): AsyncResult<void, RequestError> {
    const response = await this.client.chat.postMessage({
      channel: channelID,
      mrkdwn: true,
      text: message,
      as_user: true,
    });

    if (!response.ok) {
      return err(new RequestError(response.error));
    }

    return ok();
  }
}
