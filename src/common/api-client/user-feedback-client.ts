import { Auth } from "aws-amplify";

export class UserFeedbackClient {

  // Takes in a piece of feedback (which has a prompt, completion, session ID, and the actual feedback (1 or 0))
  async sendUserFeedback(feedbackData) {

    // TODO: use API Gateway
    const auth = await this.authenticate();
    const response = await fetch('https://4eyjyb4lqouzyvvvs5fh6zwwse0spnhw.lambda-url.us-east-1.on.aws/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorizationToken': auth, 
      },
      body: JSON.stringify({ feedbackData })
    });
  }

  private async authenticate(): Promise<string> {
    try {
      const currentSession = await Auth.currentSession();
      console.log('Auth token:', currentSession.getIdToken().getJwtToken());
      return currentSession.getIdToken().getJwtToken();
    } catch (error) {
      console.error('Error getting current user session:', error);
      throw new Error('Authentication failed');
    }
  }
}
