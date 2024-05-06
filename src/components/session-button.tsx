import { ButtonDropdown, SpaceBetween } from "@cloudscape-design/components";
import RouterButton from "../components/wrappers/router-button"
import RouterLink from "../components/wrappers/router-link"
import React from 'react';
import { useParams } from "react-router-dom";

export interface SessionButtonProps {
  title: string,
  id: string
}

export default function SessionButton(props : SessionButtonProps) {

  const {sessionId} = useParams()

  return(<div>
    {/* <SpaceBetween direction="horizontal" size="xxs"> */}
    <RouterLink href={`/chatbot/playground/${props.id}`}>{sessionId == props.id? props.title : <strong>{props.title}</strong>}</RouterLink>
    {/* <ButtonDropdown items={[{id: props.id, disabled: false, text : "Delete", href : "item.uri"}]}></ButtonDropdown> */}
    {/* </SpaceBetween> */}
  </div>);
}
