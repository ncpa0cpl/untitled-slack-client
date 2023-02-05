import type Gtk from "gi://Gtk";
import React from "react";
import {
  Align,
  Box,
  Label,
  Orientation,
  PositionType,
  ScrollBox,
  Spinner,
} from "react-gjs-renderer";
import type { ScrollBoxEvent } from "react-gjs-renderer/dist/gjs-elements/gtk3/scroll-box/scroll-box";
import { ActiveConversation } from "../../../../quarks/conversations";
import type { SlackMessage } from "../../../../services/slack-service/slack-service";
import { SlackService } from "../../../../services/slack-service/slack-service";
import { MessageBox } from "./message";

export const ConversationBox = () => {
  const adjustmentRef = React.useRef<Gtk.Adjustment | null>(null);
  const isFirstUserScroll = React.useRef(true);
  const positionFromBottom = React.useRef(0);
  const loadingInProgress = React.useRef(false);

  const currentConversation = ActiveConversation.use();

  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<any>(null);
  const [messages, setMessages] = React.useState<SlackMessage[]>([]);
  const [cursor, setCursor] = React.useState<string | undefined>();

  const scrollTo = (value: number) => {
    setTimeout(() => {
      if (adjustmentRef.current) {
        adjustmentRef.current.set_value(value);
      }
    });
  };

  const scrollHandler = React.useCallback((e: ScrollBoxEvent) => {
    if (loadingInProgress.current) {
      e.preventDefault();
    }

    if (isFirstUserScroll.current) {
      isFirstUserScroll.current = false;
    }

    if (adjustmentRef.current) {
      positionFromBottom.current =
        adjustmentRef.current.get_upper() - adjustmentRef.current.get_value();
    }
  }, []);

  const contentSizeChangeHandler = React.useCallback(() => {
    const adjustment = adjustmentRef.current;
    if (!adjustment) return;

    if (isFirstUserScroll.current) {
      scrollTo(adjustment.get_upper());
    } else {
      const newPositionFromTop =
        adjustment.get_upper() - positionFromBottom.current;
      scrollTo(newPositionFromTop);
    }
  }, []);

  const loadMessages = React.useCallback(
    (nextCursor?: string, reset = false) => {
      if (!currentConversation.value || loadingInProgress.current)
        return Promise.resolve();

      loadingInProgress.current = true;

      setIsLoading(true);
      setLoadError(null);

      if (reset) {
        setMessages([]);
        setCursor(undefined);
        isFirstUserScroll.current = true;
      }

      return new Promise<void>(async (resolve) => {
        try {
          const response = await SlackService.fetchMessages(
            currentConversation.value!,
            nextCursor
          );

          setMessages((current) => [...response.messages, ...current]);
          setCursor(response.cursor);
        } catch (err) {
          setLoadError(err);
        } finally {
          setIsLoading(false);
          setTimeout(() => {
            loadingInProgress.current = false;
            resolve();
          }, 100);
        }
      });
    },
    [currentConversation.value]
  );

  React.useEffect(() => {
    loadMessages(undefined, true).then(() => {
      isFirstUserScroll.current = true;
    });
  }, [currentConversation.value]);

  return (
    <Box expand verticalAlign={Align.FILL} horizontalAlign={Align.FILL}>
      {isLoading && (
        <Box
          expand={messages.length === 0}
          verticalAlign={Align.CENTER}
          horizontalAlign={Align.CENTER}
        >
          <Spinner margin={[15, 0]} />
        </Box>
      )}
      {messages.length > 0 && (
        <ScrollBox
          ref={(elem) => {
            if (elem) {
              adjustmentRef.current = elem.widget.get_vadjustment();
            }
          }}
          onScroll={scrollHandler}
          onContentSizeChange={contentSizeChangeHandler}
          onEdgeReached={(e) => {
            if (e.position === PositionType.TOP) {
              loadMessages(cursor);
            }
          }}
          expand
          verticalAlign={Align.FILL}
          horizontalAlign={Align.FILL}
        >
          <Box
            expand
            orientation={Orientation.VERTICAL}
            margin={[0, 0, 15]}
            verticalAlign={isLoading ? Align.CENTER : Align.END}
            horizontalAlign={Align.FILL}
          >
            {loadError ? (
              <Label
                verticalAlign={Align.CENTER}
                horizontalAlign={Align.CENTER}
              >
                Failed to load the conversation's messages.
              </Label>
            ) : (
              messages.map((message) => (
                <MessageBox
                  key={message.id}
                  markdown={message.markdown}
                  userID={message.userID}
                  username={message.username}
                />
              ))
            )}
          </Box>
        </ScrollBox>
      )}
    </Box>
  );
};
