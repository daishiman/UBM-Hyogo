# Phase 9: 品質保証 — issue-353-09c-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-353-09c-production-deploy-execution |
| phase | 9 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 状態 | spec_created |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |

## 目的

production deploy 着手の **直前ゲート** として、以下 6 軸を全 PASS にしてから Phase 10 / 11 へ進めるかを決める。Phase 9 は spec 段階では「検証コマンドと判定基準」を確定し、実値判定は Phase 11 着手前のチェックリストとして用いる。本タスクは Phase 10 reviewer + Phase 11 mutation approvals + Phase 13 user approval の **3 段（または mutation 単位で 5 段）approval gate** を伴うため、Phase 9 はこれら approval の判断材料を準備する責務を持つ。

## 実行タスク

1. 静的検証（typecheck / lint / build）の実行コマンドと判定基準を確定する。完了条件: `mise exec --` 経由の 3 コマンドが evidence path 付きで列挙される。
2. 上流（09a-A / 09b-A / 09b-B）の green 確認手順を確定する。完了条件: 各上流の必須 evidence path が citable である。
3. 09b-A observability の疎通確認手順を確定する。完了条件: Sentry / Slack / Logpush の 3 経路の疎通テストコマンドが揃う。
4. redaction 検証手順を確定する。完了条件: secret leak チェックの grep パターンが Phase 8 から継承され実行可能。
5. **二重承認ゲート**（Phase 10 reviewer + Phase 13 user）を明示する。完了条件: 両 gate の発動条件と未取得時の停止挙動が記録される。
6. Phase 11 着手前の preflight チェックリストを作成する。完了条件: 6 軸すべてに PASS 判定欄がある。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-01/main.md | scope / blocker 一覧 |
| 必須 | docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-03/main.md | リスク R1-R12 / GO-NO-GO |
| 必須 | docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-08/main.md | DRY 化（命名規則 / CLI 経路 / redaction） |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | infrastructure runbook |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | 無料枠仕様 |
| 必須 | CLAUDE.md | 品質ガード / Cloudflare CLI / secret 管理 |
| 参考 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-09.md | 6 軸品質ガード |

依存 Phase: Phase 5。

## 実行手順

### ステップ 1: 静的検証（preflight）

実行コマンドと evidence path:

```bash
mise exec -- pnpm typecheck > docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-11/preflight-typecheck.md 2>&1
mise exec -- pnpm lint      > docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-11/preflight-lint.md      2>&1
mise exec -- pnpm build     > docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-11/preflight-build.md     2>&1
```

判定: 3 コマンドすべて exit 0 で PASS。1 件でも失敗で NO-GO。`mise exec --` を必ず付ける（Node 24 / pnpm 10 を保証、CLAUDE.md より）。

### ステップ 2: 上流 staging smoke green の citation

`outputs/phase-11/upstream-green-evidence.md` に次を記録（Phase 8 で確定した citation テンプレを使用）:

| 上流 | 必須 evidence | 判定 |
| --- | --- | --- |
| 09a-A staging smoke | `docs/30-workflows/09a-A-*/outputs/phase-11/smoke-public.md` / `smoke-member.md` / `smoke-admin.md` | 全 10 ルート 200 / authz green |
| 09b-A observability | 後述ステップ 3 で疎通確認結果 | Sentry / Slack / Logpush 3 経路 PASS |
| 09b-B post-deploy smoke | `docs/30-workflows/09b-B-*/outputs/phase-11/`（想定） | silent failure 検知 PASS |

判定: 3 上流すべて green で PASS。1 件でも未 green / 未取得で NO-GO（待機）。

### ステップ 3: observability 疎通確認

09b-A で構築済みの observability 経路を本タスク実行前に再確認する（疎通テスト）:

| 経路 | 確認方法 | evidence |
| --- | --- | --- |
| Sentry（API / Web） | 09b-A の test endpoint または手動例外発火で Sentry に到達することを確認（production binding） | `outputs/phase-11/observability-sentry.md` |
| Slack incident channel | 09b-A の test webhook で Slack に到達することを確認 | `outputs/phase-11/observability-slack.md` |
| Logpush（Cloudflare → 受信先） | Cloudflare Dashboard の Logpush 設定 active 確認 + 直近 1 件の log 配信記録 | `outputs/phase-11/observability-logpush.md` |

判定: 3 経路すべて到達 PASS で OK。1 件でも疎通失敗で NO-GO（09b-A に差し戻し）。

> 注: observability 自体の構築は **09b-A の責務（scope out）**。本タスクは **疎通の事前確認のみ**。

### ステップ 4: redaction 検証

