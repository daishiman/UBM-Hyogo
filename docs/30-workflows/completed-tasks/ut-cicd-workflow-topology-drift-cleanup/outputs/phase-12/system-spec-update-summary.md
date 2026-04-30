# Phase 12 成果物: システム仕様更新サマリー (UT-CICD-DRIFT)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-CICD-DRIFT |
| Phase | 12 / 13 |
| 作成日 | 2026-04-29 |
| 状態 | spec_created（docs-only close-out 据え置き） |

## Step 1-A: 完了タスク記録 + 関連 doc リンク + 変更履歴 + LOGS ×2 + topic-map

| 同期対象 | 実体 path | 適用内容 | 適用状況 |
| --- | --- | --- | --- |
| `docs/30-workflows/LOGS.md` | 同 path | UT-CICD-DRIFT Phase 1〜12 完了行を末尾に追記（Phase 13 完了時に Phase 13 を追記）| 本 Phase で追記 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 同 path（active LOGS は LOGS/ 配下構造） | `deployment-gha.md` v2.2.0 / `deployment-cloudflare.md` v1.3.0 への UT-CICD-DRIFT 同期記録 | 本 Phase で追記 |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | 同 path | docs-only close-out 据え置きルールの運用実例として記録 | 本 Phase で追記 |
| `.claude/skills/task-specification-creator/SKILL.md` | 同 path | 同上（運用実例として LOGS で記録） | LOGS で代替 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 同 path | UT-CICD-DRIFT の変更履歴行を追加 | review 改善で追記済み |
| `.claude/skills/aiworkflow-requirements/indexes/{resource-map.md, quick-reference.md, topic-map.md, keywords.json}` | 同 path | `generate-index.js` で再生成し、deployment 系正本の行番号・キーワードを同期 | review 改善で再生成 |
| 関連 doc リンク | UT-GOV-001 / UT-GOV-003 / UT-26 / 05a observability の index.md | 「並列 / 関連」テーブルに本タスク完了情報を反映。実体更新は documentation-changelog 参照 | 本 Phase で記述完了 |

## Step 1-B: 実装状況テーブル更新（spec_created 据え置き）

- 起票元 `docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-001.md` から本タスクディレクトリ（`docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/`）への移動 / 双方向リンクは既に index.md / artifacts.json に固定済み。
- 統合 README が存在する場合は docs-only タスク一覧に UT-CICD-DRIFT を `spec_created` で記録（README.md の存在を確認のうえ追加対応）。
- **重要（最重要）**: 本タスクは docs-only / specification-cleanup である。`workflow_state` は **`spec_created` のまま据え置く**。`implemented` への昇格は派生 `UT-CICD-DRIFT-IMPL-*` 完了後のみ起こり得る（本タスク責務外）。

## Step 1-C: 関連タスクテーブル更新

| 関連タスク | 反映内容 |
| --- | --- |
| UT-GOV-001（branch protection） | `required_status_checks` の workflow 名整合確認の入力として UT-CICD-DRIFT 完了を記録。実体 5 workflow（ci / validate-build / verify-indexes / web-cd / backend-ci）が SSOT |
| UT-GOV-003（CODEOWNERS governance） | `.github/workflows/**` owner 宣言と現実体（5 yaml）整合確認の入力として UT-CICD-DRIFT 完了を記録 |
| UT-26（staging-deploy-smoke） | smoke 対象 workflow 名（`web-cd.yml` / `backend-ci.yml`）を SSOT に同期済み |
| 05a observability（completed-tasks 配下） | DRIFT-06（observability-matrix の workflow 名差分）は派生 `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` に委譲済み |

## Step 2（条件付き）: 新規インターフェース追加 — **not required**

- 本タスクは docs-only / specification-cleanup であり、新規 API / 新規 D1 schema / 新規 IPC / 新規 binding を一切追加しない。
- `canonical-spec-update-plan.md` の更新案は `deployment-gha.md` / `deployment-cloudflare.md` の **既存記述の正確化（current facts 注記・行追加・脚注）** に閉じる。
- **Step 2 not required: docs-only / no new interface**。

## docs-only smoke 検証結果転記（Phase 11 から）

| 検証項目 | 結果 | ログ参照 |
| --- | --- | --- |
| workflow yaml 棚卸し（rg） | PASS | phase-11/manual-smoke-log.md §1 |
| yamllint | N/A（未導入） | §2 |
| actionlint | N/A（未導入） | §3 |
| wrangler.toml 抽出 | PASS（差分は派生委譲で説明可能） | §4 |
| 05a observability mapping | PASS（差分は派生委譲） | §5 |
| 派生タスク命名衝突 | PASS（衝突 0 件） | §6 |
| Issue #58 状態 | PASS（CLOSED 維持） | §7 |
| link checklist | PASS（死リンク 0 件） | phase-11/link-checklist.md |

## 実体ファイル更新サマリー（本 Phase で実施した編集）

| ファイル | 適用差分 | 起源 drift ID |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | (1) workflow 構成表に `validate-build.yml` / `verify-indexes.yml` 追加 + current facts 注記 (2) Node 22→24 / pnpm 9→10.33.2 (3) coverage soft→hard 段階性注記 (4) web-cd Discord 通知未実装注記 (5) backend-ci Discord 通知未実装注記 (6) 変更履歴 v2.2.0 行追加 | DRIFT-01, 02, 04(a), 05(a), 08 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | (1) Workers section 冒頭に Pages 運用中の current facts 注記 (2) 判定表に「現状（2026-04-29）」列追加 (3) cron 表に `0 18 * * *`（03a schema sync）行追加 (4) API wrangler.toml KV binding 例に「UT-13 採用後」脚注 (5) web-cd デプロイフローに Pages → Workers cutover 委譲注記 (6) 変更履歴 v1.3.0 行追加 | DRIFT-03, 07, 09, 10 |
| `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | workflow 構成を 2 件 → 5 件へ同期、Node 24 / pnpm 10.33.2、Discord 通知未実装、coverage soft gate 注記を追加 | Phase 12 review 漏れ補正 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `DISCORD_WEBHOOK_URL` を現行 workflow 未使用 / UT-08-IMPL 導入予定へ補正 | Phase 12 review 漏れ補正 |

## 据え置き事項（impl 必要差分）

`unassigned-task-detection.md` 参照。本 Phase では起票方針確定のみ、実装 cutover は派生タスクで実施。

## 完了条件チェック

- [x] Step 1-A 適用先テーブル化
- [x] Step 1-B 据え置き宣言（workflow_state = spec_created）
- [x] Step 1-C 関連タスク反映
- [x] Step 2 not required の判定理由明記
- [x] 実体ファイル更新サマリー記述
- [x] 派生 impl 差分は別ファイル（unassigned-task-detection.md）で扱う
