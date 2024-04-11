// import React from 'react';
// import {BaseComponentProps} from  "@cloudscape-design/components"; 
import { SideNavigationProps } from "@cloudscape-design/components"
import useOnFollow from "../../common/hooks/use-on-follow";

export interface SideBarProps extends SideNavigationProps {
    /** Controls the header that appears at the top of the navigation component 
     * 
    */
   header?: SideNavigationProps.Header; 

   activeHref?: string; 

    
   

}