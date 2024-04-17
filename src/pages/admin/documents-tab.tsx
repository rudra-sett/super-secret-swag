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
  Spinner,
} from "@cloudscape-design/components";
import React from 'react'
import { useCallback, useContext, useEffect, useState } from "react";
import RouterButton from "../../components/wrappers/router-button";
import { RagDocumentType } from "../../common/types";
import { TableEmptyState } from "../../components/table-empty-state";
import { ApiClient } from "../../common/api-client/api-client";
import { AppContext } from "../../common/app-context";
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
  const apiClient = new ApiClient(appContext);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pages, setPages] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [showModalDelete, setShowModalDelete] = useState(false);

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
    pagination: { pageSize: 5 },
    sorting: {
      defaultState: {
        sortingColumn: {
          sortingField: "Key",
        },
        isDescending: true,
      },
    },
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
        const result = await apiClient.knowledgeManagement.getDocuments(params?.continuationToken, params?.pageIndex)

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


  const columnDefinitions = getColumnDefinition(props.documentType);

  const deleteSelectedFiles = async () => {
    if (!appContext) return;

    setLoading(true);
    setShowModalDelete(false);
    const apiClient = new ApiClient(appContext);
    await Promise.all(
      selectedItems.map((s) => apiClient.knowledgeManagement.deleteFile(s.Key!))
    );
    await getDocuments({ pageIndex: currentPageIndex });
    setSelectedItems([])
    setLoading(false);
  };

  useEffect(() => {
    if (!appContext) return;
    const apiClient = new ApiClient(appContext);

    const getStatus = async () => {
      try {
        const result = await apiClient.knowledgeManagement.kendraIsSyncing();
        setSyncing(result == "STILL SYNCING");
      } catch (error) {
        console.error(error);
      }
    };

    const interval = setInterval(getStatus, 5000);
    getStatus();

    return () => clearInterval(interval);
  });

  // const getStatus = async () => {
  //   const result = await apiClient.knowledgeManagement.kendraIsSyncing();
  //   console.log(result);    
  //   if (result == "DONE SYNCING") {
  //     setSyncing(false); 
  //   }
  //   return result;
  // }

  const syncKendra = async () => {
    if (syncing) return;
    try {
      await apiClient.knowledgeManagement.syncKendra();
      setSyncing(true);
    } catch (error) {
      console.log(error);
      setSyncing(false)
    }
  }

  return (
    <><Modal
      onDismiss={() => setShowModalDelete(false)}
      visible={showModalDelete}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            {" "}
            <Button variant="link" onClick={() => setShowModalDelete(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={deleteSelectedFiles}>
              Ok
            </Button>
          </SpaceBetween>{" "}
        </Box>
      }
      header={"Delete session" + (selectedItems.length > 1 ? "s" : "")}
    >
      Do you want to delete{" "}
      {selectedItems.length == 1
        ? `file ${selectedItems[0].Key!}?`
        : `${selectedItems.length} files?`}
    </Modal>
      <Table
        {...collectionProps}
        loading={loading}
        loadingText={`Loading files`}
        columnDefinitions={columnDefinitions}
        selectionType="multi"
        onSelectionChange={({ detail }) => {
          console.log(detail);
          setSelectedItems(detail.selectedItems);
        }}
        selectedItems={selectedItems}
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
                <Button
                  variant="primary"
                  disabled={selectedItems.length == 0}
                  onClick={() => {
                    if (selectedItems.length > 0) setShowModalDelete(true);
                  }}
                  data-testid="submit">
                  Delete
                </Button>
                <Button
                  variant="primary"
                  disabled={syncing}
                  onClick={() => {
                    syncKendra();
                  }}
                // data-testid="submit"
                >
                  {syncing ? (
                    <>
                      Syncing data...&nbsp;&nbsp;
                      <Spinner />
                    </>
                  ) : (
                    "Sync data now"
                  )}
                </Button>
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
    </>
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
