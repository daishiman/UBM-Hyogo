# Phase 12: ドキュメント更新

## 目的

Phase 11 の結果（triage / A/B）をドキュメントに反映し、unassigned placeholder を `docs/30-workflows/completed-tasks/` 配下へ移動して consumed trace 化する。aiworkflow-requirements の current task inventory に本 workflow を登録する。

## 必須出力ファイル（7 つ）

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ |
| `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル + Part 2 技術者レベル |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 仕様書遵守チェック |
| `outputs/phase-12/system-spec-update-summary.md` | system spec 更新サマリ |
| `outputs/phase-12/skill-feedback-report.md` | skill フィードバック |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 unassigned task の検知 |
| `outputs/phase-12/documentation-changelog.md` | ドキュメント changelog |

## 更新対象ドキュメント

### 1. unassigned placeholder の completed-tasks 移動 + consumed trace 化

元 placeholder: `docs/30-workflows/unassigned-task/task-issue-577-followup-002-miniflare-undici-upstream-tracking.md`
移動先: `docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking/` 配下に統合（本 workflow ディレクトリ自体を completed-tasks/ 配下に配置することで吸収）

手順（task-specification-creator 最新仕様準拠）:
1. 本 workflow ディレクトリを `docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking/` に配置する（unassigned-task/ 配下の元 placeholder は本 workflow に統合されるため、別ファイルとして残置しない）
2. 統合先ディレクトリ先頭ドキュメント（`index.md` または `outputs/phase-12/unassigned-task-detection.md`）に以下の consumed trace ヘッダーを記載:
   ```markdown
   > **status**: CONSUMED
   > **consumed_at**: <YYYY-MM-DD>
   > **consumed_by**: docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking/
   > **source_issue**: #616（CLOSED）
   ```
3. 元 placeholder の本文は履歴として本 workflow `outputs/phase-12/unassigned-task-detection.md` へ転記済みであることを確認
4. `unassigned-task/README.md` 等の index があれば本 placeholder の行を「CONSUMED → completed-tasks/...」表記に更新

### 2. aiworkflow-requirements 同期

対象: `.claude/skills/aiworkflow-requirements/references/` 配下の current task inventory
手順:
1. 本 workflow を inventory に追加（spec_created）
2. `mise exec -- pnpm indexes:rebuild` で indexes を再生成

### 3. changelog 更新

対象: `outputs/phase-12/documentation-changelog.md`
- 追加: 本 workflow ディレクトリ（`docs/30-workflows/completed-tasks/` 配下に直接配置）
- 移動: unassigned placeholder を completed-tasks/ 配下へ統合し consumed trace ヘッダー付与
- 変更（A/B 採用時のみ）: `apps/api/package.json#test:coverage`

### 4. system spec 更新（A/B 採用時のみ）

対象: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`（軸B 由来記述）
- 軸B（`--maxWorkers=1`）の表記を採用 N に更新
- 上流改善検知日 / 採用 release tag を追記

## 不変条件再確認

- AC-6: `git diff --stat apps/api/src apps/api/migrations` 0 件
- 不変条件 #5: D1 binding 不変
- CONST_007: 先送り禁止 — 改善検知時は今回サイクルで A/B 完了済みであること

## 先送り禁止の再確認（CONST_007）

- 「改善検知あり」かつ「A/B 実施未完了」のまま Phase 12 に進むことは禁止
- 全候補不採用なら「維持決定」を Phase 11 evidence で明示し、その結論を本 Phase 12 で反映する

## 完了条件

- [x] 7 ファイル全存在
- [x] unassigned placeholder を completed-tasks/ 配下へ移動し consumed trace ヘッダー付与
- [x] aiworkflow-requirements indexes 登録済み
- [x] changelog 反映済み
- [x] （A/B 採用時のみ）system spec 更新ルール定義済み

## 次フェーズへの引き継ぎ事項

Phase 13 で user 承認後に PR 作成。base=dev。Issue #616 は CLOSED のまま reopen しない。
