# Phase 9: 品質保証

`[実装区分: 実装仕様書]` / `implementation_mode: new` / `taskType: implementation` / `visualEvidence: NON_VISUAL`

> **automation-30 改善後の補正**: 本 Phase 作成時点ではゲート定義のみだったが、今回の改善で focused Vitest・typecheck・lint・token gate・撤去 grep を実走済み。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1094-identity-conflicts-optimistic-aria-live-announcement` |
| issue | #1094（FU-AIDC-008・CLOSED） |
| phase | 9（品質保証） |
| 実施ゲート | typecheck / lint / focused Vitest（2 spec）/ verify-design-tokens / legacy hook grep / 撤去要素残存 grep |
| N/A ゲート | line budget / mirror parity / ファイル削除判定（stub 不要） |

## 目的

aria-live アナウンス最適化の実装後に、typecheck / lint / focused Vitest / design-token gate（`verify-design-tokens`）/ legacy hook gate / **撤去要素（`optimisticStatusRef` / focus 参照 / row-local status node）の残存 grep** を一括判定し、すべて green であることを確認する。特に変更が **sr-only live region のみ**で構成され、HEX 直書き / inline `style` を一切導入しないこと、および撤去対象が DOM / ソースから完全に消えていることを PASS 基準として明記する。

## 実行タスク

### 9.1 品質ゲート方針

本タスクは **新規 2 file（`IdentityConflictAnnouncer.tsx` / `identityConflictAnnouncements.ts`）+ 既存 3 file 編集（`IdentityConflictRow.tsx` / `page.tsx` / `IdentityConflictRow.spec.tsx`）+ 新規 test 1 file（`IdentityConflictAnnouncer.spec.tsx`）** のタスク。mirror 生成物・削除対象ファイルは持たない。したがって line budget / mirror parity / ファイル削除判定は N/A とし、stub の作成も不要。

| 一般ゲート | 本タスクでの扱い |
| --- | --- |
| line budget（生成行数上限） | **N/A** — 新規 component / module は小規模（sr-only region + pure map）。生成物バジェット対象外 |
| mirror parity（生成物の左右一致） | **N/A** — mirror 生成物を持たないタスク |
| ファイル削除判定（stub 要否） | **N/A** — 既存 file の編集と新規 file 追加のみ。file 削除なし、stub 不要 |

### 9.2 品質ゲート一括判定セット

| # | ゲート | コマンド | 期待結果 |
| --- | --- | --- | --- |
| 1 | 型チェック | `mise exec -- pnpm typecheck` | green（型エラー 0。`IdentityConflictAction` union / `AnnounceFn` / `messages: {id;text}[]` / `Record<IdentityConflictAction, string>` の整合含む） |
| 2 | lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | green（違反 0。残れば `lint --fix` → 手修正） |
| 3 | focused Vitest（row） | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 全ケース PASS（TC-ROW-01〜06: announce 1 回 / 非 focus-steal / 連続非競合 / rollback 非アナウンス / rollback 再アナウンス可 / 除去確定 null） |
| 4 | focused Vitest（announcer） | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx` | 全ケース PASS（TC-ANN-01〜06: 単一 region / append-children / TTL 除去 / `announcementFor` 単一導出 / context fallback no-op / unmount timer clear） |
| 5 | OKLch token gate | `verify-design-tokens`（CI gate / task-18） | live region が sr-only のみで HEX 直書き・`bg-[#xxx]` / `text-[#xxx]`・inline `style={{}}` ゼロ → PASS |
| 6 | legacy hook 未参照 grep | `grep -rn "lib/useAdminMutation" apps/web/src/components/admin/` | **0 件**（不変条件 #10・AC-8） |
| 7 | 撤去要素残存 grep（`optimisticStatusRef`） | `grep -rn "optimisticStatusRef" apps/web/src` | **0 件**（focus stealing 撤去の確認・AC-2） |
| 8 | 撤去要素残存 grep（row-local status / focus） | `grep -rn "\.focus()" apps/web/src/components/admin/IdentityConflictRow.tsx` | **0 件**（row 内の focus 奪取が完全撤去されている・AC-2） |

> ゲート 1・2・5・6 は AC-7 / AC-8 に直結。ゲート 3・4 は AC-6（focused Vitest 追加 PASS）。ゲート 7・8 は撤去（focus stealing / status node）の構造的確認で AC-2 の機械的担保。

### 9.3 ゲート詳細

#### ゲート 4: focused Vitest（announcer）— jsdom 制約と検証可能範囲

