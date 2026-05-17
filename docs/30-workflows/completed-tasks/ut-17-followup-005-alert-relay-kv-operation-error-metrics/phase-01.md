# Phase 1: 要件定義

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/api/src/routes/internal/alert-relay.ts` への構造化ログヘルパ追加・`KV.get` の try/catch 化・既存 `KV.put` catch ブロックの非構造化ログ置換・`crypto.randomUUID()` による `isolateId` 採番・`SHA-256` による `dedupeKeyHash` 算出・テスト拡張 (`alert-relay.spec.ts`)・runbook 追記を伴うコード実装タスク。設計単体では完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17-FU-005 alert-relay KV 操作エラーの observability 計測 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |

## 目的

`alert-relay.ts` の Cloudflare KV (`ALERT_DEDUP_KV`) `get` / `put` 操作失敗を **構造化 JSON ログ 1 行**として `console.warn` 経由で emit し、後段 Workers Logs / logpush で `event` 別・`op` 別の集計が取れる状態にする。既存 API レスポンス契約は維持し、観測可能性のみを追加する。本 Phase では以下 4 つの真の論点を明文化し、Phase 2 設計入力として固定する。

1. `KV.get` の try/catch 化と fail-open 化（現状: try/catch 無し → 例外で request 全体が落下 = 観測不能 fail-closed）
2. ログ emit 方式の選定（`console.warn` JSON 1 行 / `console.error` / Analytics Engine 直接）
3. `dedupeKey` の PII / 容量対策（raw / SHA-256 12hex / SHA-256 full）
4. `isolateId` 採番戦略（request 毎 / module top 1 回 / 環境 binding）

## 真の論点

### 論点 1: `KV.get` の try/catch 化と fail-open 化

現状 `apps/api/src/routes/internal/alert-relay.ts:66` は `await c.env.ALERT_DEDUP_KV.get(dedupeKey)` を **try/catch 無しで呼んでいる**。KV が一時障害で throw した場合、Hono の global error handler に伝播し request 全体が 500 で落ちる。本来の dedup ロジック失敗は Slack 配信を止める必要が無いにもかかわらず、現状は fail-closed として外部に観測不能のまま障害になる。

選択肢:
- **(A) 現状維持**: 観測不能の fail-closed を継続。**不採用**（本タスクの目的に反する）。
- **(B) try/catch + fail-open + 構造化ログ**: catch で構造化ログ emit → `seen = null` 相当として処理続行 → Slack 配信は通常通り実施。KV 障害時に重複配信が増えうるが、原典の現状 fail-closed よりリカバリ性が高い。**第一推奨**。
- **(C) try/catch + fail-closed + 構造化ログ**: catch で構造化ログ emit → 503 等で短絡返却。Slack 通知サイレント化リスクが残る。**不採用**。

→ Phase 1 では **(B) を採用**。重複配信の検出は構造化ログ + 後段 dashboard で担保する（UT-17-FU-004 領域）。

### 論点 2: ログ emit 方式

選択肢:
- **(A) `console.warn` で JSON 1 行**: Workers Logs にプレーン文字列として乗るが、1 行 JSON 固定により後段 logpush / `JSON.parse` 検索が容易。追加 binding 不要、コスト 0。**第一推奨**。
- **(B) `console.error`**: severity を error に上げると本タスクの「重要度: 警告」より過大評価。Sentry 等への昇格は別タスク。**不採用**。
- **(C) Analytics Engine への直接書き込み**: schema 設計・binding 追加・write-time quota を伴う。UT-17-FU-004 の責務領域と重複。**不採用**。

→ Phase 1 では **(A) `console.warn` JSON 1 行** を採用。logpush は後続タスクで構造化検索に昇格可能とする。

### 論点 3: `dedupeKey` の PII / 容量対策

`dedupeKey` は `metric:policyId:minuteBucket` 形式（`alert-relay.ts:59-63`）で、policy_id 等が含まれる。生値を出すと Workers Logs にカード化されて検索負荷が増えるうえ、policy_id 命名規則変更時に PII / 内部識別子が漏れるリスクがある。

選択肢:
- **(A) raw 出力**: 検索性は最大だが PII / 容量リスクあり。**不採用**。
- **(B) SHA-256 先頭 12 hex (48bit)**: 衝突確率 ≪ 1e-9 (policy_id × minute × metric の組合せ規模で十分)。容量は 12byte 固定。**第一推奨**。
- **(C) SHA-256 full (64 hex)**: 容量過大、検索 UX が悪化。**不採用**。

→ Phase 1 では **(B) SHA-256 12 hex** を採用。

### 論点 4: `isolateId` 採番戦略

選択肢:
- **(A) request ごとに採番**: Workers Logs から isolate 跨ぎの相関が取れない。emit ごとに UUID が変わるとログ集約で「同一 isolate 連続失敗」を判別不能。**不採用**。
- **(B) module top で `crypto.randomUUID()` 1 回**: モジュールロード（= isolate 起動）時に 1 回採番される。同一 isolate 内で複数 request / 複数 emit が同じ `isolateId` を共有 → ログから「isolate 単位の失敗集中」が観測可能。**第一推奨**。
- **(C) 環境 binding (`env.ISOLATE_ID`)**: Workers 環境で isolate ごとに binding を分けることは不可。**実装不能**。

→ Phase 1 では **(B) module top 1 回採番** を採用。`alert-relay.ts` の module スコープ top-level に `const ISOLATE_ID = crypto.randomUUID();` を置く。

## 依存境界と責務

| 種別 | 対象 | 境界 |
| --- | --- | --- |
| 上流 | UT-17-FU-002 (`ALERT_DEDUP_KV` binding) | binding は既存・改変禁止。dedupeTtl / value 規約も不変 |
| 上流 | `apps/api/src/routes/internal/alert-relay.ts` | `createAlertRelayRoute()` 内部に閉じた変更のみ。export surface は変えない |
| 連携 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | 既存ケース改変は最小限、追加ケースで AC-1〜AC-7 を担保 |
| 連携 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | KV 操作エラーログ確認セクション追記 |
| 対象外 | UT-17-FU-004 (Cloudflare Dashboard / Analytics Engine) | 別責務 |
| 対象外 | Workers Logpush 設定 | 別タスク |
| 対象外 | D1 schema 変更 | 不要 |
| 対象外 | `apps/web` 配下 | 不要 |
| 対象外 | secret 追加 / `wrangler.toml` 変更 | 不要 |

## 価値とコスト評価

- **初回提供価値**: KV 一時障害 / dedup ストア drift を後段 Workers Logs から `event=alert_relay_kv_op_failed` で grep 可能化。`KV.get` の現状サイレント fail-closed を fail-open + 観測可能に転換。
- **初回に払わないコスト**: Dashboard / Analytics Engine 連携、logpush 設定、retry 戦略変更、ストア移行検討。
- **設計コスト**: Phase 02 成果物 4 件 + Phase 03 レビュー 1 件 = 5 ドキュメント。
- **実装コスト見積（Phase 4 以降）**:
  - `alert-relay.ts` ヘルパ追加 約 30 行、`get` try/catch 化 約 15 行、`put` catch 置換 約 5 行
  - `alert-relay.spec.ts` 追加ケース 約 80〜120 行
  - runbook 追記 約 25 行
- **運用コスト**: ログ schema は AC-3 で固定。後方互換 (additive のみ) ポリシーで logpush 契約として安定化。

## 4 条件評価

| 条件 | 問い | 判定 | 解消条件 |
| --- | --- | --- | --- |
| 価値性 | KV 障害を Workers Logs から定常検出できるか | PASS | — |
| 実現性 | `crypto.subtle.digest` / `crypto.randomUUID()` が Workers runtime で利用可能か | PASS | Workers runtime 標準 API として利用可 |
| 整合性 | UT-17 / UT-17-FU-002 不変条件・既存 API 契約と整合するか | CONDITIONAL | `KV.get` の fail-closed → fail-open 化は behaviour change。Phase 3 レビューで明示承認 |
| 運用性 | ログ schema が後段 logpush / dashboard 契約として安定するか | CONDITIONAL | Phase 2 で AC-3 schema を不変条件 7（additive only）下に固定 |

## 既存資産インベントリ

| 資産 | 確認結果 | 参照 |
| --- | --- | --- |
| `KV.get` 呼び出し | try/catch 無し。throw で request 落下する fail-closed 状態 | `apps/api/src/routes/internal/alert-relay.ts:66` |
| `KV.put` 呼び出し | try/catch 有り。catch 内で `console.warn("alert relay dedup KV put failed after Slack delivery", { error })` の非構造化 emit | `apps/api/src/routes/internal/alert-relay.ts:93-102` |
| `dedupeKey` 構築 | `metric:policy:minuteBucket` 形式、`join(":")` 連結 | `apps/api/src/routes/internal/alert-relay.ts:59-63` |
| `AlertRelayEnv` interface | `ALERT_DEDUP_KV: KVNamespace` 定義済。追加 binding 不要 | `apps/api/src/routes/internal/alert-relay.ts:17-24` |
| 既存テスト | 546 行。`vi.spyOn(console, 'warn')` 既存利用ありかは Phase 2 で再確認 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` |
| 月次 runbook | 既存。「KV 操作エラーログ確認」セクション未存在 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` |
| `crypto.randomUUID()` / `crypto.subtle.digest` | Workers runtime 標準 API、追加 polyfill 不要 | Cloudflare Workers Runtime APIs |

## スコープ確定

### 含む

- module-local `logKvOperationError(op, err, dedupeKey)` ヘルパ追加
- module top で `crypto.randomUUID()` による `ISOLATE_ID` 1 回採番
- `dedupeKeyHash` (SHA-256 12 hex) 算出（catch path のみ）
- `KV.get` 呼び出しの try/catch 化と fail-open (seen=null として処理続行)
- `KV.put` 既存 catch の非構造化 `console.warn` を構造化 JSON 1 行に置換
- `alert-relay.spec.ts` への追加ケース（`get` throw / `put` throw / 成功時 emit 0 / payload shape assertion / 同一 isolate 2 emit の `isolateId` 一致）
- monthly runbook への「KV 操作エラーログ確認手順」セクション追記
- AC-3 ログ schema field 定義表（runbook 内）

### 含まない

- Cloudflare Dashboard / Analytics Engine 連携
- Workers Logpush 設定
- Slack / PagerDuty 自動通知ルート
- KV retry / 二重書き戦略変更
- D1 / Durable Object への dedup ストア移行
- `wrangler.toml` / `apps/api/src/env.ts` 変更
- secret 追加

## 受入条件 (AC) 確認

index.md で定義した AC-1〜AC-10 を Phase 1 で正式承認する。
- AC-1〜AC-3 → Phase 2 `log-schema.md` / `emit-points.md` で具体化
- AC-4 → Phase 2 `helper-design.md` で hash 算出仕様を固定
- AC-5 → Phase 2 `isolate-id-strategy.md` で採番戦略を固定
- AC-6〜AC-7 → Phase 2 `emit-points.md` で既存挙動の不変性を担保
- AC-8 → Phase 3 design-review でテスト計画妥当性を確認
- AC-9 → Phase 2 設計内で runbook 追記範囲を明文化
- AC-10 → 不変条件 2 (`*.spec.ts` 縛り) で恒常担保

## 用語集

| 用語 | 意味 |
| --- | --- |
| isolateId | Workers isolate 1 つあたりに module top で 1 回採番される UUID。同一 isolate 内の全 emit で共有 |
| dedupeKeyHash | `SHA-256(dedupeKey)` の先頭 12 hex chars (48 bit)。catch path 内でのみ算出 |
| fail-open | 副次機能（dedup）の失敗時に主機能（Slack 配信）を継続する設計方針 |
| fail-closed | 失敗時に処理全体を停止する設計方針。現状 `KV.get` は事実上これになっている |
| 構造化ログ 1 行 | `JSON.stringify` で 1 行に整形された確定 schema の JSON。Workers Logs / logpush で `JSON.parse` 可能 |
| event 名 | ログ schema の固定 discriminator。本タスクでは `alert_relay_kv_op_failed` |

## 実行タスク

- [ ] 原典タスク `docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md` を読み込み、AC 漏れがないか再確認する
- [ ] `apps/api/src/routes/internal/alert-relay.ts` の現状 (L66 / L93-102) を行番号付きで確認する
- [ ] 既存テスト `__tests__/alert-relay.spec.ts` の `console.warn` spy 利用状況を確認する
- [ ] 真の論点 4 点を明文化し採用案を確定する
- [ ] 4 条件評価を行い CONDITIONAL の解消条件を Phase 2 へ申し送る
- [ ] `outputs/phase-01/requirements.md` を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md | 原典タスク |
| 必須 | docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv-persistence.md | 親 followup（KV 永続化導入元） |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | 実装対象本体 |
| 必須 | apps/api/src/routes/internal/__tests__/alert-relay.spec.ts | テスト拡張対象 |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | runbook 追記対象 |
| 必須 | CLAUDE.md | 不変条件（`*.spec.ts` 縛り） |
| 参考 | https://developers.cloudflare.com/workers/observability/logs/workers-logs/ | `console.warn` 経路 |
| 参考 | https://developers.cloudflare.com/kv/api/ | KV API（eventual consistency） |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物（4 論点・スコープ・AC 承認・4 条件評価・既存資産インベントリ・用語集） |

## 完了条件

- [ ] 4 つの真の論点が文書化され採用案が確定している
- [ ] 4 条件評価が PASS / CONDITIONAL で記録されている
- [ ] AC-1〜AC-10 が Phase 1 で正式承認されている
- [ ] 既存資産インベントリが行番号付きで記録されている
- [ ] Phase 2 への引き継ぎ事項が明記されている
- [ ] `outputs/phase-01/requirements.md` が作成されている

## タスク 100% 実行確認【必須】

- 全実行タスク completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（KV.get throw / KV.put throw / `crypto.subtle` 失敗 / `console.warn` spy leak）を Phase 2 申し送り事項に含む
- 次 Phase への引き継ぎ事項を明記

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項:
  - 論点 1〜4 の採用案（(B)-(A)-(B)-(B)）を Phase 2 設計の前提として固定
  - CONDITIONAL 解消条件 2 件（behaviour change 承認 / schema 不変条件 7 固定）を Phase 2 / Phase 3 で消化
  - 既存資産インベントリの行番号 (L66 / L93-102 / L59-63 / L17-24) を Phase 2 設計内の before/after snippet 参照に転記
- ブロック条件: `outputs/phase-01/requirements.md` 未作成 / CONDITIONAL 解消条件未記録 の場合は Phase 2 に進まない

## 統合テスト連携

Phase 7 の `alert-relay.spec.ts` 追加ケースで AC-1〜AC-7 を統合的に検証する。実行可能な package filter は `@ubm-hyogo/api` とする。
