# Phase 11: 手動テスト

## 0. NON_VISUAL 宣言

| 項目 | 内容 |
|---|---|
| タスク種別 | **NON_VISUAL**（index.md / Phase 1 §0 に整合） |
| 非視覚的の理由 | 本タスクは `useAdminMutation` / `useConfirmDialog` の **内部信頼性 policy**（timeout / retry / idempotency-key 送出 / 404 policy / abort 連携）の追加であり、admin 画面の視覚要素・レイアウト・配色・コピーに変更がない。観測対象は通信ライフサイクルの振る舞いであって描画ではない |
| 結論 | **UI/UX 変更なしのため Phase 11 スクリーンショット不要** |
| 代替証跡 | 自動テスト（vitest）の結果（件数・PASS）を主ソースとする。`outputs/phase-11/manual-test-result.md` に記録する |

## 1. 代替証跡（主ソース: vitest）

NON_VISUAL のため、視覚証跡の代わりに **自動テストの実行結果**を一次証跡とする。Phase 6 で追加する 5 観点（timeout 発火 / retry 上限・backoff / idempotency-key 注入 / 404 三値挙動 / abort 連携）の PASS をもって受入とする。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/features/admin/hooks/__tests__/useAdminMutation.spec.ts \
  src/features/admin/hooks/__tests__/useConfirmDialog.spec.ts
```

`outputs/phase-11/manual-test-result.md` に以下を記録する想定:

- 実行コマンドと実行日時
- 実行ファイルごとの total / passed / failed 件数（AC-12 / AC-15 の証跡）
- 追加した 5 観点 `TC-NN` の一覧と各 PASS 状態

### 1-A. source-level PASS と環境ブロッカーの分離記録ルール

vitest の結果は **2 カテゴリに分けて記録**する。両者を混同すると「環境起因の失敗」を「実装の失敗」と誤判定するため。

| カテゴリ | 定義 | 記録欄 | Go 判定への影響 |
|---|---|---|---|
| **source-level PASS** | テストロジックがソースの振る舞いを検証して PASS / FAIL した結果 | `manual-test-result.md` の「source-level」節 | AC-12 / AC-15 の判定に直結 |
| **環境ブロッカー** | esbuild version mismatch / worktree isolation / arch 不整合など、ソースと無関係なランタイム起因の失敗 | `manual-test-result.md` の「環境ブロッカー」節（別カテゴリ） | AC 判定からは除外し、復旧手順への参照を記録 |

環境ブロッカーが疑われる場合は `pnpm verify:vitest-runtime` を実行し、復旧手順は `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md` を参照する。環境ブロッカーで vitest が完走しない場合でも、原因が環境であることを切り分けて記録し、ソースの FAIL とは区別する。

## 2. 手動 smoke（補助・任意）

自動テストが主証跡のため必須ではないが、ローカルで通信ライフサイクルを目視確認したい場合の補助手順。

### 事前準備

```bash
mise exec -- pnpm install
mise exec -- bash scripts/with-env.sh pnpm --filter @ubm-hyogo/web dev
```

API（`apps/api`）も並走起動する。admin テストアカウントでログインし、admin 画面の任意の mutation（例: members notes 更新 / tags queue resolve）を開く。

### TC-S1: timeout が 10s で打ち切られる

1. DevTools の Network パネルを開き、throttling で応答を強制遅延（または該当 API を停止）させる
2. admin 画面で mutation を実行する
3. 期待: 約 10s（`DEFAULT_TIMEOUT_MS = 10000`・Phase 2 §4）で fetch が `(canceled)` になり、AbortError は **silent**（失敗 toast が出ない・`onError` が呼ばれない）

### TC-S2: Idempotency-Key header が送出される

1. DevTools の Network パネルで実行した mutation の request を選択
2. Request Headers を確認
3. 期待: caller が `idempotencyKey` を指定している経路では `Idempotency-Key` header が付与される（Phase 2 §4 / §2）。未指定経路では header が付かない（既定生成なし・Phase 2 §8）

> 現 caller は `idempotencyKey` 未指定のため、TC-S2 を観測するには検証用に caller 1 件へ一時的に `idempotencyKey` を渡すか、Phase 2 §5 の配線例（DELETE + retry + idempotencyKey）を一時 stub で確認する。本観測は任意。

### TC-S3: dialog close で進行中 mutation が abort される（任意）

1. `onCancelMutation` を配線した dialog（Phase 2 §5 の配線例）で mutation 実行中に dialog を閉じる
2. 期待: 進行中 fetch が `(canceled)` になり、AbortError は silent。focus restore は `ConfirmDialog.tsx` 側で従来どおり動作（回帰なし）

## 3. NG 時の対応

| 症状 | 切り分け |
|---|---|
| timeout が 10s で打ち切られない | Phase 2 §4 の `setTimeout(() => controller.abort(), timeoutMs ?? 10000)` 配線・`signal` の fetch 渡し漏れを確認 |
| AbortError で失敗 toast が出る | catch 分岐の `e.name === "AbortError"` 判定漏れ（Phase 2 §4 / §設計上の注意） |
| Idempotency-Key が送出されない | `resolveIdempotencyKey` の呼び出しと header マージ漏れ（Phase 2 §4 補助関数） |
| vitest が import / esbuild エラーで起動しない | 環境ブロッカー。§1-A に従い別カテゴリで記録し `pnpm verify:vitest-runtime` で切り分け |

## 4. 完了条件（Phase 11 DoD）

- [x] NON_VISUAL 宣言を記録（スクリーンショット不要の理由を明記）→ §0
- [x] vitest 5 観点の結果を `outputs/phase-11/manual-test-result.md` に記録（source-level PASS）→ 46 tests PASS
- [x] source-level PASS と環境ブロッカーを別カテゴリで記録 → 環境ブロッカーなし
- [x] 手動 smoke は任意 → 未実施（省略）
