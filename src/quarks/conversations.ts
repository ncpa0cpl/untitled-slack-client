import { quark } from "react-quarks";

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
};

export const Conversations = quark(
  {
    conversations: [] as ConversationChannel[],
  },
  {
    actions: {
      setConversations: (state, conversations: ConversationChannel[]) => ({
        ...state,
        conversations,
      }),
    },
    selectors: {
      useActiveDirectConversations: (state) =>
        state.conversations.filter(
          (channel) =>
            channel.isMember && channel.type === ConversationType.Direct
        ),
      useActiveGroupConversations: (state) =>
        state.conversations.filter(
          (channel) =>
            channel.isMember &&
            (channel.type === ConversationType.Group ||
              channel.type === ConversationType.DirectGroup)
        ),
      useActivePrivateConversations: (state) =>
        state.conversations.filter(
          (channel) =>
            channel.isMember && channel.type === ConversationType.PrivateGroup
        ),
    },
  }
);

export const ActiveConversation = quark(null as null | ConversationChannel);

Conversations.subscribe((state) => {
  if (ActiveConversation.get() == null) {
    if (state.conversations.length > 0) {
      ActiveConversation.set(state.conversations[0]!);
    }
  }

  if (state.conversations.length === 0) {
    ActiveConversation.set(null);
  }
});
