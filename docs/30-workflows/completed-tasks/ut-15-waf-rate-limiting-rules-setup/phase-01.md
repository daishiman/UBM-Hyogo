[実装区分: 実装仕様書]

# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| 機能名 | ut-15-waf-rate-limiting-rules-setup |
| 作成日 | 2026-05-09 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL（Cloudflare dashboard / API レスポンスのみ。screenshot 取得は不可・代替証跡は Phase 11 で `--dry-run` の stdout / curl `-i` の 429 ログを採用） |
| scope | cloudflare_edge_security |
| workflow_state | implemented-local-runtime-pending |

## 目的

Cloudflare edge で WAF Managed Ruleset と Rate Limiting Rules を `apps/api` / `apps/web` の双方に適用し、本番稼働後の DoS / enumeration 攻撃に対して保守的な Simulate→Enforce フローで edge security を確立する。Phase 1 では機能要件・非機能要件・受け入れ基準を確定し、Phase 2 設計の前提となる「想定アーキテクチャ」と「実装ターゲットファイル候補」を固定する。

## 0. P50 チェック: 既実装状態の調査

```bash
# 既存 rate limit middleware の存在確認
grep -rn "rate-limit" apps/api/src/middleware/
# wrangler.toml に ratelimits binding が無いこと
grep -n "ratelimits" apps/api/wrangler.toml apps/web/wrangler.toml
# scripts に既存 WAF 関連スクリプトが無いこと
ls scripts/ | grep -iE "waf|rate"
```

調査結果（spec 作成時点）:

| 項目 | 状態 |
| --- | --- |
| `apps/api/src/middleware/rate-limit-magic-link.ts` | 既実装（per-email / per-IP の app-layer rate limit）。本 task では責務分離の対象 |
| `apps/api/src/middleware/rate-limit-self-request.ts` | 既実装（self-request 系の app-layer rate limit）。本 task では責務分離の対象 |
| `apps/api/wrangler.toml` の rate_limiting binding | 未設定（greenfield） |
| `apps/web/wrangler.toml` | rate_limiting binding 未設定 |
| `scripts/cf-waf-apply.sh` | 不在（新規作成対象） |
| `docs/runbooks/cloudflare-waf-operations.md` | 不在（新規作成対象） |

## 機能要件（FR）

| ID | 内容 | 優先度 |
| --- | --- | --- |
| FR-1 | Cloudflare WAF Managed Ruleset を `apps/api` / `apps/web` の zone に Simulate モードで適用できる | High |
| FR-2 | Rate Limiting Rules を path × period × threshold × action のマトリクスで宣言的に定義できる | High |
| FR-3 | `scripts/cf-waf-apply.sh` で `--dry-run` / `--mode simulate` / `--mode enforce` を切り替え可能 | High |
| FR-4 | 既存 app-layer rate limit と edge ルールの責務分離マトリクスを Phase 2 で固定する | High |
| FR-5 | 429 応答に `retry-after` header と統一 JSON body 形式を付与する | Med |
| FR-6 | Cloudflare API 呼び出しは `bash scripts/cf.sh` ラッパー経由で実行する（`op run` で token 注入） | High |
| FR-7 | Simulate→Enforce 移行 gate を runbook で明文化（観測期間 7 日 / 誤検知 0） | Med |

## 非機能要件（NFR）

| ID | 内容 | 計測 |
| --- | --- | --- |
| NFR-1 | Cloudflare 無料枠で動作する（カスタムルール 5 件以内 / Rate Limiting Rules 無料枠範囲） | spec レビュー |
| NFR-2 | 設定の冪等性: 同じ宣言を 2 回 apply しても差分が出ない | `--dry-run` 比較 |
| NFR-3 | secret 値（`CLOUDFLARE_API_TOKEN`）はファイル・ログに残らない（CLAUDE.md 必読ルール） | コードレビュー |
| NFR-4 | 既存 app-layer rate limit のテストが回帰しない（互換性維持） | `pnpm test` |
| NFR-5 | apps/api workspace の coverage 既定閾値（80/80/80/80）を満たす | `coverage-guard.sh` |

