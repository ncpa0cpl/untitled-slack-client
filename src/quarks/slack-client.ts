import type { WebClient } from "@slack/web-api";
import { quark } from "react-quarks";

export const SlackClient = quark({
  client: null as WebClient | null,
});
