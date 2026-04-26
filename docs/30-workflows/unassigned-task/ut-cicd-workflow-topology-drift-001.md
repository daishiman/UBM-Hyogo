# UT-CICD-WORKFLOW-TOPOLOGY-DRIFT-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-CICD-WORKFLOW-TOPOLOGY-DRIFT-001 |
| タスク名 | CI/CD workflow topology and deployment spec drift cleanup |
| ステータス | 未着手 |
| 優先度 | 高 |
| 起票日 | 2026-04-26 |
| 起票元 | `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-12/unassigned-task-detection.md` |

## 1. なぜこのタスクが必要か（Why）

05a の GitHub Actions cost guardrail は workflow 実体を前提にしている。正本仕様が `web-cd.yml` や古い Node / pnpm 前提を残し、実体が `ci.yml` / `validate-build.yml` 中心だと、監視対象と停止判断を誤る。

## 2. 何を達成するか（What）

- `.github/workflows/` の現行 workflow 名、Node、pnpm、job 構成を棚卸しする
- `deployment-gha.md` と 05a の監視対象を current facts に同期する
- Cloudflare deploy target の Pages / Workers / OpenNext 表記を `apps/web/wrangler.toml` と照合する
- 05a が Pages build budget を監視する前提と、正本仕様の OpenNext Workers 方針の差分を整理する

## 3. どのように実行するか（How）

コード実体を正とした差分表を作り、正本仕様を更新する。実装変更が必要な場合は別 Phase で workflow を直し、docs-only で閉じない。

## 4. 実行手順

1. `.github/workflows/*.yml` を一覧化する
2. Node / pnpm / job / deploy target を抽出する
3. `deployment-gha.md`、`deployment-cloudflare.md`、05a成果物を比較する
4. `apps/web/wrangler.toml` の `pages_build_output_dir = ".next"` と OpenNext Workers 記述のどちらを current deploy contract にするか決める
5. 仕様だけで直せる差分と workflow 実装が必要な差分を分ける
6. Phase 12 close-out と LOGS を更新する

## 5. 完了条件チェックリスト

- [ ] GitHub Actions workflow 名が正本仕様と一致している
- [ ] Node / pnpm バージョン表記が実体と一致している
- [ ] deploy target が `apps/web/wrangler.toml` と一致している
- [ ] 05a の monitoring target が存在する workflow だけを指している
- [ ] Pages builds と Workers Builds / OpenNext のどちらを無料枠監視対象にするかが明確

## 6. 検証方法

```bash
rg -n "node-version|pnpm|web-cd|ci.yml|validate-build|wrangler|pages_build_output_dir" .github apps/web .claude/skills/aiworkflow-requirements/references docs/05a-parallel-observability-and-cost-guardrails
```

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| docs だけ直して実装差分を放置する | workflow 実装が必要な差分は別タスク化する |
| 05a の cost guardrail が存在しない workflow を監視する | workflow 名の実在確認を完了条件にする |

## 8. 参照情報

- `.github/workflows/`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md`

## 9. 備考

05a の文書整合は現ターンで補正する。workflow 実装そのものの変更はこの未タスクで扱う。
