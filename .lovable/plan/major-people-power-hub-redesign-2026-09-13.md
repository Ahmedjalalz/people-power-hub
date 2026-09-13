# Major People Power Hub redesign

## Goal
Transform every existing screen into a cohesive, task-led HR product while preserving all routes, authentication, API contracts, requests, and business behavior.

## Direction
- Build from the selected modern geometric direction: civic blue, mint, off-white, charcoal, and warm semantic accents.
- Use modern professional typography with clear, plain-language hierarchy and geometric brand details.
- Favor editorial workspace compositions over repetitive dashboard cards, while retaining the selected sign-in split composition.
- Make urgent work, primary actions, and next steps immediately understandable.

## Work
1. Preserve the audited auth guard, cached-session fallback, server wake-up behavior, services, proxy endpoints, request payloads, and response normalization.
2. Build the shared visual system: typography, spacing, controls, loading/error/empty states, navigation, dialogs, and responsive behavior.
3. Redesign sign-in, sign-up, password recovery/reset, email confirmation, and the signed-in application shell.
4. Recompose HR Insights around attention and next actions; redesign attrition, headcount, and performance detail experiences without changing their queries.
5. Redesign the employees directory and employee profile around search, comparison, risk interpretation, and clear profile sections.
6. Redesign scenario simulation, decision triggers, the dedicated assistant, and the floating assistant while preserving their existing handlers and API calls.
7. Verify keyboard access, mobile/tablet/desktop layouts, authentication, navigation, search, filters, forms, panels, and real API states.

## Technical details
- Preserve service modules, request payloads, endpoint URLs, auth logic, and route paths.
- Refactor presentation components only where possible; reuse existing state and event handlers.
- Add reusable accessible navigation, status, search, data-summary, and feedback patterns rather than duplicating page-specific styling.
- Preserve transient backend-failure behavior: authorization failures end the session, while temporary 502/504 failures keep the cached user and show useful retry guidance.
- Add visible keyboard focus, current-page semantics, 44px touch targets, reduced-motion handling, and deliberate mobile alternatives for dense layouts.
- Validate each major flow in the running app and correct the current public-auth hydration mismatch without changing authentication behavior.

## Success criteria
- Every page has one obvious purpose and primary action.
- Complex backend data is explained in plain language and progressively disclosed.
- Existing functionality and API integration continue working.
- All primary workflows are usable by keyboard and adapt deliberately to mobile.
