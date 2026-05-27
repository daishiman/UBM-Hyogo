[実装区分: 実装仕様書]

# Phase 13: PR 作成

> **依存**: Phase 12（ドキュメント・引き継ぎ整備）完了が必須。
> **重要**: 本 Phase は **ユーザーの明示承認後にのみ実行する**。事前承認なしに `gh pr create` を自動実行してはならない。

参照: [_shared-context.md](./_shared-context.md)

---

## 0. 目的

Admin 出席分析ページ UI/UX 全面刷新（404 修正含む）の成果物を、レビュー可能な形で Pull Request として GitHub に提出する。差分・動作確認・スクリーンショットを揃え、レビュアーが judgement できる状態を作る。

---

## 1. 事前条件（チェックリスト）

PR 作成に着手する前に **全項目** を満たしていること。1 つでも未達なら Phase をブロックする。

- [ ] **ユーザー明示承認**: 「PR を作成してよい」旨の応答を得た（チャット履歴で確認可能なこと）
- [ ] Phase 1〜12 の deliverables が `artifacts.json` に登録済み
- [ ] 全テストグリーン（unit / integration / e2e）
  - `pnpm -w test` または該当パッケージの `pnpm test` が exit 0
- [ ] Lint / Type check / Build すべて成功
  - `pnpm -w lint && pnpm -w typecheck && pnpm -w build` が exit 0
- [ ] Staging 環境（または local preview）で出席分析ページが 404 にならず正常表示されることを目視確認
- [ ] スクリーンショット（before/after）を `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/outputs/screenshots/` に保存
- [ ] 不要な debug log / `console.log` / コメントアウト残骸が無い（`git diff` で再確認）
- [ ] `.env` / 秘密情報 / 一時ファイルが diff に混入していない
- [ ] 関連 Issue / タスク仕様書 ID を controll memo として手元に控えた

---

## 2. Branch 戦略

- ベースブランチ: **`dev`**（本リポジトリは dev → main の二段階フロー）
- 作業ブランチ命名: `feat/admin-attendance-analytics-redesign`
  - 既に存在する場合はそのまま使用、なければ `git switch -c feat/admin-attendance-analytics-redesign dev` で作成
- リモート push: `git push -u origin feat/admin-attendance-analytics-redesign`
- PR 方向: `feat/admin-attendance-analytics-redesign` → `dev`
- `main` への PR は本 Phase の対象外（dev マージ後、別途リリースフローで実施）

---

## 3. Commit Message Template（Conventional Commits）

