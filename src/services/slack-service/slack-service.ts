import { SlackClient } from "../../quarks/slack/slack-client";
import { SlackAuthorizationService } from "./modules/slack-authorization-service";
import { SlackChannelsService } from "./modules/slack-channels-service";
import { SlackUsersService } from "./modules/slack-users-service";

export type SlackMessage =
  | {
      id: string;
      markdown: string;
      userID: string;
      username?: undefined;
      timestamp?: number;
    }
  | {
      id: string;
      markdown: string;
      userID?: undefined;
      username: string;
      timestamp?: number;
    };

class SlackServiceImpl {
  auth = new SlackAuthorizationService(this);

  users = new SlackUsersService(this);

  channels = new SlackChannelsService(this);

  getClient() {
    const state = SlackClient.get();
    if (!state.client) {
      throw new Error("Slack client not initialized");
    }
    return state.client;
  }
}

export const SlackService = new SlackServiceImpl();
