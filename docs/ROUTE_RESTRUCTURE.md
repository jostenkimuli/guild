# Route Restructuring: Console → Ecosystem-Centric Layout

## Goal

Eliminate the `console/` folder and restructure routes to follow the domain model hierarchy: Ecosystem → Space. Each level owns its layout and context. Cross-cutting admin concerns live at `/admin`.

## New Route Structure

```
/
/login
/setup-password

/(dashboard)/
  layout.tsx              ← shared shell (sidebar, header, auth gate)
  dashboard/page.tsx      ← role-aware landing

/admin/
  layout.tsx              ← gates super_admin | program_admin
  page.tsx                ← pending approvals overview
  ecosystem-admins/page.tsx
  program-admins/page.tsx

/ecosystem/
  layout.tsx              ← gates ecosystem_admin, fetches ecosystem
  page.tsx                ← create ecosystem OR redirect to /ecosystem/[id]
  [id]/
    layout.tsx            ← provides ecosystem context
    page.tsx              ← ecosystem overview
    spaces/page.tsx       ← list/manage spaces
    staff/page.tsx        ← manage space admins

/spaces/
  [slug]/
    page.tsx              ← space detail (curriculum, syllabi, members)
```

## Route Mapping (Old → New)

| Old Route | New Route |
|---|---|
| `/console/super` | `/admin` |
| `/console/super/ecosystem-admins` | `/admin/ecosystem-admins` |
| `/console/program` | `/admin` (same page, different gate) |
| `/console/ecosystem` | `/ecosystem/` (create form) |
| `/console/ecosystem/spaces/[type]` | `/ecosystem/[id]/spaces/` |
| `/ecosystem/staff` | `/ecosystem/[id]/staff/` |
| `/spaces/[slug]/syllabus/new` | removed (dialog-only) |

## Layout Responsibilities

| Layout | Gates | Fetches | Provides |
|---|---|---|---|
| `(dashboard)/layout.tsx` | Any authenticated user | — | Shell, sidebar, role-based nav |
| `admin/layout.tsx` | `super_admin` or `program_admin` | — | Admin shell |
| `ecosystem/layout.tsx` | `ecosystem_admin` + approved | — | Create-or-redirect logic |
| `ecosystem/[id]/layout.tsx` | — | Ecosystem by id | Ecosystem context for children |

## Post-Login Redirect Logic

| Role | Redirect |
|---|---|
| `super_admin` | `/admin` |
| `program_admin` | `/admin` |
| `ecosystem_admin` (approved, has ecosystem) | `/ecosystem/[id]` |
| `ecosystem_admin` (approved, no ecosystem) | `/ecosystem/` → create form |
| `ecosystem_admin` (pending) | `/dashboard` (awaiting approval card) |
| `space_admin` (has space) | `/spaces/[slug]` |
| `space_admin` (no space) | `/dashboard` (awaiting assignment) |
| `learner` | `/spaces/[slug]` or `/dashboard` |

## Key Decisions

1. **Spaces stay at `/spaces/[slug]`** — not nested under ecosystem. Stable, bookmarkable URLs.
2. **Ecosystem admin's create flow** is a layout state at `/ecosystem/`, not a separate route. No `/ecosystem/create` URL.
3. **Ecosystem routes use `[id]`** — the ecosystems table has no `slug` column, so the UUID is used as the route param.
4. **Cross-cutting admin** (user approval queues) lives at `/admin` — separate from any ecosystem.
5. **The `console/` directory disappears entirely.**
