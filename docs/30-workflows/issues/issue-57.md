# [#57] [UT-05A-KV-R2] KV / R2 guardrail detail and executable degrade design

## メタ情報

```yaml
issue_number: 57
title: [UT-05A-KV-R2] KV / R2 guardrail detail and executable degrade design
state: OPEN
priority: 中
scale: -
category: 要件
status: -
created_date: 2026-04-26
updated_date: 2026-04-26
url: https://github.com/daishiman/UBM-Hyogo/issues/57
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要

05a では KV / R2 の無料枠を観測対象として整理したが、現行 MVP では利用開始前または binding 未整備の箇所がある。実利用開始後に runbook だけが先行すると、異常時に実行できない degrade 手順が残る。KV reads/writes、R2 storage、R2 Class A/B operations の運用閾値を current official limits に合わせ、実行可能な degrade 手順を整備する。

## スコープ

### 含む
- KV reads/writes、R2 storage、R2 Class A/B operations の運用閾値を current official limits に合わせる
- 現行 `apps/api` の binding 実装有無の確認
- 実行可能な degrade 手順、または「手動コード変更が必要」とする明示的な判断の記録
- 05a runbook と正本仕様の表記同期

### 含まない
- KV / R2 の本格実装（利用開始前の整備が目的）
- Wave 1 コア機能の実装

## 完了条件

- [ ] KV / R2 の current limit が正本仕様に記録されている
- [ ] binding 有無がコード実体と一致している
- [ ] 実行できない手順が runbook から除去または注記されている
- [ ] 05a / 05b の handoff に反映済み

## 参照資料

- 仕様書: docs/unassigned-task/ut-05a-kv-r2-guardrail-detail-001.md
- docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md
- Cloudflare KV / R2 official documentation

🤖 Generated with [Claude Code](https://claude.com/claude-code)
