---
phase: 8
title: DoD — 診断基盤の完了条件と CONST_007 例外
workflow_id: google-form-reflection-diagnostics
status: spec_created
---

# Phase 8 — Definition of Done

[実装区分: 実装仕様書]

## 1. DoD 一覧

| ID | 条件 | 確認方法 |
| --- | --- | --- |
| D-01 | `apps/api/src/diagnostics/forms-pipeline.ts` / `member-diagnosis.ts` が新規追加されている | `git ls-files \| grep diagnostics` |
| D-02 | `apps/api/src/index.ts` に `/admin/diagnostics/*` route mount が追加されている | `grep diagnostics apps/api/src/index.ts` |
| D-03 | `apps/web/app/(admin)/admin/sync-status/page.tsx` が追加されている | 同上 |
| D-04 | Member Drawer の診断タブが既存タブを破壊せず動作する | typecheck + visual diff |
| D-05 | typecheck / lint / unit / contract spec すべて green | Phase 7 G-01〜G-05 |
| D-06 | verify:phase12-compliance / gate-metadata:validate green | G-06 / G-07 |
| D-07 | indexes:rebuild 冪等 | G-08 |
| D-08 | secrets 実値が response に含まれない | contract spec C-FP-05 |
| D-09 | staging deploy 後、admin が `/admin/sync-status` を開いて **H1-H4 のどれが該当するか bool / 数値で判別可能** | user 視認 (G-R-01) |
| D-10 | Member Drawer 診断タブで本人 H2-H4 が読み取れる | user 視認 |
| D-11 | `outputs/phase-12/unassigned-task-detection.md` に Spec-B 候補 4 件 (H1〜H4 修復) が列挙され、各候補に診断結果トリガ条件が明記されている | 物理ファイル + 内容確認 |
| D-12 | commit / push / PR は user 明示承認後のみ実施 | runtime_boundary |

## 2. CONST_007 例外明記 (再掲)

本 Spec-A は **「観察 → 診断基盤実装」までで意図的に閉じる**。CONST_007 (観察→診断→修復を 1 ワークフローで完結) に対する例外として以下を明記:

- **修復は本 Spec-A の DoD に含めない**。修復実装 (H1〜H4 のいずれか / 複数) は Spec-B 以降として新規 Issue / ワークフローを起票する
- 理由:
  1. 観察データ取得前に修復スコープを確定すると、4 仮説のうち実際に該当するもの以外まで触ってしまい破綻する
  2. H1 (cron / secrets) と H4 (alias backfill) は touch surface が完全に異なるため、1 PR にまとめると review / rollback 単位が悪化
  3. 4 仮説の修復粒度は単独 PR に値する規模であり、CONST_005 (単一責務) と整合する
- 実施場所: `outputs/phase-12/unassigned-task-detection.md` に Spec-B 候補 4 件 (H1〜H4 修復) を列挙し、診断結果を受けて user 判断で起票

## 3. Spec-B 起票準備

| 候補 | 起票条件 (Phase 11 evidence から確認) | 主な surface |
| --- | --- | --- |
| Spec-B (H1 修復) | `hypothesisFlags.H1_ingestNeverRanOrAllErrors=true` | cron worker / secrets / sheets-auth-classifier |
| Spec-C (H2 修復) | `identityHealth.identitiesWithoutMember > 0` または member 別診断で `H2_identityMissing=true` 多発 | `member_identities` backfill / matching logic |
| Spec-D (H3 修復) | `publicVisibility.allHiddenByPublishState=true` | profile UX (publicConsent CTA) / admin republish flow |
| Spec-E (H4 修復) | `aliasPendingCount > 0` | `schema_diff_queue` resolve / schema sync job |

## 4. runtime boundary

staging deploy / runtime evidence capture / Spec-B 起票 / commit / push / PR は **すべて user-gated**。Claude Code は本 Spec-A の範囲内で spec / 実装コードのローカル準備までを担当し、上記運用は user 明示承認後にのみ着手する。
