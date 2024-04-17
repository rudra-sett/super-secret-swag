import {
  ChatBotConfiguration,
  ChatBotHistoryItem,
  ChatBotMessageType,
  FeedbackData,
} from "../../components/chatbot/types";

import {
  assembleHistory
} from "../../components/chatbot/utils"
export class SessionsClient {

  async addSession(userId : string, sessionId : string, chatHistory : ChatBotHistoryItem[]) {
    await fetch('https://bu4z2a26c7.execute-api.us-east-1.amazonaws.com/user_session_handler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ "operation" : "add_session",
      "user_id" : userId,
      "session_id" : sessionId,
      "chat_history" : assembleHistory(chatHistory)})
    });
  }

  async updateSession(userId : string, sessionId : string, chatHistory : ChatBotHistoryItem[]) {
    console.log("updating session...")
    // console.log(userId);
    // console.log(sessionId);
    const response = await fetch('https://bu4z2a26c7.execute-api.us-east-1.amazonaws.com/user_session_handler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ "operation" : "update_session",
      "user_id" : userId,
      "session_id" : sessionId,
      "chat_history" : assembleHistory(chatHistory)})
    });
    const reader = response.body.getReader();
    const { value, done } = await reader.read();
    const decoder = new TextDecoder();        
    const output = decoder.decode(value);
    // console.log(JSON.parse(output));
    // return JSON.parse(output);
  }

  async getSessions(
    userId : string
  ) {
    const response = await fetch('https://bu4z2a26c7.execute-api.us-east-1.amazonaws.com/user_session_handler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ "operation" : "list_sessions_by_user_id","user_id" : userId })
    });
    const reader = response.body.getReader();
    const { value, done } = await reader.read();
    const decoder = new TextDecoder();        
    const output = decoder.decode(value);
    console.log(output);
    return JSON.parse(output);
  }

  async getSession(
    sessionId: string,
    userId: string,
  ) {
    const response = await fetch("https://bu4z2a26c7.execute-api.us-east-1.amazonaws.com/user_session_handler", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({"operation" : "get_session", "session_id" : sessionId,
        "user_id" : userId
       })
    });
    // console.log(response.body);
    const reader = response.body.getReader();
    const { value, done } = await reader.read();
    // console.log(value);
    const decoder = new TextDecoder();    
    // console.log(decoder.decode(value));    
    const output = JSON.parse(decoder.decode(value)).chat_history! as any[];
    var history: ChatBotHistoryItem[] = [];
    console.log(output);
    output.forEach(function (value) {
      history.push({
        type: ChatBotMessageType.Human,
        content: value.user,
        metadata: {          
        },
        tokens: [],
      },
      {
        type: ChatBotMessageType.AI,
        tokens: [],
        content: value.chatbot,
        metadata: {},
      },)
    }) 
    
    return history;
  }

  async deleteSession(
    sessionId: string,
    userId: string,
  ) {
    try {
      const response = await fetch('https://bu4z2a26c7.execute-api.us-east-1.amazonaws.com/user_session_handler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({"operation" : "delete_session", "session_id" : sessionId,
        "user_id" : userId
       })
      });
    } catch {
      return "FAILED";
    }
    return "DONE";
  }

}
