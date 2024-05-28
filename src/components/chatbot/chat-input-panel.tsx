import {
  Button,
  Container,
  SpaceBetween,
  Spinner,
  StatusIndicator,
  Box
} from "@cloudscape-design/components";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import TextareaAutosize from "react-textarea-autosize";
import { ReadyState } from "react-use-websocket";
// import WebSocket from 'ws';
import { ApiClient } from "../../common/api-client/api-client";
import { AppContext } from "../../common/app-context";
// import { OptionsHelper } from "../../common/helpers/options-helper";
// import { StorageHelper } from "../../common/helpers/storage-helper";
// import { API } from "aws-amplify";
// import { GraphQLSubscription, GraphQLResult } from "@aws-amplify/api";
// import { Model, ReceiveMessagesSubscription, Workspace } from "../../API";
// import { LoadingStatus, ModelInterface } from "../../common/types";
import styles from "../../styles/chat.module.scss";
// import ConfigDialog from "./config-dialog";
// import ImageDialog from "./image-dialog";
import {
  ChatBotConfiguration,
  ChatBotHistoryItem,
  ChatBotMessageResponse,
  ChatBotMessageType,
  ChatInputState,
  ImageFile,
} from "./types";
// import { sendQuery } from "../../graphql/mutations";
import {
  // getSelectedModelMetadata,
  getSignedUrl,
  updateMessageHistoryRef,
  assembleHistory
} from "./utils";
// import { receiveMessages } from "../../graphql/subscriptions";
import { Utils } from "../../common/utils";
import {SessionRefreshContext} from "../../common/session-refresh-context"
import { useNotifications } from "../notif-manager";

// different prompts for different users
// const defaultPrompt = `Based on the project and organization description provided by the user, identify the most relevant grant programs offered by the Massachusetts Energy and Environment Office. For each recommended grant program, ensure the output includes:

// Grant Program Name: Displayed as a header.
// Description: Provide a concise 2-3 sentence overview of the grant program.
// Details: List the following items as sub-bullet points:
// Deadline Date: Specific cutoff for application submission.
// Target Audience: The primary group or sector intended for the grant.
// Funding Amount: Total funds available for the program.
// Match Requirement: Any matching funds required from the grantee.
// Contact Information: Direct contact details for inquiries, ensuring 100% accuracy as per the provided context.
// Relevant Link: URL to the specific grant's webpage, ensuring it is precisely the same as listed on the official site.
// All information must be up-to-date and accurately reflect the data listed on the relevant webpage. Include any additional key parameters essential for understanding or applying to the grant program.`
const defaultPrompt = `Based on the project and organization description provided by the user, recommend the most relevant specific grant programs offered by the Massachusetts Energy and Environment Office that would be a good fit. Always provide at least three grant programs that could be related to the users search, formatted as follows:
- **Grant Program Name (as a bold header):**
  - A description of the grant program, with a minimum of 2-3 sentences.
  - **Specific Details:**
    - **Deadline Date:** [Insert Deadline Date]
    - **Target Audience:** [Insert Target Audience]
    - **Funding Amount:** [Insert Funding Amount]
    - **Match Requirement:** [Insert Match Requirement]
  - **Additional Information:** Include any extra information that might be important for potential applicants to be aware of.

Ensure each grant program is clearly and concisely described, highlighting its relevance to the users project and organization.`



