---
phase: 11
title: Evidence inventory
workflow_id: admin-ui-prototype-alignment-followup-002-section-error-retry
status: spec_created
---

# Phase 11: Evidence inventory ledger

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `admin-ui-prototype-alignment-followup-002-section-error-retry` |
| phase | 11 |
| status | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |

## 目的

Evidence inventoryの責務を、既存本文の詳細に従って実装サイクルで迷わず実行できる状態に固定する。

## 実行タスク

1. 本 Phase の既存本文に定義された要件・手順・判定表を実装時の入力として確認する。
2. Phase 間の依存順序を守り、前 Phase の完了条件を満たしてから次へ進む。
3. 差分が発生した場合は Phase 11 evidence と Phase 12 strict 7 へ同一 wave で同期する。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本ファイル: `phase-11-manual-test.md`
- 関連 evidence: `outputs/phase-11/` / `outputs/phase-12/`

## 完了条件

- [ ] 本 Phase の既存本文にある必須項目が実装サイクルの入力として確認されている。
- [ ] 参照 path と artifact ledger に矛盾がない。
- [ ] 後続 Phase の完了条件へ接続できる。

## 統合テスト連携

- 実装サイクルでは Phase 10 の focused unit / axe / grep gate を Phase 11 evidence として保存する。
- 本 Phase 自体は仕様書段階のため、実行ログは `outputs/phase-11/` に取得後追記する。

---


## 1. 概要

本タスクは `visualEvidence: NON_VISUAL` のため、visual / runtime screenshot evidence は持たない。代わりに「unit test 結果 / axe 結果 / grep 結果」の 3 種類 + メタログを Phase 11 evidence として保管する。

## 2. evidence inventory（canonical path）

| # | path | 種別 | 取得手段 | サイズ要件 |
|---|------|------|----------|----------|
| 1 | `outputs/phase-11/main.md` | summary | 手動記述（本タスク完了 sign-off） | > 0 |
| 2 | `outputs/phase-11/evidence-inventory.md` | ledger | 本ファイルのコピー / リンク | > 0 |
| 3 | `outputs/phase-11/unit-test-result.md` | vitest log | Phase 10 §3 のコマンド | > 0 |
| 4 | `outputs/phase-11/axe-result.md` | axe scan log | vitest-axe または playwright axe | > 0 |
| 5 | `outputs/phase-11/grep-use-client-result.md` | grep log | Phase 10 §3 のコマンド | > 0 |

> path は本 workflow root（`docs/30-workflows/admin-ui-prototype-alignment-followup-002-section-error-retry/`）からの相対パス。

## 3. 各 evidence の内容契約

### 3.1 `main.md`

- 本タスクの完了 sign-off ステートメント（実装日・実装者・全 AC pass 宣言）
- 11 page 差し替え対象の実数確認（11 / それ以外）
- Gate-B / Gate-C の `passed_at` を ISO 8601 で記載

### 3.2 `unit-test-result.md`

- vitest の最終 exit code と test summary
- `AdminSectionError.spec.tsx` の既存 case 数 + 追加 regression case 数
- `AdminSectionErrorClient.spec.tsx` の case 数（Phase 6 §3 AC-1..AC-8）

### 3.3 `axe-result.md`

- axe 実行のレポート（critical violation 0 を明示）
- scan 対象セレクタ（`[data-testid="admin-section-error"]`）

### 3.4 `grep-use-client-result.md`

- `(admin)/admin/**/page.tsx` に `"use client"` が新規追加されていないことを示す grep 出力
- HEX 直書きがないことを示す grep 出力

## 4. evidence validator 期待

`verify-phase12-compliance` の evidence existence validator が §2 の 5 path を全件チェックする。サイズ 0 または不存在は fail。

## 5. 配置タイミング

- Gate-A（spec_review）: 本ファイル自体の存在のみで pass（実 evidence ファイルは spec 段階では空 placeholder 不要）
- Gate-B（implementation_review）: §2 の 5 ファイル全件配置完了が pass 条件
- Gate-C（external_ops）: PR / merge の URL を `main.md` に追記し sign-off

## 6. 物理ファイル管理ポリシー

- evidence は git にコミット必須（CI artifact のみ管理は不採用）
- 大規模ログ（>200KB）は要約版を保管し、フル版は CI artifact に retain
- 認証後 admin ログは secret を含まないこと（correlationId のみ可、トークン値は redact）
