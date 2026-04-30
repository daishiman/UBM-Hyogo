# UT-26 Phase 3 成果物 — 設計レビュー main.md

| 項目 | 値 |
| --- | --- |
| タスク | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase | 3 / 13（設計レビュー） |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| レビュー対象 | `outputs/phase-02/smoke-test-design.md` / `cache-and-error-mapping.md` |

---

## 1. 目的

Phase 2 base case に対し代替案 4 案以上を比較し、4 条件 + セルフレビュー観点で PASS / MINOR / MAJOR を付与する。最終決定を ADR 形式で記述し、Phase 4 への着手可否ゲート（GO / NO-GO）を確定する。

---

## 2. PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の判断軸を満たし、block にならず Phase 4 へ進める |
| MINOR | 警告レベル。Phase 5 / 6 / 11 / 12 で運用補足対応（log / runbook / 検証手順追記）が必要だが Phase 4 移行は許可 |
| MAJOR | block。Phase 4 へ進めない。設計を Phase 2 に差し戻すか、open question として MVP スコープ外に明確化する |

---

## 3. 代替案の列挙（5 案）

### 案 A: dev/staging 限定 Hono route（base case = Phase 2 採用）

- **概要**: `apps/api/src/routes/admin/smoke-sheets.ts` に `GET /admin/smoke/sheets` を mount。`SMOKE_ADMIN_TOKEN` Bearer + env-guard + build-time 分岐の三段ガード。production では runtime 404 を返す。
- **pros**:
  - 既存 `apps/api` の Hono / middleware / logger をそのまま再利用
  - Workers Edge Runtime での実機検証が直接可能（苦戦箇所 #1 を直接解消）
  - `wrangler dev --remote` / `curl` / staging deploy のすべてから同一 contract で叩ける
- **cons**:
  - 約 50〜80 LOC のコード追加
  - production 露出禁止の三段ガードが破られないかを Phase 9 / 10 / 12 で繰り返し確認する責務が発生

### 案 B: standalone smoke スクリプト方式

- **概要**: `apps/api/src/scripts/smoke-test-sheets.ts` を作り、`wrangler dev --test-scheduled` または `wrangler deploy --dry-run` 経由で実行。route を一切 mount しない。
- **pros**:
  - production 露出リスクが構造的にゼロ（route そのものが存在しない）
  - `SMOKE_ADMIN_TOKEN` も不要
- **cons**:
  - Workers Edge Runtime の実行コンテキストを script 単独で再現するのが難しく、`getMiniflareBindings` 的な hack が必要
  - `sheets-fetcher.ts` が想定する `env` binding を script 側で組み立て直す必要があり、苦戦箇所 #4（wrangler dev 制約）が悪化
  - 実機 staging Workers での検証ができず、AC-1 / AC-2 を満たせない可能性が高い

### 案 C: CI workflow からの ad-hoc 実行（補完案）

- **概要**: GitHub Actions の `workflow_dispatch` で staging Workers 上の smoke route を curl で叩き、Job summary に証跡を残す。
- **pros**:
  - 証跡が CI に永続化される
  - 手元環境差分の影響を受けない
- **cons**:
  - 案 A の route が前提のため代替ではなく **補完**
  - CI Secret として `SMOKE_ADMIN_TOKEN` を別途配置する必要があり Secret hygiene の管理面が増える
  - MVP では Phase 11 手動実行で足り、優先度は低い

### 案 D: Durable Object ベースの長寿命キャッシュ案

- **概要**: アクセストークンキャッシュを Durable Object に置き、isolate 越境でも 1h TTL を共有する。
- **pros**:
  - 苦戦箇所 #5（token TTL とキャッシュ）を構造的に解消
  - 運用時のトークン取得回数を最小化
- **cons**:
  - smoke test 1 回限りの目的に対し過剰
  - DO 課金の管理面が増える（無料枠内だが要監視）
  - UT-09 本実装で必要になった時点で別タスク化すべき

### 案 E: KV 補助キャッシュ（in-memory + KV fallback）

- **概要**: 案 A をベースに、in-memory miss 時に KV を覗く二層キャッシュ。
- **pros**:
  - isolate 越境を best-effort で吸収
- **cons**:
  - smoke route の主目的（疎通確認）に対し責務が増える
  - AC-4（2 回目で OAuth fetch 省略）は in-memory のみで満たせるため過剰

---

## 4. 評価マトリクス（11 観点 × 5 案）

