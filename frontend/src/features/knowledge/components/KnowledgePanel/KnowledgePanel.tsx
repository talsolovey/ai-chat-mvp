import { useEffect, useRef, useState, type ReactElement } from "react";
import { knowledge as knowledgeApi } from "../../../../lib/apiClient";
import type { KnowledgeDocument } from "../../types";
import styles from "./KnowledgePanel.module.css";

export default function KnowledgePanel(): ReactElement {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    knowledgeApi
      .getDocuments()
      .then((loadedDocuments) => {
        if (!cancelled) {
          setDocuments(loadedDocuments);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : String(error),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return (): void => {
      cancelled = true;
    };
  }, []);

  async function handleUpload(): Promise<void> {
    const selectedFile = fileInputRef.current?.files?.[0];
    if (!selectedFile || isUploading) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    try {
      const ingestedDocument = await knowledgeApi.uploadDocument(selectedFile);
      setDocuments((currentDocuments) => {
        const alreadyListed = currentDocuments.some(
          (document) => document.id === ingestedDocument.id,
        );
        return alreadyListed
          ? currentDocuments
          : [ingestedDocument, ...currentDocuments];
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(documentId: string): Promise<void> {
    if (deletingDocumentId) {
      return;
    }
    setDeletingDocumentId(documentId);
    setErrorMessage(null);
    try {
      await knowledgeApi.deleteDocument(documentId);
      setDocuments((currentDocuments) =>
        currentDocuments.filter((document) => document.id !== documentId),
      );
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setDeletingDocumentId(null);
    }
  }

  return (
    <section className={styles.root} aria-label="Knowledge base">
      <h3 className={styles.heading}>Knowledge base</h3>
      <p className={styles.hint}>
        Upload .txt or .md files for tutor conversations.
      </p>

      <form
        className={styles.uploadForm}
        onSubmit={(event): void => {
          event.preventDefault();
          void handleUpload();
        }}
      >
        <input
          ref={fileInputRef}
          className={styles.fileInput}
          type="file"
          accept=".txt,.md"
          aria-label="Document to upload"
          disabled={isUploading}
        />
        <button
          type="submit"
          className={styles.uploadButton}
          disabled={isUploading}
        >
          {isUploading ? "Uploading…" : "Upload"}
        </button>
      </form>

      {errorMessage && (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      )}

      {isLoading && <p className={styles.state}>Loading documents…</p>}

      {!isLoading && documents.length === 0 && !errorMessage && (
        <p className={styles.state}>No documents yet.</p>
      )}

      {documents.length > 0 && (
        <ul className={styles.documentList}>
          {documents.map((document) => (
            <li key={document.id} className={styles.documentItem}>
              <span className={styles.documentName} title={document.name}>
                {document.name}
              </span>
              <span className={styles.documentMeta}>
                {document.chunkCount} chunks
              </span>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={(): void => {
                  void handleDelete(document.id);
                }}
                disabled={deletingDocumentId !== null}
                aria-label={`Delete ${document.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
