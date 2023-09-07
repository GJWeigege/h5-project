import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Input,
  Image,
  Button,
  useToast,
  Icon,
  Text,
} from "@chakra-ui/react";
import { useLongPress } from "use-long-press";
import "./style.css";
import { useStore } from "../../store";
import { observer } from "mobx-react-lite";
import { convertToMp3 } from "../../utils";
import SvgTelegram from "../../assets/send";
import SvgAlignCenterSvgrepoCom from "../../assets/SvgAlignCenterSvgrepoCom";

const MessageInput = observer(({ conversationId }) => {
  const {
    sendMessage,
    conversation,
    recorderManager,
    isSending,
    typingMessage,
    uploadVoice,
  } = useStore();
  const [active, setActive] = useState(false);
  const [inputWay, setInputWay] = useState("text");
  const [msg, setMsg] = useState(conversation?.Assistant?.defaultMessage || "");
  // const [isOpened, setIsOpened] = useState(false)
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const toast = useToast();

  const getPermissions = useCallback(async () => {
    const audioObj = {
      video: false,
      audio: true,
    };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(audioObj);
        if (stream.active) {
          setActive(true);
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      alert("没有麦克风配置");
    }
  }, []);

  useEffect(() => {
    getPermissions();
  }, [getPermissions]);

  useEffect(() => {
    if (conversation) {
      setMsg(conversation?.Assistant?.defaultMessage || "");
    }
  }, [conversation]);

  const handleInputChange = (val) => {
    setMsg(val.target.value);
  };

  function handleKeydown() {
    if (window.event.keyCode === 13) {
      handleSend();
    }
  }

  const handleSend = async () => {
    if (!msg || msg.trim().length === 0) {
      toast({
        title: "消息不能为空",
      });
      return;
    }

    const conv = conversation;

    setIsLoading(true);
    try {
      await sendMessage(
        "me",
        msg,
        conversationId,
        conv?.messages?.[conv?.messages?.length - 1]?.messageId || ""
      );
      setMsg("");
    } catch (e) {
      console.log("[handleSend] e:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputWayChange = () => {
    if (inputWay === "text") return setInputWay("voice");
    setInputWay("text");
  };

  const handleStartRecording = (e) => {
    e.preventDefault();
    console.log("start");
    if (isSending || typingMessage)
      return toast({ title: "思考中，请稍等..." });
    toast({ title: "录制中，说说你想聊什么..." });
    setIsRecording(true);
    recorderManager.start();
  };

  const handleStopRecording = (e) => {
    e.preventDefault();
    if (isSending || typingMessage) return;
    toast.closeAll();
    setIsRecording(false);

    if (recorderManager.duration < 1) {
      return toast({
        title: "录音时间太短",
        duration: 1000,
      });
    }
    if (recorderManager) {
      const mp3Blob = convertToMp3(recorderManager.getWAV(), recorderManager);

      uploadVoice(mp3Blob);
    }
  };

  const callback = useCallback(() => {
    console.log(true);
  }, []);

  const bind = useLongPress(callback, {
    onStart: handleStartRecording,
    onFinish: handleStopRecording,
    threshold: 100,
    captureEvent: true,
    cancelOnMovement: 10,
    detect: "pointer",
  });

  const voiceImage = require("../../assets/mic.png");

  return (
    <Box className="messageInputWrapper">
      <Box className="textMessageInputWrapper">
        <Input
          className="messageInput"
          name=""
          placeholder="请输入内容..."
          value={msg}
          onKeyDown={handleKeydown}
          onInput={handleInputChange}
          onFocus={() => {
            setInputWay("text");
          }}
          maxlength={3000}
          disabled={isLoading}
        />
        {/* <Button
          variant="primary"
          onClick={handleInputWayChange}
          disabled={isLoading}
          border="1px solid #9a9b9e"
          w={20}
          ml={2.5}
          color="#9b9b9b"
          bg="rgb(233,233,233)"
        >
          <Icon
            transform="rotate(90deg)"
            as={SvgAlignCenterSvgrepoCom}
            w={6}
            h={20}
          />
        </Button> */}
        <Button
          className="messageSendButton"
          variant="primary"
          onClick={handleSend}
          disabled={isLoading}
        >
          <Icon as={SvgTelegram} w={10} h={10} />
        </Button>
      </Box>
      {active && inputWay === "voice" ? (
        <>
          <Image src={voiceImage} className="voiceIcon" {...bind()} />
          <Text fontSize="18px">长按录制语音</Text>
        </>
      ) : (
        <Box w="100%" h="288px"></Box>
      )}
      {isRecording && (
        <Image
          className="voiceRecordingIcon"
          src={require("../../assets/vv.gif")}
        />
      )}
    </Box>
  );
});

export default MessageInput;
