import { apiClient } from "@/lib/api/client"

export interface UploadResult {
  publicUrl: string
  key: string
}

/**
 * Upload a file to S3 via presigned URL.
 * For project tasks: { projectId, taskId } => projects/{projectId}/tasks/{taskId}/{file}
 * For board tasks: { boardId, taskId } => boards/{boardId}/tasks/{taskId}/{file}
 */
export async function uploadFileToS3(
  file: File,
  options: { projectId?: string; boardId?: string; taskId?: string }
): Promise<UploadResult> {
  const { projectId, boardId, taskId } = options
  const res = await apiClient.post("/api/upload/presigned", {
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    ...(projectId && { projectId, subFolder: taskId ? `tasks/${taskId}` : undefined }),
    ...(boardId && taskId && { boardId, subFolder: `tasks/${taskId}` })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err).error || "Could not get upload URL")
  }
  const { uploadUrl, publicUrl, key } = await res.json()
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" }
  })
  if (!putRes.ok) {
    throw new Error(`Upload failed (${putRes.status})`)
  }
  return { publicUrl, key }
}
