'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, Loader2, RefreshCw, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { env } from '@/env'

interface InquiryItem { name: string; sku: string; quantity: number }
interface Inquiry {
  id: string; referenceNumber: string; items: InquiryItem[];
  message: string; status: string; createdAt: string
}

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'secondary' }> = {
  NEW:      { label: 'New',     variant: 'success' },
  REPLIED:  { label: 'Replied', variant: 'warning' },
  CLOSED:   { label: 'Closed',  variant: 'secondary' },
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/admin/inquiries`, { credentials: 'include' })
      if (res.ok) setInquiries(await res.json())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/admin/inquiries/${id}/status`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setInquiries((prev) => prev.map((i) => i.id === id ? { ...i, status } : i))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Quote Inquiries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {inquiries.length} total · {inquiries.filter(i => i.status === 'NEW').length} new
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-xl border bg-card py-20 text-center">
          <MessageCircle className="mx-auto h-10 w-10 opacity-20" />
          <p className="mt-3 text-muted-foreground">No inquiries yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Quote requests will appear here when customers use the catalog.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => {
            const statusInfo = STATUS_LABELS[inq.status] ?? STATUS_LABELS.NEW
            const isOpen = expanded === inq.id
            const totalUnits = inq.items.reduce((s: number, i: InquiryItem) => s + i.quantity, 0)

            return (
              <div key={inq.id} className="overflow-hidden rounded-xl border bg-card">
                <div
                  className="flex cursor-pointer items-center gap-4 px-5 py-4 hover:bg-accent/30"
                  onClick={() => setExpanded(isOpen ? null : inq.id)}
                >
                  {/* New indicator */}
                  {inq.status === 'NEW' && <span className="h-2 w-2 shrink-0 rounded-full bg-success animate-pulse" />}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{inq.referenceNumber}</span>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {inq.items.length} product{inq.items.length !== 1 ? 's' : ''} · {totalUnits} unit{totalUnits !== 1 ? 's' : ''} ·{' '}
                      {new Date(inq.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick action buttons */}
                    <Button
                      size="sm" variant="outline"
                      className="hidden sm:flex"
                      onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}`, '_blank') }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Reply
                    </Button>
                    {inq.status === 'NEW' && (
                      <Button
                        size="sm" variant="secondary"
                        onClick={(e) => { e.stopPropagation(); updateStatus(inq.id, 'REPLIED') }}
                      >
                        Mark replied
                      </Button>
                    )}
                    {inq.status === 'REPLIED' && (
                      <Button
                        size="sm" variant="ghost"
                        onClick={(e) => { e.stopPropagation(); updateStatus(inq.id, 'CLOSED') }}
                      >
                        Close
                      </Button>
                    )}
                    <span className="text-muted-foreground">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t px-5 py-4 space-y-4">
                    {/* Items table */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items requested</p>
                      <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-secondary/30">
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Product</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">SKU</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Qty</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {inq.items.map((item: InquiryItem, i: number) => (
                              <tr key={i}>
                                <td className="px-3 py-2.5 font-medium">{item.name}</td>
                                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{item.sku}</td>
                                <td className="px-3 py-2.5 text-right font-semibold tabular">{item.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Full message */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp message sent</p>
                      <pre className="rounded-lg bg-secondary/40 p-3 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                        {inq.message}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
