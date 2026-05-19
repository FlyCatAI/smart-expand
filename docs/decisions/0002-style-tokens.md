# ADR-0002: Style Token Delivery

## Status

Accepted

## Context

GRA-49 adds the style foundation for the uni-app shell created by ADR-0001. The source of truth is `docs/prd/prototypes/慧展业_我的中心_20260427.html`, specifically its `tailwind.config` block and `:root` motion block.

The current repository shell is rooted at `src/`, not `apps/miniprogram/src/`. This ADR therefore places the files under `src/styles/` and wires them through `src/App.vue`.

## Decision

Choose **Option B: CSS Custom Properties**.

Create:

- `src/styles/tokens.scss` for CSS custom properties.
- `src/styles/base.scss` for reset, typography utilities, and global `page` / `body` baseline.

Import `src/styles/base.scss` once from `src/App.vue` so pages and components can use runtime tokens such as `var(--color-primary)` without per-file imports. Page-level SCSS can still `@use "@/styles/tokens.scss"` or an equivalent import when it needs direct token visibility in isolated style blocks.

## Source Mapping

Color values are copied from the prototype Tailwind config without changing hex values. The prototype uses Material-style token names: `primary`, `secondary`, `tertiary`, `surface`, `outline`, and `error`.

For issue terminology:

- `primary` maps directly to `--color-primary` / `--color-primary-container`.
- neutral/background/text tokens map to the prototype `surface`, `on-surface`, and `outline` families.
- warning maps by alias to the prototype `tertiary` family, without introducing new color values.
- danger maps by alias to the prototype `error` family, without introducing new color values.
- success is intentionally not assigned a color because the specified source block does not define a success token. Later page work must add it only after a prototype source defines the value.

Font family values come from the prototype Tailwind config. Font size utilities reflect the Tailwind text classes used by the prototype, plus the explicit `text-[10px]` value. Motion values are copied from the prototype `:root` block.

Dark token slots are reserved in `tokens.scss` as `--color-dark-*` variables. This task does not implement `@media (prefers-color-scheme: dark)` or a theme switching hook.

## Alternatives

### Option A: `uni.scss` Global SCSS Variables

Rejected for this task. SCSS variables are compile-time only, so they work for static styling but do not preserve a clean path for runtime theme switching. They also require build configuration discipline to make every component see the same variables.

### Option B: CSS Custom Properties

Accepted. CSS custom properties work in the H5 target and preserve the most direct path for future runtime dark theme switching. They keep the generated CSS small because each token is emitted once, and IDE search remains straightforward because token names are plain strings.

For WeChat mini-program compatibility, these tokens are limited to ordinary custom properties and are declared on both `:root` and `page`. If a future mini-program build target exposes a platform gap, the fallback path is to generate static SCSS variables from the same source map, not to create parallel token values by hand.

### Option C: SCSS Mixin / Function

Rejected for the baseline. Mixins and functions help reduce repetitive declarations but make token usage less transparent for page authors and still do not solve runtime theme switching by themselves.

## Consequences

- The design token source is centralized in `src/styles/tokens.scss`.
- Base styles are intentionally global and minimal: reset, font family helpers, text size helpers, and the page background/text baseline only.
- No component styles, page styles, third-party UI library, business UI, API call, or real appid is added by this task.
- Future dark mode can be implemented by filling the reserved `--color-dark-*` slots and adding one theme switch mechanism.
