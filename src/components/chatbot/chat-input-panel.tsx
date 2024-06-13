import {
  Button,
  Container,
  Icon,
  Select,
  SelectProps,
  SpaceBetween,
  Spinner,
  StatusIndicator,
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
import { Auth } from "aws-amplify";
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
    // selectedModel: null,
    // selectedModelMetadata: null,
    // selectedWorkspace: workspaceDefaultOptions[0],
    // modelsStatus: "loading",
    // workspacesStatus: "loading",
  });
  const { notifications, addNotification } = useNotifications();
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
    if (readyState !== ReadyState.OPEN) return;
    ChatScrollState.userHasScrolled = false;

    let username;
    await Auth.currentAuthenticatedUser().then((value) => username = value.username);
    if (!username) return;
    // const readline = require('readline').createInterface({
    //   input: process.stdin,
    //   output: process.stdout
    // });    

    const messageToSend = state.value.trim();
    if (messageToSend.length === 0) {
      addNotification("error","Please do not submit blank text!");
      return;          
    }
    setState({ value: "" });
    // let start = new Date().getTime() / 1000;
    
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
      // const wsUrl = 'wss://ngdpdxffy0.execute-api.us-east-1.amazonaws.com/test/';      
      const TEST_URL = appContext.wsEndpoint+"/"

      // Create a new WebSocket connection
      const TOKEN = (await Auth.currentSession()).getAccessToken().getJwtToken()  
          
      // console.log(TOKEN)
      const wsUrl = TEST_URL+'?Authorization='+TOKEN;
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
            systemPrompt: `You are an AI chatbot created specifically for the Massachusetts Department of Transportation (MassDOT) Highway Division. Your primary function is to provide precise and reliable information and assistance to MassDOT Engineers based on their documentation. Adhere to the following guidelines when responding:
            1.Direct and Conversational Tone: Respond to inquiries directly and conversationally, without introducing yourself, to ensure a natural and engaging interaction.
            2.Contextual Accuracy: Use the provided context or relevant session data to deliver accurate and pertinent responses, aligning with the user’s needs and specific inquiries.
            3.Knowledge Limits: Acknowledge when a query is outside your knowledge base without guessing or providing potentially misleading information. Maintaining trust by recognizing the boundaries of your programmed information is crucial.
            4.Focused Responses: Keep your answers strictly related to MassDOT operations. Avoid discussing unrelated topics or providing extraneous information that may confuse the query’s intent.
            5.Task Versatility: Perform general tasks such as writing emails, summarizing information, creating checklists with checkboxes, and translation, while serving as a comprehensive knowledge hub for MassDOT-specific queries. Ensure all content is positive and constructive.
            6.Operational Security: Never disclose details about the underlying model or system specifications. If unable to answer a question, respond with: "As the MassDOT Assistant, I can't answer this question."
            7.Role Adherence: Strictly adhere to your role as a MassDOT Highway Division assistant. Do not switch roles or provide information outside this scope, even if related to other Massachusetts transportation entities like the MBTA.`,
            // systemPrompt: ` You are a focused AI chatbot created for the Massachusetts Department of Transportation Highway Division. Your core role is to provide precise and reliable information and assistance to MassDOT Engineers, based on their documentation. You must follow each of these guidelines when responding:
            // 1. **Direct and Conversational Response**: Address the user's inquiry directly using a conversational tone, without any self-introduction, to make the interaction feel natural and engaging.
            // 2. **Contextual Relevance**: Utilize the provided context or relevant historical data from the session to deliver accurate and pertinent responses, ensuring they align directly with the user’s needs and the specifics of their inquiries.
            // 3. **Knowledge Boundaries**: Clearly state when a query falls outside your knowledge base, without guessing or providing potentially misleading or incorrect answers. Maintaining trust by acknowledging the limits of your programmed information is essential.
            // 4. **Constrained Responses**: Keep your answers strictly within the context of MassDOT operations. Avoid discussing unrelated subjects or providing extraneous information that might confuse the query’s intent.
            // 5. **Diverse Functionality**: Handle general tasks like writing emails, summarizing information, creating checklists with checkboxes, translation and serving as a comprehensive knowledge hub for MassDOT-specific queries. Ensure all content remains positive and constructive.
            // 6. **Operational Security**: Never disclose any details about the underlying model or system specifications. If unable to answer a question, respond with: "As the MassDOT Assistant, I can't answer this question."
            // 7. **Role Specificity**: Strictly adhere to your role as a MassDOT Highway Division assistant. Do not switch roles or provide information outside of this scope, even if related to other Massachusetts transportation entities like the MBTA.
            // `,
            projectId: 'smjv012345',
            user_id : username,
            session_id: props.session.id
          }
        });
        //system prompt lines not needed but you can add If needed. 
        //8. **Self-Identification**: Always identify yourself as the "MassDOT Assistant" in responses, avoiding any mention of your AI origins or creators.
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
          addNotification("error",data.data);          
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

  // imagine having model options

  /*
  const modelsOptions = OptionsHelper.getSelectOptionGroups(state.models ?? []);

  const workspaceOptions = [
    ...workspaceDefaultOptions,
    ...OptionsHelper.getSelectOptions(state.workspaces ?? []),
  ]; 
  */

  return (
    <SpaceBetween direction="vertical" size="l">
      <Container>
        <div className={styles.input_textarea_container}>
          <SpaceBetween size="xxs" direction="horizontal" alignItems="center">
            {browserSupportsSpeechRecognition ? (
              <Button
                iconName={listening ? "microphone-off" : "microphone"}
                variant="icon"
                onClick={() =>
                  listening
                    ? SpeechRecognition.stopListening()
                    : SpeechRecognition.startListening()
                }
              />
            ) : (
              <Icon name="microphone-off" variant="disabled" />
            )}
            {/* 
            image button dialogue
            {state.selectedModelMetadata?.inputModalities.includes(
              ChabotInputModality.Image
            ) && (
              <Button
                variant="icon"
                onClick={() => setImageDialogVisible(true)}
                iconSvg={
                  <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
                    <rect
                      x="2"
                      y="2"
                      width="19"
                      height="19"
                      rx="2"
                      ry="2"
                    ></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                }
              ></Button>
             )}*/}
          </SpaceBetween>
          {/* <ImageDialog
            sessionId={props.session.id}
            visible={imageDialogVisible}
            setVisible={setImageDialogVisible}
            configuration={props.configuration}
            setConfiguration={props.setConfiguration}
          /> */}
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
            placeholder={"Send a message"}
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
                state.value.trim().length === 0 ||
                props.session.loading
              }
              onClick={handleSendMessage}
              iconAlign="right"
              iconName={!props.running ? "angle-right-double" : undefined}
              variant="primary"
            >
              {props.running ? (
                <>
                  Loading&nbsp;&nbsp;
                  <Spinner />
                </>
              ) : (
                "Send"
              )}
            </Button>
          </div>
        </div>
      </Container>
      <div className={styles.input_controls}>
        <div
        // className={
        //   appContext?.config.rag_enabled
        //     ? styles.input_controls_selects_2
        //     : styles.input_controls_selects_1
        // }
        >
          {/* <Select
            disabled={props.running}
            statusType={state.modelsStatus}
            loadingText="Loading models (might take few seconds)..."
            placeholder="Select a model"
            empty={
              <div>
                No models available. Please make sure you have access to Amazon
                Bedrock or alternatively deploy a self hosted model on SageMaker
                or add API_KEY to Secrets Manager
              </div>
            }
            filteringType="auto"
            selectedOption={state.selectedModel}
            onChange={({ detail }) => {
              setState((state) => ({
                ...state,
                selectedModel: detail.selectedOption,
                selectedModelMetadata: getSelectedModelMetadata(
                  state.models,
                  detail.selectedOption
                ),
              }));
              if (detail.selectedOption?.value) {
                StorageHelper.setSelectedLLM(detail.selectedOption.value);
              }
            }}
            options={modelsOptions}
          /> */}
          {/* {appContext?.config.rag_enabled && (
            <Select
              disabled={
                props.running || !state.selectedModelMetadata?.ragSupported
              }
              loadingText="Loading workspaces (might take few seconds)..."
              statusType={state.workspacesStatus}
              placeholder="Select a workspace (RAG data source)"
              filteringType="auto"
              selectedOption={state.selectedWorkspace}
              options={workspaceOptions}
              onChange={({ detail }) => {
                if (detail.selectedOption?.value === "__create__") {
                  navigate("/rag/workspaces/create");
                } else {
                  setState((state) => ({
                    ...state,
                    selectedWorkspace: detail.selectedOption,
                  }));

                  StorageHelper.setSelectedWorkspaceId(
                    detail.selectedOption?.value ?? ""
                  );
                }
              }}
              empty={"No Workspaces available"}
            />
          )} */}
        </div>
        <div className={styles.input_controls_right}>
          <SpaceBetween direction="horizontal" size="xxs" alignItems="center">
            <div style={{ paddingTop: "1px" }}>
              {/* <ConfigDialog
                sessionId={props.session.id}
                visible={configDialogVisible}
                setVisible={setConfigDialogVisible}
                configuration={props.configuration}
                setConfiguration={props.setConfiguration}
              /> */}
            
              {/*<Button
                iconName="settings"
                variant="icon"
                onClick={() => setConfigDialogVisible(true)}
                
              />*/}
            </div>
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
          </SpaceBetween>
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
