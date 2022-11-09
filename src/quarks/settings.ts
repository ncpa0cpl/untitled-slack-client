import { quark } from "react-quarks";
import { QuarkFileSyncService } from "../services/quark-file-sync-service/quark-file-sync-service";

export enum NotificationMode {
  None = "none",
  All = "all",
  MentionsAndDM = "mentions_and_dm",
}

export enum ThreadDisplayMode {
  Sidebar = "sidebar",
  Windowed = "windowed",
  UnderMessage = "under_message",
}

export type Settings = {
  notificationMode: NotificationMode;
  timeZone: string;
  threadDisplayMode: ThreadDisplayMode;
};

export const SettingsQuark = quark({
  threadDisplayMode: ThreadDisplayMode.UnderMessage,
  notificationMode: NotificationMode.MentionsAndDM,
  timeZone: "Europe/Warsaw", // TODO: get from OS
} as Settings);

QuarkFileSyncService.registerQuark("client_settings", SettingsQuark);
