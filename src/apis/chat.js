import request from "../utils/request";
import { isVectorSearch, vectorCollectionName } from "../utils/config";

export const sendMessage = (message, assistantId, conversationId) => {
  return request.get(`/chat`, {
    ...message,
    msg: message.content,
    isVector: isVectorSearch,
    conversationId,
    assistantId,
    vectorCollectionName,
  });
};

export const getMessage = (id) => {
  return request.get(`/message`, {
    id,
  });
};

export const readVoice = (url) => {
  return request.get(`/voice/voiceToText`, {
    url,
  });
};

export const textToVoice = (text, conversationId) => {
  return request.get(`/voice/textToVoice`, {
    text,
    conversationId,
  });
};
