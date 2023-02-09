import type {
  Channel,
  ConversationsListResponse,
} from "@slack/web-api/dist/response/ConversationsListResponse";
import type { ConversationChannel } from "../../quarks/conversations";
import { Conversations, ConversationType } from "../../quarks/conversations";
import { ImageIndex, ImageType } from "../../quarks/image-index";
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
      timestamp?: number;
    }
  | {
      id: string;
      markdown: string;
      userID?: undefined;
      username: string;
      timestamp?: number;
    };

export class SlackService {
  private static getClient() {
    const state = SlackClient.get();
    if (!state.client) {
      throw new Error("Slack client not initialized");
    }
    return state.client;
  }

  static getUserInfo(userID: string) {
    const knownUsers = UsersIndex.get();

    const user = knownUsers.users.find((user) => user.id === userID);

    if (user) {
      return user;
    }

    return this.loadUserInfo(userID);
  }

  static async loadConversations() {
    try {
      const client = this.getClient();

      const channels: Channel[] = [];
      let cursor: string | undefined = undefined;

      while (true) {
        const resp: ConversationsListResponse = await client.conversations.list(
          {
            types: "public_channel,private_channel,mpim,im",
            exclude_archived: true,
            limit: 200,
            cursor: cursor,
          }
        );

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

      const conversations: ConversationChannel[] = [];

      for (const channel of channels) {
        if (!channel.id) {
          continue;
        }

        if (!channel.name && channel.user) {
          const user = await this.getUserInfo(channel.user);

          conversations.push({
            id: channel.id,
            name: user.name,
            isMember: !!(channel.priority != null && channel.priority > 0),
            isOrgShared: !!channel.is_org_shared,
            memberCount: 2,
            type: ConversationType.Direct,
            uid: user.id,
          });
        } else if (channel.name) {
          if (channel.is_private) {
            conversations.push({
              id: channel.id,
              name: channel.name,
              isMember: !!channel.is_member,
              isOrgShared: !!channel.is_org_shared,
              memberCount: channel.num_members ?? 0,
              type: ConversationType.PrivateGroup,
            });
          }
          conversations.push({
            id: channel.id,
            name: channel.name,
            isMember: !!channel.is_member,
            isOrgShared: !!channel.is_org_shared,
            memberCount: channel.num_members ?? 0,
            type: channel.is_channel
              ? ConversationType.Group
              : ConversationType.DirectGroup,
          });
        }
      }

      // sort by name
      conversations.sort((a, b) => a.name.localeCompare(b.name));

      Conversations.setConversations(conversations);
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
      email: response.user!.profile?.email ?? "",
      teamID: response.user!.team_id ?? "",
      color: response.user!.color ?? "",
      phone: response.user!.profile?.phone ?? "",
      image: {
        original: response.user!.profile?.image_original,
        px1024: response.user!.profile?.image_1024,
        px512: response.user!.profile?.image_512,
        px192: response.user!.profile?.image_192,
        px72: response.user!.profile?.image_72,
        px48: response.user!.profile?.image_48,
        px32: response.user!.profile?.image_32,
        px24: response.user!.profile?.image_24,
      },
    };

    UsersIndex.addUser(user);

    return user;
  }

  static async loadUserProfilePictures(user: UserInfo) {
    const pfps: {
      link: string;
      size: 24 | 32 | 48 | 72 | 192 | 512 | 1024;
    }[] = [];

    if (user.image.px1024) {
      pfps.push({
        link: user.image.px1024,
        size: 1024,
      });
    }
    if (user.image.px512) {
      pfps.push({
        link: user.image.px512,
        size: 512,
      });
    }
    if (user.image.px192) {
      pfps.push({
        link: user.image.px192,
        size: 192,
      });
    }
    if (user.image.px72) {
      pfps.push({
        link: user.image.px72,
        size: 72,
      });
    }
    if (user.image.px48) {
      pfps.push({
        link: user.image.px48,
        size: 48,
      });
    }
    if (user.image.px32) {
      pfps.push({
        link: user.image.px32,
        size: 32,
      });
    }
    if (user.image.px24) {
      pfps.push({
        link: user.image.px24,
        size: 24,
      });
    }

    const ops: Promise<any>[] = [];

    for (const pfp of pfps) {
      const isImageInIndex = ImageIndex.get().images.some(
        (img) =>
          img.type === ImageType.ProfilePicture &&
          img.uid === user.id &&
          img.size === pfp.size
      );

      if (!isImageInIndex) {
        ops.push(
          fetch(pfp.link)
            .then((response) => response.arrayBuffer())
            .then((arrayBuffer) => new Uint8Array(arrayBuffer))
            .then((buff) =>
              ImageIndex.addProfilePicture(user.id, pfp.size, buff)
            )
            .catch((e) => console.error(e))
        );
      }
    }

    await Promise.all(ops);
  }
}
