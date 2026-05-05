# Phase 1 — 要件定義

## Why
03b-followup-005 (#198) で runtime SSOT 実体は完了。残スコープは ADR 化 / owner 表登録 / contract test 網羅性確認 / unassigned ステータス解消。

## What
- ADR-001 (runtime SSOT `apps/api` 維持 / `packages/shared` 不採用) を `_design/sync-jobs-spec.md` に追記
- owner 表に `sync-jobs-schema.ts` 行追加
- §2 / §3 / §5 に owner 表 1-hop 参照追記
- contract test の email 形式値拒否ケース追加
- unassigned-task status を resolved に更新
- indexes 再生成

## 不変条件
- INV-1: TS 実装本体は変更しない（test とエラーメッセージ強化のみ）
- INV-2: DDL / migration 変更なし
- INV-3: CLAUDE.md 不変条件 5「D1 アクセスは apps/api に閉じる」に従う
- INV-4〜7: 既存テスト破壊禁止 / SyncJobKind 値後方互換 / 用語 alias / D 差分 guard

## AC マッピング
AC-1〜AC-8 は index.md に定義済み。Phase 6/7/8/9 で実装 / Phase 11 で evidence 収集。

## 4 条件評価
価値性 PASS / 実現性 PASS / 整合性 PASS / 運用性 PASS。

## open question
- Q1: ADR 配置位置 → §1 直下の "## ADR-001" として確定
- Q2: owner / co-owner = 03a / 03b として確定
- Q3: AC-4 の email 形式拒否は不足 → Phase 7 で追加

## L-001〜L-005 適用方針
- L-001: runtime spec は `apps/api` 配下、governance は `_design/`
- L-002: D 差分なし
- L-003: owner 表更新時に Phase 11 で 5 列 schema / 1-hop 到達 grep evidence 収集
- L-004: Phase 12 strict 7 ファイル
- L-005: 冒頭 alias 表挿入済み
