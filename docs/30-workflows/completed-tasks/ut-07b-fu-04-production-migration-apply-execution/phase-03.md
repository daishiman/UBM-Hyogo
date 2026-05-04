# Phase 3: アーキテクチャ整合 — ut-07b-fu-04-production-migration-apply-execution

[実装区分: 実装仕様書（operations verification + evidence writing）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 3 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #424 (CLOSED) |

## 目的

Cloudflare D1 binding / `apps/api/wrangler.toml` の `[env.production]` セクション / `apps/api/migrations/` ディレクトリ / `scripts/cf.sh` wrapper の四点が、本タスクの read-only verification 動作と整合していることを spec レベルで確認する。production env への切替が誤りなく行われる構造を保証する。

## 実行タスク

1. `apps/api/wrangler.toml` の `[env.production]` セクション内 `[[env.production.d1_databases]]` 設定で `database_name = "ubm-hyogo-db-prod"` が宣言されていることを spec 上で確認する（実値読取は不要、grep 観点のみ列挙）。
2. `apps/api/migrations/` 直下に `0008_schema_alias_hardening.sql` が存在することを確認する。
3. `scripts/cf.sh` の D1 サブコマンドが `wrangler d1 migrations list/execute` を呼び出す形で `--env production` を尊重することを確認する。
4. 不変条件 5「D1 への直接アクセスは `apps/api` に閉じる」が崩れない（migration ソースは `apps/api/migrations/` のまま、read-only verification 時のみ wrapper が wrangler 経由で D1 に到達）。
5. `mise exec --` 経由で Node 24 / pnpm 10 が保証されることを確認する。

## アーキテクチャ整合チェック表

| チェック項目 | 期待 | 検証方法 |
| --- | --- | --- |
| wrangler.toml `[env.production]` D1 binding | `database_name = "ubm-hyogo-db-prod"` | `grep -n "database_name" apps/api/wrangler.toml` |
| migration file 存在 | `apps/api/migrations/0008_schema_alias_hardening.sql` | `ls apps/api/migrations/` |
| wrapper 経由 | `scripts/cf.sh` のみ使用 | grep で `wrangler d1` 直接呼び出しがないこと |
| Node / pnpm version | 24.x / 10.x | wrapper 内 `mise exec --` |
| 1Password secret 注入 | `op run --env-file=.env` | wrapper 仕様 |

## アーキテクチャ上の不変条件

- D1 への直接アクセスは `apps/api` に閉じる（不変条件 5）
- `wrangler` を直接呼ばない（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）
- `.env` の中身を `cat` / `Read` / `grep` しない
- token / Account ID / OAuth 値を出力やドキュメントに転記しない
- `wrangler login` の OAuth トークンファイルに依存しない

## 参照資料

- apps/api/wrangler.toml
- apps/api/migrations/0008_schema_alias_hardening.sql
- scripts/cf.sh
- scripts/with-env.sh
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」「シークレット管理」
- docs/00-getting-started-manual/specs/08-free-database.md

## 多角的チェック観点

- production env を staging env と取り違えない構造になっているか
- DB 名 typo（`ubm-hyogo-db-production` 等）を入れる余地がないか
- wrangler 直接実行に流れる導線がないか
- migration ファイルの存在確認が evidence で再現可能か

## サブタスク管理

- [ ] wrangler.toml `[env.production]` D1 binding 期待値を明記
- [ ] migration file 存在確認手順を明記
- [ ] wrapper 経由ルール再確認
- [ ] アーキテクチャ整合チェック表を完成
- [ ] outputs/phase-03/main.md を作成

## 成果物

- outputs/phase-03/main.md

## 完了条件

- アーキテクチャ整合チェック表が完成
- 不変条件 5 と CLAUDE.md CLI ルールが本タスクで遵守されることが spec 上で示されている

## タスク100%実行確認

- [ ] 不変条件 5 を遵守する構造になっている
- [ ] wrangler 直接実行を導かない記述になっている
- [ ] secret 値を含めていない

## 次 Phase への引き渡し

Phase 4 へ、アーキテクチャ整合チェック結果と wrapper 利用契約を渡す。
## 統合テスト連携

D1 schema shape は post-check SQL evidence で検証するため、本 Phase では runtime integration test を実行しない。duplicate apply prohibition を architecture invariant として引き渡す。
