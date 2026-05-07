# Phase 12: 必須 6 タスク / strict 7 outputs

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-400-admin-request-audit-target-taxonomy |
| phase | 12 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #400 の admin request audit target taxonomy を実装・検証・正本同期する。

## 実行タスク

- Phase 本文の内容を実行し、成果物と検証証跡を同期する。

## 参照資料

- `docs/30-workflows/issue-400-admin-request-audit-target-taxonomy/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`

## 成果物

- root Phase 仕様書と `outputs/phase-*/main.md`


## 実行タスク

| Task | 成果物 | 状態 |
| --- | --- | --- |
| 12-1 | `outputs/phase-12/implementation-guide.md` | 作成済み |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | 作成済み |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | 作成済み |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` | 作成済み |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` | 作成済み |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 作成済み |

## Task 12-1. 実装ガイド作成

`outputs/phase-12/implementation-guide.md` を作成し、以下 2 部構成で記述する:

- Part 1（中学生レベル）: 「監査ログ」を整理しやすくするため、管理者が会員の公開設定や削除リクエストを承認・却下したときの記録だけを `admin_member_note` というラベルで分けて保存するようにした。これまでは `member` という大きなラベルにまとめていたため、後から「申請対応の履歴だけ見たい」が難しかった。
- Part 2（技術者レベル）: `AuditTargetType` 拡張、`requests.ts` resolve INSERT の `target_type` / `target_id` 切替、後方互換維持戦略、新規テスト範囲、UI placeholder 同期、shared zod コメント方針、indexes 同期手順を記述。

## Task 12-2. システム仕様書更新

`.claude/skills/aiworkflow-requirements/references/` 内の audit taxonomy SSOT を更新（存在時）。Step 1-A: enum 一覧に `admin_member_note` 追加 / Step 1-B: 既存 `member` との使い分けマトリクス追記 / Step 1-C: migration-safe ポリシー記述。

## Task 12-3. ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に下記 absolute path を列挙:

- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-062122-wt-11/docs/30-workflows/issue-400-admin-request-audit-target-taxonomy/index.md`
- `/Users/dm/.../docs/30-workflows/issue-400-admin-request-audit-target-taxonomy/artifacts.json`
- `/Users/dm/.../docs/30-workflows/issue-400-admin-request-audit-target-taxonomy/outputs/phase-1〜13/phase-N.md`
- `.claude/skills/aiworkflow-requirements/references/<audit-taxonomy 該当 file>`（更新時）
- `.claude/skills/aiworkflow-requirements/LOGS.md`（更新時）

## Task 12-4. 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md` を作成。本タスクで切り出すべき先送りはない（CONST_007）。検出 0 件の旨と根拠を明記。

## Task 12-5. スキルフィードバックレポート

`outputs/phase-12/skill-feedback-report.md` を作成。3 観点固定:

- テンプレ改善: なし / または migration-safe taxonomy 拡張パターンを reference に追加する提案
- ワークフロー改善: なし
- ドキュメント改善: aiworkflow-requirements の audit taxonomy SSOT 配置に関する提案（存在しなければ新規作成提案）

## Task 12-6. タスク仕様書コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md` を作成。CONST_005 必須項目（変更対象ファイル / 関数シグネチャ / 入出力 / テスト方針 / 実行コマンド / DoD）が本仕様書に揃っていることを項目別に確認。

## 完了条件

- [x] Phase 12 strict 7 ファイルすべてが `outputs/phase-12/` 配下に実体存在する
- [x] `admin_member_note` の実装・正本仕様・テスト方針が齟齬なく整合している
- [x] root `artifacts.json` と `outputs/artifacts.json` が同期している
