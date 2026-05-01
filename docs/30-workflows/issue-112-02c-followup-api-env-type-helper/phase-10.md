# Phase 10: ロールアウト / 後続連携

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-112-02c-followup-api-env-type-helper |
| Phase 番号 | 10 / 13 |
| Phase 名称 | ロールアウト / 後続連携 |
| Wave | 2 (follow-up) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 9 (セキュリティ / boundary 検証) |
| 次 Phase | 11 (evidence 取得 NON_VISUAL) |
| 状態 | pending |

## 目的

本タスク（`apps/api/src/env.ts` 正本化 + `ctx()` refactor）の成果を、後続 7 タスク（03a / 03b / 04b / 04c / 05a / 05b / 09b）が誤りなく利用するための **引き継ぎ仕様** と **binding 追加時の標準フロー** を確定する。NON_VISUAL / small スケールのため feature flag は導入せず、一括 PR でのロールアウトとし、既存 CI gate（Phase 8）と boundary lint negative test（Phase 9）を rollout 安全弁として活用する。

## 1. 後続タスクへの引き継ぎ仕様

### 1.1 03a forms-schema-sync / 03b forms-response-sync（Cron handler）

- **使用形**: Cron handler の `scheduled` シグネチャは `(event, env: Env, ctx)`。
  - 例（テキスト仕様）: `export default { async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) { ... } }`
- **import**: `import type { Env } from "../env";`（apps/api 内部 path）
- **vars 参照**: `env.FORM_ID` / `env.GOOGLE_FORM_ID` / `env.SHEET_ID` / `env.SHEETS_SPREADSHEET_ID` / `env.SYNC_*` を使用。重複 vars（FORM_ID と GOOGLE_FORM_ID 等）の統一は本タスク scope 外（03a 側で再評価）。
- **D1 利用**: `import { ctx } from "./repository/_shared/db";` → `const dbCtx = ctx({ DB: env.DB });`（`Pick<Env, "DB">` 互換）

### 1.2 04b me-and-profile-api / 04c admin-backoffice-api（Hono router）

- **使用形**: `new Hono<{ Bindings: Env }>()`
  - 例（テキスト仕様）: `const app = new Hono<{ Bindings: Env }>(); app.get("/me", (c) => { const dbCtx = ctx({ DB: c.env.DB }); ... });`
- **import**: `import type { Env } from "../env";`
- **`c.env` 経由**: Hono context の `c.env` に `Env` 型が伝播するため、各 binding は型安全に参照可能。

### 1.3 05a authjs-google-oauth / 05b magic-link-and-session-cookie（将来 binding 追加）

- 予約欄 binding（`SESSIONS: KVNamespace`、`OAUTH_CLIENT_SECRET: string`、`MAGIC_LINK_HMAC_KEY: string`）を **本タスクの予約欄コメントを置き換える形** で `Env` interface に正式追加する。
- 追加時は 4 ステップ標準フロー（後述 §2）に従う。
- 予約欄コメントの陳腐化リスクは Phase 3 リスク表で言及済 → 05a / 05b 実装時に予約欄を最新化する責務を後続タスクに委譲。

### 1.4 09b production-deploy

- **deploy 前 gate**: `pnpm typecheck` / `node scripts/lint-boundaries.mjs` の双方が pass していることを確認してから `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` を実行。
- `wrangler.toml` の binding 追加が `Env` に反映されていない場合、typecheck で利用箇所が落ちることで間接検知される（Phase 3 リスク表の対策 (b)）。

## 2. binding 追加時の標準フロー（4 ステップ）

新規 binding（KV / R2 / Secret / D1 等）を追加する際の正規手順:

| step | 操作 | 成功確認 |
| --- | --- | --- |
| 1 | `apps/api/wrangler.toml` に binding を追記（`[[kv_namespaces]]` / `[[r2_buckets]]` / `[vars]` 等） | wrangler 設定として valid（`bash scripts/cf.sh deploy --dry-run` 等で検証可能、ただし本タスクの scope 外） |
| 2 | `apps/api/src/env.ts` の `Env` interface に対応 field を追加 | `pnpm typecheck` exit 0 |
| 3 | `env.ts` 該当 field 直前のコメントに `// wrangler.toml [<section>] <key>` を記述（同期トレーサビリティ確保） | コードレビューで対応関係が一目で確認可能 |
| 4 | `node scripts/lint-boundaries.mjs` を実行し、apps/web 側に新 binding 名 / 型が漏れていないことを確認 | exit 0 |

> 4 ステップを満たさない PR は merge しない運用とし、Phase 12 の implementation-guide に明文化する。

## 3. 段階的ロールアウト戦略