| 観点 | 案 A (base) | 案 B (script) | 案 C (CI 補完) | 案 D (DO cache) | 案 E (KV cache) |
| --- | --- | --- | --- | --- | --- |
| 価値性 | PASS | MINOR（実機 Edge 検証が弱い） | PASS | MINOR（過剰） | MINOR（過剰） |
| 実現性 | PASS | MAJOR（Edge runtime 再現困難） | PASS（A 前提） | MINOR | PASS |
| 整合性（不変条件 #1/#4/#5） | PASS | PASS | PASS | PASS | PASS |
| 運用性 | PASS | MINOR（実行手順が分散） | PASS | MINOR（DO 管理コスト） | PASS |
| 認可境界（production 露出禁止） | PASS（三段ガード） | PASS（route なし） | PASS | PASS | PASS |
| Secret hygiene | PASS | PASS | MINOR（CI Secret 増） | PASS | PASS |
| 無料枠 | PASS | PASS | PASS | MINOR（DO 課金注意） | PASS |
| 苦戦箇所 #1（fetch mock 差分） | PASS | MAJOR | PASS（A 前提） | PASS | PASS |
| 苦戦箇所 #4（wrangler dev 制約） | PASS（remote モード推奨） | MAJOR | PASS | PASS | PASS |
| 苦戦箇所 #5（token TTL） | PASS（in-memory） | n/a | PASS | PASS | PASS |
| MVP スコープ整合 | PASS | MINOR | MINOR（補完） | MAJOR | MINOR |

---

## 5. 採択結論

**base case = 案 A** を採択する。

理由:
1. Workers Edge Runtime 上の実 API 疎通保証が UT-26 の真の論点であり、案 A のみがこの要件を満たす（案 B は MAJOR、案 C/D/E は補完または過剰）。
2. production 露出禁止は build-time / runtime / token の三段ガードで担保可能。
3. 案 C は将来の補完候補として Phase 12 unassigned-task-detection.md に記録。
4. 案 D / E は MVP スコープ外として Phase 12 未タスクへ送る。

---

## 6. base case のセルフレビュー（12 観点・全 PASS）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 着手前に Workers 実機での認証フローと 403 切り分けを保証 |
| 実現性 | PASS | UT-03 / UT-25 / 01c が完了済。Hono / Web Crypto / curl の既存技術で完結 |
| 整合性 | PASS | 不変条件 #1/#4/#5 を満たす |
| 運用性 | PASS | troubleshooting-runbook + 三段ガードで再現性と安全性を両立 |
| 不変条件 #1（schema 固定回避） | PASS | smoke route は値の存在 / 行数 / 任意 1 行のサンプルのみ。列順依存なし |
| 不変条件 #4（admin-managed data 分離） | PASS | 読み取り専用、書き込みなし |
| 不変条件 #5（D1 直接アクセスは apps/api に閉じる） | PASS | smoke route は `apps/api` 内、D1 アクセスはそもそも発生しない |
| 認可境界 | PASS | build-time（`if env != production` で route 登録 skip）+ runtime（env-guard）+ token（`SMOKE_ADMIN_TOKEN` Bearer）の三段 |
| Secret hygiene | PASS | SA JSON / access_token / Bearer token は log / PR / 証跡から redact、PR で `rg` 検証 |
| 無料枠 | PASS | 月数十リクエストで Workers / Sheets API いずれも free tier 内 |
| 苦戦箇所カバー（5 件） | PASS | #1 実機 e2e で解消、#2 error-mapper 4 候補 + runbook、#3 spreadsheetId 出典コメント必須化、#4 `wrangler dev --remote` 明記、#5 in-memory キャッシュ TTL `expires_in - 60s` 明記 |
| WAL 非依存 | PASS | D1 を使わないため対象外 |

---

## 7. ADR-UT26-001: dev/staging 限定 Hono route で実 API 疎通を保証する

### Context

UT-03 で実装した `apps/api/src/jobs/sheets-fetcher.ts` は fetch mock テスト済みだが、Workers Edge Runtime の Web Crypto API（RSA-SHA256）と Google OAuth 2.0 token endpoint を経由する実際の HTTPS 通信は未検証。UT-09（Sheets→D1 同期ジョブ）が本番 API にアクセスする前に、認証フロー全体を実機で疎通確認し、403 が出た際の切り分け runbook を残す必要がある。production への誤書き込みは絶対禁止。

### Decision

