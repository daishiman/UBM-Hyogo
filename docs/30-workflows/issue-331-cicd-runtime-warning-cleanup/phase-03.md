# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-331-CICD-WARNING-001 |
| Phase | 3 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 設計の妥当性を代替案比較で検証する。

## 代替案比較

### S1: top-level [vars] の扱い

| 案 | 内容 | 評価 |
| --- | --- | --- |
| A（採用） | top-level `[vars]` 完全削除 | warning ゼロ・認知負荷最小・一次正本明確 |
| B | local-dev 用最小集合のみ残す（`ENVIRONMENT="local"` 等） | warning は出続ける可能性。差分管理コスト増 |
| C | top-level を正本にして env vars を削除 | wrangler 仕様で env 継承不可のため不可 |

→ **採用: A**

### S2: web-cd.yml の deploy 経路

| 案 | 内容 | 評価 |
| --- | --- | --- |
| A（採用） | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <env>` | CLAUDE.md 不変条件と整合、ローカル/CI の経路統一 |
| B | `cloudflare/wrangler-action@v3` で `command: deploy --env <env>` | action 経由のため Token / esbuild 解決の自前管理が必要、ラッパー不変条件違反 |
| C | OpenNext 公式 deploy action | 採用実績薄、CLAUDE.md 不変条件違反 |

→ **採用: A**

## レビュー判定

| 観点 | 判定 |
| --- | --- |
| 設計の網羅性 | PASS |
| 不変条件整合 | PASS |
| 代替案検討 | PASS |
| リスク識別 | MINOR（後述） |

## 識別リスク

1. **MINOR**: staging Pages project (`<...>-staging`) が Workers 移行後にスタックする → Phase 11 で削除手順を runbook 化
2. **MINOR**: 現行 workflow は `CLOUDFLARE_API_TOKEN` を継続利用し、step-scoped `CF_TOKEN_*` は target contract 段階 → OIDC / token split タスクへ境界を分離
3. **MINOR**: `CLOUDFLARE_PAGES_PROJECT` Variable が未参照になる → 削除起票（Phase 12）

## 完了条件

- [ ] 代替案 A/B/C の評価が記載されている
- [ ] リスクが MINOR 以下に収まっている
- [ ] 後続 Phase（4-5）への要請が明確

## 成果物

- `outputs/phase-03/main.md`

## 実行タスク

- 対象 Phase の判断、設計、検証、または証跡作成を実行する。
- `apps/api/wrangler.toml` / `.github/workflows/web-cd.yml` / aiworkflow 正本との整合を確認する。

## 参照資料

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/index.md`
- `apps/api/wrangler.toml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

NON_VISUAL CI/CD 設定タスクのため、統合テストは static grep、typecheck、wrangler dry-run、GitHub Actions run evidence で代替する。runtime deploy は user approval 後に実行する。

