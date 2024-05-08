import {
  BreadcrumbGroup,
  ContentLayout,
  Header,
  SpaceBetween,
} from "@cloudscape-design/components";
import {
  Authenticator,
  Heading,
  useTheme,
} from "@aws-amplify/ui-react";
import BaseAppLayout from "../../components/base-app-layout";
import useOnFollow from "../../common/hooks/use-on-follow";
import FeedbackTab from "./feedback-tab";
import { CHATBOT_NAME } from "../../common/constants";

export default function UserFeedbackPage() {
  const onFollow = useOnFollow();
  const { tokens } = useTheme();
  
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
              text: "View Feedback",
              href: "/admin/user-feedback",
            },
          ]}
        />
      }
      content={
        <ContentLayout header={<Header variant="h1">View Feedback</Header>}>
          <SpaceBetween size="l">
                <FeedbackTab/>
          </SpaceBetween>
        </ContentLayout>
      }
    />
  );
}
