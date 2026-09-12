# Major People Power Hub redesign

## Goal
Transform every existing screen into a cohesive, task-led HR product while preserving all routes, authentication, API contracts, requests, and business behavior.

## Direction
- Use a calm civic-blue and mint palette with warm semantic accents.
- Use modern professional typography with clear, plain-language hierarchy.
- Favor editorial workspace compositions over repetitive dashboard cards.
- Make urgent work, primary actions, and next steps immediately understandable.

## Work
1. Audit every page, component, API connection, and user flow; map which logic must remain untouched.
2. Build the shared visual system: typography, spacing, controls, loading/error/empty states, navigation, dialogs, and responsive behavior.
3. Redesign authentication and the signed-in application shell.
4. Redesign HR Insights, attrition, headcount, performance, employees, employee profiles, scenarios, triggers, and chat surfaces without changing their data sources.
5. Verify keyboard access, mobile/tablet/desktop layouts, authentication, navigation, search, filters, forms, panels, and real API states.

## Technical details
- Preserve service modules, request payloads, endpoint URLs, auth logic, and route paths.
- Refactor presentation components only where possible; reuse existing state and event handlers.
- Add reusable accessible states and controls rather than duplicating page-specific styling.
- Validate each major flow in the running app and correct current hydration or API presentation issues encountered during the redesign.

## Success criteria
- Every page has one obvious purpose and primary action.
- Complex backend data is explained in plain language and progressively disclosed.
- Existing functionality and API integration continue working.
- All primary workflows are usable by keyboard and adapt deliberately to mobile.
