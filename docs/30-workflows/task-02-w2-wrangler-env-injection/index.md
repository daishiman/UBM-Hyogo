# task-02-w2-wrangler-env-injection — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-02-w2-wrangler-env-injection |
| タスクID | task-imp-w2-wrangler-env-injection-001 |
| ディレクトリ | docs/30-workflows/task-02-w2-wrangler-env-injection |
| Issue |  |
| 親ワークフロー | ui-prototype-alignment-mvp-recovery |
| 元タスク | docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-02-w2-par-wrangler-env-injection.md |
| Wave | W2（02-runtime 最上流） |
| 実行種別 | parallel-capable（task-03 と並列。`[vars]` セクションは本タスクが owner） |
| 作成日 | 2026-05-07 |
| 担当 | spec drafted on this branch |
| 状態 | implemented-local |
| タスク種別 | implementation / Platform |
| 実装区分 | 実装仕様書（CONST_004 デフォルト適用） |
| 優先度 | priority:high（task-04 / task-05 / task-18 の前提となる） |
| 推定工数 | 0.5 人日 |

## purpose

UBM 兵庫支部会メンバーサイト（公開 6 / 会員 2 / 管理 8 / 共通 3 ＝ 19 routes）を Cloudflare Workers + Next.js App Router (`@opennextjs/cloudflare`) 上で破綻なく動作させるための **ランタイム環境変数注入経路を 3 環境（local / staging / production）で完全確定** する。

具体的には:

1. `apps/web/wrangler.toml` の env 別 `[vars]` セクションに必要な環境変数を集約する。
2. ビルド時 fallback `127.0.0.1:8888` の焼き込みを完全撲滅する。
3. `apps/web/src/lib/env.ts` を新設し zod 検証付きの `getEnv()` アクセサを提供する。
4. `.dev.vars.example` を新設しローカル開発に必要な env キーを文書化する（実値は 1Password 参照のみ）。
5. `next.config.ts` の `NEXT_PUBLIC_*` 公開キー許可リストを最小編集する。

下流タスク（task-04 window-guard-and-logger / task-05 error-boundary-and-staging-smoke / task-18 regression smoke）は本タスクが export する `getEnv()` のみを通じて環境変数にアクセスし、`process.env.*` の直接参照は CI gate で grep 検出して禁止する。

## scope in / out

### scope in

- `apps/web/wrangler.toml` の `[vars]` / `[env.staging.vars]` / `[env.production.vars]` 整理（env キー集約）
- `apps/web/.dev.vars.example` 新規作成（実値なし、`op://...` 参照のみ）
- `apps/web/src/lib/env.ts` 新規作成（zod 検証付き `getEnv()` / `getPublicEnv()` 提供）
- `apps/web/src/lib/__tests__/env.test.ts` 新規作成（zod parse / fallback / public env subset の 4+ ケース）
- `apps/web/next.config.ts` は既存 `env` block がある場合のみ最小編集（現行は N/A）
- `127.0.0.1:8888` 焼き込み箇所の grep 検出 + 既存コードからの除去
- `process.env.NEXT_PUBLIC_API_BASE_URL` 直接参照の `getEnv()` 経由への移行
- wrangler dev での env 注入確認 / build 通過確認 / staging dry-run

### scope out

- Cloudflare Secrets（`SENTRY_DSN_WEB` / `AUTH_SECRET`）の値そのものの記入（Cloudflare Secrets / 1Password 管理）
- `apps/api` 側の wrangler.toml 変更（本タスクは `apps/web` のみ）
- Sentry 初期化 / instrumentation 実装（task-03 sentry-workers-sdk-unify）
- logger 実装（task-04 window-guard-and-logger）
- 新 endpoint 追加 / API 仕様変更（phase-1 §1.2 非ゴール）
- D1 schema 変更 / Google Form 仕様変更

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（gate） | task-01 scope-gate-all-screens | 19 routes scope の確定 |
| 並列 | task-03 sentry-workers-sdk-unify | `wrangler.toml` を共有編集する可能性。`[vars]` 部は本タスク owner、instrumentation 部は task-03 owner と分離 |
| 下流 | task-04 window-guard-and-logger | `getEnv()` から `SENTRY_*` を参照 |
| 下流 | task-05 error-boundary-and-staging-smoke | `STAGING_BASE_URL` 等を参照 |
| 下流 | task-18 regression smoke | smoke gate で `127.0.0.1:8888` grep 0 件・`process.env.NEXT_PUBLIC_*` grep 0 件を機械検証 |
| external gate | Cloudflare Workers `getCloudflareContext()` の availability | `@opennextjs/cloudflare` ランタイム側 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-02-w2-par-wrangler-env-injection.md | 元タスク（本仕様書の正本ソース） |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md | 19 routes scope / diff scope 規律 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md | DAG / 並列実行ルール |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件全般 |
| 必須 | docs/00-getting-started-manual/specs/02-auth.md | `AUTH_URL` / `AUTH_SECRET` 設計 |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | MVP auth env 方針 |
| 必須 | apps/web/wrangler.toml | 編集対象 |
| 必須 | apps/web/next.config.ts | 編集対象（最小） |
| 参考 | scripts/cf.sh | wrangler ラッパー |
| 参考 | scripts/with-env.sh | 1Password 動的注入 |

