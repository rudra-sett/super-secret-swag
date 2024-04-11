export class SessionsClient {
  async getSessions(
    userId : string
  ) {
    const response = await fetch('"https://chpjfyezv2.execute-api.us-east-1.amazonaws.com/user_session_handler"', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ "operation" : "list_sessions_by_user_id","user_id" : userId })
    });
    console.log(response.body);
    return response.body;
  }

  async getSession(
    sessionId: string,
    userId: string,
  ) {
    const response = await fetch("https://chpjfyezv2.execute-api.us-east-1.amazonaws.com/user_session_handler", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({"operation" : "get_session", "session_id" : sessionId,
        "user_id" : userId
       })
    });
    return response.body;
  }

  async deleteSession(
    sessionId: string
  ) {
    try {
      const response = await fetch('https://chpjfyezv2.execute-api.us-east-1.amazonaws.com/user_session_handler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });
    } catch {
      return "FAILED";
    }
    return "DONE";
  }

}
