# System Spec Update Summary — coverage-80-enforcement

## Step 1-A: 完了タスク記録 + 関連 doc + LOGS×2 + topic-map 同期

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | coverage-80-enforcement `implementation_started` 行追加 |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | NON_VISUAL Phase 12 で Part 1（中学生レベル）+ Part 2（vitest / coverage-guard / CI / lefthook 詳細）の 2 部構成テンプレ適用例として記録対象 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `quality-requirements-advanced.md` の coverage 一律 80% 切替見出し同期対象（index 再生成は別途） |
| 親リンク双方向 | 本ワークフロー ↔ UT-GOV-001（branch protection contexts 登録）/ UT-GOV-004（contexts 同期）/ int-test-skill（統合テスト coverage 寄与）双方向リンク追加 |
| CLAUDE.md | 「solo 運用ポリシー（`required_pull_request_reviews=null`）」と「CI hard gate（coverage-gate）」の整合注記を追記（既存記述は変更しない） |

## Step 1-B: 実装状況テーブル更新

- `docs/30-workflows/LOGS.md` の coverage governance テーブルで coverage-80-enforcement 行を `implementation_started` に更新

## Step 1-C: 関連タスクテーブル更新

- UT-GOV-001（branch protection apply）: PR③ で `required_status_checks.contexts` に `coverage-gate` を追加する運用を双方向リンク
- UT-GOV-004（contexts 同期）: coverage-gate job 名同期の上流前提として 5 重明記（Phase 1 / 2 / 3 / 11 / 12）
- int-test-skill: 統合テスト coverage 寄与の互換性を確認

## Step 1-A/1-B/1-C 判定: 全て REQUIRED

実装差分を含むため、LOGS / 正本仕様 / coverage standards の同一 wave 同期は必須。N/A 不可。

## Step 2: aiworkflow-requirements 仕様更新 = REQUIRED

### 理由

既存 `aiworkflow-requirements/references/quality-requirements-advanced.md` L125-144 の package 別差分閾値（apps=80% / packages=65%）が、本タスクのユーザー決定事項「全 package 一律 80%」と衝突する。運用正本である aiworkflow-requirements を更新しないと、将来の skill 参照で旧値が再発する。

### 既存表の更新差分（diff 形式）

```diff
  ## カバレッジ閾値（package 別）
  
- | package | lines | branches | functions | statements |
- | --- | --- | --- | --- | --- |
- | apps/web | 80 | 80 | 80 | 80 |
- | apps/api | 80 | 80 | 80 | 80 |
- | packages/shared | 65 | 65 | 65 | 65 |
- | packages/integrations | 65 | 65 | 65 | 65 |
- | packages/integrations/google | 65 | 65 | 65 | 65 |
+ | package | lines | branches | functions | statements |
+ | --- | --- | --- | --- | --- |
+ | apps/web | 80 | 80 | 80 | 80 |
+ | apps/api | 80 | 80 | 80 | 80 |
+ | packages/shared | 80 | 80 | 80 | 80 |
+ | packages/integrations | 80 | 80 | 80 | 80 |
+ | packages/integrations/google | 80 | 80 | 80 | 80 |
+
+ > 全 package 一律 80%（lines / branches / functions / statements）。
+ > 強制経路は (1) `scripts/coverage-guard.sh`、(2) CI `coverage-gate` job、
+ > (3) lefthook pre-push `coverage-guard --changed` の 3 重 gate。
+ > 詳細は `docs/30-workflows/coverage-80-enforcement/` を参照。
```

### Codecov との整合確認結果

| 項目 | 状態 | 本タスクの扱い |
| --- | --- | --- |
| `codecov.yml` | repo に存在しない | PR① から Codecov upload step を除外し、必要なら別タスクで導入 |
| 80% 判定 | `coverage-guard.sh` が実施 | Vitest は計測のみ |

### task-specification-creator/references/coverage-standards.md への追記内容

```diff
  ## 強制経路
  
  - Vitest で coverage を計測する
  - CI workflow で coverage gate job を走らせる
+ - `scripts/coverage-guard.sh` を `pnpm coverage:guard` 経由で実行し、
+   未達時は不足ファイル top10 と推奨テストファイルパスを stderr に出力する
+   （`docs/30-workflows/coverage-80-enforcement/` 参照）
+ - lefthook pre-push に `coverage-guard --changed` を統合し、ローカル auto-loop を成立させる
```

## 実行タイミング

| 対象 | 実行タイミング |
| --- | --- |
| LOGS.md 追記 | 本 wave で実施 |
| topic-map 再生成 | Phase 13 PR③ merge 後、user 承認後の `mise exec -- pnpm indexes:rebuild` |
| `quality-requirements-advanced.md` 更新 | 本 wave で実施 |
| `coverage-standards.md` 更新 | 本 wave で実施 |
| CLAUDE.md 注記 | Phase 13 PR① commit に同梱（追記のみ） |
