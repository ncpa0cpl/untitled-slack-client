import type { WebClient } from "@slack/web-api";
import { quark } from "react-quarks";

export const SlackClientQuark = quark({
  client: null as WebClient | null,
});
