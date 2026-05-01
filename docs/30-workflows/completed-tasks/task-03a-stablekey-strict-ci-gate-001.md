# task-03a-stablekey-strict-ci-gate-001

## Metadata

| Field | Value |
| --- | --- |
| Source | `docs/30-workflows/03a-stablekey-literal-lint-enforcement/` Phase 12 |
| Status | unassigned |
| Priority | High |
| Owner candidate | CI / release owner |

## 苦戦箇所【記入必須】

`package.json` には `lint:stablekey:strict` があるが、GitHub Actions の required lint gate として strict mode が保証されていない。warning mode の `pnpm lint` だけでは AC-7 fully enforced を主張できない。

## スコープ（含む / 含まない）

含む:

- `.github/workflows/ci.yml` など current required lint job の再確認
- legacy cleanup 完了後に strict stableKey lint を blocking check へ組み込む
- required status context の名称を branch protection 正本と整合させる

含まない:

- legacy stableKey literal のコード置換
- branch protection の実 PUT 操作
- PR 作成 / push

## リスクと対策

| リスク | 対策 |
| --- | --- |
| required context 名が drift する | aiworkflow-requirements の branch protection current facts と照合する |
| strict gate を早く入れて全 PR を止める | cleanup task の strict 0 violation evidence を前提条件にする |
| CI job がローカル lint と違う | CI command と local command を Phase 11 evidence に両方記録する |

## 検証方法

- `node scripts/lint-stablekey-literal.mjs --strict`
- 対象 workflow の static review
- GitHub Actions dry-run 相当の command trace
- branch protection required context の正本確認

## 完了条件

- strict stableKey lint が required CI path で実行される
- strict mode 0 violation の evidence が保存される
- 03a AC-7 を `fully enforced` として親 workflow / aiworkflow-requirements に同期できる
