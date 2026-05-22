[実装区分: 実装仕様書]

# Phase 3: 実装方式レビューと変更対象ファイル俯瞰

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| 機能名 | ut-15-waf-rate-limiting-rules-setup |
| 作成日 | 2026-05-09 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | cloudflare_edge_security |

## 目的

Phase 2 設計を Phase 4 以降の実装に渡す前に、実装方式の俯瞰（IaC アプローチの選択）・変更対象ファイル群・関数シグネチャ・テスト戦略を確定する。PASS / MINOR / MAJOR の戻り先を明示し、Phase 4 開始条件と Phase 13 blocked 条件を残す。

## 1. 実装方式の選択

| 候補 | 概要 | 採用判定 | 理由 |
| --- | --- | --- | --- |
| (A) Cloudflare API 直叩き bash スクリプト | `curl` で `/zones/{id}/rulesets` を更新 | **採用** | `scripts/cf.sh` 互換ラッパーで `op run` 経由。無料枠で完結・追加依存なし |
| (B) Terraform `cloudflare` provider | IaC として宣言的に管理 | 不採用（MINOR で記録） | 既存リポに Terraform 採用例なし。CI / state 管理の追加コスト大 |
| (C) Workers Rate Limiting binding | Workers の `[[ratelimits]]` binding | 部分採用候補 | Worker 到達後のコード内制限に有効。zone-level WAF / Rulesets API の代替ではない。Phase 5 で採否を再判定 |
| (D) Cloudflare ダッシュボード手作業 | 元 umbrella 提案 | 不採用 | 再現性なし・CLAUDE.md ルール違反（手作業ログがリポに残らない） |

> 採用方針: **(A) を主軸**、(C) は現行 Cloudflare Workers docs に合わせて `[[ratelimits]]` として扱う。ただし二重カウントを避けるため初期実装では採用しない。(B)(D) は MINOR として `MINOR-01` で追跡（Pro 移行時に Terraform 検討）。

## 2. 変更対象ファイル群の俯瞰

| パス | 変更種別 | 役割 | 依存先 / 依存元 |
| --- | --- | --- | --- |
| `scripts/cf-waf-apply.sh` | 新規 | Cloudflare API ラッパー（`bash scripts/cf.sh` 互換 / `op run` 必須）| 依存元: CI / 運用者 |
| `scripts/cf-waf-apply/config.json` | 新規 | 宣言的構成正本（zone / managed ruleset / custom rules / rate limit rules） | 依存元: `cf-waf-apply.sh` |
| `scripts/__tests__/cf-waf-apply.test.ts` | 新規 | `--dry-run` 出力スナップショット検証（vitest） | 依存元: `cf-waf-apply.sh` |
| `scripts/__tests__/fixtures/cf-waf-apply.snapshot.json` | 新規 | 期待出力 fixture | 依存元: 上記テスト |
| `apps/api/wrangler.toml` | 編集（任意） | `[[ratelimits]]` binding 追加（Phase 5 で要否確定。初期値は no-op） | 依存先: Workers runtime |
| `apps/api/src/middleware/edge-rate-limit-headers.ts` | 新規 | 429 レスポンスの `retry-after` header / JSON body を edge / app-layer 統一する helper | 依存元: 既存 rate limit middleware |
| `apps/api/src/middleware/__tests__/edge-rate-limit-headers.test.ts` | 新規 | helper 単体テスト | 依存元: 上記 helper |
| `apps/api/src/middleware/rate-limit-magic-link.ts` | 編集 | 429 応答時に新 helper を呼ぶよう差し替え（互換維持・signature 不変）| 既存 |
| `apps/api/src/middleware/rate-limit-self-request.ts` | 編集 | 同上 | 既存 |
| `docs/runbooks/cloudflare-waf-operations.md` | 新規 | 誤検知対応・Simulate→Enforce 移行・ロールバック手順 | 運用者 |
| `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/outputs/phase-{1..13}/` | Phase 進行 | 各 Phase 成果物の outputs | 仕様 |

owner / co-owner（共有モジュール）:

| 共有モジュール | owner | co-owner | 同期タイミング |
| --- | --- | --- | --- |
| `apps/api/src/middleware/edge-rate-limit-headers.ts` | UT-15（本タスク） | UT-16（監視・アラート） | wave 末尾 |
| `apps/api/wrangler.toml` `[[ratelimits]]`（rate limiter binding） | UT-15 | （単独）| Phase 5 |

