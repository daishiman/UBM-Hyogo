# Phase 8: リファクタ

## 8.1 リファクタ対象

本タスクは「追加挿入のみ」のため、既存 YAML ロジックのリファクタは行わない。

## 8.2 整理項目（任意・小規模）

- 既に top-level permissions を持つ workflow（`ci.yml`, `runtime-smoke-staging.yml`, `audit-correlation-verify.yml` 等）の権限値が過剰でないか軽く確認。過剰がなければ「過剰なし」と Phase 9 QA に記録するのみ。**コード変更は行わない**（スコープ拡大防止）。
- 既存 job-level 宣言を **触らない**（CONST_007 単一サイクル維持）。

## 8.3 命名・スタイル整合

- 挿入する `permissions:` ブロックの YAML インデントは 2 スペース（既存 `ci.yml:15-16` と同じ）。
- ブロック前後を 1 空行で囲い、既存 `on:` ブロック・`jobs:` ブロックとの視認性を確保する。
