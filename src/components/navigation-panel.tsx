import {
  SideNavigation,
  SideNavigationProps,
  Header,
  Button,
  Box,
  SpaceBetween,
  StatusIndicator
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
  const apiClient = new ApiClient(appContext);
  const onFollow = useOnFollow();
  const [navigationPanelState, setNavigationPanelState] =
    useNavigationPanelState();
  const [items, setItems] = useState<SideNavigationProps.Item[]>([]);
  const [loaded,setLoaded] = useState<boolean>(false);

  // update the list of sessions every now and then
  useEffect(() => {
    async function loadSessions() {
      let username;
      await Auth.currentAuthenticatedUser().then((value) => username = value.username);
      if (username) {
        const fetchedSessions = await apiClient.sessions.getSessions(username);
        updateItems(fetchedSessions);
        if (!loaded) {
          setLoaded(true);
        }
      }
    }

    const interval = setInterval(loadSessions, 1000);
    // loadSessions();

    return () => clearInterval(interval);
    // loadSessions(); 
  }, [apiClient]);

  // helper function to update items
  const updateItems = (sessions: any[]) => {
    const newItems: SideNavigationProps.Item[] = [
      // {
      //   type: "link",
      //   text: "Home",
      //   href: "/",
      // },
      // // {
      // //   type: "link",
      // //   text: "New Session", 
      // //   href: `/chatbot/playground/${uuidv4()}`,
      // // },
      // {
      //   type: "section",
      //   text: "Chatbot",
      //   items: [
      //     { type: "link", text: "Chat", href: "/chatbot/playground" },

      //   ],
      // },
      {
        type: "section",
        text: "Admin",
        items: [
          { type: "link", text: "Update Data", href: "/admin/add-data" },
          { type: "link", text: "Data", href: "/admin/data" }
        ],
      },
      {
        type: "section",
        text: "Session History",
        items: sessions.map(session => ({
          type: "link",
          text: `${session.title}`,
          href: `/chatbot/playground/${session.session_id}`,
        })),
      },
    ];
    setItems(newItems);
    // console.log("pong")
    // return items; 
  };

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
      {/* <div style={{ justifyContent: 'center' }}>
        <Header >
          MBTA The RIDE Guide AI
        </Header>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <RouterButton
          iconAlign="right"
          iconSvg={<PencilSquareIcon />}
          variant="primary"
          href={`/chatbot/playground/${uuidv4()}`}
        >
          New session
        </RouterButton>

      </div>
      <Header>
        <RouterButton
          iconAlign="right"
          iconSvg={<PencilSquareIcon />}
          variant="primary"
          href={`/chatbot/playground/${uuidv4()}`}
          data-alignment="right"
          className="new-chat-button"
          style={{ textAlign: "right" }}
        >
          New session

        </RouterButton>

      </Header> */}
      {/* <SpaceBetween alignItems="center" size="s"> */}
      <Box margin="xs" padding="xs" textAlign="center">
        <RouterButton
          iconAlign="right"
          iconSvg={<PencilSquareIcon />}
          variant="primary"
          href={`/chatbot/playground/${uuidv4()}`}
          data-alignment="right"
          className="new-chat-button"
          style={{ textAlign: "right" }}
        >
          New session

        </RouterButton>
        </Box>
      {/* </SpaceBetween> */}
      {loaded ?
      <SideNavigation
        onFollow={onFollow}
        onChange={onChange}
        // header={{ href: "/", text: "The Ride Guide AI" }}
        items={items}   
      /> : <StatusIndicator type="loading">Loading</StatusIndicator>}
    </div>
  );
}


