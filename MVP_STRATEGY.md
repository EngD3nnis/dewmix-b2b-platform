# Dewmix Hardware — 48-Hour MVP Strategy

> Written as: Startup CTO + Systems Architect + Product Manager + B2B Operations Consultant
> Date: May 2026
> Status: Pre-ship assessment and action plan

---

## The most important thing to say first

**You are already 80% done with the MVP.**

The platform has a working product catalog, category navigation, search, WhatsApp inquiry buttons on every product, a full admin dashboard with CRUD for products and categories, image upload, stock management, mobile-responsive design, dark mode, SEO metadata, and phone OTP auth.

The risk right now is not "we haven't built enough." The risk is **building more things instead of shipping what works.** Every hour spent adding features is an hour the platform isn't in front of the business owner and real customers.

This document tells you what to do in the next 48 hours — and what to deliberately not do.

---

## 1. The smallest but most impressive 48-hour MVP

The MVP is not a feature list. It's an experience. Specifically, it's the moment when the business owner picks up their phone, opens the URL, and thinks: *"I can send this link to a customer right now."*

Everything in the 48-hour plan works backward from that moment.

**What you need to reach that moment:**

| Item | Status | Work remaining |
|---|---|---|
| Product catalog (browse, search, filter) | ✅ Built | Polish only |
| Product detail with specs + MOQ + stock | ✅ Built | None |
| WhatsApp inquiry button | ✅ Built | None |
| Category navigation | ✅ Built | None |
| Mobile-first responsive design | ✅ Built | Test on real phone |
| Admin: add/edit/delete products | ✅ Built | None |
| Admin: manage categories | ✅ Built | None |
| Admin: image upload | ✅ Built | Test with real images |
| Admin: stock quantity management | ✅ Built | None |
| Dark mode | ✅ Built | None |
| SEO metadata | ✅ Built | None |
| Homepage with featured products | ✅ Built | Polish copy |
| Domain + deployment | ❌ Not done | **Do this** |
| Inquiry click tracking | ❌ Not done | **Do this** |
| Low-stock alerts in admin | ❌ Not done | **Do this** |
| Admin mobile usability | ❌ Untested | **Test + fix** |

**Total remaining to MVP: deploy + 2 small features + 1 day of testing.**

That is the honest assessment. Stop adding features and start deploying.

---

## 2. Features with the biggest immediate business impact

Ranked by impact per hour of engineering effort:

### Tier 1 — Do now (highest impact, lowest effort)

**Getting a real domain and deploying.**
This is not glamorous but it is the single highest-leverage move. Right now the platform runs on localhost. That makes it invisible to the business owner's customers, to suppliers, to anyone. Deploy to a real URL (`dewmixhardware.co.ke` or similar) and everything else becomes real.

**WhatsApp inquiry button already working.**
The moment a customer browses a product and taps "Order via WhatsApp," the business owner receives a structured message with the product name and SKU. This is already built. It replaces an unstructured phone call where the owner has to ask "which drill?" while the customer doesn't know the model number. That is a real, immediate operational improvement.

**The shareable catalog link.**
The owner can text or WhatsApp "our catalog: dewmixhardware.co.ke/products" instead of describing every product by voice. For a hardware business where customers call to ask "do you have this type of drill?", a browsable catalog eliminates those calls entirely for customers who are willing to self-serve.

