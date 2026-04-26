# Phase 4: 事前検証手順 — 主成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 状態 | completed |
| 完了日 | 2026-04-26 |

## 事前検証コマンド

```bash
# 1. 変更範囲確認（scope 外 drift がないか）
git diff --stat -- docs/05a-parallel-observability-and-cost-guardrails

# 2. 主要語の横断確認
rg -n "dev|main|D1|Sheets|1Password" docs/05a-parallel-observability-and-cost-guardrails

# 3. outputs パス確認
find docs/05a-parallel-observability-and-cost-guardrails/outputs -type f | sort
```

## 期待出力表

| 検証 | PASS 条件 | 結果 |
| --- | --- | --- |
| 変更範囲確認 | scope 外 drift (apps/ 等) なし | PASS — docs/ 内のみ |
| 主要語確認 | dev/main が一貫して使われている | PASS |
| outputs パス確認 | phase-01〜04 に main.md が存在 | PASS |
| secret 漏洩確認 | 実値が docs に書かれていない | PASS |

## 正本仕様参照確認

| 参照 | 確認内容 | 結果 |
| --- | --- | --- |
| deployment-cloudflare.md | 無料枠数値が一致するか | PASS — Pages 500/月, Workers 100k/日 等を参照済み |
| deployment-core.md | rollback 手順が一致するか | PASS — CF ダッシュボード 1クリック手順を採用 |
| environment-variables.md | secret 置き場所が一致するか | PASS — CF Secrets + GH Secrets 設計を踏襲 |

## 依存確認

| 種別 | 対象 | 状態 |
| --- | --- | --- |
| 上流 | 04-serial-cicd-secrets-and-environment-sync | 完了前提（secret 設計を参照） |
| 上流 | 03-serial-data-source-and-storage-contract | 完了前提（D1 canonical を参照） |
| 下流 | 05b-parallel-smoke-readiness-and-handoff | Phase 10-12 で同期 |

## downstream handoff

Phase 5 (セットアップ実行) に以下を引き継ぐ:
- 事前検証結果 PASS
- cost-guardrail-runbook.md の草案作成依頼
