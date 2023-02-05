import { quark } from "react-quarks";
import { QuarkFileSyncService } from "../../services/quark-file-sync-service/quark-file-sync-service";

export const FontSettings = quark(
  {
    firsLoadCompleted: false,
    msgSize: 12,
    uiSize: 12,
  },
  {
    actions: {
      setMsgSize(state, size: number) {
        return { ...state, msgSize: size };
      },
      setUiSize(state, size: number) {
        return { ...state, uiSize: size };
      },
    },
    selectors: {
      useMsgSettings(state) {
        return state.msgSize;
      },
      useUiSettings(state) {
        return state.uiSize;
      },
    },
  }
);

QuarkFileSyncService.registerQuark("font-settings", FontSettings);
