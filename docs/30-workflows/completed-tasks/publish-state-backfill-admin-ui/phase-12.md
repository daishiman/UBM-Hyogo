# Phase 12: ドキュメント

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| phase | 12 / 13 |
| 前提 | Phase 1-11 完了 |
| workflow_state | `implemented_local_evidence_captured`（PR #1064 / commit `745c95115` で dev へ landed） |
| verdict | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| taskType | implementation（existing-hardening / 既存実装の正本記述） |
| visualEvidence | VISUAL_ON_EXECUTION（staging screenshot は user-gated） |

## 目的

Task A（公開状態 backfill 管理 UI）の **landed 実装を正本として記述する** ドキュメントを確定する。
コードは既に dev へマージ済みであり、本 Phase は原則として「動いている UI を、後続実装者・運用者が再現できる契約として文書化する」ことを責務とする。本レビューサイクルで検出した小さな UI state gap（apply 実行中 loading 表示）だけは `BackfillPublishStatePanel.client.tsx` の `activeMode` 追加で同一 wave 補正した。
strict-7 close-out evidence（`outputs/phase-12/`）と PR 準備（Phase 13）の入力を整える。

## 実行タスク

1. backfill 機能を中学生レベルの概念で説明する（Part 1）。
2. 技術契約（schema / path / mutation / apply ガード）を実コードに一致させて記述する（Part 2）。
3. 3 層整合テスト（endpoint D1 / web schema / panel）の連携点を記録する。
4. strict-7 ファイル（`outputs/phase-12/`）を作成し、AI が多角的にチェックする観点を残す。

## Part 1: 概念説明（中学生レベル）

**backfill（バックフィル）とは何か。**

このサイトには「会員の一覧ページ」があります。会員が「自分を一覧に出していい」と同意（公開許可）すると、ふつうは一覧に表示されます。
ところが、システムの中では一覧に出すかどうかを `publish_state`（公開状態）という別のスイッチで管理しています。
このスイッチは最初 `member_only`（会員だけに見える）になっていて、`public`（みんなに見える）に切り替わるのは決まったタイミングだけです。

そのため、**「公開していいよ」と同意したのに、スイッチが `member_only` のまま残ってしまい、一覧に出てこない人**が出ることがあります。
これを後からまとめて直す操作が **backfill** です。「以前公開を許可したのに一覧に出ない人を、ちゃんと確認してから一覧に出す」作業だと考えてください。

この管理画面のパネルには 2 つのボタンがあります。

- **dry-run（ドライラン＝試し計算）**: 「もし直したら何人直るか」を数えるだけで、データベースは **一切変更しません**。まず安全に下見をするためのボタンです。
- **apply（アプライ＝実行）**: dry-run で「直す対象がいる」と分かったあとだけ押せます。実際にスイッチを `public` に切り替えます。押す前に「本当に実行しますか?」の確認ダイアログが出ます。

つまり「まず dry-run で下見 → 問題なければ apply で実際に直す」という二段構えにして、間違えて一気に公開してしまわないようにしています。

## Part 2: 技術契約

### 2.1 変更ファイル（web のみ・`apps/api` 差分 0）

| パス | 責務 |
|------|------|
| `apps/web/src/features/admin/diagnostics/backfill.ts` | `BackfillResultSchema`（zod `.strict()`）+ `BackfillResult` 型 + `BACKFILL_PUBLISH_STATE_PATH` 定数 |
| `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` | dry-run / apply 操作パネル（client component） |
| `apps/web/app/(admin)/admin/sync-status/page.tsx` | `SyncStatusView` 末尾へ `<BackfillPublishStatePanel />` を mount |
| `apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx` | パネル単体テスト（TC-A1..A7） |
| `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` | schema parse/reject テスト（TC-B1..B4） |

> 救済 endpoint `POST /admin/sync/backfill-publish-state`（`apps/api/src/routes/admin/sync-backfill-publish-state.ts`、mount `apps/api/src/index.ts:287`）は **変更不要**（親 AC-G2 / 不変条件 #5）。

### 2.2 proxy path 定数

```ts
export const BACKFILL_PUBLISH_STATE_PATH = "/api/admin/sync/backfill-publish-state" as const;
```

> 元タスクファイルの corrupted path `?fullSync=true-publish-state` は実コードへ補正済み（phase-1.md「元タスクファイルとの乖離補正」で記録）。

### 2.3 レスポンス契約（`BackfillResult`）

endpoint と完全一致（`backfill.ts` で再宣言、API を直接 import しない＝不変条件 #5）。

| フィールド | 型 | 意味 |
|-----------|-----|------|
| `dryRun` | `boolean` | dry-run なら true |
| `policy` | `"auto-publish-on-consent"` | 救済ポリシー識別子 |
| `scanned` | `number >=0` | 走査件数 |
| `candidates` | `number >=0` | 昇格対象件数 |
| `applied` | `number >=0` | 実昇格件数（dry-run は 0） |
| `skipped.alreadyPublic` | `number >=0` | 既に public |
| `skipped.adminExplicit` | `number >=0` | 管理者明示設定（override） |
| `skipped.consentNotMet` | `number >=0` | 同意未達 |
| `skipped.deleted` | `number >=0` | 削除済み |

