import { z } from 'zod'

// ============ PRIMITIVES ============

/** Kenyan phone — accepts 0712345678, 254712345678, or +254712345678 */
export const PhoneSchema = z
  .string()
  .trim()
  .regex(/^(\+?254|0)[17]\d{8}$/, 'Enter a valid Kenyan phone number')
  .transform((v) => {
    const digits = v.replace(/[^\d]/g, '')
    if (digits.startsWith('254')) return `+${digits}`
    if (digits.startsWith('0')) return `+254${digits.slice(1)}`
    return `+${digits}`
  })

export const EmailSchema = z.string().trim().toLowerCase().email()

export const CurrencySchema = z.enum(['KES', 'USD', 'UGX', 'TZS', 'NGN'])

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
})
export type Pagination = z.infer<typeof PaginationSchema>

// ============ AUTH ============

export const RequestOtpSchema = z.object({
  phone: PhoneSchema,
  purpose: z.enum(['login', 'verify', 'reset']).default('login'),
})
export type RequestOtpDto = z.infer<typeof RequestOtpSchema>

export const VerifyOtpSchema = z.object({
  phone: PhoneSchema,
  code: z.string().length(6).regex(/^\d{6}$/),
})
export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>

// ============ PRODUCTS ============

export const ProductListQuerySchema = PaginationSchema.extend({
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(['popularity', 'price_asc', 'price_desc', 'newest']).default('popularity'),
  inStock: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
})
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>

export const ProductSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  sku: z.string(),
  name: z.string(),
  shortDescription: z.string().nullable(),
  isFeatured: z.boolean(),
  imageUrl: z.string().nullable(),
  /** Base64 LQIP for next/image's `placeholder="blur"`. Generated client-side
   *  on upload — see apps/web/src/lib/uploads/process-image.ts */
  imageBlurDataUrl: z.string().nullable().optional(),
  minOrderQty: z.number().int().default(1),
  specs: z.record(z.string(), z.string()).optional(),
  category: z.object({ slug: z.string(), name: z.string() }).nullable(),
  brand: z.object({ slug: z.string(), name: z.string() }).nullable(),
  inStock: z.boolean(),
})
export type ProductSummary = z.infer<typeof ProductSummarySchema>

// ============ INQUIRY (B2B WhatsApp quote request) ============

export const InquiryItemSchema = z.object({
  productId: z.string().uuid(),
  name: z.string(),
  sku: z.string(),
  quantity: z.number().int().min(1).max(99999),
})
export type InquiryItem = z.infer<typeof InquiryItemSchema>

export const CreateInquirySchema = z.object({
  referenceNumber: z.string().regex(/^DWX-\d{8}-\d{3,4}$/, 'Invalid reference number'),
  items: z.array(InquiryItemSchema).min(1),
  message: z.string().max(4000),
})
export type CreateInquiryDto = z.infer<typeof CreateInquirySchema>

// ============ ADDRESS (optional — used for delivery context on inquiries) ============

export const AddressSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: PhoneSchema,
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  region: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().default('KE'),
})
export type AddressDto = z.infer<typeof AddressSchema>

// ============ QUOTES (admin-issued formal quote — future) ============

export const QuoteRequestSchema = z.object({
  contactName: z.string().min(2).max(100),
  contactPhone: PhoneSchema,
  contactEmail: EmailSchema.optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
        notes: z.string().max(200).optional(),
      })
    )
    .min(1),
  notes: z.string().max(1000).optional(),
})
export type QuoteRequestDto = z.infer<typeof QuoteRequestSchema>

// ============ PRODUCT EVENTS (inquiry click tracking) ============

/**
 * Storefront-emitted analytics events. Open string set so the storefront can
 * add new kinds without coordinating a migration; the server validates against
 * `ProductEventKindSchema` to reject garbage. Add new values here when a new
 * tap target starts emitting.
 */
export const ProductEventKindSchema = z.enum([
  'WHATSAPP_INQUIRY',
  'QUOTE_ADD',
  'QUOTE_SEND',
  'PRODUCT_VIEW',
])
export type ProductEventKind = z.infer<typeof ProductEventKindSchema>

export const CreateProductEventSchema = z.object({
  productId: z.string().uuid(),
  kind: ProductEventKindSchema,
})
export type CreateProductEventDto = z.infer<typeof CreateProductEventSchema>

export const TopInquiredQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  kind: ProductEventKindSchema.optional(),
})
export type TopInquiredQuery = z.infer<typeof TopInquiredQuerySchema>

// ============ UPLOADS ============

/**
 * Strict allowlist of upload MIME types. Restricted to formats the browser can
 * draw into a <canvas> (so client-side resize works) and that we serve back
 * via <next/image> without an external decoder. Add new types here only after
 * verifying both ends.
 */
export const AllowedImageMimeSchema = z.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
])
export type AllowedImageMime = z.infer<typeof AllowedImageMimeSchema>

/** Maps MIME → file extension. Single source of truth used both for client
 *  validation and for the server's S3 key generation, so the two cannot drift. */
export const MIME_TO_EXT: Record<AllowedImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/**
 * Max upload size in bytes. Presigned PUT cannot enforce this server-side
 * (only presigned POST can via `content-length-range`), so we treat this as
 * a contract: client must resize/reject before PUT. The number is also used
 * by the bucket policy in production to defense-in-depth.
 */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024 // 8MB

export const PresignUploadSchema = z.object({
  /** Original filename, used only for the human-readable display name and to
   *  derive an `alt`. The actual S3 key is generated server-side; we do not
   *  trust user-supplied extensions. Capped to prevent log/storage abuse. */
  filename: z.string().min(1).max(200),
  contentType: AllowedImageMimeSchema,
  /** Optional product UUID to namespace the object key under. When omitted the
   *  upload lands in a generic `products/` prefix. */
  productId: z.string().uuid().optional(),
})
export type PresignUploadDto = z.infer<typeof PresignUploadSchema>

// ============ API RESPONSES ============

export const ApiErrorSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
})
export type ApiError = z.infer<typeof ApiErrorSchema>

export type Paginated<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
