import { useContext, useEffect, useState } from "react";
import {
  ChatBotConfiguration,
  ChatBotHistoryItem,
  ChatBotMessageType,
  FeedbackData,
} from "./types";
// import { Auth } from "aws-amplify";
import { Alert, SpaceBetween, StatusIndicator } from "@cloudscape-design/components";
import { v4 as uuidv4 } from "uuid";
import { AppContext } from "../../common/app-context";
import { ApiClient } from "../../common/api-client/api-client";
import ChatMessage from "./chat-message";
import ChatInputPanel, { ChatScrollState } from "./chat-input-panel";
import styles from "../../styles/chat.module.scss";
import { CHATBOT_NAME } from "../../common/constants";


export default function Chat(props: { sessionId?: string }) {
  const appContext = useContext(AppContext);
  const [running, setRunning] = useState<boolean>(false);
  const [session, setSession] = useState<{ id: string; loading: boolean }>({
    id: props.sessionId ?? uuidv4(),
    loading: typeof props.sessionId !== "undefined",
  });
  const [configuration, setConfiguration] = useState<ChatBotConfiguration>(
    () => ({
      streaming: true,
      showMetadata: true,
      maxTokens: 512,
      temperature: 0.6,
      topP: 0.9,
      files: null,
    })
  );

  const [messageHistory, setMessageHistory] = useState<ChatBotHistoryItem[]>(
    []
  );

  useEffect(() => {
    if (!appContext) return;
    setMessageHistory([]);

    (async () => {
      if (!props.sessionId) {
        setSession({ id: uuidv4(), loading: false });
        return;
      }

      setSession({ id: props.sessionId, loading: true });
      const apiClient = new ApiClient(appContext);
      try {
        // const result = await apiClient.sessions.getSession(props.sessionId);
        const hist = await apiClient.sessions.getSession(props.sessionId,"11");

        if (hist) {
          // console.log(hist);
          ChatScrollState.skipNextHistoryUpdate = true;
          ChatScrollState.skipNextScrollEvent = true;
          // console.log("History", result.data.getSession.history);
          setMessageHistory(
            hist
              .filter((x) => x !== null)
              .map((x) => ({
                type: x!.type as ChatBotMessageType,
                metadata: {}, //JSON.parse(x!.metadata!),
                content: x!.content,
              }))
          );

          window.scrollTo({
            top: 0,
            behavior: "instant",
          });
        }
      } catch (error) {
        console.log(error);
      }

      setSession({ id: props.sessionId, loading: false });
      setRunning(false);
    })();
  }, [appContext, props.sessionId]);

  const handleFeedback = (feedbackType: 1 | 0, idx: number, message: ChatBotHistoryItem) => {
    
    // if (message.metadata.sessionId) {
      console.log("submitting feedback...")
      // let prompt = "";
      // if (Array.isArray(message.metadata.prompts) && Array.isArray(message.metadata.prompts[0])) { 
      //     prompt = message.metadata.prompts[0][0];
      // }
      const prompt = messageHistory[idx - 1].content
      const completion = message.content;
      // const model = message.metadata.modelId;
      const feedbackData = {
        sessionId: props.sessionId, //message.metadata.sessionId as string,        
        feedback: feedbackType,
        prompt: prompt,
        completion: completion,        
      };
      addUserFeedback(feedbackData);
    // }
  };

  const addUserFeedback = async (feedbackData) => {
    // if (!appContext) return;

    // const apiClient = new ApiClient(appContext);
    // await apiClient.userFeedback.addUserFeedback({feedbackData});
    // console.log("hi")
    const response = await fetch('https://4eyjyb4lqouzyvvvs5fh6zwwse0spnhw.lambda-url.us-east-1.on.aws/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body : JSON.stringify({feedbackData})
    });
    console.log(response);
  }
  return (
    <div>
      
      {/* {messageHistory.length === 0 && !session?.loading && (
        <div className={`${styles.fullscreen_center} ${styles.chatbot_name}`}>
          <SpaceBetween direction="vertical" size="l">
          {CHATBOT_NAME}
            </SpaceBetween>
            </div>
      )} */}
      <div className={styles.welcome_text}>
        {session?.loading && (
          <center>
            <StatusIndicator type="loading">Loading session</StatusIndicator>
          </center>
        )}
      </div>
      <div className={styles.input_container}>
        <SpaceBetween direction="vertical" size="m">
        <Alert
          dismissible
          statusIconAriaLabel="info"
          type="warning"
          header=""
          >
            AI Models can make mistakes. Be mindful in validating important information.
            Please refrain from including any personal information such as name, address, or birthday. 
            The 'EEA Grants Navigator' only assists with finding not applying for grant opportunities.
            </Alert>
            
          <ChatInputPanel
            session={session}
            running={running}
            setRunning={setRunning}
            messageHistory={messageHistory}
            setMessageHistory={setMessageHistory}
            configuration={configuration}
            setConfiguration={setConfiguration} />
        </SpaceBetween>
        <div className={styles.chat_container}>
          <SpaceBetween direction="vertical" size="m">
            {messageHistory.map((message, idx) => (
              <ChatMessage
                key={idx}
                message={message}
                showMetadata={configuration.showMetadata}
                onThumbsUp={() => handleFeedback(1, idx, message)}
                onThumbsDown={() => handleFeedback(0, idx, message)} />
            ))}
          </SpaceBetween>
        </div>
      </div>
    </div>
  );
  

}
