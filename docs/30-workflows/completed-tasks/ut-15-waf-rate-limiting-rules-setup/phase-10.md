[実装区分: 実装仕様書]

# Phase 10: パフォーマンス / 容量 / コスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-15: WAF / Rate Limiting ルール設定 (ut-15-waf-rate-limiting-rules-setup) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | パフォーマンス / 容量 / コスト |
| 作成日 | 2026-05-09 |
| 前 Phase | 9（セキュリティ / 監視 / 運用継続性） |
| 次 Phase | 11（手動テスト検証 / smoke） |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL / cloudflare_edge_security |
| visualEvidence | NON_VISUAL（Cloudflare GraphQL Analytics クエリ結果・dashboard 数値で evidence 化） |
| scope | cloudflare_edge_security |

## 目的

UT-15 を Cloudflare 無料プランの制約下で運用するにあたり、(a) Custom Rules 5 件 / Rate Limiting Rules 1 件などの容量制約とそれを超過した場合の段階移行（Pro $20/mo）判断基準、(b) WAF / Rate Limit が edge で評価されることによるレイテンシ影響評価、(c) 429 増加によるユーザー影響推定、(d) 監視 dashboard 用メトリクス収集対象一覧（block_count / throttle_count / false_positive_estimate）の 4 点を SSOT として確定する。本 Phase は spec_created に閉じ、Phase 11 smoke の評価軸と Phase 12 implementation-guide のコスト試算節の参照元となる。

## 真の論点 (true issue)

- 「無料枠で十分か」ではなく、**「無料枠で実装可能な最小集合（Free Managed Ruleset + Custom 5 件 + Rate Limit 1 件相当）が、本サイトの想定トラフィック・脅威プロファイルに対して `必要十分` であることを定量化し、いつ Pro へ移行するかの判断 gate を測定可能な数値で固定する」**こと。副次論点として、edge 評価レイテンシの実効値・429 増加による正常ユーザの影響推定・Cloudflare Analytics 上の主要メトリクス選定。

## 1. Cloudflare 無料プラン制約の明示

| 項目 | Free | Pro ($20/mo) | 本タスクでの扱い |
| --- | --- | --- | --- |
| Managed Ruleset | Cloudflare Free Managed Ruleset のみ | Cloudflare Managed Ruleset / OWASP Core Ruleset 等 | Free Managed Ruleset を Simulate 起点で採用 |
| Custom Rules（WAF Custom Rules） | **5 件** | 25 件 / 100 件（プランによる） | Phase 2 §Concern B で 4 件 + 予備 1 件＝5 件枠ぴったりに収める |
| Rate Limiting Rules | **無料枠 1 件**（または Workers `[[ratelimits]]` binding 経由） | 10 件以上 | 4 グループ（AUTH/ADMIN/ME/PUBLIC）を 1 件のルールで cover できない場合でも、初期実装は zone-level `http_ratelimit` を優先し、Workers binding は Phase 3 MINOR-02 で no-op 判定する設計 |
| Security Events 保持 | 24h | 30 日 | 長期分析は GraphQL Analytics クエリ結果を CSV エクスポート |
| Logpush（HTTP request logs） | 不可 | 可 | 本タスク範囲外（Pro 移行時に検討） |
| Bot Fight Mode | 基本機能のみ | Super Bot Fight Mode | 本タスク範囲外 |
| Page Rules | 3 件 | 20 件 | 本タスクで Page Rules は使わない |

> 結論: 4 グループ（AUTH/ADMIN/ME/PUBLIC）の rate limiting は Cloudflare Rulesets API の `http_ratelimit` phase に `ratelimit` object を持つ rules として表現する。Workers `[[ratelimits]]` binding は Worker 到達後のコード内 rate limit であり、zone-level Rate Limiting Rules の代替ではないため、初期実装では採用しない。Phase 5 実装時に Phase 2 §Concern C のマトリクスに沿って no-op を再確認する。

## 2. Pro 移行判断基準（段階移行 gate）

下記いずれかを満たした時点で `docs/runbooks/cloudflare-waf-operations.md` の `## Pro Migration TODO` を起票し、別 issue として Pro 移行を提案する。

| Gate | 判定条件 | 判断根拠 |
| --- | --- | --- |
| G-1: Custom Rules 5 件超過要件 | Phase 2 で予備枠 1 件を含む 5 件枠を超過する rule 要件が 1 ヶ月以内に 2 件以上発生 | 5 件枠に統合不可な独立 rule が増えた = 防御要件の質的向上 |
| G-2: Rate Limit 1 件で cover 不能 | rate_limiter binding 補完でも責務分離が崩れ、誤ブロック率 > 0.5% が 7 日連続 | Workers binding の制約超過 |
| G-3: Logpush 必要性 | インシデント時に 24h 超過の HTTP request log が要求された事案が 1 件以上発生 | Free の 24h 保持では監査要件を満たさない |
| G-4: OWASP CRS 必要性 | Free Managed Ruleset で blocked にならない攻撃が WAF 突破ログで観測 | Pro 以上の Managed Ruleset が必要 |
| G-5: コスト許容 | $20/mo を運用予算に組み込む合意（owner 判断） | コスト面の最終確認 |

