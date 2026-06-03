# Phase 7: カバレッジ確認

`[実装区分: 実装仕様書]` / `implementation_mode: new` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1043-identity-conflicts-row-fade-animation` |
| issue | #1043（FU-AIDC-007） |
| phase | 7（カバレッジ確認） |
| 唯一の measure 対象 | `apps/web/src/components/admin/IdentityConflictRow.tsx` |
| coverage 実行コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --coverage src/components/admin/__tests__/IdentityConflictRow.spec.tsx` |

## 目的

exiting fade animation の追加分岐（`onMerge` の exiting 発火 / timeout fallback / `onTransitionEnd` / `.catch` rollback / `useEffect` cleanup / `finalizeRemoval`）が、focused Vitest で line + branch ともに covered であることを **変更関数/ブロックに限定して実測**する。全ファイル一律の coverage 測定は行わず、本タスクで触れる分岐に集中して評価する（Feedback BEFORE-QUIT-002 / Feedback 5）。

## 実行タスク

### 7.1 coverage 対象範囲（変更ファイルに限定）

| 区分 | パス |
| --- | --- |
| 唯一の measure 対象 | `apps/web/src/components/admin/IdentityConflictRow.tsx` |

> Phase 5 で編集するのはこの 1 ファイルのみ（test / playwright は別物）。hook / page / 他 component は **対象外**とし、coverage の include を `IdentityConflictRow.tsx` に絞る。全ファイル一律指定はしない。

### 7.2 測定対象の分岐（line + branch・変更ブロックに限定）

Phase 2.1 で確定した state machine（visible / exiting / removed の 3 相）の追加分岐を明示列挙し、各分岐が covered であることを確認する。

| 区分 | 場所 | 測定対象 | covered する Phase 4/6 ケース |
| --- | --- | --- | --- |
| exiting 発火（line） | `onMerge` 先頭 `setIsExiting(true)` + `exitTimerRef.current = setTimeout(finalizeRemoval, ...)` | line | TC（exiting 開始） |
| trigger resolve 経路（branch） | `mergeMutation.trigger(...)` の成功側（`.catch` を通らない） | branch（resolve） | TC（success-stays-removed） |
| trigger reject → rollback（line + branch） | `.catch` 内 `clearTimeout` + `setIsExiting(false)` | line + branch（reject） | TC（rollback で exiting キャンセル） |
| `onTransitionEnd` → removed（line + branch） | JSX root の `onTransitionEnd={() => { if (isExiting) finalizeRemoval(); }}` の `isExiting` true 枝 | line + branch | TC（removed 遷移・transitionEnd 発火系） |
| timeout fallback → removed（line） | `setTimeout(finalizeRemoval, EXIT_ANIMATION_MS + EXIT_FALLBACK_BUFFER_MS)` の発火経路 | line | TC（reduced-motion 即時 / fallback 系） |
| `finalizeRemoval` の timer clear 分岐（branch） | `if (exitTimerRef.current !== null) { clearTimeout(...); exitTimerRef.current = null; }` の true/false 両枝 | branch | removed / rollback 両ケースで両枝到達 |
| render 相分岐（branch） | `if (optimisticMerged) return null;`（removed）/ exiting class 条件付与（`isExiting ? "opacity-0 ..." : ""`）の true/false | branch | visible（既存全ケース）/ exiting / removed |
| `useEffect` cleanup（line） | アンマウント時 `if (exitTimerRef.current !== null) clearTimeout(...)` | line | unmount 系 or fake timer 残存 clear ケース |

> branch coverage の観点では、`isExiting` の true/false 両枝・`optimisticMerged` の true/false 両枝・`trigger` の resolve/reject 両経路・`exitTimerRef.current !== null` の true/false 両枝が、いずれも 1 件以上のケースで実行されることが必須。dismiss 経路は不変のため新規分岐を持たず、既存 coverage を維持するだけでよい。

### 7.3 測定コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --coverage \
  src/components/admin/__tests__/IdentityConflictRow.spec.tsx