- **検証できる**: live region が DOM に 1 つだけ存在すること（`getAllByRole("status")` が単一）/ `announce()` 連続呼び出しで child node が順番に追加されること（append-children）/ fake timer（`vi.advanceTimersByTime(ANNOUNCE_TTL_MS)`）で child が除去されること / `announcementFor("merge" \| "dismiss")` が map から正しい文字列を返すこと / provider 外で `useIdentityConflictAnnounce()` が no-op を返すこと / unmount で timer が clear されること。
- **検証できない（jsdom 制約 → 手動 SR 検証へ委譲）**: 実 screen reader が aria-live region を「1 回ずつ」読み上げること自体は jsdom では発火しない。これは Phase 11 の手動 SR 検証（VoiceOver / NVDA）で確認する（実装後・user-gated）。

#### ゲート 5: OKLch トークン gate（`verify-design-tokens`）— sr-only 非抵触の PASS 基準

- 追加する markup は **sr-only live region のみ**: `<div role="status" aria-live="polite" className="sr-only">…</div>`。`sr-only` は既存 utility で色 token を持たない。
- row / page の既存色 markup（border / bg / text）は変更しない。rollback inline error（`role="alert"`）も既存 `text-[var(--ubm-color-danger)]` 等を流用し新規トークンを増やさない。
- **PASS 基準**: diff に HEX 直書き（`#xxxxxx`）/ `bg-[#...]` / `text-[#...]` / inline `style={{}}` が一切存在しないこと。`sr-only` / `role` / `aria-*` は色 token gate の対象外。

#### ゲート 6: legacy hook 未参照 grep

```bash
grep -rn "lib/useAdminMutation" apps/web/src/components/admin/
# 期待: 出力なし（0 件）
```

- import は `import { useAdminMutation } from "@/features/admin/hooks";`（features 経由）のまま。新規 announce context は独自 context であり legacy `@/lib/useAdminMutation` に依存しない（不変条件 #10・AC-8）。

#### ゲート 7・8: 撤去要素残存 grep（focus stealing 完全撤去の機械的確認）

```bash
grep -rn "optimisticStatusRef" apps/web/src
# 期待: 出力なし（0 件）— ref 宣言・代入・参照がすべて消えている

grep -rn "\.focus()" apps/web/src/components/admin/IdentityConflictRow.tsx
# 期待: 出力なし（0 件）— row 内の focus 奪取が撤去されている
```

- `optimisticStatusRef`（L35）/ status node（L136-148）撤去後に参照が残ると AC-2（非 focus-steal）が機械的に破れるため、grep 0 件を gate とする。

### 9.4 vitest 追加ケースの green 要件（Phase 4/6 整合）

| spec | ケース ID | 期待 | 区分 |
| --- | --- | --- | --- |
| `IdentityConflictAnnouncer.spec.tsx` | TC-ANN-01 | live region が DOM に 1 つだけ存在（`getAllByRole("status").length === 1`） | 新規 |
| 同上 | TC-ANN-02 | `announce()` を 2 回連続呼ぶと child node が 2 つ順番に追加される（上書きされない） | 新規 |
| 同上 | TC-ANN-03 | `vi.advanceTimersByTime(ANNOUNCE_TTL_MS)` 後に child が除去される | 新規 |
| 同上 | TC-ANN-04 | `announcementFor("merge")` / `announcementFor("dismiss")` が map の正しい文言を返す | 新規 |
| 同上 | TC-ANN-05 | provider 外で `useIdentityConflictAnnounce()()` を呼んでも throw せず no-op | 新規 |
| 同上 | TC-ANN-06 | unmount で全 timer が clear され、以後 child 除去 callback が実行されない（leak なし） | 新規 |
| `IdentityConflictRow.spec.tsx` | TC-ROW-01 | merge optimistic 確定で `announce` が **1 回だけ**呼ばれ、row が `return null`（DOM から消える） | 既存 focus-steal ケースの更新 |
| 同上 | TC-ROW-02 | optimistic 確定後 `document.activeElement` が status node に**ならない**（非 focus-steal） | 既存 assertion（342-344）の更新 |
| 同上 | TC-ROW-03 | 複数 row を連続 dismiss/merge しても各 `announce` が欠落せず呼ばれる（`renderWithAnnouncer` で region 共有） | 新規 |
| 同上 | TC-ROW-04 | rollback（trigger reject）時に `announce` が呼ばれず（除去未確定）、inline error（`role="alert"`）が surface | 新規 |
| 同上 | TC-ROW-05 | rollback 後に再試行成功で `hasAnnouncedRef` reset により再 announce できる | 新規 |
| 同上 | TC-ROW-06 | dismiss optimistic 確定でも merge と同経路で `announce(announcementFor("dismiss"))` が 1 回呼ばれる | 新規 |

