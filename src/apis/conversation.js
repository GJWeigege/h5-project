import request from '../utils/request'

export const getConversation = (id, assistantId) => {
  return request.get('/conversation', {
    id,
    assistantId
  })
}

export const syncConversation = (id, messages, userId, assistantId) => {
  return request.post('/conversation', {
    id, messages, userId, assistantId
  })
}

// get conversation list
export const getConversationList = () => {
  return request.get('/user/conversations')
}