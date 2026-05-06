# Phase 5: 実装

## 変更対象ファイル一覧

| パス | 種別 | 変更内容 |
| --- | --- | --- |
| `.github/workflows/backend-ci.yml` | 編集 | D1 migration step は `CF_TOKEN_D1_<ENV>`、Workers deploy step は `CF_TOKEN_WORKERS_<ENV>` を参照 |
| `.github/workflows/web-cd.yml` | 編集 | Pages deploy step は `CF_TOKEN_PAGES_<ENV>` を参照 |
| `scripts/cf.sh` | 編集 | `CLOUDFLARE_API_TOKEN` が既に set されている場合に `op run --env-file` を skip する分岐追加。実値は変数経由で揮発的に渡し、log・file には残さない |
| `scripts/__tests__/cf-token-arg.test.sh` | 新規 | T-3 のテスト（Phase 4 雛形） |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | secrets 表を 6 Token 構成に更新。旧 `CLOUDFLARE_API_TOKEN` は deprecated 表記で残す（24h 並行保持期間中の参照用） |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 編集 | 現行 `backend-ci.yml` / `web-cd.yml` の scope 別 token 参照を正本化 |
| `docs/30-workflows/u-fix-cf-acct-01-deriv-02-scope-split-tokens/outputs/phase-12/runbook-token-rotation.md` | 新規 | Token 単位 rotation/rollback 手順 |

## 実装手順

1. `outputs/phase-2/phase-2.md` に従い `backend-ci.yml` を編集
2. `actionlint` で構文検証
3. 同手順で `web-cd.yml` 編集
4. `scripts/cf.sh` に env-var-presence 分岐追加（既存 `op run` ロジックを保持しつつ short-circuit）
5. `scripts/__tests__/cf-token-arg.test.sh` 作成、`bash` で実行 PASS
6. aiworkflow `deployment-secrets-management.md` / `deployment-gha.md` 更新
7. `runbook-token-rotation.md` 雛形作成（Phase 12 で内容拡充）

## ローカル実行・検証コマンド

```bash
# 構文検証
actionlint .github/workflows/backend-ci.yml .github/workflows/web-cd.yml

# shell test
bash scripts/__tests__/cf-token-arg.test.sh

# 全体品質
mise exec -- pnpm lint
mise exec -- pnpm typecheck
```

## 完了条件 (DoD)

- [ ] 上記 7 ファイルが変更/新規作成されている
- [ ] `actionlint` 全 PASS
- [ ] `scripts/__tests__/cf-token-arg.test.sh` PASS
- [ ] `mise exec -- pnpm lint` / `pnpm typecheck` PASS
- [ ] secret 実値が diff・log・docs のいずれにも残っていない（`grep -RI` で 0 hit）

## 成果物

- `outputs/phase-5/diff-summary.md`
- `outputs/phase-5/actionlint-result.log`
- `outputs/phase-5/cf-token-arg-test.log`
