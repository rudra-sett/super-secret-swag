import BaseAppLayout from "../../../components/base-app-layout";
import Chat from "../../../components/chatbot/chat";

import { Link, useParams } from "react-router-dom";
import { Alert, Header, HelpPanel } from "@cloudscape-design/components";
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
            Discover more about the grant programs offered by the EOEEA <a href="https://www.mass.gov/orgs/eea-office-of-grants-and-technical-assistance">here</a>.
            <br></br>
            Explore the EOEEA Homepage <a href="https://www.mass.gov/orgs/executive-office-of-energy-and-environmental-affairs">here</a>.
            <br></br>
            Learn more about the developers o the EOEEA Grants Navigator here <a href="https://burnes.northeastern.edu/ai-for-impact-coop/">here</a>.
          </p>
        
        </HelpPanel>
      }
// toolsWidth={0}
      content={<Chat sessionId={sessionId} />}
    />
  );
}
