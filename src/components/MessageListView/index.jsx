import Message from "../Message";
import "./style.css";
import { useStore } from "../../store";
import { useCallback, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Box } from "@chakra-ui/react";

const MessageListView = observer(({ conversationId, assistantId }) => {
  const scrollViewRef = useRef(null);
  const {
    conversation,
    getConversation,
    isSending,
    typingMessage,
    sendingVoice,
  } = useStore();
  const curConv = conversation;

  const init = useCallback(async () => {
    if (!conversationId) return;
    await getConversation(conversationId, assistantId);
  }, [assistantId, conversationId, getConversation]);

  const scrollToBottom = useCallback(() => {
    scrollViewRef?.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    init();
  }, [conversationId, init]);

  useEffect(() => {
    scrollToBottom();
  }, [curConv?.messages, scrollToBottom, isSending, typingMessage]);

  return (
    <Box className="messageListWrapper">
      <Box className="messageListContainer">
        {curConv?.messages.map((cur, i) => {
          if (cur.content === typingMessage) return null;
          return <Message message={cur} key={i} />;
        })}

        {sendingVoice && (
          <Message
            message={{
              content: "语音识别中，请稍等...",
              avatar: "",
              from: "me",
              nickName: "",
              messageId: "Loading",
              parentMessageId: "",
              conversationId: "",
              type: "voice",
              voiceInfo: [{ link: sendingVoice }],
            }}
          />
        )}

        {isSending && (
          <Message
            message={{
              content: "思考中，请稍等...",
              avatar: "",
              from: "them",
              nickName: "ChatGPT",
              messageId: "Loading",
              parentMessageId: "",
              conversationId: "",
            }}
            isTyping
          />
        )}

        {typingMessage && (
          <Message
            message={{
              content: typingMessage,
              avatar: "",
              from: "them",
              nickName: "ChatGPT",
              messageId: "Loading",
              parentMessageId: "",
              conversationId: "",
            }}
            isTyping
          />
        )}

        <div ref={scrollViewRef}></div>
      </Box>
    </Box>
  );
});

export default MessageListView;
