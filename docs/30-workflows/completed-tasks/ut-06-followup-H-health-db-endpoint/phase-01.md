# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/api `/health/db` D1 疎通 endpoint 実装仕様化 (ut-06-followup-H-health-db-endpoint) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| Wave | 1（UT-06 本番実行ブロッカー） |
| 実行種別 | serial（UT-22 D1 migration 完了後の単独 PR） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| タスク種別 | implementation / workflow_mode: docs-only / visualEvidence: NON_VISUAL / scope: api_health |

## 目的

UT-06 AC-4「API 経由 D1 SELECT smoke」を実行可能にするため、`apps/api` に `GET /health/db` を追加するための Phase 1〜13 のタスク仕様書を整備する。本 Phase 1 では「実装方針の細部」ではなく、(1) 不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）を侵害しない運用境界の確立、(2) 503 + `Retry-After` で UT-08 通知基盤の誤検知を防ぐ運用境界、(3) UT-22 D1 migration 完了を必須前提とする依存順序の 3 重明記、を仕様書として固定する。実コード適用は Phase 13 ユーザー承認後の別 PR に委ねる。

## 真の論点 (true issue)

- 「`/health/db` の実装方針」ではなく、**「不変条件 #5 を侵害せず apps/api 側に D1 binding 型と health endpoint を閉じ込めること、および 503 + Retry-After で UT-08 通知基盤の誤検知を防ぐ運用境界の確立」**が本タスクの本質。
- 副次的論点として、(1) `Hono<{ Bindings: Env }>` ジェネリクスによる D1 binding 型契約の境界、(2) 失敗時 HTTP status の運用整合（503 + `Retry-After` で外部監視 (UT-08) を暴走させない）、(3) 認証 / WAF / IP allowlist 方針の意思決定（unauth 公開の D1 ping を許容しない）、(4) Phase 11 smoke S-03 / S-07 の期待値テンプレと実装の drift 防止。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流（必須） | UT-22 D1 migration SQL 適用 | production / staging で D1 binding が有効化されており、`SELECT 1` が runtime で成功できる状態 | UT-22 完了を Phase 1 / 2 / 3 の 3 箇所で必須前提として明記 |
| 上流 | UT-06 Phase 12 UNASSIGNED-H / 実行前ブロッカー B-2 | 型契約・実行ブロッカーの確立元 | 本ワークフローの起源として参照固定 |
| 関連 | UT-06-FU-I（/health 期待値同期） | レスポンス形式 / smoke 期待値の整合 | `/health/db` 側の schema を FU-I が参照可能な状態に保つ |
| 下流 | UT-06 Phase 11 smoke S-03 / S-07 | AC-4 実行の前提となる本 endpoint | 期待値テンプレ同期方針を Phase 11 へ |
| 下流 | UT-08 通知基盤 | 503 + `Retry-After` を解釈する監視側設計 | 503 を「DB ping 失敗 = 一時的」と解釈する閾値合意を要請 |

## 価値とコスト

- 価値: UT-06 AC-4 の実行ブロッカー B-2 を解消し、本番デプロイ実行を再開可能にする。`/health/db` が定常的に 200 を返すことで、外部監視・運用 SRE は D1 binding の生死を一次情報として確認できるようになる。
- コスト: `apps/api/src/index.ts` への endpoint 1 本追加 + `Env.DB: D1Database` 型定義 + `wrangler.toml` の binding 確認のみ。実装コストは小だが、UT-22 D1 migration 完了を先行させる順序制約が必須で、これを誤ると runtime で `c.env.DB` が undefined になり 500 エラーが連発する。
- 機会コスト: `/health` に DB ping を統合する案と比較し、SLO 分離（疎通確認は GET 200/503、アプリ稼働は GET 200 のみ）が可能になり監視粒度が向上する。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-06 AC-4 ブロッカー B-2 が解消し、本番デプロイ実行が再開可能。SLO 分離による監視粒度向上 |
| 実現性 | PASS | Hono Bindings ジェネリクス / `c.env.DB.prepare("SELECT 1").first()` はすべて既存 Cloudflare Workers + D1 + Hono の範囲。新規依存ゼロ |
| 整合性 | PASS | **不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）を侵害しない**。本 endpoint は `apps/api` 内部に閉じ、`apps/web` から D1 を直接叩く形には変質しない |
| 運用性 | PASS | 失敗時 503 + `Retry-After` で UT-08 通知基盤の誤検知を抑制。WAF / IP allowlist による外部公開制御の意思決定を Phase 1 で完了 |