> いずれの gate も Cloudflare GraphQL Analytics クエリ結果と Security Events ログを根拠として PR / issue 本文に貼ることを必須化。dashboard スクリーンショットは取得困難（NON_VISUAL）のため、クエリ結果 JSON を outputs/phase-10/ に保存する形で evidence 化する。

## 3. レイテンシ影響評価

### 評価モデル（仕様レベル）

WAF / Rate Limiting Rules は Cloudflare edge で評価されるため、追加レイテンシは通常 < 1ms と公称される。本タスクでは下記の評価軸で確認する。

| 軸 | 期待 | 計測方法 |
| --- | --- | --- |
| WAF Managed Ruleset 評価レイテンシ | edge 内処理 < 1ms（公称値） | Cloudflare 公式仕様 + Phase 11 smoke で `time curl` の RTT を取得し、有意な悪化がないか確認 |
| Custom Rules 5 件評価レイテンシ | edge 内処理 < 1ms | 同上 |
| Rate Limiting Rules 評価レイテンシ | edge 内処理 < 1ms | 同上 |
| `[[ratelimits]]` binding 評価レイテンシ | Workers 内処理 < 1ms 想定 | 初期実装では no-op。採用時のみ `apps/api` の既存レスポンス時間 SLO（p95 < 500ms 想定）に対して影響を測定 |
| 429 応答時の TTFB | < 100ms（edge return） | Phase 11 smoke で計測 |

### Phase 11 で実測する RTT 比較

| シナリオ | 比較対象 | 期待差分 |
| --- | --- | --- |
| `GET /api/healthz`（rule 適用前 baseline） | rule 適用後 `GET /api/healthz` | RTT 中央値の差 < 5ms |
| `POST /api/auth/magic-link`（threshold 内） | 同上 rule 未適用 | 同上 |
| `POST /api/auth/magic-link` × 11 連投（threshold 超過） | 11 件目が edge で 429 | 11 件目の TTFB < 100ms |

> baseline / 適用後の比較は同一クライアントから連続実行し、ネットワーク変動を平均化する。dashboard / GraphQL Analytics の `httpRequestsAdaptiveGroups` の `originResponseDurationMs` も補助指標として参照する。

## 4. 429 増加によるユーザー影響推定

### 影響モデル

| シナリオ | 想定影響 | 緩和策 |
| --- | --- | --- |
| 共有 NAT / 企業ネットワーク配下の正常ユーザ | 同一 IP 由来の集約で threshold 到達 → 429 | AUTH = 60s/10req は per-IP のため、企業内多人数同時 magic-link 要求でブロック可能性。Simulate 観測 7 日で誤検知件数を計測し、必要なら閾値を上方修正 |
| 公開 Wi-Fi / モバイルキャリア共有 IP | 同上 | 同上。PUBLIC = 10s/50req は scraping 対策のため、誤検知率は低い想定 |
| 管理者の bulk 操作（admin 画面） | ADMIN = 60s/30req に近接 | admin は per-session 操作前提のため通常は届かない。届いた場合は UI 側 batching を Phase 12 で TODO 化 |
| Bot / scraping | 想定どおり 429 | 攻撃者影響は副次効果として許容 |

### 影響定量指標（Phase 11 で実測）

| 指標 | 計算式 | 許容値（Simulate 期間中） |
| --- | --- | --- |
| 誤検知率 | Simulate 中の `action=log` 件数 ÷ 該当 path 全リクエスト数 | < 0.5%（7 日連続） |
| 正常ユーザ影響推定 | `action=log` のうち、whitelisted UA / 内部 IP に該当しない件数 | 0 件（観測期間内） |
| 429 率（全体） | 直近 7 日の 429 数 ÷ 直近 7 日の総リクエスト数 | < 1%（攻撃時を除く） |

> 上記が許容値内に収まらない場合、Enforce 切替を保留し Phase 2 閾値マトリクスへ差し戻す。

## 5. メトリクス収集対象一覧

Phase 9 で定義した監視 alert と同期して、dashboard / 定期レポートに乗せるメトリクスを SSOT 化する。

