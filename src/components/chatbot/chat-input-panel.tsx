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
import { ApiClient } from "../../common/api-client/api-client";
import { AppContext } from "../../common/app-context";
import styles from "../../styles/chat.module.scss";
import {
  ChatBotConfiguration,
  ChatBotHistoryItem,
  ChatBotMessageResponse,
  ChatBotMessageType,
  ChatInputState,
  ImageFile,
} from "./types";
import {
  getSignedUrl,
  updateMessageHistoryRef,
  assembleHistory
} from "./utils";
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

export default function ChatInputPanel(props: ChatInputPanelProps) {
  const appContext = useContext(AppContext);
  const {needsRefresh, setNeedsRefresh} = useContext(SessionRefreshContext);
  const apiClient = new ApiClient(appContext);
  const navigate = useNavigate();
  const { transcript, listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition();
  const [state, setState] = useState<ChatInputState>({
    value: "",
  });
  const [configDialogVisible, setConfigDialogVisible] = useState(false);
  const [imageDialogVisible, setImageDialogVisible] = useState(false);
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [readyState, setReadyState] = useState<ReadyState>(
    ReadyState.OPEN
  );
  // const [firstTime, setFirstTime] = useState<boolean>(false);
  const messageHistoryRef = useRef<ChatBotHistoryItem[]>([]);

  const { addNotification } = useNotifications();

  const prompt = "You are a considerate and helpful AI chatbot assistant for ALL MassHealth Enrollment Center workers. You are an INTERNAL tool to made ONLY to help MassHealth employees. You are an expert on ALL policies, procedural information, MassHealth enrollment, and internal traning materials. YOU CAN ONLY HELP USERS WITH MASSHEALTH RELATED QUESTIONS. If a user asks a non MassHealth related question quickly respond that you can only help with MassHealth related inquires. You will help call center workers respond to user complaints and queries about MassHealth enrollment and act as an integral resource for workers to refer and use when working on member cases. When you respond your answers should be efficient and straight to the point, only respond to directly what the user asks and quickly direct them to all the resources and FACTUAL knowledge they need to know to answer their question. Respond to their question and structure your response clearly each time so the direct answer to their question stands out immediately. If they are asking for help with a process or an action that has multiple steps clearly number and list out each step they need to take with explanations. If a user tries to input any sensitive personal information about members, such as their SSN, it will be redacted from the message, so you can very quickly remind them not to input any PII but continue to respond to their question unless more information is needed after the message has been redacted. If you do not have any given knowledge of the question, say that you do not have the neccessary information to answer the question and refer the user to the best resources for them to locate the answer themselves. Do not make up information outside of your given information, be honest and helpful always.";

  useEffect(() => {
    messageHistoryRef.current = props.messageHistory;
    // // console.log(messageHistoryRef.current.length)
    // if (messageHistoryRef.current.length < 3) {
    //   setFirstTime(true);
    // } else {
    //   setFirstTime(false);
    // }
  }, [props.messageHistory]);

  useEffect(() => {
    if (transcript) {
      setState((state) => ({ ...state, value: transcript }));
    }
  }, [transcript]);

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

    let messageToSend = state.value.trim();
    console.log(messageToSend);
    const redactedMessage  = await apiClient.comprehendMedicalClient.redactText(messageToSend);
    if (messageToSend !== redactedMessage) {
      addNotification("warning", "Please do not attempt to share sensitive member information.")
      messageToSend = redactedMessage;
    }
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
      //const wsUrl = appContext.wsEndpoint+"/"
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
            systemPrompt: prompt,
            projectId: 'vgbt420420',
            user_id : username,
            session_id: props.session.id
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
          <SpaceBetween size="xs" direction="horizontal" alignItems="center">
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
            placeholder={"Send a message"}
          />
          <div style={{ marginLeft: "8px" }}>
            <Button
              disabled={
                readyState !== ReadyState.OPEN ||
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
