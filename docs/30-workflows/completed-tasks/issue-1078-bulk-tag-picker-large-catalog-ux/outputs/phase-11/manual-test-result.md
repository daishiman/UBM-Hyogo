# Manual Test Result

Status: `implemented_local_evidence_captured / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
（local deterministic evidence は取得済み。staging authenticated screenshot は user-gated）

## VISUAL 宣言

| 項目 | 値 |
| --- | --- |
| タスク種別 | `VISUAL_ON_EXECUTION` |
| 視覚的理由 | BulkActionBar の tag picker に検索 / 折りたたみ / max-height / 選択中固定行 / pagination を追加し、UI と DOM を変更する。加えて contract 修正により空だった picker が tag を描画するようになる（描画結果が回帰対象）。 |
| 対象画面 | `/admin/members` の BulkActionBar |
| 影響範囲 | `apps/web` のみ（`apps/api` 非変更） |

## canonical screenshot 名一覧

`outputs/phase-11/screenshots/` 配下。`phase-11-manual-test.md` / `outputs/phase-12/implementation-guide.md` と完全一致（FB-LLM-MOD-05-001）。

| # | canonical 名 | 状態 |
| --- | --- | --- |
| S-1 | `bulk-tag-picker-large-catalog-collapsed.png` | 大規模 catalog（60 tag）初期表示・折りたたみ + max-height |
| S-2 | `bulk-tag-picker-search-filtered.png` | 検索で絞り込み（debounce 後） |
| S-3 | `bulk-tag-picker-selected-pinned.png` | 選択中 tag がリスト先頭に固定 |
| S-4 | `bulk-tag-picker-mobile-sticky.png` | モバイル幅で sticky 表示・picker max-height スクロール |

## 実施情報

- 段階: **implemented_local_evidence_captured**。
- 実 screenshot 画像は **未取得**。`outputs/phase-11/screenshots/` には実画像を置いていない。
- local deterministic evidence は focused Vitest / typecheck / lint / token grep で取得済み。
- screenshot 取得は `/admin/*` の admin セッション境界のため **staging 認証必須・user の明示承認後にのみ実行**する。
- 取得時は capture script を `try { ... } finally { browser.close(); server.close(); }` 構造にする（FB-MSO-003）。

## 証跡の主ソース（自動テスト・想定）

| 証跡 | パス | 実測結果 |
| --- | --- | --- |
| `BulkActionBar.spec.tsx` | `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | 20 tests PASS |
| `members.spec.ts`（新規） | `apps/web/src/features/admin/api/__tests__/members.spec.ts` | 11 tests PASS |
| broader web Vitest | repo config 経由 | 216 files / 1587 tests PASS / 1 skipped |
| typecheck | `mise exec -- pnpm typecheck` | PASS |
| lint | `mise exec -- pnpm lint` | PASS |
| token grep | `rg "bg-\\[#|text-\\[#|#[0-9a-fA-F]{3,6}" BulkActionBar.tsx` | 0 hits |

> staging screenshot のみ pending。local deterministic evidence は上表で実測済み。

## 実行記録

| TC-ID | Scenario | Expected | 結果 |
| --- | --- | --- | --- |
| TC-01 | 大規模 catalog 初期表示 | picker が tag を描画・折りたたみ + max-height | PASS（component test） |
| TC-02 | 検索絞り込み | debounce 後に該当 tag のみ表示 | PASS（TC-BAB-CAT-02） |
| TC-03 | 選択中固定行 | 選択 tag が先頭固定（DOM 順含む） | PASS（TC-BAB-CAT-04） |
| TC-04 | モバイル sticky | sticky + picker max-height スクロール | pending_user_approval（staging visual） |
| TC-05 | pagination 全件取得 | `fetchAllTagMaster` が cap まで全件取得・cap で打ち切り | PASS（TC-API-TM-07/08） |

## 実画像が user-gated 未取得である理由

`/admin/members` は admin セッション境界の内側にあり、実 screenshot 取得には staging への admin ログインが必要。認証を伴う runtime 操作は CONST_002 に従い user の明示承認後にのみ実行するため、local deterministic evidence で Gate-B を通し、staging visual は Gate-C の user-gated evidence として残す。
