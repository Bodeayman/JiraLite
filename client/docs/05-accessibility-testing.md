# Accessibility Choices + Testing

Accessibility was prioritized throughout development, ensuring WCAG 2.1 Level AA compliance through keyboard navigation, ARIA attributes, color contrast validation, and comprehensive testing.

**Keyboard Navigation:** Full keyboard operation is implemented across all interactive elements. In `Board.jsx`, drag-and-drop uses `KeyboardSensor` from `@dnd-kit`, enabling Space to pick up items, Arrow keys to move, and Space to drop. Modal dialogs trap focus: `ConfirmDialog.jsx` implements focus trapping, cycling through focusable elements with Tab and Shift+Tab. The `CardDetailModal.jsx` closes on ESC key (handled by React's built-in dialog behavior). List menus in `ListColumn.jsx` support arrow key navigation with ESC to close.

**ARIA Labels and Roles:** All interactive elements have proper ARIA attributes. Buttons without visible text have `aria-label` attributes (e.g., menu toggle in `ListColumn.jsx`). Modal dialogs use `role="dialog"` and `aria-modal="true"` (verified in `ConfirmDialog.jsx`, `InputDialog.jsx`). The virtualized list in `VirtualizedCardList.jsx` has `role="list"` with descriptive `aria-label`  and `aria-describedby` pointing to screen reader instructions. Menu toggles use `aria-expanded` and `aria-haspopup` to indicate state.

**Color Contrast:** Initial testing with WebAIM Contrast Checker revealed failures. Text using `text-slate-400` (#94a3b8) on white had contrast ratio ~2.8:1, failing AA (requires 4.5:1). Fixed by updating to `text-slate-500` (#64748b) achieving 4.5:1 ratio. Changes applied in `ListColumn.jsx` (menu toggle button) and `CardDetailModal.jsx` (labels and close button). All interactive elements now meet WCAG AA standards.

**Testing Tools:** Automated testing uses Playwright with axe-core integration in `e2e/a11y.spec.js`. The test suite validates ARIA attributes, keyboard navigation, and color contrast. Manual testing was performed with NVDA screen reader and keyboard-only navigation. The axe-core browser extension was used during development to catch violations early.

**Focus Management:** When modals open, focus moves to the first focusable element (`ConfirmDialog.jsx`). When closing, focus returns to the trigger element (`ListColumn.jsx`). This prevents focus from being lost in the page content, crucial for screen reader users.

**Validation Process:** Before deployment, we ran the full accessibility test suite: `npx playwright test e2e/a11y.spec.js`. All automated tests pass. Manual keyboard testing confirmed all operations (add card, edit card, move cards) work without mouse. Screen reader testing verified all content is announced correctly. The final audit report shows zero critical or serious violations, achieving WCAG 2.1 Level AA compliance.

