# 05b follow-up: Magic Link rate limit の KV / Durable Object 昇格判定 - タスク指示書

## メタ情報

| 項目         | 内容                                                                       |
| ------------ | -------------------------------------------------------------------------- |
| タスクID     | task-05b-rate-limit-kv-verification-001                                    |
| タスク名     | Magic Link 系 rate limit の KV / Durable Object 昇格判定と検証             |
| 分類         | operations / security / observability                                      |
| 対象機能     | `apps/api` Magic Link 系 endpoint (`GET /auth/gate-state` / `POST /auth/magic-link/issue` / `POST /auth/magic-link/verify`) |
| 優先度       | 中（運用 wave で着手）                                                     |
| 見積もり規模 | 中規模                                                                     |
| ステータス   | 未実施                                                                     |
| 発見元       | 05b lessons-learned L-05B-002 / Follow-up Boundaries                       |
| 発見日       | 2026-04-29                                                                 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

05b では `GET /auth/gate-state` と `POST /auth/magic-link/issue` の rate limit 初期値を以下で実装した（L-05B-002）:

- public な `GET /auth/gate-state`: IP 60/h（email enumeration 抑止）
- `POST /auth/magic-link/issue`: email 5/h + IP 30/h
- `POST /auth/magic-link/verify`: token 単位の使い切り + IP ベース粗い制限

カウンターは MVP として Worker isolate ローカルの in-memory Map で保持しており、
04b で導入した `/me/*` rate limit と同じ「isolate 跨ぎでカウントが共有されない」問題を抱える。
lessons-learned の Follow-up Boundaries で **「rate limit の KV / Durable Object 昇格、mail monitoring、token admin 可視化は運用 wave の責務」** と明示されているが、
具体的な昇格判定基準・rotation 戦略・failover 検証は未着手のまま 05b を完了している。

### 1.2 問題点・課題

- isolate 数が増えるほど実効レート上限が上振れし、email enumeration 抑止 / Magic Link 連投抑止が staging / production で形骸化する可能性がある
- 初期値（IP 60/h, email 5/h, IP 30/h）の妥当性が production traffic で実証されていない
- KV (eventual consistency) と Durable Object (strong consistency) のどちらに昇格すべきかの判定基準が未定
- key rotation 戦略（window 切替・namespace 切替・migration）が未定義で、運用中の閾値変更が破壊的になる
- `04b-followup-002-rate-limit-kv-cross-isolate.md` (`/me/*` 用) と本タスク（Magic Link 用）の重複や共有方針が整理されていない

### 1.3 放置した場合の影響

- staging / production で email enumeration 攻撃や Magic Link 連投が initial threshold を実質突破し、MAIL_FAILED の急増・bounce レート上昇・Resend ドメイン reputation 劣化につながる
- 04b followup-002 の KV 化が先行すると、Magic Link 側だけ in-memory のまま乖離が固定化する
- production 観測なしに DO へ一足飛びで昇格させると、無料枠コスト構造を崩すリスクがある

---

## 2. 何を達成するか（What）

### 2.1 目的

Magic Link 系 endpoint の rate limit について以下を確定する:

1. 初期値（IP 60/h, email 5/h, IP 30/h）が production traffic で妥当かを観測ベースで検証する
2. KV / Durable Object のどちらに昇格すべきかを判定基準（cross-isolate 整合性 / 一貫性要件 / 無料枠コスト）に基づき決定する
3. rotation 戦略 / failover 検証 / staging↔production 挙動差分を runbook 化する

### 2.2 最終ゴール

- production traffic 観測に基づき初期値の妥当性レポートが `outputs/` または runbook に残る
- 昇格先（KV or Durable Object）が判定基準と紐づいた ADR で確定する
- rotation / failover の手順が runbook に整備され、staging で 1 回以上 dry-run 済み
- `04b-followup-002-rate-limit-kv-cross-isolate.md` との関係（共有 limiter interface / 個別 namespace）が明記され、二重実装の重複コストを最小化する

### 2.3 スコープ

#### 含むもの

