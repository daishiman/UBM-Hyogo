# Phase 3 成果物 — 設計レビュー

## 1. 目的

Phase 2 の設計（擬似コード / レスポンス schema / state ownership / 認証 4 案）に対して 4 条件 + 5 観点 × 4 案で PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降に進むための着手可否ゲートを通す。判定結果は **PASS（with notes）** とし、notes は Phase 5 / 11 / 12 への申し送り事項として明記する。

## 2. レビュー対象の確定

| 対象 | 出所 |
| --- | --- |
| 擬似コード（`Env.DB` / `Hono<{ Bindings: Env }>` / `c.env.DB.prepare("SELECT 1").first()`） | Phase 2 §3 |
| レスポンス schema（成功 200 / 失敗 503 + `Retry-After: 30`） | Phase 2 §5 |
| state ownership 表（writer / reader に `apps/web` 不在） | Phase 2 §6 |
| 認証方針 4 案（A〜D）/ base case = D | Phase 2 §7 |
| smoke 期待値テンプレ同期方針 | Phase 2 §8 |

## 3. 代替案評価表（A/B/C/D × PASS/MINOR/MAJOR）

| 観点 | 案 A (unauth) | 案 B (WAF rule) | 案 C (IP allowlist) | 案 D (ヘッダ token + WAF, **base**) |
| --- | --- | --- | --- | --- |
| 価値性（AC-4 達成） | PASS | PASS | PASS | PASS |
| 実現性 | PASS | PASS | PASS | PASS |
| 整合性（不変条件 #5 / 既存運用） | **MAJOR**（unauth で D1 ping） | PASS | PASS | PASS |
| 運用性 | **MAJOR**（DoS / probing） | MINOR（WAF 設定漏れリスク） | MINOR（IP 動的時の運用） | PASS |
| 責務境界（apps/api 閉包） | PASS | PASS | PASS | PASS |
| 依存タスク順序（UT-22 必須） | PASS（3 重明記） | PASS（3 重明記） | PASS（3 重明記） | PASS（3 重明記） |
| 価値とコスト | PASS（コスト 0 だが価値も低） | PASS | PASS | PASS（コスト小・価値最大） |
| ロールバック設計 | PASS（endpoint 削除のみ） | PASS（endpoint + WAF rule 削除） | PASS（endpoint 削除のみ） | PASS（endpoint + token + WAF 解除） |
| 状態所有権 | PASS（apps/api 閉包） | PASS | MINOR（IP allowlist の管理場所が分散） | PASS |

## 4. base case (案 D) PASS 判定の根拠

### 4.1 なぜ案 D か

- 案 A は **整合性 MAJOR / 運用性 MAJOR** で却下。unauth で D1 ping を打たれるリスクは、本番運用上許容できない。
- 案 B は WAF dashboard で可視化できるが、設定漏れで一時的に open になるリスク（運用性 MINOR）。
- 案 C は IP allowlist の管理場所が apps/api コード内 or env var に分散し、CI / smoke で IP が動的に変わると運用しづらい（運用性 / 状態所有権 MINOR）。
- 案 D は **WAF（運用層）+ ヘッダ token（コード層）の併用** で defense in depth を成立させ、各層の単独 MINOR を相互補完する。

### 4.2 不変条件 #5 への適合

- 案 D の state ownership 表で writer / reader 列に `apps/web` が一切現れない
- D1 binding は `apps/api/wrangler.toml` の `[[d1_databases]]` で `apps/api` のみに付与
- `Env.DB: D1Database` 型は `apps/api/src/index.ts` 内にしか存在しない
- `apps/web` は `/health/db` を fetch する側にのみ位置し、D1 binding を持たない

→ **不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）を侵害しない**。

### 4.3 503 + Retry-After による UT-08 通知基盤誤検知の抑制

- 失敗時 `HTTP 503` + `Retry-After: 30` で「一時的失敗 / 30 秒後に再 probe 推奨」を伝達
- UT-08 通知基盤側で「30 秒待ってから再 probe」を 2〜3 回繰り返してもなお失敗の場合のみ alert を上げる閾値合意を要請（open question #2）
- これにより D1 の瞬間的なゆらぎで通知基盤が暴走することを防ぐ

### 4.4 ロールバック粒度

- endpoint 削除（1 コミット）
- `HEALTH_DB_TOKEN` secret 廃止（1 コミット）
- WAF rule 解除（運用作業、コミット不要）

→ 最大 2 コミット粒度で逆操作可能。

