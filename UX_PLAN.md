# psMainReact UI / UX Plan

## 1. Goals
Provide a fast, mobile-first interface to list and edit existing Inspection Results (read/update only) with low latency, no flicker, and predictable keyboard/touch interactions.

## 2. Breakpoints
- Mobile: <=480px (single column; stacked tabs under heading). 
- Small Tablet: 481–768px (two-column list/detail optional via navigation). 
- Desktop: >768px (side-by-side list + detail when width allows ~1200px, else routed).

## 3. Navigation & Page Structure
- Top-level: "Inspections" route showing list; selecting a row pushes `?id=<inspectionResultId>` and renders detail panel below list on desktop or routes to detail on mobile.
- Use URL param for detail id to allow deep-linking and browser back navigation.

## 4. List View
- Columns (mobile priority): CaseNumber, ContainerNumber, Operator (short), Stage, Flags (icons), Costs (est/final). 
- Additional columns (desktop): Port, Vessel, ResultType, IncidentType.
- Row height: ~44px touch target.
- Sticky filter bar containing quick filters: Case, Container, Operator (lookahead), Stage dropdown.
- Virtualization Strategy: Implement windowing (e.g. react-window) if row count > 500; degrade gracefully with native scrolling otherwise.
- Selection Style: Highlight background + left border accent color (accessible contrast AA).

## 5. Detail View
Sections (collapsible on mobile):
1. Header: ID, Stage badge, Finalized/Rework/Rejection flags (chip components).
2. Meta Grid: Operator(s), Port, Vessel, Journey, Seals.
3. Financial: Estimated vs Final costs + descriptions.
4. Dangerous Goods: DGD flags, UN content summary counts.
5. Remarks: Inspection / Rework / DGD remarks.
6. Tabs: Contents | Files | Activities.

### Tab Bar
- Mobile: Horizontal scroll with inertial; active tab bold + underline.
- Desktop: Inline segment controls.
- Keep content height stable using minHeight + skeleton placeholders during fetch.

### Contents Tab
- Table with compact columns, responsive: collapse numeric columns into two-line cell on mobile.
- Row actions (future): Edit / Delete with icon buttons (touch 40px area).

### Files Tab
- Show filename + preview/medium links. Future: Thumbnail grid on mobile (two columns).
- Upload Flow: Use init-upload endpoint; show progress bar; optimistic add to list
- Error states: Inline toast (non-blocking) retaining previous list items.

### Activities Tab
- Editable inline rows; new row form at bottom.
- Date picker (mobile-friendly) using native input fallback.

## 6. Lookahead Combobox UX
- Minimum 1 char before firing if dataset large; currently fires with any char—adjust after performance review.
- Preserve previous results while loading spinner appears top-right.
- Keyboard: Up/Down to navigate, Enter to select, Esc to close list (to be implemented).
- Accessibility: `role="combobox"`, `aria-expanded`, `aria-controls` pointing to list; each option `role="option"` with `aria-selected` state.

## 7. State & Data Strategy
- Fetch layering: List fetch separate from detail; detail stale-while-revalidate on tab change.
- Caching: In-memory LRU for last 10 lookup queries per endpoint (`Map` keyed by endpoint+query) for instant re-select.
- Error Boundary: Wrap detail area to show retriable error without dropping entire page.

## 8. Performance & Anti-Flicker
- Debounce lookups (250ms) + abort previous requests.
- Skeleton placeholders for tabs on first load only—subsequent tab switches reuse cached data.
- Avoid layout shift: pre-allocate table header + min-height container.
- Use React.memo for row components once virtualization added.

## 9. PATCH Update Flow
- Operator change: Add "Save" button near combobox; on save send PATCH with `operatorIdOperator` mapping.
- Dirty tracking: Keep a `dirtyFields` set; disable save unless dirty.
- Optimistic UI: Update local detail immediately; rollback on failure.

## 10. Accessibility & Internationalization
- Provide text alternatives for flag icons.
- Date and number formatting via Intl APIs (future). 
- All interactive controls >=44px touch size.

## 11. Future Enhancements
- Offline caching of list (IndexedDB) for last viewed inspections.
- Bulk selection for exporting list subset.
- WebSocket or SSE for real-time stage updates.
- Dark mode via CSS variables.
- SAS token generation for secure file uploads + progress bars.
- Drag & drop multiple file upload merging preview generation step.

## 12. Implementation Checklist
Short-term:
- [ ] Add responsive CSS breakpoints & container layout.
- [ ] Add Save operator PATCH flow.
- [ ] Introduce skeleton loaders.
- [ ] Add virtualization if list > 500.
- [ ] Implement keyboard navigation in combobox.
- [ ] Add accessible roles/aria props.

Later:
- [ ] Optimistic Activities & Contents edits.
- [ ] File thumbnail grid + progress.
- [ ] LRU caching layer for lookups.
- [ ] Error boundary component.

## 13. Risks / Mitigations
- Large lists causing jank: mitigate with virtualization + memoization.
- Slow network on lookups: display spinner without clearing items.
- Race conditions on PATCH: queue updates; disable save while pending.
- Blob upload security: implement SAS issuance before enabling direct upload.

## 14. Design Tokens (suggested)
- Spacing: 4 8 12 16 24
- Font sizes: 12 14 16 18 24
- Colors: primary #0062b8, accent #ffb400, danger #d64545, bg #f9fafb
- Border radius: 4px standard

---
This document guides incremental UI work; update checklist as tasks complete.
