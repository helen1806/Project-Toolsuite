# Project Toolsuite — Design System

Practical reference for contributors building or modifying tools. Follow this to stay consistent with the neobrutalist, privacy-first aesthetic.

---

## 1. Philosophy

**Neobrutalist.** Heavy borders, offset box-shadows, sharp edges, UPPERCASE labels. No decoration for decoration's sake.

**Monospace-first.** All body text uses JetBrains Mono. Headings use Space Grotesk. No other font families.

**Privacy-first.** No external JS libraries. No tracking scripts. Google Fonts is the only external CDN dependency.

**Dual-theme.** Every color value must come from a CSS variable so dark mode works automatically.

---

## 2. Design Tokens

All tokens live in `theme.css`. **Never hardcode hex values in tool CSS** — always use `var(--token-name)`.

### Color Tokens

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--bg` | `#f4f1ea` | `#0f172a` | Page background |
| `--surface` | `#faf7f2` | `#172033` | Card / panel background |
| `--surface-2` | `#e7ddd1` | `#243247` | Secondary surface, inputs |
| `--text` | `#1f1b16` | `#f8fafc` | Primary text, button fill |
| `--muted` | `#6e6761` | `#94a3b8` | Labels, placeholders, secondary copy |
| `--border` | `#8a7f77` | `#475569` | All borders and offset shadows |
| `--shadow` | `rgba(15,23,42,0.12)` | `rgba(0,0,0,0.35)` | Elevated shadow (hover states) |
| `--card-hover` | `#1f1b16` | `#60a5fa` | Accent on card hover |

### Semantic Color Tokens

Defined per-tool (not in `theme.css`). Declare in `:root` with a dark override on `body.dark-mode`.

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--success` | `#22c55e` | `#4ade80` | Success states, valid feedback |
| `--danger` / `--error` | `#ef4444` | `#f87171` | Error states, destructive actions |
| `--warning` | `#f59e0b` | `#fbbf24` | Warning states |

### Typography Tokens

```css
--font-mono:    "JetBrains Mono", "Courier New", Courier, monospace;
--font-display: "Space Grotesk", "Courier New", monospace;
```

---

## 3. Typography

### Font Families

- **Body / Code / UI:** `var(--font-mono)` — applied globally via `body { font-family: var(--font-mono); }`
- **Headings (h1, h2, h3):** `var(--font-display)` — applied globally in `theme.css`
- **Inputs / buttons:** `font-family: inherit` — picks up `--font-mono` automatically

### Type Scale

| Element | Size | Weight | Notes |
|---|---|---|---|
| `h1` | `2.8rem` | `700` | Uppercase, `letter-spacing: 0.03em` |
| `h2` | `2.0–2.5rem` | `700` | Section headings |
| `h3` | `1.0–1.6rem` | `600–700` | Card/panel titles |
| Card title | `1.2–1.3rem` | `700` | Uppercase, border-bottom separator |
| Body | `1rem` | `400–500` | Default |
| Form label | `0.85rem` | `700` | Uppercase, `letter-spacing: 0.5px` |
| Caption / badge | `0.8–0.85rem` | `500–700` | Small UI labels |

### Rules

- Section labels and button text: always `text-transform: uppercase`
- Never use `font-size` smaller than `0.75rem`
- Headings on tool pages: start at `h2` (the browser tab title is effectively `h1`)

---

## 4. Component Patterns

Copy these patterns directly. Do not invent new class names for the same concept.

### Button

```css
.btn {
  background: var(--bg);
  color: var(--text);
  border: 2px solid var(--border);
  padding: 10px 18px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--border);
  transition: all 0.1s ease;
}

.btn:hover {
  background: var(--text);
  color: var(--bg);
}

.btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--border);
}

/* Variants */
.btn-primary {
  background: var(--text);
  color: var(--bg);
  border-width: 3px;
  box-shadow: 4px 4px 0 var(--border);
}

.btn-danger {
  border-color: var(--danger);
  color: var(--danger);
}
.btn-danger:hover {
  background: var(--danger);
  color: var(--bg);
}

.btn-sm {
  padding: 4px 10px;
  font-size: 0.75rem;
  box-shadow: 2px 2px 0 var(--border);
}
```

### Card

```css
.card {
  border: 3px solid var(--border);
  padding: 24px;
  background: var(--surface);
  box-shadow: 4px 4px 0 var(--border);
  margin-bottom: 24px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px var(--shadow);
}

.card-title {
  font-size: 1.2rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border);
  padding-bottom: 8px;
  margin: 0 0 20px;
}
```

**No border-radius on cards.** Sharp corners are part of the aesthetic. Exception: `recent-sidebar` uses `border-radius: 12px` as a deliberate contrast element.

### Form Controls

```css
.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  margin-bottom: 6px;
}

input[type="text"],
input[type="number"],
input[type="url"],
select,
textarea {
  width: 100%;
  padding: 10px 12px;
  font-family: inherit;
  font-size: 0.95rem;
  border: 2px solid var(--border);
  background: var(--bg);
  color: var(--text);
  border-radius: 0;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  background: var(--surface-2);
  border-color: var(--text);
}
```

### Tabs

```css
.tab-bar {
  display: flex;
  border-bottom: 3px solid var(--border);
  margin-bottom: 20px;
  gap: 6px;
}

.tab-btn {
  background: var(--bg);
  color: var(--text);
  border: 2px solid var(--border);
  border-bottom: none;
  padding: 8px 16px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.1s ease;
}

.tab-btn.active {
  background: var(--text);
  color: var(--bg);
}

.tab-content { display: none; }
.tab-content.active { display: block; }
```

