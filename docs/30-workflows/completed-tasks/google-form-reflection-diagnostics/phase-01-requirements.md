---
phase: 1
title: 要件定義 — Google Form 反映欠落診断基盤 (Spec-A)
workflow_id: google-form-reflection-diagnostics
status: spec_created
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

## 1. 背景と観察済み症状

UBM 兵庫支部会の現行スタックでは、Google Form 31 項目を ingest job (`apps/api/src/jobs/sync-forms-responses.ts`、cron `*/15 * * * *`) が定期取り込みし、admin / member profile / public ディレクトリの 3 経路で表示する設計が完備している。

しかしユーザー観察により、**3 経路すべてで「31 項目のうち主要項目が反映されていない（空欄 / 旧データ / hidden 表示）」事象**が報告された。実装は揃っているにもかかわらず欠落が 3 経路同時に発生していることから、表示層単独の bug ではなく、上流 (ingest / 本人マッチング / 公開フィルタ / schema alias) のいずれかが構造的に切れていると推定される。

## 2. 仮説 H1-H4

| ID | 仮説 | 想定 root cause |
| --- | --- | --- |
| H1 | ingest 未稼働 | cron worker 未起動 / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` 等の Forms sync secrets / vars 不足 / Forms API 401 / sync-lock 解放漏れ |
| H2 | 本人マッチング切れ | `member_identities` テーブルの email / external_id alias 不一致で profile 経路の本人 row 取得 0 件 |
| H3 | 公開フィルタで全 hidden | `publicConsent=false` または `published=false` が全件にかかり public visible 件数 0 |
| H4 | schema alias 未割当 | 31 項目の `question_id` ↔ field alias mapping が drift し表示側で N 項目が null |

3 経路同時欠落は H1 / H4 を強く示唆するが、H2 / H3 の複合事象もあり得るため **4 仮説を機械的に切り分け可能にする** ことを本 Spec-A の責務とする。

## 3. 目的

staging 環境において、admin が `/admin/sync-status` を開けば H1〜H4 のいずれが該当するか **bool / 数値だけで判別可能** な診断基盤を実装する。

## 4. スコープ

### In-scope

- `apps/api` 配下に `/admin/diagnostics/forms-pipeline` (パイプライン全体集計) と `/admin/diagnostics/member/:id` (1 メンバー診断) の 2 endpoint を新規実装
- `apps/web` 配下に `/admin/sync-status` Server Component + Client island を新規実装
- 既存 admin Member Drawer に診断タブを追加
- contract spec (D1 lane) / unit spec / Playwright env-gated smoke を整備
- gate-metadata / verify:phase12-compliance / indexes:rebuild 整合

### Out-of-scope (CONST_007 例外)

- **H1〜H4 各仮説の修復実装**は本 Spec-A に含めない
- 修復 (cron worker 再配備 / secrets 投入 / member_identities backfill / publicConsent UX 改修 / schema alias backfill 等) はそれぞれ Spec-B / Spec-C / Spec-D / Spec-E として診断結果取得後に新規 Issue 起票する
- D1 schema 変更は禁止 (既存 `sync_jobs` / `member_identities` / `member_responses` / `response_fields` / `schema_diff_queue` などのみ参照)
- Google Form 仕様変更 / 新 endpoint 追加 (`/admin/diagnostics/*` 以外) は禁止
- `apps/web` から D1 binding 直接アクセスは引き続き禁止 (`apps/api` 経由のみ)

## 5. CONST_007 例外明記

CONST_007 (「観察→診断→修復」を 1 ワークフロー内で完結させる原則) に対し、本 Spec-A は **観察と診断基盤の実装のみ** で意図的に閉じる。理由は以下:

1. 観察データ取得前に修復スコープを確定すると、H1〜H4 のいずれが該当するかが未確定のまま修復実装に踏み込むことになり、的外れな修復で破綻するリスクが高い
2. H1 (secrets / cron) と H4 (schema alias backfill) は触る surface area が完全に異なるため、ひとつの PR にまとめると review 負荷と rollback 単位が悪化する
3. 4 仮説それぞれの修復粒度は十分大きく、独立タスクとして起票する方が CONST_005 (単一責務) と整合する

実施場所: 診断結果 (Phase 11 evidence の `forms-pipeline-snapshot.json` / `member-diagnosis.json` / staging screenshot) を踏まえ、`outputs/phase-12/unassigned-task-detection.md` に列挙する Spec-B 候補 4 件のうち該当するものを user 判断で起票する。

## 6. 制約と不変条件

- CLAUDE.md 不変条件 #5 (D1 直接アクセスは `apps/api` に閉じる) を順守
- CLAUDE.md 不変条件 #8 (新規テストは `*.spec.{ts,tsx}` のみ) を順守
- admin endpoint は Auth.js セッション + admin role check で保護
- diagnostic response に **secrets 実値を含めない** (boolean readiness のみ)
- 個人情報は 1 メンバー診断 endpoint で id 指定アクセス時のみ返し、一覧 endpoint には集計値のみ含める

## 7. 受け入れ基準 (Phase 8 DoD で詳細化)

| ID | 要件 |
| --- | --- |
| R-01 | `/admin/diagnostics/forms-pipeline` が 200 で `FormsPipelineSnapshot` を返す |
| R-02 | `/admin/diagnostics/member/:id` が 200 で `MemberDiagnosis` を返す (admin 以外は 401/403) |
| R-03 | `/admin/sync-status` を admin で開き、H1-H4 のうちどれが該当するか画面上で読み取れる |
| R-04 | Member Drawer 診断タブで「この本人が profile 経路に出ない理由」が読み取れる |
| R-05 | contract spec / unit spec / typecheck / lint / playwright (env-gated) 全 green |
| R-06 | gate-metadata:validate / verify:phase12-compliance 全 green |
| R-07 | Spec-B 候補 (H1〜H4 修復) が `outputs/phase-12/unassigned-task-detection.md` に 4 件列挙される |

## 8. 関連ドキュメント

- 既存 ingest: `apps/api/src/jobs/sync-forms-responses.ts`
- 既存 schema: `docs/00-getting-started-manual/specs/01-api-schema.md`
- 既存 admin spec: `docs/00-getting-started-manual/specs/11-admin-management.md`
- CLAUDE.md 不変条件
