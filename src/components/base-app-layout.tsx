import { AppLayout, AppLayoutProps } from "@cloudscape-design/components";

import { ReactElement, useState } from "react";

export default function BaseAppLayout(
  props: AppLayoutProps & { info?: ReactElement }
) {
 

  return (
    <AppLayout
      headerSelector="#awsui-top-navigation"
   
       toolsHide = {props.info === undefined ? true : false}
   
       tools={props.info}
 
        {...props}
    />
  );
}
