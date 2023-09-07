import React, { createContext, useContext } from "react";
import { makeAutoObservable } from "mobx";
import { ASSISTANT_NAME, STORAGE_ACCESS_TOKEN } from "../utils/constants";
import { readVoice, sendMessage, textToVoice } from "../apis/chat";
import {
  cancellable,
  clearAudioWaitingList,
  playAudio,
  random,
  randomNum,
} from "../utils";
import Recorder from "js-audio-recorder";
import {
  getConversation,
  getConversationList,
  syncConversation,
} from "../apis/conversation";
import { aiApisRequest } from "../utils/request";
import { uploadFileDirectly } from "../apis/upload";
import { defaultAssistantId } from "../utils/config";
import { createStandaloneToast } from "@chakra-ui/react";

const { toast } = createStandaloneToast();
class Store {
  constructor() {
    makeAutoObservable(this);
    this.initRecordManager();

    // https://blog.csdn.net/hanchengmei/article/details/126262266
    // Taro.setInnerAudioOption({
    //   obeyMuteSwitch: false,
    // });
  }

  conversationList = {};
  conversation = null;
  user = null;
  isSending = false;
  sendingVoice = false;
  typingMessage = null;
  recorderManager = null;
  cancelTextToVoice = [];

  initRecordManager = () => {
    this.recorderManager = new Recorder({ compiling: true, sampleRate: 16000 });
  };

  login = async () => {
    localStorage.setItem(
      STORAGE_ACCESS_TOKEN,
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbGd0NGZ1YzYwMDNldnZwYXdwMzFvM3p2IiwiaWF0IjoxNjgyMjM2OTQwLCJleHAiOjE2ODI4NDE3NDB9.75iL4heK_yrY9Ezts-muiwD1hp1TTspWxKEUGiqIG8I"
    );
    this.user = { id: "clgt4fuc6003evvpawp31o3zv" };
    return { id: "clgt4fuc6003evvpawp31o3zv" };
  };

  getConversationList = async () => {
    toast({ title: "加载中..." });
    // check login
    if (!this.user) await this.login();
    const { data } = await getConversationList();
    this.conversationList = data.data;
    toast.closeAll();
    return data?.data;
  };

  getConversation = async (id, assistantId) => {
    // check login
    if (!this.user) await this.login();

    toast({ title: "加载中..." });
    const { data } = await getConversation(id, assistantId);

    if (data?.data && data?.data?.id === id) {
      this.conversation = data.data;
      localStorage.setItem(ASSISTANT_NAME, this.conversation?.Assistant?.name);
    }
    toast.closeAll();
    return data?.data;
  };

  newConversation = async (assistantId) => {
    toast({ title: "加载中..." });
    try {
      // check login
      if (!this.user) await this.login();

      const id = randomNum(10);
      await syncConversation(
        id,
        [],
        this.user?.id,
        assistantId || defaultAssistantId
      );
      return id;
    } finally {
      toast.closeAll();
    }
  };

  sendMessage = async (
    from,
    content,
    conversationId,
    parentMessageId,
    type,
    voiceUrl
  ) => {
    const curConv = this.conversation;
    const messageId = randomNum(10);
    if (!curConv) return;

    // Taro.showLoading({ title: "加载中..."})
    this.isSending = true;

    try {
      // check login
      if (!this.user) await this.login();

      // create message
      const msg = {
        messageId,
        parentMessageId,
        content,
        from,
        avatar: from === "me" ? this.user?.avatar : "",
        nickName: from === "me" ? this.user?.nickName : "小星",
        type,
        voiceInfo: voiceUrl,
      };

      if (conversationId) {
        msg.conversationId = conversationId;
      }

      curConv.messages.push(msg);
      this.conversation = curConv;

      console.log("curConv:", curConv);

      let res = (await sendMessage(msg, curConv.Assistant?.id, conversationId))
        .data;
      console.log("res:", res);

      if (res.code === 40012) {
        toast({
          title: "不要发敏感词～",
        });
        this.isSending = false;
        this.sendingVoice = false;
        return curConv.messages.pop();
      }

      if (res.code !== 200 || !res.data?.id) {
        toast({
          title: "服务器开小差啦 请稍后重试~",
        });
        this.isSending = false;
        this.sendingVoice = false;
        return curConv.messages.pop();
      }

      this.startPullingMessage(res.data.id);
    } catch (e) {
      // Taro.hideLoading()
      this.isSending = false;
    }

    return messageId;
  };

  clearPullTimer = () => {
    this.pullTimer.forEach((t) => clearTimeout(t));
  };

  clearTextToVoice = () => {
    this.cancelTextToVoice?.map?.((item) => item?.());
  };

  pullTimer = [];
  startPullingMessage = async (id) => {
    try {
      this.clearPullTimer();
      this.clearTextToVoice();
      clearAudioWaitingList();
      setTimeout(() => {
        this.pullingMessage(id);
      }, 1000);
    } catch (e) {
      console.log(e);
      this.typingMessage = null;
    }
  };

