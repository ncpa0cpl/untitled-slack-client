import { createImmerMiddleware, quark } from "react-quarks";

export type EmojiIndexEntry = {
  emojiID: string;
  fileLocation: string;
};

export type EmojiIndexStore = {
  workspaces: Array<{
    workspaceID: string;
    emojis: Array<EmojiIndexEntry>;
  }>;
};

export const EmojiIndex = quark({ workspaces: [] } as EmojiIndexStore, {
  middlewares: [createImmerMiddleware()],
  actions: {
    addEmojis(
      state,
      workspaceID: string,
      emojis: Array<{ emojiID: string; fileLocation: string }>,
    ) {
      let workspace = state.workspaces.find(
        (ws) => ws.workspaceID === workspaceID,
      );

      if (!workspace) {
        workspace = {
          workspaceID,
          emojis: [],
        };
        state.workspaces.push(workspace);
      }

      workspace.emojis = workspace.emojis.concat(emojis);

      return state;
    },
  },
  selectors: {
    emoji(state, workspaceID: string, emojiID: string) {
      const workspace = state.workspaces.find(
        (ws) => ws.workspaceID === workspaceID,
      );

      if (!workspace) {
        return;
      }

      return workspace.emojis.find((emoji) => emoji.emojiID === emojiID);
    },
    allFromWorkspace(state, workspaceID: string) {
      const workspace = state.workspaces.find(
        (ws) => ws.workspaceID === workspaceID,
      );

      if (!workspace) {
        return [];
      }

      return workspace.emojis;
    },
  },
});
