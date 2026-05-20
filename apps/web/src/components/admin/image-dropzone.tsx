'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { GripVertical, Loader2, Package, Trash2, UploadCloud, X } from 'lucide-react'
import { adminApi } from '@/lib/api/admin'
import { processImage } from '@/lib/uploads/process-image'
import { uploadWithProgress } from '@/lib/uploads/upload-with-progress'
import type { AllowedImageMime } from '@dewmix/types'

export interface UploadedImage {
  id: string
  url: string
  alt: string | null
  width?: number | null
  height?: number | null
}

interface Props {
  /** Product UUID — required because uploads are namespaced under products/{id}/ */
  productId: string
  /** Already-uploaded images. Reorder + remove mutate this list via callbacks. */
  images: UploadedImage[]
  /** Called with the new full list after any add / remove / reorder. */
  onChange: (next: UploadedImage[]) => void
  /** Used as the default `alt` text for uploaded images. */
  productName?: string
  disabled?: boolean
}

interface PendingUpload {
  /** Local id, not the eventual server id. */
  localId: string
  file: File
  /** 0..1 for the resize step (instantaneous in practice) + the network PUT. */
  progress: number
  status: 'processing' | 'uploading' | 'registering' | 'error'
  error?: string
}

/**
 * Drag-and-drop, multi-file image uploader for the admin product editor.
 *
 * Flow per file:
 *   1. processImage()   — resize to <=1920px, recompress, extract dims + blur
 *   2. presign()        — get an S3/MinIO URL scoped to this product
 *   3. uploadWithProgress() — PUT with progress events
 *   4. addImage()       — register the URL + dims + blur in the DB
 *
 * Multiple files upload in parallel (limited by browser concurrency); progress
 * is shown per-file. A failed file shows its error inline and can be retried
 * by removing it and dropping again.
 */
