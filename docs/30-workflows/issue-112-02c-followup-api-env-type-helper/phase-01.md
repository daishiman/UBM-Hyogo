# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-112-02c-followup-api-env-type-helper |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 2 (follow-up) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

`apps/api` Worker の env 型契約を **正本 (`apps/api/src/env.ts`) に集約** するための要件を AC-1〜7 として確定し、後続タスク（03a / 03b / 04b / 04c / 05a / 05b / 09b）が `Hono<{ Bindings: Env }>` および `Pick<Env, "DB">` を **型ドリフト無し** で参照できる状態に必要な観測対象（不変条件 #5 / #1）を固定する。

## 真の論点 (true issue)

- **論点 1**: `wrangler.toml` の binding（文字列）と TS 型 `Env` の同期手段。本タスクは **手動 `Env` interface + コメントによる対応表** を採用し、`wrangler types` 自動生成導入は scope out（将来検討）。理由: 自動生成は CI / 開発手順に追加 friction を生むため、small スケールの本タスクでは手動 + Phase 3 でのコメント整合チェックで足りる。
- **論点 2**: `_shared/db.ts` の `ctx()` 後方互換。現行 `ctx(env: { DB: D1Db })` を `ctx(env: Pick<Env, "DB">)` へ refactor する際、02c 既存 unit test を破壊しない契約をどう保証するか。本タスクは **`D1Db` を `D1Database` 互換 alias として維持** し、シグネチャは構造的部分型で互換とする。
- **論点 3**: `Env` のスコープ（共通 binding のみか、secrets / 将来 binding も含めるか）。本タスクは **wrangler.toml に明示済の binding のみ** を `Env` に持たせ、KV / R2 / Magic Link HMAC key / OAuth secret は **コメントで予約欄を示すのみ**（追加実装は 05a / 05b 個別タスク責務）。
- **論点 4**: `apps/web` boundary lint の十分性。`scripts/lint-boundaries.mjs` が既に `apps/api/**` を web 側禁止トークンに含むかを Phase 2 で棚卸しし、含まれない場合は本タスクで `apps/api/src/env` を明示追加する。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | 02c-d1-repository-foundation | `_shared/db.ts` 現行 `ctx()` 実装 | `Pick<Env, "DB">` ベースの新 `ctx()` シグネチャ |
| 上流参照 | apps/api/wrangler.toml | binding 一覧の正本 | `Env` interface との対応表（コメント） |
| 上流参照 | scripts/lint-boundaries.mjs | 禁止トークン定義 | `apps/api/src/env` を含む確認結果 |
| 後続 | 03a / 03b | Cron handler 用 `Env` 参照点 | `import type { Env } from "../env"` 経路 |
| 後続 | 04b / 04c | `Hono<{ Bindings: Env }>` の正本 | router 型契約 |
| 後続 | 05a / 05b | session / OAuth / KV binding 拡張時の追従点 | `Env` 拡張 PR の review point |
| 後続 | 09b production-deploy | wrangler binding と TS 型の同期確認 gate | deploy 前 typecheck の参照 |

## 価値とコスト

- **初回価値**: 各タスクで env 型を独自に書く重複を排除し、binding 追加時の改修ポイントを `apps/api/src/env.ts` 1 ファイルに集約する。02c の `ctx()` 暗黙契約を型として明示化し、テストでの `as any` キャスト発生を抑止する。
- **初回で払わないコスト**: `wrangler types` 自動生成基盤の整備、KV / R2 / OAuth secret 等の binding 追加実装、boundary lint 機構そのものの再設計。
- **トレードオフ**: 手動 `Env` 維持は wrangler.toml 変更時の同期漏れリスクを内包する。これに対しては Phase 3 の代替案比較で明示し、Phase 9 の boundary lint negative test と Phase 12 の implementation-guide で改修フローを文書化することで運用カバーする。

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 後続 7 タスクが共通 `Env` を参照することで型ドリフトを抑止できるか | PASS | AC-4 / blocks 7 件で 1:N 参照点が確定。`Hono<{ Bindings: Env }>` 例を guide に固定 |
| 実現性 | 02c 既存 unit test を破壊せず `ctx()` を refactor できるか | PASS | 構造的部分型 (`Pick<Env, "DB">`) で従来の `{ DB: D1Db }` 渡し側と互換、AC-3 / AC-6 で gate |
| 整合性 | 不変条件 #5（`apps/web` から D1 直接アクセス禁止）と整合するか | PASS | `Env` を `apps/api/src/env.ts` に閉じ、AC-5 で boundary lint が web → env import を error 化 |
| 運用性 | binding 追加時の同期漏れを検知 / 復旧できるか | PASS | Phase 9 boundary lint negative test + Phase 12 implementation-guide に「wrangler.toml 変更 → env.ts 同時更新」改修フローを記載 |

## 実行タスク

