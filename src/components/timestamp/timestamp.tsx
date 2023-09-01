import { DateTime } from "luxon";
import React from "react";
import { PureBetterComponent } from "react-better-components";
import { Align, Popover, PositionType, Span } from "react-gjs-renderer";
import { AppMarkup } from "../app-markup/app-markup";
import { FontSize } from "../font-size/font-size-context";
import { MouseTracker } from "../mouse-tracker/mouse-tracker";

export type TimestampProps = {
  timestamp: number;
};

const FONT_SIZE_MULTIPLIER = (prev: number) => prev * 0.875;

export class Timestamp extends PureBetterComponent<TimestampProps> {
  private formatted = this.$computed(
    () => this.getFormatted(),
    [this.depend.timestamp]
  );

  private getFormatted() {
    const datetime = DateTime.fromSeconds(this.props.timestamp).toLocal();

    /**
     * If the timestamp is within last week - show "x days ago at
     * hh:mm" If the timestamp is within last month - show "x
     * weeks ago at hh:mm" If the timestamp is within last year -
     * show "x months ago at hh:mm" Othwerwise - show "x years
     * ago at hh:mm"
     */
    const now = DateTime.local();

    const format = (value: number, unit: string) => {
      value = Math.round(value);

      return `${value.toFixed(0)} ${unit}${
        value > 1 ? "s" : ""
      } ago at ${datetime.toLocaleString(DateTime.TIME_SIMPLE)}`;
    };

    let short = "";
    const diff = now.diff(datetime, ["years", "months", "weeks", "days"]);
    if (diff.years > 0) {
      short = format(diff.years, "year");
    } else if (diff.months > 0) {
      short = format(diff.months, "month");
    } else if (diff.weeks > 0) {
      short = format(diff.weeks, "week");
    } else if (diff.days >= 1) {
      if (diff.days < 2) {
        short = `Yesterday at ${datetime.toLocaleString(DateTime.TIME_SIMPLE)}`;
      } else {
        short = format(diff.days, "day");
      }
    } else {
      short = datetime.toLocaleString(DateTime.TIME_SIMPLE);
    }

    const full = datetime.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);

    return { short, full };
  }

  render() {
    return (
      <FontSize size={FONT_SIZE_MULTIPLIER}>
        <Popover
          verticalAlign={Align.CENTER}
          isModal={false}
          position={PositionType.TOP}
          renderPopover={() => (
            <AppMarkup margin={[6, 12]}>{this.formatted.get().full}</AppMarkup>
          )}
          renderAnchor={(open, hide) => (
            <MouseTracker
              verticalAlign={Align.CENTER}
              onMouseEnter={open}
              onMouseLeave={hide}
            >
              <AppMarkup margin={[0, 10]}>
                <Span alpha={"80%"} underline="single">
                  {this.formatted.get().short}
                </Span>
              </AppMarkup>
            </MouseTracker>
          )}
        />
      </FontSize>
    );
  }
}
