# Phase 7 成果物 — 受入条件マトリクス

## 1. AC × T × E トレース表

| AC | 要旨 | 紐付く T | 紐付く E | 検証手段 | 本 PR での状態 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | `Env.DB: D1Database` | T1 | - | `pnpm typecheck` | ✅ Green |
| AC-2 | SELECT 1 実行仕様 | T2 | E-8 | Vitest spy `prepare("SELECT 1")` | ✅ Green |
| AC-3 | 成功 200 + JSON shape | T3 | - | Vitest body 完全一致 | ✅ Green (unit) / ⏳ staging smoke 待ち (S-03) |
| AC-4 | 失敗 503 + Retry-After + error schema | T4 | E-1, E-2, E-3, E-4, E-8 | Vitest header + body 検証 | ✅ Green (unit) / ⏳ staging fault injection 待ち (S-07) |
| AC-5 | wrangler D1 binding | T1 | - | `apps/api/wrangler.toml` grep + typecheck | ✅ 既存設定で確認済み |
| AC-6 | 案 D 認証（token + WAF） | T5 | E-5, E-6, E-7 | Vitest 401 検証 + Phase 11 WAF 経路確認 | ✅ Green (unit 401 path) / ⏳ WAF rule 適用待ち |
| AC-7 | smoke 期待値 drift 防止 | T3, T4 | - | Phase 11 smoke ログとハンドラ実装の同期 | ✅ Phase 11 outputs 更新済み |
| AC-8 | metadata 一致 | - | - | `artifacts.json.metadata` 検証 | ✅ Phase 12 documentation-changelog で確認 |
| AC-9 | 不変条件 #5 侵害なし | T2, T3 | - | `apps/web` を import していないテストハーネス + `apps/api` 内閉包 | ✅ コードレビューで確認 |

## 2. 観点別チェック

### 2.1 仕様レベル（Phase 1〜3）

- [x] 真の論点（不変条件 #5 + 503/Retry-After 運用境界）が Phase 1 で明文化
- [x] base case = 案 D が Phase 2 で 4 案比較の上採択
- [x] Phase 3 NO-GO 条件で UT-22 完了前提が再明記

### 2.2 実装レベル（Phase 5〜6）

- [x] `apps/api/src/index.ts` 編集差分が `apps/api` 内閉包
- [x] `apps/web/wrangler.toml` を変更していない
- [x] error 文字列に message ではなく name のみを返す設計
- [x] HEALTH_DB_TOKEN 未設定時 fail-closed

### 2.3 テストレベル（Phase 4 / 自動化分）

- [x] Vitest 8 ケースで T1/T2/T3/T4/T5(b)(c) 自動化
- [x] D1 mock は `apps/api/src/health-db.test.ts` 内で stub 化（apps/web 不在）

### 2.4 運用レベル（Phase 11 待ち）

- [ ] `wrangler secret put HEALTH_DB_TOKEN` 実行（ユーザー操作 → operator-runbook）
- [ ] Cloudflare WAF rule 設定（`/health/db` への rate limit + IP allowlist）
- [ ] staging smoke S-03 / S-07 実走で wire format 確認
- [ ] production smoke S-03 で wire format 確認

## 3. 完了判定

| ゲート | 状態 |
| --- | --- |
| 仕様 AC（AC-1〜AC-9）固定 | ✅ |
| 自動化テスト（T1/T2/T3 unit/T4 unit/T5 unit）Green | ✅ |
| 運用テスト（S-03 / S-07 / WAF）Green | ⏳ ユーザー操作待ち（Phase 11） |
| ドキュメント整備 | ✅（Phase 12 で運用ランブック生成） |

> 本 Phase 完了 = Phase 11 ゲートの実走を残して 7/9 AC が確定状態。残り 2/9（AC-7 部分 / 運用面 AC-6）は Phase 11 secret 投入後に Green 化。