`apps/api/src/routes/admin/smoke-sheets.ts` に `GET /admin/smoke/sheets` を追加し、`sheets-fetcher.ts` の `getAccessToken`（reuse、modify 禁止）→ Sheets API v4 `spreadsheets.values.get`（GET 専用）の e2e 疎通を Workers 上で実行する。production 露出禁止は (1) `apps/api/src/index.ts` の env 分岐で route mount を staging 限定にする、(2) runtime で `env-guard.ts` が `env=production` を弾く、(3) `SMOKE_ADMIN_TOKEN` Bearer 認証必須、の三段で担保する。アクセストークンは in-memory `Map` で TTL `expires_in - 60s` キャッシュする（既存実装に準拠）。401/403/429 は `error-mapper.ts` で `SHEETS_AUTH_FAILED` / `SHEETS_FORBIDDEN` / `SHEETS_RATE_LIMITED` の内部 code に正規化し、403 には runbook 参照 hint を付与する。env 名は既存実装に整合させ `GOOGLE_SHEETS_SA_JSON` を採用する。

### Consequences

- **利点**: UT-26 AC-1〜AC-11 をすべて満たせる。UT-09 着手時の認証起因障害切り分けコストがゼロ化。Phase 11 の troubleshooting runbook を再利用できる。
- **欠点**: route 1 本分（約 50〜80 LOC）追加。production 露出禁止の三段ガードが破られないかを Phase 9 / 10 / 12 で繰り返し確認する責務が発生。
- **リスク緩和**: `wrangler.toml` の env diff を Phase 11 / Phase 13 で必須レビュー。`SMOKE_ADMIN_TOKEN` が production Cloudflare に存在しないことを Phase 11 で `bash scripts/cf.sh secret list --env production` 相当で検証。
- **フォローアップ**: 案 C（CI ad-hoc 実行）と案 D / E（DO / KV キャッシュ）は Phase 12 unassigned-task-detection.md に候補として記録。

### Alternatives Considered

- **案 B（standalone script）**: Edge runtime 再現性が弱く実機検証要件を満たせない（MAJOR）
- **案 C（CI 補完）**: 案 A の補完であり代替ではない。MVP では Phase 11 手動実行で足りる
- **案 D（Durable Object cache）**: スコープ過大（MAJOR / MVP スコープ整合）
- **案 E（KV 補助）**: AC-4 は in-memory のみで満たせるため不要

---

## 8. 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### 8.1 GO 条件（全て満たすこと）

- [x] 代替案 4 案以上が評価マトリクスに並んでいる（5 案）
- [x] base case（案 A）の最終判定が全観点 PASS（12 観点）
- [x] MAJOR が一つも残っていない（base case 上で）
- [x] MINOR がある場合、対応 Phase（5 / 6 / 11 / 12）が指定されている（下記 9 章）
- [x] ADR-UT26-001 の 4 セクションが埋まっている
- [x] 苦戦箇所 5 件すべてに対応設計が紐づいている（Phase 2 索引参照）
- [x] open question が 0 件、または受け皿 Phase が明記されている（下記 9 章）

### 8.2 NO-GO 条件（一つでも該当 → 差し戻し）

- 4 条件のいずれかに MAJOR が残る
- production 露出禁止が build-time / runtime / token のいずれかでしか担保されていない
- `SMOKE_ADMIN_TOKEN` の認可方式が未定義
- SA JSON の log 出力経路が設計に残存
- アクセストークンキャッシュの TTL / キーが未確定

### 8.3 判定

**GO**。Phase 4（テスト戦略）へ進む。

---

## 9. 残課題（open question）と受け皿

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | `admin-smoke-auth.ts` middleware を将来的に他の admin route と共通化するか | Phase 5 | UT-21 等の admin route が増えるタイミングで再評価 |
| 2 | KV 補助キャッシュ（案 E）を将来導入する閾値 | Phase 12 unassigned | isolate 越境キャッシュが必要になった時 |
| 3 | CI workflow_dispatch（案 C）からの ad-hoc 実行 | Phase 12 unassigned | 監査要件が出た時に追加 |
| 4 | `SHEETS_SMOKE_RANGE` のデフォルト値（A1:C5 vs A1:Z10） | Phase 11 | 実機シートの形状を見て確定 |
| 5 | アクセストークンキャッシュの multi-isolate 観測 | Phase 11 | 単一 isolate 観測で足りるか staging で確認 |

---

## next: Phase 4 へ引き渡す事項

- **採用 base case** = 案 A（dev/staging 限定 Hono route + 三段ガード + sheets-fetcher reuse + in-memory token cache）
- **8 モジュール一覧**（Phase 2 で確定）を Phase 4 のテスト対象として渡す
- **PASS/MINOR/MAJOR 判定基準** と base case 12 観点 PASS の根拠を Phase 10 GO/NO-GO の起点として再利用
- **ADR-UT26-001** を Phase 10 / Phase 12 へリンク
- **open question 5 件** を Phase 5 / 11 / 12 へ register