> `renderWithAnnouncer` helper を導入し、row spec が単一 region（`IdentityConflictAnnouncer`）配下で render されるようにする。これにより連続処理（TC-ROW-03）が同一 region を共有する実構成を再現する。

### 9.5 失敗時の自動修復方針

| ゲート | 失敗時対応 |
| --- | --- |
| typecheck | `IdentityConflictAction` union / `Record<IdentityConflictAction, string>` の網羅 / `AnnounceFn` 型 / context の `\| null` fallback の整合を確認。明白な型不整合を最小差分で修正 |
| lint | `lint --fix` を試行 → 残る違反のみ手修正。`useEffect` 依存配列（`announce` を含む）の exhaustive-deps を満たす |
| vitest（row） | announce 未呼び出し → `hasAnnouncedRef` ガードの条件 / `useEffect` 依存漏れ。非 focus-steal fail → `optimisticStatusRef` / `.focus()` 残存（grep ゲート 7・8 と連動） |
| vitest（announcer） | append-children 上書き → key / id 採番が固定値で衝突 / TTL 除去漏れ → timer の id 紐付け確認。fake timer 未使用なら `vi.useFakeTimers()` を導入 |
| token gate | diff の HEX / `bg-[#...]` / inline style を sr-only / 既存 `var(--ubm-color-*)` へ置換 |
| 撤去 grep（7・8） | 残存した `optimisticStatusRef` 宣言・代入・`.focus()` を削除。status node 置換ブロックの取り残しを確認 |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 本WF SSOT | `docs/30-workflows/completed-tasks/issue-1094-identity-conflicts-optimistic-aria-live-announcement/index.md` | AC-1〜AC-8 / 主要シグネチャ / 撤去対象（`optimisticStatusRef` 35 / status node 136-148 / focus 81-84） |
| 本WF Phase 8 | `docs/30-workflows/completed-tasks/issue-1094-identity-conflicts-optimistic-aria-live-announcement/outputs/phase-8/phase-8.md` | 撤去要素 / 文言単一導出 / sr-only のみの変更範囲 |
| design tokens 正本 | `docs/00-getting-started-manual/specs/design-tokens.md` | HEX 直書き禁止根拠（不変条件 #2） |
| 兄弟テンプレート | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-9/phase-9.md` | 一括判定セット書式・N/A ゲート判定・token gate PASS 基準 |

## 成果物

- 品質ゲート一括判定セット 8 件（§9.2）と N/A ゲート判定（§9.1）。
- `verify-design-tokens` の sr-only 非抵触 PASS 基準（§9.3 ゲート 5）。
- 撤去要素残存 grep gate（`optimisticStatusRef` / `.focus()` 0 件・§9.3 ゲート 7・8）。
- vitest 追加ケース（TC-ANN-01〜06 / TC-ROW-01〜06）の green 要件（§9.4）/ 失敗時自動修復方針（§9.5）。

## 統合テスト連携

- ゲート 3・4（vitest）と Phase 7 coverage が同一 focused spec を共有し、§9.4 のケースが Phase 7 の全分岐（announce 経路 / append-children / TTL / rollback）を踏む。
- ゲート 7・8（撤去 grep）は Phase 11 の手動 SR 検証「focus が移動しない」を機械側から先取り担保する。

## 完了条件（Phase 9）

| 項目 | 基準 |
| --- | --- |
| 一括判定セット | typecheck / lint / vitest×2 / token gate / legacy hook grep / 撤去 grep×2 の 8 ゲートが all-green |
| token gate 非抵触 | live region が sr-only のみで HEX 直書き・`bg-[#xxx]` / `text-[#xxx]` / inline `style={{}}` が存在せず `verify-design-tokens` PASS |
| legacy hook | `lib/useAdminMutation` 参照 0 件（AC-8） |
| 撤去確認 | `optimisticStatusRef` grep 0 件 / `IdentityConflictRow.tsx` 内 `.focus()` 0 件（AC-2 機械担保） |
| N/A 明示 | line budget / mirror parity / ファイル削除判定が N/A、stub 不要と明記 |
| スコープ注記 | 本サイクルは spec 作成のみ・ゲート実走は実装後 user-gated である旨が冒頭に明記されている |