## 既存命名規則の確認

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| endpoint パス | `apps/api/src/index.ts` の既存 `/health` | `/health` 直下に `db` をネストする `/health/db` 形式 |
| `Env` 型 | `apps/api/src/index.ts` の `Hono<{ Bindings: Env }>` | `Env.DB: D1Database` として binding 名 `DB` を踏襲 |
| binding 名 | `apps/api/wrangler.toml` の `[[d1_databases]]` | `binding = "DB"`（既存 wrangler 規約） |
| レスポンス schema | `/health` 既存応答形式 | `{ ok: boolean, ... }` の prefix を踏襲 |
| 失敗 status | UT-08 通知基盤の閾値 | `503` + `Retry-After: <seconds>`（一時的失敗を意図） |
| smoke 期待値 | `outputs/phase-11/smoke-test-result.md` | S-03 / S-07 のテンプレが本実装と drift しない |

## 実行タスク

1. 原典スペック（`docs/30-workflows/completed-tasks/ut-06-followup-H-health-db-endpoint.md` 79 行）を写経し、AC-1〜AC-9 として `index.md` と一致させる（完了条件: AC-1〜AC-9 が `index.md` §受入条件と同一）。
2. タスク種別を `implementation` / `workflow_mode: docs-only` / `visualEvidence: NON_VISUAL` / `scope: api_health` で固定する（完了条件: `artifacts.json.metadata` と一致）。
3. UT-22 D1 migration 完了を必須前提として 3 箇所（Phase 1 §依存境界 / Phase 2 §依存タスク順序 / Phase 3 §NO-GO 条件）に明記する設計を Phase 1 で予約する（完了条件: Phase 2 / 3 仕様にも同記述が含まれる）。
4. 真の論点を「不変条件 #5 を侵害しない apps/api 内閉包 + 503/Retry-After 運用境界」に再定義する（完了条件: 本仕様 §真の論点 にその記述）。
5. 4 条件評価を全 PASS で確定する（完了条件: 各観点に PASS + 根拠）。
6. 本ワークフローのスコープを「タスク仕様書整備に閉じ、実 endpoint 実装は別 PR で行う」と固定する（完了条件: 本仕様 §スコープ にその旨）。
7. 苦戦箇所（D1 binding 型 / 失敗時 HTTP status / 認証要否 / smoke drift）を Phase 1 §多角的チェックに取り込む（完了条件: 4 件すべて記載）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-06-followup-H-health-db-endpoint.md | 原典 79 行スペック |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md | UNASSIGNED-H 検出根拠 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-12/implementation-guide.md | 型契約 / 実行ブロッカー B-2 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-11/smoke-test-result.md | smoke S-03 / S-07 期待値テンプレ |
| 必須 | apps/api/src/index.ts | 実装対象（Phase 5 以降で参照） |
| 必須 | apps/api/wrangler.toml | D1 binding 設定 |
| 必須 | .claude/skills/task-specification-creator/references/phase-templates.md | Phase 1〜13 共通セクション順 |
| 必須 | CLAUDE.md §重要な不変条件 #5 | apps/web からの D1 直接アクセス禁止 |
| 参考 | https://developers.cloudflare.com/d1/ | D1 binding API |
| 参考 | https://hono.dev/getting-started/cloudflare-workers#bindings | Hono Bindings ジェネリクス |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（`phase-NN.md`）作成
- Phase 1〜3 成果物本体（`outputs/phase-0N/main.md`）の作成
- AC-1〜AC-9 の Phase 1 固定
- レスポンス schema（成功 200 / 失敗 503 + Retry-After）の仕様レベル定義
- 認証 / WAF / IP allowlist 方針の意思決定論点の明文化
- UT-22 D1 migration 完了を必須前提とする依存順序の 3 重明記
- Phase 11 smoke S-03 / S-07 期待値テンプレ同期方針
- 苦戦箇所（D1 binding 型 / 失敗時 HTTP status / 認証要否 / smoke drift）の取り込み

### 含まない

- 実 `apps/api/src/index.ts` への endpoint 実装（Phase 13 ユーザー承認後の別 PR）
- D1 schema 変更（UT-22 別タスク）
- `/health` 既存 endpoint の改修（UT-06-FU-I で扱う）
- D1 migration 実行（UT-22 別タスク）
- Cloudflare WAF / IP allowlist の実適用（運用タスク）
- 外部監視（UT-08 通知基盤）側の閾値変更

## 実行手順

### ステップ 1: 原典スペックの写経

- `completed-tasks/ut-06-followup-H-health-db-endpoint.md` 79 行を本仕様書の構造に分解し、`index.md` の AC-1〜AC-9 を確定する。

### ステップ 2: 真の論点と依存順序の固定

