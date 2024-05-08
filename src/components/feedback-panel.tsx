import { useRef, useState } from 'react';
import { useEffect } from 'react';
import { Container, ContentLayout, Header, Link, SplitPanel, } from '@cloudscape-design/components';
import { Auth } from 'aws-amplify';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "../styles/chat.module.scss";

export interface FeedbackPanelProps {  
}

export default function EmailPanel(props: FeedbackPanelProps) {

  const [generatedEmail, setGeneratedEmail] = useState<string>('');
  const firstRender = useRef(true);

  useEffect(() => {
    const loadFeedback = async () => {
    }
  }, [])
  return (
    <div>
        <SplitPanel header="Generated Email">
          <Header></Header>
        </SplitPanel>
      </div>
  );
}