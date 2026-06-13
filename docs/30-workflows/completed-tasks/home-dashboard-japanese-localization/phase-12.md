# Phase 12 — ドキュメント更新（strict 7 + 概念説明 + 視覚証跡）

> 本 Phase は `_shared-context.md`（SSOT）全体を正本として参照する。
> implemented_local_evidence_captured（ローカル実装・証跡取得済み）であり、システム正本仕様（schema/auth/DB/interfaces）への影響は無い。
> 新規インターフェース・型・定数・API の追加は無いため Step 2 = N/A。

## 目的

ホーム画面の英語表記日本語化・eyebrow 削除タスクのドキュメントを Phase 12 strict 7 として整備する。
非エンジニア向けの概念説明（Part 1）と技術者向けの実装ガイド（Part 2）を含む `implementation-guide.md` を中核とし、
システム仕様更新サマリ・ドキュメント変更ログ・未タスク検出・skill フィードバックを個別に記録する。
本タスクは文字列置換・要素削除・CSS 削除・テスト更新のみで、システム正本仕様の更新は不要（N/A を明記）。

## 成果物

### Phase 12 strict 7

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 実施サマリ |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル概念）+ Part 2（技術詳細）+ 視覚証跡 |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/1-B/1-C + Step 2（N/A） |
| 4 | `outputs/phase-12/documentation-changelog.md` | 全 Step の結果（該当なしも記録）+ skill sync |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | current/baseline 分離（current 0 件） |
| 6 | `outputs/phase-12/skill-feedback-report.md` | テンプレ/WF/ドキュメント 3 観点（編集無し） |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 セクション検証（作成済） |

### 概念説明と視覚証跡の方針

- `implementation-guide.md` は **Part 1（例え話・専門用語なし）** と **Part 2（変更ファイル F1〜F7 / テスト T1〜T6 / 文字列マッピング / 検証コマンド / エラー・エッジケース / 既知制限）** と **## 視覚証跡** を含む。
- 視覚証跡は VISUAL かつ implemented_local_evidence_captured のため、Phase 11 は local fullpage PNG present / staging・crop pending（`screenshot-plan.json` / `phase11-capture-metadata.json` を参照）。

### 関連成果物
- 上記 strict 7（#7 は作成済・参照のみ）。

## 統合テスト連携

- 本 Phase はドキュメント整備のため、新規テストは作らない。
- `implementation-guide.md` の検証コマンドは SSOT §4 と一致させ、後続実装者がそのまま DoD 検証に使える。
- system-spec-update-summary.md は「システム正本仕様への影響なし（Step 2 = N/A）」を明記し、
  aiworkflow-requirements 正本へ無関係な更新を加えないことを保証する。

## 完了条件

- [ ] strict 7 のうち本 Lane 作成分 5 件（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report のうち compliance-check を除く 5 つ）が present
- [ ] implementation-guide.md が Part 1 / Part 2 / 視覚証跡 を本文付きで含む
- [ ] system-spec-update-summary.md に Step 1-A/1-B/1-C/Step 2（N/A）が個別記載されている
- [ ] documentation-changelog.md に全 Step の結果（該当なしも）と skill sync が個別記載されている
- [ ] unassigned-task-detection.md が current 0 件 / baseline 分離 / 関連タスク差分確認 を含む
- [ ] skill-feedback-report.md が 3 観点で出力され、skill 編集無しが明記されている
