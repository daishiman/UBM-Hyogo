# Phase 12 — system spec update summary

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 1. 影響範囲

| 範囲 | 影響 |
|------|------|
| `docs/00-getting-started-manual/specs/` | 影響なし（infra regression のみ） |
| `docs/01-infrastructure-setup/` | 影響なし |
| アプリ動作 | 影響なし（テスト追加のみ） |
| デプロイ pipeline | `.github/workflows/ci.yml` に OpenNext config regression guard を追加 |

## 2. 更新対象 system spec

`.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` に regression guard 節を追加した。OpenNext Workers の意味変更ではなく、既存 invariant（Pages output 禁止 / assets binding / deploy script 禁止 / `.assetsignore`）を CI で機械検証する導線を正本化した。

## 3. 関連 invariant

- CLAUDE.md「`bash scripts/cf.sh deploy` 経由のみ」運用ルール → AC3 で機械化
- UT-06-FU-A 確立の OpenNext Workers 構成 → AC1/AC2/AC4 で機械化

## 4. DoD

- OpenNext 正本に regression guard 導線を追加
- aiworkflow quick-reference / resource-map / task-workflow-active / artifact inventory / changelog / LOGS / lessons を同一 wave で同期
- CLAUDE.md の `wrangler` 直接禁止条項は `apps/web/package.json` deploy script 不在テストで補強
