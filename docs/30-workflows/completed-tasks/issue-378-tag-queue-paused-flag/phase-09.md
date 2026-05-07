# Phase 9: 品質ゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| タスク | issue-378-tag-queue-paused-flag |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | completed |


[実装区分: 実装仕様書]
判定根拠: env binding 追加・関数シグネチャ変更・テスト追加・runbook 新規作成を伴うため、コード変更が必須。

## 目的

実装後に必ず通すべき自動チェック群を確定する。

## 必須ゲート

| # | コマンド | 失敗時の対応 |
| --- | --- | --- |
| 1 | `mise exec -- pnpm typecheck` | 型不整合（env 伝播漏れ等）を最小差分で修正 |
| 2 | `mise exec -- pnpm lint` | `pnpm lint --fix` を試行 → 残違反は手修正 |
| 3 | `mise exec -- pnpm --filter @ubm/api test` | 失敗 case を一つずつ特定し修正。fakeD1 spy assertion がズレている場合は phase-04 のケース表に従って訂正 |

## 補助ゲート

| # | コマンド | 目的 |
| --- | --- | --- |
| 4 | `git diff main...HEAD --name-only \| grep apps/web` | 不変条件 #5 確認（`apps/web` 配下に変更がないこと） |
| 5 | `grep -rn "enqueueTagCandidate(" apps/` | 第3引数追加忘れの caller がないか確認 |
| 6 | `ls docs/30-workflows/runbooks/tag-queue-pause.md` | runbook ファイル存在確認 |

## quality-report 生成

`outputs/phase-09/quality-report.md` に以下を記録:

- typecheck 出力（PASS / 修正 diff）
- lint 出力（PASS / 修正 diff）
- test 出力（PASS / ケース数 / 実行時間）
- 補助ゲート 4〜6 の結果

## 実行タスク

- [x] Phase 9 の目的に沿って、本文で定義した確認・実装・検証を実施する。
- [ ] 関連する実コード、実仕様書、実スキル参照を同一サイクルで更新する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/issue-378-tag-queue-paused-flag/artifacts.json`

### 依存 Phase

- Phase 5: `phase-05.md`

## 成果物

- `docs/30-workflows/issue-378-tag-queue-paused-flag/phase-09.md`
- Phase 9 に対応する `outputs/phase-09/` 成果物

## 統合テスト連携

- [ ] NON_VISUAL のため、統合テストは `pnpm --filter @ubm-hyogo/api test` と focused Vitest evidence に集約する。
- [ ] runtime Cloudflare mutation は user approval gate の外では実行しない。

## 完了条件

- [x] Phase 9 の完了条件を満たす。

- 必須ゲート 1〜3 全て PASS。
- 補助ゲート 4〜6 全てクリア。
- `outputs/phase-09/quality-report.md` に出力記録が残る。
