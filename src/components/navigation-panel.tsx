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

  useEffect(() => {
    async function loadSessions() {
      let username;
      await Auth.currentAuthenticatedUser().then((value) => username = value.username);
      if (username) {
        const fetchedSessions = await apiClient.sessions.getSessions(username);
        updateItems(fetchedSessions);
      }
      // console.log(fetchedSessions); 
      // setSessions(fetchedSessions); 

    }
    // hit console.log("pong"); 

    const interval = setInterval(loadSessions, 1000);
    // loadSessions();

    return () => clearInterval(interval);
    // loadSessions(); 
  }, [apiClient]);

  //  const [items, setItems] = useState<SideNavigationProps.Item[]>
  // const [items] = useState<SideNavigationProps.Item[]>(() => {
  const updateItems = (sessions: any[]) => {
    // console.log("hit the update button")
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

<<<<<<< HEAD
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
=======
        ],
      },
      // {
      //   type: "section",
      //   text: "Admin",
      //   items: [
      //     { type: "link", text: "Update Data", href: "/admin/add-data" },
      //     { type: "link", text: "Data", href: "/admin/data" }
      //   ],
      // },
>>>>>>> af7476b (removed admin & changed system prompt)
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
      <SideNavigation
        onFollow={onFollow}
        onChange={onChange}
        // header={{ href: "/", text: "The Ride Guide AI" }}
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


