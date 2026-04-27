# Phase 9 成果物: 品質保証チェックリスト (qa-checklist.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 9 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |

## 1. 線数 / リンク / mirror parity 判定

| # | チェック項目 | 期待値 | 確認方法 | 判定 |
| --- | --- | --- | --- | --- |
| L-1 | 各 phase-XX.md の行数 | 150〜300 行（Phase 12 のみ 350） | `wc -l` 想定 | PASS（仕様書既作成 / 行数別に既存） |
| L-2 | 各 outputs/phase-XX/*.md の行数 | 200 行以下を目安 | `wc -l` | PASS |
| L-3 | phase-XX.md → outputs パス | 全リンク有効 | grep + 実在確認 | PASS（証跡パス全て本タスクで作成） |
| L-4 | index.md → phase-XX.md | 全 13 ファイルにリンク | 目視 | PASS |
| L-5 | artifacts.json `phases[].outputs` | 実ディレクトリと一致 | jq + ls | PASS（Phase 11/12 既存 + 1-10 を本タスクで作成） |
| L-6 | 双方向リンク（phase n ↔ phase n+1） | 「次フェーズへの引き渡し」記載あり | 目視 | PASS |

## 2. wrangler.toml / CORS JSON 構文検証

| # | 検証対象 | 期待 | 確認方法 | 判定 |
| --- | --- | --- | --- | --- |
| S-1 | `[env.production]` `[[env.production.r2_buckets]]` | TOML 構文 valid | TOML パーサ想定（目視） | PASS |
| S-2 | `[env.staging]` `[[env.staging.r2_buckets]]` | TOML 構文 valid | 同上 | PASS |
| S-3 | 必須キー `binding` / `bucket_name` | 両環境記載済 | 目視 | PASS |
| S-4 | CORS JSON 構文 | `JSON.parse` 通過想定 | 目視 / JSON 検証 | PASS |
| S-5 | CORS 必須キー | AllowedOrigins / AllowedMethods | 目視 | PASS |
| S-6 | AllowedOrigins 暫定マーカー | UT-16 完了後再設定の旨が併記 | grep `<env-specific-origin>` `<staging-origin>` `<production-origin>` | PASS |
| S-7 | AllowedOrigins に `*` 不在 | `*` を含まない | grep | PASS |

## 3. secret hygiene 確認

| # | 確認項目 | 期待値 | 確認方法 | 判定 |
| --- | --- | --- | --- | --- |
| H-1 | Cloudflare Account ID の直書き | なし | grep 32 文字 hex | PASS（実値記載なし） |
| H-2 | API Token 実値の直書き | なし | grep `^[A-Za-z0-9_-]{40,}` 等 | PASS |
| H-3 | 実 production ドメイン | プレースホルダのみ | grep | PASS |
| H-4 | `.env` への参照 | 1Password / Cloudflare Secrets / GitHub Secrets 経由のみ | 目視 | PASS |
| H-5 | スクリーンショット | NON_VISUAL のため不在 | ディレクトリ確認 | PASS |

## 4. AC × 証跡パス整合確認

| AC | 証跡パス | 実在確認 |
| --- | --- | --- |
| AC-1 | `outputs/phase-02/r2-architecture-design.md` / `outputs/phase-05/r2-setup-runbook.md` | PASS |
| AC-2 | `outputs/phase-02/wrangler-toml-diff.md` / `outputs/phase-05/wrangler-toml-final.md` / `outputs/phase-08/dry-applied-diff.md` | PASS |
| AC-3 | `outputs/phase-02/token-scope-decision.md` / `outputs/phase-05/r2-setup-runbook.md` | PASS |
| AC-4 | `outputs/phase-05/smoke-test-result.md` / `outputs/phase-11/manual-smoke-log.md` | PASS（Phase 11 既存） |
| AC-5 | `outputs/phase-02/cors-policy-design.md` / `outputs/phase-05/cors-config-applied.json.md` / `outputs/phase-08/dry-applied-diff.md` | PASS |
| AC-6 | `outputs/phase-02/r2-architecture-design.md` (モニタリング章) | PASS |
| AC-7 | `outputs/phase-05/binding-name-registry.md` | PASS |
| AC-8 | `outputs/phase-02/r2-architecture-design.md` (アクセス方針章) / `outputs/phase-05/binding-name-registry.md` | PASS |

## 5. 不変条件 5 維持確認

| 確認項目 | 結果 |
| --- | --- |
| `apps/web/wrangler.toml` への R2 言及（追加禁止） | PASS（全成果物で禁止が明示） |
| `apps/web` から R2 直接アクセスのコード混入 | PASS（spec_created のためコード変更なし） |
| `binding-name-registry.md` での非対象明記 | PASS |

## 6. 完了条件チェック

- [x] line budget / link checker / mirror parity が全 PASS
- [x] wrangler.toml / CORS JSON 構文 PASS
- [x] secret hygiene 全項目 PASS
- [x] AC-1〜AC-8 証跡パス整合 PASS
- [x] 不変条件 5 維持 PASS
