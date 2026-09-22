# HR Insights tabbed overview

## Goal
Replace the overview card-to-panel pattern with a clearer HR Insights workspace. Attrition, Headcount, and Performance will be selectable from tabs at the top, and each topic will show its useful summary, evidence, and next steps directly on the page.

## Changes
- Rename “Overview” to “HR Insights” across navigation and page headings.
- Add accessible top-level tabs for Attrition, Headcount, and Performance, with a concise plain-language summary for the selected topic.
- Reuse the existing live data queries and existing detailed content, but present the selected topic inline instead of opening the first layer of panels.
- Keep deeper actions only where they are useful, such as opening a specific employee or focused list, avoiding repeated card-to-card drill-down.
- Improve information hierarchy with a clear status summary, a small set of comparable measures, readable visuals, and an obvious next action for each topic.
- Preserve authentication, routes, backend requests, data contracts, and all existing specialist detail panels.
- Correct the current sign-in hydration mismatch while preserving the existing sign-in flow.

## Validation
- Check all three tabs on desktop and mobile.
- Confirm live/loading/error states remain understandable.
- Verify employee links and deeper panels still work.
- Confirm keyboard tab selection, focus visibility, dark mode, and no runtime errors.
