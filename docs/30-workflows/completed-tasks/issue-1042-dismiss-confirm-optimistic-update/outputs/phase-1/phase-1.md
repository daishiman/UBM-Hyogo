# Phase 1: 要件定義

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

## メタ情報

| key | value |
|---|---|
| workflow_id | `issue-1042-dismiss-confirm-optimistic-update` |
| issue | `#1042`（FU-AIDC-006、実状態 `OPEN`） |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| implementation_mode | `implemented_local_evidence_captured`（dismiss optimistic は本サイクルで実装済み） |
| タスク分類 | **UI task（VISUAL）** — admin 画面 `/admin/identity-conflicts` の interactive 挙動変更 |

## 1.1 真の論点

> merge は操作直後に row が消えるのに、dismiss は server round-trip 完了まで row が残る。**同一画面内で操作種別ごとに体感速度が非対称**になっている。この非対称を、merge と同じ optimistic 機構で解消する。ただし dismiss の rollback 責務を merge state に混ぜない。

副次論点（切り分け）:
- これは「新機能」ではなく「#988(merge) で確立した optimistic パターンの dismiss 適用」。1 提案に複数案件が混ざっていない（fade animation は別 Issue へ分離済み）。
- `why now`: merge optimistic が #1046 で landed し、画面内の挙動差が顕在化したため。
- `why this way`: hook（`useAdminMutation`）を変更すると merge / dismiss / 他 admin mutation 全体に影響が波及する。component-local state なら影響範囲を 1 component に閉じられる（merge 実装の前例どおり）。

## 1.2 carry-over 確認（前タスク成果物の棚卸し）

`git log --oneline` で確認した直近関連コミット:

| commit | 内容 | 本タスクとの差異 |
|---|---|---|
| `f6faeb005` (#1046) | identity conflicts **merge** 後の楽観的非表示と rollback | 本タスクは **dismiss** 側。merge 実装を mirror するが state は分離する |
| `ebe802fd8` (#1041) | identity-conflicts **dismiss** 操作の監査ログ対称化 (#987) | API 側の audit log。本タスクは UI 側 optimistic のみで API 不変 |

→ 本タスクの新規作業 = `optimisticDismissed` state の追加と dismiss handler の差し替え。merge 実装と audit log 実装は完了済みで再実装不要。

## 1.3 既存コード命名規則の分析（FB-01: 仕様書 vs 実装クラス名ズレ検出）

`IdentityConflictRow.tsx` の現行命名を実コードで確認済み:

| 種別 | 現行命名 | 本タスクで踏襲 |
|---|---|---|
| optimistic state（merge） | `optimisticMerged` / `setOptimisticMerged`（camelCase boolean） | dismiss は `optimisticDismissed` / `setOptimisticDismissed` で対称化 |
| handler | `onMerge` / `onDismiss` | `onDismiss` を差し替え |
| cancel handler | `cancelMerge` / `cancelDismiss` | 不変 |
| mutation | `mergeMutation` / `dismissMutation`（`useAdminMutation` 経由） | 不変 |
| reason state | `mergeReason` / `dismissReason` | `dismissReason` は rollback 時保持 |
| error helper | `errorMessage(error)` → `mergeError` / `dismissError` | 不変 |

→ 命名ズレなし。`optimisticDismissed` は既存 `optimisticMerged` の対称名で一貫性確保。

## 1.4 受け入れ基準（Issue #1042 原文 + 現行コード写像）

- [ ] AC-1: `IdentityConflictRow.tsx` に dismiss 専用 optimistic state（`optimisticDismissed`）が追加され、`optimisticMerged` と**共有されていない**。
- [ ] AC-2: dismiss 実行直後（server 応答前）に対象 row が DOM から消える。
- [ ] AC-3: dismiss API reject 時に対象 row が復元し、`dismissReason` 入力値が保持される。
- [ ] AC-4: merge optimistic update の成功 / rollback テストが引き続き PASS する（回帰なし）。
- [ ] AC-5: `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` に dismiss optimistic / rollback の focused ケースがある。

## 1.5 inventory（変更対象と不変境界）

| カテゴリ | 対象 | 扱い |
|---|---|---|
| 変更 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | `optimisticDismissed` 追加・`onDismiss` 差し替え・render guard 統合 |
| 変更 | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | dismiss optimistic 3 ケース追加 |
| 変更 | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | dismiss optimistic hide + rollback 追加 |
| 不変 | `apps/api/src/routes/admin/identity-conflicts.ts` | API contract 不変（不変条件 #1） |
| 不変 | D1 schema / migrations | 変更なし（#1） |
| 不変 | `apps/web/src/app/(admin)/admin/identity-conflicts/page.tsx` | Server Component のまま |
| 不変 | `apps/web/src/features/admin/hooks/useAdminMutation` | hook 拡張なし |

## 1.6 targeted test run（FB-UI-02-2: 全件 test SIGKILL 回避）

メモリ制約環境向けに、本タスクの検証は対象ファイル指定で実行する（全件 `pnpm test` 禁止）:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/admin/__tests__/IdentityConflictRow.spec.tsx
```

## 1.7 P50 前提確認

| 確認項目 | 結果 | 対応 |
|---|---|---|
| current branch に dismiss 実装が存在する | **No**（merge のみ存在） | 通常の実装 Phase（`new`）とする |
| upstream（dev/main）にマージ済み | **No**（dismiss optimistic は未 land） | 未マージとして扱う |
| 前提タスク（#988 merge / #987 audit）完了済み | **Yes** | 完了済みを記録し依存チェック省略。merge state パターンを再利用 |

→ `implementation_mode: new`。Phase 4 は TDD Red（dismiss optimistic ケース）、Phase 5 は実装。
