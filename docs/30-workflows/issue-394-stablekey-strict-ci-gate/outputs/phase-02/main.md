# Phase 2: 設計 — outputs/main

## 判定

`PASS_WITH_BLOCKER`。設計のみ確定し、ci.yml 編集は legacy cleanup 完了後の wave で実行する。

## 変更対象ファイル一覧（条件付き）

| パス | 変更種別 | 適用タイミング |
| --- | --- | --- |
| `.github/workflows/ci.yml` | step 追加 | strict violations = 0 達成後 |
| `docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/index.md` | AC-7 ステータス更新 | 同上（cleanup + CI gate merged 後） |
| `docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/outputs/phase-12/implementation-guide.md` | AC-7 を `fully enforced` に更新 | 同上 |
| `.claude/skills/aiworkflow-requirements/indexes/*` `references/*` | 記述更新 | 本サイクル（doc 整合のみ） |

## ci.yml 差分設計（適用待ち）

詳細は `outputs/phase-02/ci-yml-diff-design.md` を参照。

## 関数 / モジュールシグネチャ

該当なし（YAML 設定 + 既存 mjs スクリプトの呼び出し）。

## 入出力 / 副作用

- 入力: リポジトリ全ファイル（mjs スクリプトが走査）
- 出力: exit code、stdout 違反一覧
- 副作用: CI 実行時のみ。コードベース無変更。

## 完了条件チェック

- [x] index.md の AC と矛盾しない。
- [x] strict 0 violations 未達時は blocking CI gate を有効化しない方針を維持。
- [x] 設計成果物 `ci-yml-diff-design.md` を本 Phase で出力。
