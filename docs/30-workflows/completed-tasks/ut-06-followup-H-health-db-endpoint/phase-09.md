# Phase 9: パフォーマンス・SLO

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/api `/health/db` D1 疎通 endpoint 実装仕様化 (ut-06-followup-H-health-db-endpoint) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | パフォーマンス・SLO |
| 作成日 | 2026-04-29 |
| 前 Phase | 8 (セキュリティ・コンプライアンス) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク種別 | implementation / docs-only / NON_VISUAL / api_health |

## 目的

`/health/db` endpoint について (1) `SELECT 1` 想定レスポンスタイム、(2) Worker CPU 実行時間、(3) 同時接続耐性、(4) 503 時の `Retry-After` 値、(5) endpoint 単体 SLO、(6) 性能異常検知 alert の 6 観点（P1〜P6）を仕様レベルで確定し、Phase 11 smoke 実走で実測値との drift を検知する基準として固定する。本ワークフローは spec_created に閉じるため、本 Phase は Phase 5 着手後の実装ランブックと Phase 11 smoke が参照する SLO・性能ターゲットの SSOT として記述する。`Retry-After: 30` の根拠を UT-08 通知基盤側の閾値合意と整合させ、誤検知（503 を恒常障害と誤認）を抑制する境界を再固定する。

## 真の論点 (true issue)

- 「`/health/db` の性能ターゲット決定」ではなく、**「health endpoint 自体の可用性 SLO（99.5%）と D1 起因 503 を SLO 算定から分離する境界の確立、および `Retry-After: 30` を UT-08 通知間隔と整合させた誤検知抑制境界」**が本 Phase の本質。
- 副次的論点として、(1) p50 / p95 ターゲットを実測 drift 検知の基準として固定、(2) 同時接続前提（外部監視 + UT-08 のみ、QPS < 5）を SLO 算定の前提として明文化、(3) 性能異常検知 alert（p95 > 500ms / 503 rate > 1%）を Phase 8 §S7 監査トレースと接続。

## SLO 設計表

| SLO 項目 | 目標値 | 算定対象 | 算定除外 | 観測元 |
| --- | --- | --- | --- | --- |
| `/health/db` endpoint 可用性（health endpoint 自体の応答性） | 99.5% / 30 日 | endpoint が 200 / 503 のいずれかを返した割合（Worker 側で応答できた割合） | Cloudflare Workers 自体の障害（Cloudflare 側 SLO に紐付け） | Cloudflare Analytics |
| **D1 起因 503 は SLO 算定除外** | - | - | D1 ダウン起因の 503 は別の D1 SLO に紐付け、本 endpoint SLO の数値悪化要因にしない | Workers Logs + D1 status |
| p50 レスポンスタイム | < 50ms（同一リージョン D1） | 200 応答のみ | 503 応答 | Cloudflare Analytics |
| p95 レスポンスタイム | < 200ms（同一リージョン D1） | 200 応答のみ | 503 応答 | Cloudflare Analytics |
| 503 rate | < 1% / 5 分窓 | 全応答 | - | Cloudflare Analytics |

> **境界の核心**: health endpoint の可用性 SLO（99.5%）は「Worker が応答返却できた割合」を測る。D1 起因の 503 は「D1 障害の正しい reporting」であり、本 endpoint としては「正しく 503 を返した = 仕様通り」と扱う。SLO 数値悪化の主要因として D1 障害が混入しないよう、別 SLO（D1 可用性 SLO）に紐付けて分離する。

## 性能ターゲット表（P1〜P6）

| # | 観点 | ターゲット | 根拠 | 検証 Phase |
| --- | --- | --- | --- | --- |
| P1 | `SELECT 1` レスポンスタイム | p50 < 50ms / p95 < 200ms（D1 同一リージョン前提） | D1 SELECT 1 は単純 ping、Cloudflare 公式 D1 latency 目安に基づく仮値 | Phase 11 smoke 実測 |
| P2 | Worker 実行時間（CPU time、D1 RTT 除く） | < 10ms | ハンドラは Hono router + JSON 応答のみで CPU 軽量 | Cloudflare Analytics CPU time |
| P3 | 同時接続耐性（QPS） | QPS < 5 想定（外部監視 + UT-08 のみ） | health check 用途であり一般ユーザートラフィック対象外 | Phase 11 smoke + 通常運用 |
| P4 | 503 時の `Retry-After` 値 | `30` 秒（UT-08 通知間隔と整合） | UT-08 通知基盤側で 30 秒待機 → 2〜3 回リトライ → alert の閾値合意を要請。誤検知抑制 | Phase 3 open question #2 / Phase 11 smoke |
| P5 | endpoint 可用性 SLO | 99.5% / 30 日（D1 起因 503 は SLO 算定除外） | Worker 自体の応答性を測る。D1 障害は別 SLO に紐付けて分離 | 通常運用 |
| P6 | 性能異常検知 alert | Cloudflare Analytics dashboard で `p95 > 500ms` または `503 rate > 1%`（5 分窓）で alert | drift / 退化検知。Phase 8 §S7 監査トレースと接続 | Phase 11 smoke + 通常運用 |