| メトリクス名 | 取得元（Cloudflare GraphQL Analytics dataset） | 集計単位 | 用途 |
| --- | --- | --- | --- |
| `block_count` | `firewallEventsAdaptiveGroups`（action=block） | 5 分 / 1 時間 / 1 日 | WAF block 総数 |
| `challenge_count` | `firewallEventsAdaptiveGroups`（action=managed_challenge） | 同上 | challenge 過多監視 |
| `simulate_log_count` | `firewallEventsAdaptiveGroups`（action=log） | 1 時間 / 1 日 | Simulate 観測時の誤検知ベースライン |
| `throttle_count` | `rateLimits.rateLimitEventsAdaptiveGroups` | 5 分 / 1 時間 / 1 日 | Rate Limit hit 総数 |
| `http_429_count` | `httpRequestsAdaptiveGroups`（edgeResponseStatus=429） | 同上 | edge + app-layer 合算の 429 |
| `http_429_rate` | `http_429_count` ÷ `httpRequests_total` | 1 時間 / 1 日 | 全体 429 率 |
| `false_positive_estimate` | `simulate_log_count` のうち whitelisted UA / 内部 IP / 既知正常パターン除外後 | 1 日 | Simulate→Enforce 移行 gate |
| `top_blocked_ip` | `firewallEventsAdaptiveGroups` group by `clientIP`（hash 化） | 1 日 | 攻撃者プロファイリング（IP は hash 化のうえ取り扱い） |
| `top_blocked_path` | `firewallEventsAdaptiveGroups` group by `clientRequestPath` | 1 日 | rule の有効性確認 |
| `rate_limit_per_group` | `rateLimitEventsAdaptiveGroups` group by `ruleId` | 1 時間 | AUTH/ADMIN/ME/PUBLIC のグループ別 hit |

### GraphQL Analytics クエリ雛形（実装は Phase 5 / 12）

```graphql
# 仕様レベルの雛形。実 query は Phase 5 で固定し、UT-17 dashboard と共有する。
{
  viewer {
    zones(filter: { zoneTag: "<<ZONE_ID>>" }) {
      firewallEventsAdaptiveGroups(
        filter: { datetime_geq: "<<FROM>>", datetime_lt: "<<TO>>" }
        limit: 1000
      ) {
        count
        dimensions { action ruleId clientRequestPath }
      }
      rateLimitEventsAdaptiveGroups(
        filter: { datetime_geq: "<<FROM>>", datetime_lt: "<<TO>>" }
        limit: 1000
      ) {
        count
        dimensions { ruleId source }
      }
    }
  }
}
```

## 6. コスト試算

| 項目 | Free 構成（本タスク） | Pro 移行時 |
| --- | --- | --- |
| Cloudflare 利用料 | $0 / 月 | $20 / 月 |
| Workers リクエスト課金 | 既存（apps/api / apps/web のリクエスト数次第） | 同上 |
| Workers Rate Limiter binding | 課金は Workers リクエスト数に内包 | 同上 |
| 1Password 追加アイテム（cf-waf-token） | 既存契約内 | 既存契約内 |
| 監視 dashboard 構築（UT-17 連携） | 別タスクの範囲 | 別タスクの範囲 |
| **本タスク追加コスト** | **$0** | **+$20 / 月** |

> 本タスク完了時点では Free 構成。Pro 移行は §2 の G-1〜G-5 が満たされた時点で別 issue として起票。

## 7. 実行タスク

1. Cloudflare 無料プラン制約（Custom 5 件 / Rate Limit 1 件 / Security Events 24h 等）を §1 で固定する。
2. Pro 移行判断 gate G-1〜G-5 を §2 で表化し、各 gate の根拠データ取得方法を明示する。
3. レイテンシ影響評価モデルを §3 で確定し、Phase 11 smoke の RTT 比較計測項目を引き渡す。
4. 429 増加のユーザー影響推定を §4 で定量化（誤検知率 / 正常ユーザ影響推定 / 429 率）。
5. メトリクス収集対象一覧（block_count / challenge_count / simulate_log_count / throttle_count / http_429_count / http_429_rate / false_positive_estimate / top_blocked_ip / top_blocked_path / rate_limit_per_group）を §5 で SSOT 化する。
6. GraphQL Analytics クエリ雛形を §5 で示し、Phase 5 / 12 実コード化と UT-17 dashboard 共有へ引き渡す。
7. コスト試算（Free $0 / Pro $20/mo）を §6 で確定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `index.md` | 受け入れ基準（無料枠制約 / 責務分離） |
| 必須 | `phase-01.md` | NFR-1（無料枠で動作） |
| 必須 | `phase-02.md` | Concern A 閾値マトリクス / Concern B カスタムルール |
| 必須 | `phase-03.md` | MINOR-02 rate_limiter binding |
| 必須 | `phase-08.md` | 無料枠 5 件超過 CI guard |
| 必須 | `phase-09.md` | alert 閾値・メトリクス連携・UT-17 責務境界 |
| 必須 | `CLAUDE.md` §シークレット管理 | コスト面で 1Password 追加アイテム計上 |
| 関連 | UT-17（監視 / アラート） | dashboard 共有先 |
| 参考 | https://developers.cloudflare.com/waf/about/ | Free / Pro 機能差分 |
| 参考 | https://developers.cloudflare.com/waf/rate-limiting-rules/ | Rate Limiting Rules 制約 |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ | Workers rate_limiter binding |
| 参考 | https://developers.cloudflare.com/analytics/graphql-api/features/data-sets/ | GraphQL Analytics dataset |

