# [#258] [U-1] Turborepo / Nx 導入による coverage cache（affected graph）

## メタ情報

```yaml
issue_number: 258
title: [U-1] Turborepo / Nx 導入による coverage cache（affected graph）
state: OPEN
priority: 低
scale: 大規模
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/258
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 大規模 |
| ステータス | 未実施 |

---

## 概要

coverage-80-enforcement で採用した `coverage-guard.sh --changed` の git diff ベース軽量化を、Turborepo or Nx の affected graph による coverage cache へ昇格させる。

## 背景・課題

- `--changed` は git diff ベースで依存波及を追えない
- 依存 package の変更で間接的な coverage regression を見逃すリスク
- 大規模化に伴い `pnpm -r test:coverage` 全件実行コストが増大

## 苦戦箇所

`coverage-guard.sh --changed` は git diff ベースで軽量だが、依存波及や cache hit/miss の再現性は保証しない。Turborepo / Nx 導入は build system 全体の変更を伴い、coverage 単独での導入では over-engineering。pnpm workspace + lefthook + Cloudflare Workers ビルドとの相性確認、既存 ci.yml topology との整合（UT-CICD-WORKFLOW-TOPOLOGY-DRIFT）が課題。Nx と Turborepo の affected 検知精度差も比較必要。

## 受入条件 (AC)

1. ビルドシステム選定（Turborepo / Nx）ADR 確定
2. `turbo.json` or `nx.json` に coverage タスクの dependsOn / outputs / cache 定義
3. CI で affected only / full モード切替可能
4. coverage-guard.sh が両モードに対応
5. CI 実行時間が baseline 比 X% 削減

## 起動条件

monorepo 規模が現状の 2〜3 倍に増えた時点、または CI 実行時間が許容上限到達時。

## 参照

- 仕様書: `docs/30-workflows/unassigned-task/task-turborepo-coverage-cache-001.md`
- 検出ログ: `docs/30-workflows/coverage-80-enforcement/outputs/phase-12/unassigned-task-detection.md` の U-1
- 関連: `docs/30-workflows/unassigned-task/ut-cicd-workflow-topology-drift-001.md`
