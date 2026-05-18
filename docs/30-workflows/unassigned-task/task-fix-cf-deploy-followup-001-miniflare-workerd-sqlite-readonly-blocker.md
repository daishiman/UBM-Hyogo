# fix-cf-deploy follow-up 001: Miniflare/workerd SQLite readonly database 起動ブロッカー解消

## メタ情報

```yaml
issue_number: TBD
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-fix-cf-deploy-followup-001-miniflare-workerd-sqlite-readonly-blocker |
| タスク名 | `pnpm --filter @ubm-hyogo/web build:cloudflare` ローカル実行で発生する Miniflare/workerd SQLite readonly database 起動エラーの解消 |
| 分類 | bug-fix / infrastructure / local-build |
| 対象機能 | `apps/web` OpenNext Cloudflare ローカルビルド経路 |
| 優先度 | **High**（ローカル build evidence が取得できないため CI と本番の挙動を事前検証できない） |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` Phase 11 / Phase 12 |
| 発見日 | 2026-05-17 |
| 関連Issue | TBD |
| 関連PR候補 | なし |
| visualEvidence | NON_VISUAL |
| 親タスク | `fix-cf-deploy-esbuild-import-source-staging-failure`（esbuild 収束 PR の runtime pending 残課題） |

## 背景

`fix-cf-deploy-esbuild-import-source-staging-failure` で `pnpm.overrides.esbuild = "0.27.3"` への bump と lockfile 再生成を完了し、`"import-source" is not a valid feature name` の parser エラーは再現しなくなった。

しかし後段の `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`（OpenNext 経由のローカル build）が、別症状の **Miniflare/workerd SQLite readonly database 起動エラー** で停止する。具体的には `SENTRY_DO` の Durable Object 用 SQLite が `attempt to write a readonly database` で初期化に失敗する。

これは esbuild 収束タスクの責務外として `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 扱いとしたが、独立した未着手タスクとして仕様化されていない（Phase 12 `unassigned-task-detection.md` では 0 件として扱われた）。

## 目的

`apps/web` の OpenNext ローカル build (`build:cloudflare`) を exit 0 で完了させ、Cloudflare deploy への前段ローカル evidence を再び取得可能にする。

## スコープ

### 含む

- Miniflare/workerd の Durable Object SQLite 永続化 path / permission の調査
- `apps/web/open-next.config.ts` / `wrangler.toml` の DO binding（`SENTRY_DO` を含む）設定確認
- ローカル build 時の `.open-next/` / Miniflare キャッシュディレクトリの書き込み権限 / 残存ファイル整理
- workerd / @opennextjs/cloudflare / @opennextjs/aws のバージョン互換性検証
- 必要に応じて `build:cloudflare` script の前処理（temp dir 初期化等）追加
- 解消後の `pnpm --filter @ubm-hyogo/web build:cloudflare` exit 0 evidence 取得

### 含まない

- `pnpm.overrides.esbuild` の再変更（`fix-cf-deploy-esbuild-import-source-staging-failure` の SSOT を維持）
- `apps/web` の機能変更
- Sentry / Durable Object 機能のランタイム改修
- GitHub Actions `web-cd / deploy-staging` job の構成変更
- D1 schema 変更

## 受け入れ条件

- `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` が exit 0
- 上記実行ログに `attempt to write a readonly database` が現れない
- `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --dry-run` が成功する
- regression なし: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が緑
- `pnpm why esbuild` が単一 `0.27.3` のままであること（親タスクの SSOT 維持確認）

## 試行履歴

未着手。`fix-cf-deploy-esbuild-import-source-staging-failure` Phase 11 で本症状を確認し、別ブロッカーとして分類した時点が起点。

## 次アクション候補

- (a) `.open-next/` / `.wrangler/state/` を全削除して clean build を試行
- (b) workerd / @opennextjs/cloudflare の patch バージョン bump（compatibility date 整合確認込み）
- (c) `wrangler.toml` の Durable Object SQLite persist path を明示的に書き込み可能な temp dir へ向ける
- (d) `SENTRY_DO` の DO binding 自体をローカル build 時のみ skip する build-only profile を OpenNext config に追加
- (e) Cloudflare 公式 issue tracker (`cloudflare/workers-sdk` / `opennextjs/opennextjs-cloudflare`) で同症状を検索し、既知の workaround 適用

## 苦戦箇所 / Lessons（親タスクからの引き継ぎ）

> 出典: `.claude/skills/aiworkflow-requirements/references/lessons-learned-fix-cf-deploy-esbuild-import-source-staging-failure-2026-05.md` L-FIXCF-003 / L-FIXCF-005

1. **parser error と deploy green は別ゲート**: `pnpm why esbuild` / `pnpm exec esbuild --version` / API wrangler dry-run は esbuild 収束と parser 回復を証明するが、`build:cloudflare` と GitHub Actions deploy job の緑化までは証明しない。本タスクはそのうち後者のローカル先行検証経路に該当する。
2. **症状で正確に分類すること**: `import-source` parser エラーと SQLite readonly エラーは表層的に「Cloudflare deploy 失敗」で同じに見えるが、原因が異なる。同じ PR 内で両方を fix しようとすると依存収束の意図が不明瞭になり、後続レビューで誤った巻き戻し判断を招きやすい。
3. **historical 修正の上書き禁止**: `pnpm.overrides.esbuild` を 0.25.4 系へ巻き戻すと parser エラーが再発する。本タスクは esbuild override に触れずに DO / workerd レイヤーで解決すること。
4. **同 wave Phase 状態と runtime boundary の整合**: 親タスクが `runtime_pending` をラベルしているフェーズは、子タスク側でも runtime 完了を主張しない（review drift 防止）。

## システム仕様反映チェックリスト

| 仕様 | 反映ポイント |
| --- | --- |
| `CLAUDE.md` — Cloudflare 系 CLI 実行ルール | `wrangler` 直接呼び出し禁止、`bash scripts/cf.sh` 経由を厳守 |
| `CLAUDE.md` — `apps/web` env アクセス不変条件 | `getEnv()` / `getPublicEnv()` 経由維持、`process.env.*` 直参照禁止 |
| `aiworkflow-requirements / references / deployment-secrets-management.md` | DO binding 変更時の secrets / vars 影響範囲確認 |
| `aiworkflow-requirements / references / workflow-fix-cf-deploy-esbuild-import-source-staging-failure-artifact-inventory.md` | 親タスクの runtime pending を本タスク完了時にクローズ参照 |

## DoD

- 受け入れ条件全項目クリア
- `outputs/phase-11/` にローカル build exit 0 ログ evidence 配置
- 親タスクの `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` のローカル部分を解消した旨を `workflow-fix-cf-deploy-esbuild-import-source-staging-failure-artifact-inventory.md` にクロスリンク