- 真の論点を「不変条件 #5 を侵害しない apps/api 内閉包 + 503/Retry-After 運用境界」と再定義する。
- UT-22 D1 migration 完了が必須である旨を Phase 1 / 2 / 3 で重複明記する設計を確定する。

### ステップ 3: 4 条件評価のロック

- 4 条件すべてを PASS で確定する。MAJOR があれば Phase 2 へ進めない。

### ステップ 4: タスク種別 / scope / visualEvidence の固定

- `implementation` / `workflow_mode: docs-only` / `NON_VISUAL` / `api_health` を Phase 1 で固定し、`artifacts.json.metadata` と整合させる。

### ステップ 5: 苦戦箇所の取り込み

- 原典 §苦戦箇所 4 件（D1 binding 型 / 失敗時 HTTP status / 認証要否 / smoke drift）を多角的チェック観点に集約する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点・AC-1〜AC-9・依存順序・4 条件評価を設計入力に渡す |
| Phase 3 | 4 条件評価を base case の PASS 判定根拠に再利用 |
| Phase 4 | AC-1〜AC-9 をテスト戦略のトレース対象に渡す |
| Phase 7 | AC matrix の左軸として AC-1〜AC-9 を使用 |
| Phase 11 | smoke S-03 / S-07 の実走基準として AC-3 / AC-4 / AC-7 を渡す |

## 多角的チェック観点

- **不変条件 #5 違反**: `apps/web` から D1 を直接叩く形に変質していないか。`/health/db` は `apps/api` 内に完全に閉じているか。
- **D1 binding 型契約**: `Hono<{ Bindings: Env }>` のジェネリクスで `c.env.DB` が型安全に参照できるか。runtime で `undefined` にならないか。
- **失敗時 HTTP status の運用整合**: 503 を返した瞬間に UT-08 通知基盤が暴走しないか。`Retry-After` 値の合意が Phase 2 / 3 で決まるか。
- **認証 bypass**: unauth `/health/db` で D1 ping が外部から打てる状態を許容するか。WAF / IP allowlist / ヘッダ tokenのいずれで制御するか。
- **smoke drift**: Phase 11 期待値テンプレと実装が乖離して S-03 / S-07 が再度 RED 化しないか。
- **レスポンス schema 整合性**: UT-06-FU-I（/health）の応答形式と prefix が揃っているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 原典スペックの写経と AC-1〜AC-9 確定 | 1 | completed | 原典 79 行 |
| 2 | タスク種別 / scope / visualEvidence の固定 | 1 | completed | artifacts.json と一致 |
| 3 | 4 条件評価 PASS 確定 | 1 | completed | 全件 PASS |
| 4 | UT-22 完了前提の 3 重明記設計 | 1〜3 | completed | Phase 2 / 3 で再記述 |
| 5 | 真の論点の再定義 | 1 | completed | 不変条件 #5 + 503/Retry-After |
| 6 | スコープ「仕様書整備に閉じる」固定 | 1 | completed | 含む / 含まない明記 |
| 7 | 苦戦箇所 4 件の取り込み | 1 | completed | 多角的チェック |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（背景 / 課題 / AC / 4 条件 / 苦戦箇所 / 命名規則） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 真の論点が「不変条件 #5 侵害なし + 503/Retry-After 運用境界」として再定義されている
- [x] 4 条件評価が全 PASS で確定している
- [x] AC-1〜AC-9 が `index.md` と完全一致している
- [x] タスク種別 `implementation` / `workflow_mode: docs-only` / `visualEvidence: NON_VISUAL` / `scope: api_health` が固定されている
- [x] スコープ「本ワークフローはタスク仕様書整備に閉じる」が明記されている
- [x] UT-22 D1 migration 完了前提が Phase 1 §依存境界 に明記されている（3 重明記の 1/3）
- [x] 不変条件 #5 を侵害しない範囲で要件が定義されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `completed`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所（D1 binding 型 / 失敗時 HTTP status / 認証要否 / smoke drift）が AC または多角的チェックに対応
- artifacts.json の `phases[0].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 不変条件 #5 侵害なし + 503/Retry-After 運用境界
  - AC-1〜AC-9
  - 4 条件評価（全 PASS）の根拠
  - スコープ境界（仕様書整備に閉じる）
  - UT-22 完了前提（Phase 2 §依存タスク順序 で 2 重目明記を要請）
- ブロック条件:
  - UT-22 D1 migration 仕様書の存在が確認できない
  - 4 条件のいずれかに MAJOR が残る
  - AC-1〜AC-9 が index.md と乖離
  - 不変条件 #5 を侵害する形（apps/web から D1 直接アクセス）の要件が混入