export function ImageDropzone({ productId, images, onChange, productName, disabled }: Props) {
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropzoneRef = useRef<HTMLDivElement>(null)

  // For drag-to-reorder of already-uploaded images.
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)

  const upload = useCallback(
    async (files: File[]) => {
      if (!productId) return

      const newPending: PendingUpload[] = files.map((f) => ({
        localId: crypto.randomUUID(),
        file: f,
        progress: 0,
        status: 'processing',
      }))
      setPending((p) => [...p, ...newPending])

      // Fire all uploads in parallel. We collect successes and append them
      // to the images list in one onChange call at the end so a slow stragger
      // doesn't trigger a re-render storm.
      const results = await Promise.allSettled(
        newPending.map(async (entry) => {
          const updateEntry = (patch: Partial<PendingUpload>) =>
            setPending((p) => p.map((e) => (e.localId === entry.localId ? { ...e, ...patch } : e)))

          try {
            updateEntry({ status: 'processing', progress: 0 })
            const processed = await processImage(entry.file)

            updateEntry({ status: 'uploading', progress: 0 })
            const presigned = await adminApi.uploads.presign(
              `${entry.file.name.replace(/\.[^.]+$/, '')}.${processed.ext}`,
              processed.contentType as AllowedImageMime,
              productId,
            )
            await uploadWithProgress({
              url: presigned.url,
              blob: processed.blob,
              contentType: processed.contentType,
              onProgress: (frac) => updateEntry({ progress: frac }),
            })

            updateEntry({ status: 'registering', progress: 1 })
            const created = await adminApi.products.addImage(productId, {
              url: presigned.publicUrl,
              alt: productName,
              width: processed.width,
              height: processed.height,
              blurDataUrl: processed.blurDataUrl,
            })

            return created
          } catch (err) {
            updateEntry({
              status: 'error',
              error: (err as Error).message || 'Upload failed',
            })
            throw err
          }
        }),
      )

      // Append successful uploads
      const created = results
        .filter((r): r is PromiseFulfilledResult<UploadedImage> => r.status === 'fulfilled')
        .map((r) => r.value)
      if (created.length > 0) onChange([...images, ...created])

      // Clear the successful entries from the pending list. Errored entries
      // stay so the user can read the error and decide what to do.
      const successLocalIds = new Set(
        newPending
          .filter((_, i) => results[i]?.status === 'fulfilled')
          .map((e) => e.localId),
      )
      setPending((p) => p.filter((e) => !successLocalIds.has(e.localId)))
    },
    [productId, productName, images, onChange],
  )

  // ── File input handler (click to select) ────────────────────────────────────
  const onFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return
    upload(Array.from(list))
    // Reset so selecting the same file again still fires `change`
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Drag-and-drop on the dropzone ───────────────────────────────────────────
  // We use the document-level dragenter/dragleave counter trick because
  // child elements fire spurious dragleave events when the cursor crosses them.
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      dragCounter.current++
      setIsDragging(true)
    }
    const onDragLeave = () => {
      dragCounter.current--
      if (dragCounter.current <= 0) {
        dragCounter.current = 0
        setIsDragging(false)
      }
    }
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault()
    }
    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      // Only handle drops over our dropzone — drops elsewhere should not steal
      // files (e.g. dragging a photo to attach it to a different field).
      if (!(e.target instanceof Node) || !dropzoneRef.current?.contains(e.target)) {
        dragCounter.current = 0
        setIsDragging(false)
        return
      }
      e.preventDefault()
      dragCounter.current = 0
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
      if (files.length > 0) upload(files)
    }

    document.addEventListener('dragenter', onDragEnter)
    document.addEventListener('dragleave', onDragLeave)
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('dragenter', onDragEnter)
      document.removeEventListener('dragleave', onDragLeave)
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('drop', onDrop)
    }
  }, [upload])

  // ── Image actions ───────────────────────────────────────────────────────────
  const onRemove = async (imageId: string) => {
    // Optimistic — server delete is fast and a failure is rare; if it happens
    // we'll surface the error and refresh.
    const prev = images
    onChange(images.filter((i) => i.id !== imageId))
    try {
      await adminApi.products.removeImage(imageId)
    } catch (e) {
      onChange(prev)
      alert(`Failed to remove image: ${(e as Error).message}`)
    }
  }

  const onDismissError = (localId: string) =>
    setPending((p) => p.filter((e) => e.localId !== localId))

  // ── Reorder existing uploaded images via HTML5 drag-and-drop ────────────────
  // Native API avoids pulling in dnd-kit for one feature. The visual cue is a
  // 2px line on the drop target, set by `dropTargetIndex`.
  const onReorderStart = (index: number) => () => setDraggingIndex(index)
  const onReorderOver = (index: number) => (e: React.DragEvent) => {
    if (draggingIndex === null) return
    e.preventDefault()
    setDropTargetIndex(index)
  }
  const onReorderDrop = (index: number) => async (e: React.DragEvent) => {
    e.preventDefault()
    if (draggingIndex === null || draggingIndex === index) {
      setDraggingIndex(null)
      setDropTargetIndex(null)
      return
    }
    const next = [...images]
    const [moved] = next.splice(draggingIndex, 1)
    if (moved) next.splice(index, 0, moved)
    setDraggingIndex(null)
    setDropTargetIndex(null)
    // Optimistic local update; persist server-side.
    onChange(next)
    try {
      await adminApi.products.reorderImages(
        productId,
        next.map((i) => i.id),
      )
    } catch (err) {
      alert(`Reorder failed: ${(err as Error).message}. Refresh to see the server's order.`)
    }
  }

  const hasItems = images.length > 0 || pending.length > 0

  return (
    <div
      ref={dropzoneRef}
      className={`relative rounded-lg border-2 border-dashed transition-colors ${
        isDragging
          ? 'border-primary bg-primary/5'
          : hasItems
            ? 'border-border bg-card'
            : 'border-border bg-secondary/20'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Drop-over overlay */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-primary/10 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-primary">
            <UploadCloud className="h-8 w-8" />
            <p className="font-medium">Drop to upload</p>
          </div>
        </div>
      )}

      <div className="p-4">
        {!hasItems ? (
          // Empty state — large, inviting click target
          <label className="flex cursor-pointer flex-col items-center gap-2 py-10 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => onFiles(e.target.files)}
            />
            <UploadCloud className="h-9 w-9 text-muted-foreground" />
            <p className="text-sm font-medium">Drop images here, or click to select</p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, or WebP — resized to 1920px automatically
            </p>
          </label>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img, i) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={onReorderStart(i)}
                  onDragOver={onReorderOver(i)}
                  onDrop={onReorderDrop(i)}
                  onDragEnd={() => {
                    setDraggingIndex(null)
                    setDropTargetIndex(null)
                  }}
                  className={`group relative aspect-square overflow-hidden rounded-lg border bg-secondary/40 transition-all ${
                    draggingIndex === i ? 'opacity-40' : ''
                  } ${dropTargetIndex === i && draggingIndex !== i ? 'ring-2 ring-primary' : ''}`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? ''}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                  {/* Drag handle — visual cue that the tile is draggable */}
                  <div className="absolute left-1.5 top-1.5 grid h-6 w-6 cursor-move place-items-center rounded-full bg-background/80 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="h-3.5 w-3.5" />
                  </div>
                  {/* Sort order chip */}
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(img.id)}
                    className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Pending uploads tiles */}
              {pending.map((p) => (
                <div
                  key={p.localId}
                  className={`relative aspect-square overflow-hidden rounded-lg border bg-secondary/30 ${
                    p.status === 'error' ? 'border-destructive/40' : ''
                  }`}
                >
                  {p.status === 'error' ? (
                    <>
                      <div className="flex h-full flex-col items-center justify-center gap-1 p-3 text-center">
                        <X className="h-5 w-5 text-destructive" />
                        <p className="line-clamp-3 text-[10px] text-destructive">{p.error}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDismissError(p.localId)}
                        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-destructive text-white"
                        aria-label="Dismiss"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {p.status === 'processing'
                          ? 'Resizing…'
                          : p.status === 'uploading'
                            ? `${Math.round(p.progress * 100)}%`
                            : 'Saving…'}
                      </p>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${
                              p.status === 'processing'
                                ? 10
                                : p.status === 'registering'
                                  ? 100
                                  : Math.max(5, p.progress * 100)
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add-more tile */}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(e) => onFiles(e.target.files)}
                />
                <UploadCloud className="h-6 w-6" />
                <span className="text-xs">Add more</span>
              </label>
            </div>

            {images.length > 1 && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="h-3 w-3" />
                Drag to reorder · the first image is shown on cards
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
