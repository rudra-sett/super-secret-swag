import {
  Button,
  Container,
  SpaceBetween,
  Spinner,
  Box,
  Select,
  SelectProps
} from "@cloudscape-design/components";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import TextareaAutosize from "react-textarea-autosize";
import { ReadyState } from "react-use-websocket";
import { ApiClient } from "../../common/api-client/api-client";
import { AppContext } from "../../common/app-context";
import styles from "../../styles/chat.module.scss";
import {
  ChatBotConfiguration,
  ChatBotHistoryItem,
  ChatBotMessageType,
  ChatInputState,
  ImageFile,
} from "./types";
import {
  // getSelectedModelMetadata,
  getSignedUrl,
  updateMessageHistoryRef,
  assembleHistory
} from "./utils";
import { Utils } from "../../common/utils";
import { SessionRefreshContext } from "../../common/session-refresh-context"
import { useNotifications } from "../notif-manager";
import { Autocomplete } from "@aws-amplify/ui-react";

const defaultPrompt = `Based on the project and organization description provided by the user, recommend the most relevant specific grant programs offered by the Massachusetts Energy and Environment Office that would be a good fit. Always provide more than three grant programs that could be related to the users search, formatted as follows:
- **Grant Program Name (as a bold header):**
  - A 3 sentence description of the grant program.
  - **Specific Details:**
    - **Deadline Date:** [Insert Deadline Date] Be as specific as possible
    - **Target Audience:** [Insert Target Audience]
    - **Funding Amount:** [Insert Funding Amount]
    - **Match Requirement:** [Insert Match Requirement]
  - **Additional Information:** Include any extra information that might be important for potential applicants to be aware of. Do not include a link unless certain of its validity.

Ensure each grant program is clearly and concisely described, highlighting its relevance to the users project and organization.`

const farmPrompt = `Based on the project and organization description provided by the user, recommend the most relevant specific grant programs offered by the Massachusetts Energy and Environment Office that would be a good fit for a farm. Always provide more than 3 grant programs that could be related to the users search, formatted as follows:
- **Grant Program Name (as a bold header):**
  - A 3 sentence description of the grant program.
  - **Specific Details:**
    - **Deadline Date:** [Insert Deadline Date] Be as specific as possible
    - **Target Audience:** [Insert Target Audience]
    - **Funding Amount:** [Insert Funding Amount]
    - **Match Requirement:** [Insert Match Requirement]
  - **Additional Information:** Include any extra information that might be important for potential applicants to be aware of. Do not include a link unless certain of its validity.

Ensure each grant program is clearly and concisely described, highlighting its relevance to the users project and organization.`;
const nonprofitPrompt = `Based on the project and organization description provided by the user, recommend the most relevant specific grant programs offered by the Massachusetts Energy and Environment Office that would be a good fit for a nonprofit. Always provide more than three grant programs that could be related to the users search, formatted as follows:
- **Grant Program Name (as a bold header):**
  - A 3 sentence description of the grant program.
  - **Specific Details:**
    - **Deadline Date:** [Insert Deadline Date] Be as specific as possible
    - **Target Audience:** [Insert Target Audience]
    - **Funding Amount:** [Insert Funding Amount]
    - **Match Requirement:** [Insert Match Requirement]
  - **Additional Information:** Include any extra information that might be important for potential applicants to be aware of. Do not include a link unless certain of its validity.

Ensure each grant program is clearly and concisely described, highlighting its relevance to the users project and organization.`
const businessPrompt = `Based on the project and organization description provided by the user, recommend the most relevant specific grant programs offered by the Massachusetts Energy and Environment Office that would be a good fit for a business. Always provide more than three grant programs that could be related to the users search, formatted as follows:
- **Grant Program Name (as a bold header):**
  - A 3 sentence description of the grant program.
  - **Specific Details:**
    - **Deadline Date:** [Insert Deadline Date] Be as specific as possible
    - **Target Audience:** [Insert Target Audience]
    - **Funding Amount:** [Insert Funding Amount]
    - **Match Requirement:** [Insert Match Requirement]
  - **Additional Information:** Include any extra information that might be important for potential applicants to be aware of. Do not include a link unless certain of its validity.

Ensure each grant program is clearly and concisely described, highlighting its relevance to the users project and organization.`
const townPrompt = `Based on the project and organization description provided by the user, recommend the most relevant specific grant programs offered by the Massachusetts Energy and Environment Office that would be a good fit for a municipality or town. Always provide more than three grant programs that could be related to the users search, formatted as follows:
- **Grant Program Name (as a bold header):**
  - A 3 sentence description of the grant program.
  - **Specific Details:**
    - **Deadline Date:** [Insert Deadline Date] Be as specific as possible
    - **Target Audience:** [Insert Target Audience]
    - **Funding Amount:** [Insert Funding Amount]
    - **Match Requirement:** [Insert Match Requirement]
  - **Additional Information:** Include any extra information that might be important for potential applicants to be aware of. Do not include a link unless certain of its validity.

Ensure each grant program is clearly and concisely described, highlighting its relevance to the users project and organization.`;

