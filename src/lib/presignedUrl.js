import api from "@/api/client";

/**
 * Fetch a presigned download URL for a MinIO object.
 *
 * @param {string} objectName  – the file_object_name stored on the record
 * @returns {Promise<string>}  – the temporary presigned URL
 */
export async function fetchPresignedUrl(objectName) {
  const { data } = await api.get("/files/presigned", {
    params: { object: objectName },
  });
  return data.url;
}

/**
 * Open a MinIO file in a new tab using a presigned URL.
 * Falls back to the raw URL if no objectName is available.
 *
 * @param {string|null} objectName  – preferred: the stored MinIO object key
 * @param {string|null} fallbackUrl – fallback: the stored file_url (may fail if bucket is private)
 */
export async function openFile(objectName, fallbackUrl) {
  try {
    if (objectName) {
      const url = await fetchPresignedUrl(objectName);
      window.open(url, "_blank", "noopener,noreferrer");
    } else if (fallbackUrl) {
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    }
  } catch (err) {
    console.error("[openFile] Failed to get presigned URL:", err);
    // Graceful fallback
    if (fallbackUrl) window.open(fallbackUrl, "_blank", "noopener,noreferrer");
  }
}
