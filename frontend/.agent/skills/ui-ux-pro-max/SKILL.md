---
name: ui-ux-pro-max
description: UI/UX design intelligence tuned for Next.js App Router + Tailwind CSS projects.
---
# ui-ux-pro-max (Next.js + Tailwind Edition)

Design and implementation guide for modern UI in a Next.js frontend that uses Tailwind CSS.
This skill is optimized for App Router structure and production-ready conventions.

---

## Prerequisites

Run all commands from the frontend root:

```bash
cd frontend
```

Check Python:

```bash
python --version
```

If `python` is unavailable:

- Windows:
  ```powershell
  winget install Python.Python.3.12
  ```
- macOS:
  ```bash
  brew install python3
  ```
- Ubuntu/Debian:
  ```bash
  sudo apt update && sudo apt install python3
  ```

---

## Default Assumptions For This Project

When user does not specify otherwise, assume:

- Framework: **Next.js (App Router)**
- Styling: **Tailwind CSS**
- UI location: `app/` routes + `components/` reusable blocks
- API proxy endpoints: `app/api/**/route.ts`
- Theme and global styles: `app/globals.css` + project tokens

Do **not** default to raw HTML pages. Build in Next.js structure first.

---

## Required Workflow

When user asks to design/build/review/fix UI:

### Step 1: Analyze Request

Extract:

- Product context (e-commerce, dashboard, admin, landing, etc.)
- Screen/page scope (home, product detail, checkout, login...)
- Brand tone (minimal, premium, playful, dark...)
- Constraints (responsive, accessibility, loading states, SEO...)

### Step 2: Generate Design System (Required)

Always run design-system search first:

```bash
python ".agent/skills/ui-ux-pro-max/scripts/search.py" "<product + style + context>" --design-system -p "Project Name"
```

Optional persistence:

```bash
python ".agent/skills/ui-ux-pro-max/scripts/search.py" "<query>" --design-system --persist -p "Project Name"
```

If working on a specific page:

```bash
python ".agent/skills/ui-ux-pro-max/scripts/search.py" "<query>" --design-system --persist -p "Project Name" --page "checkout"
```

### Step 3: Pull Extra Guidance (As Needed)

```bash
python ".agent/skills/ui-ux-pro-max/scripts/search.py" "<keyword>" --domain <domain> -n 5
```

Use domains for targeted decisions:

- `style`: visual language and effects
- `typography`: font pairing and hierarchy
- `color`: palette direction
- `ux`: interaction/accessibility rules
- `landing`: conversion-oriented section structure
- `chart`: chart type recommendations

### Step 4: Apply Stack Guidance (Default: Next.js)

In this repo, stack guidance defaults to **nextjs**:

```bash
python ".agent/skills/ui-ux-pro-max/scripts/search.py" "<feature keyword>" --stack nextjs
```

Use `--stack html-tailwind` only when user explicitly asks for plain HTML output.

---

## Next.js Structure Rules (Mandatory)

### Routing And Files

- Put route UI in `app/<segment>/page.tsx`
- Put shared layouts in `app/<segment>/layout.tsx`
- Put loading/error boundaries in `app/<segment>/loading.tsx` and `app/<segment>/error.tsx` when needed
- Keep API handlers in `app/api/<name>/route.ts`
- Keep reusable UI in `components/` (not inside random route folders unless route-specific)

### Server vs Client Components

- Default to **Server Components**
- Add `"use client"` only when component needs browser APIs, React client hooks, or event handlers
- Avoid moving entire page trees to client side unless required

### Data Fetching

- Prefer server-side data fetching in Server Components
- Use route handlers only when exposing an API boundary is necessary
- Handle loading/empty/error states explicitly

### Tailwind Usage

- Use semantic, composable utility groups
- Extract repeated patterns into reusable components
- Keep spacing/type scale consistent across pages
- Avoid one-off arbitrary values unless truly necessary

### Accessibility And Semantics

- Use semantic HTML (`main`, `section`, `nav`, `button`, `label`, etc.)
- Keep focus states visible
- Ensure keyboard navigation works for interactive controls
- Keep contrast readable in light/dark contexts

---

## Recommended Frontend Folder Pattern

Use this as the default shape:

```text
frontend/
  app/
    (auth)/
      login/
        page.tsx
      register/
        page.tsx
    api/
      auth/
        login/
          route.ts
  components/
    auth/
      login-form.tsx
      register-form.tsx
    ui/
      button.tsx
      input.tsx
  lib/
    utils.ts
```

---

## Output Standard For Agent Responses

When delivering UI/code changes, ensure:

1. Route placement follows `app/**` App Router conventions
2. Reusable UI lives in `components/**`
3. Tailwind classes are clean, consistent, and responsive
4. No unnecessary `"use client"`
5. States covered: loading, empty, error, success
6. Basic accessibility checks pass

---

## Search Reference

### Domains

- `product`: product-type patterns
- `style`: visual style direction
- `typography`: font combinations
- `color`: palette recommendations
- `landing`: section composition
- `chart`: visualization options
- `ux`: interaction and accessibility
- `react`: rendering/performance patterns
- `web`: semantic web conventions
- `prompt`: style prompt generation

### Stacks

- `nextjs` (DEFAULT in this frontend)
- `react`
- `html-tailwind`
- `vue`
- `svelte`
- `shadcn`
- `react-native`
- `flutter`
- `swiftui`
- `jetpack-compose`

---

## Example Workflow (E-commerce Next.js)

User request:
"Tao trang product detail dep, responsive, co section goi y san pham."

Run:

```bash
python ".agent/skills/ui-ux-pro-max/scripts/search.py" "ecommerce product detail recommendations modern clean" --design-system -p "Online Clothing Shop"
python ".agent/skills/ui-ux-pro-max/scripts/search.py" "product detail mobile spacing hierarchy" --domain ux
python ".agent/skills/ui-ux-pro-max/scripts/search.py" "product gallery sticky buy panel" --stack nextjs
```

Then implement with:

- `app/products/[slug]/page.tsx` for route entry
- `components/products/` for gallery, info panel, recommendation grid
- Tailwind responsive patterns for `sm/md/lg` breakpoints

---

## Pre-Delivery Checklist (Next.js + Tailwind)

### Next.js Conventions

- [ ] Correct file placement under `app/**` and `components/**`
- [ ] No legacy `pages/` pattern unless project explicitly uses it
- [ ] Route handlers use `route.ts` naming
- [ ] Server/Client boundary is intentional

### UI Quality

- [ ] Visual hierarchy is clear
- [ ] Spacing system is consistent
- [ ] Interactive elements have hover/focus/disabled states
- [ ] No layout shift from hover animation

### Responsive Behavior

- [ ] Works at 375, 768, 1024, 1440 widths
- [ ] No horizontal overflow on mobile
- [ ] Primary actions remain visible on small screens

### Accessibility

- [ ] Inputs have labels
- [ ] Images have useful `alt`
- [ ] Keyboard users can navigate key interactions
- [ ] Color contrast is acceptable

### Performance

- [ ] Avoid unnecessary client-side rendering
- [ ] Optimize large images with Next.js image strategy
- [ ] Keep component trees modular and reusable

---

## Anti-Patterns To Avoid

- Building full pages in a single giant client component
- Mixing API logic directly into presentational UI components
- Using inconsistent spacing and typography per section
- Overusing absolute positioning for core layout
- Using hardcoded colors that ignore design tokens/theme
