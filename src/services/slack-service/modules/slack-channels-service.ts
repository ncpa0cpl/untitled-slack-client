import type {
  Channel,
  ConversationsListResponse,
} from "@slack/web-api/dist/response/ConversationsListResponse";
import type { ConversationChannel } from "../../../quarks/slack/conversations";
import {
  Conversations,
  ConversationType,
} from "../../../quarks/slack/conversations";
import { generateUID } from "../../../utils/generate-uid";
import type { SlackMessage, SlackService } from "../slack-service";

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

export class SlackChannelsService {
  constructor(private readonly mainService: typeof SlackService) {}

  private async fetchChannelInfo(channelID: string) {
    const client = this.mainService.getClient();

    return await client.conversations.info({
      channel: channelID,
    });
  }

  private async fetchAllConversations() {
    const client = this.mainService.getClient();

    const channels: Channel[] = [];
    let cursor: string | undefined = undefined;

    while (true) {
      const resp: ConversationsListResponse = await client.conversations.list({
        types: "public_channel,private_channel,im,mpim",
        exclude_archived: true,
        limit: 100,
        cursor: cursor,
      });

      if (!resp) {
        break;
      }

      if (!resp.ok) {
        throw new Error(resp.error);
      }

      channels.push(...(resp.channels ?? []));

      if (resp.response_metadata?.next_cursor) {
        cursor = resp.response_metadata.next_cursor;
      } else {
        break;
      }
    }

    const conversations: Promise<ConversationChannel>[] = [];

    for (const channel of channels) {
      if (!channel.id) {
        continue;
      }

      if (!channel.name && channel.user) {
        conversations.push(
          this.mainService.users.getUser(channel.user).then(async (user) => {
            return {
              id: channel.id!,
              name: user.name,
              isMember: !!(channel.priority != null && channel.priority > 0),
              isOrgShared: !!channel.is_org_shared,
              memberCount: 2,
              type: ConversationType.Direct,
              uid: user.id,
              unreadCount: 0,
            };
          })
        );
      } else if (channel.name) {
        if (channel.is_private) {
          conversations.push(
            Promise.resolve({
              id: channel.id,
              name: channel.name_normalized ?? channel.name,
              isMember: !!channel.is_member,
              isOrgShared: !!channel.is_org_shared,
              memberCount: channel.num_members ?? 0,
              type: ConversationType.PrivateGroup,
              unreadCount: 0,
            })
          );
        } else {
          conversations.push(
            Promise.resolve({
              id: channel.id,
              name: channel.name_normalized ?? channel.name,
              isMember: !!channel.is_member,
              isOrgShared: !!channel.is_org_shared,
              memberCount: channel.num_members ?? 0,
              type: channel.is_channel
                ? ConversationType.Group
                : ConversationType.DirectGroup,
              unreadCount: 0,
            })
          );
        }
      }
    }

    return await Promise.all(conversations).then((convs) =>
      convs.sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  async fetchMessages(channelID: string, cursor?: string) {
    const client = this.mainService.getClient();

    const response = await client.conversations.history({
      channel: channelID,
      limit: 16,
      cursor,
    });

    if (!response.ok || response.error) {
      throw new Error(response.error);
    }

    const result: SlackMessage[] = [];

    for (const message of response.messages ?? []) {
      const timestamp = message.ts ? Number(message.ts) * 1000 : undefined;

      if (!message.user) {
        result.push({
          id: generateUID(12),
          markdown: message.text ?? "",
          timestamp: timestamp,
          username: message.username ?? message.bot_profile?.name ?? "",
        });
        continue;
      }

      result.push({
        id: generateUID(12),
        markdown: message.text ?? "",
        timestamp: timestamp,
        userID: message.user,
      });
    }

    return {
      messages: result.reverse(),
      hasMore: !!response.has_more,
      cursor: response.response_metadata?.next_cursor,
    };
  }

  async getAllConversations() {
    try {
      const conversations = await this.fetchAllConversations();
      Conversations.setConversations(conversations);
    } catch (error) {
      console.error(error);
    }
  }

  async getConversationsInfo() {
    const client = this.mainService.getClient();
    const conversations = Conversations.get().conversations;

    type ConvUpdate = {
      id: string;
      unreadCount: number;
    };

    const updates: ConvUpdate[] = [];

    const counts: UserCounts = (await client.apiCall("users.counts")) as any;

    for (const channel of counts.channels) {
      if (!channel.is_member) {
        continue;
      }

      const convo = conversations.find((c) => c.id === channel.id);

      if (!convo) {
        continue;
      }

      updates.push({
        id: convo.id,
        unreadCount: channel.unread_count_display ?? channel.unread_count ?? 0,
      });
    }

    Conversations.updateConversation(updates);
  }
}
