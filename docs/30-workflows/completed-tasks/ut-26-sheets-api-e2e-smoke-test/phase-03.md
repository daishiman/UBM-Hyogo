# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | spec_created |
| タスク分類 | specification-design（design review） |

## 目的

Phase 2 設計（smoke-test-design.md / cache-and-error-mapping.md）に対し、3 案以上の代替案を比較して PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降への着手可否ゲートを通す。同時に Phase 2 設計のセルフレビュー（不変条件 #1/#4/#5 / 認可境界 / Secret hygiene / 無料枠）を行い、苦戦箇所 5 件の受け止めが設計に正しく織り込まれていることを検証する。最終決定は ADR 形式で記述する。

## 実行タスク

1. 代替案を最低 3 案列挙する（A: dev/staging 限定 Hono route / B: wrangler exec の standalone script / C: CI workflow からの ad-hoc 実行 / D: durable-object ベースの長寿命キャッシュ案）（完了条件: 4 案以上が比較表に並ぶ）。
2. 各代替案に対し 4条件 + 5 観点（不変条件 / 認可境界 / Secret hygiene / 無料枠 / 苦戦箇所カバー率）で PASS / MINOR / MAJOR を付与する（完了条件: マトリクスに空セルゼロ）。
3. base case（Phase 2 採用 = 案 A）を選定理由付きで確定する（完了条件: 選定理由が代替案比較から導出されている）。
4. PASS / MINOR / MAJOR の判定基準を明文化する（完了条件: 各レベルの基準文が記載されている）。
5. Phase 2 設計のセルフレビューを行い、不変条件 #1/#4/#5 / 認可境界 / Secret hygiene / 無料枠 / 苦戦箇所 5 件すべてに PASS / MINOR / MAJOR を付与する（完了条件: 12 観点に空セルゼロ）。
6. 最終決定を ADR 形式（Context / Decision / Consequences / Alternatives Considered）で記述する（完了条件: 4 セクションすべて埋まる）。
7. 着手可否ゲートを定義する（完了条件: GO / NO-GO 条件が Phase 4 移行の前提として明示）。
8. open question を Phase 4 以降に振り分ける（完了条件: open question が 0 件 or 受け皿 Phase 指定）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/outputs/phase-02/smoke-test-design.md | base case の構造 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/outputs/phase-02/cache-and-error-mapping.md | base case のキャッシュ / error mapping |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-01.md | 4条件・苦戦箇所原典 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/api 境界 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Secret hygiene 基準 |
| 参考 | https://developers.google.com/identity/protocols/oauth2/service-account | SA OAuth flow |

## 代替案比較

### 案 A: dev/staging 限定 Hono route（base case = Phase 2 採用）

- 概要: `apps/api/src/routes/admin/smoke-sheets.ts` に dev/staging で実行可能な `GET /admin/smoke/sheets` を mount。`SMOKE_ADMIN_TOKEN` Bearer + env-guard の二段ガード。production では runtime 404 を返す。
- 利点: 既存 `apps/api` の Hono 構成 / middleware / logger を素直に再利用。Workers Edge Runtime での実機検証が直接可能（苦戦箇所 #1 を直接解消）。`wrangler dev` / `curl` / staging deploy のいずれからも同一 contract で叩ける。
- 欠点: route 1 本分のコード（約 50 LOC）が増える。production 露出禁止を build-time / runtime の二段で保証する責務が発生。

### 案 B: wrangler exec の standalone script

- 概要: `apps/api/src/scripts/smoke-test-sheets.ts` を作り、`wrangler dev --test-scheduled` または `wrangler deploy --dry-run` 経由で実行。route を一切 mount しない。
- 利点: production 露出リスクが構造的にゼロ（route そのものが存在しない）。token も不要。
- 欠点: Workers Edge Runtime での実行コンテキストを script 単体で再現するのが難しく、`getMiniflareBindings` 的な hack が必要。`sheets-fetcher.ts` が想定する `env` binding を script 側で組み立て直す必要があり、苦戦箇所 #4（wrangler dev 制約）がむしろ悪化。実機 staging Workers での検証ができない（= AC-1 / AC-2 を満たせない可能性）。

### 案 C: CI workflow からの ad-hoc 実行

- 概要: GitHub Actions の `workflow_dispatch` で staging Workers 上の smoke route を curl で叩き、ログを Actions の Job summary に残す。
- 利点: 証跡が CI に永続化される。手元環境差分の影響を受けない。
- 欠点: 案 A の route が前提となるため案 A の代替ではなく **補完**。CI Secret として `SMOKE_ADMIN_TOKEN` を別途配置する必要があり、Secret hygiene の管理面が増える。MVP では Phase 11 で手動実行で足り、優先度は低い。

