# UT-05A-KV-R2-GUARDRAIL-DETAIL-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-05A-KV-R2-GUARDRAIL-DETAIL-001 |
| タスク名 | KV / R2 guardrail detail and executable degrade design |
| ステータス | 未着手 |
| 優先度 | 中 |
| 起票日 | 2026-04-26 |
| 起票元 | `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-12/unassigned-task-detection.md` |

## 1. なぜこのタスクが必要か（Why）

05a では KV / R2 の無料枠を観測対象として整理したが、現行 MVP では利用開始前または binding 未整備の箇所がある。実利用開始後に runbook だけが先行すると、異常時に実行できない degrade 手順が残る。

## 2. 何を達成するか（What）

- KV reads/writes、R2 storage、R2 Class A/B operations の運用閾値を current official limits に合わせる
- 現行 `apps/api` の binding 実装有無を確認する
- 実行可能な degrade 手順、または「手動コード変更が必要」とする明示的な判断を残す
- 05a runbook と正本仕様の表記を同期する

## 3. どのように実行するか（How）

Cloudflare 公式値を再確認し、`wrangler.toml` と `Env` 型を棚卸しする。binding がある場合は操作停止手順を runbook 化し、binding がない場合は未実装前提の運用判断へ戻す。

## 4. 実行手順

1. Cloudflare KV / R2 の無料枠と operation 種別を公式ドキュメントで確認する
2. `apps/api/wrangler.toml` と API `Env` 型を確認する
3. binding 有無ごとに degrade 手順を分ける
4. `deployment-cloudflare.md` と 05a runbook を更新する
5. Phase 11/12 証跡と validator 結果を残す

## 5. 完了条件チェックリスト

- [ ] KV / R2 の current limit が正本仕様に記録されている
- [ ] binding 有無がコード実体と一致している
- [ ] 実行できない手順が runbook から除去または注記されている
- [ ] 05a / 05b の handoff に反映済み

## 6. 検証方法

```bash
rg -n "KV|R2|Class A|Class B|FEATURE_" apps .claude/skills/aiworkflow-requirements/references docs/05a-parallel-observability-and-cost-guardrails
```

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| 公式値の変更 | 実行日に公式値を再確認し、確認日を文書に残す |
| binding 未実装なのに実行可能と誤記 | `wrangler.toml` と `Env` 型の実体確認を完了条件にする |

## 8. 参照情報

- `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- Cloudflare KV / R2 official documentation

## 9. 備考

05a の完了をブロックしない。KV / R2 を本格利用する前に実施する。
