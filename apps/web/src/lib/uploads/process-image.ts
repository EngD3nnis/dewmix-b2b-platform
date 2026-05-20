/**
 * Client-side image processing for the admin product uploader.
 *
 * Three jobs, all done in the browser before the file ever leaves the device:
 *
 *   1. Resize. Phone cameras shoot ~12MP these days (~5MB JPEG). On the 3G
 *      networks the owner will be using on a construction site, a 5MB upload
 *      is unusable. We resize to a max 1920px edge, re-encode JPEG at q=0.85,
 *      which drops the typical photo to ~200-400KB.
 *   2. Dimension capture. The schema has width/height columns that next/image
 *      wants for layout-shift-free rendering. Reading these here saves a
 *      server-side decode.
 *   3. Blur LQIP. A 16x16 base64 thumbnail becomes the `placeholder="blur"`
 *      data URI on <Image>. Free perceived perf on the customer-facing pages.
 *
 * All exceptions are caught and surfaced as rejections — the caller is
 * responsible for showing them. We do not silently fall back to the original
 * file, because uploading a 5MB phone photo on 3G "works" but takes 90s and
 * the owner will quit. Better to fail fast and tell them what went wrong.
 */

import { MAX_UPLOAD_BYTES, type AllowedImageMime } from '@dewmix/types'

export interface ProcessedImage {
  blob: Blob
  contentType: AllowedImageMime
  width: number
  height: number
  blurDataUrl: string
  /** Same extension the server will use — for the display filename. */
  ext: 'jpg' | 'png' | 'webp'
}

const MAX_EDGE = 1920
const JPEG_QUALITY = 0.85
const BLUR_SIZE = 16

/**
 * Load a File into an HTMLImageElement via object URL. Object URL is revoked
 * on both load and error so we don't leak memory on long admin sessions.
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Could not decode image. Try a different file format (JPEG, PNG, or WebP).`))
    }
    img.src = objectUrl
  })
}

function drawToCanvas(img: HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Browser canvas is unavailable in this context.')
  // White fill prevents transparent PNGs from rendering with a black background
  // when we re-encode to JPEG. For non-JPEG outputs the fill is harmless.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: AllowedImageMime, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image. Try a different file.'))),
      mime,
      quality,
    )
  })
}

/**
 * Resize, recompress, and extract metadata from an image File.
 *
 * Resize policy:
 *   - If both dimensions are at or below MAX_EDGE, keep the original size.
 *   - Otherwise scale proportionally so the longest edge is exactly MAX_EDGE.
 *
 * Encoding policy:
 *   - PNG with no alpha → JPEG (significantly smaller)
 *   - PNG with alpha → PNG (preserve transparency)
 *   - WebP → WebP
 *   - JPEG → JPEG
 * We don't try to detect alpha; we assume the input was uploaded as PNG for a
 * reason and keep it PNG. JPEGs go through the JPEG path.
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  // Hard reject ridiculous file sizes before doing any decode work.
  // The MAX_UPLOAD_BYTES check is also enforced post-resize below.
  if (file.size > MAX_UPLOAD_BYTES * 4) {
    throw new Error(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please use an image under ${(MAX_UPLOAD_BYTES * 4) / 1024 / 1024}MB.`,
    )
  }

  const type = file.type
  if (!type.startsWith('image/')) {
    throw new Error(`Not an image file (${type || 'unknown type'}).`)
  }

  // Pick the output MIME based on input. HEIC/HEIF won't decode in canvas at
  // all so they fail at loadImageFromFile with a helpful message.
  let outMime: AllowedImageMime
  if (type === 'image/png') outMime = 'image/png'
  else if (type === 'image/webp') outMime = 'image/webp'
  else outMime = 'image/jpeg' // JPEG and "I don't know what this is" → JPEG

  const img = await loadImageFromFile(file)
  const srcW = img.naturalWidth
  const srcH = img.naturalHeight
  if (srcW === 0 || srcH === 0) {
    throw new Error('Image has zero dimensions. The file may be corrupt.')
  }

  // Compute target dimensions
  const longest = Math.max(srcW, srcH)
  const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1
  const dstW = Math.round(srcW * scale)
  const dstH = Math.round(srcH * scale)

  const canvas = drawToCanvas(img, dstW, dstH)
  const quality = outMime === 'image/jpeg' ? JPEG_QUALITY : undefined
  const blob = await canvasToBlob(canvas, outMime, quality)

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Processed image is still too large (${(blob.size / 1024 / 1024).toFixed(1)}MB after resize). Try a smaller source image.`,
    )
  }

  // Blur LQIP — 16x16 JPEG, base64 inline. Tiny and good enough for the
  // shimmer-while-loading effect in next/image.
  const blurCanvas = drawToCanvas(img, BLUR_SIZE, BLUR_SIZE)
  const blurDataUrl = blurCanvas.toDataURL('image/jpeg', 0.5)

  const ext = outMime === 'image/png' ? 'png' : outMime === 'image/webp' ? 'webp' : 'jpg'
  return { blob, contentType: outMime, width: dstW, height: dstH, blurDataUrl, ext }
}
