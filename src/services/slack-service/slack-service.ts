import type { ConversationChannel } from "../../quarks/conversations";
import { Conversations } from "../../quarks/conversations";
import { SlackClient } from "../../quarks/slack-client";
import type { UserInfo } from "../../quarks/users-index";
import { UsersIndex } from "../../quarks/users-index";
import { generateUID } from "../../utils/generate-uid";

export type SlackMessage =
  | {
      id: string;
      markdown: string;
      userID: string;
      username?: undefined;
      timestamp?: string;
    }
  | {
      id: string;
      markdown: string;
      userID?: undefined;
      username: string;
      timestamp?: string;
    };

export class SlackService {
  private static getClient() {
    const state = SlackClient.get();
    if (!state.client) {
      throw new Error("Slack client not initialized");
    }
    return state.client;
  }

  static async loadConversations() {
    try {
      const client = this.getClient();

      const response = await client.conversations.list({
        types: "public_channel,private_channel",
      });

      if (!response.ok) {
        throw new Error(response.error);
      }

      const groupChannels: ConversationChannel[] = [];

      for (const channel of response.channels ?? []) {
        if (!channel.id || !channel.name || !channel.is_channel) {
          continue;
        }

        groupChannels.push({
          id: channel.id,
          name: channel.name,
          isMember: !!channel.is_member,
          isOrgShared: !!channel.is_org_shared,
          memberCount: channel.num_members ?? 0,
        });
      }

      Conversations.setGroupChannels(groupChannels);
    } catch (e) {
      console.error(e);
    }
  }

  static async fetchMessages(channelID: string, cursor?: string) {
    const client = this.getClient();

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
      if (!message.user) {
        result.push({
          id: generateUID(12),
          markdown: message.text ?? "",
          timestamp: message.ts,
          username: message.username ?? message.bot_profile?.name ?? "",
        });
        continue;
      }

      result.push({
        id: generateUID(12),
        markdown: message.text ?? "",
        timestamp: message.ts,
        userID: message.user,
      });
    }

    return {
      messages: result.reverse(),
      hasMore: !!response.has_more,
      cursor: response.response_metadata?.next_cursor,
    };
  }

  static async loadUserInfo(userID: string) {
    const client = this.getClient();

    const response = await client.users.info({
      user: userID,
    });

    if (!response.ok) {
      throw new Error(response.error);
    }

    const user: UserInfo = {
      id: response.user!.id!.toString(),
      name: response.user!.real_name ?? response.user!.name!.toString(),
    };

    UsersIndex.addUser(user);
  }
}