### 2.4 mutation 契約（AC-A4 / 不変条件 #10）

- `@/features/admin/hooks/useAdminMutation` 経由（legacy `@/lib/useAdminMutation` 不参照）。
- hook は 1 インスタンス。`trigger(payload, endpointOverride)` 第2引数で `?dryRun=true|false` を切替。
- `refreshOnSuccess: false`（結果は手動描画）。レスポンスは `BackfillResultSchema.safeParse` で検証し endpoint を信頼しない。

### 2.5 apply ガード（破壊的操作の安全設計）

- **dry-run 先行必須**: `canApply = lastResult!==null && mode==="dryRun" && lastResult.dryRun && lastResult.candidates>0`。
- **confirm 確認**: apply 押下時 `globalThis.confirm(...)`。キャンセルで no-op。
- **二重起動防止**: `useAdminMutation` の `isSubmittingRef` + 両ボタン `disabled={mutation.isLoading}`。

### 2.6 OKLch トークンのみ（不変条件 §2）

`text-[var(--ubm-color-*)]` / `--ubm-color-danger` のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` / inline style は使用しない。

## 統合テスト連携

3 層整合で endpoint を信頼しない設計を担保する。

| 層 | テスト | 担保内容 |
|----|--------|----------|
| endpoint（D1 in-memory） | `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts` | dry-run/apply の DB 副作用・skipped 分類 |
| web schema 契約 | `sync-schemas.spec.ts`（TC-B1..B4） | `BackfillResultSchema` の parse/reject（`.strict()` 余剰キー拒否） |
| パネル UI | `BackfillPublishStatePanel.spec.tsx`（TC-A1..A7） | dry-run/apply 操作・confirm モック・apply ガード・parseError 分離 |

## 参照資料

| 参照 | パス |
|------|------|
| 依存 Phase 1 成果物 | `./phase-1.md` |
| 依存 Phase 2 成果物 | `./phase-2.md` |
| 依存 Phase 5 成果物 | `./phase-5.md` |
| 依存 Phase 6 成果物 | `./phase-6.md` |
| 依存 Phase 7 成果物 | `./phase-7.md` |
| 依存 Phase 8 成果物 | `./phase-8.md` |
| 依存 Phase 9 成果物 | `./phase-9.md` |
| 依存 Phase 10 成果物 | `./phase-10.md` |
| 依存 Phase 11 成果物 | `./phase-11.md` |
| Phase 11 evidence | `./outputs/phase-11/main.md` |
| Phase 12 strict-7 | `./outputs/phase-12/` |
| task-specification-creator Phase 12 | `.claude/skills/task-specification-creator/references/phase-12-spec.md` |
| aiworkflow requirements quick reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` |

## 多角的チェック観点（AIが判断）

- `safeParse` 失敗時に `parseError` を描画し結果を出さないか（HTTP error は `mutation.error` と分離）。
- `confirm` が jsdom で `vi.spyOn(globalThis, "confirm")` モックされ apply テストが flaky にならないか。
- `useAdminMutation` の import 元が `@/features/admin/hooks/...` であり legacy path を新規参照していないか（不変条件 #10）。
- OKLch トークン以外の色指定（HEX / `bg-[#...]`）が混入していないか（不変条件 §2 / `verify-design-tokens`）。

## サブタスク管理

| ID | 内容 | Phase |
|----|------|-------|
| DOC-1 | Part 1 概念説明 | 12 |
| DOC-2 | Part 2 技術契約 | 12 |
| DOC-3 | strict-7 close-out 作成 | 12 |
| DOC-4 | Phase 13 入力整備 | 12 |

## 成果物（strict-7 一覧）

| # | ファイル | 内容 |
|---|----------|------|
| 1 | `outputs/phase-12/main.md` | Phase 12 サマリ / Gate-A・Gate-B passed 根拠 |
| 2 | `outputs/phase-12/implementation-guide.md` | Concept / Technical Contract / Evidence の 3 見出し |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | specs / aiworkflow への影響（no spec change） |
| 4 | `outputs/phase-12/documentation-changelog.md` | 本仕様書ディレクトリ作成 changelog |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（0 件） |
| 6 | `outputs/phase-12/skill-feedback-report.md` | skill への学び |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | CI gate `verify-phase12-compliance` 用 compliance check |

## 完了条件

- [x] Part 1（中学生レベル概念）を記述した。
- [x] Part 2（schema / path / mutation / apply ガード / OKLch）を実コードに一致させた。
- [x] 3 層整合テストの連携点を記録した。
- [x] strict-7 ファイルを `outputs/phase-12/` に作成した。
- [x] workflow_state=implemented_local_evidence_captured / verdict=PASS_BOUNDARY_SYNCED_RUNTIME_PENDING を artifacts.json と整合させた。

## タスク100%実行確認【必須】

- [x] strict-7 全 7 ファイルを成果物として列挙した。
- [x] endpoint/D1/Form schema 不変（apps/api 差分 0）を再確認した。
- [x] PR / commit / push / staging screenshot が user-gated であることを Phase 13 へ引き継いだ。

## 次Phase

Phase 13（PR 作成）。commit / push / PR / staging screenshot はユーザー承認まで blocked。
