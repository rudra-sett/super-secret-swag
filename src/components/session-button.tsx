import { ButtonDropdown, SpaceBetween } from "@cloudscape-design/components";
import RouterButton from "../components/wrappers/router-button"
import RouterLink from "../components/wrappers/router-link"
import React from 'react';
import { useParams } from "react-router-dom";
import styles from "../styles/chat.module.scss"

export interface SessionButtonProps {
  title: string,
  id: string
}

export default function SessionButton(props : SessionButtonProps) {

  const {sessionId} = useParams()

  return(<div>
    {/* <SpaceBetween direction="horizontal" size="xxs"> */}
    <RouterLink className={styles.session_link} href={`/chatbot/playground/${props.id}`}>{sessionId == props.id? <strong className={styles.session_link_selected}>{props.title}</strong> : <strong className={styles.session_link}>{props.title}</strong>}</RouterLink>
    {/* <ButtonDropdown items={[{id: props.id, disabled: false, text : "Delete", href : "item.uri"}]}></ButtonDropdown> */}
    {/* </SpaceBetween> */}
  </div>);
}
