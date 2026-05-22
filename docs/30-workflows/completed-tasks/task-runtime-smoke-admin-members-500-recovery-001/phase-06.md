# Phase 6: 実装手順

[実装区分: 実装仕様書]

## 0. 前提
Phase 2 の Step A/B/C を**先に実行して根因を確定**してから本 Phase に進む。確定根因に応じて §2 のサブセットだけを実装する。

## 1. 共通変更（必ず実装）

### 1.1 `apps/api/src/routes/admin/members.ts`（Phase 2 RCA 後）
- Phase 4 §1 の通り try/catch + structured log + 統一 error shape を導入
- `normalizePublishState` / `normalizeConsent` ヘルパを同ファイル内に追加し view 構築で使用
- legacy `published` / `private` を `public` / `hidden` に正規化し、`filter=published|hidden` SQL でも legacy 値を含める

### 1.2 logger
既存 `apps/api/src/lib/logger.ts` の `logError(payload)` を再利用する。`apps/api/src/lib/log.ts` は新設しない。

### 1.3 `scripts/smoke/runtime-attendance-provider.sh`（先行実装済み）
- Phase 2 §3 の diff を適用済み。non-200 response body は `scripts/smoke/redact.sh` 通過後に `runtime-smoke.log` へ 2000 byte 上限で保存する
- `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` の T-4-5 で、marker 200 後の `admin-list` route 500 body が OUT_LOG に redaction 済みで残ることを検証する

## 2. 仮説別変更（Step A/B/C 結果で 1 件以上選択）

### 2a. zod 仮説採用
- `normalizePublishState` / `normalizeConsent` の縮退対象になる値を tail/test で確定
- 既存 view 構築の `as` キャストを縮退関数に置換

### 2b. SQL drift 仮説採用
```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
# pending があれば
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
```
- 不足 migration がある場合は `apps/api/migrations/NNNN_<slug>.sql` を新規追加
- ユーザー承認後に apply

### 2c. middleware 仮説採用
- `apps/api/src/middleware/repository-providers.ts` で `c.env?.DB` 不在を 503 で返す guard を最上段に追加

### 2d. binding 仮説採用
- `apps/api/wrangler.toml` の `[[env.staging.d1_databases]]` を staging 実 D1 ID と一致させる
- 投入後に `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` をユーザー承認後に実行

## 3. テスト実装
- Phase 5 §1a を `members.contract.spec.ts` に追記
- 既存 `describe` 構造を踏襲。新規 `describe("enum normalization")` ブロック

## 4. コミット粒度
1. `fix(admin-members): wrap handler in try/catch and stabilize error shape`
2. `fix(admin-members): normalize publish_state and consent enums`
3. `chore(smoke): persist response body on non-200 in runtime smoke`
4. （根因別）`fix(admin-members): <根因 fix>` / `chore(d1): apply staging migrations`

## 5. Phase 6 DoD
- 確定根因に対応する全コードが書き込まれ、`git diff` で確認可能
- 全コミットがレビュー可能粒度に分割
