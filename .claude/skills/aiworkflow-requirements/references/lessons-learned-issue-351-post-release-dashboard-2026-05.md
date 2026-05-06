# Lessons Learned — Issue #351 09c Post-Release Dashboard Automation（2026-05-05）

> task: `issue-351-09c-post-release-dashboard-automation`
> 関連 spec: `references/deployment-cloudflare-opennext-workers.md`（§14 analytics read-only token）、`references/deployment-gha.md`（Post-release dashboard automation セクション）、`references/task-workflow-active.md`（Issue #351 行）
> 関連 source: `.github/workflows/post-release-dashboard.yml`、`scripts/post-release-dashboard/{collect.sh,lib/*.sh,__tests__/*.sh}`、`scripts/cf.sh`（api-post GraphQL allowlist）、`docs/30-workflows/issue-351-09c-post-release-dashboard-automation/`
> 関連 reference: `references/workflow-issue-351-09c-post-release-dashboard-automation-artifact-inventory.md`、`changelog/20260505-issue351-post-release-dashboard.md`

## 教訓一覧

### L-351-001: Cloudflare API wrapper の汎用 POST は read-only 境界を破る — 用途別 endpoint allowlist で fail-closed にする

- **背景**: 初期実装の `scripts/cf.sh api-post` は `/client/v4/*` 全体を許可していた。Phase 12 review で「`CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` を read-only suffix で運用しつつ汎用 mutation endpoint も叩ける」設計矛盾が検出された。誤って `/client/v4/zones/*/dns_records` 等の mutation endpoint に渡ると、token scope が deny する前にローカル wrapper で書き込み可能扱いになる。
- **教訓**: `_READONLY` suffix の token は **GraphQL endpoint (`/client/v4/graphql`) 専用**に固定し、`api-post` の引数 path を `/client/v4/graphql` 以外で fail-closed (`exit 2`) にする allowlist guard を入れる。汎用 POST を許す wrapper は token suffix と整合させない。mutation 系操作は別 sub-command（`d1`/`deploy`/`rollback`）として明示的に分離する。
- **将来アクション**: 新規に Cloudflare API を使う際は、(1) token suffix と (2) wrapper sub-command の対応表を `references/deployment-cloudflare-opennext-workers.md` §14 に追記する。`scripts/cf.sh` に endpoint allowlist の test harness（`scripts/post-release-dashboard/__tests__/`）を必ず追加する。

### L-351-002: Phase 12 outputs の placeholder と spec 本文の分離を grep gate で必ず検出する

- **背景**: Phase 12 review 着手時、`outputs/phase-12/*.md` の各ファイルは仕様書本文（`phase-12.md`）の writeup と分離しておらず、placeholder（"TBD" / 空 H2 セクションのみ）状態で `state: completed` を主張していた。compliance-check は「7 ファイル存在」だけで PASS 扱いになっており、実体未充足のリスクが見えなかった。
- **教訓**: Phase 12 close-out では **outputs 各ファイルの実体性を grep / wc -l で検証する gate** を必須化する。具体的には `find outputs/phase-12 -name '*.md' -exec wc -l {} +` の最低行数（`main.md` は state/summary/verification を含むため 20 行以上、各 strict output ファイルは見出し + 本文で 15 行以上）を compliance-check に明示する。`state: completed` 宣言の前に grep gate を強制する。
- **将来アクション**: `task-specification-creator` skill の Phase 12 template に「outputs 各ファイルの実体充足 grep」項目を追加し、`phase12-task-spec-compliance-check.md` の Mandatory Checks に「outputs file body density」を含める。

### L-351-003: `spec_created` ↔ `implemented-local` の state drift は Phase 12 で `git diff --name-status` 分類表により可視化する