## `Retry-After: 30` の整合性

| 観点 | 値 | 根拠 |
| --- | --- | --- |
| `Retry-After` 値 | 30 秒 | D1 障害は通常 30 秒〜数分で復旧することが多い |
| UT-08 通知基盤の挙動 | 30 秒待機 → 2〜3 回 retry → 連続失敗時に alert | `Retry-After: 30` を尊重して即時 alert 抑制 |
| SLO 算定との整合 | D1 起因 503 は SLO 除外 | 503 が一時的失敗であり、health endpoint 自体の異常ではないと UT-08 / SLO 双方で扱う |
| 仮値 → 確定の経路 | Phase 3 open question #2 で UT-08 閾値合意後に確定 | Phase 11 smoke 実走で実測 |

## 性能異常検知 alert（Phase 8 §S7 監査トレースと接続）

```
[Cloudflare Workers Logs / Analytics]
        │
        ▼
[/health/db request / status / latency 集計]
        │
        ├─ p95 > 500ms (5 分窓) → alert（drift / 退化）
        ├─ 503 rate > 1% (5 分窓) → alert（D1 障害の可能性、UT-08 と整合確認）
        └─ WAF block rate 急増 → alert（攻撃の兆候、Phase 8 §S1 検出）
```

| alert | trigger | 受け皿 |
| --- | --- | --- |
| p95 退化 | p95 > 500ms / 5 分窓 | 通常運用での性能 drift 検知 |
| 503 多発 | 503 rate > 1% / 5 分窓 | UT-08 通知基盤と二重確認、D1 SLO 側に escalate |
| WAF block 急増 | block rate baseline からの急増 | Phase 8 §S1 (probing) の materialize 検出 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-02.md | レスポンス schema / `Retry-After: 30` 仮値 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-03.md | open question #2（Retry-After 値合意） |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-08.md | §S7 監査トレース（本 Phase の alert 接続元） |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-02/main.md | `Retry-After` 根拠記述 |
| 必須 | CLAUDE.md §重要な不変条件 #5 | apps/web から D1 直接アクセス禁止（性能観点で言及） |
| 参考 | https://developers.cloudflare.com/d1/ | D1 latency 目安 |
| 参考 | https://developers.cloudflare.com/workers/observability/metrics-and-analytics/ | Cloudflare Analytics |

## 実行タスク

1. `/health/db` の SLO を成功・失敗・認証遮断の観点で固定する（完了条件: SLO 設計表に全観点がある）。
2. P1〜P6 の性能ターゲットを定義する（完了条件: p50 / p95 / CPU / QPS / Retry-After / alert が埋まっている）。
3. `Retry-After: 30` の仮値と確定経路を UT-08 と接続する（完了条件: Phase 11 smoke と通知閾値合意に trace される）。
4. Cloudflare Analytics / Workers Logs の監査観点を Phase 8 S7 と接続する（完了条件: request / status / WAF block の観測先がある）。
5. Phase 11 smoke で drift 検知する基準を渡す（完了条件: drift 時の差し戻し経路がある）。
6. Phase 12 implementation-guide への SLO 転記項目を固定する（完了条件: alert thresholds と Retry-After 確定値が引き渡される）。

## 実行手順

### ステップ 1: SLO 設計表の作成
- endpoint 可用性 99.5% / D1 起因 503 を SLO 算定除外する分離境界を表化。

### ステップ 2: 性能ターゲット P1〜P6 の固定
- p50 / p95 / CPU / QPS / SLO / alert を 6 行で確定。

### ステップ 3: `Retry-After: 30` 整合性表
- UT-08 通知間隔と整合させる根拠と確定経路（Phase 11 smoke 実走で確定）を明記。

### ステップ 4: alert 設計
- p95 > 500ms / 503 rate > 1% / WAF block 急増の 3 alert を Phase 8 §S7 と接続。

### ステップ 5: drift 検知基準の SSOT 化
- Phase 11 smoke で実測値が本 Phase ターゲットから drift した場合の判断基準を Phase 11 へ渡す。

