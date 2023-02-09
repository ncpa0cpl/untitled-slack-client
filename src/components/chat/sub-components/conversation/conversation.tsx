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
import { SlackClient } from "../../../../quarks/slack-client";
import type { SlackMessage } from "../../../../services/slack-service/slack-service";
import { SlackService } from "../../../../services/slack-service/slack-service";
import { ConversationHeader } from "./conversation-header";
import { MessageBox } from "./message";

export const ConversationBox = () => {
  const scrollBoxRef = React.useRef<Rg.Element.ScrollBoxElement | null>(null);
  const isFirstUserScroll = React.useRef(true);
  const lastPosFromBottom = React.useRef(0);
  const loadingInProgress = React.useRef(false);
  const ws = React.useRef<WebSocket | null>(null);

  const currentConversation = ActiveConversation.use();
  const slackClient = SlackClient.use();

  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<any>(null);
  const [messages, setMessages] = React.useState<SlackMessage[]>([]);
  const [cursor, setCursor] = React.useState<string | undefined>();

  const scrollHandler = React.useCallback((e: ScrollBoxEvent) => {
    if (loadingInProgress.current) {
      e.preventDefault();
    }

    isFirstUserScroll.current = false;

    if (scrollBoxRef.current) {
      lastPosFromBottom.current =
        scrollBoxRef.current.currentPosition("bottom");
    }
  }, []);

  const contentSizeChangeHandler = React.useCallback(() => {
    const scrollBox = scrollBoxRef.current;
    if (!scrollBox) return;

    if (isFirstUserScroll.current) {
      scrollBox.scrollTo(0, "bottom");
    } else {
      scrollBox.scrollTo(lastPosFromBottom.current, "bottom");
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
            currentConversation.value!.id,
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
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    if (slackClient.value.client) {
      loadMessages(undefined, true)
        .then(async () => {
          isFirstUserScroll.current = true;

          // const context = await slackClient.value.client?.rtm.connect();

          // if (context && context.ok) {
          //   ws.current = new WebSocket(context!.url!);
          //   ws.current.onmessage = (e) => {
          //     console.log(e.data);
          //   };
          // }
        })
        .catch(console.error);
    }
  }, [currentConversation.value, slackClient.value.client]);

  return (
    <Box expand verticalAlign={Align.FILL} horizontalAlign={Align.FILL}>
      <ConversationHeader title={currentConversation.value?.name ?? ""} />
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
          ref={scrollBoxRef}
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
              messages.map((message, i) => (
                <MessageBox
                  key={message.id}
                  markdown={message.markdown}
                  userID={message.userID}
                  username={message.username}
                  sentAt={message.timestamp}
                  subthread={
                    i === messages.length - 1 ? [{} as any] : undefined
                  }
                />
              ))
            )}
          </Box>
        </ScrollBox>
      )}
    </Box>
  );
};
