# Phase 12 サマリ索引

- task_id: `public-home-member-card-info-and-tag-clarity`
- status: **implemented_local_evidence_captured**（コード実装・focused tests・local visual PNG・仕様反映まで完了。staging screenshot / PR は user-gated）
- taskType: `implementation` / visualEvidence: `VISUAL`

## 成果物一覧（phase12_strict_outputs と完全一致）

| ファイル | 役割 | 要点 |
| --- | --- | --- |
| `main.md` | 本索引 | Phase 12 全成果物のサマリ |
| `implementation-guide.md` | 実装ガイド | Part 1（中学生レベル）+ Part 2（技術者レベル）。視覚証跡参照 |
| `system-spec-update-summary.md` | 仕様更新反映 | Step1-A/1-B/1-C/Step2。Step2=反映済み（businessSummary） |
| `documentation-changelog.md` | changelog | 全 Step 結果。workflow-local / global sync を別ブロック |
| `unassigned-task-detection.md` | 未タスク検出 | 0 件。current/baseline 分離・関連タスク差分確認 |
| `skill-feedback-report.md` | skill feedback | 改善点なし（出力必須） |
| `phase12-task-spec-compliance-check.md` | compliance | canonical 見出し / 6 タスク / 成果物突合 root evidence |

## AC trace 要約

- AC-1（矢印正規化）/ AC-7（TagPicker 正規化）: `tag-display.ts` の `normalizeTagLabel`。
- AC-2 / AC-6（category 優先・region/role/status 非表示）: `selectCardTags`。
- AC-3（expand=tags）: `toApiQuery` で常時付与。
- AC-4（curated タグ chip 行）: `MemberCard` + `phaseTone`。
- AC-5（businessSummary）: API `SUMMARY_KEYS` + zod optional。**仕様反映要（Step2）**。
- AC-8（OKLch トークン・HEX 禁止）: `verify:tokens` gate。
- AC-9（既存 endpoint surface のみ・1 サイクル）: surface 不変・Lane A+B 同一サイクル。

## ゲート状態

- Gate-A（spec_review）: passed。
- Gate-B（implementation_review）: passed（focused Vitest 6 files / 50 tests PASS + local visual PNG captured。staging screenshot は user-gated）。
- Gate-C（external_ops）: pending（commit/push/PR/staging baseline は user-gated）。
