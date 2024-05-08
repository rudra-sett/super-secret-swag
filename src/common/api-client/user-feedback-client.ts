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

  async getUserFeedback(topic : string, startTime? : string, endTime? : string, nextPageToken? : string) {
    
    const auth = await Utils.authenticate();
    let params = new URLSearchParams({topic,startTime,endTime,nextPageToken});
    let keysForDel = [];
    params.forEach((value, key) => {
      if (value === undefined || value == "undefined") {
        keysForDel.push(key);
      }
    });

    keysForDel.forEach(key => {
      params.delete(key);
    });
    const response = await fetch(API + '/user-feedback?' + params.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth, 
      },      
    });
    const result = await response.json();
    return result;
  }

}