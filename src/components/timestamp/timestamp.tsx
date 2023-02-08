import { DateTime } from "luxon";
import React from "react";
import { Align, Popover, PositionType, Span } from "react-gjs-renderer";
import { AppMarkup } from "../app-markup/app-markup";
import { MouseTracker } from "../mouse-tracker/mouse-tracker";

export type TimestampProps = {
  timestamp: number;
};

const FONT_SIZE_MULTIPLIER = 0.875;

export const Timestamp = (props: TimestampProps) => {
  const formattedShortTime = React.useMemo(() => {
    const date = DateTime.fromMillis(props.timestamp).toLocal();

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
      } ago at ${date.toLocaleString(DateTime.TIME_SIMPLE)}`;
    };

    const diff = now.diff(date, ["years", "months", "weeks", "days"]);
    if (diff.years > 0) {
      return format(diff.years, "year");
    } else if (diff.months > 0) {
      return format(diff.months, "month");
    } else if (diff.weeks > 0) {
      return format(diff.weeks, "week");
    } else if (diff.days >= 1) {
      if (diff.days < 2) {
        return `Yesterday at ${date.toLocaleString(DateTime.TIME_SIMPLE)}`;
      }
      return format(diff.days, "day");
    }

    return date.toLocaleString(DateTime.TIME_SIMPLE);
  }, [props.timestamp]);

  const formattedFullDateTime = React.useMemo(() => {
    const date = DateTime.fromMillis(props.timestamp).toLocal();
    return date.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);
  }, [props.timestamp]);

  return (
    <Popover
      verticalAlign={Align.CENTER}
      isModal={false}
      position={PositionType.TOP}
      renderPopover={() => (
        <AppMarkup fontSizeMultiplier={FONT_SIZE_MULTIPLIER} margin={[6, 12]}>
          {formattedFullDateTime}
        </AppMarkup>
      )}
      renderAnchor={(open, hide) => (
        <MouseTracker
          verticalAlign={Align.CENTER}
          onMouseEnter={open}
          onMouseLeave={hide}
        >
          <AppMarkup fontSizeMultiplier={FONT_SIZE_MULTIPLIER} margin={[0, 10]}>
            <Span alpha={"80%"} underline="single">
              {formattedShortTime}
            </Span>
          </AppMarkup>
        </MouseTracker>
      )}
    />
  );
};
