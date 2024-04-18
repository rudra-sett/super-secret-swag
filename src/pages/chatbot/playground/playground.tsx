import BaseAppLayout from "../../../components/base-app-layout";
import Chat from "../../../components/chatbot/chat";

import { Link, useParams } from "react-router-dom";
import { Alert, Header, HelpPanel } from "@cloudscape-design/components";

export default function Playground() {
  const { sessionId } = useParams();

  const mainContent = (
    <div>
      <Alert
        statusIconAriaLabel="Info"
        header="Attention"
        type="info"  // Adjust the type as necessary
      >
        AI Models can make mistakes. Be mindful in validating important information.
      </Alert>
      <div className="chat_container">
        <Chat sessionId={sessionId} />
      </div>
    </div>
  );

  return (
    <BaseAppLayout
      content={mainContent}  // Passing the new main content structure
    />
  );
}

//   return (
//     <BaseAppLayout
//       info={
//         <Alert
//           statusIconAriaLabel="Info"
//           header="Attention"
//         >
//           AI Models can make mistakes. Be mindful in validating important information.
//         </Alert>
//       }
//       content={
//         <div>
//           <Chat sessionId={sessionId} />
//         </div>
//       }
//     />
//   );
// }