| 観点 | 採否 | 理由 |
| --- | --- | --- |
| feature flag 導入 | **不要** | 既存 02c repository の暗黙契約を refactor するのみで、ランタイム挙動は不変。flag による段階切替の対象が無い |
| canary deploy | 不要 | 本 PR は型のみの変更で deploy 影響無し（09b の通常 deploy フローに乗せる） |
| 一括 PR | **採用** | Phase 8 の 5 gate と Phase 9 の boundary negative test が gate として機能。後方互換 `D1Db` alias により 02c 既存呼び出し側を破壊しない |
| rollback | 通常 git revert | binding 型変更は revert で元に戻せる。データ移行は伴わない |

### 3.1 ロールバック条件

- G-1〜G-3（Phase 8）が CI で連続 fail → `git revert` で本 PR を取り消し、Phase 2 設計に差し戻し。
- 後続タスク（03a 等）が `Env` 参照で型エラーを出した場合 → 該当タスク側で `Pick<Env, "DB">` 等の部分型に絞って利用範囲を縮小、もしくは `Env` への field 追加 PR を緊急発行。

## 4. 通信計画

| タイミング | 媒体 | 内容 |
| --- | --- | --- |
| Phase 12 close-out 時 | `outputs/phase-12/implementation-guide.md` | 後続 7 タスクへの「`Env` 参照点」「4 ステップ標準フロー」を記載 |
| Phase 12 close-out 時 | `outputs/phase-12/system-spec-update-summary.md` | 02c implementation-guide.md の `_shared/db.ts` 節更新差分、CLAUDE.md の「主要ディレクトリ」表に `apps/api/src/env.ts` 行追加（必要時） |
| Phase 13 PR 作成時 | PR description | `Refs #112`、本 PR が後続 7 タスクの blocker 解除であること、binding 追加 4 ステップフロー要約 |
| 後続タスク開始時 | 各タスクの phase-01 / phase-02 | `apps/api/src/env.ts` を refs に必須追加、`import type { Env }` を設計に組み込む |

## 5. 後続タスク chain への影響度

| タスク | 影響度 | 必要対応 |
| --- | --- | --- |
| 03a forms-schema-sync | 中 | Cron handler 形 `(event, env: Env, ctx)` 採用 |
| 03b forms-response-sync | 中 | 同上 |
| 04b me-and-profile-api | 高 | `Hono<{ Bindings: Env }>` を初期から採用 |
| 04c admin-backoffice-api | 高 | 同上 |
| 05a authjs-google-oauth-and-admin-gate | 高 | `Env` に `SESSIONS` / `OAUTH_CLIENT_SECRET` 追加 PR を発行（4 ステップフロー） |
| 05b magic-link-and-session-cookie | 高 | `Env` に `MAGIC_LINK_HMAC_KEY` 追加 PR を発行 |
| 09b production-deploy | 低 | deploy 前 gate に typecheck / boundary lint pass 確認を組み込み |

## 6. Phase 連携

| 連携先 | 引き渡す観測 |
| --- | --- |
| Phase 11 | rollout 安全弁としての CI gate / boundary lint evidence |
| Phase 12 | implementation-guide.md, system-spec-update-summary.md に rollout 仕様反映 |
| Phase 13 | PR description テンプレ（Refs #112、blocker 解除サマリ） |

## 7. 多角的チェック観点

- **不変条件 #5**: rollout 後も boundary lint negative test が常時 gate として機能（CI 組込みは現状なし、Phase 11 の evidence でカバー、将来 CI gate 化検討は scope out）。
- **後方互換**: 一括 PR 採用は `D1Db` alias 維持により 02c fixture 互換が担保されているからこそ成立。互換性が崩れた場合は段階 PR（型 alias のみ → ctx() refactor → 02c migration）に切替。
- **依存解放**: 後続 7 タスクの blocker 解除を明示することで、本 merge 後の Wave 3 着手判定を容易にする。
- **secret 経路**: rollout で 1Password / op 経路に変更が及ばないことを Phase 9 O-1 で確認済。

## 実行タスク

- [ ] 後続 7 タスクへの使用形 / import 経路を一覧化
- [ ] binding 追加 4 ステップフローを定式化
- [ ] feature flag 不要 / 一括 PR 戦略の根拠を明記
- [ ] Phase 12 通信計画 3 項目（implementation-guide / system-spec-update / PR description）を確定
- [ ] rollback 条件と recovery を記述

## 完了条件

- [ ] 後続タスクへの引き継ぎ仕様が 7 件揃っている
- [ ] binding 追加 4 ステップフローが手順化されている
- [ ] ロールアウト戦略（一括 PR / feature flag 不要）の根拠が明示されている
- [ ] 通信計画が Phase 12 / 13 と整合している
- [ ] `outputs/phase-10/main.md` が作成されている

## 成果物

- `outputs/phase-10/main.md`