- production / staging での rate limit hit 数 / 突破事象の観測（05a observability 経由）
- 初期値妥当性のレビューと閾値再設定の判断材料整理
- KV vs Durable Object の比較表（一貫性 / レイテンシ / コスト / migration コスト）
- 昇格先の選定 ADR
- limiter interface（04b followup-002 と共有可能な抽象）の Magic Link 側適用
- rotation 戦略（window epoch 切替時の重複カウント許容、namespace 切替手順）
- failover 検証（KV 障害時の fallback 挙動、in-memory への degraded mode）
- staging / production での挙動差分 smoke test

#### 含まないもの

- グローバル WAF / Cloudflare 側 rate limit ルール（インフラタスクで別管理）
- Magic Link 認証フロー本体（issue/verify/consume）の改修
- mail provider 監視（`task-05b-mail-provider-monitoring-alerting-001` で別管理）
- magic_tokens admin 可視化（`task-05b-magic-token-admin-operations-001` で別管理）
- Auth.js callback route 実装（`task-05b-authjs-callback-route-credentials-provider-001` で別管理）

### 2.4 成果物

- production traffic 観測レポート（rate limit hit 分布 / 閾値到達頻度）
- KV vs Durable Object 比較 ADR（`docs/40-adr/` 配下を想定）
- `apps/api/src/middleware/` 配下の Magic Link 用 limiter 実装差分
- rotation / failover runbook（`docs/30-workflows/.../runbooks/` 配下）
- staging dry-run ログ
- `04b-followup-002-rate-limit-kv-cross-isolate.md` との関係を明記した補足

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 05b が main にマージ済みで Magic Link 系 endpoint が production で稼働している
- 05a observability（rate limit hit 数 metric を含む）が稼働している
- UT-35 / UT-36（KV namespace 発行と binding 適用）が完了しているか、判定の前提として確認できる
- `task-05b-mail-provider-monitoring-alerting-001` の Phase 1 structured log が稼働していると、観測精度が上がる（必須ではない）

### 3.2 依存タスク

- 05b マージ済（必須）
- 05a observability foundation
- UT-32 / UT-35 / UT-36（KV foundation、判定結果次第）
- `04b-followup-002-rate-limit-kv-cross-isolate.md`（limiter interface 共有のため先行 or 並走）

### 3.3 必要な知識

- L-05B-002 の rate limit 初期値設計意図（email enumeration 対策 / Magic Link 連投抑止）
- Cloudflare Workers の isolate 仕様と KV eventual consistency
- Cloudflare Durable Objects の billing / レイテンシ特性
- `04b-followup-002` で確立した `Limiter` interface（DI 化方針）
- 不変条件 #5（D1 access boundary）と middleware の境界

### 3.4 推奨アプローチ

1. Phase 1 で production / staging の rate limit hit 観測を 2 週間以上収集し、初期値の妥当性を判定
2. Phase 2 で KV / Durable Object の比較表を作成し、Magic Link の一貫性要件（email enumeration 抑止は eventual consistency でも許容できるか）を整理
3. Phase 3 で 04b followup-002 と共有可能な `Limiter` interface を Magic Link 側に適用（DI 化）
4. Phase 4 で昇格先を実装し、staging で smoke test
5. Phase 5 で rotation / failover runbook を整備し、staging で dry-run

---

## 4. 実行手順

### Phase 構成

1. production traffic 観測と初期値妥当性レビュー
2. KV vs Durable Object 比較と昇格先 ADR
3. limiter interface の共有適用
4. 昇格先実装と staging smoke test
5. rotation / failover runbook 整備と dry-run

### Phase 1: production traffic 観測と初期値妥当性レビュー

#### 目的

L-05B-002 の初期値（IP 60/h, email 5/h, IP 30/h）が production traffic で過大 / 過小でないかを検証する。

#### 手順

1. 05a observability から rate limit hit 数 / 突破事象を 2 週間以上収集
2. ピーク時間帯 / 通常時間帯別の分布を整理
3. email enumeration 攻撃 / Magic Link 連投の sample event を抽出
4. 初期値の調整候補（緩める / 維持 / 締める）を提案