```

> coverage を変更ファイル 1 本に絞るため、必要に応じて `--coverage.include='src/components/admin/IdentityConflictRow.tsx'` を併用する（provider 設定で include 指定方法が異なる場合は `vitest.config` の `coverage.include` を一時上書きして同等の限定を行う）。無関係ファイルの低 coverage をノイズとして混ぜない。

### 7.4 分岐別カバレッジ チェックリスト（4 相 + cleanup）

coverage サマリ / HTML レポート（`coverage/index.html`）で以下を 1 件ずつ目視確認する。

- [ ] **exiting 相**: `setIsExiting(true)` 行・`setTimeout(finalizeRemoval, ...)` 行が covered（緑）
- [ ] **removed 相（transitionEnd 経路）**: `onTransitionEnd` の `if (isExiting) finalizeRemoval()` true 枝 + `finalizeRemoval` 内 `setOptimisticMerged(true)` が covered
- [ ] **removed 相（timeout fallback 経路）**: fake timer 前進で `finalizeRemoval` に到達する経路が covered（transitionEnd 非発火環境の保証）
- [ ] **rollback 相**: `.catch` 内 `clearTimeout` + `setIsExiting(false)` が covered（reject mock 経由）
- [ ] **reduced-motion fallback**: reduced-motion 想定（transition-duration≈0）で transitionEnd が即発火 → removed へ即遷移する経路が covered（jsdom では transitionEnd を `fireEvent.transitionEnd` で明示発火し、duration≈0 相当を再現）
- [ ] **timer 解放 3 経路**: `finalizeRemoval` 内 clear / `.catch` 内 clear / `useEffect` cleanup の clear がいずれも covered（`exitTimerRef.current !== null` の true/false 両枝）
- [ ] **render 相分岐**: `optimisticMerged` true/false 両枝、`isExiting` true/false 両枝が covered

### 7.5 未 cover 時の戻し方

| 未 cover の分岐 | 切り分け | 対応 |
| --- | --- | --- |
| `onTransitionEnd` true 枝 未到達 | テストが `fireEvent.transitionEnd(rowEl)` を発火していない | Phase 6 に戻り transitionEnd 発火ケースを補強 |
| timeout fallback 未到達 | fake timer の `vi.advanceTimersByTime(EXIT_ANIMATION_MS + EXIT_FALLBACK_BUFFER_MS)` 不足 | advance 量を fallback 閾値以上へ調整 |
| `.catch` rollback 未到達 | reject mock が `.catch` を発火していない | reject Promise を返す mock へ修正 |
| `useEffect` cleanup 未到達 | unmount 時に timer が残っていない | timer 残存中に `unmount()` するケースを追加 |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 本WF Phase 2 設計 | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-2/phase-2.md` | state machine（§2.1）/ jsdom transitionend 制約（§2.4）/ timer 解放経路（§2.6） |
| 兄弟テンプレート | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-7/phase-7.md` | 変更ファイル限定 coverage の書式 |
| 既存実装 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | 追加分岐の挿入位置 |

## 成果物

- 変更関数/ブロックに限定した coverage 測定方針（§7.1〜§7.3）。
- exiting / removed（transitionEnd・timeout fallback）/ rollback / reduced-motion / timer 解放 / render 相 の分岐別チェックリスト（§7.4）。
- 未 cover 時の Phase 6 戻し手順（§7.5）。

## 統合テスト連携

- Phase 4/6 の focused Vitest（exiting 開始 / removed 遷移 / rollback / reduced-motion 即時 / success-stays-removed）が §7.4 の全分岐を踏むことを coverage で裏取りする。
- coverage が満たされたら Phase 9（typecheck / lint / token gate）の最終再確認へ接続する。
- Playwright e2e は coverage 対象外（jsdom coverage と分離）。安定 locator state 待ちは Phase 9 ゲート 4 で扱う。

## 完了条件（Phase 7）

| 項目 | 基準 |
| --- | --- |
| 追加分岐 line coverage | `setIsExiting(true)` / `setTimeout(finalizeRemoval)` / `finalizeRemoval` の `setOptimisticMerged(true)` / `.catch` の `clearTimeout`+`setIsExiting(false)` / `useEffect` cleanup の `clearTimeout` が全行 covered |
| 追加分岐 branch coverage | `isExiting` true/false・`optimisticMerged` true/false・`trigger` resolve/reject・`exitTimerRef.current !== null` true/false の各両枝が covered |
| 4 相網羅 | exiting 相 / removed 相（transitionEnd・timeout fallback の両経路）/ rollback 相 / reduced-motion fallback がチェックリストで全て確認済み |
| 既存 coverage 退行なし | `IdentityConflictRow.tsx` の既存行（merge-confirm / merge-final / dismiss / cancel 系）の coverage が変更前より低下しないこと |
