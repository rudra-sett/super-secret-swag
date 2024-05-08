import { useContext, useEffect, useState } from "react";
import {
  ChatBotConfiguration,
  ChatBotHistoryItem,
  ChatBotMessageType,
  FeedbackData,
} from "./types";
import { Auth } from "aws-amplify";
import { SpaceBetween, StatusIndicator, Alert, Flashbar } from "@cloudscape-design/components";
import { v4 as uuidv4 } from "uuid";
import { AppContext } from "../../common/app-context";
import { ApiClient } from "../../common/api-client/api-client";
import ChatMessage from "./chat-message";
import ChatInputPanel, { ChatScrollState } from "./chat-input-panel";
import styles from "../../styles/chat.module.scss";
import { CHATBOT_NAME } from "../../common/constants";
import { useNotifications } from "../notif-manager";

export default function Chat(props: { sessionId?: string }) {
  const appContext = useContext(AppContext);
  const [running, setRunning] = useState<boolean>(true);
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

  const { notifications, addNotification } = useNotifications();

  const [messageHistory, setMessageHistory] = useState<ChatBotHistoryItem[]>(
    []
  );

  // // add useEffect that sets the isNewSession to true after the first message is sent and the stream is done.
  // useEffect(() => {
  //   if (messageHistory.length === 0 && !running) {
  //     console.log("First message has been rendered");
  //     setNewSession(true);
  //     console.log("setNewSession to true in chat");
  //   }
  // }, [messageHistory]);  // Dependency on messageHistory and the handled flag

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
        let username;
        await Auth.currentAuthenticatedUser().then((value) => username = value.username);
        if (!username) return;
        const hist = await apiClient.sessions.getSession(props.sessionId,username);

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
                metadata: x!.metadata!,
                content: x!.content,
              }))
          );

          window.scrollTo({
            top: 0,
            behavior: "instant",
          });
        }
        setSession({ id: props.sessionId, loading: false });
        setRunning(false);
      } catch (error) {
        console.log(error);
        addNotification("error",error.message)
        addNotification("info","Please refresh the page")
      }
    })();
  }, [appContext, props.sessionId]);

  const handleFeedback = (feedbackType: 1 | 0, idx: number, message: ChatBotHistoryItem, feedbackTopic? : string, feedbackProblem? : string, feedbackMessage? : string) => {
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
        topic: feedbackTopic,
        problem: feedbackProblem,
        comment: feedbackMessage     
      };
      addUserFeedback(feedbackData);
    // }
  };

  const addUserFeedback = async (feedbackData) => {
    if (!appContext) return;
    const apiClient = new ApiClient(appContext);
    await apiClient.userFeedback.sendUserFeedback(feedbackData);
  }

  return (
    <div className={styles.chat_container}> 
      <SpaceBetween direction="vertical" size="m">
        
      {messageHistory.length == 0 && !session?.loading && (
       <Alert
          statusIconAriaLabel="Info"
          header=""
       >
        AI Models can make mistakes. Be mindful in validating important information.
      </Alert> )}

      {/* <SpaceBetween direction="vertical" size="m"></SpaceBetween> */}
        {messageHistory.map((message, idx) => (
          <ChatMessage
            key={idx}
            message={message}
            showMetadata={configuration.showMetadata}
            onThumbsUp={() => handleFeedback(1,idx, message)}
            onThumbsDown={(feedbackTopic : string, feedbackType : string, feedbackMessage: string) => handleFeedback(0,idx, message,feedbackTopic, feedbackType, feedbackMessage)}
          />
        ))}
      </SpaceBetween>
      <div className={styles.welcome_text}>
        {messageHistory.length == 0 && !session?.loading && (
          <center>{CHATBOT_NAME}</center>
        )}
        {session?.loading && (
          <center>
            <StatusIndicator type="loading">Loading session</StatusIndicator>
          </center>
        )}
      </div>
      <div className={styles.input_container}>
        <ChatInputPanel
          session={session}
          running={running}
          setRunning={setRunning}
          messageHistory={messageHistory}
          setMessageHistory={(history) => setMessageHistory(history)}
          configuration={configuration}
          setConfiguration={setConfiguration}
        />
      </div>
    </div>
  );
}
