# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | FIX-CF-ACCT-ID-VARS-001 |
| Phase | 6 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 実行タスク

1. 本 Phase の入力と制約を確認する。
2. 本 Phase の成果物に必要な判断、手順、証跡を記録する。
3. 完了条件と artifacts ledger の整合を確認する。

## 目的

設定ミス・操作ミス・GitHub 側状態変化に対する fail path を列挙し、検出経路を確認する。


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

- Phase 4 成果物（テスト戦略）
- Phase 5 成果物（実装ランブック）

## 異常系シナリオ

| シナリオ ID | 想定異常 | 検出経路 | 期待される挙動 |
| --- | --- | --- | --- |
| FC-01 | `vars.CLOUDFLARE_ACCOUNT_ID` Variable が削除されている | TC-S05（事前 `gh api` 確認）で発見 | Phase 5 着手前に検出。Phase 1 へ差し戻し |
| FC-02 | 置換中に `replace_all` が `secrets.CLOUDFLARE_API_TOKEN` まで巻き込む | TC-S06（diff 目視）で発見 | 置換対象文字列が完全一致するためそもそも発生しない。万一の場合は revert |
| FC-03 | yaml 構文崩れ（quote / インデント） | TC-S03 / TC-S04 で発見 | actionlint / yamllint がエラー出力。Phase 5 で修正 |
| FC-04 | マージ後も Authentication error が継続 | TC-R01 / TC-R02 / TC-R03 で発見 | Token 側の権限問題。本タスク scope 外として `unassigned-task-detection.md` で API Token 監査タスクを起票 |
| FC-05 | `wrangler` が別の API（`/memberships` 以外）で 401 を出す | TC-R03 の判定基準 | 別 root cause。本修正の効果を否定しない（revert 不要）。新規 unassigned-task で扱う |
| FC-06 | `vars.CLOUDFLARE_ACCOUNT_ID` の値が誤った Account ID | wrangler が `account not found` で fail | 本タスク scope 外（Variable 登録運用は UT-27） |
| FC-07 | dev ブランチ push で deploy-staging も同時に壊れる | `gh run list --branch dev` で確認 | 同じ参照を使うため修正で同時に直る。staging 側回帰確認は optional |
| FC-08 | 他のワークフロー（`ci.yml` 等）が誤って影響を受ける | TC-S07 で発見 | `replace_all` の対象は backend-ci.yml / web-cd.yml のみであり該当しない |

## エラーハンドリング方針

本タスクは「設定値参照名の変更」のみで実行時ロジックを含まないため、コードレベルの try/catch / fallback は対象外。検出経路はすべて CI / GitHub API / actionlint / git diff に委ねる。

## 監視・通知

| 観点 | 経路 |
| --- | --- |
| マージ後の deploy-production 結果 | GitHub Actions 通知（既存） |
| Authentication error 再発 | run log で `code: 10000` を grep |
| Cloudflare 側設定変更（Token 失効等） | 別タスク scope（API Token 監査タスク） |


## 統合テスト連携

- 本タスクは GitHub Actions workflow の設定修正であり、アプリケーション統合テストの追加は行わない。
- 代替検証は Phase 4 / Phase 5 / Phase 11 の grep、actionlint、yamllint、GitHub API、GitHub Actions run 確認で担保する。

## 完了条件

- [ ] 異常系シナリオが ID 付きで列挙されている
- [ ] 各シナリオに検出経路と期待挙動が紐付いている
- [ ] scope 外のシナリオが派生タスク化候補として明記されている

## 成果物

- `outputs/phase-06/main.md`
