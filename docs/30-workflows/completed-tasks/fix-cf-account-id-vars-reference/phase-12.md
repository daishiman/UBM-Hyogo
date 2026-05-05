# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | FIX-CF-ACCT-ID-VARS-001 |
| Phase | 12 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 実行タスク

1. 本 Phase の入力と制約を確認する。
2. 本 Phase の成果物に必要な判断、手順、証跡を記録する。
3. 完了条件と artifacts ledger の整合を確認する。

## 目的

skill 規約に従い Phase 12 の 7 ファイル（`main.md` + 6 補助）を生成し、close-out parity を担保する。


## 参照資料

- `index.md`
- `artifacts.json`
- `.github/workflows/backend-ci.yml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`

## 入力

- Phase 1〜11 全成果物
- artifacts.json / outputs/artifacts.json

## 必須タスク（5 タスク + root evidence）

| Task | 名称 | 必須 | 出力先 |
| --- | --- | --- | --- |
| 12-1 | 実装ガイド作成（Part 1 中学生向け + Part 2 技術者向け） | ✅ | outputs/phase-12/implementation-guide.md |
| 12-2 | システム仕様書更新サマリー（Step 1-A〜1-C, Step 2 実施） | ✅ | outputs/phase-12/system-spec-update-summary.md |
| 12-3 | ドキュメント更新履歴 | ✅ | outputs/phase-12/documentation-changelog.md |
| 12-4 | 未タスク検出レポート（0 件でも出力必須） | ✅ | outputs/phase-12/unassigned-task-detection.md |
| 12-5 | スキルフィードバックレポート（改善点なしでも出力必須） | ✅ | outputs/phase-12/skill-feedback-report.md |
| 12-6 | Phase 12 task spec compliance check（root evidence） | ✅ | outputs/phase-12/phase12-task-spec-compliance-check.md |

## Task 12-1: 実装ガイド構成

### Part 1（中学生向け）

- 例え話: 「住所」と「鍵」の違い
  - Cloudflare の Account ID は「住所」（誰でも知ってOK、家を特定するだけ）
  - API Token は「鍵」（持っている人だけが家に入れる）
- 今回直したこと: workflow が「住所を秘密のメモ帳から読もうとして」失敗していたので、「住所はみんなが見られる掲示板から読む」ように直した
- なぜ住所を秘密にしなくていいか: 住所だけでは鍵を持っていないと家に入れない

### Part 2（技術者向け）

- 修正内容: 6 箇所の `${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` → `${{ vars.CLOUDFLARE_ACCOUNT_ID }}`
- 名前空間の違い: `secrets.X` と `vars.X` は別 namespace。未登録 Secret は空文字に展開される
- 失敗ログとの対応: 空文字の `accountId` で wrangler-action が起動 → wrangler が `/memberships` を叩く → Token に `User:Memberships:Read` がない → `Authentication error [code: 10000]`
- Cloudflare の設計思想: Account ID は識別子、API Token が資格情報
- 視覚証跡: UI/UX変更なしのため Phase 11 スクリーンショット不要

## Task 12-2: システム仕様書更新

| Step | 内容 | 本タスクでの扱い |
| --- | --- | --- |
| Step 1-A | 完了タスク記録（completed-tasks セクション + LOGS.md×2 + topic-map.md） | 実施 |
| Step 1-B | 実装状況テーブル更新 | `spec_created` として記録 |
| Step 1-C | 関連タスクテーブル更新 | UT-27 / UT-CICD-DRIFT との関係を current facts へ更新 |
| Step 2 | システム仕様更新 | 実施。`CLOUDFLARE_ACCOUNT_ID` を Repository Secret ではなく Repository Variable として同期 |

### Step 2 更新対象

- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（必要時）

## Task 12-4: 未タスク検出（scope out 列挙）

以下を派生タスク候補として記録:

1. API Token のスコープ最小化監査
2. staging / production Token 値分離
3. `apps/api/wrangler.toml` の `vars.SHEETS_SPREADSHEET_ID` 等 `env.production.vars` 継承 warning 対応
4. `apps/web/wrangler.toml` の `pages_build_output_dir` 未設定 warning 対応

各候補について:

- 状態: candidate
- 関連タスク差分確認: 既存 unassigned-task / completed-tasks に重複がないか確認
- 起票要否: HIGH（Token 監査）/ MEDIUM（その他）

## Task 12-6: Compliance check 必須項目

- Phase 12 の 7 ファイル（`main.md` + 6 補助）すべて存在
- artifacts.json と outputs/artifacts.json の phase/status/file parity
- LOGS.md 2 ファイル更新（aiworkflow-requirements / task-specification-creator）
- 関連 skill `generate-index.js` の再実行（必要時）

## 完了条件

- [x] Phase 12 の 7 ファイル（`main.md` + 6 補助）すべて作成されている
- [x] 各 Task の Step が表化されている
- [x] 代替整合チェック（root / outputs artifacts parity、Phase 11 evidence、stale Secret 記述検索）が通る
- [x] aiworkflow-requirements の正本仕様が `CLOUDFLARE_ACCOUNT_ID` = Repository Variable に同期されている
- [x] LOGS / SKILL.md / task-workflow-active / resource-map が same-wave で更新される（topic-map は自動再生成対象）

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
