import { quark } from "react-quarks";
import type { SlackChannelService } from "../../services/channel-service/channels-service";
import { PersistentSession } from "../persistent-session";

export enum ConversationType {
  Direct = "im",
  DirectGroup = "mpim",
  Group = "public_channel",
  PrivateGroup = "private_channel",
}

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

export const Conversations = quark(
  {
    conversations: [] as ConversationChannel[],
  },
  {
    actions: {
      setConversations(state, conversations: ConversationChannel[]) {
        return {
          ...state,
          conversations,
        };
      },
      updateConversation(
        current,
        conversations: Array<Partial<ConversationChannel> & { id: string }>,
      ) {
        const newConversations: ConversationChannel[] = [];

        for (const currentConv of current.conversations) {
          const updatedConv = conversations.find(
            (i) => i.id === currentConv.id,
          );

          if (!updatedConv) {
            newConversations.push(currentConv);
            continue;
          }

          newConversations.push({
            ...currentConv,
            ...updatedConv,
          });
        }

        return {
          ...current,
          conversations: newConversations,
        };
      },
    },
    selectors: {
      useActiveDirectConversations: (state) =>
        state.conversations.filter(
          (channel) =>
            channel.isMember && channel.type === ConversationType.Direct,
        ),
      useActiveGroupConversations: (state) =>
        state.conversations.filter(
          (channel) =>
            channel.isMember &&
            (channel.type === ConversationType.Group ||
              channel.type === ConversationType.DirectGroup),
        ),
      useActivePrivateConversations: (state) =>
        state.conversations.filter(
          (channel) =>
            channel.isMember && channel.type === ConversationType.PrivateGroup,
        ),
    },
  },
);

export const ActiveSlackChannelService = quark({
  service: undefined as undefined | SlackChannelService,
});

ActiveSlackChannelService.subscribe((state) => {
  if (state.service && state.service?.activeChannel == null) {
    const { lastActiveConversation } = PersistentSession.get();
    const { conversations } = Conversations.get();
    const conversation = conversations.find(
      (i) => i.id === lastActiveConversation,
    );
    if (conversation) {
      state.service.selectChannel(conversation.id);
    }
  }
});

Conversations.subscribe((state) => {
  const channelService = ActiveSlackChannelService.get().service;
  if (channelService != null && channelService.activeChannel == null) {
    const { lastActiveConversation } = PersistentSession.get();

    if (lastActiveConversation) {
      const conversation = state.conversations.find(
        (i) => i.id === lastActiveConversation,
      );
      if (conversation) {
        channelService.selectChannel(conversation.id);
      }
    }
  }

  if (state.conversations.length === 0) {
    ActiveSlackChannelService.set({ service: undefined });
  }
});
