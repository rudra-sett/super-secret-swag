import BaseAppLayout from "../../../components/base-app-layout";
import Chat from "../../../components/chatbot/chat";

import { Link, useParams } from "react-router-dom";
import { Header, HelpPanel } from "@cloudscape-design/components";
import "../../../styles/chat.module.scss"; 
export default function Playground() {
  const { sessionId } = useParams();

  return (
    <BaseAppLayout
      
      info={
        <HelpPanel header={<Header variant="h3">Using the search tool</Header>}>
          <p>
            This enhanced search application helps people discover grant opportunities from the State of Massachusetts Executive Office of Energy and Environmental Affairs (EEOEA)
          </p>
          <h3>More resources</h3>
          <p>
            Discover more about the grant programs offered by the EOEEA here!
          </p>
        
        </HelpPanel>
      }
// toolsWidth={0}
      content={<Chat sessionId={sessionId} />}
    />
  );
}
