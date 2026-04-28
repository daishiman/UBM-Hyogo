# Documentation Changelog

本タスクで生成・更新されたドキュメントの全変更履歴。AC-7 トレース起点。

## 変更履歴

| Date | 種別 | 変更概要 | ファイル |
| --- | --- | --- | --- |
| 2026-04-28 | new | タスク仕様書 root 作成 | `index.md`, `artifacts.json` |
| 2026-04-28 | new | Phase 1〜13 仕様書 | `phase-01.md` 〜 `phase-13.md` |
| 2026-04-28 | new | Phase 1 outputs（要件定義） | `outputs/phase-1/main.md` |
| 2026-04-28 | new | Phase 2 outputs（設計） | `outputs/phase-2/{main,file-layout,fragment-schema,render-api,gitattributes-pattern}.md` |
| 2026-04-28 | new | Phase 3 outputs（設計レビュー） | `outputs/phase-3/{main,impact-matrix,backward-compat}.md` |
| 2026-04-28 | new | Phase 4 outputs（テスト設計） | `outputs/phase-4/{main,parallel-commit-sim,merge-conflict-cases}.md` |
| 2026-04-28 | new | Phase 5 outputs（A-1 runbook） | `outputs/phase-5/{main,gitignore-runbook}.md` |
| 2026-04-28 | new | Phase 6 outputs（A-2 runbook） | `outputs/phase-6/{main,fragment-runbook}.md` |
| 2026-04-28 | new | Phase 7 outputs（A-3/B-1 runbook） | `outputs/phase-7/{main,skill-split-runbook,gitattributes-runbook}.md` |
| 2026-04-28 | new | Phase 8 outputs（リファクタ） | `outputs/phase-8/{main,before-after}.md` |
| 2026-04-28 | new | Phase 9 outputs（品質ゲート） | `outputs/phase-9/{main,quality-checklist}.md` |
| 2026-04-28 | new | Phase 10 outputs（統合レビュー） | `outputs/phase-10/{main,go-no-go}.md` |
| 2026-04-28 | new | Phase 11 outputs（手動テスト） | `outputs/phase-11/{main,manual-smoke-log,link-checklist}.md` |
| 2026-04-28 | new | Phase 12 outputs（仕様反映） | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| 2026-04-28 | new | Phase 13 outputs（完了確認） | `outputs/phase-13/{main,change-summary,pr-template}.md` |

## specs 配下の追記予定差分（後続タスクで適用）

| 対象 | 種別 | 概要 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/skill-ledger.md` | 新規作成 | 4 施策の正本ルール / fragment 命名規約 / render API / gitignore・gitattributes 適用範囲 / 後方互換方針 |
| 既存 specs (00〜13) | 変更なし | skill ledger は新規ファイルに分離するため既存に破壊的変更なし |

詳細テキスト案は `system-spec-update-summary.md` の §「追記内容（実テキスト案）」を参照。

## AC-7 整合性

- 本 changelog の「specs 配下の追記予定差分」と `system-spec-update-summary.md` の追記提案は **同一結論**（新規ファイル `skill-ledger.md`）
- 既存 specs の差分は両ファイルとも「なし」と記載

## 検証

- [ ] JSON parse: `artifacts.json` / `outputs/artifacts.json` が有効
- [ ] 本書と `system-spec-update-summary.md` の対象パスが完全一致
- [ ] Phase 13 はユーザー承認 gate を維持

## 注意

spec_created workflow のため、`skill-ledger.md` の **実書き込みは本 PR の対象外**。
A-1〜B-1 実装タスク完了時の PR で specs 追記を実施する。