## AC（Acceptance Criteria）

- AC-1: `apps/web/wrangler.toml` の `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に元タスク §4 のキーセット（`ENVIRONMENT` / `NEXT_PUBLIC_API_BASE_URL` / `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` / `AUTH_URL` / `SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE`）が 3 環境すべてで揃っている。
- AC-2: `apps/web/.dev.vars.example` が存在し、実値を含まない。secret 系は `op://Vault/Item/Field` 参照のみ記述する。
- AC-3: `apps/web/src/lib/env.ts` が存在し、zod の `EnvSchema` と `getEnv()` / `getPublicEnv()` を export する。`getEnv()` は zod 違反時に `ZodError` を throw する。
- AC-4: `getEnv()` は Cloudflare Workers ランタイムでは `getCloudflareContext().env` を優先し、Node（build / test）では `process.env` にフォールバックする。フォールバックは `try/catch` で安全に縮退する。
- AC-5: `pnpm --filter @ubm-hyogo/web exec rg '127\.0\.0\.1:8888'` の検出件数が 0。
- AC-6: `pnpm --filter @ubm-hyogo/web exec rg 'process\.env\.NEXT_PUBLIC_API_BASE_URL'` の検出件数が `apps/web/src/lib/env.ts` 以外で 0。
- AC-7: `apps/web/src/lib/__tests__/env.test.ts` が最低 4 ケース（必須キー parse 成功 / URL 形式違反で ZodError / `SENTRY_TRACES_SAMPLE_RATE` レンジ違反で ZodError / optional secret 欠落でも parse 通過）を含み全 PASS。
- AC-8: `pnpm --filter @ubm-hyogo/web exec tsc --noEmit` / `pnpm --filter @ubm-hyogo/web lint` / `pnpm --filter @ubm-hyogo/web build` が PASS、staging deploy（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run`）でエラーが出ない。
- AC-9: `apps/web/wrangler.toml` に `SENTRY_DSN_WEB` / `AUTH_SECRET` の値が **書かれていない**ことを `rg 'SENTRY_DSN_WEB\s*=\s*"http' apps/web/wrangler.toml` で機械確認（一致件数 0）。
- AC-10: D1 binding 名・直接接続情報を `apps/web` 側 env キーに含めない（不変条件 #5）。
- AC-11: `apps/web/next.config.ts` は既存 `env` block がある場合のみ `NEXT_PUBLIC_*` 公開キー許可リストへ追記し、現行のように `env` block が無い場合は変更せず build gate で担保する。

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点 Q1〜Q6、Schema Ownership 宣言、AC-1〜11 確定、automation-30 4 条件評価 |
| 2 | 設計 | phase-02.md | wrangler.toml 差分、env.ts シグネチャ、.dev.vars.example、CONST_005 変更ファイル一覧 |
| 3 | 設計レビュー | phase-03.md | 代替案比較（process.env 直接参照 / runtime injection only / build-time bake-in）、task-03 並列調整 |
| 4 | テスト戦略 | phase-04.md | unit test matrix、AC × test mapping、grep-based smoke gate |
| 5 | 実装ランブック | phase-05.md | wrangler.toml → .dev.vars.example → env.ts → env.test.ts → next.config.ts → grep & 移行 → wrangler dev → build → staging dry-run |
| 6 | 異常系検証 | phase-06.md | env 欠落 / URL 形式違反 / 範囲違反 / Workers context 未注入 |
| 7 | AC マトリクス | phase-07.md | AC × test × 不変条件 × evidence の N:M トレース |
| 8 | DRY 化 | phase-08.md | env 参照経路の単一化、type narrowing helper |
| 9 | 品質保証 | phase-09.md | typecheck / lint / build / test / staging dry-run / grep gate |
| 10 | 最終レビュー | phase-10.md | GO/NO-GO 判定 |
| 11 | 実装 smoke | phase-11.md | wrangler dev での env 注入実機確認、build 出力検査 |
| 12 | ドキュメント更新 | phase-12.md | implementation-guide / system-spec-update / changelog / unassigned / skill-feedback |
| 13 | PR 作成 | phase-13.md | approval gate / PR template |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/wrangler-toml-diff.md
outputs/phase-02/env-ts-signature.md
outputs/phase-02/changed-files.md
outputs/phase-03/main.md
outputs/phase-03/alternatives-comparison.md
outputs/phase-04/main.md
outputs/phase-04/test-matrix.md
outputs/phase-05/main.md
outputs/phase-05/runbook.md
outputs/phase-06/main.md
outputs/phase-07/main.md
outputs/phase-07/ac-matrix.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-09/grep-gate-result.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/evidence/wrangler-dev-log.txt
outputs/phase-11/evidence/staging-dry-run.txt
outputs/phase-11/evidence/build-output.txt
outputs/phase-11/evidence/env-test-output.txt
outputs/phase-11/evidence/grep-fallback-zero.txt
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-13/main.md
outputs/phase-13/pr-template.md
```

