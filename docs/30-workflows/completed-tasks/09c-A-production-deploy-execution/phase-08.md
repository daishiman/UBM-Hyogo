# Phase 8: DRY 化 — 09c-A-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-A-production-deploy-execution |
| phase | 8 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 状態 | spec_created |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |

## 目的

09a-A staging smoke / 09b-A observability runtime / 09b-B post-deploy smoke healthcheck と本タスク（09c-A production deploy execution）で重複する次の 5 領域を、本タスク側で「production 文脈に閉じる差分のみ」を残し、共通部品は外部リファレンスで参照する形へ整理する。

1. evidence 命名規則（`outputs/phase-11/{step}-{detail}.{ext}` の統一）
2. Cloudflare CLI ラッパー経路（`bash scripts/cf.sh` への一元化、`wrangler` 直書き全廃）
3. deploy 経路（`bash scripts/cf.sh deploy --config <path> --env production` を正規とする）
4. redaction 規則（secret マスク基準、log 取得時の grep / mask パターン）
5. 上流タスクとの evidence 重複（upstream-green-evidence の citation 化）

これにより、本タスクの runbook は 09c-A 固有の差分（main 昇格 / D1 backup / production migration apply / release tag / 24h verification）に焦点化される。

## 実行タスク

1. evidence 命名規則の正規化表を作成する。完了条件: Phase 1-3 で言及したすべての evidence path が表に含まれる。
2. Cloudflare CLI ラッパー経路を 1 系統に確定する。完了条件: `wrangler` 直書きが runbook / phase outputs から 0 件。
3. deploy 経路（pnpm filter vs cf.sh 直）の正規ルートを確定する。完了条件: Phase 5 ランブック内の deploy 行が 1 経路に揃う。
4. redaction 規則を共通化する。完了条件: secret マスク対象キー一覧と grep パターンが集約される。
5. 上流タスク（09a-A / 09b-A / 09b-B）との evidence 重複を citation 化する。完了条件: 上流の evidence は file path 引用のみ、本タスクで再取得しない。
6. 用語 audit を行い、production 表記の揺れを排除する。完了条件: `rg` で揺れ 0 hit。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-01/main.md | scope / AC / 13 ステップ |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-02/main.md | state machine / evidence path 設計 |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-03/main.md | 採用方針 / リスク |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-08.md | 完了済み 09c serial の DRY パターン |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | infrastructure runbook 正本 |
| 必須 | CLAUDE.md | Cloudflare CLI ルール（`scripts/cf.sh` 必須） |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md | OpenNext Workers deploy 経路 |

## 実行手順

### ステップ 1: evidence 命名規則の正規化

- すべての runtime evidence は `outputs/phase-11/` 直下に配置（screenshot サブディレクトリのみ例外）
- 命名形式: `{step-kind}-{detail}.{ext}`、timestamp 必要時は `{step-kind}-{detail}-{YYYYMMDD-HHMM}.{ext}`
- 命名表（Phase 1 / 2 から確定済み）を outputs/phase-08/main.md に集約

### ステップ 2: Cloudflare CLI ラッパー一元化

- 全 D1 / deploy / rollback / secret 操作は `bash scripts/cf.sh` 経由に統一
- `wrangler` / `npx wrangler` の直接実行は禁止（CLAUDE.md 規約）
- `wrangler login` でローカル OAuth トークンを保持しない（`.env` op 参照に一本化）

### ステップ 3: deploy 経路の正規ルート確定

- `apps/api` / `apps/web` の `package.json` に `deploy:production` script は **存在しない**（Phase 4 で確認済み）。Phase 1-3 が暫定的に記述した `pnpm --filter @ubm/api deploy:production` / `pnpm --filter @ubm/web deploy:production` は不採用とする。
- API 正規経路: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production`
- Web 正規経路: `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`（OpenNext build を必須前提）→ `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production`
- `wrangler` 直接実行は禁止（cf.sh wrapper 経由のみ）

### ステップ 4: redaction 規則の共通化

- mask 対象キー: `AUTH_SECRET` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_CLIENT_SECRET` / `MAIL_PROVIDER_KEY` / `RESEND_API_KEY` / `SLACK_WEBHOOK_URL` / `SENTRY_DSN` / `CLOUDFLARE_API_TOKEN`
- log 取得後に grep で mask 残留がないか確認
- 値は `***`（または wrangler 標準 mask）で残ることのみ許可

### ステップ 5: 上流 evidence の citation 化

- 09a-A / 09b-A / 09b-B の evidence は file path 引用のみ
- 本タスクの `outputs/phase-11/upstream-green-evidence.md` は citation を集約するだけ（生 log を再掲しない）

### ステップ 6: 用語 audit

- `rg -niw "プロダクション|本番系|prod系" docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/` で 0 hit
- `rg -niw "wrangler\s+(d1|deploy|rollback|secret)" docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/` で 0 hit（wrangler 直書き禁止）

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| Phase 9（品質保証） | DRY 化結果（命名規則 / CLI 経路 / redaction 規則）を品質ガード項目として再利用 |
| Phase 11（手動 smoke） | 統一された evidence 命名規則で実 evidence を配置 |
| 上流 09a-A | staging smoke evidence の citation のみ |
| 上流 09b-A | observability 疎通 evidence の citation のみ |
| 上流 09b-B | post-deploy smoke healthcheck evidence の citation のみ |

## 多角的チェック観点

- 不変条件 #5: smoke evidence で public/member/admin boundary を 1 ファイルずつ分離して記録（重複させない）
- 不変条件 #6: deploy 経路で `apps/web` から D1 を直接叩くコマンドが残らない（rollback でも禁止）
- 不変条件 #14: Cloudflare free-tier 確認は 24h verification の 1 ヶ所にまとめる（runbook 各所に分散させない）
- 未実装/未実測を PASS と扱わない: spec 段階で `pending_user_approval` を明示し、Phase 11 で実値に置換
- placeholder と実測 evidence を分離する: spec 内 placeholder は `<account>` / `<timestamp>` 等の角括弧表記で固定

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | evidence 命名規則統一 | 8 | pending | `outputs/phase-11/` フラット構造 + screenshots サブ |
| 2 | Cloudflare CLI 経路一元化 | 8 | pending | wrangler 直書き 0 件 |
| 3 | deploy 経路正規ルート確定 | 8 | pending | pnpm filter を正規 |
| 4 | redaction 規則共通化 | 8 | pending | mask 対象 8 種 |
| 5 | 上流 evidence citation 化 | 8 | pending | 09a-A / 09b-A / 09b-B |
| 6 | 用語 audit | 8 | pending | rg 0 hit |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果 / 命名規則表 / CLI 経路 / redaction 規則 / 用語 audit |

## 完了条件

- [ ] evidence 命名規則の正規化表が完成（Phase 1-2 の全 evidence path をカバー）
- [ ] `wrangler` 直書きが runbook / outputs から 0 件
- [ ] deploy 正規ルートが 1 経路に確定（pnpm filter）
- [ ] redaction 対象キー 8 種が列挙され grep パターンが整備
- [ ] 上流 evidence が citation のみで再取得しない設計
- [ ] 用語 audit で揺れ 0 hit

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ、次を渡す:
- 統一された evidence 命名規則
- Cloudflare CLI 一元化方針（`bash scripts/cf.sh`）
- deploy 正規ルート（pnpm filter）
- redaction 対象キーリスト
- 用語 audit 結果
