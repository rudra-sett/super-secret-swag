import {
  SideNavigation,
  SideNavigationProps,
  Header,
  Button,
  Box,
  SpaceBetween,
} from "@cloudscape-design/components";
import useOnFollow from "../common/hooks/use-on-follow";
import { useNavigationPanelState } from "../common/hooks/use-navigation-panel-state";
import { AppContext } from "../common/app-context";
import PencilSquareIcon from "../../public/images/pencil-square.jsx";
import RouterButton from "../components/wrappers/router-button";
import { useContext, useState, useEffect } from "react";
import { ApiClient } from "../common/api-client/api-client";
import { CHATBOT_NAME } from "../common/constants";
import { Auth } from "aws-amplify";
import { v4 as uuidv4 } from "uuid";

export default function NavigationPanel() {
  const appContext = useContext(AppContext);
  // const uid = ; 
  const apiClient = new ApiClient(appContext);
  const onFollow = useOnFollow();
  const [navigationPanelState, setNavigationPanelState] =
    useNavigationPanelState();

  const [sessions, setSessions] = useState<any[]>([]);
  const [items, setItems] = useState<SideNavigationProps.Item[]>([]);

  const loadSessions = async () => {
    try {
      let username;
      await Auth.currentAuthenticatedUser().then((value) => username = value.username);
      if (username) {
        const fetchedSessions = await apiClient.sessions.getAllSessions(username);
        updateItems(fetchedSessions);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
      // update UI here to show an error message
    }
  };

  // Reload button click handler
  const onReloadClick = () => {
    loadSessions().catch(error => {
      console.error("Failed to reload sessions manually:", error);
      // Optionally, update the UI here to show an error message
    });
  };

  useEffect(() => {
    // loads sessions on initial render
    
    loadSessions();

    // refreshes sessions every minute
    const interval = setInterval(loadSessions, 60000);

    return () => clearInterval(interval);
  }, [apiClient]);

  //  const [items, setItems] = useState<SideNavigationProps.Item[]>
  // const [items] = useState<SideNavigationProps.Item[]>(() => {
  const updateItems = (sessions: any[]) => {
    const newItems: SideNavigationProps.Item[] = [
      {
        type: "section",
        text: "Session History",
        items: sessions.map(session => ({
          type: "link",
          text: `${session.title}`,
          href: `/chatbot/playground/${session.session_id}`,
        })),
      },
      {
        type: "section",
        text: "Admin",
        items: [
          { type: "link", text: "Update Data", href: "/admin/add-data" },
          { type: "link", text: "Data", href: "/admin/data" }
        ],
      },
    ];
    setItems(newItems);
  };

  // useEffect(() => {
  //   setItems(prevItems => {
  //     const newItems = [...prevItems]; 
  //     const sessionIndex = newItems.findIndex(item => item.type === "section" && item.text === "Session History");

  //     if (sessionIndex !== -1 && newItems[sessionIndex].type === "section") {
  //       newItems[sessionIndex].items = sessions.map(session => ({
  //         type: "link",
  //         text: `Session ${session.session_id}`,
  //         href: `/chatbot/sessions/${session.session_id}`
  //       }));
  //     }
  //     return newItems; 
  //   }); 
  // }, [sessions]); 

  const onChange = ({
    detail,
  }: {
    detail: SideNavigationProps.ChangeDetail;
  }) => {
    // const sectionIndex = items.findIndex(detail.item);
    const sectionIndex = items.indexOf(detail.item);
    setNavigationPanelState({
      collapsedSections: {
        ...navigationPanelState.collapsedSections,
        [sectionIndex]: !detail.expanded,
      },
    });
  };

  return (
    <div>
      <Box margin="xs" padding="xs" textAlign="center">
        <RouterButton
          iconAlign="right"
          iconSvg={<PencilSquareIcon />}
          variant="primary"
          href={`/chatbot/playground/${uuidv4()}`}
          data-alignment="right"
          className="new-chat-button"
          style={{ textAlign: "right"}}
        >
          New session

        </RouterButton>
        <Button onClick={onReloadClick} iconName="refresh">Reload Sessions</Button>
      </Box>
      {/* </SpaceBetween> */}
      <SideNavigation
        onFollow={onFollow}
        onChange={onChange}
        items={items}
      // items={items.map((value, idx) => {
      //   if (value.type === "section") {
      //     const collapsed = navigationPanelState.collapsedSections?.[idx] === true;
      //     value.defaultExpanded = !collapsed;
      //   }

      //   return value;
      // })} 
      // // items={items}
      />
    </div>
  );
}


