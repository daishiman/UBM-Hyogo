# Phase 3: 設計レビュー — Issue #57

> NON_VISUAL / 実装仕様書。Phase 4 へ進めるかを判定する。

## 1. 概要

Phase 2 設計が AC を満たし、不変条件・責務境界に矛盾がないかをレビューする。

## 2. 前提条件

Phase 1-2 完了。

## 3. レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 不変条件 #5（D1 直接アクセスは apps/api に閉じる） | PASS | 変更は apps/api 内 + docs のみ。apps/web 非接触 |
| binding 追加禁止（元 Issue スコープ） | PASS | 新規 binding 追加なし。既存 binding の guardrail/degrade と型整合のみ |
| 責務境界（ut-17-followup-002 / UT-12 / UT-13 非侵襲） | PASS | `ALERT_DEDUP_KV` は型 optional 化のみ。R2_BUCKET/SESSION_KV 非接触 |
| degrade の fail-safe 方向 | PASS | 既定=稼働（pause は明示フラグ時のみ）。pause は script-level `status:"paused"` として通常失敗から区別 |
| env 参照規約 | PASS | apps/api は `c.env` 経由（既存規約）。新フラグは `*_PAUSED` 既存命名に整合 |
| CONST_007（1サイクル完了） | PASS | 全 AC が本サイクル内。スコープ外項目は index に理由・実施場所明記済み |

## 4. リスクと対策

| リスク | 影響度 | 対策 |
| --- | --- | --- |
| `ALERT_DEDUP_KV` optional 化で alert-relay 型エラー | 中 | Phase 5 で alert-relay の absence guard を先に確認。guard 不在なら optional 化を保留し別 PR 化 |
| 公式 free-tier 値の変動 | 中 | 実行日に公式 doc 再確認し確認日を併記（runbook の「確認日」欄を必須化） |
| pause フラグが他 export 経路に波及 | 低 | 対象は export-to-r2.ts の 1 ハンドラのみ。GHA d1-backup.yml は本 task 対象外（runbook に別記） |

## 5. 判定

**PASS — Phase 4 へ進む。**

## 6. 成果物

| 成果物 | パス |
| --- | --- |
| 設計レビュー結果 | `outputs/phase-03/main.md` |

## 7. 完了条件

- 全レビュー観点が PASS。
- リスク対策が定義されている。

## 8. 参照資料

- `phase-02.md`
- CLAUDE.md 不変条件 #5


## Skill Template Compatibility


## メタ情報

workflow_id: issue-57-kv-r2-guardrail-degrade-design / phase: 3 / taskType: implementation / visualEvidence: NON_VISUAL

## 目的

KV/R2 guardrail drift と executable degrade を、実装・仕様・証跡の同一 wave で整合させる。

## 実行タスク

- 本文の「実行タスク」または該当する設計・検証セクションを参照。

## 参照資料

本文の「参照資料」セクション、index.md、outputs/artifacts.json を参照。

## 成果物/実行手順

本文の成果物表および outputs/phase-* 配下の対応成果物を参照。

## 完了条件

- [x] 本文の完了条件および artifacts.json の phase status を参照。

## 統合テスト連携

NON_VISUAL のため focused Vitest / typecheck / lint を統合証跡とし、UI screenshot は不要。
