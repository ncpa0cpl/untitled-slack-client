import React from "react";
import { Pressable } from "react-gjs-renderer";

export const MouseTracker = (props: JSX.IntrinsicElements["PRESSABLE"]) => {
  const { onMouseEnter, onMouseLeave, ...rest } = props;

  const [nextEvent, setNextEvent] = React.useState({
    event: null as
      | null
      | Parameters<Exclude<typeof onMouseEnter, undefined>>[0],
    isMousedOver: false,
  });

  const state = React.useRef(false);

  const handleMouseEnter = React.useCallback(() => {
    state.current = true;
    setTimeout(() => {
      if (state.current) {
        setNextEvent({
          event: null,
          isMousedOver: true,
        });
      }
    }, 200);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    state.current = false;
    setTimeout(() => {
      if (!state.current) {
        setNextEvent({
          event: null,
          isMousedOver: false,
        });
      }
    }, 200);
  }, []);

  React.useEffect(() => {
    if (nextEvent.isMousedOver) {
      onMouseEnter?.(nextEvent.event!);
    } else {
      onMouseLeave?.(nextEvent.event!);
    }
  }, [nextEvent]);

  return (
    <Pressable
      {...rest}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
};
