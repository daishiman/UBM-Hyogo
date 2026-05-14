# UI prototype alignment / MVP recovery - SCOPE

> 改訂日: 2026-05-07
> 正本順位: 本ファイル -> `outputs/phase-{1,2,3}/phase-N.md` -> `docs/00-getting-started-manual/specs/*.md` -> prototype

## 1. 全画面実装スコープ（19 routes）

| 層 | route | プロトタイプ掲載 | 設計指針 |
|----|-------|-----------------|---------|
| 公開 | `/` | 有 | プロトタイプ忠実 |
| 公開 | `/(public)/members` | 有 | プロトタイプ忠実（密度切替追加） |
| 公開 | `/(public)/members/[id]` | 有 | プロトタイプ忠実 |
| 公開 | `/(public)/register` | 無 | デザイン言語ベース（Hero + CTA card） |
| 公開 | `/privacy` | 無 | デザイン言語ベース（LegalProse） |
| 公開 | `/terms` | 無 | デザイン言語ベース（LegalProse） |
| 会員 | `/login` | 有 | プロトタイプ忠実（5 状態） |
| 会員 | `/profile` | 有 | プロトタイプ忠実 |
| 管理 | `/(admin)/admin` | 有 | プロトタイプ忠実 |
| 管理 | `/(admin)/admin/members` | 部分 | DataTable + Drawer |
| 管理 | `/(admin)/admin/tags` | 無 | Queue + Detail |
| 管理 | `/(admin)/admin/meetings` | 無 | Calendar/List + Form |
| 管理 | `/(admin)/admin/schema` | 無 | Diff + Apply |
| 管理 | `/(admin)/admin/requests` | 無 | Queue + Detail + Action |
| 管理 | `/(admin)/admin/identity-conflicts` | 無 | Side-by-side compare |
| 管理 | `/(admin)/admin/audit` | 無 | Filter + Timeline |
| 共通 | `error.tsx` | 無 | ErrorState |
| 共通 | `not-found.tsx` | 無 | EmptyState |
| 共通 | `loading.tsx` | 無 | Skeleton |

## 2. API 接続マッピング要約

詳細 shape は `outputs/phase-3/phase-3.md` §2 を参照する。ここでは後続 task が迷わない粒度の route group と endpoint surface だけを固定する。

| 画面群 | 主要 endpoint |
|--------|--------------|
| 公開トップ | `GET /public/stats`, `GET /public/members`, `GET /public/form-preview` |
| 公開一覧 / 詳細 | `GET /public/members`, `GET /public/member-profile/:id` |
| 公開 register | 外部 Google Form redirect（`responderUrl`） |
| 会員 login | `POST /auth/magic-link`, `GET /auth/gate-state`, `GET /auth/session-resolve`, `GET /auth/schemas` |
| 会員 profile | `GET /me`, `GET /auth/schemas`, `POST /me/visibility-request`, `POST /me/delete-request` |
| 管理 dashboard | `GET /admin/dashboard` |
| 管理 members | `GET /admin/members`, `POST /admin/member-status`, `POST /admin/member-delete`, `GET /admin/member-notes/:id` |
| 管理 tags | `GET /admin/tags-queue`, `POST /admin/tags-queue/:id/decision` |
| 管理 meetings | `GET /admin/meetings`, `POST /admin/meetings`, `PATCH /admin/meetings/:id`, `GET /admin/attendance` |
| 管理 schema | `GET /admin/schema`, `POST /admin/sync-schema` |
| 管理 requests | `GET /admin/requests`, `POST /admin/requests/:id/decision` |
| 管理 identity conflicts | `GET /admin/identity-conflicts`, `POST /admin/identity-conflicts/:id/resolve` |
| 管理 audit | `GET /admin/audit` |

## 3. 不変条件（task-02..22 共通）

