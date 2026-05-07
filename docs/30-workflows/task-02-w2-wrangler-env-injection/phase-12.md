# Phase 12: ドキュメント更新

> 実装区分: 実装仕様書（CONST_004 デフォルト適用）
> 元タスク: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-02-w2-par-wrangler-env-injection.md`
> Phase 種別: NON_VISUAL implementation（platform / runtime config）
> 出力先ベース: `docs/30-workflows/task-02-w2-wrangler-env-injection/outputs/phase-12/`

---

## 0. 必須成果物一覧（Task 12-1 〜 12-7）

| # | ファイル | 役割 |
|---|---------|------|
| 12-1 | `main.md` | Phase 12 トップ index（各成果物の status と相対 path を一望） |
| 12-2 | `implementation-guide.md` | Part 1 / Part 2 を含む実装手順サマリー（後続 task 影響範囲含む） |
| 12-3 | `system-spec-update-summary.md` | `docs/00-getting-started-manual/specs/` および CLAUDE.md への影響整理（Step 1 / Step 2A/2B） |
| 12-4 | `documentation-changelog.md` | 変更ファイル一覧と validator 結果 |
| 12-5 | `unassigned-task-detection.md` | 未タスク化候補（0 件でも理由明記） |
| 12-6 | `skill-feedback-report.md` | task-specification-creator スキルへの改善点 or 改善点なし |
| 12-7 | `phase12-task-spec-compliance-check.md` | Task 12-1〜12-6 の準拠チェック |

すべて `outputs/phase-12/` 直下に配置する。

---

## 1. `main.md`

### 必須セクション

- 概要: 「task-02 wrangler-env-injection の Phase 12 ドキュメント更新成果物」
- 必須 6 成果物 status 表（PASS / PENDING / N/A）
- Phase 11 連動: `outputs/phase-11/main.md` の状態語彙を引用
- Phase 13 への引き継ぎ: 「PR 作成は Phase 13 で user 承認後に実施」と明記

---

## 2. `implementation-guide.md`

### Part 1: アナロジー（中学生レベル）

- 「env binding」を「電源コンセントの電圧切替（local 100V / staging 110V / production 120V）」に例えるなど。値は同じ「家電」（コード）に流れるが、コンセント（環境）ごとに正しい電圧が供給される、という比喩。

### Part 2: 実装詳細（C12P2-1 〜 C12P2-5 充足）

| # | 必須記述 | 本タスクでの該当 |
|---|---------|------------------|
| C12P2-1 TypeScript 型定義 | `EnvSchema` / `Env` 型の zod 定義 | 元タスク §7.1 の ts ブロック |
| C12P2-2 API シグネチャ | `getEnv(): Env` / `getPublicEnv()` | 元タスク §7.1 export |
| C12P2-3 使用例 | `listMembers()` 内での `getEnv()` 利用例 | 元タスク §7.2 |
| C12P2-4 エラー処理 | Zod parse 失敗 → throw → `app/error.tsx`（task-05）が補足 | 元タスク §8 失敗時挙動 |
| C12P2-5 設定値 | wrangler.toml `[vars]` キー一覧（local / staging / production） | 元タスク §4 / §5 |

### 後続タスクへの影響範囲セクション（必須）

| 後続 task | 影響内容 | 引き継ぎインターフェース |
|-----------|----------|--------------------------|
| task-03 sentry-workers-sdk-unify | `SENTRY_DSN_WEB` / `SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE` を `getEnv()` 経由で参照 | `getEnv()` |
| task-04 window-guard-and-logger | `ENVIRONMENT` を logger 出力先判定に利用 | `getEnv().ENVIRONMENT` |
| task-05 error-boundary-and-staging-smoke | Zod parse 失敗を `app/error.tsx` で補足 | throw 経由 |
| task-11 public api adapter | `NEXT_PUBLIC_API_BASE_URL` を fetch base URL として利用 | `getEnv().NEXT_PUBLIC_API_BASE_URL` |
| task-18 regression smoke | `127.0.0.1:8888` 焼き込み 0 件を CI で恒久監視 | grep gate |

### validator 要件

- `pnpm --filter @ubm-hyogo/web exec tsc --noEmit` exit 0
- `pnpm --filter @ubm-hyogo/web lint` exit 0
- `pnpm --filter @ubm-hyogo/web test src/lib/__tests__/env.test.ts --run` 全 PASS
- `rg '127\.0\.0\.1:8888' apps/web/src` 0 件

---

## 3. `system-spec-update-summary.md`

### Step 1: `docs/00-getting-started-manual/specs/` への影響

| spec | 影響 | アクション |
|------|------|-----------|
| `00-overview.md` | なし | N/A |
| `01-api-schema.md` | なし（フォーム schema 不変） | N/A |
| `02-auth.md` | なし（Auth.js 配線そのものは変更なし、`AUTH_URL` / `AUTH_SECRET` の env 配線が明確化されるのみ） | N/A |
| `08-free-database.md` | なし（D1 binding は `apps/api` 側、本タスクは `apps/web` のみ） | N/A |
| `13-mvp-auth.md` | なし | N/A |

### Step 2: CLAUDE.md / aiworkflow-requirements 仕様への影響

判定基準（phase-template-phase12.md §「Step 2 = N/A vs BLOCKED 判定基準」）:

- ドメイン仕様（API endpoint / D1 schema / IPC 契約 / UI route / auth / Cloudflare Secret）に touch するか?
  → **No**（env 配線整備のみ。Cloudflare Secret の値そのものは触らず、wrangler.toml [vars] と zod accessor の追加に閉じる）
- ただし CLAUDE.md の env 配線セクション（「シークレット管理」配下）には、`apps/web/.dev.vars.example` を新設した旨と `getEnv()` 経由アクセスの不変条件を追記する余地がある。

**Step 2A（計画記録）**: CLAUDE.md「シークレット管理」直下に「`apps/web` env アクセスは `apps/web/src/lib/env.ts` の `getEnv()` 経由のみ。`process.env.*` 直接参照禁止」を 1 段落追記する計画。
**Step 2B（実更新）**: Phase 12 完了前に上記計画を実コミット差分として CLAUDE.md に反映し、planned wording を残さない。

planned wording 残存確認コマンド（完了前必須）:

```bash
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/task-02-w2-wrangler-env-injection/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "planned wording なし"
```

---

## 4. `documentation-changelog.md`

| 変更ファイル | 種別 | 概要 |
|-------------|------|------|
| `apps/web/wrangler.toml` | M | `[vars]` / `[env.staging.vars]` / `[env.production.vars]` を §4 のキーで整理 |
| `apps/web/.dev.vars.example` | C | 新規（実値なし、op 参照） |
| `apps/web/src/lib/env.ts` | C | zod 検証付き env アクセサ |
| `apps/web/src/lib/__tests__/env.test.ts` | C | env 検証ロジック単体テスト |
| `apps/web/next.config.ts` | M（最小） | NEXT_PUBLIC_* 公開キー許可リスト |
| `CLAUDE.md` | M | 「シークレット管理」配下に `getEnv()` 経由アクセス不変条件を追記 |
| `docs/30-workflows/task-02-w2-wrangler-env-injection/**` | C | 本仕様書群 |

validator 結果セクション: §2 validator 要件の各コマンド exit code を一覧化。

---

## 5. `unassigned-task-detection.md`

SF-03 4 パターン照合（設計タスク特有パターンを実装タスクにも準用）:

| パターン | 候補 | 起票要否 |
|---------|------|----------|
| 型定義 → 実装 | なし（本タスク自身が型 + 実装を含む） | 不要 |
| 契約 → テスト | env.test.ts を本タスク内で同梱 | 不要 |
| UI 仕様 → コンポーネント | UI 影響なし | 不要 |
| 仕様書間差異 → 設計決定 | なし | 不要 |

### 候補（起票推奨）

| 候補 ID 案 | 内容 | 起票先 |
|-----------|------|--------|
| `UT-task-02-FU-01` | Sentry Browser DSN（client bundle 焼き込み）の build hook 実装。現状 `SENTRY_DSN_WEB` は server-side `getEnv()` のみで、Browser DSN を NEXT_PUBLIC_ として配線する build 時 hook は未対応 | `docs/30-workflows/unassigned-task/` |
| `UT-task-02-FU-02` | `AUTH_URL` の動的解決（Cloudflare Pages preview URL を含む dynamic origin への対応）。現状は env 静的値のみ | `docs/30-workflows/unassigned-task/` |
| `UT-task-02-FU-03` | `bash scripts/cf.sh secret put SENTRY_DSN_WEB --env {staging,production}` の post-merge runbook 化（task-03 で消費） | `docs/30-workflows/unassigned-task/` |

0 件でない場合でも、未起票理由 / 起票先 path / 上流 task ID を必ず記録する。

---

## 6. `skill-feedback-report.md`

最低限の記録項目:

- 観察事項 1: NON_VISUAL implementation（runtime config）の場合、Phase 11 evidence の標準テンプレが docs-only と API smoke のハイブリッドになりがち。「platform/runtime config」専用テンプレを `phase-template-phase11.md` に追加する余地。
- 観察事項 2: `bash scripts/cf.sh dev` の出力を Phase 11 evidence として標準化する記述が `phase-template-phase11.md` に未収載。
- 観察事項 3: 改善点なし、と書く場合でも本ファイルは省略しない。

---

## 7. `phase12-task-spec-compliance-check.md`

| Task | 確認項目 | status |
|------|----------|--------|
| 12-1 main.md | 状態語彙 / 必須 6 成果物 status 表 | PASS / FAIL |
| 12-2 implementation-guide | C12P2-1〜C12P2-5 全項目 + 後続影響表 | PASS / FAIL |
| 12-3 system-spec-update-summary | Step 1 全 spec 判定 + Step 2A/2B（planned wording 残無し） | PASS / FAIL |
| 12-4 documentation-changelog | 変更ファイル全列挙 + validator 結果 | PASS / FAIL |
| 12-5 unassigned-task-detection | SF-03 4 パターン照合 + UT-task-02-FU-01〜03 検討 | PASS / FAIL |
| 12-6 skill-feedback-report | 観察事項 or 「なし」明記 | PASS / FAIL |

NON_VISUAL 代替証跡項目（Phase 11 連動）:

| 項目 | status |
|------|--------|
| `outputs/phase-11/main.md` 状態語彙が `PASS_RUNTIME_SYNCED` または `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | PASS / FAIL |
| evidence 5 ファイル実体存在 | PASS / FAIL |
| secret redact 確認済 | PASS / FAIL |
| screenshot 系ファイル不在 | PASS / FAIL |

---

## 8. 完了条件

- [ ] 必須 7 ファイル全実体作成済
- [ ] planned wording 残存 0 件
- [ ] CLAUDE.md 実更新がコミット差分に含まれる（Step 2B 完了）
- [ ] `unassigned-task-detection.md` の候補 3 件が起票推奨 / 起票見送りいずれかで decision 済
- [ ] phase12-task-spec-compliance-check.md 全行 PASS
