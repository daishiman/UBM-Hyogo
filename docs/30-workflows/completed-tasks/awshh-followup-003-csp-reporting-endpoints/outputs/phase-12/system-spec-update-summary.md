# System Spec Update Summary

## Step 1-A: タスク完了記録（implemented_local_evidence_captured）

- aiworkflow-requirements current task inventory に `awshh-followup-003-csp-reporting-endpoints`（implemented_local_evidence_captured / implementation / NON_VISUAL）を追加する（本サイクルで実施）。
- LOGS・SKILL-changelog・indexes を same-wave 更新（本サイクル）。

## Step 1-B: 実装状況テーブル

- 本 workflow を `implemented_local_evidence_captured` として記録（`completed` ではない）。

## Step 1-C: 関連タスクテーブル

- 元 placeholder `awshh-followup-003-reporting-endpoints` を「CONSUMED → awshh-followup-003-csp-reporting-endpoints/」に更新。
- U-AWSHH-001（enforce 切替）の前提タスクとして本 workflow を明示。

## Step 2: system spec 更新（新規 interface 追加に該当）

- 新規 export `buildSentryCspReportUrl` / `buildReportingEndpointsHeader` / `buildReportToHeader` / `SecurityHeaderConfig.reportEndpoint` を追加する。
- 既存公開 env `NEXT_PUBLIC_SENTRY_DSN` を `getPublicEnv()` の public subset に追加する。
- security-headers / CSP 構成を記す system spec へ本サイクルで反映する。

## 不変条件

- #5（D1 直接アクセスは apps/api 経由のみ）: 受信側 SaaS のため不変。
- env アクセス不変条件: 既存 public DSN も getEnv/getPublicEnv 経由。