  pullingMessage = async (id) => {
    const res = await aiApisRequest.get("/message", {
      id,
    });

    if (res.data.content) {
      res.data.content = this._replaceAllBreakLine(res.data.content, " \n ");
    }

    this.typingMessage = res.data?.content;

    if (this.typingMessage && this.typingMessage.length > 0)
      this.isSending = false;

    console.log("[isFinish] rrrr:", res.data);

    if (!res.data) {
      return toast({
        title: "服务器开小差啦 请稍后重试~",
      });
    }

    const curConv = this.conversation;
    const foundMessage = curConv?.messages?.find(
      (item) => item.messageId === id
    );
    if (!foundMessage) {
      clearAudioWaitingList();
      this.processedSentences.clear();
      this.templateStore.length = 0;
      this.clearPullTimer();
      curConv?.messages.push({
        from: "them",
        content: res.data.content,
        messageId: id,
        conversationId: curConv.id,
        nickName: "小星",
        type: "text",
        avatar:
          "https://mtbird-cdn.staringos.com/product/images/staringai-logo.png",
      });
      this.isSending = false;
    } else {
      foundMessage.content = res.data.content;
      this.isSending = false;
    }

    if (res.data.content) {
      // 每次轮训都播放
      const { cancel, promise } = cancellable(
        this.textToVoice(id, res.data.content, res.data.isFinish)
      );
      this.cancelTextToVoice.push(cancel);
      await promise;
    }

    if (!res.data.isFinish) {
      this.pullTimer.push(
        setTimeout(() => {
          this.pullingMessage(id);
        }, 500)
      );
    } else {
      if (!curConv) return;
      this.typingMessage = null;
      syncConversation(curConv.id, curConv.messages, this.user?.id);
    }
  };

  uploadVoice = async (blob) => {
    // this.isSending = true
    const result = await uploadFileDirectly(blob, random() + ".mp3");
    console.log(result, "result");
    this.sendingVoice = decodeURIComponent(result);
    const dataResult = await readVoice(result);

    console.log("dataResult:", dataResult);
    this.sendingVoice = false;
    this.sendMessage(
      "me",
      dataResult.data.text || "测试文字",
      this.conversation?.id,
      this.conversation?.messages?.[this.conversation?.messages?.length - 1]
        ?.messageId || "",
      "voice",
      result
    );
  };

  _replaceAllBreakLine = (content, target = "") => {
    return content?.replace?.(/\n/g, target).replace(/\/n/g, target);
  };

  // _replaceAllBr = (content: any) => {
  //   return content?.replaceAll?.('<br />', "")
  // }

  _trimVoiceRawContent = (content, currentMessage) => {
    if (!currentMessage) return content;

    if (!currentMessage.voiceInfo?.length) return content;

    const targetContent = content
      .replace("", "")
      .replace(
        `${currentMessage.voiceInfo.map((item) => item.content).join("")}`,
        ""
      );

    return targetContent;
  };

  templateStore = [];
  processedSentences = new Set();
  textToVoice = async (messageId, text, isFinish) => {
    // if (!currentMessage) return
    // console.log('原始数据', text)
    // let finalContent = this._trimVoiceRawContent(text, currentMessage)
    // console.log('trim 数据', finalContent)

    // if (!finalContent) return ;

    let finalContent = text;
    this.templateStore.length = 0;
    this.templateStore.push(finalContent);
    const combinedContent = this.templateStore.join("");

    if (
      finalContent.includes("。") ||
      finalContent.includes("？") ||
      finalContent.includes("；")
    ) {
      // 使用正则表达式断句，获取句子的数组
      const sentences = combinedContent.split(/\s*[。？；]/);
      let last = sentences.pop();
      for (let index = 0; index < sentences.length; index++) {
        const sentence = sentences[index];
        // 判断句子是否已经处理过
        if (!this.processedSentences.has(sentence)) {
          await this.playVoice(messageId, sentence);

          // 将已处理句子添加到已处理 Set 中
          this.processedSentences.add(sentence);
        }
      }

      this.templateStore.length = 0;
      this.templateStore.push(last);
      this.templateStore = this.templateStore.filter(Boolean);
    } else if (isFinish && this.templateStore.length) {
      await this.playVoice(messageId, finalContent);
    }

    if (isFinish) {
      this.templateStore.length = 0;
      this.processedSentences = new Set();
    }
  };

  playVoice = async (messageId, sentence) => {
    const currentMessage = this.conversation?.messages?.find(
      (cur) => cur.messageId === messageId
    );
    const result = await textToVoice(
      this._replaceAllBreakLine(sentence).replace(/\n/g, ""),
      this.conversation?.id || ""
    );

    playAudio(result.data.data.link, true);

    currentMessage.type = "voice";

    if (Array.isArray(currentMessage.voiceInfo)) {
      currentMessage.voiceInfo.push({
        content: sentence,
        link: result.data.data.link,
      });
    } else {
      currentMessage.voiceInfo = [
        { content: sentence, link: result.data.data.link },
      ];
    }
  };
}

const StoreContext = createContext(new Store());

const StoreProvider = ({ store, children }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
);

const useStore = () => {
  return useContext(StoreContext);
};

export { Store, StoreProvider, useStore, StoreContext };
