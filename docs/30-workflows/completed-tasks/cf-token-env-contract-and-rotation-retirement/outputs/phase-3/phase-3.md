# Phase 3: 設計レビュー — cf-token-env-contract-and-rotation-retirement

## 目的

Phase 1（要件）・Phase 2（設計）が Phase 4 以降の実装フェーズへ進める品質か判定する。

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
| ---- | ---- | ---- |
| 真因の確定 | PASS | `provision-staging-secrets.sh` の `SECRETS` に `CLOUDFLARE_API_TOKEN` 欠落を一次ソースで確認。env dump で ACCOUNT_ID は値あり / TOKEN のみ空。 |
| scope の単一責務 | PASS | 「CF トークン契約 + rotation 撤廃」で一貫。本番 smoke 挙動変更・schema 変更は除外。 |
| AC の検証可能性 | PASS | AC-1〜AC-8 すべて機械検証 or runbook 手順で確認可能。AC-4 は「追加前 fail / 追加後 PASS」と二値で定義済み。 |
| 既存責務との非干渉 | PASS | `verify-mint-env-contract` を無改変（AC-7）。新 verifier は別ファイル・別責務。 |
| degrade の正しさ | PASS | `STAGING_*` 欠落は hard-fail 維持（AC-3）、CF のみ degrade（AC-2）。前提と任意依存を分離。 |
| 命名整合 | PASS | `verify-bulk-inputs.outputs.cf_degraded` は既存 `RUNTIME_SMOKE_MINT_DEGRADED` と同型。新 primitive を生やさない。 |
| セキュリティ不変条件 | PASS | verifier は name のみ・トークン値非読取（AC-8）。redaction / mask 不変。 |
| CONST_007（1サイクル完了） | PASS | A1〜A5 / B1〜B4 のコード変更は 1 PR で完了。operational（トークン発行・投入・失効）は runbook 化し user-gated Gate-C として同サイクル内に位置づけ。先送りなし。 |

## 4条件評価

| 条件 | 評価 | 根拠 |
| ---- | ---- | ---- |
| 価値性 | PASS | 「毎回赤い CI」を恒久解消し、ローテーション運用の手間（ユーザーが負担と認識）をゼロ化。誰の何のコストを下げるか明確。 |
| 実現性 | PASS | 既存 degrade パターン・既存 verifier 構造の再利用で実装可能。新規 verifier は pure function で test 容易。 |
| 整合性 | PASS | 責務境界（投入正本 / drift gate / mint gate / degrade）が矛盾なく閉じる。状態所有権を Phase 2 で固定。 |
| 運用性 | PASS | drift gate が再発を構造的に封じ、degrade が安全網、runbook が即時失効を正本化。導入後の verify / 監査が破綻しない。 |

## トレードオフの明示

| 論点 | 採用 | 不採用とその理由 |
| ---- | ---- | ---------------- |
| 非失効トークン | 採用（狭スコープ + 環境分離 + 即時失効を条件に） | 90日カレンダーローテ: 個人開発で費用対効果が低い儀式。撤廃。 |
| 依存除去（API 経由 seed/cleanup） | 不採用 | smoke は audit_log 行の実在を D1 直読で検証する設計。API 経由化は検証意図を壊す。CF トークンは本質的依存。 |
| GitHub OIDC federation | 不採用 | Cloudflare API token は OIDC federation を native サポートせず、個人開発規模に対し実装・運用コスト過大。 |
| 本番トークンの非失効化 | 採用（爆発半径が大きいため狭スコープ・環境分離・即時失効を必須条件化） | 本番のみ 90日ローテ維持: 統一しないと運用が二重化し、ユーザー要望（統一）にも反する。 |

## blocker

なし。Phase 4 へ進行可能。

## 残リスクと緩和

| リスク | 緩和 |
| ------ | ---- |
| 新 drift gate を required check 化すると非該当 PR が pending block | paths footgun を Phase 2/5 に注記。required 化は user-gated・既定では未実施。 |
| 1Password に staging 専用トークン item を新設する運用負荷 | runbook B2 に作成手順を明記。既存 op item 命名規則に整合。 |
| degrade-skip により smoke が静かに無効化される懸念 | `::notice::` を必ず出し、drift gate が「token を provision せよ」を PR で別途強制するため、恒常的 skip は構造的に検出される。 |

## 完了条件

- [x] 全レビュー観点で PASS 判定。
- [x] 4条件すべて PASS。
- [x] トレードオフ（採用 / 不採用）を明示。
- [x] blocker なしを確認し Phase 4 進行を承認。
