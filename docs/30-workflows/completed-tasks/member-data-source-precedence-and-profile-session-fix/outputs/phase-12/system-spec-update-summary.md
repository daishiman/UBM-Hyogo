# System Spec Update Summary（member-data-source-precedence-and-profile-session-fix）

> Step ごとに個別記録する。`workflow_state=implemented_local_runtime_pending` の current facts として記す。

## Step 1-A — workflow-local ドキュメント

| 項目 | 結果 |
|------|------|
| 判定 | **完了** |
| 内容 | Phase 11-13（`phase-11-manual-test.md` / `phase-12-documentation.md` / `phase-13-pr.md`）+ `outputs/phase-11/`（manual-test-result / ui-sanity-visual-review / phase11-capture-metadata.json）+ `outputs/phase-12/` strict 7 を本ワークフロー dir に作成 |
| 整合 | `index.md` / `artifacts.json` / `_shared-context.md`（SSOT §10b CORR-1..8）と用語・パス・Lane 構成が一致 |

## Step 1-B — VISUAL runtime boundary（PNG 0）

| 項目 | 結果 |
|------|------|
| 判定 | **完了** |
| 内容 | VISUAL（Lane D）だが canonical PNG は staging deploy + admin/member login + seeded D1/R2 状態を必要とするため本サイクルでは実 PNG 0 枚。`phase11-capture-metadata.json` の各 capture entry を `status: "pending_runtime_visual"` とし、phase12-compliance の Phase 11 evidence existence 検査では `Status=pending`（存在検査対象外）で記録 |
| screenshots/ | 実 PNG も `.gitkeep` も置かない（空ディレクトリ commit による validator 誤検知回避） |
| 主証跡 | D1 migration verifier / API typecheck / Web typecheck / focused Vitest / D1 contract Vitest が PASS |

## Step 1-C — システム正本仕様（specs/*.md）反映要否

| 項目 | 結果 |
|------|------|
| 判定 | **更新済み** |
| 根拠 | 本タスクは以下の **新規 interface** を導入したため、システム正本仕様へ同一 wave で反映した |

| 新規 interface | 反映先 |
|----------------|------------------|
| `member_field_overrides` テーブル + `member_identities.seed_source` / `seed_imported_at` 列 | `docs/00-getting-started-manual/specs/08-free-database.md`（D1 構成） |
| `PUT /admin/member-fields/:memberId`（admin endpoint） | `docs/00-getting-started-manual/specs/01-api-schema.md`（endpoint surface） |
| 表示プレシデンス（L1 override > L2/L3）の `MeProfile` / public projection 変更 | `01-api-schema.md`（projection 注記）/ `00-overview.md`（3層プレシデンスの概念） |
| import-once provenance（Sheets seed の取込ポリシー） | `08-free-database.md` or sync 仕様の注記 |

> specs/*.md は本サイクルで編集済み。本人更新は Google Form 再回答、管理者確定編集のみ `member_field_overrides`、という境界に統一した。

## Step 2 — global skill sync 要否

| 項目 | 結果 |
|------|------|
| 判定 | **更新済み** |
| 根拠 | 実装仕様書が具体的な apps/packages 変更を要求し、今回サイクルで実装可能だったため、`spec_created` のまま閉じない lesson と aiworkflow 台帳の両方へ反映した |
| 反映先 | `.claude/skills/aiworkflow-requirements/{indexes, references, changelog, LOGS}` / `.claude/skills/task-specification-creator/{references, SKILL-changelog, LOGS}` |

## 不変条件整合（再確認）

| # | 条件 | 整合 |
|---|------|------|
| #1 | 実フォーム schema を固定しすぎない | ✅ 実ラベル準拠是正・汎用 alias 新機構は作らない |
| #2/#3 | consent キー = publicConsent/rulesConsent・responseEmail=system field | ✅ 維持 |
| #4 | admin-managed data 分離 | ✅ L1 override は Form schema 外テーブルに隔離 |
| #5 | D1 直接アクセスは apps/api に閉じる | ✅ web は admin client / fetchAuthed 経由のみ（AC-8） |
| #6 | 新規 test は `*.spec.ts` のみ | ✅ |
| #9/#10 | admin form = FormField / mutation = useAdminMutation | ✅ Lane D |
