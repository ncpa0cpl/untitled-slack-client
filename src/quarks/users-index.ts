import { quark } from "react-quarks";
import { QuarkFileSyncService } from "../services/quark-file-sync-service/quark-file-sync-service";

export type UserInfo = {
  id: string;
  name: string;
  email: string;
  teamID: string;
  color?: string;
  phone?: string;
  image: {
    original?: string;
    px1024?: string;
    px512?: string;
    px192?: string;
    px72?: string;
    px48?: string;
    px32?: string;
    px24?: string;
  };
};

export const UsersIndex = quark(
  {
    firsLoadCompleted: false,
    users: [] as UserInfo[],
  },
  {
    actions: {
      addUser: (state, user: UserInfo) => {
        return {
          ...state,
          users: state.users.filter((u) => u.id !== user.id).concat([user]),
        };
      },
    },
    selectors: {
      useUser: (state, id?: string) => {
        if (!id) {
          return;
        }
        return state.users.find((u) => u.id === id);
      },
    },
  }
);

QuarkFileSyncService.registerQuark("users-index", UsersIndex);
