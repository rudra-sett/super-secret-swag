import { API } from "aws-amplify";
import { GraphQLQuery, GraphQLResult } from "@aws-amplify/api";
// import { listSessions, getSession } from "../../graphql/queries";
// import { deleteSession, deleteUserSessions } from "../../graphql/mutations";
// import {
//   ListSessionsQuery,
//   GetSessionQuery,
//   DeleteSessionMutation,
//   DeleteUserSessionsMutation,
// } from "../../API";

export class SessionsClient {
  async getSessions() {
    const response = await fetch('https://4eyjyb4lqouzyvvvs5fh6zwwse0spnhw.lambda-url.us-east-1.on.aws/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.body;
  }

  async getSession(
    sessionId: string
  ) {
    const response = await fetch('https://4eyjyb4lqouzyvvvs5fh6zwwse0spnhw.lambda-url.us-east-1.on.aws/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId })
    });
    return response.body;
  }

  async deleteSession(
    sessionId: string
  ) {
    try {
      const response = await fetch('https://4eyjyb4lqouzyvvvs5fh6zwwse0spnhw.lambda-url.us-east-1.on.aws/', {
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
