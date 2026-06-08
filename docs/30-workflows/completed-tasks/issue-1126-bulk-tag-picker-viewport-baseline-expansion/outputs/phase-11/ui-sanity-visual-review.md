# UI Sanity Visual Review

## Boundary

The UI sanity review is pending authenticated staging capture. The Playwright spec is implemented to capture the BulkActionBar tag picker in read-only assign/unassign modes across mobile, tablet, and wide viewports.

## Read-only Guard

The spec selects member checkboxes and toggles picker mode only. It does not press the bulk apply action and asserts `bulk-tag-result` remains absent.