## 受け入れ基準（再掲・index.md と一致）

AC-1〜AC-10 は `index.md` に列挙。Phase 2/3 で設計・レビュー時に逐一参照する。

## 想定アーキテクチャ

```
┌────────────────────────────────────────────────────────────┐
│  Client                                                    │
└──────────────┬─────────────────────────────────────────────┘
               │ HTTPS
               ▼
┌────────────────────────────────────────────────────────────┐
│  Cloudflare Edge（zone-level）                             │
│  ┌──────────────────┐   ┌────────────────────────────┐    │
│  │ Custom Rules     │ → │ Rate Limiting Rules        │    │
│  │ http_request_... │   │ http_ratelimit             │    │
│  └──────────────────┘   └────────────┬───────────────┘    │
│                                      ▼                    │
│  ┌──────────────────────────────────────────────┐         │
│  │ WAF Managed Ruleset                          │         │
│  │ http_request_firewall_managed                │         │
│  └──────────────────────────────────────────────┘         │
└────────────────────────────────────────┬──────────────────┘
                                         │ pass / 429
                                         ▼
┌────────────────────────────────────────────────────────────┐
│  Cloudflare Workers                                        │
│  ┌──────────────────────────┐    ┌────────────────────┐   │
│  │ apps/api (Hono)          │    │ apps/web (Next.js) │   │
│  │  ├ rate-limit-magic-link │    │                    │   │
│  │  ├ rate-limit-self-req   │    │                    │   │
│  │  └ business routes       │    │                    │   │
│  └──────────────────────────┘    └────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

- Cloudflare Ruleset Engine の実行順は Custom Rules (`http_request_firewall_custom`) → Rate Limiting Rules (`http_ratelimit`) → WAF Managed Rules (`http_request_firewall_managed`) として扱う。Managed Rules が Rate Limiting より先に評価されるという図式は禁止する。
- WAF Managed Ruleset は `apps/api` / `apps/web` のいずれにも有効化する zone-level 設定。Cloudflare Free Managed Ruleset を Simulate で開始する。
- Rate Limiting Rules は `http_ratelimit` phase entry point ruleset に `ratelimit` object を持つ rule として定義し、`apps/api` 側を主対象、`apps/web` には DoS 対策として汎用 burst rule のみを適用する。
- 既存 app-layer rate limit は edge ルールの「後段」に位置し、enumeration 等の業務ロジック固有の保護を継続する。

## WAF Managed Ruleset 選定方針

| Ruleset | 採用 | 理由 |
| --- | --- | --- |
| Cloudflare Free Managed Ruleset | Yes | 無料枠で利用可能。一般的な OWASP 系の高頻度攻撃を Simulate でまずカバー |
| Cloudflare Managed Ruleset (paid) | No | Pro 以上必須。コスト判断で本 task では除外 |
| OWASP Core Ruleset | No | Pro 以上 |
| Custom Rules | Yes（5 件以内） | 無料枠制約。`/api/auth/magic-link` に対する method=POST + path 一致のラフルールに使用予定 |
| Bot Fight Mode | 検討のみ | 別 task / 別 issue。`含まない` 範囲 |

## 実装ターゲットファイル候補（Phase 2 で確定）

| パス | 種別 | 役割 |
| --- | --- | --- |
| `scripts/cf-waf-apply.sh` | 新規 | Cloudflare API 経由で WAF / Rate Limiting Rules を宣言的に apply するラッパー（`bash scripts/cf.sh` 互換）|
| `scripts/cf-waf-apply/config.json` | 新規 | 宣言的構成（zone / ruleset / rate limit rules）の正本 |
| `scripts/__tests__/cf-waf-apply.test.ts` | 新規 | apply スクリプトの dry-run 出力をスナップショット検証 |
| `apps/api/wrangler.toml` | 編集 | （任意）Workers Rate Limiting binding を現行 `[[ratelimits]]` 形式で追加検討。Phase 2 で要否確定 |
| `apps/api/src/middleware/edge-rate-limit-headers.ts` | 新規（任意） | 429 レスポンスの `retry-after` header / JSON body を edge と app-layer で揃える helper |
| `apps/api/src/middleware/__tests__/edge-rate-limit-headers.test.ts` | 新規 | helper 単体テスト |
| `docs/runbooks/cloudflare-waf-operations.md` | 新規 | 誤検知対応・Simulate→Enforce 移行手順 |
| `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/outputs/phase-*` | 各 Phase 成果物 | 設計書・レビュー記録 |

## 参照資料

| 資料 | パス | 用途 |
| --- | --- | --- |
| Umbrella spec | `docs/30-workflows/unassigned-task/UT-15-waf-rate-limiting.md` | 元の方針継承 |
| Cloudflare 系 CLI ルール | `CLAUDE.md` § シークレット管理 / Cloudflare 系 CLI 実行ルール | `scripts/cf.sh` 経由必須の根拠 |
| 既存 app-layer rate limit | `apps/api/src/middleware/rate-limit-magic-link.ts` / `rate-limit-self-request.ts` | 責務分離の対象 |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Cloudflare / セキュリティ要件 |
| WAF 方針の前例 | `docs/30-workflows/completed-tasks/ut-06-followup-H-health-db-endpoint/` | 過去判断の参照 |

## 統合テスト連携【必須】

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニットテスト Line | 80%+ | TBD（Phase 6 で記録） |
| ユニットテスト Branch | 80%+ | TBD |
| ユニットテスト Function | 80%+ | TBD |
| 結合テスト API | 100% | TBD（apps/api 既存 contract test の回帰なしを確認） |
| 結合テストシナリオ正常系 | 100% | TBD |
| 結合テストシナリオ異常系 | 80%+ | TBD（429 retry-after / WAF block ログ確認） |

## 上流ブロッカー（gate 重複明記の 1 段目）

| ブロッカー | 解除条件 | 判定 Phase |
| --- | --- | --- |
| 本番稼働後 1〜2 週間の Simulate 観測 | Cloudflare Analytics で正常ピーク値を取得 | Phase 1 / 2 / 3 |
| Cloudflare zone が Workers バックの custom domain で運用中（または `*.workers.dev` 運用容認）| zone 確定 | Phase 1 / 2 / 3 |
| `CLOUDFLARE_API_TOKEN` の権限スコープに `Zone.WAF` / `Zone.Rate Limit` が含まれる | 1Password に登録済 token を検証 | Phase 1 / 2 / 3 |

## 成果物

| 成果物 | パス |
| --- | --- |
| 要件定義書（本ファイル） | `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/phase-01.md` |
| 実装ターゲット候補 | 本ファイル §「実装ターゲットファイル候補」 |

## 完了条件

- [ ] FR-1〜FR-7 が抽出されている
- [ ] NFR-1〜NFR-5 が抽出されている
- [ ] AC-1〜AC-10 が `index.md` に検証可能な形で定義されている
- [ ] 想定アーキテクチャ図と WAF Managed Ruleset 選定方針が固定されている
- [ ] 実装ターゲットファイル候補が列挙されている
- [ ] coverage 既定閾値（80/80/80/80）と `bash scripts/coverage-guard.sh` exit 0 が完了条件に明記されている（→ Phase 6 / Phase 9 / Phase 11 で実行）
- [ ] 本 Phase 内のタスクを 100% 実行完了

## 次の Phase

Phase 2: 設計（Rate Limiting Rules マトリクス・WAF カスタムルール仕様・責務分離）

## 実行タスク

1. P50 チェックで既存 rate limit / WAF 関連ファイルを棚卸しする。
2. AC-1〜AC-10、coverage 閾値、上流ブロッカーを固定する。
3. Phase 2 へ渡す想定アーキテクチャと実装ターゲット候補を確定する。
