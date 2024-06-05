import {
  Button,
  Container,
  SpaceBetween,
  Spinner,
  StatusIndicator,
  Box,
  Select,
  SelectProps
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
import { SessionRefreshContext } from "../../common/session-refresh-context"
import { useNotifications } from "../notif-manager";

const defaultPrompt = `Based on the project and organization description provided by the user, recommend the most relevant specific grant programs offered by the Massachusetts Energy and Environment Office that would be a good fit. Always provide more than three grant programs that could be related to the users search, formatted as follows:
- **Grant Program Name (as a bold header):**
  - A 3 sentence description of the grant program.
  - **Specific Details:**
    - **Deadline Date:** [Insert Deadline Date] Be as specific as possible
    - **Target Audience:** [Insert Target Audience]
    - **Funding Amount:** [Insert Funding Amount]
    - **Match Requirement:** [Insert Match Requirement]
  - **Additional Information:** Include any extra information that might be important for potential applicants to be aware of. Do not include a link unless certain of its validity.

Ensure each grant program is clearly and concisely described, highlighting its relevance to the users project and organization.`;

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

Ensure each grant program is clearly and concisely described, highlighting its relevance to the users project and organization.`;

const businessPrompt = `Based on the project and organization description provided by the user, recommend the most relevant specific grant programs offered by the Massachusetts Energy and Environment Office that would be a good fit for a business. Always provide more than three grant programs that could be related to the users search, formatted as follows:
- **Grant Program Name (as a bold header):**
  - A 3 sentence description of the grant program.
  - **Specific Details:**
    - **Deadline Date:** [Insert Deadline Date] Be as specific as possible
    - **Target Audience:** [Insert Target Audience]
    - **Funding Amount:** [Insert Funding Amount]
    - **Match Requirement:** [Insert Match Requirement]
  - **Additional Information:** Include any extra information that might be important for potential applicants to be aware of. Do not include a link unless certain of its validity.

Ensure each grant program is clearly and concisely described, highlighting its relevance to the users project and organization.`;

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

  useEffect(() => {
    messageHistoryRef.current = props.messageHistory;
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

  const handleSendMessage = async () => {
    if (props.running) return;
    if (readyState !== ReadyState.OPEN) return
    ChatScrollState.userHasScrolled = false;

    const messageToSend = state.value.trim();
    setState({ value: "", systemPrompt: defaultPrompt });
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

      const wsUrl = 'wss://ngdpdxffy0.execute-api.us-east-1.amazonaws.com/test/';

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

      ws.addEventListener('open', function open() {
        const message = JSON.stringify({
          "action": "getChatbotResponse",
          "data": {
            userMessage: messageToSend,
            chatHistory: assembleHistory(messageHistoryRef.current.slice(0, -2)),
            systemPrompt: state.systemPrompt,
            projectId: 'rkdg062824'
          }
        });
        ws.send(message);
      });

      ws.addEventListener('message', async function incoming(data) {
        if (data.data.includes("<!ERROR!>:")) {
          ws.close();
          return;
        }
        if (data.data == '!!') {
          incomingMetadata = true;
          return;
        }
        if (!incomingMetadata) {
          receivedData += data.data;
        } else {
          sources = { "Sources": JSON.parse(data.data) }
          console.log(sources);
        }

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
        props.setMessageHistory(messageHistoryRef.current);
      });

      ws.addEventListener('error', function error(err) {
        console.error('WebSocket error:', err);
      });

      ws.addEventListener('close', async function close() {
        if (firstTime) {
          Utils.delay(1500).then(() => setNeedsRefresh(true));
        }
        props.setRunning(false);
        console.log('Disconnected from the WebSocket server');
      });

    } catch (error) {
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

  const addMayflowerStyles = () => {
    const stylesheets = [
      "https://unpkg.com/@massds/mayflower-assets@13.1.0/css/global.min.css",
      "https://unpkg.com/@massds/mayflower-assets@13.1.0/css/layout.min.css",
      "https://unpkg.com/@massds/mayflower-assets@13.1.0/css/brand-banner.min.css",
      "https://unpkg.com/@massds/mayflower-assets@13.1.0/css/footer-slim.css",
    ];

    stylesheets.forEach((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    });
  };

  const addFooter = () => {
    const footerHTML = `
      <footer data-nosnippet="true" class="ma__footer-new" id="footer">
        <div class="ma__footer-new__container">
          <div class="ma__footer-new__logo">
            <a href="/" title="Mass.gov home page">
              <img
                src="https://unpkg.com/@massds/mayflower-assets@13.1.0/static/images/logo/stateseal.png"
                alt="Massachusetts State Seal"
                width="100"
                height="100"
              />
            </a>
          </div>
          <div class="ma__footer-new__content">
            <nav class="ma__footer-new__navlinks" aria-label="site navigation">
              <div index="0">
                <a href="https://www.mass.gov/topics/massachusetts-topics">
                  All Topics
                </a>
              </div>
              <div index="1">
                <a href="https://www.mass.gov/massgov-site-policies">Site Policies</a>
              </div>
              <div index="2">
                <a href="https://www.mass.gov/topics/public-records-requests">
                  Public Records Requests
                </a>
              </div>
            </nav>
            <div class="ma__footer-new__copyright">
              <div class="ma__footer-new__copyright--bold">
                © 2024 Commonwealth of Massachusetts.
              </div>
              <span>
                Mass.gov® is a registered service mark of the Commonwealth of
                Massachusetts.
              </span>
              <a href="https://www.mass.gov/privacypolicy">Mass.gov Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    `;
    const footer = document.createElement("div");
    footer.innerHTML = footerHTML;
    document.body.appendChild(footer);
  };

  useEffect(() => {
    addMayflowerStyles();
    addFooter();
  }, []);

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
    <SpaceBetween direction="vertical" size="l">
      <div style={{ marginTop: '20px' }}>
        <Container>
          <div className={styles.input_textarea_container}>
            <SpaceBetween size="xs" direction="horizontal" alignItems="center">
              <span style={{ fontFamily: 'Calibri, sans-serif', fontSize: 18 }}>I am a</span>
              <Select
                options={typeOptions}
                selectedOption={selectedType}
                onChange={({ detail }) => {
                  setSelectedType(detail.selectedOption);
                  selectPrompt(detail.selectedOption.value || 'General');
                }}
                placeholder="Select type"
              />
              <span style={{ fontFamily: 'Calibri, sans-serif', fontSize: 18 }}>looking for grants for</span>
              <TextareaAutosize
                className={styles.input_textarea}
                style={{ width: '400px' }} //size of input area
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
              </div>
            </SpaceBetween>
          </div>
        </Container>
        <div className={styles.info_bar}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ marginTop: '30px' }}>
              <AIWarning />
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
      </div>
    </SpaceBetween>
  );
}
