import { ComponentModule } from "react-better-components";
import { ActiveSlackChannelService } from "../quarks/slack/conversations";
import type { SlackChannelService } from "../services/channel-service/channels-service";
import { Reactive } from "../utils/reactive";

class ChannelServiceProxy extends Reactive {
  @Reactive.property
  private _service?: SlackChannelService;

  constructor() {
    super();

    ActiveSlackChannelService.subscribe((state) => {
      this.setService(state.service);
    });
  }

  setService(service?: SlackChannelService) {
    if (this._service) {
      this._service["parent"] = undefined;
    }

    if (service) {
      service["parent"] = this;
    }

    this._service = service;
  }

  public get service() {
    return this._service;
  }
}

const channelServiceProxy = new ChannelServiceProxy();

export class $ChannelService extends ComponentModule {
  private value?: SlackChannelService;

  constructor(params: any) {
    super(params);

    this.value = channelServiceProxy.service;
    this.$effect(() => {
      const unsubscribe = channelServiceProxy.on("changed", () => {
        this.handleUpdate();
      });
      return unsubscribe;
    }, []);
  }

  private handleUpdate() {
    this.value = channelServiceProxy.service;
    this["_main"].forceUpdate();
  }

  public get() {
    return this.value;
  }
}