## 3. 関数・型シグネチャの俯瞰

### `scripts/cf-waf-apply.sh`

```bash
# usage
bash scripts/cf-waf-apply.sh --mode <simulate|enforce> [--dry-run] [--zone <ZONE_ID>]
#
# environment（op run 経由のみ）
#   CLOUDFLARE_API_TOKEN  : op://Vault/Cloudflare/api_token （Zone.WAF, Zone.RateLimit, Zone.Read 必須）
#   CLOUDFLARE_ACCOUNT_ID : Vars / GitHub Variables 由来
#
# exit codes
#   0  apply 成功（または dry-run で差分なし）
#   1  pre-flight 失敗（token missing / op run 失敗 / config json invalid）
#   2  api error
#   3  dry-run で差分あり（CI gate 用）
```

### `scripts/cf-waf-apply/config.json`（schema 概略）

```jsonc
{
  "zones": [
    { "id": "<<API_ZONE_ID>>", "label": "apps/api" },
    { "id": "<<WEB_ZONE_ID>>", "label": "apps/web" }
  ],
  "managedRulesets": [
    { "id": "cloudflare_free_managed", "mode": "simulate" }
  ],
  "customRules": [
    { "name": "block-non-https", "expression": "(not ssl)", "action": "block", "mode": "enforce" }
    // ... rule#2..#5
  ],
  "rateLimitRules": [
    {
      "group": "AUTH",
      "phase": "http_ratelimit",
      "expression": "(http.request.method eq \"POST\" and http.request.uri.path eq \"/api/auth/magic-link\")",
      "ratelimit": {
        "characteristics": ["ip.src"],
        "period": 60,
        "requests_per_period": 10,
        "mitigation_timeout": 60
      },
      "action": "simulate"
    }
    // ... ADMIN / ME / PUBLIC
  ]
}
```

### `apps/api/src/middleware/edge-rate-limit-headers.ts`

```ts
export interface RateLimitedResponseInput {
  readonly retryAfterSec: number;
  readonly reason?: "edge" | "app";
}

export interface RateLimitedResponse {
  readonly status: 429;
  readonly headers: Record<string, string>; // includes `retry-after`
  readonly body: { error: "rate_limited"; retryAfterSec: number };
}

export const buildRateLimitedResponse: (input: RateLimitedResponseInput) => RateLimitedResponse;
```

## 4. テスト戦略

| レイヤー | 種別 | 対象 | tool |
| --- | --- | --- | --- |
| unit | helper | `edge-rate-limit-headers.ts` | vitest |
| unit | snapshot | `cf-waf-apply.sh --dry-run` 出力 | vitest（spawn） |
| integration | smoke | 既存 `rate-limit-magic-link.test.ts` 互換維持 | vitest + miniflare |
| integration | smoke | 429 + retry-after の wire format | vitest + miniflare |
| manual | dashboard | Cloudflare Security Events で Simulate ログ確認 | runbook 手順 |

## 5. レビュー判定（PASS / MINOR / MAJOR）

| 判定 | 条件 | 戻り先 |
| --- | --- | --- |
| PASS | 上記 1〜4 が確定し、無料枠制約・既存 app-layer rate limit との二重カウントなしが Phase 2 マトリクスで保証されている | Phase 4 へ進む |
| MINOR-01 | (B) Terraform 化は将来検討（Pro 移行時） | Phase 12 follow-up に記録 |
| MINOR-02 | Workers `[[ratelimits]]` binding の要否が Phase 5 で再判定 | Phase 5 / 9 で解決確認 |
| MAJOR | 無料枠超過のカスタムルール（5 件超）/ app-layer rate limit の signature 変更 / `wrangler` 直接呼び出し / `.env` 実値混入 | Phase 2 へ戻る |

### MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase |
| --- | --- | --- | --- |
| MINOR-01 | Terraform 化は Pro 移行時に再検討 | Phase 12 | Phase 12 |
| MINOR-02 | `[[ratelimits]]` binding の要否判定 | Phase 5 | Phase 9 |

## 6. NO-GO 条件（Phase 13 blocked / gate 重複明記の 3 段目）

