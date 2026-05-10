[実装区分: 実装仕様書]

# Phase 9: セキュリティ / 監視 / 運用継続性

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-15: WAF / Rate Limiting ルール設定 (ut-15-waf-rate-limiting-rules-setup) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | セキュリティ / 監視 / 運用継続性 |
| 作成日 | 2026-05-09 |
| 前 Phase | 8（品質ゲート / CI 統合） |
| 次 Phase | 10（パフォーマンス / 容量 / コスト） |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL / cloudflare_edge_security |
| visualEvidence | NON_VISUAL（Cloudflare dashboard / GraphQL Analytics / Security Events ログで evidence 化） |
| scope | cloudflare_edge_security |

## 目的

UT-15 が edge security 設定そのものであるという特性に基づき、(a) `CLOUDFLARE_API_TOKEN` のスコープ最小化と 1Password アイテム配置、(b) WAF block 急増 / Rate Limit 429 急増の監視 alert 設計（UT-08 / UT-17 通知基盤との連携契約）、(c) ログ保管 / 監査要件（個人情報保護観点での IP ログ保持期間）、(d) インシデント response runbook 連携の 4 点を SSOT として固定する。本 Phase は spec_created に閉じ、Phase 5 実装ランブック・Phase 11 smoke・Phase 12 implementation-guide の参照元になる。

## 真の論点 (true issue)

- 「edge security を導入する」ではなく、**「Token 漏洩・Simulate→Enforce 切替の事故・誤検知急増・正常ユーザの誤ブロックといった運用リスクが、最小権限 Token + 1Password 集中管理 + 監視 alert + 文書化された response runbook の 4 層で確実に検知 / 復旧可能になっている」**状態を確立すること。
- 副次論点: (1) `Zone:WAF:Edit` / `Zone:Rate Limit:Edit` / `Zone:Zone:Read` のみに権限を絞る設計、(2) WAF block / 429 急増の閾値（baseline×N）の決め方、(3) IP ログ保持期間の法的妥当性（GDPR / 日本の個人情報保護法）、(4) UT-08（通知基盤）/ UT-17（監視 / アラート）と本タスクの責務境界。

## 1. シークレット管理 / Token スコープ最小化

### `CLOUDFLARE_API_TOKEN` の最小権限

| 権限スコープ | 必要性 | 用途 |
| --- | --- | --- |
| `Zone:WAF:Edit` | 必須 | Managed Ruleset / Custom Rules の Simulate / Enforce 切替 |
| `Zone:Rate Limit:Edit` | 必須 | Rate Limiting Rules の create / update / delete |
| `Zone:Zone:Read` | 必須 | zone id / settings の読み取り（apply 前の preflight） |
| `Zone:Zone Settings:Edit` | 不要 | 本タスクではゾーン設定変更を行わない |
| `Account:Workers Scripts:Edit` | 不要 | デプロイは別 token / 別 workflow（既存 `scripts/cf.sh deploy`） |
| `Account:Account Analytics:Read` | 推奨（任意） | Phase 10 / Phase 11 の GraphQL Analytics クエリで利用する場合のみ |

> 「最小権限の token を分離する」原則: デプロイ用 token と本タスクの WAF / Rate Limit 編集用 token を**別アイテム**として 1Password に保管し、CI / ローカル双方で混在させない。

### 1Password アイテム配置

| 1Password 参照 | 値 | 利用箇所 |
| --- | --- | --- |
| `op://UBM-Hyogo/cf-waf-token/credential` | API Token 値 | `scripts/cf-waf-apply.sh` から `op run --env-file=.env` 経由で `CLOUDFLARE_API_TOKEN` に動的注入 |
| `op://UBM-Hyogo/cf-waf-token/notes` | 権限スコープ・rotation 履歴 | 監査時の根拠 |
| `op://UBM-Hyogo/cf-waf-token/zone-ids` | `<<API_ZONE_ID>>` / `<<WEB_ZONE_ID>>` | `cf-waf-apply/config.json` プレースホルダ解決 |

### `.env` の運用ルール（再固定）

- `.env` には実値を**絶対に書かない**（`op://...` 参照のみ）
- `scripts/cf-waf-apply.sh` は `bash scripts/cf.sh` ラッパ経由で発火し、内部で `op run --env-file=.env` が値を揮発的に注入する
- ファイル / ログ / PR diff / 仕様書すべてに API Token 値が残らないことを CI gate（Phase 8 §6 forbid wrangler-direct と同列の「forbid raw token」grep）で恒常チェック

### Token rotation SOP（Phase 12 へ引き渡す手順）

