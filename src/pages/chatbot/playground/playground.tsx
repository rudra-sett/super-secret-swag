import BaseAppLayout from "../../../components/base-app-layout";
import Chat from "../../../components/chatbot/chat";

import { Link, useParams } from "react-router-dom";
import { Alert, Header, HelpPanel } from "@cloudscape-design/components";

export default function Playground() {
  const { sessionId } = useParams();

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
      content={
       <div>
      {/* <Chat sessionId={sessionId} /> */}
      
      <Chat sessionId={sessionId} />
      </div>
     }
    />    
  );
}