- **背景**: 本タスクは当初 `spec_created` 状態で着手したが、レビューと並行して workflow YAML / collector スクリプト / cf.sh 修正を実装したため、`spec_created` でありながら実装済みファイルが多数存在する drift が発生した。Phase 12 review 時に「state は `spec_created` のままで良いのか / `implemented-local` に揃えるべきか」が判断不能になりかけた。
- **教訓**: Phase 12 close-out で実装ファイル差分が観測される場合は、**`git diff main...HEAD --name-status` を docs / code / skill / workflow / deletion の 5 分類で `system-spec-update-summary.md` に列挙**し、code/workflow に diff があれば state を `implemented-local` に揃える。逆に docs のみの場合は `spec_created` のまま完了させる。state 宣言は実差分から導出する。
- **将来アクション**: `phase12-task-spec-compliance-check.md` の必須項目に「state derivation from diff classification」を追加。state 値は spec 起票時の declaration ではなく Phase 12 close-out 時の実差分から導出するルールを `task-specification-creator` skill template に明記する。

### L-351-004: 起票元 unassigned task は Phase 12 で `formalized` stub に変換し close-out checklist に含める

- **背景**: `docs/30-workflows/unassigned-task/task-09c-post-release-dashboard-automation-001.md` を起票元として workflow を formalize したが、Phase 12 close-out で元 task の `ステータス` 更新を忘れると、未タスク台帳に「実装済みなのに pending」項目が残り、次回 unassigned-task 棚卸しでノイズになる。
- **教訓**: 起票元 unassigned task を formalize した場合、Phase 12 close-out checklist に **「元 unassigned task を `formalized` stub に変換し、formalized workflow へのリンク行を残す」** ステップを必ず含める。stub 化のフォーマットは: `ステータス: formalized` / `→ 移行先: docs/30-workflows/<workflow-id>/` / 苦戦箇所・スコープ等の本文は元のまま保持。
- **将来アクション**: `task-specification-creator` skill の unassigned task テンプレに `formalized` stub 雛形を追加。`phase12-task-spec-compliance-check.md` の必須項目に「source unassigned task formalized state check」を加える。

### L-351-005: GitHub Actions workflow 追加タスクは `actionlint` / `yamllint` / workflow secret negative grep を Phase 9 標準に組み込む

- **背景**: `.github/workflows/post-release-dashboard.yml` は schedule (`0 0 * * *`) / workflow_dispatch / `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` secret / retention 90日 / redaction grep gate を含むが、Phase 9 standard checks に YAML-specific lint / secret 漏洩 grep が無く、シークレット名 typo や schedule cron syntax の検証が手動だった。
- **教訓**: GitHub Actions workflow 追加 / 修正タスクでは Phase 9 quality gate に **`actionlint`**（cron syntax / job dependency / step ID 検証）、**`yamllint`**（indentation / trailing space）、**workflow secret negative grep**（`grep -E "secrets\.[A-Z_]+" .github/workflows/*.yml` で expected list と一致確認）を必須化する。
- **将来アクション**: `references/deployment-gha.md` の Phase 9 quality gate セクションに actionlint / yamllint / secret negative grep の三点セットを明文化。`task-specification-creator` skill の `WORKFLOW_AUTOMATION` モードでデフォルト Phase 9 として組み込む。

### L-351-006: 本番実行 evidence（real workflow_dispatch / scheduled run）は user gate を明示的に Phase 13 に積み残す

- **背景**: schedule (`0 0 * * *` UTC) と 30 日連続 conclusion 集計 (U-1) は「外部時間依存 + production secret 使用」のため、Phase 11 evidence では取得できず、Phase 13 user approval 後の本番実行が必要。Phase 12 で `state: completed` を主張しつつ runtime gate を defer する書き方が必要。
- **教訓**: 外部時間依存 / production secret 使用 / cross-system integration を含む evidence は、Phase 11 では `blocked_runtime_evidence`、Phase 12 は `completed`（implementation-local）、Phase 13 は `pending_user_approval` の 3 段階で artifacts.json / compliance check を分離する。`outputs/phase-12/main.md` の Runtime gate セクションに **「Real `workflow_dispatch`、scheduled run evidence、commit/push/PR は explicit user approval まで blocked」** を明示する。
- **将来アクション**: `task-specification-creator` skill の `NON_VISUAL_PRODUCTION_EVIDENCE` モードに 3 段階分離テンプレを追加。`phase12-task-spec-compliance-check.md` の Mandatory Checks に「runtime gate explicit deferral note」を含める。