#### 完了条件

観測レポートと初期値調整提案が記録され、運用者がレビュー可能な状態。

### Phase 2: KV vs Durable Object 比較と昇格先 ADR

#### 目的

Magic Link の一貫性要件と無料枠コスト構造を踏まえ、昇格先を 1 つに確定する。

#### 手順

1. 一貫性 / レイテンシ / コスト / migration コストの比較表作成
2. Magic Link 各 endpoint の要件マッピング（`gate-state` は eventual で許容、`issue` は email 単位の strict が望ましい等）
3. 昇格先選定 ADR を起票（KV / DO / 混成 のいずれか）

#### 完了条件

ADR が `docs/40-adr/` に追加され、選定根拠と代替案の trade-off が明文化されている。

### Phase 3: limiter interface の共有適用

#### 目的

`04b-followup-002` で確立した `Limiter` 抽象を Magic Link 側にも適用し、二重実装を避ける。

#### 手順

1. `04b-followup-002` の `Limiter` interface を確認（または並走時は共同設計）
2. Magic Link 用 middleware を DI 化し、`{ incr, getTtl }` 抽象を受け取る形に変更
3. in-memory 実装は dev fallback として残す
4. 既存の rate limit テストを DI 化に追従

#### 完了条件

Magic Link middleware が `Limiter` 抽象を受け取り、in-memory / KV / DO のいずれでも差し替え可能。

### Phase 4: 昇格先実装と staging smoke test

#### 目的

ADR で確定した昇格先を実装し、staging で挙動を検証する。

#### 手順

1. 昇格先 (KV / DO) の実装を `apps/api/src/middleware/` 配下に追加
2. `apps/api/wrangler.toml` の binding を env 別に追記
3. staging で Magic Link 系 endpoint に対し連投 smoke test を実行
4. 観測 metric が想定通り incr/decr していることを 05a 経由で確認

#### 完了条件

staging で IP 60/h, email 5/h, IP 30/h（または ADR で確定した新閾値）が isolate 跨ぎで厳守される。

### Phase 5: rotation / failover runbook 整備と dry-run

#### 目的

window epoch 切替・namespace 切替・KV 障害時 fallback の手順を文書化し、運用上の盲点を解消する。

#### 手順

1. window epoch 切替時の重複カウント許容範囲を runbook に明記
2. namespace 切替手順（migration を含む）を `scripts/cf.sh` 経由で記述
3. KV / DO 障害時の degraded mode（in-memory fallback への切替条件と影響範囲）を記述
4. staging で 1 回以上 dry-run し、手順の抜けを修正
5. 月 1 回の dry-run スケジュールを設定

#### 完了条件

runbook を読んだ別オペレーターが手順だけで rotation / failover を実施できる。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] production / staging の rate limit hit 観測レポートが残っている
- [ ] 昇格先 ADR（KV / DO / 混成）が確定し、`docs/40-adr/` に置かれている
- [ ] 共有 `Limiter` interface が Magic Link 側に適用されている
- [ ] staging で連投 smoke test が isolate 跨ぎで閾値厳守を実証している
- [ ] rotation / failover runbook が整備され、staging dry-run 済み

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `apps/api` 既存テスト + 新規テスト緑
- [ ] 1 req につき KV/DO write が 1 を超えない（無料枠遵守）

### ドキュメント要件

- [ ] L-05B-002 の lessons-learned に本タスクの結論（初期値調整 / 昇格先）が追記される
- [ ] `04b-followup-002-rate-limit-kv-cross-isolate.md` との関係（共有 limiter / 個別 namespace）が明記される
- [ ] runbook が月次 dry-run 対象に組み込まれている

---

## 6. 検証方法

### テストケース

