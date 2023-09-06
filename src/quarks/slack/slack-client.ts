import type { WebClient } from "@slack/web-api";
import { quark } from "react-quarks";
import { SlackService } from "../../services/slack-service/slack-service";

type SlackWorkspace = {
  team: string;
  service: SlackService;
  socket: WebSocket;
};

export const SlackQuark = quark(
  {
    activeWorkspace: null as string | null,
    workspaces: [] as SlackWorkspace[],
  },
  {
    actions: {
      activateWorkspace(state, team: string, client: WebClient, ws: WebSocket) {
        return {
          ...state,
          activeWorkspace: team,
          workspaces: state.workspaces.concat({
            service: new SlackService(client),
            socket: ws,
            team,
          }),
        };
      },
      switchWorkspace(state, team: string) {
        if (state.workspaces.some((w) => w.team === team)) {
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
  }
);
