import {
  Utils
} from "../utils"
import { AppConfig } from "../types"; 

export class MetricClient {
  private readonly API: string;
  constructor(protected _appConfig: AppConfig) {
    this.API = _appConfig.httpEndpoint.slice(0,-1);}

  async getInvocationCount() {
    try {
      const auth = await Utils.authenticate();
      console.log("inside the comprehend medical client")
      const response = await fetch(this.API + '/chat-invocations-count', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization' : auth
        },        
      });
      console.log(response);
      return await response.json()
    }
    catch (err) {
      console.log(err);
      return "unknown";
    }
  }

}