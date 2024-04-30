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
import { Auth } from "aws-amplify";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "../common/session-context";
import { useNotifications } from "../components/notif-manager";

export default function NavigationPanel() {
  const appContext = useContext(AppContext);
  const apiClient = new ApiClient(appContext);
  const onFollow = useOnFollow();
  const [navigationPanelState, setNavigationPanelState] = useNavigationPanelState();
  const [sessions, setSessions] = useState<any[]>([]);
  const [items, setItems] = useState<SideNavigationProps.Item[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const { isNewSession, setNewSession } = useSession();
  const { addNotification } = useNotifications();

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      let username = await Auth.currentAuthenticatedUser().then((value) => value.username);
      if (username) {
        const fetchedSessions = await apiClient.sessions.getAllSessions(username);
        updateItems(fetchedSessions);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
      addNotification("error", "Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  const onReloadClick = async () => {
    await loadSessions();
    addNotification("success", "Sessions reloaded successfully!");
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    const performSessionLoad = async () => {
      if (isNewSession) {
        console.log(isNewSession)
        console.log("New session detected, loading sessions.");
        await loadSessions();
        setNewSession(false);
        console.log("reset session state back to false");
      }
    };
  
    performSessionLoad();
  }, [isNewSession, loadSessions]);

  const updateItems = (sessions) => {
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

  const onChange = ({ detail }) => {
    const sectionIndex = items.findIndex(item => item.text === detail.item.text);
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
