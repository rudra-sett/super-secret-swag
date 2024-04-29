import {
  ChatBotHistoryItem,
  ChatBotMessageType,
} from "../../components/chatbot/types";

import {
  assembleHistory
} from "../../components/chatbot/utils"
export class SessionsClient {

  // Adds a new session (NOT USED)
  async addSession(userId: string, sessionId: string, chatHistory: ChatBotHistoryItem[]) {
    await fetch('https://bu4z2a26c7.execute-api.us-east-1.amazonaws.com/user_session_handler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "operation": "add_session",
        "user_id": userId,
        "session_id": sessionId,
        "chat_history": assembleHistory(chatHistory)
      })
    });
  }

  // Updates the current session (NOT USED)
  async updateSession(userId: string, sessionId: string, chatHistory: ChatBotHistoryItem[]) {
    console.log("updating session...")
    const response = await fetch('https://bu4z2a26c7.execute-api.us-east-1.amazonaws.com/user_session_handler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "operation": "update_session",
        "user_id": userId,
        "session_id": sessionId,
        "chat_history": assembleHistory(chatHistory)
      })
    });
    const reader = response.body.getReader();
    const { value, done } = await reader.read();
    const decoder = new TextDecoder();
    const output = decoder.decode(value);
    // console.log(JSON.parse(output));
    // return JSON.parse(output);
  }

  // Gets all sessions tied to a given user ID
  // Return format: [{"session_id" : "string", "user_id" : "string", "time_stamp" : "dd/mm/yy", "title" : "string"}...]
  /**
   * This method fetches all session data for a given user from the server.
   * It now includes error handling to deal with issues like network failures or bad responses from the server.
   * We use a try-catch block to catch any errors during the fetch operation.
   * We also check the response's status to make sure it was successful. If not, we throw an error.
   * If there's an error, we log it and return an error object, letting the front-end know something went wrong.
   */
  async getAllSessions(userId: string) {
    try {
      const response = await fetch('https://bu4z2a26c7.execute-api.us-east-1.amazonaws.com/user_session_handler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "operation": "list_sessions_by_user_id", "user_id": userId })
      });

      if (!response.ok) {  // Check if response is successful (HTTP status is in the range 200-299)
        throw new Error(`Failed to fetch session history: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();  // Assuming the server responds with JSON
      return data;
    } catch (error) {
      console.error('Error fetching session history:', error);
      // Return an error object or throw it to be handled by the calling function
      return { error: true, message: error.message };
    }
  }

  // Returns a chat history given a specific user ID and session ID
  // Return format: a list of ChatBotHistoryItems
  /**
   * Fetches a single session's chat history from the server. 
   * This method has been updated to include error handling to manage different failure scenarios effectively.
   * The fetch operation is wrapped in a try-catch block to handle network errors or other exceptions during the API call.
   * We check the response status to ensure it is successful (HTTP status 200-299) before processing the data.
   * If the response is not successful, or if the required chat history is not present, we throw an error.
   * Errors are logged to the console, and an empty array is returned in case of any errors.
   */
  async getSession(sessionId: string, userId: string): Promise<ChatBotHistoryItem[]> {
    try {
      const response = await fetch("https://bu4z2a26c7.execute-api.us-east-1.amazonaws.com/user_session_handler", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "operation": "get_session", "session_id": sessionId,
          "user_id": userId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch session data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();  // Properly handling JSON parsing only after checking the response
      if (!data.chat_history) {
        throw new Error('No chat history found');
      }

      let history: ChatBotHistoryItem[] = data.chat_history.map((item: any) => ({
        type: item.type === 'user' ? ChatBotMessageType.Human : ChatBotMessageType.AI,
        content: item.message,
        metadata: item.metadata ? JSON.parse(item.metadata) : {},
        tokens: []
      }));

      return history;
    } catch (error) {
      console.error('Error fetching session:', error);
      // Return an empty array or throw it to be handled by the calling function
      return [];
    }
  }

  // Deletes a given session based on session ID and user ID (NOT USED)
  /**
   * Deletes a specific session for a user from the server.
   * This method now includes error checking to handle issues like network failures or server errors effectively.
   * We use a try-catch block to manage errors during the fetch operation.
   * The response status is checked to ensure the delete operation was successful. If the response indicates a failure, an error is thrown.
   * On success, "DONE" is returned. If an error occurs, "FAILED" is returned, and the error is logged.
   * This enhancement improves the method's reliability by ensuring that failures are handled gracefully and clearly communicated.
   */
  async deleteSession(sessionId: string, userId: string) {
    try {
      const response = await fetch('https://bu4z2a26c7.execute-api.us-east-1.amazonaws.com/user_session_handler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "operation": "delete_session", "session_id": sessionId,
          "user_id": userId
        })
      });

      if (!response.ok) {  // Check if the response is successful (HTTP status is in the range 200-299)
        throw new Error(`Failed to delete session: ${response.status} ${response.statusText}`);
      }

      return "DONE";  // Return "DONE" only if the operation was successful
    } catch (error) {
      console.error('Error deleting session:', error);
      return "FAILED";  // Return "FAILED" if there was an error during the fetch or the response was not ok
    }
  }


}