const AIWarning = () => {
  return (
    <Box textAlign="center">
      <h4 style={{ fontFamily: 'Calibri, sans-serif', fontWeight: '500', fontSize: 15 }}>
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

export default function ChatInputPanel(props: ChatInputPanelProps) {
  const appContext = useContext(AppContext);
  const { needsRefresh, setNeedsRefresh } = useContext(SessionRefreshContext);
  const apiClient = new ApiClient(appContext);
  const navigate = useNavigate();
  const { transcript, listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition();
  const [state, setState] = useState<ChatInputState>({
    value: "",
    systemPrompt: defaultPrompt,
  });
  const [activeButton, setActiveButton] = useState<string>('General');
  const [selectedType, setSelectedType] = useState<SelectProps.Option | null>(null);
  const [configDialogVisible, setConfigDialogVisible] = useState(false);
  const [imageDialogVisible, setImageDialogVisible] = useState(false);
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [readyState, setReadyState] = useState<ReadyState>(
    ReadyState.OPEN
  );
  const messageHistoryRef = useRef<ChatBotHistoryItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(true);

  useEffect(() => {
    messageHistoryRef.current = props.messageHistory;
  }, [props.messageHistory]);

  useEffect(() => {
    if (transcript) {
      setState((state) => ({ ...state, value: transcript }));
    }
  }, [transcript]);

  // THIS IS THE ALL-IMPORTANT MESSAGE SENDING FUNCTION
  const handleSendMessage = async () => {
    // if (!state.selectedModel) return;
    if (props.running) return;
    if (readyState !== ReadyState.OPEN) return
    ChatScrollState.userHasScrolled = false;

    const messageToSend = state.value.trim();
    setState({ value: "", systemPrompt: defaultPrompt });
    try {
      props.setRunning(true);
      let receivedData = '';

      messageHistoryRef.current = [
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
        ...messageHistoryRef.current
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

      setTimeout(() => {
        if (receivedData == '') {
          ws.close()
          messageHistoryRef.current.pop();
          messageHistoryRef.current.push({
            type: ChatBotMessageType.AI,
            tokens: [],
            content: 'Response timed out!',
            metadata: {},
          })
        }
      }, 60000)

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
        ws.send(message);
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
          // ...messageHistoryRef.current.slice(0, -2),

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
          ...messageHistoryRef.current.slice(2)
        ];
        // console.log(messageHistoryRef.current)
        props.setMessageHistory(messageHistoryRef.current);
      });
      // Handle possible errors
      ws.addEventListener('error', function error(err) {
        console.error('WebSocket error:', err);
      });
      // Handle WebSocket closure
      ws.addEventListener('close', async function close() {
        // await apiClient.sessions.updateSession("0", props.session.id, messageHistoryRef.current);
        if (firstTime) {
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

  const handleClearSearch = () => {
    // Clear the search input state
    setState({ value: "", systemPrompt: defaultPrompt });
    // Clear the message history state
    props.setMessageHistory([]);
  };

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  const addMayflowerStyles = () => {
    const stylesheets = [
      "https://unpkg.com/@massds/mayflower-assets@13.1.0/css/global.min.css",
      "https://unpkg.com/@massds/mayflower-assets@13.1.0/css/layout.min.css",
      "https://unpkg.com/@massds/mayflower-assets@13.1.0/css/brand-banner.min.css",
    ];

    stylesheets.forEach((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    });
  };

  useEffect(() => {
    addMayflowerStyles();
  }, []);

  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const selectPrompt = (type: string) => {
    setActiveButton(type);
    switch (type) {
      case 'Farm':
        setState({ ...state, systemPrompt: farmPrompt });
        break;
      case 'Town':
        setState({ ...state, systemPrompt: townPrompt });
        break;
      case 'Nonprofit':
        setState({ ...state, systemPrompt: nonprofitPrompt });
        break;
      case 'Business':
        setState({ ...state, systemPrompt: businessPrompt });
        break;
      default:
        setState({ ...state, systemPrompt: defaultPrompt });
    }
  };

  const typeOptions: SelectProps.Option[] = [
    { label: "Farm", value: "Farm" },
    { label: "Town", value: "Town" },
    { label: "Nonprofit", value: "Nonprofit" },
    { label: "Business", value: "Business" },
    { label: "Other", value: "General" },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column'}}>
      <footer style={{ position: 'fixed', bottom: 0, width: '100%' }}>
        <div className="ma__brand-banner ma__brand-banner--c-primary-alt-bg-light">
          <button
            className="ma__brand-banner-container"
            aria-controls="ma__brand-banner-content"
            aria-expanded={dropdownOpen}
            onClick={handleDropdownToggle}
          >
            <img
              className="ma__brand-banner-logo"
              src="https://unpkg.com/@massds/mayflower-assets@13.1.0/static/images/logo/stateseal.png"
              alt="Massachusetts State Seal"
            />
            <span className="ma__brand-banner-text">
              <span>An official website of the Commonwealth of Massachusetts</span>
              <span>   </span>
              <span className="ma__brand-banner-button ma__button-icon ma__icon-small ma__button-icon--quaternary ma__button-icon--c-primary-alt">
                <span>Here's how you know</span>
                <svg aria-hidden="true" width="1em" height="1em" viewBox="0 0 59 38" xmlns="http://www.w3.org/2000/svg">
                  <path d="M29.414 37.657L.344 8.586 8.828.102l20.586 20.584L50 .1l8.484 8.485-29.07 29.072"></path>
                </svg>
              </span>
            </span>
          </button>
          {dropdownOpen && (
            <ul className="ma__brand-banner-expansion" id="ma__brand-banner-content">
              <li className="ma__brand-banner-expansion-item">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 16 16" fill="#14558F">
                  <path d="M8.73 1.592V0H7.27v1.592c-2.06.364-3.63 2.239-3.63 4.503h8.72c0-2.264-1.57-4.14-3.63-4.503zm6.54 9.837h-2.18V8.38c0-.42-.32-.762-.73-.762H3.64c-.41 0-.73.341-.73.762v3.048H.73c-.4 0-.73.34-.73.761v3.048c0 .421.33.762.73.762h14.54c.4 0 .73-.34.73-.762v-3.047c0-.421-.33-.762-.73-.762zM2.91 14.476H1.45v-1.524h1.46zm2.91 0H4.36v-1.524h1.46zm0-3.81H4.36V9.144h1.46zm2.91 3.81H7.27v-1.524h1.46zm0-3.81H7.27V9.144h1.46zm2.91 3.81h-1.46v-1.524h1.46zm0-3.81h-1.46V9.144h1.46zm2.91 3.81h-1.46v-1.524h1.46z"></path>
                </svg>
                <div className="ma__brand-banner-expansion-item-content">
                  <p>Official websites use .mass.gov</p>
                  <p>A .mass.gov website belongs to an official government organization in Massachusetts.</p>
                </div>
              </li>
              <li className="ma__brand-banner-expansion-item">
                <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 25" aria-hidden="true" fill="#388557">
                  <path d="M10.399 0a6.491 6.491 0 016.487 6.258l.004.233-.001 3.853h2.077c.952 0 1.724.773 1.724 1.725v11.207c0 .952-.772 1.724-1.724 1.724H1.724A1.724 1.724 0 010 23.276V12.069c0-.952.772-1.724 1.724-1.724l2.184-.001V6.491l.004-.233A6.491 6.491 0 0110.4 0zm0 1.517A4.974 4.974 0 005.43 6.275l-.005.216v3.853h9.947V6.491l-.004-.216a4.974 4.974 0 00-4.97-4.758z" fillRule="evenodd"></path>
                </svg>
                <div className="ma__brand-banner-expansion-item-content">
                  <p>Secure websites use HTTPS certificate</p>
                  <p>A lock icon (
                    <svg width="12" height="12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 25" aria-hidden="true">
                      <path d="M10.399 0a6.491 6.491 0 016.487 6.258l.004.233-.001 3.853h2.077c.952 0 1.724.773 1.724 1.725v11.207c0 .952-.772 1.724-1.724 1.724H1.724A1.724 1.724 0 010 23.276V12.069c0-.952.772-1.724 1.724-1.724l2.184-.001V6.491l.004-.233A6.491 6.491 0 0110.4 0zm0 1.517A4.974 4.974 0 005.43 6.275l-.005.216v3.853h9.947V6.491l-.004-.216a4.974 4.974 0 00-4.97-4.758z" fillRule="evenodd"></path>
                    </svg>
                  ) or https:// means you’ve safely connected to the official website. Share sensitive information only on official, secure websites.</p>
                </div>
              </li>
            </ul>
          )}
        </div>
      </footer>
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <SpaceBetween direction="vertical" size="xs">
          <Container>
            <div className={`${styles.input_textarea_container} input_textarea_container`}>
              <span style={{ fontFamily: 'Calibri, sans-serif', fontSize: 18, marginRight: '8px' }}>I am a</span>
              <Select
                options={typeOptions}
                selectedOption={selectedType}
                onChange={({ detail }) => {
                  setSelectedType(detail.selectedOption);
                  selectPrompt(detail.selectedOption.value || 'General');
                }}
                placeholder="Select type"
              />
              <span style={{ fontFamily: 'Calibri, sans-serif', fontSize: 18, marginLeft: '8px' }}>looking for grants for</span>
              <TextareaAutosize
                className={`${styles.input_textarea} input_textarea`}
                maxRows={6}
                minRows={1}
                spellCheck={true}
                autoFocus
                onChange={(e) => setState((state) => ({ ...state, value: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                value={state.value}
                placeholder={"Enter Search ex. \"energy efficiency\""}
              />
              <Button
                disabled={
                  readyState !== ReadyState.OPEN ||
                  props.running ||
                  state.value.trim().length === 0
                }
                onClick={handleSendMessage}
                iconAlign="left"
                iconName={!props.running ? "search" : undefined}
                variant="primary"
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
              <Button
                onClick={handleClearSearch}
                iconAlign="left"
                iconName="close"
                variant="link"
                style={{ marginLeft: '8px' }}
              >
                Clear
              </Button>
            </div>
          </Container>
          <div className={styles.info_bar}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{ marginTop: '30px' }}>
                <AIWarning />
              </div>
            </div>
          </div>
        </SpaceBetween>
      </main>
    </div>
  );
}  