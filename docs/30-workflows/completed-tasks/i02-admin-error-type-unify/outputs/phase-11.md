[実装区分: 実装仕様書]

# Phase 11: Evidence 取得（NON_VISUAL）

## メタ情報

| 項目 | 値 |
|------|----|
| タスク ID | i02-admin-error-type-unify |
| Phase | 11 / 13 |
| 区分 | NON_VISUAL（コード変更を伴う実装。UI スクリーンショット不要） |
| 状態語彙 | `implemented_local_evidence_captured` |
| ソース発注書 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i02-admin-error-type-unify/spec.md` |

## 目的

Phase 1–10 で実装した「`useAdminMutation` の error class を `AuthRequiredError` / `FetchAuthedError` に統一する」変更が、
**型安全性・既存テスト・lint・ローカル単体テスト** いずれの観点でも regression を起こしていないことを、
ローカル取得可能な evidence として固定する。

本タスクは UI 表示・runtime route・D1 schema・public API surface のいずれも変更しないため、
visual smoke / staging deploy は evidence の対象外。`typecheck` / `lint` / 単体テスト / grep ログのみを正本とする。
各 evidence ファイルは raw stdout 全量ではなく、ローカル実行結果を固定した summary log を含む。full raw log が必要な場合は
`command-results.md` のコマンドを再実行する。

## 実行タスク

1. evidence 出力ディレクトリの作成
2. typecheck / lint の全量取得
3. `useAdminMutation` / `authed` 単体テストの実行ログ取得
4. `AdminMutationHttpError` 残存有無の grep（完全削除確認）
5. `AuthRequiredError` / `FetchAuthedError` の `useAdminMutation` 内 instanceof 判定箇所の grep
6. 変更差分（`git diff`）の保存

## 参照資料

- ソース発注書: `parallel-i02-admin-error-type-unify/spec.md`
- 既存 error class 定義: `apps/web/src/lib/fetch/authed.ts`
- 変更対象 hook: `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- 既存 hook test: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`
- 既存 authed test: `apps/web/src/lib/fetch/authed.spec.ts`

## 実行手順

```bash
cd <repo-root>
EVIDENCE_DIR=docs/30-workflows/i02-admin-error-type-unify/outputs/phase-11/evidence
mkdir -p "$EVIDENCE_DIR"

# 1) typecheck
mise exec -- pnpm typecheck > "$EVIDENCE_DIR/typecheck.txt" 2>&1

# 2) lint
mise exec -- pnpm lint > "$EVIDENCE_DIR/lint.txt" 2>&1

# 3) useAdminMutation 単体テスト
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation \
  > "$EVIDENCE_DIR/test-useAdminMutation.txt" 2>&1

# 4) authed 単体テスト（regression 検知）
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run authed \
  > "$EVIDENCE_DIR/test-authed.txt" 2>&1

# 5) AdminMutationHttpError 残存確認（0 hit 期待。再 export 維持時は index.ts のみ許容）
rg -n "AdminMutationHttpError" apps/web/src \
  > "$EVIDENCE_DIR/grep-AdminMutationHttpError.txt" || true

# 6) 新 error class の参照点 grep
rg -n "AuthRequiredError|FetchAuthedError" apps/web/src/features/admin \
  > "$EVIDENCE_DIR/grep-new-error-classes.txt"

# 7) git diff 保存
git diff \
  apps/web/src/features/admin/hooks/useAdminMutation.ts \
  apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts \
  apps/web/src/features/admin/hooks/index.ts \
  > "$EVIDENCE_DIR/git-diff-admin-hooks.txt"
```

## 統合テスト連携

- p-10（`AuthRequiredError` → `/login?redirect=...` redirect 実装）の正本契約に合わせ、
  本 Phase では `AuthRequiredError` 発生時に `toLoginRedirect(currentPath)` の結果が optional `redirector` へ渡ることまでを
  `useAdminMutation.spec.ts` で検証する。
- `useAdminMutation` の戻り値型 `AdminMutationResult.error` は `Error | null` のまま不変であり、
  consumer 側の型契約は変わらない。

## 多角的チェック観点（AIが判断）

| 観点 | 判定方法 |
|------|---------|
| 型安全 | `typecheck.txt` / `command-results.md` に exit 0 相当を記録し、`error TS` 行が 0 件 |
| 静的解析 | `lint.txt` / `command-results.md` に exit 0 相当を記録し、warning が新規追加 0 件 |
| 動的検証 | `test-useAdminMutation.txt` / `test-authed.txt` 共に `FAIL` 表記なし・全 spec PASS。401 redirect DI と `reset` 返却も含む |
| 完全削除 | `grep-AdminMutationHttpError.txt` が 0 hit PASS ログを含む（空ファイルでも許容） |
| 新型置換 | `grep-new-error-classes.txt` に `useAdminMutation.ts` 内の throw 2 箇所 + instanceof 2 箇所が観測される |
| 差分純度 | `git-diff-admin-hooks.txt` の `+` 行が error class import / throw / instanceof / test assertion のみで、関数 signature・公開 API 追加なし |

## サブタスク管理

- [x] evidence ディレクトリ作成
- [x] typecheck 取得
- [x] lint 取得
- [x] useAdminMutation test 取得
- [x] authed test 取得
- [x] grep（旧 class 残存 / 新 class 参照点）取得
- [x] git diff 保存
- [x] PASS 判定（下記 完了条件）に従い `implemented_local_evidence_captured` を確定

## 成果物

```
outputs/phase-11/evidence/typecheck.txt
outputs/phase-11/evidence/lint.txt
outputs/phase-11/evidence/test-useAdminMutation.txt
outputs/phase-11/evidence/test-authed.txt
outputs/phase-11/evidence/grep-AdminMutationHttpError.txt
outputs/phase-11/evidence/grep-new-error-classes.txt
outputs/phase-11/evidence/git-diff-admin-hooks.txt
outputs/phase-11/evidence/command-results.md
```

## 完了条件

- 上記 8 ファイルすべてが存在し、空ファイルでないこと（grep-AdminMutationHttpError.txt は 0 hit PASS ログまたは空ファイルを許容）
- typecheck / lint / test の全実行ログが `exit 0` 相当
- `AdminMutationHttpError` 残参照が 0 hit（再 export 維持判断時は `hooks/index.ts` のみ 1 hit 許容）

## タスク100%実行確認【必須】

- [x] evidence 8 ファイルすべて生成済み
- [x] typecheck PASS（FAIL 0 件）
- [x] lint PASS（新規 warning 0 件）
- [x] useAdminMutation spec の 401 case が `AuthRequiredError`、403 case が `FetchAuthedError` で assert される
- [x] useAdminMutation spec の 401 case が `/login?redirect=...` redirector 呼び出しを assert する
- [x] 旧 `AdminMutationHttpError` の class 定義が production code から完全に消滅
- [x] state vocabulary を `implemented_local_evidence_captured` に確定

## 次Phase

Phase 12（ドキュメント・知識化）。runtime 挙動は不変のため staging deploy 待ちにせず即 Phase 12 へ進む。
