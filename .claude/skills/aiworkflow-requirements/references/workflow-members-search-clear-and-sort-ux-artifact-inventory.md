# workflow-members-search-clear-and-sort-ux Artifact Inventory

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/members-search-clear-and-sort-ux/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| purpose | 公開 `/members` の検索 input native clear と独自 clear の二重表示を解消し、sort を `recent / oldest / name / name_desc` の4値へ拡張する |
| implementation | `Search.tsx` に `ui-search__input` class、`globals.css` に native cancel抑止、web URL schema / public filter UI / API parser / API repository ORDER BY / shared viewmodel zod を4値へ同期 |
| evidence | focused Vitest web 3 files / 27 tests PASS、api/use-case/shared 3 files / 48 tests PASS、D1 repository 1 file / 6 tests PASS、typecheck PASS、lint PASS、`pnpm verify:tokens` PASS、local Chromium filter UI screenshots captured |
| invariant | 新規 endpoint / D1 schema / Google Form schema なし。`fullName` sort は Unicode codepoint順で、真の五十音順は OOS-1 |
| user gate | staging verification、commit、push、PR、OOS-1 Issue creation |

## Lessons

- **L-MSCAS-001**: `implementation` workflow が具体的な apps/packages targets を持つ場合、`spec_created/no impl yet` で close-out しない。同一サイクルで最小実装、focused tests、Phase 12 strict outputs、aiworkflow sync まで完了させる。
- **L-MSCAS-002**: ページング付き public list の sort 追加は client-side reverse ではなく API `ORDER BY` を拡張する。web URL parser / API parser / repository / shared response zod の4層を同時に同期する。
- **L-MSCAS-003**: `input type="search"` の native cancel と custom clear が競合する場合、IME safe / aria label を持つ custom clear を残し、class-scoped CSSで native cancelだけを抑止する。
