import "./style.css";
import { observer } from "mobx-react-lite";
import ReactMarkdown from "react-markdown";
import {
  audioContext,
  cancellable,
  clearAudioWaitingList,
  playAudio,
  playStatus,
} from "../../utils";
import { useRef, useState } from "react";
import { Box, Avatar, useToast, Icon } from "@chakra-ui/react";
import SvgAudioSvgrepoCom from "../../assets/AudioSvgrepoCom";
import image from "../../assets/user.jpg";

const Message = observer(({ message, isTyping }) => {
  const toast = useToast();

  const [isPlaying, setIsPlaying] = useState(false);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const cancellablePromise = useRef(null);

  const playVoiceList = async () => {
    // context.play()
    setIsPlaying(true);
    if (!message.voiceInfo?.length) return;
    for (let i = 0; i < message.voiceInfo.length; i++) {
      const link = message.voiceInfo[i].link;
      console.log(link, "link");
      link && (await playAudio(message.voiceInfo[i].link, false));
    }
  };

  const handleCopy = async () => {
    if (message.type === "voice") {
      try {
        if (isPlayingRef.current) {
          clearAudioWaitingList();
          audioContext.pause();
          audioContext.currentTime = 0;
          setIsPlaying(false);
          return;
        }

        audioContext.addEventListener("ended", function handleEvent(e) {
          console.log("onend");
          setIsPlaying(false);
          audioContext.removeEventListener("ended", handleEvent);
        });

        if (playStatus.waitingList.length) {
          clearAudioWaitingList();
          cancellablePromise.current?.();
        }

        const { promise, cancel } = cancellable(playVoiceList());
        cancellablePromise.current = cancel;
        await promise;

        return;
      } catch (e) {
        toast({
          title: e.message,
        });
      }
    }
  };
  const classNames =
    "messageWrapper" +
    " " +
    message.from +
    " " +
    (message.type === "voice" ? "voiceMessageWrapper" : "");

  return (
    <Box id={`m${message.messageId}`} className={classNames}>
      <Avatar
        className="messageAvatar"
        src={message.from === "them" ? image : message.avatar}
        size="md"
      />
      <Box className="messageRight">
        <Box className="messageContentWrapper">
          <Box className="messageContent" onClick={handleCopy}>
            {(!message.type || message.type === "text") && (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
            {message.type === "voice" && (
              <Icon
                className={"voiceIcon " + (isPlaying ? "playing" : "")}
                as={SvgAudioSvgrepoCom}
                w={6}
                h={6}
              ></Icon>
            )}
            {isTyping && <Box className="cursor"></Box>}
          </Box>
          {message.type === "voice" && (
            <Box className="voiceContentWrapper">
              <ReactMarkdown className="messageTime">
                {message.content}
              </ReactMarkdown>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
});

export default Message;