// 'Based on the project and organization description provided by user, 
// recommend the most relevant specific grant programs offered by the Massachusetts energy 
// and environment office that would be a good fit. Always boldly list the grant program name as a header, 
// a 2-3 sentence description and under sub-bullet points about the specific deadline date, 
// target audience, funding amount, match requirement, and contact information and relevant link listed on the relevant grant webpage.`;
const farmPrompt = `Based on the project and organization description provided by the user, recommend the most relevant specific grant programs offered by the Massachusetts Energy and Environment Office that would be a good fit for a farm. Always provide at least three grant programs that could be related to the users search, formatted as follows:
- **Grant Program Name (as a bold header):**
  - A description of the grant program, with a minimum of 2-3 sentences.
  - **Specific Details:**
    - **Deadline Date:** [Insert Deadline Date]
    - **Target Audience:** [Insert Target Audience]
    - **Funding Amount:** [Insert Funding Amount]
    - **Match Requirement:** [Insert Match Requirement]
  - **Additional Information:** Include any extra information that might be important for potential applicants to be aware of.

Ensure each grant program is clearly and concisely described, highlighting its relevance to the users project and organization.`;
const nonprofitPrompt = `Based on the project and organization description provided by the user, recommend the most relevant specific grant programs offered by the Massachusetts Energy and Environment Office that would be a good fit for a nonprofit. Always provide at least three grant programs that could be related to the users search, formatted as follows:
- **Grant Program Name (as a bold header):**
  - A description of the grant program, with a minimum of 2-3 sentences.
  - **Specific Details:**
    - **Deadline Date:** [Insert Deadline Date]
    - **Target Audience:** [Insert Target Audience]
    - **Funding Amount:** [Insert Funding Amount]
    - **Match Requirement:** [Insert Match Requirement]
  - **Additional Information:** Include any extra information that might be important for potential applicants to be aware of.

Ensure each grant program is clearly and concisely described, highlighting its relevance to the users project and organization.`
const businessPrompt = `Based on the project and organization description provided by the user, recommend the most relevant specific grant programs offered by the Massachusetts Energy and Environment Office that would be a good fit for a business. Always provide at least three grant programs that could be related to the users search, formatted as follows:
- **Grant Program Name (as a bold header):**
  - A description of the grant program, with a minimum of 2-3 sentences.
  - **Specific Details:**
    - **Deadline Date:** [Insert Deadline Date]
    - **Target Audience:** [Insert Target Audience]
    - **Funding Amount:** [Insert Funding Amount]
    - **Match Requirement:** [Insert Match Requirement]
  - **Additional Information:** Include any extra information that might be important for potential applicants to be aware of.

Ensure each grant program is clearly and concisely described, highlighting its relevance to the users project and organization.`
const townPrompt = `Based on the project and organization description provided by the user, recommend the most relevant specific grant programs offered by the Massachusetts Energy and Environment Office that would be a good fit for a municipality or town. Always provide at least three grant programs that could be related to the users search, formatted as follows:
- **Grant Program Name (as a bold header):**
  - A description of the grant program, with a minimum of 2-3 sentences.
  - **Specific Details:**
    - **Deadline Date:** [Insert Deadline Date]
    - **Target Audience:** [Insert Target Audience]
    - **Funding Amount:** [Insert Funding Amount]
    - **Match Requirement:** [Insert Match Requirement]
  - **Additional Information:** Include any extra information that might be important for potential applicants to be aware of.

Ensure each grant program is clearly and concisely described, highlighting its relevance to the users project and organization.`;

const AIWarning = () => {
  return (
    <Box textAlign="center">
      <h4 style={{ fontFamily: 'Calibri, sans-serif', fontWeight: '500', fontSize: 15}}>
        AI Models can make mistakes. Make sure to verify all information.
      </h4>
    </Box>
  );
};

export interface ChatInputPanelProps {
  running: boolean;
  setRunning: Dispatch<SetStateAction<boolean>>;
  session: { id: string; loading: boolean };
  messageHistory: ChatBotHistoryItem[];
  setMessageHistory: (history: ChatBotHistoryItem[]) => void;
  configuration: ChatBotConfiguration;
  setConfiguration: Dispatch<React.SetStateAction<ChatBotConfiguration>>;
}

export abstract class ChatScrollState {
  static userHasScrolled = false;
  static skipNextScrollEvent = false;
  static skipNextHistoryUpdate = false;
}

// const workspaceDefaultOptions: SelectProps.Option[] = [
//   // {
//   //   label: "No workspace (RAG data source)",
//   //   value: "",
//   //   iconName: "close",
//   // },
//   {
//     label: "Create new workspace",
//     value: "__create__",
//     iconName: "add-plus",
//   },
// ];

