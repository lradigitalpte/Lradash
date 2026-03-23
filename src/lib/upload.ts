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
  const safeTaskId = taskId?.toString?.() ?? taskId

  // When uploading "personal" task attachments (no projectId/boardId), we still
  // want a deterministic folder to keep objects organized.
  const presignPayload: Record<string, unknown> = {
    fileName: file.name,
    fileType: file.type || "application/octet-stream"
  }

  if (projectId) {
    presignPayload.projectId = projectId
    if (safeTaskId) {
      presignPayload.subFolder = `tasks/${safeTaskId}`
    }
  } else if (boardId && safeTaskId) {
    presignPayload.boardId = boardId
    presignPayload.subFolder = `tasks/${safeTaskId}`
  } else if (safeTaskId) {
    presignPayload.folder = "uploads"
    presignPayload.subFolder = `tasks/${safeTaskId}`
  }

  const res = await apiClient.post("/api/upload/presigned", presignPayload)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Could not get upload URL")
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
