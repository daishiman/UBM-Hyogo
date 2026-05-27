# Phase 11: 手動テスト結果 — issue-924 style-src-attr 撤去

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=VISUAL]`

> **Status**: local_static_pass_browser_pending — local implementation / typecheck / focused Vitest / grep gate は完了。browser visual regression は user-gated。
>
> **visual_evidence**: VISUAL — 19 routes baseline 退行確認が必要。Avatar / Icon / ZoneDistribution の動的バリエーションは新規 visual baseline 追加が必要となる可能性あり。

---

## 1. 検証 routes (19)

| 層 | route | baseline 状態 |
|----|-------|--------------|
| 公開 | `/` | pending |
| 公開 | `/(public)/members` | pending |
| 公開 | `/(public)/members/[id]` | pending |
| 公開 | `/(public)/register` | pending |
| 公開 | `/privacy` | pending |
| 公開 | `/terms` | pending |
| 会員 | `/login` | pending |
| 会員 | `/profile` | pending |
| 管理 | `/(admin)/admin` | pending |
| 管理 | `/(admin)/admin/members` | pending |
| 管理 | `/(admin)/admin/tags` | pending |
| 管理 | `/(admin)/admin/meetings` | pending |
| 管理 | `/(admin)/admin/schema` | pending |
| 管理 | `/(admin)/admin/requests` | pending |
| 管理 | `/(admin)/admin/identity-conflicts` | pending |
| 管理 | `/(admin)/admin/audit` | pending |
| 共通 | `error.tsx` | pending |
| 共通 | `not-found.tsx` | pending |
| 共通 | `loading.tsx` | pending |

## 2. evidence 一覧

| 区分 | path | 状態 |
|------|------|------|
| focused vitest log | `outputs/phase-11/evidence/vitest-focused.log` | present |
| Playwright security-headers smoke log | `outputs/phase-11/evidence/playwright-security-headers.log` | pending_user_approval |
| grep gate output | `outputs/phase-11/evidence/verify-no-inline-style.txt` | present |
| visual diff report | `outputs/phase-11/evidence/visual-diff-report.md` | pending_user_approval |
| visual sanity screenshot | `outputs/phase-11/screenshots/style-src-attr-retirement-static-sanity.png` | present |
| 19-route visual screenshot diff | `outputs/phase-11/evidence/diff-*.png` | pending_user_approval |
| typecheck log | `outputs/phase-11/evidence/typecheck.log` | present |
| canonical paths manifest | `outputs/phase-11/canonical-paths.json` | present |

## 3. 動的ケース個別検証

### 3.1 Avatar (12 hue buckets)

- 12 種の seed で `data-hue="0..11"` 出力を確認
- 既存 baseline からの hue 偏移が UX 許容範囲

### 3.2 Icon (5 size buckets)

- 16 / 20 / 24 / 32 / 40 px それぞれで描画確認
- 非標準 size を渡している既存呼び出し箇所が無いことを grep で確認

### 3.3 ZoneDistribution (SVG)

- 各 zone 比率の SVG `<rect>` width 計算が正しく累積される
- pixel-tolerance 内で linear-gradient と等価

## 4. Review-cycle correction

30 種思考法 + エレガント検証で `AdminTable` と `GoogleBrandIcon` に残存していた `style={...}` を検出し、同サイクルで削除した。grep gate は `style={{` 限定から `style={` 全般へ拡張済み。`bash scripts/verify-no-inline-style.sh` は修正後 PASS。

## 5. Screenshot note

`pnpm exec next dev --webpack --hostname 127.0.0.1 --port 3300` は起動後 `/instrumentation` compile で HTML 応答が 60 秒返らなかったため、実 route screenshot は user-gated に維持した。代替の local static visual sanity として、`tokens.css` + `globals.css` と実 DOM shape（Avatar hue / Icon size / ZoneDistribution SVG / AdminTable）を Playwright Chromium で描画し、`outputs/phase-11/screenshots/style-src-attr-retirement-static-sanity.png` に保存した。
