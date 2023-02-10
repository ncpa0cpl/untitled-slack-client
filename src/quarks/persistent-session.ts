import { quark } from "react-quarks";
import { QuarkFileSyncService } from "../services/quark-file-sync-service/quark-file-sync-service";

export const PersistentSession = quark(
  {
    firsLoadCompleted: false,
    lastActiveConversation: undefined as string | undefined,
  },
  {
    actions: {
      setLastActiveConversation(state, conversationId: string | undefined) {
        return {
          ...state,
          lastActiveConversation: conversationId,
        };
      },
    },
  }
);

QuarkFileSyncService.registerQuark("persistent-session", PersistentSession);
