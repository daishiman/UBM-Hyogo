# Phase 12 Skill Feedback Report

state: implemented-local
workflow_id: issue-351-09c-post-release-dashboard-automation

## テンプレ改善

NON_VISUAL implementation でも、実装対象が GitHub Actions workflow の場合は `phase-02` に workflow YAML skeleton を置くだけでは不足しやすい。Phase 12 review では、仕様書本文と `outputs/phase-12/*.md` の実体が分離していないかを必ず確認する gate が必要。

提案:

- `task-specification-creator` の Phase 12 template に「outputs 側の各ファイルが placeholder でないこと」を grep する項目を追加する
- GitHub Actions workflow 追加タスクでは `actionlint` / `yamllint` / workflow secret negative grep を Phase 9 標準に入れる

## ワークフロー改善

read-only analytics token は production deploy token と分離する必要がある。今回、`scripts/cf.sh api-post` を `/client/v4/*` 全体に開くと read-only 境界と矛盾することがレビューで検出された。

提案:

- `aiworkflow-requirements` の Cloudflare CLI wrapper パターンに「汎用 POST ではなく用途別 endpoint allowlist」を明記する
- `_READONLY` suffix の token は GraphQL / read-only endpoint 専用に固定し、mutation endpoint は別 operation approval に分離する

## ドキュメント改善

仕様書上の `spec_created` と実差分上の実装済みファイルが混在すると、Phase 12 の close-out 判定が壊れる。今回レビューでは、実態優先で workflow / collector を実装し、state を `implemented-local` に揃えた。

提案:

- Phase 12 compliance に `git diff --name-status` の分類表（docs / code / skill / workflow / deletion）を必須化する
- 起票元 unassigned を formalize した場合、元 task の `ステータス` 更新を close-out checklist に入れる
