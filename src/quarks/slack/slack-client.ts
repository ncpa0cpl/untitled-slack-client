import type { WebClient } from "@slack/web-api";
import { quark } from "react-quarks";
import { SlackChannelService } from "../../services/channel-service/channels-service";
import { SlackService } from "../../services/slack-service/slack-service";
import { ActiveSlackChannelService } from "./conversations";

type SlackWorkspace = {
  team: string;
  service: SlackService;
  socket: WebSocket;
  channelService: SlackChannelService;
};

export type SlackStore = {
  activeWorkspace: string | null;
  workspaces: SlackWorkspace[];
};

export const SlackQuark = quark(
  {
    activeWorkspace: null,
    workspaces: [],
  } as SlackStore,
  {
    actions: {
      activateWorkspace(state, team: string, client: WebClient, ws: WebSocket) {
        const service = new SlackService(client);

        const channelService = new SlackChannelService(service, ws);
        ActiveSlackChannelService.set({ service: channelService });

        return {
          ...state,
          activeWorkspace: team,
          workspaces: state.workspaces.concat({
            channelService,
            socket: ws,
            service,
            team,
          }),
        };
      },
      switchWorkspace(state, team: string) {
        const w = state.workspaces.find((w) => w.team === team);
        if (w) {
          ActiveSlackChannelService.set({ service: w.channelService });
          return {
            ...state,
            activeWorkspace: team,
          };
        }

        return state;
      },
      removeWorkspace(state, team: string) {
        return {
          ...state,
          workspaces: state.workspaces.filter((w) => w.team !== team),
          activeWorkspace:
            state.activeWorkspace === team ? null : state.activeWorkspace,
        };
      },
    },
  },
);
