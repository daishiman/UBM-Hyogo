# Phase 11: 手動テスト結果 — VISUAL_ON_EXECUTION

> 主証跡は **tier 1（local jsdom render + focused Vitest）** と **tier 2（local Playwright screenshot）**。commit / push / PR / Issue mutation はすべて user-gated のまま分離する。

## タスク種別宣言

- **タスク種別**: VISUAL_ON_EXECUTION
- **route**: `/admin/identity-conflicts`
- **対象 component**: `apps/web/src/components/admin/IdentityConflictRow.tsx`
- **Issue**: #1043（identity-conflicts row fade animation / FU-AIDC-007）
- **workflow_state**: `implemented_local_evidence_captured`（implemented_local_evidence_captured）

`/admin/identity-conflicts` の identity conflict row に対し、merge 二段階 confirm 完了直後に row を **fade out（exiting 相）させてから DOM 除去（removed 相）** する。server error 時のみ exiting をキャンセルして row を復元し inline error（`role="alert"`）を表示する。dismiss 側は不変。reduced-motion 環境では transition-duration ≈ 0 でほぼ即時に消える。

## 証跡の主ソース（two-tier evidence）

| tier | ソース | 内容 | 本サイクル状態 |
| --- | --- | --- | --- |
| **1（主証跡）** | focused Vitest（`IdentityConflictRow.spec.tsx`）+ local jsdom render | exiting class 適用 → `finalizeRemoval`（transitionEnd 発火 or fake timers 進行）で `return null` / rollback で exiting キャンセル + error 残存 / reduced-motion 即時 / success-stays-removed を component-local に検証 | 取得済み（focused Vitest 13/13 PASS） |
| **2（補強）** | Playwright（`admin-identity-conflicts.spec.ts`）screenshot 3 枚 | exiting-fade / removed-stable（`toHaveCount(0)` 同期）/ rollback-restored（error alert 同期）の視覚状態遷移を固定 | 取得済み（desktop 8/8 PASS、3 PNG captured） |

### 主証跡（tier 1）想定テスト

| 自動テスト名（想定） | 件数想定 | 対応 AC |
| --- | --- | --- |
| `merge 実行直後に exiting 相（fade class）を適用し row を可視のまま残す` | 1 | AC-1 |
| `exiting → transitionEnd / timeout fallback で removed（return null）へ遷移する` | 1 | AC-2 |
| `merge 成功後も row は removed のまま再表示されない` | 1 | AC-4 |
| `server error で exiting をキャンセルし row を復元、inline error（role=alert）を表示する` | 1 | AC-3 |
| `reduced-motion 環境では timeout fallback で即時 removed へ遷移する` | 1 | AC-5 |
| `dismiss 側は exiting / fade を適用しない（不変・回帰なし）` | 1 | AC-6 |
| `exitTimerRef はアンマウント時に clear される（timer leak なし）` | 1 | AC-7 |

> 既存 #988 ケース（即時 `toBeNull`）は Phase 4/6 で「exiting 適用 → `finalizeRemoval`（`fireEvent.transitionEnd` または `vi.useFakeTimers()` + `vi.advanceTimersByTime`）で `toBeNull`」へ更新する（jsdom は transitionend を自動発火しないため）。

## 手動テスト項目チェックリスト

実施欄は本サイクルの focused Vitest と local Playwright 実行結果に同期した。

| # | AC | テスト項目 | 期待挙動 | 実施（本サイクルで同期） |
| --- | --- | --- | --- | --- |
| 1 | AC-1 | 「merge 実行」click 直後 | row が exiting 相（fade class）に入り可視のまま残る | tier 1 vitest |
| 2 | AC-2 | fade 完了（transitionEnd / fallback） | row が DOM から除去される（`return null`） | tier 1 vitest |
| 3 | AC-3 | server error 応答時 | exiting がキャンセルされ row が復元、inline error（`role="alert"`）表示 | tier 1 vitest |
| 4 | AC-4 | server 成功応答後 | row は removed のまま再表示されない | tier 1 vitest |
| 5 | AC-5 | `prefers-reduced-motion: reduce` | animation 抑制でほぼ即時に row が消える（fallback で removed 保証） | tier 1 vitest |
| 6 | AC-6 | dismiss 操作 | dismiss は本変更前と同一（fade なし・回帰なし） | tier 1 vitest |

## screenshot 取得結果（Feedback4）

- 本タスクは VISUAL のため、local Playwright fixture で `/admin/identity-conflicts` を開き、canonical screenshot 3 枚を取得した。
- tier 1（focused Vitest + local jsdom render）は component-local に exiting/removed/rollback/reduced-motion を決定的に検証する。
- tier 2（local Playwright screenshot 3 枚）は `outputs/phase-11/screenshots/` に canonical 名で配置済み。capture metadata の `captureStatus` はすべて `captured`。

## canonical screenshot（3 枚・取得済み）

| TC-ID | canonical ファイル名 | 撮影状態 | 同期点 |
| --- | --- | --- | --- |
| TC-VIS-01 | `identity-conflict-row-exiting-fade.png` | exiting 相（fade out 途中・DOM 残存） | captured |
| TC-VIS-02 | `identity-conflict-row-removed-stable.png` | removed 相（fade 後 row 消失・安定） | captured |
| TC-VIS-03 | `identity-conflict-row-rollback-restored.png` | rollback 相（row 復元 + inline error） | captured |

配置先: `outputs/phase-11/screenshots/`。命名・TC は `phase11-capture-metadata.json` / `screenshot-plan.json` と完全一致させる。

## 判定

**GATE: tier 1 focused Vitest PASS / tier 2 local Playwright 8/8 PASS + screenshots captured** — VISUAL タスクとして two-tier evidence を確定し、3 PNG を Phase 11 に保存した。