- 同一 IP で `GET /auth/gate-state` を 61 回連続 → 61 件目 429
- 同一 email で `POST /auth/magic-link/issue` を 6 回連続 → 6 件目 429
- 同一 IP で `POST /auth/magic-link/issue` を 31 回連続（異なる email）→ 31 件目 429
- 別 IP / 別 email は独立カウント
- isolate 跨ぎでカウントが共有される（staging で複数 region から同時実行）
- KV / DO 障害 mock 時に degraded mode に切り替わる

### 検証手順

```bash
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api lint
mise exec -- pnpm --filter @repo/api test

# staging deploy（実値はラッパー経由）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# staging で連投 smoke
# （curl ループスクリプトは runbook に記載）
```

---

## 7. リスクと対策

| リスク                                                                  | 影響度 | 発生確率 | 対策                                                                                       |
| ----------------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| KV eventual consistency により短期で誤判定（threshold 周辺で過剰許容）   | 中     | 中       | Magic Link 用途は eventual で許容できる範囲かを Phase 2 で評価。strict 要件は DO 採用       |
| Durable Object 採用で無料枠コスト構造が崩れる                           | 高     | 中       | Phase 2 比較表でコスト試算を必須化。混成（gate-state は KV / issue は DO）を許容枝として残す |
| 04b followup-002 と limiter interface が乖離し二重実装が固定化           | 中     | 中       | Phase 3 で interface 共有を強制。並走時は共同設計レビュー                                  |
| rotation 中の重複カウント / カウント漏れで閾値が一時的に緩む            | 中     | 中       | window epoch 切替の重複許容範囲を runbook に明記し、攻撃が継続する場合は手動で締める運用    |
| staging と production で挙動差分が出て本番障害                          | 高     | 低       | Phase 4 で staging smoke を必須化。production rollout は段階適用                            |

---

## 8. 参照情報

### 関連ドキュメント

