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
  const [loadingSessions, setLoadingSessions] = useState(false);

  const loadSessions = async () => {
    setLoadingSessions(true);
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
    } finally {
      setLoadingSessions(false);
    }
  };

  // Reload button click handler
  const onReloadClick = () => {
    console.log("Reload button clicked");
    loadSessions().catch(error => {
      console.error("Failed to reload sessions manually:", error);
      // Optionally, update the UI here to show an error message
    });
    console.log("Reload button done");
  };

  useEffect(() => {
    // loadSessions();
  }, [apiClient]);

  useEffect(() => {
    const handleSessionUpdate = () => {
      loadSessions();
    };

    window.addEventListener('sessionCreated', handleSessionUpdate);
    return () => {
      window.removeEventListener('sessionCreated', handleSessionUpdate);
    };
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
        })).concat([{
          type: "link",
          info: <Button onClick={onReloadClick} iconName="refresh" loading={loadingSessions} variant="link">Reload Sessions</Button>
        }]),
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

  const onChange = ({ detail }) => {
    const sectionIndex = items.findIndex(item => item.text === detail.item.text);
    // Toggle the collapsed state in a new object to trigger re-render
    const newCollapsedSections = {
      ...navigationPanelState.collapsedSections,
      [sectionIndex]: !navigationPanelState.collapsedSections[sectionIndex]
    };
    setNavigationPanelState({
      ...navigationPanelState,
      collapsedSections: newCollapsedSections
    });
  };

  return (
    <div>
      <Box margin="xs" padding={{ top: "l" }} textAlign="center">
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
      </Box>
      <SideNavigation
        onFollow={onFollow}
        onChange={onChange}
        items={items.map((item, idx) => ({
          ...item,
          defaultExpanded: !navigationPanelState.collapsedSections[idx]
        }))}
      />
    </div>
  );
}


