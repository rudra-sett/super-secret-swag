import {
  Box,
  SpaceBetween,
  Table,
  Pagination,
  Button,
  TableProps,
  Header,
  CollectionPreferences,
  Modal,
} from "@cloudscape-design/components";
import React from 'react'
import { useCallback, useContext, useEffect, useState } from "react";
import RouterButton from "../../components/wrappers/router-button";
import { RagDocumentType } from "../../common/types";
import { TableEmptyState } from "../../components/table-empty-state";
import { AppContext } from "../../common/app-context";
// import { ApiClient } from "../../common/api-client/old-api-client";
import { getColumnDefinition } from "./columns";
import { Utils } from "../../common/utils";
import { useCollection } from "@cloudscape-design/collection-hooks";
// import { DocumentsResult } from "../../../API";

export interface DocumentsTabProps {
  // workspaceId?: string;
  documentType: RagDocumentType;
}

export default function DocumentsTab(props: DocumentsTabProps) {
  const appContext = useContext(AppContext);  
  const [loading, setLoading] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pages, setPages] = useState<any[]>([]);

  const { items, collectionProps, paginationProps } = useCollection(pages, {
    filtering: {
      empty: (
        <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
          <SpaceBetween size="m">
            <b>No sessions</b>
          </SpaceBetween>
        </Box>
      ),
    },
    // pagination: { pageSize: preferences.pageSize },
    // sorting: {
    //   defaultState: {
    //     sortingColumn: {
    //       sortingField: "startTime",
    //     },
    //     isDescending: true,
    //   },
    // },
    selection: {},
  });

  /*const getDocuments = useCallback(
    async (params: { lastDocumentId?: string; pageIndex?: number }) => {
      // if (!appContext) return;
      // if (!props.workspaceId) return;

      setLoading(true);

      const apiClient = new ApiClient(appContext);
      try {
        const result = await apiClient.documents.getDocuments(
          // props.workspaceId,
          props.documentType,
          params?.lastDocumentId
        );

        setPages((current) => {
          const foundIndex = current.findIndex(
            (c) =>
              c!.lastDocumentId === result.data!.listDocuments.lastDocumentId
          );

          if (foundIndex !== -1) {
            current[foundIndex] = result.data?.listDocuments;
            return [...current];
          } else if (typeof params.pageIndex !== "undefined") {
            current[params.pageIndex - 1] = result.data?.listDocuments;
            return [...current];
          } else if (result.data?.listDocuments.items.length === 0) {
            return current;
          } else {
            return [...current, result.data?.listDocuments];
          }
        });
      } catch (error) {
        console.error(Utils.getErrorMessage(error));
      }

      setLoading(false);
    },
    [appContext, props.documentType]
  );*/

  const getDocuments = useCallback(
    async (params: { continuationToken?: string; pageIndex?: number }) => {
      setLoading(true);

      try {
        const response = await fetch('https://slyk7uahobntca2ysqvhgumsi40zmwsn.lambda-url.us-east-1.on.aws/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // s3Bucket: props.s3Bucket,
            // s3Prefix: props.s3Prefix,
            continuationToken: params?.continuationToken,
            pageIndex: params?.pageIndex,
          }),
        });

        const result = await response.json();
      setPages((current) => {
        if (typeof params.pageIndex !== "undefined") {
          current[params.pageIndex - 1] = result;
          return [...current];
        } else {
          return [...current, result];
        }
      });      
    } catch (error) {
      console.error(Utils.getErrorMessage(error));
    }

      console.log(pages);
      setLoading(false);      
    },
    [appContext, props.documentType]
  );


  useEffect(() => {
    getDocuments({});
  }, [getDocuments]);

  const onNextPageClick = async () => {
    const continuationToken = pages[currentPageIndex - 1]?.NextContinuationToken;

    if (continuationToken) {
      if (pages.length <= currentPageIndex) {
        await getDocuments({ continuationToken });
      }
      setCurrentPageIndex((current) => Math.min(pages.length + 1, current + 1));
    }
  };


  const onPreviousPageClick = async () => {
    setCurrentPageIndex((current) =>
      Math.max(1, Math.min(pages.length - 1, current - 1))
    );
  };

  const refreshPage = async () => {
    // console.log(pages[Math.min(pages.length - 1, currentPageIndex - 1)]?.Contents!)
    if (currentPageIndex <= 1) {
      await getDocuments({ pageIndex: currentPageIndex });
    } else {
      const continuationToken = pages[currentPageIndex - 2]?.NextContinuationToken!;
      await getDocuments({ continuationToken });
    }
  };

  // const typeStr = ragDocumentTypeToString(props.documentType);
  // const typeAddStr = ragDocumentTypeToAddString(props.documentType);
  // const typeTitleStr = ragDocumentTypeToTitleString(props.documentType);

  const columnDefinitions = getColumnDefinition(props.documentType);

  return (
    <Table
      {...collectionProps}
      loading={loading}
      loadingText={`Loading files`}
      columnDefinitions={columnDefinitions}
      selectionType="multi"
      items={pages[Math.min(pages.length - 1, currentPageIndex - 1)]?.Contents!}
      trackBy="Key"
      header={
        <Header
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button iconName="refresh" onClick={refreshPage} />
              <RouterButton
                // href={`/rag/workspaces/add-data?workspaceId=${props.workspaceId}&tab=${props.documentType}`}
                href={`/admin/add-data`}
              >
                {'Add Files'}
              </RouterButton>
            </SpaceBetween>
          }
          description="Please expect a delay for your changes to be reflected. Press the refresh button to see the latest changes."
        >
          {"Files"}
        </Header>
      }
      empty={
        <TableEmptyState
          resourceName={"File"}
          // createHref={`/rag/workspaces/add-data?workspaceId=${props.workspaceId}&tab=${props.documentType}`}
          createHref={`/admin/add-data`}
          createText={"Add Files"}
        />
      }
      pagination={
        pages.length === 0 ? null : (
          <Pagination
            openEnd={true}
            pagesCount={pages.length}
            currentPageIndex={currentPageIndex}
            onNextPageClick={onNextPageClick}
            onPreviousPageClick={onPreviousPageClick}
          />
        )
      }
    />
  );
}
/*
function ragDocumentTypeToString(type: RagDocumentType) {
  switch (type) {
    case "file":
      return "File";
    case "text":
      return "Text";
    case "qna":
      return "Q&A";
    case "website":
      return "Website";
    case "rssfeed":
      return "RSS Feed";
    case "rsspost":
      return "RSS Post";
  }
}

function ragDocumentTypeToTitleString(type: RagDocumentType) {
  switch (type) {
    case "file":
      return "Files";
    case "text":
      return "Texts";
    case "qna":
      return "Q&As";
    case "website":
      return "Websites";
    case "rssfeed":
      return "RSS Feeds";
    case "rsspost":
      return "RSS Posts";
  }
}

function ragDocumentTypeToAddString(type: RagDocumentType) {
  switch (type) {
    case "file":
      return "Upload files";
    case "text":
      return "Add texts";
    case "qna":
      return "Add Q&A";
    case "website":
      return "Crawl website";
    case "rssfeed":
      return "Subcribe to RSS Feed";
    case "rsspost":
      return "Add RSS Post";
  }
}*/
