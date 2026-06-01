# Phase 13: PR作成 — Issue #57

> NON_VISUAL / 実装仕様書。**user の明示承認後のみ**実施。

## 1. 概要

base=`dev` で PR を作成する。CLOSED/OPEN に関わらず Issue 状態は変更せず本文に `Refs #57` を記す（`Closes/Fixes/Resolves` は使わない）。

## 2. 前提条件

Phase 1-12 完了 + ユーザーの明示承認。

## 3. 実行タスク（承認後）

- `git add` → commit（Co-Authored-By 付与）。
- `gh pr create --base dev`（本文に AC・変更ファイル・degrade 手順・`Refs #57`）。

## 4. 完了条件

- PR URL が記録される（承認前は blocked）。

## 5. 参照資料

- `.claude/commands/ai/diff-to-pr.md`


## Skill Template Compatibility


## メタ情報

workflow_id: issue-57-kv-r2-guardrail-degrade-design / phase: 13 / taskType: implementation / visualEvidence: NON_VISUAL

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