1. 1Password で新 Token を発行（同スコープ）
2. `op://UBM-Hyogo/cf-waf-token/credential` を新値に置換、`notes` に rotation 日付追記
3. `bash scripts/cf-waf-apply.sh --dry-run` を実行し、新 Token で API 疎通確認
4. 旧 Token を Cloudflare dashboard で revoke
5. 監視 alert（§3）に rotation 完了通知を送出（手動 or 自動）

## 2. 不変条件 #5 違反検知（apps/web から D1 直接アクセスの混入防止）

UT-15 自体は edge 設定だが、Phase 3 NO-GO 条件 §6 で「`apps/web` から D1 直接アクセスする実装が混入しない」を gate 化している。本 Phase 9 で grep SSOT を再固定し、Phase 11 smoke で実走する。

```bash
violations=$(grep -rnE 'D1Database|c\.env\.DB|prepare\(|\[\[d1_databases\]\]' apps/web/ 2>/dev/null || true)
if [ -n "$violations" ]; then
  echo "INVARIANT #5 VIOLATION: apps/web 側に D1 参照が混入しています"
  echo "$violations"
  exit 1
fi
echo "OK: apps/web 配下に D1 参照なし"
```

## 3. 監視 / Alert 設計（UT-08 / UT-17 連携）

### 監視対象メトリクス

| メトリクス | 取得元 | 目的 |
| --- | --- | --- |
| `waf.firewallEventsAdaptiveGroups.count`（action=block） | Cloudflare GraphQL Analytics | WAF block 急増検知 |
| `rateLimits.rateLimitEventsAdaptiveGroups.count` | Cloudflare GraphQL Analytics | Rate Limit 429 急増検知 |
| `httpRequestsAdaptiveGroups.count`（status=429） | Cloudflare GraphQL Analytics | 全体 429 率（edge + app-layer 合算） |
| WAF Managed Ruleset action=log（Simulate）件数 | Security Events / GraphQL | Simulate→Enforce 移行 gate（誤検知 0 確認） |
| カスタムルール rule#2 (challenge SUS UA) hit 数 | Security Events | challenge 過多時の閾値見直し |

### Alert 閾値（Simulate 観測後に Phase 10 で再較正）

| Alert 名 | 条件（初期値） | 重要度 | 通知先 |
| --- | --- | --- | --- |
| `waf-block-spike` | 直近 5 分の block 数が直近 24h ベースライン中央値の 5 倍以上 かつ 50 件以上 | High | UT-08 通知基盤（Slack / メール） |
| `rate-limit-429-spike` | 直近 5 分の 429 数が直近 24h ベースライン中央値の 5 倍以上 かつ 100 件以上 | High | 同上 |
| `false-positive-suspicion` | Simulate モードで action=log 件数 / 全リクエスト > 1% | Medium | UT-17 監視 dashboard |
| `enforce-mode-rollback-required` | Enforce 切替後 1h で 429 率が切替前の 10 倍を超える | Critical | UT-08 + on-call（solo 運用なので owner 直通） |
| `simulate-observation-window-complete` | Simulate 連続 7 日経過 + 誤検知 0 件 | Info | Enforce 切替判断トリガ |

### UT-08（通知基盤）/ UT-17（監視 / アラート）との責務境界

| 責務 | 担当タスク | UT-15 での扱い |
| --- | --- | --- |
| 通知チャネル（Slack / メール / on-call routing） | UT-08 | 既存 contract に乗せる（新規チャネル追加は本タスク範囲外） |
| 監視 dashboard / メトリクス収集パイプライン | UT-17 | UT-15 が「監視対象メトリクス」を提供し、UT-17 dashboard に合流 |
| Cloudflare GraphQL Analytics クエリの SSOT | **UT-15** | 本仕様書 §3 が SSOT。UT-17 はクエリを参照する |
| Alert 閾値の SSOT | **UT-15**（初期値）→ Phase 10 で再較正 | 本仕様書 §3 表 |

> 並走可（`index.md` 依存関係表より）: UT-17 と並走できるが、本仕様の閾値・メトリクス名が確定しないと UT-17 の dashboard 設計が滑るため、本 Phase 完了を UT-17 dashboard 着手の前提条件とする。

## 4. ログ保管 / 監査要件（個人情報保護観点）

### Cloudflare 側の保持

| 項目 | 既定保持期間（Free / Pro 共通） | 本タスクでの扱い |
| --- | --- | --- |
| Security Events（WAF block / challenge / log） | 直近 24h（Free） / 30 日（Pro 以上） | Free 前提。長期分析は GraphQL Analytics クエリ結果を CSV エクスポートして手元保存 |
| Rate Limit Events | Security Events と同じ | 同上 |
| HTTP request logs（Logpush） | Free では Logpush 不可 | 本タスク範囲外。長期保管は将来 Pro 移行時に検討（runbook の TODO） |

