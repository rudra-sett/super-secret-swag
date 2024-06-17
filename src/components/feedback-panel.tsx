import React, { useRef, useState } from 'react';
import { useEffect } from 'react';
import { Box, Cards, ColumnLayout, Container, ContentLayout, ExpandableSection, Header, Link, SpaceBetween, SplitPanel, TextContent, } from '@cloudscape-design/components';
import { Auth } from 'aws-amplify';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "../styles/chat.module.scss";

export interface FeedbackPanelProps {
  selectedFeedback: any;
}

export default function EmailPanel(props: FeedbackPanelProps) {

  useEffect(() => {
    console.log(props.selectedFeedback)
  }, [props.selectedFeedback]);

  return (
    <div>
      <SplitPanel header="Selected Feedback" hidePreferencesButton={true}>
        <ColumnLayout columns={2}>
          <SpaceBetween size="m">
            <Container
              header={
                <Header
                  variant="h2"
                >
                  User Prompt
                </Header>
              }
            >
              {props.selectedFeedback.UserPrompt ? props.selectedFeedback.UserPrompt : "No feedback selected"}
            </Container>

            <Container
              header={
                <Header
                  variant="h2"
                >
                  User Comments
                </Header>
              }
            >
              {props.selectedFeedback.FeedbackComments ? props.selectedFeedback.FeedbackComments : "No feedback selected"}
            </Container>

          </SpaceBetween>
          <Container
            header={
              <Header
                variant="h2"
              >
                Chatbot Response
              </Header>
            }
          >
            {props.selectedFeedback.ChatbotMessage ? props.selectedFeedback.ChatbotMessage : "No feedback selected"}
            {props.selectedFeedback.Sources ?

              <ExpandableSection headerText="Sources">
                {<Cards                      
                      cardDefinition={{
                        header: item => (
                          <Link href={item.uri} external={true} fontSize="body-s">
                            {item.title}
                          </Link>
                        ),                        
                      }}
                      cardsPerRow={[
                        { cards: 1 },
                        { minWidth: 500, cards: 3 }
                      ]}
                      items={JSON.parse(props.selectedFeedback.Sources) as any[]}
                      loadingText="Loading sources..."
                      empty={
                        <Box
                          margin={{ vertical: "xs" }}
                          textAlign="center"
                          color="inherit"
                        >
                          <SpaceBetween size="m">
                            <b>No sources</b>                            
                          </SpaceBetween>
                        </Box>
                      }
                    // header={<Header>Example Cards</Header>}
                    />}
              </ExpandableSection>

              : <></>}
          </Container>
        </ColumnLayout>
      </SplitPanel>
    </div>
  );
}