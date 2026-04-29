# Phase 6: 異常系検証 — failure cases

> 入力: Phase 4 test-strategy.md §4 / Phase 2 全成果物
> 目的: 投入後の永続停止リスクを類型化し、検出と是正の手順を整備する

## ケース一覧

### Case 1: 実在 context が `gh api` で取得できない

- **症状**: 投入後の PR で `Expected — Waiting for status to be reported` が永続表示
- **検出**: `gh api repos/:owner/:repo/commits/<pr-head>/check-runs --jq '[.check_runs[].name]'` に投入 context 名が含まれない
- **是正**: `staged-rollout-plan.md ロールバック手順` を実行し、当該 context を contexts から外す。Phase 4 で必ず実在確認 (Phase 4 §1) / phase-1 cut-off 3 条件 AND を遵守 (Phase 5 Step 4)。 admin で branch protection 編集→該当 context を contexts から外して save。

### Case 2: 同名 job が複数 workflow に存在

- **症状**: `lint` 等の汎用名が複数 workflow に存在し、context が `<workflow-A>/lint` と `<workflow-B>/lint` で別物として扱われる
- **検出**: `for f in .github/workflows/*.yml; do grep -E 'name:.*lint' "$f"; done` で重複確認
- **是正**: `<workflow>/<job>` フルパスを `confirmed-contexts.yml` で必ず使用。AC-8 に該当。

### Case 3: matrix 展開後の名前不一致

- **症状**: `strategy.matrix` で `os: [ubuntu-latest, macos-latest]` 等を展開すると context 名が `<workflow>/<job> (ubuntu-latest)` のように変化
- **検出**: `gh run view <run-id> --json jobs --jq '.jobs[].name'` で実 context 名を観測
- **是正**: matrix 展開後の最終 context 名を全件 `confirmed-contexts.yml` に列挙する（本タスクでは matrix 利用 workflow なし）

### Case 4: workflow refactor 直後の名前変更

- **症状**: `name:` を変更した PR がマージされた瞬間、過去の context は実績ゼロとなり次の PR で merge 永続停止
- **検出**: PR diff で `^name:` 行の変更を検出する CI（推奨は UT-GOV-007 で実装）
- **是正**: `staged-rollout-plan.md §名前変更事故対応` の経路 A / B を遵守

### Case 5: pull_request トリガ未設定 workflow を投入

- **症状**: feature ブランチの PR で対象 workflow が起動せず、`Expected — Waiting for status to be reported` が永続化
- **検出**: workflow yml の `on:` セクションに `pull_request:` が無い
- **是正**: 投入候補から除外（本タスクでは `backend-ci` / `web-cd` が該当）

### Case 6: lefthook と CI のスクリプト乖離

- **症状**: ローカル lefthook PASS だが CI FAIL
- **検出**: PR check-run の失敗ログを確認、`lefthook.yml` の `run:` と workflow `run:` を diff
- **是正**: 同一 pnpm script を呼ぶ規約 (`lefthook-ci-correspondence.md §2`) に従い同一 PR で修正

### Case 7: GitHub Actions outage / API rate limit

- **症状**: status check が永続 pending
- **検出**: GitHub Status (https://www.githubstatus.com/) で incident 確認
- **是正**: 一時的な現象のため待機。長時間継続する場合は `staged-rollout-plan.md ロールバック` を実行

## 検出マトリクス

| ケース | AC との対応 | 検出手段 | 是正手順 |
| --- | --- | --- | --- |
| 1 | AC-3 / AC-4 | `gh api check-runs` | ロールバック |
| 2 | AC-8 | grep | フルパス記載 |
| 3 | AC-2 / AC-8 | `gh run view` | matrix 後 context を全列挙 |
| 4 | AC-9 | PR diff CI | 経路 A / B |
| 5 | AC-3 | yml の `on:` 検査 | 投入除外 |
| 6 | AC-5 | PR ログ + diff | 同一 script に揃える |
| 7 | n/a | GitHub Status | 待機 / 一時 ロールバック |

## phase-1 投入対象

ケース 1〜7 を踏まえ、`required-contexts-final.md` の 3 件は phase-1 投入対象として確定。