### IP ログ保持の方針

- Cloudflare 側で取得される client IP は edge security 上の必要最小情報として扱い、本タスクでは**新規にリポジトリ側へ IP を保存する仕組みを追加しない**。
- 既存 app-layer rate limit（`rate-limit-magic-link.ts` / `rate-limit-self-request.ts`）が KV 等に IP-derived key を保持している場合、その**保持期間と削除手段は既存仕様を踏襲**し、本タスクでは変更しない（責務分離 / 互換性維持）。
- 監査要件（GDPR / 日本の個人情報保護法）に対する立場: 本サイトの主たる対象者は日本国内利用者であり、IP は「個人関連情報」として最小限の取り扱いに留める。Cloudflare の Security Events は Cloudflare 側で 24h で揮発するため、本タスクで追加の保存はしない。

### 監査トレース

| 項目 | 取得手段 |
| --- | --- |
| WAF rule 編集履歴 | Cloudflare dashboard の Audit Log（owner 限定アクセス） |
| `cf-waf-apply.sh` apply 履歴 | git log（`cf-waf-apply/config.json` の差分）+ CI workflow run ログ |
| Token rotation 履歴 | 1Password アイテム notes 欄 |
| Simulate→Enforce 切替履歴 | git commit + runbook の `## Mode Transition Log` セクション |

## 5. PII redact チェック（Phase 9 標準）

| 項目 | 確認 |
| --- | --- |
| Workers ログに `email` / `responseId` の生値が出ない | Phase 5 実装時に redact helper を経由する設計。Phase 11 smoke で sample log を確認 |
| `metrics_json`（GraphQL Analytics 取得値）に PII が含まれない | aggregate 値（count / rate）と hash 化 IP のみ |
| エラースタックに request body の PII が含まれない | edge 側の 429 レスポンスは定型 JSON。app-layer 側も既存 redact を踏襲 |
| Secrets / Variables 使い分け | `CLOUDFLARE_API_TOKEN` = Secrets（1Password / GitHub Secrets）、`<<ZONE_ID>>` = Variables（GitHub Variables / wrangler [vars]） |

## 6. インシデント response runbook 連携

`docs/runbooks/cloudflare-waf-operations.md` に以下を記載する（Phase 12 で実コード化）。本仕様は項目見出しと最低限の手順を確定する。

| セクション | 内容 |
| --- | --- |
| `## False Positive Response` | Security Events で誤検知を特定 → カスタムルールに例外条件追加 → `cf-waf-apply.sh --dry-run` で確認 → apply |
| `## Emergency Disable (kill switch)` | Enforce 切替後の重大誤ブロック発生時: `bash scripts/cf-waf-apply.sh --mode simulate` で即時 Simulate 復帰（rollback と等価） |
| `## Token Rotation` | §1 の SOP を転記 |
| `## Mode Transition Log` | Simulate→Enforce / Enforce→Simulate の切替を日付・実施者・根拠で追記する append-only ログ |
| `## Whitelist Operation` | 内部 IP / 信頼できる UA を allowlist する手順（カスタムルール 5 件枠との競合に注意） |
| `## Pro Migration TODO` | 無料枠制約（5 件 / 1 件）超過時の Pro 移行判断材料（コスト・OWASP CRS 利用・Logpush） |

## 7. 実行タスク

1. `CLOUDFLARE_API_TOKEN` のスコープを `Zone:WAF:Edit` / `Zone:Rate Limit:Edit` / `Zone:Zone:Read` に絞り、デプロイ用 token と分離して 1Password に配置する。
2. 1Password アイテム（`op://UBM-Hyogo/cf-waf-token/{credential,notes,zone-ids}`）の構造を本仕様で確定する。
3. WAF block / Rate Limit 429 急増の alert（§3）の閾値・通知先・UT-08/UT-17 連携契約を固定する。
4. ログ保管 / IP 保持期間の方針（本タスクでは追加保存しない）を §4 で明文化する。
5. 不変条件 #5 違反検知 grep を SSOT 化（§2）。
6. インシデント response runbook（`docs/runbooks/cloudflare-waf-operations.md`）の必須セクションを §6 で固定する。
7. PII redact チェック（§5）を Phase 11 smoke へ引き渡す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `index.md` | AC-1 / AC-6 / AC-9 / AC-10（CLAUDE.md ルール準拠） |
| 必須 | `phase-01.md` / `phase-02.md` / `phase-03.md` | アーキテクチャ・閾値・MINOR-02 |
| 必須 | `phase-08.md` | CI gate（dry-run / forbid wrangler-direct） |
| 必須 | `CLAUDE.md` §シークレット管理 / Cloudflare 系 CLI 実行ルール / 重要な不変条件 #5 | 1Password / op run / scripts/cf.sh / apps/web から D1 直アクセス禁止 |
| 必須 | `scripts/cf.sh` | ラッパ仕様 |
| 必須 | `docs/runbooks/cloudflare-waf-operations.md`（Phase 12 で新規） | 運用 SOP |
| 関連 | UT-08（通知基盤） / UT-17（監視・アラート） | 通知 / dashboard 連携契約 |
| 参考 | https://developers.cloudflare.com/api/tokens/create/permissions/ | Token 権限スコープ一覧 |
| 参考 | https://developers.cloudflare.com/analytics/graphql-api/ | GraphQL Analytics クエリ |

