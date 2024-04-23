import {
  Alert,
  Box,
  Button,
  Container,
  ExpandableSection,
  Popover,
  Spinner,
  StatusIndicator,
  Tabs,
  TextContent,
  Textarea,
} from "@cloudscape-design/components";
import { useEffect, useState } from "react";
import { JsonView, darkStyles } from "react-json-view-lite";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "../../styles/chat.module.scss";
import {
  ChatBotConfiguration,
  ChatBotHistoryItem,
  ChatBotMessageType,
  ImageFile,
  RagDocument,
} from "./types";

import { getSignedUrl } from "./utils";

import "react-json-view-lite/dist/index.css";
import "../../styles/app.scss";

export interface ChatMessageProps {
  message: ChatBotHistoryItem;
  configuration?: ChatBotConfiguration;
  showMetadata?: boolean;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
}

export default function ChatMessage(props: ChatMessageProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [message] = useState<ChatBotHistoryItem>(props.message);
  const [files, setFiles] = useState<ImageFile[]>([] as ImageFile[]);
  const [documentIndex, setDocumentIndex] = useState("0");
  const [promptIndex, setPromptIndex] = useState("0");
  const [selectedIcon, setSelectedIcon] = useState<1 | 0 | null>(null);

  useEffect(() => {
    const getSignedUrls = async () => {
      setLoading(true);
      if (message.metadata?.files as ImageFile[]) {
        const files: ImageFile[] = [];
        console.log(message.metadata.RagDocument)
        for await (const file of message.metadata?.files as ImageFile[]) {
          const signedUrl = await getSignedUrl(file.key);
          files.push({
            ...file,
            url: signedUrl as string,
          });
        }

        setLoading(false); //WS CHECK HERE
        setFiles(files);
      }
    };

    if (message.metadata?.files as ImageFile[]) {
      getSignedUrls();
    }
  }, [message]);

  const content =
    props.message.content && props.message.content.length > 0
      ? props.message.content
      : props.message.tokens?.map((v) => v.value).join("")
      //const jsonSources = JSON.stringify(props.message.metadata, null, 2).replace(/\\n/g, "\\\\n");
    //   const jsonSources = JSON.stringify(props.message.metadata, null, 2)
    // .replace(/\\n/g, "\\\\n")
    // .replace(/^(\s*".+":)/gm, "$1 link");
    const jsonSources = JSON.stringify(props.message.metadata, null, 2)
    .replace(/"(https:\/\/[^"]+)"/g, '"Link: $1"');

    interface Props {
      message: {
        metadata: {
          Sources: string[];
        };
      };
    }
    //const pathJ = JSON.parse(prop)
    // gives just the links and a string
    // const jsonSources3 = (props.message.metadata.Sources as string[][]).map(source => `<a href="${source.trim().replace(/"/g, '')}" target="_blank">${source.trim().replace(/"/g, '')}</a>`)
    //.join('<br/>');
    // .map(source => `<a href="${source.trim().replace(/"/g, '')}" target="_blank">${source.trim().replace(/"/g, '')}</a>`));
    // const jsonSources2 = JSON.stringify(props.message.metadata.Sources as string[][])
    const jsonSources2 = (props.message.metadata.Sources as string[][])
    // const jsonSources3 = (jsonSources2 as string[][])
    // do as string[][] first and then map and then full stringify
    // use a reviewer if we figure it out
    // if that doesn't work take in jsonSources as an array of strings and map to it
  //   const formattedSources = jsonSources.replace(/^\[\n/, '')  // Remove the opening bracket and newline
  // .replace(/\n\]$/, '')  // Remove the closing bracket and newline
  // .replace(/\n {2}"/g, '"\n') // Remove leading spaces on each line and format
  // .replace(/",\n/g, '",\n\n'); // Double newlines for clearer separation

 // console.log(formattedSources);
    //console.log(jsonSources2)
      //as string[]).map(source => `<a href="${source.trim().replace(/"/g, '')}" target="_blank">${source.trim().replace(/"/g, '')}</a>`);
    //.map(source => `<a href="${source.trim().replace(/"/g, '')}" target="_blank">${source.trim().replace(/"/g, '')}</a>`)
    //.join('<br/>');
    

    //const jsonParsed = JSON.parse(JSON.stringify(props.message.metadata)).map(url => 'Link: ${url}').join('\n');

  return (
    <div>
      {props.message?.type === ChatBotMessageType.AI && (
        <Container
          footer={
            ((props?.showMetadata && props.message.metadata) ||
              (props.message.metadata &&
                props.configuration?.showMetadata)) && (
              <ExpandableSection variant="footer" headerText="Sources">
                  <textarea
                    style={{
                      width: '100%',  // Make the textarea full-width
                      height: '200px',  // Set a fixed height
                      backgroundColor: '#333',  // Dark background for the text area
                      color: '#fff',  // Light text color for readability
                      fontFamily: 'monospace',  // Monospace font for better JSON structure visibility
                      padding: '10px',  // Padding inside the textarea
                      border: 'none',  // No border for a cleaner look
                      borderRadius: '4px',  // Slightly rounded corners
                      resize: 'none'  // Disable resizing of the textarea
                    }}
                    value={jsonSources}  // Set the content of the textarea to the JSON string
                    readOnly  // Make the textarea read-only if editing is not required
                  />
                <JsonView
                  shouldInitiallyExpand={(level) => level < 2}
                  data={jsonSources.split(",")}
                  style={{
                    ...darkStyles,
                    stringValue: "jsonStrings",
                    numberValue: "jsonNumbers",
                    booleanValue: "jsonBool",
                    nullValue: "jsonNull",
                    container: "jsonContainer",
                  }}
                />
                {props.message.metadata.documents && (
                  <>
                    <div className={styles.btn_chabot_metadata_copy}>
                      <Popover
                        size="medium"
                        position="top"
                        triggerType="custom"
                        dismissButton={false}
                        content={
                          <StatusIndicator type="success">
                            Copied to clipboard
                          </StatusIndicator>
                        }
                      >
                        <Button
                          variant="inline-icon"
                          iconName="copy"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              (
                                props.message.metadata
                                  .documents as RagDocument[]
                              )[parseInt(documentIndex)].page_content
                            );
                          }}
                        />
                      </Popover>
                    </div>
                    <Tabs
                      tabs={(
                        props.message.metadata.documents as RagDocument[]
                      ).map((p: any, i) => {
                        return {
                          id: `${i}`,
                          label: p.metadata.path,
                          content: (
                            <>
                              <Textarea
                                value={p.metadata.path}
                               // value={label}
                                readOnly={true}
                                rows={8}
                              />
                            </>
                          ),
                        };
                      })}
                      activeTabId={documentIndex}
                      onChange={({ detail }) =>
                        setDocumentIndex(detail.activeTabId)
                      }
                    />
                  </>
                )}
                {props.message.metadata.prompts && (
                  <>
                    <div className={styles.btn_chabot_metadata_copy}>
                      <Popover
                        size="medium"
                        position="top"
                        triggerType="custom"
                        dismissButton={false}
                        content={
                          <StatusIndicator type="success">
                            Copied to clipboard
                          </StatusIndicator>
                        }
                      >
                        <Button
                          variant="inline-icon"
                          iconName="copy"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              (props.message.metadata.prompts as string[][])[
                                parseInt(promptIndex)
                              ][0]
                            );
                          }}
                        />
                      </Popover>
                    </div>
                    <Tabs
                      tabs={(props.message.metadata.prompts as string[][]).map(
                        (p, i) => {
                          return {
                            id: `${i}`,
                            label: `Prompt ${
                              (props.message.metadata.prompts as string[][])
                                .length > 1
                                ? i + 1
                                : ""
                            }`,
                            content: (
                              <>
                                <Textarea
                                  value={p[0]}
                                  readOnly={true}
                                  rows={8}
                                />
                              </>
                            ),
                          };
                        }
                      )}
                      activeTabId={promptIndex}
                      onChange={({ detail }) =>
                        setPromptIndex(detail.activeTabId)
                      }
                    />
                  </>
                )}
              </ExpandableSection>
            )
          }
        >
          {content?.length === 0 ? (
            <Box>
              <Spinner />
            </Box>
          ) : null}
          {props.message.content.length > 0 ? (
            <div className={styles.btn_chabot_message_copy}>
              <Popover
                size="medium"
                position="top"
                triggerType="custom"
                dismissButton={false}
                content={
                  <StatusIndicator type="success">
                    Copied to clipboard
                  </StatusIndicator>
                }
              >
                <Button
                  variant="inline-icon"
                  iconName="copy"
                  onClick={() => {
                    navigator.clipboard.writeText(props.message.content);
                  }}
                />
              </Popover>
            </div>
          ) : null}
          <ReactMarkdown
            children={content}
            remarkPlugins={[remarkGfm]}
            components={{
              pre(props) {
                const { children, ...rest } = props;
                return (
                  <pre {...rest} className={styles.codeMarkdown}>
                    {children}
                  </pre>
                );
              },
              table(props) {
                const { children, ...rest } = props;
                return (
                  <table {...rest} className={styles.markdownTable}>
                    {children}
                  </table>
                );
              },
              th(props) {
                const { children, ...rest } = props;
                return (
                  <th {...rest} className={styles.markdownTableCell}>
                    {children}
                  </th>
                );
              },
              td(props) {
                const { children, ...rest } = props;
                return (
                  <td {...rest} className={styles.markdownTableCell}>
                    {children}
                  </td>
                );
              },
            }}
          />
          <div className={styles.thumbsContainer}>
            {(selectedIcon === 1 || selectedIcon === null) && (
              <Button
                variant="icon"
                iconName={selectedIcon === 1 ? "thumbs-up-filled" : "thumbs-up"}
                onClick={() => {
                  // console.log("pressed thumbs up!")
                  props.onThumbsUp();
                  setSelectedIcon(1);
                }}
              />
            )}
            {(selectedIcon === 0 || selectedIcon === null) && (
              <Button
                iconName={
                  selectedIcon === 0 ? "thumbs-down-filled" : "thumbs-down"
                }
                variant="icon"
                onClick={() => {
                  props.onThumbsDown();
                  setSelectedIcon(0);
                }}
              />
            )}
          </div>
        </Container>
      )}
      {loading && (
        <Box float="left">
          <Spinner />
        </Box>
      )}
      {files && !loading && (
        <>
          {files.map((file, idx) => (
            <a
              key={idx}
              href={file.url as string}
              target="_blank"
              rel="noreferrer"
              style={{ marginLeft: "5px", marginRight: "5px" }}
            >
              <img
                src={file.url as string}
                className={styles.img_chabot_message}
              />
            </a>
          ))}
        </>
      )}
      {props.message?.type === ChatBotMessageType.Human && (
        <TextContent>
          <strong>{props.message.content}</strong>
        
        </TextContent>
      )}
    </div>
  );
}