### 案 D: Durable Object ベースの長寿命キャッシュ案

- 概要: アクセストークンキャッシュを Durable Object に置き、isolate 越境でも 1h TTL を共有する。
- 利点: 苦戦箇所 #5（token TTL とキャッシュ）を構造的に解消。
- 欠点: smoke test 1 回限りの目的に対し過剰。Durable Object は無料枠の対象だが課金面が変動。MVP の疎通確認スコープを越える。UT-09 本実装で必要になった時点で別タスク化すべき。

### 案 E: KV 補助キャッシュ（in-memory + KV fallback）

- 概要: 案 A をベースに、in-memory miss 時に KV を覗く二層キャッシュ。
- 利点: isolate 越境を best-effort で吸収。
- 欠点: smoke route の主目的（疎通確認）に対し責務が増える。AC-4（2 回目で OAuth fetch 省略）は in-memory のみで満たせる。

### 代替案 × 評価マトリクス

| 観点 | 案 A (base) | 案 B (script) | 案 C (CI 補完) | 案 D (DO cache) | 案 E (KV cache) |
| --- | --- | --- | --- | --- | --- |
| 価値性 | PASS | MINOR（実機 Edge 検証が弱い） | PASS | MINOR（過剰） | MINOR（過剰） |
| 実現性 | PASS | MAJOR（Edge runtime 再現が困難） | PASS（A 前提） | MINOR | PASS |
| 整合性（不変条件 #1/#4/#5） | PASS | PASS | PASS | PASS | PASS |
| 運用性 | PASS | MINOR（実行手順が分散） | PASS | MINOR（DO 管理） | PASS |
| 認可境界（production 露出禁止） | PASS（二段ガード） | PASS（route なし） | PASS | PASS | PASS |
| Secret hygiene | PASS | PASS | MINOR（CI Secret 増） | PASS | PASS |
| 無料枠 | PASS | PASS | PASS | MINOR（DO 課金注意） | PASS |
| 苦戦箇所 #1（fetch mock 差分） | PASS | MAJOR | PASS（A 前提） | PASS | PASS |
| 苦戦箇所 #4（wrangler dev 制約） | PASS（remote モード推奨） | MAJOR | PASS | PASS | PASS |
| 苦戦箇所 #5（token TTL） | PASS（in-memory） | n/a | PASS | PASS | PASS |
| MVP スコープ整合 | PASS | MINOR | MINOR（補完） | MAJOR | MINOR |

### 採用結論

- base case = **案 A** を採用。
- 理由: Workers Edge Runtime での実 API 疎通保証が UT-26 の真の論点であり、案 A のみがこの要件を満たす。production 露出禁止は build-time + runtime の二段ガードで担保可能。案 C は将来の補完候補として Phase 12 unassigned-task-detection.md に記録する。案 D / E は MVP スコープ外として Phase 12 未タスクへ送る。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の判断軸を満たす。block にならず Phase 4 へ進める。 |
| MINOR | 警告レベル。Phase 5 / 6 / 11 で運用補足対応（log / runbook / 検証手順追記）が必要だが、Phase 4 移行は許可。 |
| MAJOR | block。Phase 4 へ進めない。設計を Phase 2 に差し戻すか open question として MVP スコープ外に明確化する。 |

## Phase 2 設計のセルフレビュー（base case 最終判定）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 着手前に Workers 実機での認証フローと 403 切り分けを保証 |
| 実現性 | PASS | UT-03 / UT-25 / 01c が完了済。Hono / Web Crypto / curl の既存技術 |
| 整合性 | PASS | 不変条件 #1/#4/#5 を満たす |
| 運用性 | PASS | troubleshooting runbook + 二段ガードで再現性と安全性を両立 |
| 不変条件 #1（schema 固定回避） | PASS | smoke route は値の存在 / 行数 / 任意 1 行のサンプルのみ。列順依存なし |
| 不変条件 #4（admin-managed data 分離） | PASS | 読み取り専用。書き込みなし |
| 不変条件 #5（D1 直接アクセスは apps/api に閉じる） | PASS | smoke route は `apps/api` 内。D1 access はそもそも発生しない |
| 認可境界 | PASS | build-time（env 分岐）+ runtime（`SMOKE_ADMIN_TOKEN` Bearer）の二段 |
| Secret hygiene | PASS | SA JSON / access_token / Bearer token は log / PR / 証跡から redact |
| 無料枠 | PASS | 月数十リクエストで Workers / Sheets API いずれも free tier 内 |
| 苦戦箇所カバー（5 件） | PASS | #1 実機 e2e で解消、#2 error-mapper 4 候補 + runbook、#3 spreadsheetId 出典コメント必須化、#4 `wrangler dev` remote モード明記、#5 in-memory キャッシュ TTL 明記 |
| WAL 非依存 | PASS | D1 を使わないため対象外 |

