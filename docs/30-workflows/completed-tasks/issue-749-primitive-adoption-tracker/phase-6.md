# Phase 6: ローカル検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 種別 | ローカル検証 |
| 入力 | Phase 4 / 5 成果物 |
| 出力 | 検証 log（Phase 11 evidence で保存） |

## 実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test
mise exec -- pnpm exec next build --webpack    # apps/web Workers build 互換
bash scripts/coverage-guard.sh
bash scripts/verify-primitive-adoption.sh      # Phase 7 で新規作成後に実行
```

## 19 routes 手動確認チェックリスト

`mise exec -- pnpm --filter @ubm/web dev` を起動し、以下 19 routes を実機ブラウザで確認:

- [ ] `/`
- [ ] `/(public)/members`（ページング + EmptyState 確認）
- [ ] `/(public)/members/[id]`
- [ ] `/(public)/register`
- [ ] `/privacy`
- [ ] `/terms`
- [ ] `/login`
- [ ] `/profile`
- [ ] `/(admin)/admin`（Breadcrumb 確認）
- [ ] `/(admin)/admin/members`（Breadcrumb + EmptyState + Pagination）
- [ ] `/(admin)/admin/tags`（Breadcrumb + FormField + useAdminMutation）
- [ ] `/(admin)/admin/meetings`（Breadcrumb + FormField + useAdminMutation + EmptyState + Pagination）
- [ ] `/(admin)/admin/schema`
- [ ] `/(admin)/admin/requests`
- [ ] `/(admin)/admin/identity-conflicts`
- [ ] `/(admin)/admin/audit`（全 6 primitive 採用箇所）
- [ ] `error.tsx`（共通 error boundary 動作確認）
- [ ] `not-found.tsx`
- [ ] `loading.tsx`

## 完了条件

- [ ] 全コマンド exit 0
- [ ] `bash scripts/coverage-guard.sh` exit 0（既定 80%）
- [ ] 19 routes 手動確認チェックボックス全完了
- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80%（apps/web）

## 次Phase

→ Phase 7（CI gate 追加）
