# skill-feedback-report

09b 実行で得たノウハウ・改善提案・不要だった作業をまとめる。task-specification-creator / aiworkflow-requirements / github-issue-manager 等のメタスキルへのフィードバックを含む。

## 1. 学んだこと

### 1.1 cron は `[triggers]` と `[env.production.triggers]` の両方に必ず定義

- staging（top-level `[triggers]`）と production（`[env.production.triggers]`）で cron を一致させないと、production で cron が動かない事故が起きる
- runbook Step 1 の sanity check に「2 箇所同一表記」を必ず含める

### 1.2 sync_jobs running guard は spec/03-data-fetching.md と一致させる

- 09b は cron 設計担当だが、spec の running guard 仕様（30 分タイムアウト、stale 行の `failed` 化）を runbook に転記しないと運用者が混乱する
- spec に 1 次情報、runbook に運用 step、cron-deployment-runbook Step 3 で具体 SQL という三段構成

### 1.3 rollback は worker / pages / D1 / cron の 4 種を別々に書く

- 一括 rollback script を作る誘惑があるが、**障害種別ごとに最小実行範囲** を保つ方が安全
- 4 種を独立に手順化することで、誤操作で web/api/cron 全体に波及することを防げる

### 1.4 docs-only / spec_created タスクで NON_VISUAL の証跡

- screenshot を取る代わりに「実行予定コマンド + 期待出力」をテンプレ化するのが効率的
- 9c（実 deploy）でテンプレを埋める運用にすると 09b の作業範囲を逸脱せずに済む

### 1.5 用語 / URL 命名規則の DRY 化（Phase 8）が rollback / incident 時の認知負荷を激減させる

- `<placeholder>`、`<account>`、`<deploy_id>` 表記を統一
- env var `ANALYTICS_URL_*` / `STAGING_*` / `PRODUCTION_*` を 09a / 09b / 09c で共通化

## 2. 改善提案

### 2.1 cron schedule の単体検証スクリプト追加

- `scripts/verify-cron.sh`（仮）で wrangler.toml の `crons` を grep + cron expression validator で確認
- CI に組み込めば、cron 表記ミス（4 フィールド / 6 フィールド誤り）を pre-merge で検出可能

### 2.2 Cloudflare Analytics URL を env var 化

- 現状 runbook 内に URL 文字列として placeholder で書いているが、`.env`（op 参照）で env var として注入し、運用 script から直接 click できるようにすると便利
- 1Password 経由なので実 URL は git 管理外

### 2.3 incident response runbook の自動 trigger

- sync_jobs.failed が 3 連続で GitHub Issue 自動作成 → assignee 通知
- unassigned-task-detection.md § 4 で別 task として候補化済み

### 2.4 runbook 内の SQL 例を `.sql` ファイルとして apps/api/sql/runbook/ に切り出し

- runbook のメンテと SQL のメンテを分離
- 一方で過度な分離は runbook の self-contained 性を損なうので、cross-link で補う

## 3. 不要だった作業

### 3.1 Sentry の実接続

- placeholder で十分。実接続は別 task（UT-OBS-SENTRY-001）に切り出した
- 09b の scope に Sentry を含めると secret rotation や Sentry 有料 plan 加入の判断まで巻き込まれ、単一責務が崩れる

### 3.2 alternative A/B 案（cron `*/5` / `0 18 * * *` のみ）の詳細試算

- Phase 3 で C 案採択が早期確定したため、A/B の詳細試算（Forms API rate に対する余裕度等）は不要だった
- ただし PASS-MINOR-MAJOR の 12 セルを埋めるためには alternative の Pros/Cons は必要だったので、概要レベルで十分

### 3.3 release runbook の sh script 化

- 本 wave 内で sh script 化すると docs-only タスクの scope を超える
- markdown の手順書 + 共通 snippet 抽出（Phase 8）で十分機能する

## 4. メタスキルへの feedback

### 4.1 task-specification-creator

- 13 phase の構造は spec_created タスクには十分機能した
- Phase 11（手動 smoke）が NON_VISUAL タスクで「screenshot N/A」を明示できる構造になっているのは助かる
- 改善: spec_created タスクでは Phase 11 が必須でないこともあるため、`workflow_state` ベースで phase の skip 判定を入れられると効率的。本件は `docs/30-workflows/unassigned-task/task-phase11-nonvisual-evidence-template-sync.md` 系の既存課題と重複確認対象にする

### 4.2 aiworkflow-requirements

- spec/15-infrastructure-runbook.md / spec/03-data-fetching.md / spec/08-free-database.md の参照経路が明確で、cron / rollback / 無料枠の根拠を引きやすかった
- 改善: 不変条件 #15 の attendance 整合性 SQL の正本テンプレを references/* に集約しておくと、各 task で重複記述が減る。本件は `task-db-syncjobs-unique-001.md` とは別に、09c 実運用後の runbook spec 昇格 follow-up で扱う

### 4.3 github-issue-manager

- 09b では未使用（PR 作成は Phase 13 でユーザー承認後）
- unassigned-task-detection.md の candidate task を将来 issue 化するときに利用予定

## 5. まとめ

09b は docs-only / spec_created タスクとして、release-runbook / incident-response-runbook を含む 26 ファイルの outputs を生成した。最重要成果物（release-runbook.md / incident-response-runbook.md）は 09c で再利用される構成になっており、不変条件 #5/#6/#10/#15 は phase12-task-spec-compliance-check.md で完全担保している。

次に同種の release runbook タスクを実行する場合は、本 wave の Phase 8 DRY 化結果（用語 / URL / snippet）を起点にすると効率が上がる。