すべてのコミットは [Conventional Commits](https://www.conventionalcommits.org/) に準拠。

```
<type>(<scope>): <subject in Japanese OK>

<body: なぜこの変更が必要か。what より why を優先>

<footer: Refs / BREAKING CHANGE / Co-authored-by>
```

### type 例

| type | 用途 |
|------|------|
| `feat` | 新機能（出席分析 UI の新ビュー追加など） |
| `fix` | バグ修正（404 ルーティング修正） |
| `refactor` | 振る舞いを変えないリファクタ |
| `test` | テスト追加・修正 |
| `docs` | ドキュメントのみ |
| `chore` | ビルド・依存・設定 |

### scope 例

`web`, `api`, `shared`, `specs`, `admin-attendance`

### 推奨コミット分割

1. `fix(web): admin 出席分析ページの 404 を修正（route 定義追加）`
2. `feat(web): 出席分析ダッシュボード UI を全面刷新`
3. `feat(api): 出席集計エンドポイントを追加`
4. `test: 出席分析の e2e / unit テストを追加`
5. `docs: admin-attendance-analytics-redesign workflow を追加`

> **禁止**: `--no-verify` / `--no-gpg-sign` 等の hook skip オプションは使用しない。pre-commit が失敗したら原因を修正してから再コミット（amend ではなく **新規 commit** を積む）。

---

## 4. PR Title / Description テンプレート

### Title（70 文字以内）

```
feat(admin): 出席分析ページの 404 修正と UI/UX 全面刷新
```

### Description（本文）

```markdown
## Summary

- Admin 出席分析ページの 404 ルーティング不具合を修正し、ユーザーがページに到達できる状態を復旧
- 出席データの可視化 UI/UX を全面刷新し、フィルタ・サマリ・推移グラフを統合
- 集計 API / 共有型 / specs / テストを追加し、フロント-バック整合性を担保

## 変更点

### Web（apps/web）
- `routes/admin/attendance-analytics` を追加（404 解消）
- ダッシュボードコンポーネント刷新（KPI カード、推移チャート、明細テーブル）
- 期間・対象・グルーピングのフィルタ UI 追加

### API（apps/api）
- `GET /admin/attendance/analytics` エンドポイント追加
- 集計クエリ（参加率・欠席理由分布・期間推移）を実装

### Shared（packages/shared）
- `AttendanceAnalyticsQuery` / `AttendanceAnalyticsResponse` 型定義を追加
- バリデーションスキーマ（zod）

### Specs / Docs
- `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/` を新設（Phase 1〜13）
- API 仕様書を更新

### Tests
- Unit: 集計ロジック・コンポーネント描画
- Integration: API エンドポイント
- E2E: 出席分析ページ到達 → フィルタ操作 → データ表示まで

## 404 原因と修正内容

**原因**: `apps/web/src/router.tsx`（または該当ルーター定義）に `/admin/attendance-analytics` のエントリが存在せず、SPA fallback が 404 を返していた。サイドナビからのリンクは存在していたため、リンク踏破時に発覚。

**修正**:
1. ルート定義に該当パスを追加
2. lazy import で対応ページコンポーネントを接続
3. 認可ガード（admin role 必須）を適用
4. リンク到達 → 描画までの e2e テストでリグレッションを防止

## 動作確認手順

1. `pnpm -w install && pnpm -w build`
2. `pnpm --filter @ubm/api dev` で API 起動
3. `pnpm --filter @ubm/web dev` で Web 起動
4. admin ユーザーでログイン
5. サイドナビ「出席分析」をクリック → 404 にならず、ダッシュボードが描画されることを確認
6. 期間フィルタ・対象フィルタを変更 → グラフ／テーブルが更新されることを確認

## Screenshots

> **添付してください**: `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/outputs/screenshots/` から before / after をアップロード。

- [ ] Before: 404 画面
- [ ] After: 新ダッシュボード（デフォルト表示）
- [ ] After: フィルタ適用後
- [ ] After: モバイル幅レスポンシブ

## Test plan

- [ ] `pnpm -w lint` 成功
- [ ] `pnpm -w typecheck` 成功
- [ ] `pnpm -w test` 成功（unit / integration）
- [ ] `pnpm -w build` 成功
- [ ] e2e: 出席分析ページ到達テスト pass
- [ ] Staging で admin ロールで動作確認
- [ ] 非 admin ロールではアクセス拒否されることを確認
- [ ] アクセシビリティ（キーボード操作・ラベル）目視確認

## Refs

- Workflow: `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/index.md`
- Phase artifacts: `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/artifacts.json`

---

Generated with workflow: admin-attendance-analytics-redesign (Phase 1〜13)
```

---

## 5. PR 作成コマンド

**ユーザー承認取得後** に以下を実行する。

```bash
# 5-1. 最終確認（diff / status）
git status
git diff dev...HEAD --stat

# 5-2. push（未 push の場合）
git push -u origin feat/admin-attendance-analytics-redesign

# 5-3. PR 作成
gh pr create \
  --base dev \
  --head feat/admin-attendance-analytics-redesign \
  --title "feat(admin): 出席分析ページの 404 修正と UI/UX 全面刷新" \
  --body "$(cat <<'EOF'
## Summary

- Admin 出席分析ページの 404 ルーティング不具合を修正し、ユーザーがページに到達できる状態を復旧
- 出席データの可視化 UI/UX を全面刷新し、フィルタ・サマリ・推移グラフを統合
- 集計 API / 共有型 / specs / テストを追加し、フロント-バック整合性を担保

## 変更点

### Web（apps/web）
- `routes/admin/attendance-analytics` を追加（404 解消）
- ダッシュボードコンポーネント刷新
- フィルタ UI 追加

### API（apps/api）
- `GET /admin/attendance/analytics` エンドポイント追加
- 集計クエリ実装

### Shared（packages/shared）
- 型 / zod スキーマ追加

### Specs / Docs
- `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/` Phase 1〜13

### Tests
- Unit / Integration / E2E

## 404 原因と修正内容

ルーター定義不足が原因。該当 path を追加し、lazy import + 認可ガード + e2e テストでリグレッション防止。

## 動作確認手順

1. `pnpm -w install && pnpm -w build`
2. API / Web を起動
3. admin でログイン → サイドナビ「出席分析」→ 描画確認
4. フィルタ操作 → 更新確認

## Screenshots

`docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/outputs/screenshots/` を添付。

## Test plan

- [ ] lint / typecheck / test / build すべて pass
- [ ] e2e: 出席分析到達テスト pass
- [ ] Staging で admin / 非 admin 両ロール検証
- [ ] アクセシビリティ目視確認

## Refs

- `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/index.md`
EOF
)"

# 5-4. URL を出力（user に共有）
gh pr view --json url --jq .url
```

---

## 6. 禁止事項

以下は **いかなる場合も禁止**。違反した場合は即座にロールバックする。

- `git commit --no-verify` / `--no-gpg-sign` 等 hook skip
- `git push --force` / `--force-with-lease`（ユーザー明示指示がある場合を除く）
- `dev` / `main` ブランチへの **直接 push**
- `dev` / `main` への force push（絶対禁止）
- `git config` の変更
- `git rebase -i` / `git add -i` 等 interactive コマンド
- 秘密情報（`.env`, credentials, token）を含むファイルの commit
- 既存 commit の `--amend`（pre-commit fail 時も amend ではなく新規 commit を積む）
- ユーザー承認前の `gh pr create` 自動実行

---

## 7. ユーザー承認待ち（自動実行禁止）

本 Phase は **必ず以下のフローを守る**:

1. Phase 1〜12 完了報告 + 事前条件チェックリスト充足を user に提示
2. PR title / description / 推定差分サイズを **dry-run** で user に提示
3. user から「OK」「PR 作成して」等の **明示承認** を取得
4. 承認取得後にのみ `gh pr create` を実行
5. 実行後は PR URL を即座に user に返却

> **承認が曖昧な場合は実行しない**。「たぶん良いと思う」「適当に判断して」では実行不可。明示的な GO サインが必要。

---

## 8. マージ後の Post-Action

PR がマージされたら以下を実施（別 Phase / 別タスクとして起票してもよい）。

### 8-1. Unassigned-task の GitHub Issue 化検討

本ワークフロー実行中に発生した未着手項目・将来課題を棚卸し、GitHub Issue として登録するかを検討する。

- 候補ソース:
  - `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/` 内の TODO / FIXME / 「次回検討」記述
  - Phase 4〜10 で deferred と判定した改善案
  - レビューコメントで「別 PR で対応」と合意した項目
- 起票方法: `github-issue-manager` skill を起動し、タスク仕様書 → Issue 変換フローで作成
- ラベル例: `enhancement`, `admin-attendance`, `tech-debt`

### 8-2. その他の post-action

- [ ] dev → main への昇格 PR を別途準備（リリースタイミングに合わせる）
- [ ] Notion ヒアリング DB に本ワークフローの完了を記録
- [ ] スクリーンショット / 動作録画を社内共有チャンネルへ投稿
- [ ] 関連ドキュメント（運用手順書・ナレッジベース）の更新有無を確認
- [ ] メトリクス計測（ページ到達率・滞在時間）の baseline を取得開始

---

## 完了判定

- [ ] PR が `dev` をベースに作成され URL を取得済み
- [ ] CI（GitHub Actions）が green
- [ ] レビュアーがアサインされている
- [ ] スクリーンショットが PR 本文に添付済み
- [ ] `artifacts.json` に PR URL を記録

以上を満たした時点で **Phase 13 完了** とする。
