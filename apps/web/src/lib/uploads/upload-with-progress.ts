/**
 * PUT a Blob to a presigned URL with progress reporting.
 *
 * The `fetch` API doesn't expose upload progress in any browser (it's a
 * spec gap with no fix landing anytime soon), so we drop to XHR for this
 * one call. Everywhere else we use fetch.
 *
 * The promise resolves on HTTP 2xx, rejects on anything else or on network
 * failure. The body of the response is ignored — S3/MinIO returns no body
 * on a successful PUT, and the ETag in the Location header is only useful
 * for multipart uploads we don't do.
 */
export interface UploadOptions {
  url: string
  blob: Blob
  contentType: string
  /** Called repeatedly with progress (0..1). */
  onProgress?: (fraction: number) => void
  /** Aborts the upload if signalled — for cancel buttons / unmount cleanup. */
  signal?: AbortSignal
}

export function uploadWithProgress(opts: UploadOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open('PUT', opts.url)
    xhr.setRequestHeader('Content-Type', opts.contentType)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && opts.onProgress) {
        opts.onProgress(e.loaded / e.total)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        opts.onProgress?.(1)
        resolve()
      } else {
        reject(new Error(`Upload failed: HTTP ${xhr.status} ${xhr.statusText}`))
      }
    })

    xhr.addEventListener('error', () => {
      // No useful detail from XHR for network errors. The browser may have
      // logged the underlying issue (CORS, DNS, etc) to the dev console.
      reject(new Error('Upload failed: network error. Check your connection and try again.'))
    })

    xhr.addEventListener('abort', () => {
      reject(new DOMException('Upload aborted', 'AbortError'))
    })

    if (opts.signal) {
      if (opts.signal.aborted) {
        xhr.abort()
        return
      }
      opts.signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }

    xhr.send(opts.blob)
  })
}
