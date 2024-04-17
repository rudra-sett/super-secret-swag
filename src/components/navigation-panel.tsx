import {
  SideNavigation,
  SideNavigationProps,
  Header,
  Button,
  SpaceBetween,
} from "@cloudscape-design/components";

import useOnFollow from "../common/hooks/use-on-follow";
import { useNavigationPanelState } from "../common/hooks/use-navigation-panel-state";
import { AppContext } from "../common/app-context";
import  RouterButton from "../components/wrappers/router-button"; 
import { useContext, useState, useEffect } from "react";
import { ApiClient } from "../common/api-client/api-client";
import { SessionsClient } from "../common/api-client/sessions-client";
import { CHATBOT_NAME } from "../common/constants";
import { v4 as uuidv4 } from "uuid";

export default function NavigationPanel() {
  const appContext = useContext(AppContext);
  // const uid = ; 
  const apiClient = new ApiClient(appContext); 
  const onFollow = useOnFollow();
  const [navigationPanelState, setNavigationPanelState] =
    useNavigationPanelState();

  const [sessions, setSessions] = useState<any[]>([]);
  const[items, setItems] = useState<SideNavigationProps.Item[]>([]); 

  useEffect(() => {
    async function loadSessions() {
      const fetchedSessions = await apiClient.sessions.getSessions("0"); 
      // console.log(fetchedSessions); 
      setSessions(fetchedSessions); 
      updateItems(fetchedSessions); 
    }
   // hit console.log("pong"); 
    loadSessions(); 
  }, [apiClient]); 

 // const [items, setItems] = useState<SideNavigationProps.Item[]>
 // const [items] = useState<SideNavigationProps.Item[]>(() => {
  const updateItems = (sessions: any[]) => {
    const newItems: SideNavigationProps.Item[] = [
      {
        type: "link",
        text: "Home",
        href: "/",
      },
      {
        type: "link",
        text: "New Session", 
        href: `/chatbot/playground/${uuidv4()}`,
      },
      {
        type: "section",
        text: "Chatbot",
        items: [
          { type: "link", text: "Chat", href: "/chatbot/playground" },

        ],
      },
      {
        type: "section",
        text: "Admin",
        items: [
          { type: "link", text: "Update Data", href: "/admin/add-data" },
          { type: "link", text: "Data", href: "/admin/data" }
        ],
      },
      // {
      //   type: "divider"
      // },
      {
        type: "section",
        text: "Session History",
        items: sessions.map(session => ({ 
           type: "link", 
           text: `${session.title}`, 
           href: `/chatbot/playground/${session.session_id}`,
          })), 
      }, // finish changing back from v2
    ]; 
    setItems(newItems); 
    // console.log("pong")
    //  return items; 
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
     <Header> 
       <RouterButton
       // iconAlign="left"
         iconName="add-plus"
         variant="inline-link"
         href={`/chatbot/playground/${uuidv4()}`}
      
         >
         New session
       </RouterButton>
     </Header>
    <SideNavigation
        onFollow={onFollow}
        onChange={onChange}
        header={{ href: "/", text: CHATBOT_NAME }}
        items = {items}
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


