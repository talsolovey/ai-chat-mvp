import fetchJson from "../../lib/fetchJson";
import type { KnowledgeDocument } from "./types";

export function getDocuments(): Promise<KnowledgeDocument[]> {
  return fetchJson<KnowledgeDocument[]>("/api/knowledge/documents", {
    method: "GET",
  });
}

export function uploadDocument(file: File): Promise<KnowledgeDocument> {
  const uploadFormData = new FormData();
  uploadFormData.append("file", file);
  return fetchJson<KnowledgeDocument>("/api/knowledge/documents", {
    method: "POST",
    body: uploadFormData,
  });
}

export function deleteDocument(documentId: string): Promise<void> {
  return fetchJson<void>(
    `/api/knowledge/documents/${encodeURIComponent(documentId)}`,
    { method: "DELETE" },
  );
}
