import React from "react";
import { Align, Orientation, Paned } from "react-gjs-renderer";
import type { SlackStore } from "../../quarks/slack/slack-client";
import { SlackQuark } from "../../quarks/slack/slack-client";
import { UserQuark } from "../../quarks/user";
import { Component } from "../../utils/custom-component";
import { Logger } from "../../utils/logger";
import { $quark } from "../../utils/quarks";
import { ConversationList } from "./sub-components/conversation-list/conversation-list";
import { ConversationBox } from "./sub-components/conversation/conversation";

const selectActiveWorkspaceService = (state: SlackStore) =>
  state.workspaces.find((w) => w.team === state.activeWorkspace)?.service;

export class Chat extends Component {
  private slackService = $quark(this, SlackQuark, selectActiveWorkspaceService);
  private currentUser = $quark(this, UserQuark);

  constructor(props: any) {
    super(props);

    this.$effect(() => {
      const service = this.slackService.get();
      if (!service) {
        Logger.info(
          "Slack service not available, channels cannot be retrieved.",
        );
        return;
      }

      Logger.info("Retrieving channels.");

      service.channels
        .getAllConversations()
        .then(() => service.channels.getConversationsInfo())
        .catch(Logger.error);
    }, [this.slackService]);
  }

  render() {
    if (!this.currentUser.get().loggedIn) {
      return null;
    }

    return (
      <Paned
        expand
        verticalAlign={Align.FILL}
        horizontalAlign={Align.FILL}
        orientation={Orientation.HORIZONTAL}
      >
        <ConversationList />
        <ConversationBox />
      </Paned>
    );
  }
}