**Low-stock badge in admin.**
When inventory drops below the reorder level, the admin product list should show a red indicator. This is 30 minutes of code. It turns an invisible problem (you don't know you're running out of stock until a customer asks and you don't have it) into a visible one.

**Featured products on homepage.**
Already built. The business owner can surface their high-margin or fast-moving items. This is operational control over what customers see first.

### Tier 2 — Do this week (high impact, medium effort)

**Inquiry tracking.**
Every time a customer clicks the WhatsApp button, log it (product, timestamp). Then show the admin "this product got 12 inquiries this week." This costs 2 hours to build and gives the business owner genuine business intelligence they've never had before.

**Basic analytics page.**
"Top 10 most inquired-about products this week." One endpoint, one table in the admin. Tells the owner what to restock, what to feature, what to buy more of. This is genuinely new information the business does not have today.

**Admin mobile view.**
The business owner is at the shop, not at a desk. They need to be able to mark a product out-of-stock from their phone in 10 seconds. Test the admin on an actual phone and fix anything that requires a desktop to use.

### Tier 3 — Do next month

- Inquiry form (WhatsApp is fine for now)
- Customer-facing order tracking
- Supplier management
- Advanced analytics
- Automated SMS notifications

---

## 3. What to deliberately NOT build in 48 hours

These are tempting but wrong for the next two days:

**Full analytics dashboard with charts.**
You have no data yet. Charts of zero are meaningless. Ship the tracking first, then build the visualization in two weeks when there's actual data to show.

**WhatsApp Business API integration.**
Requires Meta business account approval (takes days), webhook infrastructure, a dedicated phone number, and integration code. The current approach (opening wa.me with a pre-filled message) works perfectly for MVP. Real API integration is a month 2 problem.

**Multi-warehouse inventory management.**
The business has one location. Build for one location. Add warehouses when they have multiple warehouses.

**Supplier portal.**
The business is the supplier. Building a portal for their suppliers to manage their own listings is a second-phase feature. Don't build a marketplace before you have the catalog working.

**Reviews and ratings.**
This is B2B hardware. Contractors do not write reviews on hardware suppliers. They WhatsApp. Skip this entirely for now, possibly forever.

**ERP integrations.**
QuickBooks, Sage, MYOB integrations sound impressive but require integrating with systems the business may not even use yet. This is a six-month conversation.

**Real-time notifications (WebSockets, push notifications).**
Email is fine. SMS is fine. Real-time push is engineering complexity for marginal business value at this scale.

**Complex user accounts for customers.**
Customers don't need to create accounts on a B2B catalog. They browse, they WhatsApp. Accounts add friction and maintenance burden. The admin needs accounts. Customers do not.

The rule: **if removing the feature doesn't break the core use case of "browse products and contact via WhatsApp," remove it from the 48-hour plan.**

---

## 4. Architecture for long-term scalability

The current stack is correct. Do not change it. Here's why each piece is right:

**Next.js App Router as the frontend.**
Server Components mean product pages are rendered HTML. Google can index them. They load fast on 3G. No JavaScript is needed for browsing. This is the right architecture for a catalog.

**NestJS as the API.**
Module-based architecture. Each feature is self-contained. As the business grows and you need supplier management, procurement workflows, analytics, or ERP integrations, each one becomes a new NestJS module. You can extract it to its own service when it needs independent scaling. You can't do this cleanly with a monolith where features are entangled.

**PostgreSQL.**
The right database for this business. It handles relational data (products → categories → inventory → suppliers), JSONB for flexible product specs, and it has a proven migration path. Every serious B2B system in the world runs on a relational database.

**What the architecture needs that it doesn't have yet:**

**An event/audit log table** (already started with AuditLog). This is the foundation for every future automation. Every state change in the system emits an event. Those events power:
- Inquiry tracking
- Low-stock alerts
- Analytics
- Future webhooks to external systems

**A webhook delivery system.** When a product goes out of stock, when an inquiry is received, when a new product is added — emit a webhook to a URL. This is how you integrate with WhatsApp Business API, Slack, email, ERP, or any future system without tight coupling.

**An API key system for external integrations.** When suppliers or customers want to integrate programmatically, they need API keys. This is a three-table schema change that enables everything from mobile apps to third-party integrations.

None of these are urgent for the 48-hour MVP. But they should be designed into the data model from day one.

---

## 5. Evolution path from catalog to business operating system

This is the roadmap in stages. Each stage is additive — it does not require rewriting what came before.

**Stage 1 (now): Digital Catalog**
Customers browse products, contact via WhatsApp. Admin manages inventory. Business replaces phone-call-based product inquiry with a professional catalog.

*Metrics for success:* Owner sends catalog link instead of describing products. Inquiry calls drop. Business looks professional to new customers.

**Stage 2 (month 2): Inquiry Management**
Capture formal inquiry requests (RFQs) as records. Track inquiry status (new → replied → converted → lost). Build a simple CRM for the business's customer interactions. Know which customers are active and which products they buy.

*Metrics for success:* Owner can see all open inquiries in one place. Follow-up is proactive, not reactive.

**Stage 3 (month 3-4): Inventory Intelligence**
Automatic low-stock alerts via SMS/WhatsApp. Reorder suggestions based on inquiry volume vs stock levels. Sales velocity tracking per product. Supplier contact management (who do you call when you need more Bosch drills?).

*Metrics for success:* Owner never runs out of a fast-moving product unexpectedly. Purchasing decisions are data-informed.

**Stage 4 (month 5-6): Supplier Network**
Onboard other hardware suppliers onto the platform. Each supplier manages their own catalog. Platform earns commission or subscription. This is the marketplace transition.

*Metrics for success:* Platform has value to more than one business.

**Stage 5 (year 2): B2B Procurement System**
Contractors and construction companies create accounts. They submit formal purchase orders, get quotes, track deliveries. The platform becomes the operating layer between buyers and sellers in the hardware supply chain.

*Metrics for success:* Buyers and sellers transact through the platform. Platform is sticky for both sides.

**Stage 6 (year 3): Business Operating System**
Accounting integrations, delivery management, supplier invoicing, customer credit terms, construction project management features. The platform knows a contractor is building in Thika, it can predict their cement needs, it can automatically suggest a quote.

*Metrics for success:* The business cannot operate without the platform.

Each transition is a natural extension of the data model and module architecture already in place. None requires a rewrite.

---

## 6. Pages and workflows for the 48-hour MVP

**Public (customer-facing):**

| Route | Purpose | Status |
|---|---|---|
| `/` | Homepage with featured products, categories, trust signals | ✅ Done |
| `/products` | Full catalog with search + category filter | ✅ Done |
| `/products/[slug]` | Product detail with specs, stock, MOQ, WhatsApp CTA | ✅ Done |
| `/categories` | All categories | ✅ Done |
| `/categories/[slug]` | Category-filtered product listing | ✅ Done |
| `/search?q=...` | Search redirects to `/products?q=` | ✅ Done |

**Admin:**

| Route | Purpose | Status |
|---|---|---|
| `/login` | Phone OTP login | ✅ Done |
| `/admin` | Dashboard with stats + quick actions | ✅ Done |
| `/admin/products` | Product list with search + filter | ✅ Done |
| `/admin/products/new` | Create product | ✅ Done |
| `/admin/products/[id]` | Edit product + upload images | ✅ Done |
| `/admin/categories` | Category management | ✅ Done |
| `/admin/analytics` | Top inquired products | **Build this** |

**That is the complete MVP.** Anything not on this list is not the MVP.

---

## 7. Automations realistically implementable immediately

**Already working:**
- WhatsApp inquiry generation — customer taps button, WhatsApp opens with pre-filled product message. No API needed. Works today.
- Featured products — admin ticks a checkbox, product appears on homepage. Works today.
- Stock visibility — in-stock/out-of-stock badge updates based on inventory quantity. Works today.
- Fast search — product search with filters. Works today.

**Build these in the next 48 hours:**

**Inquiry click tracking (2 hours).**
When a customer clicks the WhatsApp button, make a silent background API call: `POST /api/v1/events { type: 'inquiry.click', productId: ... }`. Store it in a new `ProductEvent` table. That's it. Now you have data. The analytics dashboard queries this table.

**Low-stock alert badge in admin (1 hour).**
In the admin product list, if `inventory.quantity <= inventory.reorderLevel`, show a red indicator next to the product. The data is already in the database. This is CSS and a conditional.

**Basic analytics page in admin (3 hours).**
Query `ProductEvent` grouped by `productId`, count by week. Show a table: "Most inquired products this week." One database query, one table. No charting library needed for the MVP.

**What is NOT realistic in 48 hours:**
- WhatsApp Business API (requires Meta approval + weeks of setup)
- Automated email/SMS to the owner when an inquiry happens (needs a job queue + email provider — possible but not critical for MVP)
- Real-time dashboard updates (overkill, a page refresh is fine)
- Predictive restock suggestions (no data yet to base predictions on)

---

## 8. Stack recommendation

The current stack is correct for this business. Here is the validation:

| Layer | Current choice | Verdict | Reasoning |
|---|---|---|---|
| Frontend | Next.js App Router | ✅ Correct | SSR for SEO, RSC for performance, one codebase for storefront and admin |
| Styling | TailwindCSS + ShadCN | ✅ Correct | Fast to build, consistent, professional |
| Backend | NestJS | ✅ Correct | Structured, scalable module boundaries, strong TypeScript |
| Database | PostgreSQL | ✅ Correct | The right choice for relational B2B data |
| ORM | Prisma | ✅ Correct | Type-safe, migrations work, great DX |
| Search | Typesense (not yet wired) | ✅ Right tool, not yet connected | Wire it up — critical for 4,000+ products |
| Image storage | MinIO locally → S3 prod | ✅ Correct | Standard pattern |
| Auth | JWT + HttpOnly cookies + Phone OTP | ✅ Correct | Passwordless, Kenyan market fits |
| Hosting | Vercel (web) + Render (API) | ✅ Correct for MVP | Can migrate to AWS when traffic demands it |
| Admin | Same Next.js app at `/admin` | ✅ Correct | No separate tool needed yet |

**One thing to add now:** wire up Typesense for instant search. The container is running. The connection just needs to be made in the API's search module. This single change transforms the search experience from "wait for a DB query" to "instant results as you type" — exactly what a B2B buyer with 4,000 products to search through needs.

**One thing to add later (not now):** a job queue (BullMQ on Redis) for background tasks. The Redis instance is already running. When you want to send SMS on low-stock or process bulk CSV uploads in the background, BullMQ is ready to go. Don't wire it until you have a use case.

**Hosting specifics:**

For the next 2 days: deploy to Vercel + Render. Both have free tiers. Both deploy from GitHub in minutes. Total cost: zero.

For the first year: Render Pro ($25/month for the API) + Vercel Pro ($20/month for the frontend) + Neon.tech Postgres ($20/month) + Cloudflare for DNS/CDN (free tier is fine). Total: ~$65/month for a production-grade stack.

For serious scale: migrate API to AWS ECS Fargate, Postgres to AWS RDS Multi-AZ, add CloudFront for images. This is a year-two conversation.

---

## 9. UI/UX principles for this business model

**The right reference is not Jumia or Alibaba.**

Jumia is designed for consumers buying one item on impulse. Alibaba is designed for global bulk procurement between strangers. Neither is right for a local hardware supplier serving known contractors and tradespeople.

**The right reference is Grainger — but simpler and faster.**

Grainger (the largest industrial and hardware supplier in North America) built their digital presence on one insight: B2B buyers know what they want. They don't need to be persuaded. They need to find it fast, confirm the spec, and contact the supplier.

The UI principles that follow from this:

**Information density over visual polish.** A contractor on a site looking for the right drill specification doesn't need a beautiful hero image. They need to see "Power: 600W, Chuck: 13mm, Weight: 1.8kg" immediately. The current product card design does this correctly with the spec preview.

**Speed above all else.** A page that loads in 0.5 seconds on 3G is more valuable than any feature. Next.js Server Components, Typesense search, and Cloudflare CDN are the technical implementation of this principle.

**Mobile-first is not a buzzword here — it's literal.** Business owners in Kenya do 80%+ of their digital interactions on a phone. Site supervisors browse the catalog while standing on a construction site. Every interaction — browsing, searching, inquiry — must work flawlessly on a midrange Android phone on a slow network.

**WhatsApp is the conversion point.** Every product page has one primary action: the green WhatsApp button. Everything else on the page is supporting information that builds confidence to click that button. The page layout should guide the eye toward it.

**Professional, not retail.** The blue-and-white design is correct. It reads as "trusted supplier," not "discount shop." Don't add sales gimmicks (countdown timers, "only 3 left" panic indicators, discount percentages). This audience is not retail-manipulable. They want a supplier they can rely on. Reliability is communicated through completeness of information and professionalism of presentation, not through urgency tactics.

**Fast admin for a busy owner.** The admin interface should be operable in 30 seconds per task. Updating stock should be: find product → change number → save. Not a wizard, not a multi-step form. The current admin is close to this but needs to be tested on a phone and tightened.

---

## 10. What makes the business owner say "this improves my business"

These are the specific moments, in order of likelihood:

**"I can share this link and customers can see everything."**
This happens the first time they realize they can text a customer "our catalog is at dewmixhardware.co.ke" instead of spending 20 minutes on a phone call describing products. This is the highest-value moment and it requires zero new features — only deployment.

**"When they message on WhatsApp, they already say which product they want."**
Previously: "Hi, do you have drills?" — and the owner has to ask "which drill?" back and forth for five messages. Now: "Hello, I would like to inquire about Bosch GSB 13 RE Impact Drill (SKU: BSH-GSB13RE)." One message, all the information. This is already working.

**"I can see that 8 people asked about this product this week."**
This is the first time the business has any data on what customers are interested in. It informs purchasing, pricing, and stocking decisions. Currently this information exists only in the owner's memory and WhatsApp chat history.

**"I can see my low-stock products without counting the shelves."**
A red badge in the admin means the owner doesn't have to physically check stock to know what needs reordering. This saves time every single day.

**"I can update a product from my phone in 30 seconds."**
A new product arrives at the shop. The owner takes a photo, adds it to the catalog from their phone while still standing in the warehouse. Previously, this would have required either not adding it or waiting until they're at a desk.

**"My suppliers can see what we stock."**
Share the catalog URL with existing and potential suppliers. Suddenly the business looks more established, more organized, and more professional than the competition that still operates from a printed catalog or WhatsApp catalog photos.

### What will NOT impress the business owner in the demo

Charts with no data, complex analytics dashboards, supplier portals, ERP integrations, features with lots of UI that do nothing visible, and anything that requires explanation. Business owners judge software by one question: "Does this make my day easier?" Everything that requires explanation is something that makes their day harder.

---

## The 48-hour action plan

**Hours 1-4: Deploy**
- Deploy API to Render
- Deploy web to Vercel
- Point a domain (or subdomain) at the deployment
- Run migrations and seed the database
- Test the live URL on a real phone

**Hours 5-10: Wire up Typesense search**
- Connect the existing Typesense container to the search module
- Index the 23 demo products
- Test instant search on the live site

**Hours 11-14: Inquiry tracking**
- Add `ProductEvent` table to Prisma schema
- Fire a background event when the WhatsApp button is clicked
- Admin endpoint: top 10 products by inquiry click this week

**Hours 15-18: Low-stock alert in admin + basic analytics page**
- Red badge on admin product list when stock ≤ reorder level
- Simple analytics page: `/admin/analytics` showing top inquired products

**Hours 19-24: Test, fix, polish**
- Test the entire flow on a real Android phone on mobile data
- Fix any layout issues, slow interactions, or broken flows
- Update the 23 demo products with better descriptions and real specs
- Upload real product images if available

**Hours 25-36: Load real products**
- Add Dewmix's actual product catalog using the admin dashboard
- Real SKUs, real specs, real categories
- Real images (even phone photos are fine)
- Set realistic stock quantities

**Hours 37-48: Demo preparation and handoff**
- Write a one-page "how to use the admin" guide for the business owner
- Create a simple share card with the catalog URL
- Prepare the demo — show the WhatsApp flow end-to-end on a real phone
- Document what's built, what's next, and how to maintain it

---

## What to say in the demo

"Here's your product catalog. Anyone with this link can browse everything you stock. When they want to order, they tap this button and WhatsApp opens with the product already named. You get a message that says exactly what they want. No more 'which drill?' back-and-forth.

In your admin, you can see which products got the most inquiries this week. You can see which products are running low. You can add a new product from your phone in under a minute.

We can share this with your existing customers today."

That is the demo. Everything else is detail.

---

## Honest assessment of what's built vs what's needed

**The platform is not 20% done. It is 80% done.**

The catalog works. The WhatsApp integration works. The admin works. The design is professional. The architecture can scale to 100,000 products.

The missing 20% is: deployment (the URL is localhost), inquiry tracking (2 hours of code), Typesense search wiring (3 hours), and real product data (load your actual inventory).

**If you spend the next 48 hours building new features instead of deploying and loading real data, you will have a more impressive codebase and a less impressive business.**

Deploy first. Load real products second. Add analytics third. Everything else is phase two.
