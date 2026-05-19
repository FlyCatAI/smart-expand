# ADR-0001: Frontend Framework

## Status

Accepted

## Context

The product anchor is `docs/prd/requirements/hui-zhan-ye-frontend-v1.0.md`.
PRD section 1.3 defines the client as mobile H5, embedded in WeChat, adapted for 375px to 428px screens, and reachable by URL without depending on a native app.

This decision covers only the framework and the minimum runnable shell for GRA-44. It does not add business pages, backend integration, real interfaces, appid, business domains, or subscription template IDs.

## Decision

Choose **uni-app with Vue 3 and Vite**.

Use **pnpm** as the package manager and commit `pnpm-lock.yaml`. Dependency versions in `package.json` are fixed to exact patch builds; `^` and `~` ranges are not allowed.

The empty shell uses uni-app's standard split:

- `src/manifest.json` for app metadata, with `appid` kept as `__PLACEHOLDER__`.
- `src/pages.json` for the page registry and the three TabBar entries required by PRD section 2.1.
- `vite.config.ts` for the uni-app Vite plugin.

TODO for the first styling handoff: add `iconPath` and `selectedIconPath` assets to the three TabBar items before any WeChat mini-program build target is enabled. The current H5 shell intentionally keeps text-only TabBar entries.

## Candidate Comparison

| Candidate | Match to PRD 1.3 H5 + WeChat embedded + URL access | Assessment |
| --- | --- | --- |
| uni-app | Strong. H5 is a first-class build target and can still preserve future mini-program optionality without changing the page model. | Best fit for the current H5 shell and later WeChat-facing constraints. |
| WeChat native mini program | Weak. It targets the mini-program runtime rather than direct URL H5 access, so it does not satisfy "through URL directly" as the primary client. | Rejected for this phase. |
| Taro | Medium. It can target H5 and mini-programs, but it adds React/Taro conventions that are unnecessary for the current PRD and gives less direct alignment with uni-app-style mobile shell configuration. | Rejected for this phase. |

## Impact Assessment

### PRD 2.1 TabBar

uni-app keeps TabBar routing in `pages.json`, matching the required three entries: `pages/index/index`, `pages/notifications/notifications`, and `pages/profile/profile`. The current shell adds only empty route stubs so later page issues can implement behavior and styling separately.

### PRD 3 Merchant List Pagination

uni-app's page lifecycle and scroll hooks are enough for first-load, pull-to-refresh, and load-more behavior. Later implementation must keep list pages paginated at 20 rows per page and control update payload size.

### PRD 4 Merchant Detail Multi-Section Page

Vue single-file components allow the detail page to be split into section components when that issue starts. This ADR does not create those business sections.

### PRD 3.6.3 Annual Summary Tab Switch

The annual summary can be implemented as component state inside the history-performance page. The two mutually exclusive tabs can update only the summary payload without reloading the full monthly list.

## Consequences

- The first runnable target is H5 with `pnpm dev`.
- WeChat native appid, request domains, socket domains, and template IDs stay out of code until a human provides them.
- Empty route stubs are committed only to make the TabBar shell boot; they contain no business UI or API calls.
- Styling remains outside this task and should be handled by HZYMiniAppStyle when real pages begin.
- Page-level follow-up issues must bring their own test plan or test scaffold; this shell only proves the framework can boot.

## Reopen Trigger

Reopen this decision only if the product owner changes PRD section 1.3 so the primary delivery target is no longer URL-accessible mobile H5, or if a mandatory WeChat-native capability cannot be exposed from the H5-in-WeChat runtime.
