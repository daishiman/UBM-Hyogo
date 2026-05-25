# [#206] [UT-GOV-002-OBS] secrets 棚卸し自動化（Cloudflare/GitHub 横断）

## メタ情報

```yaml
issue_number: 206
title: [UT-GOV-002-OBS] secrets 棚卸し自動化（Cloudflare/GitHub 横断）
state: OPEN
priority: 中
scale: 小規模
category: セキュリティ
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/206
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

Cloudflare Secrets / GitHub Secrets / GitHub Variables の 3 系統を横断する secrets 棚卸し列挙ロジックを自動化する observability / governance タスク。rotate 自動化はスコープ外。

仕様書: `docs/30-workflows/unassigned-task/UT-GOV-002-OBS-secrets-inventory-automation.md`
上流: `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-6/failure-cases.md`
発見元: outputs/phase-12/unassigned-task-detection.md U-3

## スコープ

- 棚卸し列挙ロジック（Cloudflare / GitHub Secrets / Variables 横断）
- dry-run mode で実値を log に流さない実装
- 1Password 参照のみで動作する設計（`scripts/with-env.sh` 経由）

含まない: rotate の自動化

## 苦戦ポイント

- Cloudflare Secrets / GitHub Secrets / GitHub Variables の 3 系統横断
- secrets 値が log に流れる事故の防止

## 検証方法

- 1Password 参照のみで動作するかを `scripts/with-env.sh` 経由で確認
- dry-run mode の出力に実値が混入しないことの grep 検査
