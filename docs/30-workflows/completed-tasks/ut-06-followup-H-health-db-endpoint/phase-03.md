# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/api `/health/db` D1 疎通 endpoint 実装仕様化 (ut-06-followup-H-health-db-endpoint) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |
| タスク種別 | implementation / docs-only / NON_VISUAL / api_health |

## 目的

Phase 2 の設計に対して、認証 / WAF / IP allowlist 方針 4 案（A: 完全 unauth / B: WAF rule / C: IP allowlist / D: 固定パス + X-Health-Token + WAF）を比較し、観点（責務境界 / 依存タスク順序 / 価値とコスト / ロールバック設計 / 状態所有権）と 4 条件（価値性 / 実現性 / 整合性 / 運用性）に対して PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降に進むための着手可否ゲートを通す。判定結果は **PASS（with notes）** とし、notes は Phase 5 / 11 / 12 への申し送り事項として明記する。

## レビュー対象の確定

| 対象 | 出所 |
| --- | --- |
| 擬似コード（`Env.DB` 型 / `Hono<{ Bindings: Env }>` / `c.env.DB.prepare("SELECT 1").first()`） | Phase 2 §3 |
| レスポンス schema（成功 200 / 失敗 503 + `Retry-After: 30`） | Phase 2 §5 |
| state ownership 表（writer / reader に `apps/web` 不在） | Phase 2 §6 |
| 認証方針 4 案（A〜D） / base case = D | Phase 2 §7 |
| smoke 期待値テンプレ同期方針 | Phase 2 §8 |

## 実行タスク

1. 代替案 4 案を比較表に並べる（完了条件: A〜D が並ぶ）。
2. 4 条件 + 5 観点 × 案で PASS / MINOR / MAJOR を付与する（完了条件: マトリクスに空セルゼロ）。
3. base case（案 D）を選定理由付きで確定する（完了条件: 選定理由が代替案比較から導出されている）。
4. PASS / MINOR / MAJOR の判定基準を定義する（完了条件: 各レベルの基準文が記載）。
5. NO-GO 条件を定義し、UT-22 完了 / 不変条件 #5 違反 / Retry-After 欠落 / smoke drift を NO-GO として明記する（完了条件: 4 条件すべて記述）— UT-22 については重複明記 3/3。
6. open question を Phase 4 / 5 / 11 / 12 に振り分ける（完了条件: 全件に受け皿 Phase 指定）。
7. base case の最終 PASS / MINOR / MAJOR 判定を 4 条件 + 5 観点でロックする（完了条件: 全 PASS）。

## 依存タスク順序（UT-22 完了必須）— 重複明記 3/3

> **UT-22（D1 migration SQL 適用）が completed でなければ、本 Phase の着手可否ゲートは強制 NO-GO となる。**
>
> UT-22 未完了で `/health/db` を実装しても、production / staging で D1 binding が有効化されていないため runtime で `c.env.DB` が `undefined` になり 500 エラーを返す。これは Phase 1 §依存境界（1/3）/ Phase 2 §依存タスク順序（2/3）/ 本 Phase §NO-GO 条件（3/3）の 3 箇所で重複明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-02/main.md | base case 構造 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-01.md | 真の論点 / 4 条件 / AC |
| 必須 | docs/30-workflows/completed-tasks/ut-06-followup-H-health-db-endpoint.md §苦戦箇所 | 順序事故 / smoke drift / 認証要否 |
| 必須 | CLAUDE.md §重要な不変条件 #5 | apps/web からの D1 直接アクセス禁止 |
| 参考 | https://developers.cloudflare.com/waf/ | 案 B / D 評価のため |

## 代替案評価表（A/B/C/D × PASS/MINOR/MAJOR）

| 観点 | 案 A (unauth) | 案 B (WAF rule) | 案 C (IP allowlist) | 案 D (ヘッダ token + WAF, base) |
| --- | --- | --- | --- | --- |
| 価値性（AC-4 達成） | PASS | PASS | PASS | PASS |
| 実現性 | PASS | PASS | PASS | PASS |
| 整合性（不変条件 #5 / 既存運用） | MAJOR（unauth で D1 ping） | PASS | PASS | PASS |
| 運用性 | MAJOR（DoS / probing） | MINOR（WAF 設定漏れリスク） | MINOR（IP 動的時の運用） | PASS |
| 責務境界（apps/api 閉包） | PASS | PASS | PASS | PASS |
| 依存タスク順序（UT-22 必須） | PASS（3 重明記） | PASS（3 重明記） | PASS（3 重明記） | PASS（3 重明記） |
| 価値とコスト | PASS（コスト 0 だが価値も低） | PASS | PASS | PASS（コスト小・価値最大） |
| ロールバック設計 | PASS（endpoint 削除のみ） | PASS（endpoint + WAF rule 削除） | PASS（endpoint 削除のみ） | PASS（endpoint + token + WAF 解除） |
| 状態所有権 | PASS（apps/api 閉包） | PASS | MINOR（IP allowlist の管理場所が分散） | PASS |

