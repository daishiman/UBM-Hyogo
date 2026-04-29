# Phase 3 成果物: 代替案比較（alternatives.md）

> **ステータス**: completed
> 本ファイルを代替案比較の正本とする。仕様本体は `../../phase-03.md` を参照。
> 代替案 **4 件**（A / B / C / D）の詳細比較を記述する。

## 1. 案 A: push（Apps Script webhook）

### 1.1 概要

Sheets onEdit / time-driven trigger で Apps Script が `apps/api` のエンドポイントへ POST する方式。

### 1.2 メリット

- 即時性が高い（編集直後にトリガー）
- Sheets 内で onEdit / time-driven trigger を完結でき、変更検知ロジックを Workers 側で書かなくて済む
- Workers の scheduled handler 実装が不要

### 1.3 デメリット

- Apps Script ↔ Workers の認証境界が増える（HMAC / shared secret / OIDC のいずれかが必要）
- Workers CPU 30ms バーストと Sheets API 応答 200ms〜1s が衝突しやすく、複数同時編集で詰まる
- onEdit トリガーは編集頻度に比例して発火するため、Sheets API quota（500 req/100s）の予測が困難
- 冪等性確保が難しい（同一編集の再送 / 順序逆転 / Apps Script 失敗時の再試行ポリシーが Workers 側と二重管理）
- Apps Script の SLA / 実行制限（6 分 / 日次クォータ）が Cloudflare 側と独立で運用境界が増える

### 1.4 判定

**MAJOR（不採択）**

### 1.5 不採択理由

- Apps Script を経由した認証境界の拡張は不変条件 #5 の方向性に反する
- Workers CPU 30ms バーストと Sheets API 応答 200ms〜1s の衝突
- Apps Script の trigger に依存すると CI / dev / prod の境界が曖昧化

---

## 2. 案 B: pull（Workers Cron Triggers）**（base case）**

### 2.1 概要

Cloudflare Workers の Cron Triggers で scheduled handler が Sheets API を pull し、D1 に UPSERT する方式。

### 2.2 メリット

- 無料枠完結（Cloudflare Workers Cron Triggers + D1 + Sheets API v4）
- Workers 起点で実装責務が `apps/api` に閉じ、不変条件 #5 と整合
- バックフィル設計が単純（`processed_offset` から再開する単一関数で実現）
- Sheets API 呼出頻度を Workers 側で制御でき、quota（500 req/100s）が予測可能
- `sync_log` + `idempotency_key` + active lock で冪等性 / 二重実行防止が単純実装で達成可
- Cron 間隔を 6h → 1h → 5min と段階調整でき、運用要件の変化に追従可能

### 2.3 デメリット

- 即時性が分単位（最短 5 分粒度）であり、リアルタイム要件には不向き
- Cron handler のローカルテストに `wrangler dev --test-scheduled` が必要で、通常の HTTP リクエスト系より検証経路が増える
- 「変更がない時間帯」も定期 fetch が走るため、空 fetch のコストがわずかに発生（quota 内で無視可能）

### 2.4 判定

**PASS**

### 2.5 採択理由

- 無料枠で完結（Workers 100k req/day / D1 50k writes/day）
- 不変条件 #5（D1 アクセスは apps/api に閉じる）に整合
- バックフィル / 二重実行防止 / 冪等性確保すべて単純な実装で達成可
- UT-02 で確定した SQLITE_BUSY retry/backoff 方針と整合
- Cron 間隔は staging で 6h → 1h → 5min と段階調整可能

---

## 3. 案 C: webhook（Drive API push notifications）

### 3.1 概要

Google Drive API の `changes.watch` を使い、Sheets ファイル変更時に Workers の HTTPS endpoint へ通知が来る方式。

### 3.2 メリット

- 即時性が高い（Sheets ファイル変更時に通知）
- 変更がない時間帯は通知が来ないため、空 fetch の発生がない

### 3.3 デメリット

- 実装コスト過大（watch チャネル登録 / 期限管理 / 再登録ジョブ / Cloudflare 側の公開 endpoint と認証層）
- Drive API watch は file-level の変更通知であり、行レベル diff は別途 Sheets API で取得が必要（結局 pull が裏で発生）
- channel の有効期限（最大 7 日）ごとに再登録ジョブが必要で、それ自体が定期実行（=Cron）を要する
- Sheets API v4 には行変更を直接通知する API がないため、Drive API 経由の通知粒度は粗い
- Cloudflare Workers 側に常時受け口（公開 endpoint）と Google からの通知の認証検証層が必要
- Google 側の SLA / 通知遅延が公式に保証されていない箇所がある

### 3.4 判定

**MAJOR（不採択）**

### 3.5 不採択理由

- Drive API watch は file-level change 通知であり、行レベル diff は別途 Sheets API で取得必要
- channel 永続化のための定期更新ジョブが結局必要（pull が裏で発生）
- MVP のスコープに対して実装コストが過大

---

## 4. 案 D: hybrid（webhook + cron fallback）

### 4.1 概要

Drive API webhook を主、Workers Cron を補助 / 障害時 fallback として併用する方式。

### 4.2 メリット

- 即時性（webhook 経路）と障害耐性（cron fallback）を両立
- webhook が落ちても cron で漏れなく追従可能
- 将来的に SLA 要件が出た場合に最小改修で対応可

### 4.3 デメリット

- 2 経路の保守コストが二重に発生（webhook / cron 双方の監視・障害対応）
- MVP 段階では即時性要件がなく、過剰投資
- 2 経路の重複排除（同一行の二重 UPSERT 抑制）に追加の冪等性整合ロジックが必要
- `sync_log.idempotency_key` を webhook 起動分と cron 起動分で衝突させない設計が必要
- 障害復旧経路（どちらが正で再実行すべきか）の判断ロジックが複雑化

### 4.4 判定

**MINOR（将来オプション）**

### 4.5 将来オプションとして残置する理由

- base case B が安定運用された後、即時性 SLA 要件が出た時点で hybrid 化を検討
- TECH-M-01 として Phase 12 unassigned-task-detection に記録

---

## 5. 比較サマリー表

| 観点 | A push | B pull (base) | C webhook | D hybrid |
| --- | --- | --- | --- | --- |
| 即時性 | 高 | 中 | 高 | 高 |
| 実装コスト | 中 | 低 | 高 | 高 |
| Workers CPU 適合 | 低 | 高 | 中 | 中 |
| Sheets quota 適合 | 低 | 高 | 中 | 中 |
| 冪等性確保 | 中 | 高 | 中 | 中 |
| 無料枠適合 | 中 | 高 | 不明 | 中 |
| 障害復旧単純さ | 低 | 高 | 低 | 中 |
| MVP 適合 | 中 | **PASS** | 低 | 低 |
| **総合判定** | **MAJOR** | **PASS** | **MAJOR** | **MINOR** |

## 6. 結論

**B（pull / Workers Cron Triggers）を base case として採択**。D（hybrid）は将来オプションとして TECH-M-01 で追跡。A / C は却下。
