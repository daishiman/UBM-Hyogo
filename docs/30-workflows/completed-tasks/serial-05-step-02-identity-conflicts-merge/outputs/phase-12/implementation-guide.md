# serial-05-step-02 identity-conflicts merge UI hardening — implementation guide

## Part 1: 中学生レベルの概念説明

| ブロック | 説明 |
| --- | --- |
| 何を作ったか | 同じ人が 2 つの会員記録に分かれたとき、管理者が安全に 1 つへつなげるための画面操作を固めた。 |
| どう動くか | `merge` を押すと行の中に確認が出る。次へ進み、理由を書いて `merge 実行` を押すとサーバーへ送る。 |
| なぜ作るのか | 重複した会員記録を放置すると、連絡や集計が間違うため。 |
| どんな安全装置があるか | 理由必須、二段階確認、二重送信防止、400/409 では確認欄を閉じない、表示 email は mask 済み。 |
| 何を変えていないか | API、D1 schema、public page、server component の fetch 境界は変更していない。 |

### 専門用語セルフチェック

| 用語 | かんたんな意味 |
| --- | --- |
| Identity conflict | 同じ人かもしれない 2 つの会員記録の候補。 |
| merge | 片方をもう片方へ統合済みとして記録する操作。 |
| dismiss | 同じ人ではないと記録し、再検出を抑える操作。 |
| `useAdminMutation` | 管理画面の保存操作をまとめて扱う React hook。 |
| toast | 画面上に短く出る成功・失敗メッセージ。 |
| inline alert | 同じ行の中に出るエラーメッセージ。 |

## Part 2: 技術者向け実装ガイド

| # | チェック項目 | 内容 |
| --- | --- | --- |
| C12P2-1 | TypeScript 型定義 | `IdentityConflictRow` / `MergeIdentityRequest` / `MergeIdentityResponse` / `DismissIdentityConflictResponse` を shared package から参照。 |
| C12P2-2 | API シグネチャ | `POST /api/admin/identity-conflicts/:conflictId/merge` に `{ targetMemberId, reason }`、`POST /api/admin/identity-conflicts/:conflictId/dismiss` に `{ reason }` を送る。 |
| C12P2-3 | 使用例 | `IdentityConflictRow` から `useAdminMutation<MergeIdentityResponse>()` と `useAdminMutation<DismissIdentityConflictResponse>()` を呼ぶ。 |
| C12P2-4 | エラー処理 | `ALREADY_MERGED` / `TARGET_MEMBER_MISMATCH` / `ALREADY_DISMISSED` は `useAdminMutation` の operator message map で日本語化し、toast と inline alert へ出す。 |
| C12P2-5 | 設定可能パラメータ | reason 1〜500 文字、VISUAL screenshot path、design token gate。 |

## 主な変更

- `apps/web/src/components/admin/IdentityConflictRow.tsx`
  - 直書き `callJson()` / `useTransition` / `useRouter` を撤去。
  - `useAdminMutation<MergeIdentityResponse>` / `useAdminMutation<DismissIdentityConflictResponse>` を導入。
  - merge body を `{ targetMemberId: item.candidateTargetMemberId, reason: mergeReason.trim() }` に固定。
  - merge / dismiss reason state を分離し、失敗時も入力を保持。
  - inline alert に `role="alert"` / `aria-live="polite"` / `aria-describedby` を付与。
- `apps/web/src/features/admin/hooks/useAdminMutation.ts`
  - endpoint-specific ではない operator message map を追加し、既知 admin error code を日本語化。
- `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`
  - payload / successMessage / 日本語 error 表示 / inline panel 維持 / reason 保持を focused test で検証。
- `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`
  - 既知 admin error code mapping の回帰 test を追加。

## Phase 11 screenshot references

| state | path |
| --- | --- |
| inline confirm open | `../phase-11/02-inline-confirm-open.png` |
| success toast | `../phase-11/04-success-toast.png` |
| error 409 | `../phase-11/05-error-409.png` |
| error 400 | `../phase-11/06-error-400.png` |

## ローカル実行コマンドと結果

| コマンド | 結果 |
| --- | --- |
| `ESBUILD_BINARY_PATH=$(pwd)/node_modules/@esbuild/darwin-arm64/bin/esbuild pnpm exec vitest run apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | PASS: 9 tests |
| `pnpm exec playwright install chromium` | PASS: local screenshot capture prerequisite installed |
| `ESBUILD_BINARY_PATH=$(pwd)/node_modules/@esbuild/darwin-arm64/bin/esbuild pnpm exec tsx <inline capture script>` | PASS: 4 PNG screenshots saved under `outputs/phase-11/` |

## 受入条件 self-check

| AC | 結果 |
| --- | --- |
| AC-1 `useAdminMutation` 経由 | completed_local_evidence_captured |
| AC-2 二段階確認 + reason + targetMemberId | completed_local_evidence_captured |
| AC-3 trigger + 成功時 router.refresh + toast | completed_local_evidence_captured |
| AC-4 409 / 400 を toast + inline 表示、panel 維持 | completed_local_evidence_captured |
| AC-5 page.tsx は server component / D1 直アクセスなし | completed_local_evidence_captured |
| AC-6 shared type の実 field のみ | completed_local_evidence_captured |
| AC-7 aria-live / label / disabled / keyboard | completed_local_evidence_captured |
| AC-8 token gate | completed_local_evidence_captured |
| AC-9 focused unit test | completed_local_evidence_captured |
| AC-10 typecheck / lint | completed_local_evidence_captured |
| AC-11 coverage-guard | completed_local_evidence_captured |
| AC-12 useAdminMutation signature 不変 | completed_local_evidence_captured |

## 残課題

未タスク化が必要な残課題はなし。最終 close-out では `pnpm typecheck` / `pnpm lint` / `pnpm verify:tokens` / `pnpm coverage:guard` を再実行し、Phase 12 compliance に追記する。