- [ ] 02c の `_shared/db.ts` 現状把握と暗黙契約 `{ DB: D1Db }` の所在記録
- [ ] `wrangler.toml` から binding 棚卸（[vars] / [[d1_databases]] / [triggers] / 環境別 override）
- [ ] AC-1〜7 を quantitative に再記述（成果物単位 / 実行コマンド単位）
- [ ] 4 条件評価の根拠を埋める
- [ ] Phase 2 への open question（`Env` フィールド命名 / `D1Db` alias 方針 / boundary lint 禁止トークン現状）
- [ ] `outputs/phase-01/main.md` に決定事項サマリを記録

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/02c-followup-001-api-env-type-and-helper.md | 起票元 (AC 一次出典) |
| 必須 | docs/30-workflows/issue-112-02c-followup-api-env-type-helper/index.md | 本タスク workflow root |
| 必須 | apps/api/wrangler.toml | binding 定義の正本 |
| 必須 | apps/api/src/repository/_shared/db.ts | refactor 対象の現行実装 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #5 / #1 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 構成と binding 前提 |
| 必須 | scripts/lint-boundaries.mjs | boundary lint 禁止トークン定義 |
| 参考 | docs/30-workflows/02-application-implementation/ | 02c 親仕様 |

## 実行手順

### ステップ 1: 02c 現状把握

- `apps/api/src/repository/_shared/db.ts` を読み、`ctx(env: { DB: D1Db })` の引数型 / 戻り値型 / 利用箇所（02c repository ファミリー）を一覧化する。
- 02c の unit test で `ctx()` をどう呼び出しているか（fixture / mock の D1 形）を抽出し、refactor 後も互換となる構造的部分型条件を確定する。

### ステップ 2: AC quantitative 化

- AC-1: 成果物として `apps/api/src/env.ts` 新規 1 ファイル、`Env` interface を `export interface Env { ... }` で定義。
- AC-2: `Env` の各 key に **対応する wrangler.toml の section / binding 名** をコメント形式で隣接記述（例: `// wrangler.toml [vars] FORM_ID`）。
- AC-3: `_shared/db.ts` の `ctx()` シグネチャを `(env: Pick<Env, "DB">) => DbCtx` に変更し、02c unit test 全件 pass。
- AC-4: 02c implementation-guide.md に `Hono<{ Bindings: Env }>` 使用例を追記（行レベル diff として Phase 11 evidence 化）。
- AC-5: `apps/web/**` から `apps/api/src/env.ts` を import すると `pnpm lint` が non-zero exit する negative test を Phase 9 で取得。
- AC-6: `pnpm typecheck` / `pnpm lint` / `pnpm test --filter @ubm/api` 3 コマンドが exit 0。
- AC-7: `env.ts` のコメント / Phase 11 evidence に API token / OAuth secret 等の実値が含まれない（Phase 9 secret hygiene check）。

### ステップ 3: 4 条件評価と handoff

- 4 条件評価の根拠表を埋め、Phase 2 へ「`Env` フィールド命名」「`D1Db` を `D1Database` alias 化するか」「boundary lint 禁止トークン現状」の 3 open question を引き渡す。

## 統合テスト連携

| 連携先 | 引き渡す観測 | 受け取る gate |
| --- | --- | --- |
| Phase 6 (テスト戦略) | `ctx()` refactor 後の構造的部分型契約条件 | 02c unit test 全 pass |
| Phase 8 (CI / 品質ゲート) | typecheck / lint / test / boundary lint 4 gate | CI workflow 通過 |
| Phase 9 (セキュリティ / boundary) | `apps/web → apps/api/src/env` 違反検知 | negative test exit non-zero |
| Phase 11 (evidence 取得) | 4 gate ログ + boundary lint negative ログ | log evidence 5 種 |

## 多角的チェック観点

- **不変条件 #5**: `apps/web` から `apps/api/src/env.ts` を import 不能とすることを **boundary lint で機械的 gate**。本 Phase で要件として明文化し、Phase 9 で negative test に落とす。
- **不変条件 #1**: `Env` には Forms 関連 vars (`FORM_ID` / `GOOGLE_FORM_ID` / `SHEETS_SPREADSHEET_ID` 等) を持たせるが、Forms schema の構造は型に持ち込まない。env はあくまで「binding 名と値型」のみ。
- **secret hygiene**: `Env` のコメントに secret 実値を貼らない。コメントは「対応 binding 名」のみに限定。
- **後方互換**: `ctx()` refactor は構造的部分型ベースで進め、既存呼び出し側を破壊しない。

## 完了条件

- AC-1〜7 が quantitative に表現され、Phase 2 が拾える形で 4 open question が記録されている
- 4 条件評価が PASS で揃い、根拠が表に書かれている
- `outputs/phase-01/main.md` が作成され、決定事項サマリが記録されている

## 成果物

- `outputs/phase-01/main.md`