export default function ChatInputPanel(props: ChatInputPanelProps) {
  const appContext = useContext(AppContext);
  const {needsRefresh, setNeedsRefresh} = useContext(SessionRefreshContext);
  const apiClient = new ApiClient(appContext);
  const navigate = useNavigate();
  const { transcript, listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition();
  const [state, setState] = useState<ChatInputState>({
    value: "",
    systemPrompt: defaultPrompt,
    // selectedModel: null,
    // selectedModelMetadata: null,
    // selectedWorkspace: workspaceDefaultOptions[0],
    // modelsStatus: "loading",
    // workspacesStatus: "loading",
  });
  const [activeButton, setActiveButton] = useState<string>('General');
  const [configDialogVisible, setConfigDialogVisible] = useState(false);
  const [imageDialogVisible, setImageDialogVisible] = useState(false);
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [readyState, setReadyState] = useState<ReadyState>(
    ReadyState.OPEN
  );
  // const [firstTime, setFirstTime] = useState<boolean>(false);
  const messageHistoryRef = useRef<ChatBotHistoryItem[]>([]);

  useEffect(() => {
    messageHistoryRef.current = props.messageHistory;
    // // console.log(messageHistoryRef.current.length)
    // if (messageHistoryRef.current.length < 3) {
    //   setFirstTime(true);
    // } else {
    //   setFirstTime(false);
    // }
  }, [props.messageHistory]);

  // THIS PART OF THE CODE HANDLES READY STATE
  // it is currently forced to say OPEN

  // useEffect(() => {
  //   async function subscribe() {
  //     console.log("Subscribing to AppSync");
  //     setReadyState(ReadyState.CONNECTING);
  //     const sub = await API.graphql<
  //       GraphQLSubscription<ReceiveMessagesSubscription>
  //     >({
  //       query: receiveMessages,
  //       variables: {
  //         sessionId: props.session.id,
  //       },
  //       authMode: "AMAZON_COGNITO_USER_POOLS",
  //     }).subscribe({
  //       next: ({ value }) => {
  //         const data = value.data!.receiveMessages?.data;
  //         if (data !== undefined && data !== null) {
  //           const response: ChatBotMessageResponse = JSON.parse(data);
  //           console.log("message data", response.data);
  //           if (response.action === ChatBotAction.Heartbeat) {
  //             console.log("Heartbeat pong!");
  //             return;
  //           }
  //           updateMessageHistoryRef(
  //             props.session.id,
  //             messageHistoryRef.current,
  //             response
  //           );

  //           if (
  //             response.action === ChatBotAction.FinalResponse ||
  //             response.action === ChatBotAction.Error
  //           ) {
  //             console.log("Final message received");
  //             props.setRunning(false);
  //           }
  //           props.setMessageHistory([...messageHistoryRef.current]);
  //         }
  //       },
  //       error: (error) => console.warn(error),
  //     });
  //     return sub;
  //   }

  //   const sub = subscribe();
  //   sub
  //     .then(() => {
  //       setReadyState(ReadyState.OPEN);
  //       console.log(`Subscribed to session ${props.session.id}`);
  //       const request: ChatBotHeartbeatRequest = {
  //         action: ChatBotAction.Heartbeat,
  //         modelInterface: ChatBotModelInterface.Langchain,
  //         data: {
  //           sessionId: props.session.id,
  //         },
  //       };
  //       const result = API.graphql({
  //         query: sendQuery,
  //         variables: {
  //           data: JSON.stringify(request),
  //         },
  //       });
  //       Promise.all([result])
  //         .then((x) => console.log(`Query successful`, x))
  //         .catch((err) => console.log(err));
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //       setReadyState(ReadyState.CLOSED);
  //     });

  //   return () => {
  //     sub
  //       .then((s) => {
  //         console.log(`Unsubscribing from ${props.session.id}`);
  //         s.unsubscribe();
  //       })
  //       .catch((err) => console.log(err));
  //   };
  //   // eslint-disable-next-line
  // }, [props.session.id]);


  // uhhh I think this handles speech stuff??

  useEffect(() => {
    if (transcript) {
      setState((state) => ({ ...state, value: transcript }));
    }
  }, [transcript]);

  // this handles models/workspaces

  // useEffect(() => {
  //   if (!appContext) return;

  //   (async () => {
  //     const apiClient = new ApiClient(appContext);
  //     let workspaces: Workspace[] = [];
  //     let workspacesStatus: LoadingStatus = "finished";
  //     let modelsResult: GraphQLResult<any>;
  //     let workspacesResult: GraphQLResult<any>;
  //     try {
  //       if (appContext?.config.rag_enabled) {
  //         [modelsResult, workspacesResult] = await Promise.all([
  //           apiClient.models.getModels(),
  //           apiClient.workspaces.getWorkspaces(),
  //         ]);
  //         workspaces = workspacesResult.data?.listWorkspaces;
  //         workspacesStatus =
  //           workspacesResult.errors === undefined ? "finished" : "error";
  //       } else {
  //         modelsResult = await apiClient.models.getModels();
  //       }

  //       const models = modelsResult.data ? modelsResult.data.listModels : [];

  //       const selectedModelOption = getSelectedModelOption(models);
  //       const selectedModelMetadata = getSelectedModelMetadata(
  //         models,
  //         selectedModelOption
  //       );
  //       const selectedWorkspaceOption = appContext?.config.rag_enabled
  //         ? getSelectedWorkspaceOption(workspaces)
  //         : workspaceDefaultOptions[0];

  //       setState((state) => ({
  //         ...state,
  //         models,
  //         workspaces,
  //         selectedModel: selectedModelOption,
  //         selectedModelMetadata,
  //         selectedWorkspace: selectedWorkspaceOption,
  //         modelsStatus: "finished",
  //         workspacesStatus: workspacesStatus,
  //       }));
  //     } catch (error) {
  //       console.log(Utils.getErrorMessage(error));
  //       setState((state) => ({
  //         ...state,
  //         modelsStatus: "error",
  //       }));
  //     }
  //   })();
  // }, [appContext, state.modelsStatus]);

  useEffect(() => {
    const onWindowScroll = () => {
      if (ChatScrollState.skipNextScrollEvent) {
        ChatScrollState.skipNextScrollEvent = false;
        return;
      }

      const isScrollToTheEnd =
        Math.abs(
          window.innerHeight +
          window.scrollY -
          document.documentElement.scrollHeight
        ) <= 10;

      if (!isScrollToTheEnd) {
        ChatScrollState.userHasScrolled = true;
      } else {
        ChatScrollState.userHasScrolled = false;
      }
    };

    window.addEventListener("scroll", onWindowScroll);

    return () => {
      window.removeEventListener("scroll", onWindowScroll);
    };
  }, []);

  useLayoutEffect(() => {
    if (ChatScrollState.skipNextHistoryUpdate) {
      ChatScrollState.skipNextHistoryUpdate = false;
      return;
    }

    if (!ChatScrollState.userHasScrolled && props.messageHistory.length > 0) {
      ChatScrollState.skipNextScrollEvent = true;
      window.scrollTo({
        top: document.documentElement.scrollHeight + 1000,
        behavior: "instant",
      });
    }
  }, [props.messageHistory]);

  // this probably handles image file uploads?

  // useEffect(() => {
  //   const getSignedUrls = async () => {
  //     if (props.configuration?.files as ImageFile[]) {
  //       const files: ImageFile[] = [];
  //       for await (const file of props.configuration?.files ?? []) {
  //         const signedUrl = await getSignedUrl(file.key);
  //         files.push({
  //           ...file,
  //           url: signedUrl,
  //         });
  //       }

  //       setFiles(files);
  //     }
  //   };

  //   if (props.configuration.files?.length) {
  //     getSignedUrls();
  //   }
  // }, [props.configuration]);

  // images I guess?

  // const hasImagesInChatHistory = function (): boolean {
  //   return (
  //     messageHistoryRef.current.filter(
  //       (x) =>
  //         x.type == ChatBotMessageType.Human &&
  //         x.metadata?.files &&
  //         (x.metadata.files as object[]).length > 0
  //     ).length > 0
  //   );
  // };

  // THIS IS THE ALL-IMPORTANT MESSAGE SENDING FUNCTION
  const handleSendMessage = async () => {
    // if (!state.selectedModel) return;
    if (props.running) return;
    if (readyState !== ReadyState.OPEN) return
    ChatScrollState.userHasScrolled = false;

    // let username;
    // // await Auth.currentAuthenticatedUser().then((value) => username = value.username);
    // if (!username) return;
    // const readline = require('readline').createInterface({
    //   input: process.stdin,
    //   output: process.stdout
    // });    

    const messageToSend = state.value.trim();
    setState({ value: "" , systemPrompt: defaultPrompt});
    try {
      props.setRunning(true);
      let receivedData = '';      
      
      messageHistoryRef.current = [
        ...messageHistoryRef.current,

        {
          type: ChatBotMessageType.Human,
          content: messageToSend,
          metadata: {
            ...props.configuration,
          },
          tokens: [],
        },
        {
          type: ChatBotMessageType.AI,
          tokens: [],
          content: receivedData,
          metadata: {},
        },
      ];
      props.setMessageHistory(messageHistoryRef.current);

      let firstTime = false;
      if (messageHistoryRef.current.length < 3) {
        firstTime = true;
      }

      // Connect to WebSocketHandler
      const wsUrl = 'wss://ngdpdxffy0.execute-api.us-east-1.amazonaws.com/test/';

      // console.log(TOKEN)
      const ws = new WebSocket(wsUrl);

      let incomingMetadata: boolean = false;
      let sources = {};

      setTimeout(() => {if (receivedData == '') {
        ws.close()
        messageHistoryRef.current.pop();
        messageHistoryRef.current.push({
          type: ChatBotMessageType.AI,
          tokens: [],
          content: 'Response timed out!',
          metadata: {},
        })
      }},60000)

      // Event listener for when the connection is open
      ws.addEventListener('open', function open() {
        console.log('Connected to the WebSocket server');
        // readline.question('What is your question? ', question => {
        const message = JSON.stringify({
          "action": "getChatbotResponse",
          "data": {
            userMessage: messageToSend,
            chatHistory: assembleHistory(messageHistoryRef.current.slice(0, -2)),
            systemPrompt: state.systemPrompt,
            // You are a navigator of grants offered by the Massachusetts Executive Office of Energy and Enviornmental Affairs(EEA). With each
            // user input, you will return the relevant grants offered by the EEA that are most relevant to the user input. The response should be formatted to include
            // the name of the grant as a bolded subheading, a 2-3 sentence description of the grant.
            // On a new bulletpointed line, state the deadline of the grants. Ten on a new bulletpointed line, state the funding available for the grants.
            // Then on a new bulletpointed line, list the match requirement. Then on a new bulletpointed line, list relevant contact information for the person in charge of that particular grant program. 
            // Then, include a link to the webpage where this information was found.
             //After each grant, include a link to the webpage where this information was found.
            //a new line that lists the deadline 
            //use language like "then"
            projectId: 'rkdg062824'
          }
        });
        // readline.close();
        // Replace 'Hello, world!' with your message
        ws.send(message);
        // console.log('Message sent:', message);
        // });
      });
      // Event listener for incoming messages
      ws.addEventListener('message', async function incoming(data) {
        // console.log(data);        
        if (data.data.includes("<!ERROR!>:")) {
          //addNotification("error",data.data);          
          ws.close();
          return;
        }
        if (data.data == '!<|EOF_STREAM|>!') {
          
          incomingMetadata = true;
          return;
          // return;
        }
        if (!incomingMetadata) {
          receivedData += data.data;
        } else {
          sources = { "Sources": JSON.parse(data.data) }
          console.log(sources);
        }



        // console.log(data.data);
        // Update the chat history state with the new message        
        messageHistoryRef.current = [
          ...messageHistoryRef.current.slice(0, -2),

          {
            type: ChatBotMessageType.Human,
            content: messageToSend,
            metadata: {
              ...props.configuration,
            },
            tokens: [],
          },
          {
            type: ChatBotMessageType.AI,
            tokens: [],
            content: receivedData,
            metadata: sources,
          },
        ];
        // console.log(messageHistoryRef.current)
        props.setMessageHistory(messageHistoryRef.current);
        // if (data.data == '') {
        //   ws.close()
        // }

      });
      // Handle possible errors
      ws.addEventListener('error', function error(err) {
        console.error('WebSocket error:', err);
      });
      // Handle WebSocket closure
      ws.addEventListener('close', async function close() {
        // await apiClient.sessions.updateSession("0", props.session.id, messageHistoryRef.current);
        if (firstTime) {   
          // console.log("first time!", firstTime)
          // console.log("did we also need a refresh?", needsRefresh)
          Utils.delay(1500).then(() => setNeedsRefresh(true));
        }
        props.setRunning(false);        
        console.log('Disconnected from the WebSocket server');
      });

    } catch (error) {
      // setMessage('');
      console.error('Error sending message:', error);
      alert('Sorry, something has gone horribly wrong! Please try again or refresh the page.');
      props.setRunning(false);
    }

    // THIS RESETS THE MESSAGE BOX ONCE A RESPONSE IS DONE
    // commented because if you type out your next query while a message is streaming,
    // it'll delete that query which sucks

    // setState((state) => ({
    //   ...state,
    //   value: "",
    // }));
    // setFiles([]);

    // no idea what this does

    // props.setConfiguration({
    //   ...props.configuration,
    //   files: [],
    // });

    // graphQL things we don't need anymore

    // API.graphql({
    //   query: sendQuery,
    //   variables: {
    //     data: JSON.stringify(request),
    //   },
    // });    
  };

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  return (
    <SpaceBetween direction="vertical" size="l">
      <Container>
        <div className={styles.input_textarea_container}>
          <SpaceBetween size="xxs" direction="horizontal" alignItems="center">
          </SpaceBetween>
          <TextareaAutosize
            className={styles.input_textarea}
            maxRows={6}
            minRows={1}
            spellCheck={true}
            autoFocus
            onChange={(e) =>
              setState((state) => ({ ...state, value: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key == "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            value={state.value}
            placeholder={"Enter Search ex. \"Grants for new farmers\""}
          />
          <div style={{ marginLeft: "8px" }}>
            {/* {state.selectedModelMetadata?.inputModalities.includes(
              ChabotInputModality.Image
            ) &&
              files.length > 0 &&
              files.map((file, idx) => (
                <img
                  key={idx}
                  onClick={() => setImageDialogVisible(true)}
                  src={file.url}
                  style={{
                    borderRadius: "4px",
                    cursor: "pointer",
                    maxHeight: "30px",
                    float: "left",
                    marginRight: "8px",
                  }}
                />
              ))} */}
            <Button
              disabled={
                readyState !== ReadyState.OPEN ||
                // !state.models?.length ||
                // !state.selectedModel ||
                props.running ||
                state.value.trim().length === 0 
                // props.session.loading
              }
              onClick={handleSendMessage}
              iconAlign="left"
              iconName={!props.running ? "search" : undefined}
              variant="primary"
              //variant="primary"
            >
              {props.running ? (
                <>
                  Loading&nbsp;&nbsp;
                  <Spinner />
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </div>
      </Container>
      <div className={styles.info_bar}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ marginTop: '-10px' }}>
              <AIWarning/>
          </div>
        </div>
        <div className={styles.info_bar_right}>
          <SpaceBetween direction="horizontal" size="xxs" alignItems="center">
            <div style={{ paddingTop: "1px" }}>
            </div>
            <div style={{ marginTop: '-7.5px' }}>
             <StatusIndicator
               type={
                 readyState === ReadyState.OPEN
                   ? "success"
                   : readyState === ReadyState.CONNECTING ||
                     readyState === ReadyState.UNINSTANTIATED
                     ? "in-progress"
                     : "error"
               }
             >
                 {readyState === ReadyState.OPEN ? "Connected" : connectionStatus}
              </StatusIndicator>
            </div>  
          </SpaceBetween>
        </div>
      </div> 
      <div className={styles.prompt_buttons_centered}>
        <div className={styles.select_prompt}>
          <h3 style={{fontFamily: 'Calibri, sans-serif', fontWeight: '10000', fontSize: 20}}>
            Select your organization:  
          </h3>
        </div>
        <div className={styles.small_button}>
        <Button 
          onClick={() => { setState({ ...state, systemPrompt: farmPrompt }); setActiveButton('Farm'); }} 
          variant={activeButton === 'Farm' ? 'primary' : 'normal'}>
          Farm
        </Button>
        </div>
        <div className={styles.small_button}>
        <Button 
          onClick={() => { setState({ ...state, systemPrompt: townPrompt }); setActiveButton('Town'); }} 
          variant={activeButton === 'Town' ? 'primary' : 'normal'}>
          Town
        </Button>
        </div>
        <div className={styles.small_button}>
        <Button 
          onClick={() => { setState({ ...state, systemPrompt: nonprofitPrompt }); setActiveButton('Nonprofit'); }} 
          variant={activeButton === 'Nonprofit' ? 'primary' : 'normal'}>
          Nonprofit
        </Button>
        </div>
        <div className={styles.small_button}>
        <Button 
          onClick={() => { setState({ ...state, systemPrompt: businessPrompt }); setActiveButton('Business'); }} 
          variant={activeButton === 'Business' ? 'primary' : 'normal'}>
          Business
        </Button>
        </div>
        <div className={styles.small_button}>
        <Button 
          onClick={() => { setState({ ...state, systemPrompt: defaultPrompt }); setActiveButton('General'); }} 
          variant={activeButton === 'General' ? 'primary' : 'normal'}>
          Other
        </Button>
        </div>
        </div>
    </SpaceBetween>
  );
}


// function getSelectedModelOption(models: Model[]): SelectProps.Option | null {
//   let selectedModelOption: SelectProps.Option | null = null;
//   const savedModel = StorageHelper.getSelectedLLM();

//   if (savedModel) {
//     const savedModelDetails = OptionsHelper.parseValue(savedModel);
//     const targetModel = models.find(
//       (m) =>
//         m.name === savedModelDetails.name &&
//         m.provider === savedModelDetails.provider
//     );

//     if (targetModel) {
//       selectedModelOption = OptionsHelper.getSelectOptionGroups([
//         targetModel,
//       ])[0].options[0];
//     }
//   }

//   let candidate: Model | undefined = undefined;
//   if (!selectedModelOption) {
//     const bedrockModels = models.filter((m) => m.provider === "bedrock");
//     const sageMakerModels = models.filter((m) => m.provider === "sagemaker");
//     const openAIModels = models.filter((m) => m.provider === "openai");

//     candidate = bedrockModels.find((m) => m.name === "anthropic.claude-v2");
//     if (!candidate) {
//       candidate = bedrockModels.find((m) => m.name === "anthropic.claude-v1");
//     }

//     if (!candidate) {
//       candidate = bedrockModels.find(
//         (m) => m.name === "amazon.titan-tg1-large"
//       );
//     }

//     if (!candidate) {
//       candidate = bedrockModels.find((m) => m.name.startsWith("amazon.titan-"));
//     }

//     if (!candidate && sageMakerModels.length > 0) {
//       candidate = sageMakerModels[0];
//     }

//     if (openAIModels.length > 0) {
//       if (!candidate) {
//         candidate = openAIModels.find((m) => m.name === "gpt-4");
//       }

//       if (!candidate) {
//         candidate = openAIModels.find((m) => m.name === "gpt-3.5-turbo-16k");
//       }
//     }

//     if (!candidate && bedrockModels.length > 0) {
//       candidate = bedrockModels[0];
//     }

//     if (candidate) {
//       selectedModelOption = OptionsHelper.getSelectOptionGroups([candidate])[0]
//         .options[0];
//     }
//   }

//   return selectedModelOption;
// }
