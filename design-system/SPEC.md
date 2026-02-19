# KodNest Premium Build System — Design Spec

Design system for a serious B2C product. Calm, intentional, coherent, confident.

---

## Color System (4 colors max)

| Token | Hex | Use |
|-------|-----|-----|
| Background | `#F7F6F3` | Page, cards, inputs |
| Primary text | `#111111` | Headings, body |
| Accent | `#8B0000` | Primary buttons, focus, emphasis |
| Success | `#5A7A5A` | Shipped badge, success states |
| Warning | `#9A7B4F` | Amber alerts |

**Forbidden:** Gradients, glassmorphism, neon colors.

---

## Typography

- **Headings:** Serif (Georgia/Cambria), large, confident, generous spacing
- **Body:** Sans-serif (system stack), 16–18px, line-height 1.6–1.8, max-width 720px
- **Rule:** No decorative fonts, no random sizes

---

## Spacing (strict scale)

`8px` | `16px` | `24px` | `40px` | `64px`

Never use values like 13px or 27px.

---

## Layout Structure

Every page follows this order:

1. **Top Bar** — Left: Project name | Center: Step X / Y | Right: Status badge
2. **Context Header** — Large serif headline, 1-line subtext
3. **Main** — Primary Workspace (70%) + Secondary Panel (30%)
4. **Proof Footer** — Checklist: □ UI Built □ Logic Working □ Test Passed □ Deployed

---

## Components

| Component | Styling |
|-----------|---------|
| Primary button | Solid `#8B0000`, white text |
| Secondary button | Outlined, transparent bg |
| Inputs | Clean border, clear focus (accent border) |
| Cards | Subtle border, no drop shadow, padding 24px |
| Status badges | Not Started / In Progress / Shipped |

---

## Interactions

- Transition: 150–200ms, ease-in-out
- No bounce, no parallax, no animation noise

---

## States

- **Errors:** Explain what went wrong + how to fix. Never blame the user.
- **Empty:** Provide next action. Never feel dead.