### 採用結論

- base case = 案 D を採用。
- 理由: 5 観点 + 4 条件すべて PASS。WAF（運用制御）+ ヘッダ token（コード制御）の併用による defense in depth で「unauth で D1 ping を打たれる」リスクを実質的に排除。不変条件 #5 を侵害せず、ロールバックも 1〜2 コミット粒度で完結。
- 案 A は整合性 / 運用性 MAJOR で却下。案 B / C は単独で MINOR が残るため、両者を併用する案 D が最良。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 4 条件 + 5 観点を満たす。Phase 4 へ進める |
| MINOR | 警告レベル。Phase 5 / 11 / 12 で補足対応が必要だが、Phase 4 への移行は許可 |
| MAJOR | block。Phase 4 へ進めない。Phase 2 へ差し戻すか、open question として MVP スコープ外に明確化 |

## base case (案 D) 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-06 AC-4 ブロッカー B-2 解消、SLO 分離による監視粒度向上 |
| 実現性 | PASS | Hono Bindings ジェネリクス + Cloudflare Secrets + WAF rule はすべて既存技術 |
| 整合性 | PASS | **不変条件 #5 を侵害しない**。state ownership 表で writer / reader に `apps/web` が現れない |
| 運用性 | PASS | 503 + `Retry-After: 30` で UT-08 通知基盤の誤検知抑制、WAF + ヘッダ tokenで defense in depth |
| 責務境界 | PASS | endpoint は `apps/api` 内に完全閉包、`apps/web` 側からは fetch のみ |
| 依存タスク順序 | PASS（with notes） | UT-22 完了が必須前提。3 重明記済み |
| 価値とコスト | PASS | 編集対象は `apps/api/src/index.ts` のみ + `wrangler.toml` 確認のみ。コスト最小 |
| ロールバック設計 | PASS | endpoint 削除 + secret 廃止 + WAF rule 解除の 1〜2 コミット粒度 |
| 状態所有権 | PASS | hook / canonical 等の派生問題なし。apps/api 内に完全閉包 |

**最終判定: PASS（with notes）**

notes:
- UT-22 完了確認は Phase 5 着手前の必須ゲート（NO-GO 条件として再明示）。
- `Retry-After: 30` は仮値。Phase 11 smoke 実走と UT-08 通知基盤の閾値合意で最終確定する。
- 認証トークン `HEALTH_DB_TOKEN` の初期値生成 / rotation 手順は Phase 12 ドキュメント化。
- Phase 11 smoke 期待値テンプレで token は `${HEALTH_DB_TOKEN}` placeholder 化。

## NO-GO 条件（Phase 4 への着手可否ゲート）

### GO 条件（全て満たすこと）

- [x] 代替案 4 案以上が評価マトリクスに並んでいる
- [x] base case の最終判定が全観点 PASS（or PASS with notes）
- [x] MAJOR が一つも残っていない
- [x] MINOR がある場合、対応 Phase（5 / 11 / 12）が指定されている
- [x] open question が全件 Phase 振り分け済み

### NO-GO 条件（一つでも該当）

- **UT-22（D1 migration SQL 適用）が completed でない** ← runtime での `c.env.DB` undefined 事故の主要因（重複明記 3/3）
- **不変条件 #5 違反** ← state ownership 表で writer / reader に `apps/web` が現れた場合
- **Retry-After 欠落** ← 失敗時応答に `Retry-After` ヘッダがない設計が残っている場合（UT-08 通知基盤の暴走リスク）
- **smoke drift** ← Phase 11 期待値テンプレ同期方針が記述されていない / 実装と乖離する設計が残っている場合
- 4 条件のいずれかに MAJOR が残る
- ロールバックが 3 コミット以上を要求している
- 認証方針が決定されていない（base case が空）

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | 認証要否最終決定（案 D を最終採用するか / 案 B のみ採用に縮退するか） | Phase 5 着手前 | base case は D で確定だが、運用負荷次第で B への縮退余地を残す |
| 2 | `Retry-After` 値の合意（30 秒で良いか） | Phase 11 smoke 実走 + UT-08 通知基盤閾値合意 | Phase 2 仮値 30 秒 |
| 3 | endpoint ヘッダ token文字列の決定（具体的な path / token 命名） | Phase 5 実装着手前 | 1Password で生成、Cloudflare Secrets に注入 |
| 4 | 認証トークン rotation 手順 | Phase 12 ドキュメント更新 | 運用 SOP として記述 |
| 5 | FU-I（/health）応答 prefix との整合最終確認 | Phase 12 | `{ ok: ... }` 統一 |

## 4 条件評価の最終ロック

| 条件 | 判定 | ロック根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-06 AC-4 ブロッカー B-2 解消（Phase 1 / 2 / 3 一貫） |
| 実現性 | PASS | 既存技術範囲（Hono + Cloudflare Workers + D1 + WAF + 1Password） |
| 整合性 | PASS | **不変条件 #5 侵害なし**（apps/web 不在の state ownership 表） |
| 運用性 | PASS | 503 + Retry-After + WAF + ヘッダ tokenの defense in depth |

