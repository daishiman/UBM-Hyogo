# 未タスク検出レポート — UT-GOV-001

> **0 件でも出力必須**。current（本タスクで発見）/ baseline（既存タスク群）に分離する。

## 検出ソース確認

| ソース | 確認結果 |
| --- | --- |
| 元タスク仕様書（親仕様 §「スコープ外」） | UT-GOV-002〜007 / Terraform / Octokit 等 — すべて baseline 既存タスク or 将来 IaC 化フェーズの方針として記述済 |
| Phase 3 / 10 レビュー結果（MINOR 判定） | Phase 3 main.md 参照（PASS / MINOR を確認、対応済） |
| Phase 11 手動 smoke walkthrough | 「保証できない範囲」4 項目を抽出（後述） |
| コードコメント TODO/FIXME/HACK/XXX | 本タスクは markdown / JSON のみで実コード変更なし、該当なし |
| `describe.skip` ブロック | 該当なし（テストコード変更なし） |

## baseline（既知の派生タスク群 — 本タスクの未タスク検出にカウントしない）

| 区分 | タスク | ステータス | 関係 |
| --- | --- | --- | --- |
| baseline | UT-GOV-002（PR target safety gate dry-run） | 既起票済 | 並列タスク |
| baseline | UT-GOV-003（CODEOWNERS governance paths） | 既起票済 | 関連タスク |
| baseline | UT-GOV-004（required_status_checks contexts 同期） | 既起票済 | **上流前提**（5 重明記） |
| baseline | UT-GOV-005 | 既起票済 | 関連 |
| baseline | UT-GOV-006 | 既起票済 | 関連 |
| baseline | UT-GOV-007（GitHub Actions action pin policy） | 既起票済 | 関連 |
| baseline | task-github-governance-branch-protection（親タスク） | 既起票済 | 上流（草案 design.md の正本） |

> baseline 既存タスクは本タスクで「発見」していないため、未タスク検出としてはカウントしない。

## current（本タスク Phase 1〜11 で発見した派生課題）

Phase 11 walkthrough で「NON_VISUAL の限界として保証できない範囲」として挙がった 4 項目を精査し、formalize 要否を判定する。

| # | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 | formalize 要否 |
| --- | --- | --- | --- | --- | --- |
| C-1 | GitHub 実値の eventual consistency（PUT → GET 反映の時間差） | runbook 注記 | `apply-runbook.md` に retry / sleep 規約を Phase 13 で追加 | Phase 13 内処理 | **不要**（Phase 13 内で吸収） |
| C-2 | `enforce_admins=true` 詰みの再現実験 | 実走必須 | Phase 13 `rollback-rehearsal-log.md` で実走確認 | Phase 13 内処理 | **不要**（Phase 13 内で吸収） |
| C-3 | UT-GOV-004 contexts 未同期下の 2 段階適用フォールバック挙動 | UT-GOV-004 完了後の併走確認 | UT-GOV-004 完了後、contexts 反映の後追い再 PUT と検証を独立タスクで実施 | `docs/30-workflows/unassigned-task/task-utgov001-second-stage-reapply.md` | **formalize 済** |
| C-4 | `gh api` rate limit / network race（連続 PUT 4 回） | runbook 注記 | `apply-runbook.md` の rate limit 待機規約 | Phase 13 内処理 | **不要**（Phase 13 内で吸収） |

## current formalize 済（C-3）

C-3 のみ Phase 13 単独では完結せず、UT-GOV-004 の完了状態に依存するため独立未タスクとして formalize した。

| 項目 | 内容 |
| --- | --- |
| 未タスク仕様 | [task-utgov001-second-stage-reapply.md](../../../unassigned-task/task-utgov001-second-stage-reapply.md) |
| 起票理由 | `contexts=[]` の 2 段階適用を採用した場合、UT-GOV-004 完了後の後追い再 PUT が Phase 13 の単回実走では閉じないため |
| Phase 13 境界 | STEP 0.1 で UT-GOV-004 未完了かつ `contexts=[]` fallback を採用した場合のみ、この未タスクを後続実行する |
| 本タスク内の扱い | branch protection 初回適用と rollback リハーサルまでは Phase 13 内で扱い、contexts 後追い再適用のみ未タスクへ分離 |

> 大きな課題を抱え込まないため、C-3 は Phase 12 で formalize 済みに変更した。

## 設計タスクパターン 4 種確認

`phase-12-spec.md` の Task 4 ガイドに従い、以下 4 種のパターンを確認した：

| パターン | 確認結果 |
| --- | --- |
| 型 → 実装 | 該当なし（adapter jq 擬似コードは Phase 5 実装ランブック範囲、本タスクは仕様レベル固定まで） |
| 契約 → テスト | 該当なし（手動 smoke は仕様レベル固定、実走は Phase 13 ユーザー承認後） |
| UI 仕様 → コンポーネント | 該当なし（NON_VISUAL / UI 無し） |
| 仕様書間差異 | 該当なし（親仕様 / design.md / 本ワークフロー仕様で差異 0 確認、Phase 11 link-checklist OK 28 件） |

## サマリ

| 区分 | 件数 |
| --- | --- |
| baseline（既存タスク） | 7 件（カウント外） |
| current — Phase 13 内処理 | 3 件（C-1 / C-2 / C-4） |
| current — formalize 済 | 1 件（C-3） |
| current — 即時 formalize なし | 0 件 |

> **0 件でも出力必須要件を満たすため、current 即時 formalize 0 件であっても本レポートを Phase 12 必須成果物として固定**。

## 関連

- Phase 11 walkthrough（保証できない範囲）: [../phase-11/main.md](../phase-11/main.md) §6
- 親仕様 §「スコープ外」: [../../../completed-tasks/UT-GOV-001-github-branch-protection-apply.md](../../../completed-tasks/UT-GOV-001-github-branch-protection-apply.md)
- Phase 13 STEP 0.1（UT-GOV-004 完了確認）: [../phase-13/main.md](../phase-13/main.md)
