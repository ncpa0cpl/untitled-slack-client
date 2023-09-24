import type { WebClient } from "@slack/web-api";
import { createImmerMiddleware, quark } from "react-quarks";
import type {
  SlackMessageGroup,
  SlackMessageGroupEntry,
  UserTypingInfo,
} from "../../services/channel-service/channel/channel-types";
import { SlackChannelService } from "../../services/channel-service/channels-service";
import { SlackService } from "../../services/slack-service/slack-service";

export enum ConversationType {
  Direct = "im",
  DirectGroup = "mpim",
  Group = "public_channel",
  PrivateGroup = "private_channel",
}

export type ChannelData = {
  channelID: string;
  messages: SlackMessageGroup[];
  userTyping: UserTypingInfo[];
  isLoading: boolean;
  cursor?: string;
  info: {
    name: string;
    isOrgShared: boolean;
    memberCount: number;
    isMember: boolean;
    type: ConversationType;
    unreadCount?: number;
  };
};

export type SlackStore = {
  activeWorkspace: string | undefined;
  activeChannel: [workspaceID: string, channelID: string] | undefined;
  workspaces: Array<{
    workspaceID: string;
    channels: Array<ChannelData>;
    service: SlackService;
    socket: WebSocket;
  }>;
};

export type MessageToAdd = SlackMessageGroupEntry & {
  userID?: string;
  username?: string;
};

export const SlackQuark = quark(
  {
    activeWorkspace: undefined,
    activeChannel: undefined,
    workspaces: [],
  } as SlackStore,
  {
    middlewares: [createImmerMiddleware()],
    actions: {
      activateWorkspace(
        state,
        workspaceID: string,
        client: WebClient,
        ws: WebSocket,
      ) {
        const service = new SlackService(client, workspaceID);

        SlackChannelService.createServiceForWorkspace(service, ws, workspaceID);

        return {
          ...state,
          activeWorkspace: workspaceID,
          workspaces: state.workspaces.concat({
            workspaceID: workspaceID,
            channels: [],
            socket: ws,
            service,
          }),
        };
      },
      switchWorkspace(state, workspaceID: string) {
        const w = state.workspaces.find((w) => w.workspaceID === workspaceID);

        if (w) {
          return {
            ...state,
            activeWorkspace: workspaceID,
          };
        }

        return state;
      },
      removeWorkspace(state, workspaceID: string) {
        return {
          ...state,
          workspaces: state.workspaces.filter(
            (w) => w.workspaceID !== workspaceID,
          ),
          activeWorkspace:
            state.activeWorkspace === workspaceID
              ? undefined
              : state.activeWorkspace,
        };
      },
      addChannels(state, workspaceID: string, channels: ChannelData[]) {
        const workspace = state.workspaces.find(
          (e) => e.workspaceID === workspaceID,
        );

        if (!workspace) {
          return state;
        }

        workspace.channels = workspace.channels.concat(channels);

        return state;
      },
      addMessage(
        state,
        workspaceID: string,
        channelID: string,
        message: MessageToAdd,
      ) {
        const channel = state.workspaces
          .find((e) => e.workspaceID === workspaceID)
          ?.channels.find((e) => e.channelID === channelID);

        if (!channel) {
          return state;
        }

        const lastMessage = channel.messages.at(-1);

        if (message.userID && lastMessage?.userID === message.userID) {
          lastMessage.entries.push(message);
        } else {
          channel.messages.push({
            id: message.id,
            userID: message.userID,
            username: message.username,
            entries: [message],
          } as SlackMessageGroup);
        }

        return state;
      },
      updateChannel(
        state,
        workspaceID: string,
        channelID: string,
        update: Partial<Omit<ChannelData, "info" | "channelID">>,
      ) {
        const channel = state.workspaces
          .find((e) => e.workspaceID === workspaceID)
          ?.channels.find((e) => e.channelID === channelID);

        if (!channel) {
          return state;
        }

        Object.assign(channel, update);

        return state;
      },
      updateMessage(
        state,
        workspaceID: string,
        channelID: string,
        messageID: string,
        update: (prev: SlackMessageGroupEntry) => SlackMessageGroupEntry,
      ) {
        const channel = state.workspaces
          .find((e) => e.workspaceID === workspaceID)
          ?.channels.find((e) => e.channelID === channelID);

        if (!channel) {
          return state;
        }

        for (let i = 0; i < channel.messages.length; i++) {
          const messageGroup = channel.messages[i]!;
          const entryIdx = messageGroup.entries.findIndex(
            (e) => e.id === messageID,
          );

          if (entryIdx !== -1) {
            messageGroup.entries[entryIdx] = update(
              messageGroup.entries[entryIdx]!,
            );
            break;
          }
        }

        return state;
      },
      openChannel(state, workspaceID: string, channelID: string) {
        return {
          ...state,
          activeChannel: [workspaceID, channelID],
        };
      },
    },
    selectors: {
      workspace(state, workspaceID: string) {
        return state.workspaces.find((e) => e.workspaceID === workspaceID);
      },
      activeWorkspace(state) {
        return state.workspaces.find(
          (e) => e.workspaceID === state.activeWorkspace,
        );
      },
      channel(state, workspaceID: string, channelID: string) {
        return state.workspaces
          .find((e) => e.workspaceID === workspaceID)
          ?.channels.find((i) => i.channelID === channelID);
      },
      workspaceChannels(state, workspaceID: string) {
        return state.workspaces.find((e) => e.workspaceID === workspaceID)
          ?.channels;
      },
    },
    // effect: (_: SlackStore, state: SlackStore) => {
    //   Logger.info("State updated", state);
    // },
  },
);
