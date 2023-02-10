import { quark } from "react-quarks";
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
        conversations: Array<Partial<ConversationChannel> & { id: string }>
      ) {
        const newConversations: ConversationChannel[] = [];

        for (const currentConv of current.conversations) {
          const updatedConv = conversations.find(
            (i) => i.id === currentConv.id
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

export const ActiveConversation = quark(
  undefined as undefined | ConversationChannel
);

ActiveConversation.subscribe((state) => {
  PersistentSession.setLastActiveConversation(state?.id);
});

Conversations.subscribe((state) => {
  if (ActiveConversation.get() == null) {
    const { lastActiveConversation } = PersistentSession.get();

    if (lastActiveConversation) {
      const conversation = state.conversations.find(
        (i) => i.id === lastActiveConversation
      );
      ActiveConversation.set(conversation);
    }
  }

  if (state.conversations.length === 0) {
    ActiveConversation.set(undefined);
  }
});
