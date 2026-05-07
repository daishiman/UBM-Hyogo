# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| タスク | issue-378-tag-queue-paused-flag |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | completed |


[実装区分: 実装仕様書]
判定根拠: env binding 追加・関数シグネチャ変更・テスト追加・runbook 新規作成を伴うため、コード変更が必須。

## 目的

実装内容を仕様書 / 運用文書に反映し、後続タスクが trace できるようにする。

## 必須成果物 6 件

`outputs/phase-12/` 配下に以下を作成する。

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `implementation-guide.md` | 実装の使い方ガイド。`TAG_QUEUE_PAUSED` の意味 / 設定方法 / 取れる値 / 戻り値 reason 一覧 / 緊急停止経路。PR 本文の元ネタ。 |
| 2 | `system-spec-update-summary.md` | `docs/00-getting-started-manual/specs/` と `.claude/skills/aiworkflow-requirements/` の正本同期結果。差分提案ではなく、本タスクで実更新したファイルと stale-current 分類を記録する。 |
| 3 | `documentation-changelog.md` | 本タスクで追加 / 変更したドキュメントの一覧（runbook / index.md / phase 各 md）。 |
| 4 | `unassigned-task-detection.md` | 本タスク中に発見した後続改善候補（log sampling / admin UI toggle 等）を unassigned task 起票候補として記録。0 件の場合も「0 件」と明記。 |
| 5 | `skill-feedback-report.md` | 本タスクで使用した skill（task-specification-creator 関連項目）への改善フィードバック。なければ「特になし」を明記。 |
| 6 | `phase12-task-spec-compliance-check.md` | task-specification-creator のチェック項目に対する自己点検結果。 |

## implementation-guide.md の最低限要素

- 環境変数 `TAG_QUEUE_PAUSED` の役割
- 取りうる値と解釈規則（厳格 parse）
- 設定方法（wrangler.toml 編集 + deploy）
- 戻り値 `reason` 一覧（`has_tags` / `has_pending_candidate` / `paused`）
- structured log code `UBM-TAGQ-PAUSED` のフォーマット
- 不変条件 #5 / #13 への影響なし旨
- 既存完了タスク内の旧 `TAG_QUEUE_PAUSED` / secret / 503 短絡記述は stale-current と分類し、本 workflow と runbook を current とする旨

## 実行タスク

- [x] Phase 12 の目的に沿って、本文で定義した確認・実装・検証を実施する。
- [x] 関連する実コード、実仕様書、実スキル参照を同一サイクルで更新する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/issue-378-tag-queue-paused-flag/artifacts.json`

### 依存 Phase

- Phase 1: `phase-01.md`
- Phase 2: `phase-02.md`
- Phase 5: `phase-05.md`
- Phase 6: `phase-06.md`
- Phase 7: `phase-07.md`
- Phase 8: `phase-08.md`
- Phase 9: `phase-09.md`
- Phase 10: `phase-10.md`
- Phase 11: `phase-11.md`

## 成果物

- `docs/30-workflows/issue-378-tag-queue-paused-flag/phase-12.md`
- Phase 12 に対応する `outputs/phase-12/` 成果物

## 完了条件

- [x] Phase 12 の完了条件を満たす。

- 必須成果物 6 件が `outputs/phase-12/` 配下に存在する。
- `implementation-guide.md` が PR 本文の元ネタとして利用可能な粒度になっている。
- `unassigned-task-detection.md` に件数が明記されている（0 件含む）。
