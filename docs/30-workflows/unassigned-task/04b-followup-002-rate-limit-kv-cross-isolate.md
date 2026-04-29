# /me/* rate limit の KV / D1 ベース cross-isolate 化 - タスク指示書

## メタ情報

```yaml
issue_number: 218
```

## メタ情報

| 項目         | 内容                                                       |
| ------------ | ---------------------------------------------------------- |
| タスクID     | 04b-followup-002-rate-limit-kv-cross-isolate               |
| タスク名     | /me/* rate limit の KV / D1 ベース cross-isolate 化        |
| 分類         | 改善                                                       |
| 対象機能     | `POST /me/visibility-request` / `POST /me/delete-request` |
| 優先度       | 中                                                         |
| 見積もり規模 | 小規模                                                     |
| ステータス   | 未実施                                                     |
| 発見元       | 04b Phase 12                                               |
| 発見日       | 2026-04-29                                                 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04b で `apps/api/src/middleware/rate-limit-self-request.ts` を実装し、`/me/visibility-request`
と `/me/delete-request` に session 単位 5 req/60s の上限を設けた。MVP スコープを優先し、
カウンターは Worker isolate ローカルの in-memory Map で保持している。

### 1.2 問題点・課題

- Cloudflare Workers は同一 region 内でも複数 isolate に分散するため、in-memory Map では
  isolate 間でカウントが共有されない
- isolate 数が増えるほど実効レート上限が上振れし、admin 側の queue 増加やフォーム再送スパムの
  抑止効果が弱まる
- 開発環境（miniflare）では isolate が単一なため問題が顕在化せず、staging / production で
  初めて差分が出る

### 1.3 放置した場合の影響

- admin_member_notes / audit_log への書き込みが想定値の数倍まで膨らむ可能性
- KV/D1 の write 課金が無料枠を超えるリスク（観測対象は 05a で導入済み）
- 攻撃耐性が中（5/60s）と表記しているのに実態が isolate 倍に緩む

---

## 2. 何を達成するか（What）

### 2.1 目的

`/me/visibility-request` / `/me/delete-request` の rate limit を Cloudflare KV または D1 に
カウンターを保持する形に切り替え、isolate を跨いでも 5 req/60s が厳守される状態にする。

### 2.2 最終ゴール

- KV namespace（既存 SESSION_KV を流用または rate-limit 専用 namespace を追加）に
  `rl:self-request:<memberId>:<windowEpoch60s>` でカウンタが保存される
- in-memory fallback は dev 限定とし、production / staging では KV 経路を必須化
- Retry-After 仕様は既存と同等（`min(残秒数, 60)`）

### 2.3 スコープ

#### 含むもの

- `rate-limit-self-request.ts` の DI 化（`limiter: { incr, getTtl }` を受け取る）
- KV ベース limiter 実装
- production / staging で KV 経路が選択されることを保証する DI 結線
- 単体テスト（KV mock）と統合テスト

#### 含まないもの

- グローバル WAF / Cloudflare 側 rate limit ルール（インフラタスクで別管理）
- /me 以外のエンドポイントへの一般化

### 2.4 成果物

- `apps/api/src/middleware/rate-limit-self-request.ts` の DI 化差分
- `apps/api/src/middleware/rate-limit-kv.ts`（新規）
- `apps/api/wrangler.toml` の KV binding 追記
- 単体テスト / 統合テスト差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- UT-35 / UT-36（KV namespace 発行と binding 適用）が完了している
- 04b マージ済み

### 3.2 依存タスク

- UT-32 / UT-35 / UT-36（KV foundation）
- 04b 実装

### 3.3 必要な知識

- Cloudflare KV の TTL（最小 60 秒）
- Workers の isolate 仕様
- 既存 `rate-limit-self-request.ts` の Retry-After 計算

### 3.4 推奨アプローチ

1 分窓固定（fixed window）を採用し、key を `rl:self-request:<memberId>:<floor(now/60)>` に
する。`KV.get` → `parseInt` → `KV.put(value+1, expirationTtl=120)`。完全なアトミック性は
KV では得られないが、5/60s の用途には許容範囲。厳密な原子性が必要なら Durable Object に
移行するが、本タスクではスコープ外。

---

## 4. 実行手順

### Phase構成

1. limiter interface 設計
2. KV 実装と DI 結線
3. dev / production の resolver 切替
4. テストと観測

### Phase 1: limiter interface 設計

#### 目的

`Limiter` 抽象を切り、in-memory / KV を差し替え可能にする。

#### 完了条件

`Limiter` interface と既存 in-memory 実装が同 interface を実装

### Phase 2: KV 実装と DI 結線

#### 目的

KV ベース limiter を実装し、`createMeRoute` から DI で注入する。

#### 完了条件

`apps/api/src/index.ts` で env.ENVIRONMENT に応じて切替

### Phase 3: dev / production の resolver 切替

#### 目的

production / staging で KV 経路を強制し、dev は in-memory fallback を許容する。

#### 完了条件

`ENVIRONMENT in ('production','staging')` のとき in-memory が選択されない unit test を追加

### Phase 4: テストと観測

#### 目的

isolate またぎ挙動を統合テストで保証し、05a observability に metric を追加する。

#### 完了条件

KV mock を使ったテストで 5 req 後 429 / Retry-After が一定

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] KV ベース limiter が production / staging で選択される
- [ ] in-memory limiter は dev 限定
- [ ] 5 req/60s が isolate 跨ぎでも厳守される

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `apps/api` 既存テスト + 新規テスト緑
- [ ] KV write 量が 1 req につき 1 write を超えない

### ドキュメント要件

- [ ] `docs/00-getting-started-manual/specs/07-edit-delete.md` の rate limit 節更新
- [ ] runbook（`outputs/phase-05/runbook.md` の継承）に KV ベース運用手順を追記

---

## 6. 検証方法

### テストケース

- 同一 memberId で 6 連続 → 6 件目 429 + Retry-After
- 別 memberId は独立カウント
- 60 秒経過後はカウントがリセットされる（KV TTL 経由）

### 検証手順

```bash
mise exec -- pnpm --filter @repo/api test
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
# staging で curl ループして 429 を確認
```

---

## 7. リスクと対策

| リスク                                          | 影響度 | 発生確率 | 対策                                                                       |
| ----------------------------------------------- | ------ | -------- | -------------------------------------------------------------------------- |
| KV の eventual consistency により短期で誤判定   | 中     | 中       | 5/60s の粒度では許容。厳密性が要件化したら Durable Object に移行           |
| KV namespace ID 漏洩                            | 中     | 低       | UT-34 の pre-commit guard で防止済み                                       |
| 1 req につき複数 write が発生し無料枠を圧迫    | 中     | 中       | get → 条件付き put の単純実装で 1 write/req を遵守                         |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/04b-parallel-member-self-service-api-endpoints/outputs/phase-12/unassigned-task-detection.md`
- `apps/api/src/middleware/rate-limit-self-request.ts`
- `docs/00-getting-started-manual/specs/07-edit-delete.md`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | rate-limit を導入したかったが、KV 接続まで一気に組むと 04b のスコープが膨らみすぎる状況になった                                     |
| 原因     | UT-35 / UT-36（KV binding 確定）が並走中で、04b 着手時点で KV namespace ID が production には存在しなかった                          |
| 対応     | MVP として in-memory fallback で実装し、isolate 跨ぎ厳守は本タスクで補強する分離方針を選択                                          |
| 再発防止 | rate-limit / session 系の middleware は最初から `Limiter` のような DI interface を切り、infra 整備順序に依存せず実装可能にする      |

### 補足事項

UT-32 / UT-35 / UT-36 が未完なら、本タスクはそれら完了を待ってから着手する。
05a の observability に「rate-limit hit 数」を計測する metric を一緒に組み込むと、
admin 側のスパム検知に直結し ROI が高い。
