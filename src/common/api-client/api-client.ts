import { AppConfig } from "../types";
import { SessionsClient } from "./sessions-client";
import { KnowledgeManagementClient } from "./knowledge-management-client";
import { UserFeedbackClient } from "./user-feedback-client";
import { ComprehendMedicalClient } from "./comprehend-medical-client";


export class ApiClient {

  private _sessionsClient: SessionsClient | undefined;
  private _knowledgeManagementClient : KnowledgeManagementClient | undefined;
  private _userFeedbackClient: UserFeedbackClient | undefined;
  private _comprehendMedicalClient: ComprehendMedicalClient | undefined;


 


  public get knowledgeManagement() {
    if (!this._knowledgeManagementClient) {
      this._knowledgeManagementClient = new KnowledgeManagementClient();
    }

    return this._knowledgeManagementClient;
  }


  public get sessions() {
    if (!this._sessionsClient) {
      this._sessionsClient = new SessionsClient();
    }

    return this._sessionsClient;
  }



  public get userFeedback() {
    if (!this._userFeedbackClient) {
      this._userFeedbackClient = new UserFeedbackClient();
    }

    return this._userFeedbackClient;
  }

  public get comprehendMedical() {
    if (!this._comprehendMedicalClient) {
      this._comprehendMedicalClient = new ComprehendMedicalClient();
    }

    return this._comprehendMedicalClient;
  }

  constructor(protected _appConfig: AppConfig) {}
}
