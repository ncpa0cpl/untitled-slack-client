import { quark } from "react-quarks";

export type ConversationChannel = {
  id: string;
  name: string;
  isOrgShared: boolean;
  memberCount: number;
  isMember: boolean;
};

export const Conversations = quark(
  {
    groupChannels: [] as ConversationChannel[],
    privateChannels: [] as ConversationChannel[],
  },
  {
    actions: {
      setGroupChannels: (state, groupChannels: ConversationChannel[]) => ({
        ...state,
        groupChannels,
      }),
      setPrivateChannels: (state, privateChannels: ConversationChannel[]) => ({
        ...state,
        privateChannels,
      }),
    },
    selectors: {
      useGroupChannels: (state) => state.groupChannels,
      usePrivateChannels: (state) => state.privateChannels,
      useActiveGroupChannels: (state) =>
        state.groupChannels.filter((channel) => channel.isMember),
      useActivePrivateChannels: (state) =>
        state.privateChannels.filter((channel) => channel.isMember),
    },
  }
);

export const ActiveConversation = quark(null as null | ConversationChannel);

Conversations.subscribe((state) => {
  if (ActiveConversation.get() == null) {
    if (state.groupChannels.length > 0) {
      ActiveConversation.set(state.groupChannels[0]!);
    } else if (state.privateChannels.length > 0) {
      ActiveConversation.set(state.privateChannels[0]!);
    }
  }

  if (state.groupChannels.length === 0 && state.privateChannels.length === 0) {
    ActiveConversation.set(null);
  }
});
