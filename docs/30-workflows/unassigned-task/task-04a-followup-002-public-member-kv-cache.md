## メタ情報

| 項目         | 内容                                              |
| ------------ | ------------------------------------------------- |
| タスクID     | task-04a-followup-002-public-member-kv-cache |
| タスク名     | `/public/members/:memberId` の KV cache 化 |
| 分類         | パフォーマンス最適化 |
| 対象機能     | 公開プロフィール endpoint |
| 優先度       | 低（trigger 条件待ち） |
| 見積もり規模 | 小規模 |
| ステータス   | 未実施 |
| 発見元       | 04a Phase 12 |
| 発見日       | 2026-04-29 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04a 実装時点では `/public/members/:memberId` は毎回 D1 を叩いて public プロフィールを構築している。Cache-Control は `no-store` だが、これは「クライアント側でキャッシュしない」だけで、Workers 側の D1 read コストは発生する。

### 1.2 問題点・課題

- traffic 増（>3k/day）到達時、D1 read 単価で無料枠を圧迫する可能性がある。
- 過剰最適化を避けるため 04a では実装せず、閾値到達時に着手する判断とした（`outputs/phase-12/unassigned-task-detection.md` U-2）。

### 1.3 放置した場合の影響

- traffic 急増時に D1 read 5,000,000 / day の無料枠を消費する。
- レスポンスタイム増。

---

## 2. 何を達成するか（What）

### 2.1 目的

`/public/members/:memberId` を Cloudflare Workers KV でキャッシュし、D1 read を抑制する。

### 2.2 スコープ

- KV namespace bind（既存 `SESSION_KV` ではなく公開専用 namespace を新設するか、prefix で分離）
- TTL は短め（60〜300s）+ stale-while-revalidate 風のフォールバック
- 公開フィルタ条件（publishState / publicConsent / is_deleted）変更時の cache invalidation 戦略

### 2.3 含まないもの

- レスポンス schema の変更
- visibility filter / FORBIDDEN_KEYS 運用の変更（不変条件は維持する）

---

## 3. どのように実行するか（How）

### 3.1 trigger 条件

- 公開プロフィール endpoint の traffic が `>3,000 req/day` を継続的に超えたとき
- または D1 read コストが無料枠の 50% に到達したとき

### 3.2 推奨アプローチ

KV cache key は `public:member:<memberId>:v<schemaVersion>` 形式とし、schema_versions 更新で cache を世代分離する。

---

## 4. 完了条件チェックリスト

- [ ] KV bind が `apps/api/wrangler.toml` の env 別に設定されている
- [ ] cache hit / miss が WAE で観測可能
- [ ] 不変条件 #1（schema 固定しすぎない）に違反しない
- [ ] leak リグレッション test が cache 経路でも green

---

## 5. 参照情報

- `docs/30-workflows/completed-tasks/04a-parallel-public-directory-api-endpoints/outputs/phase-12/unassigned-task-detection.md`（U-2）
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-kv-session-cache-2026-04.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
