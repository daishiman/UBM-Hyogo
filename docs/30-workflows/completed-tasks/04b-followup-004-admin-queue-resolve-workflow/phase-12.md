# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-004-admin-queue-resolve-workflow |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-05-01 |
| 前 Phase | 11 (手動 smoke / visual evidence) |
| 次 Phase | 13 (PR 作成準備) |
| 状態 | completed |
| 関連 Issue | #319 (closed) |

## 目的

admin queue resolve workflow の実装結果を `aiworkflow-requirements` skill の references / indexes と workflow artifacts に同期し、未タスクと lessons を残す。CLAUDE.md の不変条件 #4（admin-managed data 分離）/ #5（D1 アクセスは apps/api 内）を遵守したかを documentation で示す。

## 実装ガイド Part 1 / Part 2 要件

### Part 1（中学生レベル概念説明）

「会員さんが『公開やめたい』『退会したい』というお願いを出すと、それは依頼ボックス（`admin_member_notes`）にいったん溜まります。管理者は依頼ボックスを開いて『はい、公開やめます』『はい、削除します』『今回はお断り』のいずれかを選びます。『はい』を選ぶと会員情報の状態（公開中／非公開／削除済み）も同時に書き換えます。間違えて 2 回押しても 1 回しか効かない仕組みになっています。誰がいつどの依頼をどう処理したかは履歴として全部残ります。」のレベルで実装の意図を説明する。

### Part 2（技術者レベル説明）

`GET /admin/requests` の query / pagination / response schema、`POST /admin/requests/:noteId/resolve` の request body（`resolution: 'approve' | 'reject'`、`resolutionNote`）、admin auth gate、D1 transaction で `member_status` + `admin_member_notes` を atomic 更新する repository 実装、visibility_request 承認時の `member_status.publish_state` 遷移ロジック、delete_request 承認時の `member_status.is_deleted` 設定、reject 時の member_status 不変保証、二重 resolve 冪等性 / 409 戦略、audit 列（`resolved_at` / `resolved_by_admin_id` / `request_status`）の write タイミング、test command、edge case を技術者向けに記録する。

## 実行タスク

1. `outputs/phase-12/main.md` にサマリを記述
2. `outputs/phase-12/implementation-guide.md`（Part 1 / Part 2 併記）
3. `outputs/phase-12/system-spec-update-summary.md`
4. `outputs/phase-12/documentation-changelog.md`
5. `outputs/phase-12/unassigned-task-detection.md`（0 件でも出力必須）
6. `outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力必須）
7. `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 11 | outputs/phase-11/ | visual evidence |
| 正本 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/requests`、`/admin/requests/:noteId/resolve` 追記必要性判定 |
| 正本 | .claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md | admin UI 統合差分の追記判定 |
| 正本 | docs/00-getting-started-manual/specs/07-edit-delete.md | 編集/削除依頼仕様の更新判定 |
| 正本 | docs/00-getting-started-manual/specs/11-admin-management.md | admin queue 運用仕様の更新判定 |
| 索引 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | workflow inventory 登録 |
| 索引 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | `/admin/requests` 即時導線登録判定 |
| 正本 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | active workflow 状態同期判定 |
| 正本 | .claude/skills/aiworkflow-requirements/references/lessons-learned.md | D1 transaction / admin-managed data 分離 lessons hub 登録 |
| 関連 | docs/30-workflows/unassigned-task/04b-followup-001-admin-queue-request-status-metadata.md | schema 前提 |

## 実行手順

### ステップ 1: system spec update 判定

`GET /admin/requests`、`POST /admin/requests/:noteId/resolve`、admin auth gate、D1 transaction での `member_status`+`admin_member_notes` atomic 更新、audit 列、visibility/delete approve 時の状態遷移、reject 時の不変保証、二重 resolve 冪等を反映する必要がある。

`api-endpoints.md` には admin queue の 2 endpoint を追記必要。`architecture-admin-api-client.md` には admin UI から API への呼び出し flow を追記必要。`07-edit-delete.md` / `11-admin-management.md` の更新要否を Step として記録する。`resource-map.md` / `quick-reference.md` / `task-workflow-active.md` / `lessons-learned.md` の更新要否を判定し、N/A の場合も理由を `system-spec-update-summary.md` に残す。

### ステップ 2: 未タスク検出

下記候補を未タスク化判定する。0 件でも `unassigned-task-detection.md` を必ず出力する。

- 依頼処理後の member への通知（メール / Magic Link）
- bulk resolve（複数依頼の一括処理）
- audit 一覧と `/admin/audit` の連携（07c-followup-003 の audit log との結線）
- request_status の filter / sort 拡張
- delete_request 承認後の物理削除ジョブ（retention policy）
- resolutionNote の必須化判定 / 文字数制限

### ステップ 3: skill feedback / compliance

- `skill-feedback-report.md` は改善点 0 でも出力する
- `phase12-task-spec-compliance-check.md` で Phase 1〜11 の固定成果物配置と本タスクの不変条件遵守を check する
- `outputs/artifacts.json` は本ワークフローでは作成しない。`phase12-task-spec-compliance-check.md` には「`outputs/artifacts.json` は本ワークフローでは作成されておらず、root `artifacts.json` が唯一正本である。parity check は root のみで実施し PASS とする。」を記録する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | change-summary / PR body に implementation-guide と visual evidence パスを引き渡す |

## 多角的チェック観点（AIが判断）

- Phase 12 の 7 ファイルは固定名で作る
- `spec_created` root は実装完了時だけ completed に変える
- closed Issue #319 への PR body は `Refs #319` を使い `Closes` は使わない
- CLAUDE.md 不変条件 #4 / #5 を documentation 上で再確認する
- **本 Phase では commit / push / PR 作成は禁止。user 承認は Phase 13 で取得する。**

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | implementation-guide | pending | Part 1 / Part 2 |
| 2 | system spec update | pending | api-endpoints / admin-api-client / specs |
| 3 | unassigned detection | pending | 0 件でも出力 |
| 4 | skill feedback | pending | 改善なしでも出力 |
| 5 | compliance check | pending | Phase 1〜11 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | サマリ |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド（Part 1/2） |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | 仕様更新 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill feedback |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | compliance |

## 完了条件

- [ ] Phase 12 固定 7 成果物がある
- [ ] root `artifacts.json` の Phase 12 outputs が固定 7 成果物と一致している
- [ ] `outputs/artifacts.json` が root `artifacts.json` と parity している
- [ ] system spec update の Step 1/2 判定がある
- [ ] 未タスク 0 件でもレポートがある
- [ ] implementation-guide に Part 1 / Part 2 が併記されている

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 固定 7 成果物が配置済み
- [ ] artifacts.json の Phase 12 を completed に更新

## 次Phase

次: 13 (PR 作成準備)。