## 統合テスト連携【必須】

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニットテスト Line | 80%+ | TBD |
| ユニットテスト Branch | 80%+ | TBD |
| ユニットテスト Function | 80%+ | TBD |
| 結合テスト API | 100% | TBD |
| 結合テスト正常系 | 100% | TBD |
| 結合テスト異常系 | 80%+ | TBD |
| CI/CD workflow 実在確認 | 100% | TBD（Phase 8 で実走） |
| PII redact 確認 | 全項目 PASS | TBD（Phase 11 sample log で実測） |

## 多角的チェック観点

- **Token 最小権限**: `Zone:Zone Settings:Edit` 等の不要権限が含まれていないか。
- **token 分離**: デプロイ用 token と編集用 token が同一アイテムに同居していないか。
- **alert SSOT 一元化**: 監視閾値 / クエリの SSOT が本 Phase に閉じているか（UT-17 dashboard 側で別 SSOT にならないこと）。
- **kill switch**: `--mode simulate` での即時復帰が runbook で 1 コマンドとして記述されているか。
- **不変条件 #5**: `apps/web` 配下への D1 参照混入を Phase 9 / 11 で grep 実走する手順が SSOT に残っているか。
- **PII redact**: Workers ログ / metrics_json / エラースタックに PII が混入していないか。
- **個人情報保護法 / GDPR**: 本タスクで IP 等の個人関連情報を新規保存していないことが §4 で明文化されているか。

## 完了条件

- [ ] `CLOUDFLARE_API_TOKEN` の必要権限（`Zone:WAF:Edit` / `Zone:Rate Limit:Edit` / `Zone:Zone:Read`）と不要権限が表化されている
- [ ] 1Password アイテム配置（`op://UBM-Hyogo/cf-waf-token/{credential,notes,zone-ids}`）が確定している
- [ ] Token rotation SOP が §1 に記述され、Phase 12 へ引き渡し可能
- [ ] WAF block / 429 急増 alert（5 件）の閾値・通知先・連携先（UT-08 / UT-17）が表化されている
- [ ] ログ保管 / IP 保持期間の方針（追加保存しない）が §4 で明文化されている
- [ ] 不変条件 #5 違反検知 grep が SSOT として §2 に記述されている
- [ ] PII redact チェック項目が §5 に列挙されている
- [ ] インシデント response runbook の必須セクション（False Positive / Kill Switch / Token Rotation / Mode Transition Log / Whitelist / Pro Migration）が §6 で確定している
- [ ] coverage 既定閾値（80/80/80/80）が完了条件に明記されている（Phase 6 / 9 / 11）
- [ ] **本 Phase 内のタスクを 100% 実行完了**

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- Token / 1Password / runbook の引き渡し先が Phase 12 に明示
- 監視メトリクス・閾値が Phase 10（容量・コスト）と Phase 11（smoke 実測）へ引き渡せる粒度

## 次 Phase への引き渡し

- 次 Phase: 10（パフォーマンス / 容量 / コスト）
- 引き継ぎ事項:
  - alert 閾値の Simulate 観測後の再較正（baseline×N の N 値見直し）
  - WAF Free Managed Ruleset / Rate Limiting Rules 1 件の容量制約と段階移行（Pro $20/mo）の判断基準
  - メトリクス収集対象（block_count / throttle_count / false_positive_estimate）の Phase 10 での集約方針
- ブロック条件:
  - Token スコープが必要最小に絞れていない
  - alert SSOT が本 Phase に閉じていない
  - kill switch 手順が runbook 必須セクションに含まれていない

## 次の Phase

Phase 10: パフォーマンス / 容量 / コスト

## 実行タスク

1. token scope、monitoring、audit log、incident response の運用境界を固定する。
2. UT-16 / notification infrastructure への handoff を定義する。

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 9 security / operations specification | `phase-09.md` |