- `.claude/skills/aiworkflow-requirements/references/lessons-learned-05b-magic-link-auth-gate-2026-04.md`（L-05B-002 / Follow-up Boundaries）
- `docs/30-workflows/unassigned-task/04b-followup-002-rate-limit-kv-cross-isolate.md`（`/me/*` 用 KV 化、limiter interface 共有元）
- `docs/30-workflows/unassigned-task/task-05b-mail-provider-monitoring-alerting-001.md`（observability 連携）
- `docs/00-getting-started-manual/specs/02-auth.md`
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`
- `apps/api/src/middleware/`（Magic Link 用 rate limit 実装箇所）

### 参考資料

- 不変条件 #5（D1 access boundary は本タスクに非該当だが middleware 境界の参考）
- Cloudflare KV TTL 仕様（最小 60 秒）
- Cloudflare Durable Objects billing
- L-05B-002: GET は IP 60/h、POST は email 5/h + IP 30/h を初期値にする

---

## 9. 実装課題と解決策（lessons-learned 対応）

> 本セクションは L-05B-002 を中心に、初期値の妥当性検証・昇格先選定・rotation 戦略の
> 実装時に再発しうる課題と事前判断を整理する。

### 9.1 対応する lesson

| Lesson ID  | 教訓要旨                                                                                                                  | 本タスクへの影響                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| L-05B-002  | public `GET /auth/gate-state` は email enumeration の入口。HTTP status 差ではなく JSON state と rate limit で制御する。GET は IP 60/h、POST は email 5/h + IP 30/h を初期値とする | 本タスクは初期値の妥当性検証と KV / DO 昇格判定を担当。閾値変更時にも JSON state による隠蔽方針を破壊しない |

### 9.2 再発する可能性

- 04b followup-002 (`/me/*` 用) と本タスク (Magic Link 用) で **異なる limiter interface を独立実装** しがち。Phase 3 で共有 interface を確定しないと、namespace 設計・rotation 戦略・failover が二重管理になる
- production traffic 観測なしに DO へ一足飛びで昇格させると、無料枠コスト構造が崩れる（DO は KV より高単価）。Phase 1 の観測を Phase 2 ADR の必須前提とする
- HTTP status 差で email enumeration を抑止したくなる誘惑が再発する。`gate-state` の response は **JSON state（`registered/unregistered/...`）で隠蔽** する設計を本タスクの閾値変更時にも維持する
- rotation 中の window epoch 切替で重複カウントが発生し、攻撃者が境界条件で 2 倍カウント分まで通過するケースが起きる。Phase 5 で許容範囲を明記する

### 9.3 事前に確認すべき設計判断

- 初期値の調整方針: 観測結果が「過大 = 攻撃が通過」なら締める、「過小 = 正規ユーザーが弾かれる」なら緩める。両方の sample event を Phase 1 で必ず収集
- 昇格先の混成許容: `gate-state` (eventual で許容) は KV、`issue` (email 単位 strict) は DO の混成構成を許容枝として ADR で評価
- limiter interface の owner: 04b followup-002 と本タスクのどちらが owner かを Phase 3 着手前に決定し、interface 変更は owner 側にのみ集約
- failover の degraded mode 範囲: KV / DO 障害時に in-memory fallback で継続するか、429 を fail-closed で返すかを Phase 5 で確定。Magic Link 系は fail-closed が望ましい（email enumeration 抑止優先）
- `04b-followup-002` との重複ではなく **Magic Link 専用視点**（email 単位の strict 要件 + email enumeration 抑止）を本タスクの主軸とすることを Phase 0 で宣言

---

## 10. 備考

### 苦戦箇所【記入必須】

> 05b 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                                                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | 05b で Magic Link 系 endpoint の rate limit を MVP として in-memory Map で実装したが、isolate 跨ぎでの厳守 / 初期値の妥当性 / 昇格先選定 / rotation 戦略が未着地のまま完了した。lessons-learned の Follow-up Boundaries で「運用 wave 責務」と切り出されたが、具体的な検証タスクが起票されていなかった                                |
| 原因     | 05b スコープに rate limit の KV / DO 昇格まで含めると、KV namespace 設定 / DO migration / production observation の 2 週間程度の収集期間が必要となり、auth core (issue/verify/consume) の検証完了が大幅に遅延する。MVP では in-memory + 初期値固定で先行し、観測ベースの判定は別 wave に回す判断を行った                          |
| 対応     | 本タスクで Phase 1 の観測 → Phase 2 の ADR → Phase 3 の interface 共有 → Phase 4 の実装 → Phase 5 の runbook という段階導入を採る。`04b-followup-002` (`/me/*` 用) と limiter interface を共有することで二重実装を回避する                                                                                                  |
| 再発防止 | 「rate limit を導入する Worker は、production observation 期間（最低 2 週間）と昇格先 ADR を後続タスクとして必ず unassigned-task に登録する」運用ルールを 05b lessons-learned Follow-up Boundaries に正本化済。`Limiter` interface 抽象を最初から DI で切る設計を新規 middleware 実装時のテンプレートに含める                              |

### レビュー指摘の原文（該当する場合）

```
05b lessons-learned Follow-up Boundaries:
- rate limit の KV / Durable Object 昇格、mail monitoring、token admin 可視化は運用 wave の責務。
05b L-05B-002:
- public な GET /auth/gate-state は UX に有効だが email enumeration の入口になる。
  HTTP status 差ではなく JSON state と rate limit で制御する。
  GET は IP 60/h、POST は email 5/h + IP 30/h を初期値にし、response は memberId を含めない。
```

### 補足事項

- 本タスクは `04b-followup-002-rate-limit-kv-cross-isolate.md` (`/me/*` 用) と **重複ではない**。
  `/me/*` は session 単位 5/60s の strict な session 制御、本タスクは Magic Link 系の email / IP 制御 + email enumeration 抑止。
  ただし `Limiter` interface は両者で共有するのが ROI が高く、Phase 3 で共同化する
- production observation 期間中は in-memory のままでよく、observation 完了後に昇格を実装する段階導入を採る
- 昇格先が DO になった場合、無料枠コストが増える可能性がある。Phase 2 ADR で運用者と費用上限を必ず合意する
- 月 1 回の dry-run スケジュールを `task-05b-mail-provider-monitoring-alerting-001` の dry-run と統合可能であれば、運用負荷を抑えられる