→ **全 PASS で Phase 4 への移行を許可**。

## Phase 4 以降への引き渡し条件

- base case = 案 D（固定パス + X-Health-Token + WAF / IP allowlist 併用）
- AC-1〜AC-9 を Phase 4 テスト戦略の対象とする
- 擬似コード / レスポンス schema を Phase 5 実装ランブックの起点とする
- open question 5 件を該当 Phase で resolve する

## 実行手順

### ステップ 1: 代替案の列挙

- 案 A〜D を `outputs/phase-03/main.md` に記述。

### ステップ 2: 評価マトリクスの作成

- 9 観点（4 条件 + 5 観点）× 4 案で空セルなく埋める。

### ステップ 3: base case 最終判定

- 全 PASS（with notes）であることを確認。MINOR の対応 Phase を明示。

### ステップ 4: NO-GO 条件の明示

- UT-22 完了 / 不変条件 #5 違反 / Retry-After 欠落 / smoke drift を NO-GO として記述。GO の場合のみ artifacts.json の Phase 3 を `completed` にする。

### ステップ 5: open question の Phase 振り分け

- 5 件すべてに受け皿 Phase（4 / 5 / 11 / 12）を割り当てる。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | base case を入力にテスト戦略を組む |
| Phase 5 | open question #1 / #3（認証要否最終 / ヘッダ token文字列）を実装で確定 |
| Phase 8 | 案 D 採用根拠をセキュリティ章へ |
| Phase 10 | base case の PASS 判定を GO/NO-GO の根拠に再利用 |
| Phase 11 | open question #2（Retry-After 値）を smoke 実走で確定 |
| Phase 12 | open question #4 / #5（rotation 手順 / FU-I 整合）をドキュメント化 |

## 多角的チェック観点

- 責務境界: 案 D で endpoint が `apps/api` に閉じ、`apps/web` が D1 を直接叩かない設計が破綻していないか。
- 依存タスク順序: UT-22 完了前提が 3 重明記されたか（本 Phase が 3/3）。
- 価値とコスト: 案 D が最小コストで最大の価値（AC-4 達成 + defense in depth）を達成しているか。
- ロールバック設計: endpoint 削除 + secret 廃止 + WAF rule 解除の 1〜2 コミット粒度で逆操作可能か。
- 状態所有権: 5 state（`Env.DB` / D1 binding / endpoint ハンドラ / レスポンス schema / `HEALTH_DB_TOKEN`）の writer / reader が代替案で混線していないか。
- 不変条件 #5: 案 A〜D いずれにおいても `apps/web` から D1 を直接叩く形が混入していないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 案の列挙 | 3 | completed | 案 A〜D |
| 2 | 評価マトリクスの作成 | 3 | completed | 9 観点 × 4 案 |
| 3 | base case 最終 PASS（with notes）判定 | 3 | completed | notes 4 件 |
| 4 | PASS/MINOR/MAJOR 基準の定義 | 3 | completed | 3 レベル |
| 5 | NO-GO 条件 4 件の明記（UT-22 含む） | 3 | completed | 重複明記 3/3 |
| 6 | open question の Phase 振り分け | 3 | completed | 5 件 |
| 7 | 4 条件評価の最終ロック | 3 | completed | 全 PASS |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案比較・評価マトリクス・PASS/MINOR/MAJOR・NO-GO 条件・open question |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件

- [x] 代替案が 4 案比較されている
- [x] 9 観点 × 4 案のマトリクスに空セルが無い
- [x] base case (案 D) の最終判定が PASS（with notes）
- [x] PASS / MINOR / MAJOR の判定基準が明文化されている
- [x] NO-GO 条件で UT-22 完了 / 不変条件 #5 違反 / Retry-After 欠落 / smoke drift が明記されている（UT-22 重複明記 3/3）
- [x] open question 5 件すべてに受け皿 Phase が割り当てられている
- [x] 4 条件評価が全 PASS で最終ロックされている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `completed`
- 成果物が `outputs/phase-03/main.md` に配置済み
- 4 条件 + 5 観点すべてが PASS（with notes）
- MAJOR ゼロ
- MINOR がある場合、対応 Phase が記述
- artifacts.json の `phases[2].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用 base case = 案 D（固定パス + X-Health-Token + WAF / IP allowlist 併用）
  - AC-1〜AC-9 を Phase 4 テスト戦略の左軸に渡す
  - notes 4 件（UT-22 完了確認 / Retry-After 仮値 / 認証トークン管理 / smoke placeholder）
  - open question 5 件を該当 Phase へ register
- ブロック条件:
  - GO 条件のいずれかが未充足
  - UT-22 が completed でない
  - 不変条件 #5 違反 / Retry-After 欠落 / smoke drift のいずれかが残る
  - MAJOR が残っている
  - base case が代替案比較から導出されていない