## 統合テスト連携【必須】

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニットテスト Line | 80%+ | TBD |
| ユニットテスト Branch | 80%+ | TBD |
| ユニットテスト Function | 80%+ | TBD |
| 結合テスト API | 100% | TBD |
| 結合テスト正常系 | 100% | TBD |
| 結合テスト異常系 | 80%+ | TBD（429 RTT / Simulate ログ件数を Phase 11 で実測） |
| 無料枠制約遵守 | Custom Rules ≤ 5 / Rate Limit Rules + binding 設計が無料枠内 | TBD（Phase 8 CI gate で実走） |
| メトリクス収集 SSOT | 10 メトリクスが §5 で SSOT 化 | TBD（Phase 11 smoke で実測値 1 サンプル取得） |

## 多角的チェック観点

- **無料枠超過リスク**: Custom Rules 件数 / Rate Limiting Rules 件数 / Page Rules 件数のいずれも設計時に超過していないか。
- **段階移行 gate の客観性**: Pro 移行判断 G-1〜G-5 の各 gate が「件数 / 連続日数 / 率」など定量条件で判定可能か（owner の主観に依存していないか）。
- **レイテンシ評価の妥当性**: edge 評価 < 1ms の前提が公称値ベースであることを明示し、Phase 11 で実測補強する設計か。
- **誤検知率 < 0.5%**: Simulate→Enforce 移行 gate と整合しているか（Phase 2 §Simulate→Enforce 移行条件）。
- **メトリクス SSOT**: UT-17 dashboard / Phase 9 alert と本 Phase のメトリクス名が一致しているか（drift してないか）。
- **コスト試算の透明性**: 本タスク追加コスト = $0 が明示され、Pro 移行時の差分が 1 行で把握できるか。

## 完了条件

- [ ] Cloudflare 無料プラン制約（Custom 5 件 / Rate Limit 1 件 / Security Events 24h 等）が §1 で表化されている
- [ ] Pro 移行判断 gate G-1〜G-5 が §2 で定量条件として表化されている
- [ ] レイテンシ影響評価モデル（< 1ms 公称 + Phase 11 RTT 実測項目）が §3 で確定している
- [ ] 429 増加のユーザー影響推定（誤検知率 / 正常ユーザ影響 / 429 率）の許容値が §4 で固定されている
- [ ] メトリクス収集対象 10 件が §5 で SSOT 化され、Phase 9 alert / UT-17 dashboard と一致している
- [ ] GraphQL Analytics クエリ雛形が §5 で示されている
- [ ] コスト試算（Free $0 / Pro $20/mo）が §6 で確定している
- [ ] coverage 既定閾値（80/80/80/80）が完了条件に明記されている（Phase 6 / 9 / 11）
- [ ] **本 Phase 内のタスクを 100% 実行完了**

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 無料枠制約・Pro 移行 gate・レイテンシ評価・ユーザー影響・メトリクス・GraphQL クエリ・コストの 7 軸が単一仕様書内で SSOT 化
- Phase 11 smoke で実測する数値項目（RTT / 誤検知率 / 429 率）が引き渡し可能

## 次 Phase への引き渡し

- 次 Phase: 11（手動テスト検証 / smoke）
- 引き継ぎ事項:
  - RTT 実測（baseline vs 適用後 / 11 連投時の TTFB）
  - 誤検知率 / 正常ユーザ影響 / 429 率の 7 日連続観測（Simulate 期間）
  - メトリクス 10 件のうち最低 3 件（block_count / throttle_count / simulate_log_count）の初期値取得
  - GraphQL Analytics クエリの実走と outputs/phase-10/ への JSON 保存
- ブロック条件:
  - 無料枠制約に矛盾する構成（Custom 6 件以上 等）
  - Pro 移行 gate が定量化されていない
  - メトリクス SSOT が UT-17 / Phase 9 と drift

## 次の Phase

Phase 11: 手動テスト検証 / smoke

## 実行タスク

1. Free plan capacity、latency、user impact、metrics collection の最終レビューを行う。
2. Enforce 前後の rollback / observation loop を固定する。

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 10 final review | `phase-10.md` |
