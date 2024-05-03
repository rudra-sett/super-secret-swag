import {Utils} from "../utils"
import {API} from "../constants"

export class UserFeedbackClient {

  // Takes in a piece of feedback (which has a prompt, completion, session ID, and the actual feedback (1 or 0))
  async sendUserFeedback(feedbackData) {

    // TODO: use API Gateway
    const auth = await Utils.authenticate();
    const response = await fetch(API + '/user-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth, 
      },
      body: JSON.stringify({ feedbackData })
    });
  }

}
