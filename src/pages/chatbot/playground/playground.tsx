import BaseAppLayout from "../../../components/base-app-layout";
import Chat from "../../../components/chatbot/chat";

import { Link, useParams } from "react-router-dom";
import { Alert, Header, HelpPanel } from "@cloudscape-design/components";
import EmailPanel from "../../../components/chatbot/email-panel"
import { useState, useEffect } from "react";
import { ChatBotHistoryItem } from "../../../components/chatbot/types";

export default function Playground() {
  const { sessionId } = useParams();
  const [emailPanelShown, setEmailPanelShown] = useState<boolean>(false);
  const [messageHistoryForEmail, setMessageHistoryForEmail] = useState<ChatBotHistoryItem[]>([]);

  useEffect(() => {
    console.log("email history updated")
    console.log(messageHistoryForEmail);
  },[messageHistoryForEmail])
  return (    
    <BaseAppLayout
      info={
        <HelpPanel header={<Header variant="h3">Using the chat</Header>}>
          <p>
            This chatbot application allows users to ask questions about the MassHealth Enrollment Center.
          </p>
          <h3>Session history</h3>
          <p>
            All conversations are saved and can be later accessed in the navigation bar.
          </p>
        </HelpPanel>
      }
      toolsWidth={300}
      splitPanel={<EmailPanel isHidden={false} messageHistory={messageHistoryForEmail}/>}
      content={
       <div>
      {/* <Chat sessionId={sessionId} /> */}
      
      <Chat sessionId={sessionId} updateEmailFunction={setMessageHistoryForEmail} />
      </div>
     }
    />    
  );
}