### ステップ 6: 不変条件 #5 違反検知（性能観点）
- `apps/web` から D1 を直接叩くコードが混入すると、apps/web の Worker 実行時間に D1 RTT が乗り SLO 計測対象が混線する。Phase 8 §不変条件 #5 grep を本 Phase でも参照し、性能 SLO 計測の境界を保つ。

## 統合テスト連携（Phase 11 smoke で実測 → drift 検知）

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | SLO / 性能ターゲット / alert 設計を GO/NO-GO 根拠に渡す |
| Phase 11 | smoke S-03（成功）/ S-11（失敗）で p50 / p95 / `Retry-After` / 503 応答を実測、本 Phase ターゲットとの drift を検知 |
| Phase 12 | implementation-guide.md に SLO / alert thresholds / `Retry-After` 確定値を転記 |
| Phase 13 | user_approval ゲートで SLO 設計と alert 設定の最終確認 |

## 多角的チェック観点

- **不変条件 #5 違反（性能観点）**: `apps/web` 側に D1 参照が混入すると、apps/web の Worker 実行時間に D1 RTT が乗り、`/health/db`（apps/api）SLO の計測対象境界が混線する。Phase 8 §不変条件 #5 grep を再走確認。
- **`Retry-After` 整合性**: 30 秒が UT-08 通知間隔と整合し、503 を恒常障害と誤検知しない設計になっているか。Phase 3 open question #2 で確定する経路が明示されているか。
- **監視誤検知**: D1 起因 503 を SLO 算定除外することで「D1 障害 = health endpoint 異常」と誤って数値悪化させない構造になっているか。
- **drift 検知の現実性**: p50 < 50ms / p95 < 200ms / CPU < 10ms が D1 同一リージョン前提で達成可能か。Phase 11 smoke で実測した結果が drift した場合の差し戻し経路が記述されているか。
- **alert 雑音**: p95 > 500ms / 503 rate > 1% の閾値が 5 分窓で雑音を出さないか。WAF block 急増 alert と Phase 8 §S1 が二重通知にならないか。
- **SLO 分離境界**: health endpoint 可用性 SLO と D1 可用性 SLO が混線せず、責任分界が運用 SOP（Phase 12）で明示されるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | SLO 設計表作成 | 9 | spec_created | 99.5% / D1 起因 503 除外 |
| 2 | 性能ターゲット P1〜P6 固定 | 9 | spec_created | p50 / p95 / CPU / QPS / SLO / alert |
| 3 | `Retry-After: 30` 整合性表 | 9 | spec_created | UT-08 閾値合意 |
| 4 | alert 設計（3 種） | 9 | spec_created | Phase 8 §S7 接続 |
| 5 | drift 検知基準 SSOT 化 | 9 | spec_created | Phase 11 へ |
| 6 | 不変条件 #5 違反検知（性能観点）参照 | 9 | spec_created | Phase 8 grep 再走 |
| 7 | SLO 分離境界の運用 SOP 引渡し | 9 | spec_created | Phase 12 へ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | phase-09.md | 本仕様書（SLO / 性能ターゲット P1〜P6 / Retry-After 整合 / alert 設計） |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] SLO 設計表で endpoint 可用性 99.5% / D1 起因 503 を SLO 算定除外する分離が明記
- [ ] 性能ターゲット P1〜P6 が 6 件すべて表化
- [ ] p50 < 50ms / p95 < 200ms / CPU < 10ms / QPS < 5 が固定
- [ ] `Retry-After: 30` が UT-08 通知間隔と整合し Phase 3 open question #2 で確定する経路が明記
- [ ] alert 3 種（p95 退化 / 503 多発 / WAF block 急増）が Phase 8 §S7 と接続
- [ ] 不変条件 #5 違反検知（性能観点）が Phase 8 §不変条件 #5 grep を再走する形で記述
- [ ] Phase 11 smoke で drift 検知する基準が SSOT として渡されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- SLO 設計表に D1 起因 503 算定除外が明記
- 不変条件 #5 が多角的チェック・性能観点で参照されている
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - SLO 設計（99.5% / D1 起因 503 除外）
  - 性能ターゲット P1〜P6
  - `Retry-After: 30` の UT-08 整合（Phase 11 smoke で確定）
  - alert 設計 3 種を Phase 8 §S7 と接続
  - drift 検知基準を Phase 11 へ
- ブロック条件:
  - SLO 設計で D1 起因 503 算定除外が記述されていない
  - 性能ターゲット P1〜P6 が未固定
  - `Retry-After` が UT-08 通知間隔と整合していない
  - 不変条件 #5（性能観点）が多角的チェックに含まれていない
  - alert 設計が Phase 8 §S7 と接続されていない
