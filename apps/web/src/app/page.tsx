import { Suspense } from 'react'
import { Hero } from '@/components/home/hero'
import { Categories } from '@/components/home/categories'
import { Featured } from '@/components/home/featured'
import { WhyDewmix } from '@/components/home/why-dewmix'
import { QuoteCta } from '@/components/home/quote-cta'
import { ProductGridSkeleton } from '@/components/product/product-card-skeleton'

export const revalidate = 60

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<SectionSkeleton label="Categories" />}>
        <Categories />
      </Suspense>
      <Suspense fallback={<SectionSkeleton label="Featured products" count={8} />}>
        <Featured />
      </Suspense>
      <WhyDewmix />
      <QuoteCta />
    </>
  )
}

function SectionSkeleton({ label, count = 10 }: { label: string; count?: number }) {
  return (
    <section className="container py-14 lg:py-20">
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-muted" />
      {count <= 5 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <ProductGridSkeleton count={count} />
      )}
    </section>
  )
}
