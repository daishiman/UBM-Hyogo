# Phase 11 手動テスト結果 — issue-863-admin-error-alert-policy-iac

## タスク種別宣言: NON_VISUAL

本タスクのタスク種別は **NON_VISUAL** である。成果物は次の 3 系統であり、いずれも UI / 画面描画を持たない。

- backend / observability: `apps/web/src/lib/logger.ts` の Sentry tag 昇格（`scope` / `digest`）
- IaC: `infra/sentry-alerts/`（policies JSON + schema + lib CLI + drift CI）
- ドキュメント: runbook / README / CODEOWNERS / package.json script

**非視覚的理由**: logger の tag 昇格は Sentry へ送出する telemetry payload の内部構造変更であり、ユーザーが見る画面・色・レイアウトに一切影響しない。
`infra/sentry-alerts/` は Sentry API へ宣言的に alert rule を反映する CLI / JSON 群で、レンダリング対象を持たない。
したがって Phase 11 のスクリーンショット撮影は対象がなく、**代替証跡として自動テストを主ソースとする**。

## 証跡の主ソース

| 証跡 | 内容 | 状態 |
|---|---|---|
| `apps/web/src/lib/__tests__/logger.spec.ts`（TC-LOG-01..04） | `scope` / `digest` が `string` のとき Sentry `tags` として渡ること、非 string は昇格しないこと、`warn` 経路に `runtime` tag が共有されることを検証 | implemented_local（GREEN 取得対象） |
| `infra/sentry-alerts/lib/__tests__/*.spec.ts`（TC-IAC-01..07） | schema-contract（policy.schema.json と manifest の整合）/ load（dir 読込 + canonicalize）/ diff（missing/extra/changed 列挙）の unit test | implemented_local（GREEN 取得対象） |
| `pnpm typecheck` / `pnpm lint` | 型 / lint green | verification_pending |

## スクリーンショットを作らない理由

UI / UX 変更が一切ないため、撮影対象となる画面が存在しない。視覚的回帰は本タスクのスコープ外であり、
代替として上記の自動テスト（logger tag 検証 + sentry-alerts lib unit）を一次証跡とする。
スクリーンショット専用セクションは本ファイル・後続 PR 本文ともに作らない。

## staging 疎通（AC-3）

staging deploy + Slack #ubm-hyogo-incidents への通知疎通 evidence は **user-gated 未実行**。
staging 環境への deploy と Sentry alert rule の実 apply（write token）が必要であり、本 implemented_local_runtime_pending 段階では取得しない。
実装サイクル完了後、user 承認のうえ staging で疎通確認し、その結果を本ファイルへ追記する（runtime_pending）。

## 判定

| 観点 | 状態 |
|---|---|
| 自動テスト証跡（一次ソース） | implemented_local（本サイクルで GREEN 確認対象） |
| 視覚証跡 | n/a（NON_VISUAL のため対象なし） |
| staging 通知疎通（AC-3） | runtime_pending（user-gated 未実行） |
