# U-VIDX-01 verify-indexes-up-to-date 実機 smoke と branch protection 登録 - タスク指示書

## メタ情報

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | U-VIDX-01                                                           |
| タスク名     | verify-indexes-up-to-date GitHub Actions 実機 smoke + branch protection 登録 |
| 分類         | 運用 / CI gate                                                      |
| 対象機能     | `.github/workflows/verify-indexes.yml` / GitHub branch protection   |
| 優先度       | 高 (HIGH)                                                           |
| 見積もり規模 | 小規模                                                              |
| ステータス   | 未実施                                                              |
| 発見元       | task-verify-indexes-up-to-date-ci Phase 11                          |
| 発見日       | 2026-04-28                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`verify-indexes-up-to-date` job は `.github/workflows/verify-indexes.yml` に追加済みだが、Phase 11 では local static smoke（YAML 構文 / job 構造の静的検証）のみを実施した。PR マージ後の GitHub Actions 上での実機初回実行確認、および branch protection の `required_status_checks` への登録が宙に浮いている。

### 1.2 問題点・課題

- 実機 Actions ランの green 確認が未実施で、runner 上での `pnpm indexes:rebuild` / drift 判定の動作保証がない。
- branch protection に登録されていない限り、indexes drift があっても dev / main へのマージを物理的に止められない。

### 1.3 放置した場合の影響

- indexes drift PR が gate されずマージされ、`aiworkflow-requirements/indexes` の整合性が再び劣化する。
- CI gate を整えた意義（drift 検知の自動化）が運用上機能しない。

---

## 2. 何を達成するか（What）

### 2.1 目的

`verify-indexes-up-to-date` を実機で動作確認し、dev / main の必須 status check に登録して drift PR を物理的にブロックする。

### 2.2 最終ゴール

- PR / push 経由で job が green / red を正しく返すことを実機で確認済み。
- dev / main の `required_status_checks` に `verify-indexes-up-to-date` が登録済み。

### 2.3 スコープ

#### 含むもの

- 当該 PR マージ後の Actions 実行ログ確認
- 意図的 drift PR を作成しての fail 確認（任意）
- `gh api` で branch protection 設定更新

#### 含まないもの

- 他 skill indexes への横展開（U-VIDX-02 で扱う）

### 2.4 成果物

- branch protection 更新の実行記録（runbook 追記または PR）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `.github/workflows/verify-indexes.yml` を含む PR がマージ済み
- branch protection 編集権限を持つ GitHub アカウント

### 3.2 依存タスク

- task-verify-indexes-up-to-date-ci 本体 PR のマージ

### 3.3 推奨アプローチ

1. PR マージ後の最初の Actions ラン green を確認。
2. dev / main に対する branch protection に `verify-indexes-up-to-date` を追加。
3. 後追い検証として軽微な drift commit を別ブランチで作り fail 表示を確認（任意）。

---

## 4. 完了条件

- [ ] PR マージ後の `verify-indexes-up-to-date` が main / dev で green 実績あり
- [ ] dev / main の required status checks に登録済み
- [ ] 設定変更が runbook または task ログに記録済み

---

## 5. 関連仕様書リンク

- `.github/workflows/verify-indexes.yml`
- `docs/30-workflows/task-verify-indexes-up-to-date-ci/`（Phase 11 静的 smoke 結果）
- `doc/00-getting-started-manual/lefthook-operations.md`

---

## 6. 引き継ぎ先

branch protection 運用 / CI gate 強化系タスクのフォローアップとして取り込み。
