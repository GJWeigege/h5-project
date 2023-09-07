import profile from "./images/profile.jpg";
import videoSrc from "./images/ROKI.mp4";
import "./App.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import MessageListView from "./components/MessageListView";
import MessageVoiceInput from "./components/MessageVoiceInput";
import { Box } from "@chakra-ui/react";

function App() {
  const [conversationId, setConversationId] = useState("");

  const { newConversation } = useStore();
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef();

  const getConversationId = useCallback(async () => {
    const id = await newConversation();
    setConversationId(id);
  }, [newConversation]);

  useEffect(() => {
    getConversationId();
  }, [getConversationId]);

  var zBody = document.querySelector("html");

  // 轮询
  var zNum = 0; // 用户未操作页面时长
  var maxTime = 10;
  // 用户操作
  const handleDo = (params) => {
    setShowVideo(false);
    videoRef.current.pause();
    zNum = 0; // 用户操作了页面，初始化用户未操作页面时长，重新开始计时。
  };

  const debounce = (func, wait, params) => {
    let timeout;
    return function () {
      if (timeout) clearTimeout(timeout);
      let callNow = !timeout;
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
      if (callNow) func(params);
    };
  };

  useEffect(() => {
    var zTimer = setInterval(() => {
      zNum++;
      if (zNum >= maxTime && !showVideo) {
        console.log(999);
        setShowVideo(true);
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }, 1000);
    return () => {
      // 销毁组件时，移除定时器
      clearInterval(zTimer);
    };
  }, [maxTime, showVideo, zNum]);

  let handleDo2 = debounce(handleDo, 1000);
  useEffect(() => {
    zBody.addEventListener("click", handleDo2);
    zBody.addEventListener("keydown", handleDo2);
    zBody.addEventListener("mousemove", handleDo2);
    zBody.addEventListener("mousewheel", handleDo2);
    return () => {
      // 销毁组件时，移除监听事件
      zBody.removeEventListener("click", handleDo2);
      zBody.removeEventListener("keydown", handleDo2);
      zBody.removeEventListener("mousemove", handleDo2);
      zBody.removeEventListener("mousewheel", handleDo2);
    };
  }, [handleDo2, zBody]);

  return (
    <div className="App">
      <Box
        position="sticky"
        top={0}
        pt="3rem"
        bg="rgb(207, 211, 220)"
        zIndex={1}
      >
        <div className="header">
          <img src={profile} alt="profile" />
          <div className="header-content">
            <h2>ROKI 先生</h2>
            <span>老板电器AI烹饪助理</span>
          </div>
        </div>
        <div className="tip">
          <div>
            <p>可以问我任何关于美食的 “秘籍” 哦</p>
          </div>
        </div>
        <MessageVoiceInput conversationId={conversationId} />
      </Box>
      <MessageListView
        conversationId={conversationId}
        assistantId="clfwe1qtz00024zruzu2zy0bx"
      />

      <Box
        position="absolute"
        left="0"
        right="0"
        bottom="0"
        zIndex={3}
        display={showVideo ? "flex" : "none"}
        justifyContent="center"
        alignItems="center"
        background="black"
      >
        <video
          ref={videoRef}
          src={videoSrc}
          loop={true}
          style={{ height: "100vh" }}
        />
      </Box>
    </div>
  );
}

export default App;
