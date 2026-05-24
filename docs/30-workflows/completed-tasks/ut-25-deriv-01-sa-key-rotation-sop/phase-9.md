[実装区分: 実装仕様書]

# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-25-DERIV-01 |
| 前提 Phase | Phase 8（リファクタリング完了） |
| 次 Phase | Phase 10（最終レビュー） |

## 目的

成果物全件に対し、shellcheck / markdownlint / line budget / 値漏洩 grep / 整合性チェックを実行し、CI で合格できる状態に固定する。

## 変更対象ファイル

なし（検証のみ）

## 検証マトリクス

| 検証 | コマンド | 期待 |
| --- | --- | --- |
| bats 全件 | `mise exec -- bats scripts/__tests__/cf-rotate-sa-key.bats` | 24/24 PASS |
| shellcheck | `mise exec -- shellcheck scripts/cf-rotate-sa-key.sh` | exit 0、warning 0 |
| markdownlint SOP | `mise exec -- pnpm exec markdownlint docs/30-workflows/runbooks/sa-key-rotation-sop.md` | exit 0 |
| markdownlint TEMPLATE | `mise exec -- pnpm exec markdownlint docs/30-workflows/runbooks/sa-key-rotation-records/TEMPLATE.md` | exit 0 |
| SOP line budget | `wc -l docs/30-workflows/runbooks/sa-key-rotation-sop.md` | <=400 行 |
| 値漏洩 grep | `grep -rE 'BEGIN PRIVATE KEY\|private_key.*:.*"' docs/30-workflows/runbooks/ scripts/cf-rotate-sa-key.sh` | 0 件 |
| `wrangler` 直接呼び禁止 | `grep -nE '^[^#]*wrangler ' scripts/cf-rotate-sa-key.sh` | 0 件（`cf.sh` 経由のみ） |
| `op://` 参照のみで実 secret が無い | `grep -nE '"client_email"\|"client_id":' docs/30-workflows/runbooks/sa-key-rotation-sop.md` | 0 件 |
| stub AC 9 件カバー | phase-10.md チェックリスト | 9/9 |
| typecheck | `mise exec -- pnpm typecheck` | exit 0（bash 改修のみで影響なし） |
| lint | `mise exec -- pnpm lint` | exit 0 |

## CI ゲート整合

- 本タスクの変更は `scripts/` と `docs/30-workflows/runbooks/` と skill reference 1 行のみ。`apps/` 配下の typecheck / lint には影響しないが、merge 前に CI が green であることを確認する
- `verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` の docs-only gate（CLAUDE.md PR 作成フロー §pr-pre-flight）対象外（本タスクは spec_kind=implementation_spec）

## DoD

- [ ] 検証マトリクス全 11 項目 PASS
- [ ] CI 模擬実行（`bash scripts/verify-pr-ready.sh`）も PASS
- [ ] 値漏洩 grep / wrangler 直接呼び禁止 grep の結果（0 件）を Phase 11 evidence に保存

## 次 Phase

Phase 10（最終レビュー）
