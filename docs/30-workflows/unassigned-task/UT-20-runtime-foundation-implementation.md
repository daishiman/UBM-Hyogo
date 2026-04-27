# UT-20: Runtime Foundation Node 24 検証・bundle size 証跡

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-20 |
| タスク名 | Runtime Foundation Node 24 検証・bundle size 証跡 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2 follow-up |
| 状態 | completed |
| 作成日 | 2026-04-26 |
| 完了日 | 2026-04-26 |
| 既存タスク組み込み | あり |
| 組み込み先 | 02-serial-monorepo-runtime-foundation current wave |

## 目的

`doc/completed-tasks/02-serial-monorepo-runtime-foundation` で実装済みになった runtime foundation を、正式方針である Node 24.x 環境で再検証し、OpenNext Workers bundle size の証跡を残す。

## 完了サマリー

2026-04-26 に Node 24.15.0 / pnpm 10.33.2 で検証を完了した。

| 検証 | コマンド | 結果 |
| --- | --- | --- |
| Node / pnpm | `volta run --node 24 --pnpm 10.33.2 node --version` / `pnpm --version` | Node v24.15.0 / pnpm 10.33.2 |
| install | `volta run --node 24 --pnpm 10.33.2 pnpm install --frozen-lockfile` | PASS |
| typecheck | `volta run --node 24 --pnpm 10.33.2 pnpm typecheck` | PASS |
| OpenNext build | `volta run --node 24 --pnpm 10.33.2 pnpm --filter @ubm-hyogo/web build:cloudflare` | PASS |
| bundle size | `wc -c apps/web/.open-next/worker.js` / `du -h apps/web/.open-next/assets` | worker.js 2,278 bytes / assets 約 644KB |
| generated artifacts | `git status --short --ignored apps/web/.open-next` | `.open-next/` は ignored |

## スコープ

### 含む

- Node 24.x 環境で `pnpm install --frozen-lockfile` を再実行
- Node 24.x 環境で `pnpm typecheck` を再実行
- Node 24.x 環境で `pnpm --filter @ubm-hyogo/web build:cloudflare` を実行
- `.open-next/worker.js` など OpenNext 生成物の bundle size を記録
- `.open-next/` がコミット対象外であることを確認

### 含まない

- 新規業務機能実装
- 本番デプロイ
- D1 schema / migration の詳細設計
- runtime foundation skeleton の再実装

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `doc/completed-tasks/02-serial-monorepo-runtime-foundation` | runtime topology / version policy / dependency boundary / implementation guide が正本 |
| 下流 | `03-serial-data-source-and-storage-contract` | shared/API 境界が実体化していることが前提 |
| 下流 | `04-serial-cicd-secrets-and-environment-sync` | package scripts / deployment entry point が必要 |
| 下流 | `05b-parallel-smoke-readiness-and-handoff` | smoke readiness の実行対象が必要 |

## 完了条件

- [x] Node 24.x で `pnpm install --frozen-lockfile` が完了する
- [x] Node 24.x で `pnpm typecheck` が完了する
- [x] Node 24.x で `pnpm --filter @ubm-hyogo/web build:cloudflare` が完了する
- [x] Workers bundle size 確認の結果が記録されている
- [x] `.open-next/` が git 追跡対象外であることを確認済み

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `doc/completed-tasks/02-serial-monorepo-runtime-foundation/outputs/phase-02/runtime-topology.md` | app / package 境界 |
| 必須 | `doc/completed-tasks/02-serial-monorepo-runtime-foundation/outputs/phase-02/version-policy.md` | 採用バージョン |
| 必須 | `doc/completed-tasks/02-serial-monorepo-runtime-foundation/outputs/phase-05/foundation-bootstrap-runbook.md` | 実装手順 |
| 必須 | `doc/completed-tasks/02-serial-monorepo-runtime-foundation/outputs/phase-08/dependency-boundary-rules.md` | 依存境界 |
| 参考 | `doc/completed-tasks/02-serial-monorepo-runtime-foundation/outputs/phase-12/unassigned-task-detection.md` | current facts 反映後の未タスク検出元 |
