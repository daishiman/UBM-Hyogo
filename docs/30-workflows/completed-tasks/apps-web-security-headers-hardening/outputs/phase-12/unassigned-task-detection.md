# Phase 12: 未タスク検出

## Formalized Follow-up Candidates

| ID | 内容 | 理由 | 実施時期 / 場所 |
|------|------|------|------|
| U-AWSHH-001 | CSP enforce 切替 | report-only 観測後でないと production 互換性判断が破綻する | staging/production report 観測後に `docs/30-workflows/unassigned-task/` へ昇格 |
| U-AWSHH-002 | CSP nonce 化 | Next.js inline script 互換性と広範囲 template 変更が必要 | CSP report 観測後 |
| U-AWSHH-003 | Reporting-Endpoints / Report-To 集約 | 受信 endpoint / retention / privacy 方針の合意が必要 | observability 設計 wave |
| U-AWSHH-004 | `apps/api` response header hardening | `apps/web` と独立した API surface のため別 workflow | API security hardening wave |

今回 cycle で完了可能な `apps/web` 実装・仕様同期は完了済み。上記は外部 runtime 観測または別 surface 合意が必要なため user-gated follow-up として扱う。