### Badge / Status

```css
.stat-badge {
  border: 2px solid var(--border);
  padding: 8px 12px;
  font-weight: 700;
  font-size: 0.9rem;
  background: var(--surface-2);
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-success { background: var(--success); color: #000; }
.status-warning { background: var(--warning); color: #000; }
.status-danger  { background: var(--danger);  color: #fff; }
```

### Alert Panel

```css
.alert-box {
  border: 2px dashed var(--border);
  background: var(--surface-2);
  padding: 16px;
  font-size: 0.9rem;
  margin-bottom: 24px;
}

.status-panel {
  padding: 16px;
  border: 2px dashed var(--border);
  font-size: 1.1rem;
  font-weight: 700;
  background: var(--surface-2);
  margin-bottom: 24px;
  min-height: 56px;
}

.status-panel.success {
  border-color: var(--success);
  color: var(--success);
  background: rgba(34, 197, 94, 0.08);
}

.status-panel.error {
  border-color: var(--error);
  color: var(--error);
  background: rgba(239, 68, 68, 0.08);
}
```

### Toast Notifications

Do not build your own. Use the shared notification system:

```html
<!-- In your tool's <head> -->
<link rel="stylesheet" href="../../assets/css/notifications.css" />

<!-- Before </body> -->
<script src="../../assets/js/notifications.js"></script>
```

```js
// API
showToast("Copied to clipboard!", "success");  // success | error | info
showToast("Invalid input.", "error");
showToast("Processing...", "info");
```

---

## 5. Layout

### Tool Page Container

```css
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px;
}
```

### Two-Column Tool Layout (standard)

```css
.split-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
}

@media (max-width: 900px) {
  .split-layout {
    grid-template-columns: 1fr;
  }
}
```

### Spacing Scale

| Use | Value |
|---|---|
| Card padding | `24px` |
| Card gap / grid gap | `20px` |
| Form group spacing | `18px` |
| Inline element gap | `12px` |
| Container horizontal padding | `20px` |
| Container vertical padding | `40px` |
| Section spacing | `40–60px` |

### Index Page Workspace Grid

Defined in `index.html`. Do not replicate in tool pages.

```css
.workspace {
  display: grid;
  grid-template-columns: 220px 1fr 280px;
  gap: 32px;
}
```

---

## 6. Responsive Breakpoints

| Breakpoint | What changes |
|---|---|
| `max-width: 900px` | Two-column tool layouts collapse to one column |
| `max-width: 850px` | `.recent-sidebar` switches from `sticky` to `static` |
| `max-width: 600px` | Full mobile: font sizes reduce, padding tightens, grids go single-column |

Always use `@media (max-width: N)` — no min-width-first exception unless the component truly requires it.

---

## 7. Dark Mode

Dark mode is handled entirely by `theme.js`, which toggles the `.dark-mode` class on `<body>` and persists to `localStorage`.

**If you use only CSS variables, dark mode is free.** No extra work required.

The only time you need an explicit `body.dark-mode` override is when you've used a hardcoded color for a semantic reason (e.g., an edge-case warning card with a fixed amber background):

```css
/* Only do this if the light value is hardcoded for a reason */
.edge-case-card {
  background: #fef3c7;
  color: #92400e;
  border-color: #f59e0b;
}

body.dark-mode .edge-case-card {
  background: #78350f;
  color: #fef3c7;
  border-color: #f59e0b;
}
```

---

## 8. Transitions & Animations

Global transitions are set in `theme.css` and apply to every element:

```css
* {
  transition:
    background-color 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;
}
```

Override locally for faster micro-interactions:

```css
.btn { transition: all 0.1s ease; }        /* Fast press feel */
.card { transition: transform 0.2s, box-shadow 0.2s; }
```

Do not add custom `@keyframes` unless you need a continuous animation (spinner, progress). For enter/exit effects, prefer transform + opacity with the global transition.

---

## 9. Accessibility

Focus styles are defined in `theme.css` for key interactive elements. When adding a new interactive element, include:

```css
.your-element:focus-visible {
  outline: 3px solid var(--text);
  outline-offset: 3px;
}
```

- Never remove `outline` without replacing it with `focus-visible` styling
- Ensure all interactive elements have `cursor: pointer`
- Color contrast: `--text` on `--bg` passes WCAG AA in both themes; `--muted` is acceptable for non-essential secondary text only

---

## 10. Dos and Don'ts

| Do | Don't |
|---|---|
| Use `var(--border)` for all border colors | Hardcode `border: 2px solid #000` |
| Use `font-family: inherit` on all inputs | Set a different font on form controls |
| Use offset `box-shadow: 3px 3px 0 var(--border)` for interactive elements | Use `border-radius > 4px` on cards or buttons |
| Use the shared `showToast()` for feedback | Build a one-off notification inside a tool |
| Declare semantic colors in `:root` + `body.dark-mode` per tool | Put semantic colors in `theme.css` |
| Keep tool CSS self-contained in the tool's folder | Import from another tool's CSS |
| Use `box-sizing: border-box` on all inputs | Let inputs overflow their container |
| Use `.btn-danger` hover = filled danger color | Use red text as the only error indicator |
