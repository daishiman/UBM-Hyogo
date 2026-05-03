# Phase 1: 要件定義 — ut-05a-fetchpublic-service-binding-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-fetchpublic-service-binding-001 |
| task_id | UT-05A-FETCHPUBLIC-SERVICE-BINDING-001 |
| phase | 1 / 13 |
| wave | Wave 5 |
| mode | serial |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #387 (CLOSED) |
| scope | local 実装済 fetchPublic service-binding rewrite の deploy verification + evidence 取得 + system spec 同期に限定。API 側ルーティング変更・session-resolve 経路変更・新機能追加・production deploy / commit / push / PR は user 明示指示時のみ |

## Schema / 共有コード Ownership 宣言

| 対象 | 本タスクでの編集権 | owner / 参照元 | 理由 |
| --- | --- | --- | --- |
| DB schema / migrations | no | U-04 / 03a / 03b | 本タスクは routing 経路の差し替えのみで schema を変更しない |
| shared schema / packages/shared | no | upstream implementation tasks | API contract 変更を含まない |
| `apps/web/src/lib/fetch/public.ts` | yes（本タスクで編集 — local 実装済） | 本タスク | service-binding 優先 + HTTP fallback の二経路化 |
| `apps/web/wrangler.toml` | yes（本タスクで編集 / 確認） | 本タスク | `[[env.staging.services]]` `[[env.production.services]]` に `binding = "API_SERVICE"` を設定 |
| `apps/web/src/lib/auth.ts` (`fetchSessionResolve`) | no（参照のみ） | 05a auth 系 | service-binding pattern の参照元として整合チェックに使うのみ |
| `apps/api` 側 routes | no | apps/api owner | API 側ハンドラを変更しない |
| aiworkflow-requirements index | yes, Phase 12 only | 本タスク | task-workflow-active 同期 / discoverability の正本同期のみ |

## 変更対象ファイル一覧（CONST_005）

- 編集: `apps/web/src/lib/fetch/public.ts`
  - service-binding 優先（`env.API_SERVICE.fetch("https://service-binding.local" + path, init)`）
  - `env.API_SERVICE` 未注入時のみ `fetch(env.PUBLIC_API_BASE_URL + path, init)` を実行する HTTP fallback
  - `transport: 'service-binding'` / `transport: 'http-fallback'` のメタログ
- 編集 / 確認: `apps/web/wrangler.toml`
  - `[[env.staging.services]]` に `binding = "API_SERVICE"` / `service = "ubm-hyogo-api-staging"`
  - `[[env.production.services]]` に `binding = "API_SERVICE"` / `service = "ubm-hyogo-api"`
- 関連参照（変更しない）: `apps/web/src/lib/auth.ts` の `fetchSessionResolve` — service-binding pattern の正本

## 目的

`fetchPublic` を Cloudflare Workers の service-binding (`env.API_SERVICE.fetch(...)`) 経路に統一し、loopback subrequest の 404 問題を回避する。local dev では `PUBLIC_API_BASE_URL` HTTP fallback を維持し regression を出さない。本 phase ではその scope / AC / 上流前提 / approval gate を確定する。

## 実行タスク

1. 既存の `apps/web/src/lib/fetch/public.ts` 実装と `fetchSessionResolve` を読み比べ、二経路分岐の signature と header / cookie 伝搬要件を確定する。完了条件: 関数 signature と分岐ルールが文書化される。
2. `apps/web/wrangler.toml` の `[[env.<env>.services]]` 設定が `binding = "API_SERVICE"` / `service = "ubm-hyogo-api-staging" / production `service = "ubm-hyogo-api"`` で揃っているかを grep で確認する。完了条件: env ごとの設定行が列挙される（実値は記録しない）。
3. staging / production deploy で必要な Cloudflare secret 名（`CLOUDFLARE_API_TOKEN` 等）を列挙する。完了条件: secret 名のみが列挙され、値は記録されない。
4. user approval が必要な操作（commit / push / PR / production deploy）を分離する。完了条件: 自走禁止操作が明記される。
5. local fallback regression check 手順（`pnpm dev` + `.dev.vars` の `PUBLIC_API_BASE_URL`）を確定する。完了条件: 手順が再現可能な形で書かれる。

## 参照資料

- docs/30-workflows/unassigned-task/task-05a-fetchpublic-service-binding-001.md
- docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md (`P11-PRD-003`)
- apps/web/src/lib/fetch/public.ts
- apps/web/src/lib/auth.ts (`fetchSessionResolve`)
- apps/web/wrangler.toml / apps/api/wrangler.toml
- scripts/cf.sh / scripts/with-env.sh
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md

## 実行手順

- 対象 directory: docs/30-workflows/ut-05a-fetchpublic-service-binding-001/
- 本仕様書作成では実 staging / production deploy・追加コード変更・commit / push / PR を行わない。
- 実 deploy / evidence 取得は Phase 5 / Phase 11 の runbook に従う。
- Cloudflare CLI は必ず `bash scripts/cf.sh` 経由で扱い、`wrangler` を直接呼ばない。

## 統合テスト連携

- 上流: `task-05a-build-prerender-failure-001`（build 成功が deploy の前提）/ ut-27 secrets / ut-28 Pages project
- 下流: `ut-05a-followup-google-oauth-completion` の verification gate（200 evidence が公開ルート復旧の根拠）

## 多角的チェック観点

- staging / production secret 値を stdout / artifact / log / 仕様書に記録しない（存在確認のみ）
- `env.API_SERVICE` 未注入時に必ず HTTP fallback が選ばれる分岐を保つ（local dev regression 防止）
- service-binding 経由でも `fetchSessionResolve` と同一の header / cookie 伝搬を保つ
- API 側 routes / session-resolve 経路を変更しない
- Issue #387 を再オープンしない

## サブタスク管理

- [ ] `public.ts` の関数 signature と分岐ルールを文書化する
- [ ] `wrangler.toml` の `[[env.<env>.services]]` 設定を grep で確認する
- [ ] required secrets 名を列挙する
- [ ] AC-1〜AC-6 と evidence path の対応表を作成する
- [ ] approval gate 一覧を明記する
- [ ] outputs/phase-01/main.md を作成する

## 成果物

- outputs/phase-01/main.md

## 完了条件

- `fetchPublic` の関数 signature / 二経路分岐ルールが確定している
- `apps/web/wrangler.toml` の `[[env.<env>.services]]` 設定行が確認されている
- AC-1〜AC-6 と evidence path の対応表が確定している
- approval gate（commit / push / PR / production deploy）が分離されている
- local dev fallback regression check 手順が確定している

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] task-05a-fetchpublic-service-binding-001 の bug-fix follow-up gate の仕様になっている
- [ ] 実 deploy・追加コード変更・commit / push / PR を実行していない
- [ ] secret 値を含めていない

## 次 Phase への引き渡し

Phase 2 へ、関数 signature / 二経路分岐ルール、`wrangler.toml` services 設定、AC-evidence 対応表、approval gate、local fallback regression check 手順を渡す。
