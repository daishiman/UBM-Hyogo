# Phase 11 手動テスト結果（NON_VISUAL）

## メタ情報

- **タスク種別**: NON_VISUAL 実装タスク（implemented_local_evidence_captured 段階）。
- **証跡の主ソース**: 自動テスト（Phase 4 で定義した vitest spec 群: `transport.spec.ts` 5 分岐 / `authed.spec.ts` / `public.spec.ts` / `env.spec.ts` / `app/api/me/[...path]/route.route.spec.ts` / `scripts/verify-no-localhost-bake.spec.ts`）。
- **スクリーンショットを作らない理由**: 変更は transport / env / CI gate / shell script であり UI レンダリング非変更。視覚差分（/profile 復旧）は staging deploy + 認証必須で、実走は user-gated。
- **実施情報**: 本ファイルは仕様書段階の計画記録。実装サイクル（03.実装.md）で自動テスト実行結果（件数・PASS/FAIL）をここへ追記する。

## source-level 検証計画（実装サイクルで実行）

| ID | 観点 | 期待 |
|----|------|------|
| MT-1 | `fetchAuthed` が staging/production で `API_SERVICE` binding 経由 | binding.fetch 呼び出し / loopback 404 不発 |
| MT-2 | binding 不在 & non-local で base URL 未解決 → throw | fail-closed（localhost に落ちない） |
| MT-3 | local（binding 不在 & ENVIRONMENT=local）で `http://localhost:8787` fallback | 既存 local dev 回帰なし |
| MT-4 | client bundle に `localhost:8787` / `127.0.0.1` が現れない | `verify-no-localhost-bake.sh` PASS |
| MT-5 | search params / cookie 転送保持 | proxy 経路で query・cookie 欠落なし |

## 環境ブロッカー（source-level PASS とは別カテゴリ・WEEKGRD-01）

| ブロッカー | 性質 | 解消 |
|-----------|------|------|
| staging 未 deploy | 環境起因 | user-gated deploy 後に smoke |
| `AUTH_SECRET` web↔api parity 未確認 | 環境起因 | `diagnose-auth-secret-parity.sh` + `cf-secret-put-auth-secret.sh`（user-gated） |

## staging runtime smoke（user-gated）

`scripts/smoke-staging-me.sh` 実走で `/api/me` 200 と `/profile` 認証描画を確認後、結果をここへ追記する。