- 本番稼働後 1〜2 週間の Simulate 観測が未完了の状態で Enforce へ切り替える
- `CLOUDFLARE_API_TOKEN` を `.env` 実値で commit / コードに転記する（CLAUDE.md 必読ルール違反）
- `wrangler` を直接呼ぶ実装が混入する（`scripts/cf.sh` 経由必須）
- 既存 app-layer rate limit の API signature を破壊変更する
- カスタムルールが 5 件を超え、無料枠を要求する
- `apps/web` から D1 直接アクセスする実装が混入する（不変条件 #5 違反）

## 7. 上流ブロッカー（gate 重複明記の 3 段目）

| ブロッカー | NO-GO 条件 |
| --- | --- |
| 本番稼働 + Simulate 7 日観測 | 観測未完了で Enforce 移行は NO-GO |
| Cloudflare zone 確定 | zone 未確定で apply 実行は NO-GO |
| `CLOUDFLARE_API_TOKEN` の `Zone.WAF` / `Zone.RateLimit` 権限 | 権限不足で apply は NO-GO |

## 8. 参照資料

| 資料 | パス |
| --- | --- |
| `index.md` | 受け入れ基準 |
| `phase-01.md` | 要件 / アーキテクチャ |
| `phase-02.md` | Rate Limiting / WAF / 責務分離マトリクス |
| Cloudflare CLI ルール | `CLAUDE.md` § シークレット管理 |
| 既存 app-layer rate limit | `apps/api/src/middleware/rate-limit-magic-link.ts` / `rate-limit-self-request.ts` |

## 9. 成果物

| 成果物 | パス |
| --- | --- |
| 実装方式レビュー（本ファイル） | `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/phase-03.md` |
| 変更対象ファイル俯瞰 | 本ファイル §2 |
| 関数・型シグネチャ | 本ファイル §3 |
| テスト戦略 | 本ファイル §4 |

## 10. 統合テスト連携【必須】

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニットテスト Line | 80%+ | TBD |
| ユニットテスト Branch | 80%+ | TBD |
| ユニットテスト Function | 80%+ | TBD |
| 結合テスト API | 100% | TBD |
| 結合テスト正常系 | 100% | TBD |
| 結合テスト異常系 | 80%+ | TBD |

## 11. 完了条件

- [ ] 実装方式の選択（採用 / 不採用）が表で示されている
- [ ] 変更対象ファイル群が新規 / 編集 / 任意の区分で列挙されている
- [ ] 関数・型シグネチャ（`cf-waf-apply.sh` usage / config schema / helper TS signature）が示されている
- [ ] テスト戦略が unit / integration / manual で示されている
- [ ] PASS / MINOR / MAJOR / NO-GO の戻り先が明示されている
- [ ] gate 重複明記（Phase 1 / 2 / 3）が完了している
- [ ] coverage 既定閾値（80/80/80/80）と `bash scripts/coverage-guard.sh` exit 0 が完了条件に明記されている（Phase 6 / 9 / 11）
- [ ] 本 Phase 内のタスクを 100% 実行完了

## 12. Phase 4 開始条件

- 上記完了条件を全て満たし、レビュー判定 PASS 相当
- MINOR-01 / MINOR-02 が follow-up trail に登録されている
- `outputs/phase-3/` に本書の参照リンクが記録されている

## 次の Phase

Phase 4: テスト作成（`edge-rate-limit-headers.test.ts` / `cf-waf-apply.test.ts` の RED スケルトン作成）

## 実行タスク

1. Cloudflare API bash IaC を主軸に採用し、Workers binding は no-op 候補として整理する。
2. 変更対象ファイル、型シグネチャ、テスト戦略、NO-GO 条件を確定する。

## 参照資料

| 資料 | 用途 |
| --- | --- |
| `index.md` | AC-1〜AC-10 |
| `phase-02.md` | Rate Limiting / WAF matrix |
| Cloudflare Ruleset Engine docs | phase order / `http_ratelimit` contract |

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 3 仕様 | `phase-03.md` |

## 完了条件

- [ ] 実装方式、変更対象、NO-GO 条件、Phase 4 開始条件が記述されている。

## 統合テスト連携

Phase 6 の helper unit / dry-run snapshot / miniflare smoke へ接続する。