1. **既存 API のみ接続**: `apps/api/src/routes/` 配下の現行 endpoint surface のみ利用する。新 endpoint 追加は禁止。
2. **D1 / Form 不変**: D1 schema 変更と Google Form 仕様変更は本 workflow では行わない。
3. **OKLch トークン正本化**: prototype `styles.css` L1-70 の OKLch 定義を task-09 で `apps/web/src/styles/tokens.css` に転記し、task-08 の `docs/00-getting-started-manual/specs/09b-design-tokens.md` と同期する。
4. **D1 直接アクセス禁止**: `apps/web` から D1 binding へ直接触らず、既存 `apps/api` route 経由で接続する。
5. **新 primitive 禁止**: task-10 で確定する prototype primitive set を使い、画面ごとに独自 primitive を増やさない。
6. **shape 乖離は UI adapter**: 既存 API response と UI 期待 shape が乖離する場合は API を変更せず、`apps/web` 側 adapter で吸収する。

## 4. 正本順位

1. `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`
2. `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/outputs/phase-{1,2,3}/phase-N.md`
3. `docs/00-getting-started-manual/specs/*.md`
4. `docs/00-getting-started-manual/claude-design-prototype/`

## 5. 後続タスク導線

| 責務 dir | tasks | 依存 |
|----------|-------|------|
| `01-scope` | task-01 | なし（W1 solo） |
| `02-runtime` | task-02..05 | task-01 完了後。task-05 は task-02..04 の後 |
| `03-spec-source` | task-06..08, task-19..22 | task-01 完了後。task-08 / 19 / 22 は task-09 / 10 の前提 |
| `04-design-system` | task-09, task-10 | task-08 完了後に task-09、task-09 + task-19 + task-22 完了後に task-10 |
| `05-screens-public` | task-11, task-12 | task-10 + task-20 + task-22 完了後 |
| `06-screens-member` | task-13, task-14 | task-10 + task-20 + task-22 完了後 |
| `07-screens-admin` | task-15..17 | task-10 + task-21 + task-22 完了後。task-16 / 17 は task-15 後 |
| `08-regression` | task-18 | W6 まで全完了後 |
| `09-w8-audit` | task-23..26 | task-01..22 完了後。task-24 は read-only invariant audit として `INVARIANT-AUDIT.md` を生成する |
| `10-w9-mapping` | task-27 | task-23..26 完了後。task-24 が生成する `INVARIANT-AUDIT.md` の 22×6 matrix（rows=task-01..22 / cols=INV-1..6 / vocabulary=`COMPLIANT|VIOLATION|N/A`）を W9 task-27 が consume し、3-layer task mapping の入力とする |

## 6. diff scope 規律 / archive rule（task-01 完了状況反映 / 2026-05-07）

task-01 実行中、別 workflow 5 dir（`02-application-implementation/`, `_design/`, `issue-348-...`, `issue-494-...`, `issue-497-...`）が誤って削除される事案が発生し、`docs/30-workflows/completed-tasks/` への明示的アーカイブで整理した。task-02..22 は以下を共通遵守する。

1. **diff scope discipline**: 各 task 完了前に `git diff --name-only main...HEAD` を確認し、出力が本 task 仕様 §3 列挙ファイル + 本 task package（`docs/30-workflows/<task-dir>/`）配下のみで構成されること。範囲外ファイルが含まれていれば commit 前に必ず排除する。
2. **archive rule**: 完了済み workflow dir を整理する場合は `git mv <dir> docs/30-workflows/completed-tasks/<dir>` でアーカイブし、`git rm -r` での純削除は禁止する（PR diff 肥大 / 履歴追跡性低下を防ぐため）。
3. **sync-merge 混入対策**: rebase / merge / sync-script で取り込んだ範囲外削除は `git checkout HEAD -- <path>` で復旧してから commit する。`--no-verify` は使わない。
4. **PR 作成前チェック**: `pnpm sync:check` で origin/main との差分を確認し、本 task 範囲外の差分が混入していないことをレビューする。

## 7. Smoke Coverage Matrix（task-25 / 2026-05-14）

Current Playwright smoke coverage is documented in `SMOKE-COVERAGE-MATRIX.md`.

- Current executable smoke entries: 17 URL entries in `apps/web/playwright/tests/full-smoke.spec.ts`
- Parent UI surfaces: 19 total surfaces; `error.tsx` and `loading.tsx` are component-only surfaces until deterministic fixtures exist
- Visual baseline: 4 screens (`login`, `public-top`, `admin-dashboard`, `profile`)
