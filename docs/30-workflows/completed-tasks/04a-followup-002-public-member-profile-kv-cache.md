# /public/members/:id の KV キャッシュ導入 - タスク指示書

## メタ情報

```yaml
issue_number: 221
```

| 項目         | 内容                                                         |
| ------------ | ------------------------------------------------------------ |
| タスクID     | 04a-followup-002-public-member-profile-kv-cache              |
| タスク名     | /public/members/:id の KV キャッシュ導入                     |
| 分類         | 改善（パフォーマンス）                                       |
| 対象機能     | 公開プロフィール endpoint の応答最適化                       |
| 優先度       | 低                                                           |
| 見積もり規模 | 小規模                                                       |
| ステータス   | 未実施                                                       |
| 発見元       | 04a Phase 12 unassigned-task-detection (U-2)                 |
| 発見日       | 2026-04-29                                                   |
| 着手条件     | 公開 directory traffic が 3,000 req/day を超えた時点         |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`/public/members/:memberId` は `Cache-Control: no-store` で D1 を都度叩く設計になっている。MVP 期は traffic が小さく D1 で十分捌けるため、04a スコープでは KV キャッシュを意図的に **入れない** 判断をした（過剰最適化を避けるため）。

### 1.2 問題点・課題

- traffic が増えると D1 read が member 数 × 詳細閲覧頻度に比例して増える
- 公開プロフィールは非ログイン経路かつ admin-managed data 反映の即時性は不要（数分の stale を許容できる）

### 1.3 放置した場合の影響

- traffic 急増時に D1 read 制限 / latency p95 悪化
- Cloudflare Workers の CPU 時間 / D1 query budget の消費が前倒しで発生

---

## 2. 何を達成するか（What）

### 2.1 目的

`/public/members/:memberId` の response を Cloudflare KV にキャッシュし、D1 read を削減する。

### 2.2 完了状態

- KV namespace が `apps/api` に bind されている（既存 namespace 流用 or 新規）
- `/public/members/:memberId` が KV → D1 → KV write の順で動作する
- TTL 設定が決定され（推奨: 5 分）、admin 側の更新で stale が許容範囲内
- leak 防御 6 層は KV から返す経路でも維持される

### 2.3 スコープ

#### 含むもの

- KV binding の追加（必要なら namespace 新規作成）
- cache key 設計（`public:member:{memberId}:v1`）
- KV から返す経路でも visibility filter / forbidden keys delete / zod strict が走る実装
- TTL と stampede 制御（短命 negative cache 含む）

#### 含まないもの

- `/public/stats` / `/public/members` (list) のキャッシュ（別検討）
- 管理側からの能動的な KV invalidation（必要になれば別タスク）

### 2.4 成果物

- `apps/api/src/_shared/kv-cache.ts`（or 既存 helper への追記）
- `routes/public/member-profile.ts` の cache 経路追加
- contract test での cache hit / miss 検証
- `wrangler.toml` 更新（KV binding）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 04a-followup-001 (miniflare contract suite) が完了していると望ましい（cache 経路の test を追加するため）
- 公開 traffic monitoring が `5a` 系の observability で見えている
- KV namespace の月次無料枠を理解している

### 3.2 実行手順

1. traffic 計測値を再確認し、3,000 req/day を超えていることを根拠ファイルに記載
2. KV namespace を `wrangler.toml` に追加
3. cache key と TTL を決定（5 分推奨）
4. cache hit 時にも `keepPublicFields` / forbidden keys delete / zod strict を通す実装
5. 404 (member 非公開 / 未存在) は短命 negative cache（30 秒）にして stampede を防ぐ
6. contract test に cache hit / miss / negative cache のケースを追加

### 3.3 受入条件 (AC)

- AC-1: 同一 memberId の連続 fetch で 2 回目以降 D1 read が発生しない
- AC-2: cache hit 経路でも `responseEmail` / `rulesConsent` / `adminNotes` が response に含まれない
- AC-3: TTL 経過後は再度 D1 を叩く
- AC-4: 404 が negative cache で 30 秒間保持される
- AC-5: KV 障害時 (`KV.get throws`) は D1 fallback で 200 を返す（fail-open ではなく fail-soft）

---

## 4. 苦戦箇所 / 学んだこと（04a で得た知見）

### 4.1 「いつ最適化するか」の判断軸

04a では「traffic >3k/day」を着手条件として明示した。閾値が無いと「念のため cache を入れる」過剰最適化が起こりがちで、cache 整合性 bug の温床になる。閾値を spec に固定する運用が有効。

### 4.2 KV 経路でも leak 防御を通す

KV キャッシュは「D1 から取った値をそのまま保存」しがちで、KV 経路で visibility filter が抜ける事故が起こりやすい。**cache key の v1 と filter の v1 を紐付ける** か、KV 保存前に最終 view-model 形状で固める運用が必要。

### 4.3 admin 側との整合性

公開プロフィールは admin が visibility / status を変更した時点で stale になる。MVP では「最大 5 分遅延」を運用合意できるが、合意が取れない場合は KV 化を見送る判断も妥当。

---

## 5. 関連リソース

- `apps/api/src/routes/public/member-profile.ts`
- `apps/api/src/_shared/visibility-filter.ts`
- `doc/00-getting-started-manual/specs/08-free-database.md` - 無料構成枠
- 04a Phase 12 unassigned-task-detection.md U-2