## 5. base case 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-06 AC-4 ブロッカー B-2 解消、SLO 分離による監視粒度向上 |
| 実現性 | PASS | Hono Bindings ジェネリクス + Cloudflare Secrets + WAF rule はすべて既存技術 |
| 整合性 | PASS | **不変条件 #5 を侵害しない**。state ownership 表で writer / reader に `apps/web` が現れない |
| 運用性 | PASS | 503 + `Retry-After: 30` で UT-08 通知基盤の誤検知抑制、WAF + ヘッダ tokenで defense in depth |
| 責務境界 | PASS | endpoint は `apps/api` 内に完全閉包、`apps/web` 側からは fetch のみ |
| 依存タスク順序 | PASS（with notes） | UT-22 完了が必須前提。3 重明記済み |
| 価値とコスト | PASS | 編集対象は `apps/api/src/index.ts` のみ + `wrangler.toml` 確認のみ |
| ロールバック設計 | PASS | endpoint 削除 + secret 廃止 + WAF rule 解除の 1〜2 コミット粒度 |
| 状態所有権 | PASS | hook / canonical 等の派生問題なし。apps/api 内に完全閉包 |

**最終判定: PASS（with notes）**

## 6. NO-GO 条件

### 6.1 NO-GO 条件（一つでも該当）

1. **UT-22（D1 migration SQL 適用）が completed でない** ← 重複明記 3/3
   - 影響: production / staging で D1 binding が runtime で `undefined` になり 500 エラー連発
   - 対策: UT-22 完了確認を Phase 5 着手前の必須ゲートとする
2. **不変条件 #5 違反**
   - 影響: `apps/web` から D1 を直接叩く設計が混入し、責務境界が破綻
   - 対策: state ownership 表で writer / reader 列に `apps/web` が現れていないことを Phase 3 で再確認
3. **Retry-After 欠落**
   - 影響: 失敗時応答に `Retry-After` ヘッダがないと UT-08 通知基盤が一発で alert を上げる暴走リスク
   - 対策: レスポンス schema 定義で `Retry-After` を mandatory として固定
4. **smoke drift**
   - 影響: Phase 11 期待値テンプレと実装が乖離して S-03 / S-07 が再度 RED 化
   - 対策: Phase 2 §smoke 期待値テンプレ同期方針 を Phase 11 で必ず実走

### 6.2 GO 条件（全て満たすこと）

- 代替案 4 案以上が評価マトリクスに並んでいる
- base case の最終判定が全観点 PASS（or PASS with notes）
- MAJOR が一つも残っていない
- MINOR がある場合、対応 Phase（5 / 11 / 12）が指定されている
- open question が全件 Phase 振り分け済み

## 7. open question

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | 認証要否最終決定（案 D を最終採用するか / 案 B のみ採用に縮退するか） | Phase 5 着手前 | base case は D で確定だが、運用負荷次第で B への縮退余地を残す |
| 2 | `Retry-After` 値の合意（30 秒で良いか） | Phase 11 smoke 実走 + UT-08 通知基盤閾値合意 | Phase 2 仮値 30 秒 |
| 3 | endpoint ヘッダ token文字列の決定（具体的な path / token 命名） | Phase 5 実装着手前 | 1Password で生成、Cloudflare Secrets に注入 |
| 4 | 認証トークン rotation 手順 | Phase 12 ドキュメント更新 | 運用 SOP として記述 |
| 5 | FU-I（/health）応答 prefix との整合最終確認 | Phase 12 | `{ ok: ... }` 統一 |

## 8. 4 条件評価の最終ロック

| 条件 | 判定 | ロック根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-06 AC-4 ブロッカー B-2 解消（Phase 1 / 2 / 3 一貫） |
| 実現性 | PASS | 既存技術範囲（Hono + Cloudflare Workers + D1 + WAF + 1Password） |
| 整合性 | PASS | **不変条件 #5 侵害なし**（apps/web 不在の state ownership 表） |
| 運用性 | PASS | 503 + Retry-After + WAF + ヘッダ tokenの defense in depth |

→ **全 PASS で Phase 4 への移行を許可**。

## 9. Phase 4 以降への引き渡し

- 採用 base case = 案 D（固定パス + X-Health-Token + WAF / IP allowlist 併用）
- AC-1〜AC-9 を Phase 4 テスト戦略の対象とする
- 擬似コード / レスポンス schema を Phase 5 実装ランブックの起点とする
- open question 5 件を該当 Phase（4 / 5 / 11 / 12）で resolve する
- notes 4 件:
  1. UT-22 完了確認は Phase 5 着手前の必須ゲート
  2. `Retry-After: 30` は仮値、Phase 11 smoke 実走で最終確定
  3. 認証トークン `HEALTH_DB_TOKEN` の初期値生成 / rotation 手順は Phase 12 ドキュメント化
  4. Phase 11 smoke 期待値テンプレで token は `${HEALTH_DB_TOKEN}` placeholder 化