## ADR-UT26-001: dev/staging 限定 Hono route で実 API 疎通を保証する

### Context

UT-03 で実装した `sheets-fetcher.ts` は fetch mock テスト済みだが、Workers Edge Runtime の Web Crypto API（RSA-SHA256）と Google OAuth 2.0 token endpoint を経由する実際の HTTP 通信は未検証。UT-09（Sheets→D1 同期ジョブ）が本番 API にアクセスする前に、認証フロー全体を実機で疎通確認し、403 が出た際の切り分け runbook を残す必要がある。production への誤書き込みは絶対禁止。

### Decision

`apps/api/src/routes/admin/smoke-sheets.ts` に `GET /admin/smoke/sheets` を追加し、`sheets-fetcher.ts`（reuse）→ Sheets API v4 `spreadsheets.values.get`（GET 専用）の e2e 疎通を Workers 上で実行する。production 露出禁止は (1) `wrangler.toml` の env 分岐で runtime 404 で production を拒否する、(2) runtime で `env-guard.ts` が `env=production` を弾く、(3) `SMOKE_ADMIN_TOKEN` Bearer 認証必須、の三段で担保する。アクセストークンは in-memory `Map` で TTL `expires_in - 60s` キャッシュする。401/403/429 は `error-mapper.ts` で `SMOKE_AUTH_INVALID` / `SMOKE_FORBIDDEN` / `SMOKE_RATE_LIMITED` の内部 code に正規化し、403 には runbook 参照 hint を付与する。

### Consequences

- 利点: UT-26 AC-1〜AC-11 をすべて満たせる。UT-09 着手時の認証起因障害切り分けコストがゼロ化。Phase 11 の troubleshooting runbook を再利用できる。
- 欠点: route 1 本分（約 50 LOC）追加。production 露出禁止の二段ガードが破られないかを Phase 9 / 10 / 12 で繰り返し確認する責務が発生。
- リスク緩和: `wrangler.toml` の env diff を Phase 11 / Phase 13 で必須レビュー。`SMOKE_ADMIN_TOKEN` が production Cloudflare に存在しないことを Phase 11 で `wrangler secret list --env production` 相当で検証。
- フォローアップ: 案 C（CI ad-hoc 実行）と案 D / E（DO / KV キャッシュ）は Phase 12 unassigned-task-detection.md に候補として記録。

### Alternatives Considered

- 案 B（standalone script）: Edge runtime 再現性が弱く実機検証要件を満たせない（MAJOR）。
- 案 C（CI 補完）: 案 A の補完であり代替ではない。MVP では Phase 11 手動実行で足りる。
- 案 D（Durable Object cache）: スコープ過大。
- 案 E（KV 補助）: AC-4 を in-memory のみで満たせるため不要。

## 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て満たすこと）

- [ ] 代替案 4 案以上が評価マトリクスに並んでいる
- [ ] base case（案 A）の最終判定が全観点 PASS
- [ ] MAJOR が一つも残っていない
- [ ] MINOR がある場合、対応 Phase（5 / 6 / 11 / 12）が指定されている
- [ ] ADR-UT26-001 の 4 セクションが埋まっている
- [ ] 苦戦箇所 5 件すべてに対応設計が紐づいている
- [ ] open question が 0 件、または受け皿 Phase が明記されている

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る
- production 露出禁止が build-time / runtime のいずれかでしか担保されていない
- `SMOKE_ADMIN_TOKEN` の認可方式が未定義
- SA JSON の log 出力経路が設計に残存
- アクセストークンキャッシュの TTL / キーが未確定

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | `admin-smoke-auth.ts` middleware を将来的に他の admin route と共通化するか | Phase 5 | UT-21 の admin route が増えるタイミングで再評価 |
| 2 | KV 補助キャッシュ（案 E）を将来導入する閾値 | Phase 12 unassigned | isolate 越境キャッシュが必要になった時 |
| 3 | CI workflow_dispatch（案 C）からの ad-hoc 実行 | Phase 12 unassigned | 監査要件が出た時に追加 |
| 4 | `SHEETS_SMOKE_RANGE` のデフォルト値（A1:C5 vs A1:C1） | Phase 11 | 実機シートの形状を見て確定 |
| 5 | アクセストークンキャッシュの multi-isolate 観測 | Phase 11 | 単一 isolate 観測で足りるか staging で確認 |

