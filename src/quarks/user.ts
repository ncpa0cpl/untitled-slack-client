import { quark } from "react-quarks";
import { QuarkFileSyncService } from "../services/quark-file-sync-service/quark-file-sync-service";

export type User = {
  firsLoadCompleted: boolean;
  loggedIn: true;
  id: string;
  accessToken: string;
  email: string;
  teamID: string;
  name: string;
  realName?: string;
  displayName?: string;
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

type UserState =
  | User
  | { loggedIn: false; firsLoadCompleted: boolean; id?: undefined };

export const SlackUser = quark({ loggedIn: false } as UserState);

QuarkFileSyncService.registerQuark("current_user", SlackUser);
