import {
  BreadcrumbGroup,
  ContentLayout,
  Header,
  SpaceBetween,
  Alert
} from "@cloudscape-design/components";
import useOnFollow from "../../common/hooks/use-on-follow";
import BaseAppLayout from "../../components/base-app-layout";
import DocumentsTab from "./documents-tab";
import { CHATBOT_NAME } from "../../common/constants";
import { useState, useEffect } from "react";
import { Auth } from "aws-amplify";

export default function WorkspacePane() {
  const onFollow = useOnFollow();
  const [admin, setAdmin] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const result = await Auth.currentAuthenticatedUser();
      // console.log(result);  
      if (!result || Object.keys(result).length === 0) {
        console.log("Signed out!")
        Auth.signOut();
        return;
      }

      try {
        const result = await Auth.currentAuthenticatedUser();
        const admin = result?.signInUserSession?.idToken?.payload["custom:role"]
        if (admin) {
          const data = JSON.parse(admin);
          if (data.includes("Admin")) {
            setAdmin(true);
          }
        }
      }
      catch (e){
        // const userName = result?.attributes?.email;
        console.log(e);
      }
    })();
  }, []);

  if (!admin) {
    return (
      <div
        style={{
          height: "90vh",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Alert header="Configuration error" type="error">
          You are not authorized to view this page!
        </Alert>
      </div>
    );
  }
  return (
    <BaseAppLayout
      contentType="cards"
      breadcrumbs={
        <BreadcrumbGroup
          onFollow={onFollow}
          items={[
            {
              text: CHATBOT_NAME,
              href: "/",
            },
            {
              text: "View Data",
              href: "/admin/data",
            },            
          ]}
        />
      }
      content={
        <ContentLayout
          header={
            <Header
              variant="h1"
            >
              Data Dashboard
            </Header>
          }
        >
          <SpaceBetween size="l">
            <DocumentsTab              
              documentType="file"
            />
          </SpaceBetween>
        </ContentLayout>
      }
    />
  );
}
