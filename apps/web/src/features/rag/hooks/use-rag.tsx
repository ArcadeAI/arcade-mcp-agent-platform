import { useState, Dispatch, SetStateAction, useCallback } from "react";
import { Document } from "@langchain/core/documents";
import { Collection, CollectionCreate } from "@/types/collection";

export const DEFAULT_COLLECTION_NAME = "default_collection";

export function getDefaultCollection(collections: Collection[]): Collection {
  return (
    collections.find((c) => c.name === DEFAULT_COLLECTION_NAME) ??
    collections[0]
  );
}

export function getCollectionName(collection: Collection | undefined): string {
  if (!collection) return "";
  return collection.name === DEFAULT_COLLECTION_NAME
    ? "Default Collection"
    : collection.name;
}

interface UseRagReturn {
  initialSearchExecuted: boolean;
  setInitialSearchExecuted: Dispatch<SetStateAction<boolean>>;
  initialFetch: () => Promise<void>;
  collections: Collection[];
  setCollections: Dispatch<SetStateAction<Collection[]>>;
  collectionsLoading: boolean;
  fetchCollections: (accessToken?: string) => Promise<Collection[]>;
  createCollection: (
    collectionToCreate: CollectionCreate,
    accessToken?: string,
  ) => Promise<Collection | undefined>;
  updateCollection: (
    collectionId: string,
    updatedCollection: Partial<Collection>,
  ) => Promise<Collection | undefined>;
  deleteCollection: (collectionId: string) => Promise<string | undefined>;
  selectedCollection: Collection | undefined;
  setSelectedCollection: Dispatch<SetStateAction<Collection | undefined>>;
  documents: Document[];
  setDocuments: Dispatch<SetStateAction<Document[]>>;
  documentsLoading: boolean;
  getDocumentsByCollectionId: (
    collectionId: string,
    accessToken?: string,
  ) => Promise<Document[]>;
  listDocuments: (
    collectionId: string,
    accessToken?: string,
  ) => Promise<Document[]>;
  deleteDocument: (id: string) => Promise<void>;
  handleFileUpload: (
    files: FileList | null,
    collectionId: string,
  ) => Promise<void>;
  handleTextUpload: (textInput: string, collectionId: string) => Promise<void>;
}

/**
 * Temporary stub for RAG functionality during auth migration.
 * All RAG operations are disabled until auth is re-implemented in Phase 2.
 */
export function useRag(): UseRagReturn {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<
    Collection | undefined
  >(undefined);
  const [initialSearchExecuted, setInitialSearchExecuted] = useState(false);

  const initialFetch = useCallback(async () => {
    console.warn("RAG functionality temporarily disabled during auth migration");
  }, []);

  const listDocuments = useCallback(async () => {
    return [];
  }, []);

  const getDocumentsByCollectionId = useCallback(async () => {
    return [];
  }, []);

  const deleteDocument = useCallback(async () => {}, []);

  const handleFileUpload = useCallback(async () => {}, []);

  const handleTextUpload = useCallback(async () => {}, []);

  const fetchCollections = useCallback(async () => {
    return [];
  }, []);

  const createCollection = useCallback(async () => {
    return undefined;
  }, []);

  const updateCollection = useCallback(async () => {
    return undefined;
  }, []);

  const deleteCollection = useCallback(async () => {
    return undefined;
  }, []);

  return {
    initialSearchExecuted,
    setInitialSearchExecuted,
    initialFetch,
    collections,
    setCollections,
    collectionsLoading,
    fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    selectedCollection,
    setSelectedCollection,
    documents,
    setDocuments,
    documentsLoading,
    getDocumentsByCollectionId,
    listDocuments,
    deleteDocument,
    handleFileUpload,
    handleTextUpload,
  };
}
