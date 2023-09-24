import { ComponentModule } from "react-better-components";
import type { SlackStore } from "../quarks/slack/slack-quark";
import { SlackQuark } from "../quarks/slack/slack-quark";
import { SlackChannelService } from "../services/channel-service/channels-service";
import { $quark } from "../utils/quarks";

const selectActiveChannelService = (s: SlackStore) => {
  // return s.workspaces.find((w) => w.channels.find(channel => channel.));
  const [workspaceID, channelID] = s.activeChannel ?? [];

  if (!workspaceID || !channelID) {
    return;
  }

  for (const workspace of s.workspaces) {
    if (workspace.workspaceID === workspaceID) {
      const data = workspace.channels.find(
        (channel) => channel.channelID === channelID,
      );

      const service = SlackChannelService.getChannelService(
        workspaceID,
        channelID,
      );

      if (!service || !data) {
        throw new Error("Impossible situation.");
      }

      return {
        service,
        data,
      };
    }
  }
};

export class $ChannelService extends ComponentModule {
  private channel = $quark(this, SlackQuark, selectActiveChannelService);

  constructor(params: any) {
    super(params);
  }

  public service() {
    return this.channel.get()?.service;
  }

  public data() {
    return this.channel.get()?.data;
  }
}