## services / secrets

| 区分 | 値 | 配置 | 備考 |
| --- | --- | --- | --- |
| Web | apps/web (Next.js via @opennextjs/cloudflare) | Worker | 本タスクの編集対象 |
| API | apps/api (Hono) | Worker | 接続先のみ（変更なし） |
| Secrets | `SENTRY_DSN_WEB` / `AUTH_SECRET` | Cloudflare Secrets / 1Password | wrangler.toml に値を書かない |
| 非機密 | `NEXT_PUBLIC_API_BASE_URL` ほか | wrangler.toml `[vars]` | 本タスクで集約 |

## invariants touched

- **#2** consent キーは `publicConsent` / `rulesConsent` 統一（本タスクで触らない）
- **#4** admin-managed data 分離（env キーには影響なし）
- **#5** D1 への直接アクセスは `apps/api` に閉じる（本タスクで `apps/web` 側 env から D1 binding を漏らさない）
- **#6** GAS prototype を本番仕様に昇格させない（env キー名選定で GAS を引かない）
- **CLAUDE.md secrets 管理**: 平文 `.env` をコミットしない / `.dev.vars.example` は op 参照のみ / `wrangler` 直接実行禁止（`scripts/cf.sh` 経由）

## Schema / 共有コード Ownership 宣言

| 範囲 | 編集権 | 備考 |
| --- | --- | --- |
| `apps/web/wrangler.toml` の `[vars]` / `[env.*.vars]` セクション | 本タスク | env キー集約の正本 |
| `apps/web/wrangler.toml` の `[observability]` / instrumentation 関連 | task-03 sentry-workers-sdk-unify | 本タスクは触らない |
| `apps/web/.dev.vars.example` | 本タスク | 新規作成 |
| `apps/web/src/lib/env.ts` | 本タスク | 新規作成。下流タスクは公開 API のみ参照 |
| `apps/web/src/lib/__tests__/env.test.ts` | 本タスク | 新規作成 |
| `apps/web/next.config.ts` | 本タスク（最小編集） | `NEXT_PUBLIC_*` 公開キー許可リストのみ |
| `apps/api/wrangler.toml` | 本タスク対象外 | apps/web のみ |

## completion definition

- Phase 1〜10 が completed、Phase 11 で wrangler dev 実機 env 注入確認 + build 出力 grep gate が PASS
- AC-1〜11 が Phase 7 マトリクスで完全トレース
- automation-30 4 条件評価（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）が Phase 1 / Phase 12 で整合
- task-03 / task-04 / task-05 / task-18 の前提が満たされ、`getEnv()` 公開 API が下流に提供されている
- Phase 13 で user 承認後に PR 作成完了

## lifecycle states

| state | 意味 | completed 判定 |
| --- | --- | --- |
| spec_created | Phase 1〜13 の仕様書を作成済み（実装着手前） | 不可 |
| design_locked | Phase 1〜3 完了、設計レビュー PASS | 不可 |
| implementation_in_progress | Phase 5 ランブック実行中 | 不可 |
| implemented | wrangler.toml / env.ts / .dev.vars.example / test 実装完了、Phase 9 全ゲート PASS | 不可 |
| smoke_passed | Phase 11 evidence 取得、AC-1〜11 充足 | Phase 11 完了可 |
| completed | smoke_passed + Phase 12 same-wave sync + Phase 13 user approval | 可 |

現在状態は `implemented-local`（`wrangler.toml` / `.dev.vars.example` / `env.ts` / `env.test.ts` を同一サイクルで実装済み。runtime dry-run / PR は user approval 後）。

## 補足

- 元タスク §0.7 で宣言された `getEnv()` の公開 API は本仕様書 phase-02 で関数シグネチャを完全再掲する。
- task-03 sentry-workers-sdk-unify と並列実行する場合、`apps/web/wrangler.toml` の編集競合を避けるため、本タスクが `[vars]` セクションを先行 commit し、task-03 は `[observability]` / instrumentation 関連の追記のみ行う運用とする（phase-03 にて詳細）。
- `127.0.0.1:8888` の焼き込み根絶は AC-5 / smoke gate で機械検証する。検出箇所が現存する場合は phase-05 の grep & 移行ステップで `getEnv()` 経由に書き換える。
