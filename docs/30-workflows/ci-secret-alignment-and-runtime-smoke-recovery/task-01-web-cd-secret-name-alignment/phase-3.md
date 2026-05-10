# Phase 3: 設計レビュー / 実装計画（task-01）

| 項目 | 値 |
|------|----|
| 入力 | `phase-2.md` 完了 |
| 出力 | 変更対象ファイル一覧、差分行数見積、依存・並列性、レビュー結論 |

---

## 1. 変更対象ファイル一覧

| path | 種別 | 主要変更点 | 行数見積 |
|------|------|-----------|----------|
| `.github/workflows/web-cd.yml` | edit | (a) line 22 `CF_TOKEN_WORKERS_STAGING` → `CLOUDFLARE_API_TOKEN`、(b) line 56 `CF_TOKEN_WORKERS_PRODUCTION` → `CLOUDFLARE_API_TOKEN`、(c) `Verify CF token is present` step を 2 箇所追加 | +12 / -2 |

他ファイル変更なし。`scripts/cf.sh` は変更禁止。

---

## 2. 依存と並列性

| 種別 | 内容 | 状態 |
|------|------|------|
| depends-on | GitHub Environment `staging` / `production` の `CLOUDFLARE_API_TOKEN` 登録 | 完了（phase-1.md §3） |
| depends-on | Repo Variable `CLOUDFLARE_ACCOUNT_ID` | 完了 |
| 並列性 | task-02（runtime-smoke-staging readiness gate）と並列 PR 可。ファイル衝突なし | — |
| blocks | なし | — |

---

## 3. レビュー観点と結論

| # | 観点 | 結論 |
|---|------|------|
| R-01 | secret 名統一案 (D1-A) は他 workflow と整合するか | 整合。`backend-ci.yml` 等既存参照と同名で衝突なし |
| R-02 | `Verify CF token is present` step の配置位置 | mise-action 後、Install dependencies 前で確定（phase-2 §2.4） |
| R-03 | 既存 step ロジックへの副作用 | なし（同 token を別経路で渡すだけ） |
| R-04 | rollback 容易性 | `git revert <sha>` で即座に旧形式に戻せる |
| R-05 | `production` 反映の妥当性 | 同症状再発防止のため今サイクルで両方修正（不変条件 4） |

---

## 4. リスクと緩和

| リスク | 影響 | 緩和 |
|---|---|---|
| `dev` 以外の branch から `secrets.CLOUDFLARE_API_TOKEN` を参照する別 workflow との名前衝突 | 低 | 既存 `backend-ci.yml` も同名を参照しており衝突なし（grep 確認済み） |
| `production` Environment の token scope 不足 | 中 | 既登録 token は staging と同一 scope を想定。違うなら `gh secret set` でユーザー操作（AI 不実行） |
| `Verify CF token is present` の `<env>` 文字列 typo | 低 | 静的 grep gate と PR レビュー時の目視 |

---

## 5. 想定スケジュール

| stage | 所要 |
|-------|------|
| Phase 5 実装（YAML 編集） | 約 5 分 |
| Phase 6 静的検証 | 約 5 分 |
| Phase 7 dev push 後の `gh run watch` | 約 5〜10 分 |
| Phase 11 evidence 収集 | 約 5 分 |
| Phase 13 PR 作成 | 約 5 分 |

---

## 6. exit criteria

| # | 条件 |
|---|------|
| EX-01 | inventory 1 件・差分行数見積が確定 |
| EX-02 | 並列性 / 依存関係が表で確定 |
| EX-03 | レビュー観点 R-01..R-05 が結論済み |
| EX-04 | リスクと緩和が表で確定 |
