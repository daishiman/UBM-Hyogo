# [#248] [UT-06-FU-A-R2-CACHE-001] OpenNext R2 incremental cache 採用判断

## メタ情報

```yaml
issue_number: 248
title: [UT-06-FU-A-R2-CACHE-001] OpenNext R2 incremental cache 採用判断
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/248
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

OpenNext on Cloudflare の R2 incremental cache を将来導入するかの判断と設計。UT-12 R2 binding 完了後に bundle size / cost / 配信機能の観点で採用可否を決定する。MVP では不要。

## 検出元

- 親タスク: UT-06-FU-A (OpenNext Workers migration)
- 検出 Phase: UT-06-FU-A Phase 12 unassigned-task-detection (UNASSIGNED-FU-A-001)

## 仕様書

- `docs/30-workflows/unassigned-task/UT-06-FU-A-R2-incremental-cache-decision.md`

## 親タスクの実装ガイド

- `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/outputs/phase-12/implementation-guide.md`

## 想定 AC

1. UT-12 完了後の R2 bucket / binding / CORS の current facts 確認結果を記録
2. OpenNext incremental cache 設定の staging smoke 結果
3. 採用 / 見送りの判断と必要な設定差分・コスト評価
4. CLAUDE.md 不変条件 #5（D1 直接アクセスは apps/api に閉じる）と R2 境界の整合（apps/web 直 binding は禁止）

## 苦戦箇所

- UT-12 R2 binding 完了前に同時導入すると binding 責務・bundle・cost 判断が混ざる
- apps/web に R2 binding を置くと D1/R2 境界の正本仕様（apps/api 経由原則）が崩れる
- UT-12 後に判断分離することが将来の同種統合課題（R2 / KV / D1 の binding 責務）を簡潔に解決する要点

## スコープ

- 含む: 採用可否判断・必要な設定差分・コスト評価
- 含まない: UT-06-FU-A 内での即時 R2 binding 追加

## 着手前提

- UT-12 R2 設定完了
- トラフィック増加 / bundle size 余裕の根拠

## 優先度

LOW（MVP 不要・UT-12 後続）。