## 実行手順

### ステップ 1: 代替案の列挙

- 案 A〜E を `outputs/phase-03/main.md` に記述する。
- 各案に概要・利点・欠点・結論を 3〜5 行で記述する。

### ステップ 2: 評価マトリクスの作成

- 11 観点（4条件 + 認可 + Secret hygiene + 無料枠 + 苦戦箇所 #1/#4/#5 + MVP スコープ）× 5 案を埋める。
- 空セルが残らないこと。

### ステップ 3: base case の最終判定

- 12 観点すべて PASS であることを確認。
- MINOR が残る場合は対応 Phase を明示。

### ステップ 4: ADR の記述

- ADR-UT26-001 として Context / Decision / Consequences / Alternatives Considered を記述。

### ステップ 5: 着手可否ゲートと open question

- GO / NO-GO チェックリストを通す。
- open question を 5 件まで受け皿 Phase 付きで列挙。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | base case を入力に、8 モジュール × テスト種別を組む |
| Phase 5 | open question #1（middleware 共通化）を実装で確定 |
| Phase 9 | 認可境界（二段ガード）の自動チェック観点を再利用 |
| Phase 10 | base case 最終 PASS 判定を GO/NO-GO の根拠に再利用 |
| Phase 11 | open question #4 / #5 を staging 観測で確認 |
| Phase 12 | open question #2 / #3 を unassigned-task-detection.md に登録 |

## 多角的チェック観点

- 価値性: 案 A が「Edge Runtime 実機検証 + 403 切り分け runbook」という真の論点を満たすか。
- 実現性: 案 B の MAJOR（Edge runtime 再現困難）を base case が踏まないか。
- 整合性: 全代替案で不変条件 #1/#4/#5 が PASS であることを確認したか。
- 運用性: 二段ガードと runbook が運用者に再現可能な手順を提供するか。
- 認可境界: production 露出禁止が build-time / runtime / log / PR の四面で担保されているか。
- Secret hygiene: SA JSON / access_token / Bearer token の log 出力経路がゼロか。
- 無料枠: 月数十リクエストで Workers / Sheets API free tier に収まるか。
- 苦戦箇所カバー: 5 件すべてに設計上の受け皿が紐づいているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 案以上の列挙 | 3 | spec_created | 案 A〜E |
| 2 | 評価マトリクスの作成 | 3 | spec_created | 11 観点 × 5 案 |
| 3 | base case 最終 PASS 判定（12 観点） | 3 | spec_created | 全観点 PASS |
| 4 | PASS/MINOR/MAJOR 基準の定義 | 3 | spec_created | 3 レベル |
| 5 | ADR-UT26-001 の記述 | 3 | spec_created | 4 セクション |
| 6 | 着手可否ゲートの定義 | 3 | spec_created | GO / NO-GO |
| 7 | open question の Phase 振り分け | 3 | spec_created | 5 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案比較・評価マトリクス・PASS/MINOR/MAJOR・セルフレビュー・ADR・着手可否ゲート |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件

- [ ] 代替案が 4 案以上比較されている
- [ ] 11 観点 × 5 案のマトリクスに空セルが無い
- [ ] base case の最終判定が 12 観点すべて PASS
- [ ] PASS / MINOR / MAJOR の判定基準が明文化されている
- [ ] ADR-UT26-001 の Context / Decision / Consequences / Alternatives Considered が埋まっている
- [ ] 着手可否ゲートの GO / NO-GO 条件が記述されている
- [ ] open question 5 件すべてに受け皿 Phase が割り当てられている
- [ ] 苦戦箇所 5 件すべてが設計対応索引で PASS 判定されている

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物が `outputs/phase-03/main.md` に配置済み
- 4条件 + セルフレビュー全観点が PASS
- MAJOR ゼロ
- MINOR がある場合は対応 Phase が記述
- artifacts.json の `phases[2].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用 base case = 案 A（dev/staging 限定 Hono route + 二段ガード + in-memory token cache）
  - 8 モジュール（Phase 2 で確定）に対する検証観点を Phase 4 の入力に渡す
  - ADR-UT26-001 を Phase 10 GO/NO-GO の根拠として再利用
  - open question 5 件を該当 Phase へ register
- ブロック条件:
  - GO 条件のいずれかが未充足
  - MAJOR が残っている
  - base case が代替案比較から導出されていない
  - production 露出禁止が二段ガードになっていない
