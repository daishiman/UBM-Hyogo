# ドキュメント変更記録: issue-1029 public member photo display

> **[実装区分: 実装仕様書]**。本 workflow は `implemented_local_runtime_pending`。本サイクルでは workflow docs、写真公開 policy ADR、aiworkflow-requirements 逆引き索引、apps/packages 実コード、focused tests を同一 wave で反映した。

---

## 全体方針

本サイクルは implementation workflow として、shared schema/types、API repository/use-case/route、web UI adapter/component まで実装した。システム仕様本体（`docs/00-getting-started-manual/specs/`）と aiworkflow-requirements 索引も実装済み状態へ同一 wave で更新した。

## Step 1-A: 完了タスク記録

- 結果: **記録済**。`outputs/phase-12/system-spec-update-summary.md` Step 1-A に「issue-1029 local implementation 完了 / workflow_state=implemented_local_runtime_pending / code 変更あり」を記録した。
- ドキュメント実体変更: 本 workflow 配下の Phase 12 成果物、写真公開 policy ADR、aiworkflow-requirements 索引。

## Step 1-B: 実装状況テーブル

- 結果: **記録済**。`system-spec-update-summary.md` Step 1-B に 7 サブ領域すべて `implemented_local_runtime_pending` を記録した。
- ドキュメント実体変更: 同上（workflow 配下のみ）。

## Step 1-C: 関連タスク

- 結果: **記録済**。#983（完了・再利用元）/ #983-followup-001（self-upload・別タスク）/ #983-followup-003（transcode・別タスク）を `system-spec-update-summary.md` Step 1-C に記録した。
- ドキュメント実体変更: なし（関連タスクの状態記録のみ）。

## Step 2: 新規インターフェース追加

- 結果: **反映済み（implemented_local_runtime_pending 境界つき）**。public `photoUrl: z.string().url().optional()` の implemented contract と写真公開 gate を `api-endpoints.md` / `16-member-photo-public-exposure.md` / aiworkflow index に記録した。
- ドキュメント実体変更: `docs/00-getting-started-manual/specs/16-member-photo-public-exposure.md`、`.claude/skills/aiworkflow-requirements/references/api-endpoints.md`、quick-reference / resource-map / task-workflow-active / artifact inventory / changelog / LOGS。

## システム仕様本体（specs/）への変更

- 結果: **作成済み**。`docs/00-getting-started-manual/specs/16-member-photo-public-exposure.md`（写真公開ポリシー ADR）を実体化し、gate / TTL 300s / R2 read timing / Cache-Control boundary を記録した。

## CLAUDE.md / 不変条件への変更

- 結果: **該当なし**。invariant #5（D1/R2 は apps/api）/ #11（admin 分離）/ Google Form schema 不変はすべて維持。新規不変条件の追加なし。

## 作成・更新ファイル一覧（本サイクル）

| パス | 種別 |
|------|------|
| `phase-12.md` | Phase 12 仕様書 |
| `phase-13.md` | Phase 13 仕様書 |
| `outputs/phase-12/main.md` | サマリ |
| `outputs/phase-12/implementation-guide.md` | 実装ガイド |
| `outputs/phase-12/system-spec-update-summary.md` | 仕様反映計画 |
| `outputs/phase-12/documentation-changelog.md` | 本ファイル |
| `outputs/phase-12/unassigned-task-detection.md` | 未割当タスク検出 |
| `outputs/phase-12/skill-feedback-report.md` | skill フィードバック |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 準拠チェック |
| `docs/00-getting-started-manual/specs/16-member-photo-public-exposure.md` | 写真公開 policy ADR |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-1029-public-member-photo-display-artifact-inventory.md` | aiworkflow artifact inventory |
| `.claude/skills/aiworkflow-requirements/changelog/20260531-issue-1029-public-member-photo-display-spec.md` | aiworkflow changelog |

> 上記以外（Phase 1-3 / phase-4 / phase-8 / outputs/phase-1 / artifacts.json）は先行サブエージェントが作成済み。
