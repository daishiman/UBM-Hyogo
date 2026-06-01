# Phase 9: 品質保証 — Issue #57

> NON_VISUAL / 実装仕様書。

## 1. 概要

lint / typecheck / リンク整合 / mirror parity を一括判定する。

## 2. 前提条件

Phase 5-8 完了。

## 3. 実行タスク

- `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` green。
- docs リンク整合: `cost-guardrail-runbook.md` の参照先（deployment-cloudflare.md / observability-matrix.md）と `deployment-cloudflare.md` のアンカーが切れていない。
- `.claude` 正本を編集した場合は `.agents` mirror parity を `diff -qr` で確認。
- 旧文言除去確認: stale な「R2 binding 未適用 / KV binding 未追加」断定が current inventory へ置換済みであること。

## 4. 成果物

| 成果物 | パス |
| --- | --- |
| 品質レポート | `outputs/phase-09/main.md` |

## 5. 完了条件

- lint/typecheck green・リンク切れ 0・mirror parity OK。

## 6. 参照資料

- `phase-08.md`


## Skill Template Compatibility


## メタ情報

workflow_id: issue-57-kv-r2-guardrail-degrade-design / phase: 9 / taskType: implementation / visualEvidence: NON_VISUAL

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
