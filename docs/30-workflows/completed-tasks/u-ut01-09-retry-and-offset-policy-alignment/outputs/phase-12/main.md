# Phase 12: Documentation Update Summary

> ステータス: spec_created / docs-only / NON_VISUAL
> 対象: U-UT01-09 retry 回数と offset resume 方針の統一

## 1. Phase 12 close-out 判定

U-UT01-09 は Issue #263 が CLOSED のまま残る docs-only 設計判断記録であり、実装変更・migration 投入・PR 作成は本 Phase のスコープ外とする。Phase 12 では canonical retry / backoff / processed_offset 方針を文書化し、UT-09 / U-UT01-07 へ実装責務を委譲する。

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| taskType | PASS | docs-only |
| visualEvidence | PASS | NON_VISUAL |
| workflow_state | PASS | spec_created のまま維持 |
| Phase 12 必須成果物 | PASS | 本ファイル + 6 成果物を配置 |
| コード変更 | PASS | apps / packages 変更なし |
| commit / PR | PASS | 未実行 |

## 2. Phase 12 成果物

| 成果物 | 役割 |
| --- | --- |
| `implementation-guide.md` | 中学生レベル説明 + UT-09 implementor 向け実装手順 |
| `system-spec-update-summary.md` | 正本仕様・上流仕様・実装タスクへの反映内容 |
| `documentation-changelog.md` | 文書更新履歴 |
| `unassigned-task-detection.md` | 未タスク候補と既存タスク境界 |
| `skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements へのフィードバック |
| `phase12-task-spec-compliance-check.md` | Phase 12 仕様準拠チェック |

## 3. 正本仕様同期

aiworkflow-requirements には、U-UT01-09 の確定値を検索導線として同期する。

| 同期対象 | 反映内容 |
| --- | --- |
| `indexes/quick-reference.md` | UT-01 セクションから U-UT01-09 canonical retry / offset 方針へ即時到達できる行を追加 |
| `indexes/resource-map.md` | retry / offset policy canonicalization の逆引き行を追加 |
| `references/database-schema.md` | legacy Sheets sync の `processed_offset` は chunk index 単位、UT-09 / U-UT01-07 委譲であることを明記 |
| `references/task-workflow-active.md` | active/spec_created task として U-UT01-09 を登録 |
| `SKILL.md` / `LOGS/_legacy.md` | 変更履歴と同期ログを追加 |

## 4. UI / screenshot 判定

本タスクは UI / UX 変更を含まない。Phase 11 は screenshot ではなく、`outputs/phase-11/main.md`、`manual-smoke-log.md`、`link-checklist.md` の NON_VISUAL 3 証跡で代替する。

## 5. 完了条件チェック

- [x] Phase 12 main を配置
- [x] Phase 12 6 成果物を配置
- [x] root / outputs `artifacts.json` に Phase 12 main を登録
- [x] Phase 1〜12 status を completed に同期
- [x] aiworkflow-requirements の検索導線へ U-UT01-09 を同期
- [x] スクリーンショット不要理由を明示