Phase 8 で確定した検証コマンドを実行し、`outputs/phase-11/redaction-check.md` に結果を記録:

```bash
# secret 値混入チェック（リポジトリ全体 + 本タスク outputs）
rg -nE "(AUTH_SECRET|GOOGLE_(PRIVATE_KEY|CLIENT_SECRET)|MAIL_PROVIDER_KEY|RESEND_API_KEY|SLACK_WEBHOOK_URL|SENTRY_DSN|CLOUDFLARE_API_TOKEN)\s*[:=]\s*[A-Za-z0-9_\-]{6,}" \
  docs/30-workflows/issue-353-09c-production-deploy-execution/

# wrangler 直書きチェック
rg -niw "wrangler\s+(d1|deploy|rollback|secret|whoami)" \
  docs/30-workflows/issue-353-09c-production-deploy-execution/

# .env 平文チェック
git grep -nE "AUTH_SECRET=[A-Za-z0-9]|GOOGLE_PRIVATE_KEY=-----BEGIN" -- ':(exclude).env.example'
```

判定: 3 コマンドすべて 0 hit で PASS。1 件でも hit で NO-GO（該当箇所修正後再判定）。

### ステップ 5: 二重承認ゲート（reviewer + user）の明示

| ゲート | 発動条件 | 承認者 | 未取得時の挙動 |
| --- | --- | --- | --- |
| Phase 10 reviewer gate | Phase 1-9 完了後、production mutation 着手前 | reviewer（本タスクでは solo dev のため self-review） | Phase 11 に進まない。`outputs/phase-10/main.md` に sign-off 未記載で停止 |
| Phase 11 mutation gate（4 段） | 各 mutation step 直前（D1 apply / API deploy / Web deploy / release tag push） | user | 該当 step を実行せず待機 |
| Phase 13 user approval gate | dev → main PR 昇格直前 | user | merge せず stop |

solo dev でも reviewer gate を skip しない（CLAUDE.md の品質保証ポリシー）。`outputs/phase-10/main.md` に self-review であることと sign-off 日付を明記する。

### ステップ 6: preflight チェックリスト（Phase 11 着手前）

`outputs/phase-09/main.md` に「6 軸 PASS / NO-GO」の最終表を出力する（後述 §3）。

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| Phase 10 | 6 軸の判定結果を GO/NO-GO 判定の根拠として渡す |
| Phase 11 | preflight evidence（typecheck / lint / build / redaction）が `outputs/phase-11/preflight-*.md` に揃っていることを前提に開始 |
| 上流 09a-A | staging smoke citation |
| 上流 09b-A | observability 疎通確認 |
| 上流 09b-B | post-deploy smoke 検知 confirm |

## 多角的チェック観点（不変条件）

- 不変条件 #5: typecheck / lint / build がすべて green であれば API / Web の boundary 違反は build 時に検出可能（型レベル）
- 不変条件 #6: build 後の `apps/web/.open-next/worker.js` と generated assets に `D1Database` import が混入していないか preflight で grep（後述ステップ 4 と統合可能）
- 不変条件 #14: free-tier 見積もりは spec template に基づく事前見積（実測は Phase 11 / 24h verification）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 静的検証 3 コマンド確定 | 9 | pending | typecheck / lint / build |
| 2 | 上流 green citation 手順 | 9 | pending | 09a-A / 09b-A / 09b-B |
| 3 | observability 疎通確認 | 9 | pending | Sentry / Slack / Logpush |
| 4 | redaction 検証 | 9 | pending | grep 3 本 |
| 5 | 二重承認ゲート明示 | 9 | pending | Phase 10 reviewer + Phase 13 user |
| 6 | preflight チェックリスト | 9 | pending | 6 軸 PASS / NO-GO |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 6 軸品質ガード結果 + 二重承認ゲート + preflight チェックリスト |

## 完了条件

- [ ] 静的検証 3 コマンドの evidence path が `outputs/phase-11/preflight-{typecheck,lint,build}.md` で確定
- [ ] 上流 3 タスクの citation 手順が文書化
- [ ] observability 疎通確認 3 経路（Sentry / Slack / Logpush）の手順が確定
- [ ] redaction 検証コマンド 3 本が実行可能
- [ ] Phase 10 reviewer + Phase 13 user の二重承認ゲートが明記
- [ ] Phase 11 着手前 preflight チェックリスト 6 軸が定義

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 10 へ、次を渡す:
- 6 軸の判定基準（静的検証 / 上流 green / observability 疎通 / redaction / 二重承認 / preflight）
- production deploy 着手の最終ゲート設計
- 自走禁止操作（Phase 1 §5 から継続）
- 上流 blocker（09a-A / 09b-A / 09b-B 未 green）の取扱い
