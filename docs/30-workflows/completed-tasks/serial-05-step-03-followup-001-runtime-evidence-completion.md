# serial-05-step-03 schema-diff-resolve runtime evidence 完遂 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | serial-05-step-03-followup-001-runtime-evidence-completion                                      |
| タスク名     | serial-05-step-03 schema-diff-resolve の runtime screenshots (8枚) + resolve フィードバック evidence 完遂 |
| 分類         | 改善 / evidence completion                                                                      |
| 対象機能     | `SchemaDiffPanel` の 4 pane (added / changed / removed / unresolved) × 2 scale (desktop / mobile) visual evidence、および resolve 成功 / 409 / 422 のユーザーフィードバック実証 |
| 優先度       | 高                                                                                              |
| 見積もり規模 | 小〜中規模                                                                                      |
| ステータス   | consumed                                                                                        |
| 発見元       | serial-05 step-03 Phase 12 Runtime Pending Boundary                                             |
| 発見日       | 2026-05-17                                                                                      |

## Canonical Workflow Status

> 2026-05-18 consumed update: this source task is historical. The active/completed evidence package is `docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/`; the parent evidence path is `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/`. Sections below preserve the original problem statement, while the status rows here show the current outcome.

- 親 workflow: `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/`
- 親タスク状態: `completed / PASS`（Issue #775 recovery workflow で fixture-backed local visual evidence を取得済み）
- Phase 11 evidence 状態: `completed`（11 PNG captured、legacy placeholder excluded、real D1/staging smoke は user-gated boundary）
- 関連 outputs:
  - `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence.md`
  - `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/main.md`
  - `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md`
  - `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/implementation-guide.md`
- 関連 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-03-schema-diff-resolve/spec.md`
- 関連実装:
  - `apps/web/src/components/admin/SchemaDiffPanel.tsx`
  - `apps/web/src/lib/admin/api.ts`（`postSchemaAlias()`）
  - `apps/web/src/lib/admin/server-fetch.ts`（`fetchAdmin("/admin/schema/diff")`）
  - `apps/api/src/routes/admin/schema.ts`（`/admin/schema/diff` / `/admin/schema/alias` endpoint）
  - `apps/web/app/(admin)/admin/schema/page.tsx`

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

serial-05-step-03 (schema-diff-resolve) は、Google Form の現行 schema と D1 に登録済みの正本 schema との diff を可視化し、admin が `stableKey` alias を後付け解決するための既存 `SchemaDiffPanel` の hardening タスクとして実装された。Phase 12 までに以下が完了している:

- stableKey regex の client validation
- table semantics の整備と form focus 制御
- 409 (collision) / 422 (validation) payload detail の toast 表示
- diff status 日本語化と `aria-describedby` 紐付け
- local 5 点 evidence (typecheck / lint / test / build / grep-gate) は `outputs/phase-11/evidence/` に PASS で取得済み

Phase 11 evidence 設計上、`outputs/phase-11/screenshots/` 配下に runtime screenshots を取得する計画となっていたが、実行担当ローカルで以下が揃わず screenshots は **未取得のまま** Phase 12 に遷移していた:

- Cloudflare Workers (`apps/api`) 起動 + D1 binding 解決
- Auth.js admin session cookie の発行 (`/admin/*` route の gate 通過)
- diff > 0 / diff = 0 / 409 collision / 422 validation を満たす D1 fixture seed

Issue #775 recovery workflow でこの pending は解消済み。今回の完了境界は fixture-backed local visual evidence であり、real D1/staging smoke は user-gated の外部確認として残す。

### 1.2 問題点・課題

- Phase 11 evidence claim が `runtime_pending` で固定され、親 workflow が `implemented-local-runtime-pending` から `completed` に遷移できない
- `SchemaDiffPanel` の 4 pane (added / changed / removed / unresolved) のうち、unresolved pane と 409/422 error feedback の視覚的回帰 baseline が存在しない
- mobile (375) scale の admin schema diff 表示が pixel diff 検証されておらず、table semantics と縮退レイアウトの整合確認が目視のみ
- 後続 step (serial-05 step-04 以降) や regression smoke (task-22) が baseline 不在のまま積み上がる

### 1.3 放置した場合の影響

- serial-05-step-03 が `completed` に進まず、`serial-05-admin-mutation-ui` の 3/5 ゲートで全 step-04 / step-05 の merge 順序が滞る
- staging (`dev` deploy) で admin schema 機能の real D1 runtime smoke がスキップされ、Cloudflare Workers + D1 binding + Auth.js gate の三点結合の初回確認が後ろ倒しになる
- 409 collision / 422 validation の payload detail 表示が runtime 上で再現確認されないまま production に乗るリスク

---

## 2. 何を達成するか（What）

### 2.1 目的

serial-05-step-03 Phase 11 で不足していた visual screenshots を、既存 Playwright admin auth fixture + schema diff fixture で取得し、`SchemaDiffPanel` の 4 pane × 2 scale = 8 PNG と resolve 成功 / 409 / 422 のフィードバック PNG を `outputs/phase-11/screenshots/` 配下に配置。Phase 11 evidence claim を `runtime_pending` → `completed` に更新する。

### 2.2 最終ゴール

- `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots/` に下記 PNG が存在
  - 4 pane × 2 scale = 8 PNG (added / changed / removed / unresolved × desktop 1280 / mobile 375)
  - resolve success toast / 409 collision toast / 422 validation toast の 3 PNG (desktop)
- `outputs/phase-11/manifest.json` の `screenshots` 配列と `pass: true` / `verdict: PASS` への更新
- Phase 12 main.md の `phase_status (11) = completed` / `workflow_state = completed` / `evidence_state = PASS` 反映
- staging (`dev`) deploy 上で admin schema diff route が Auth.js gate 経由で 200 を返し、`/admin/schema/alias` POST が 201 / 409 / 422 を期待通り返す runtime 確認ログ

### 2.3 スコープ

#### 含むもの

- Playwright admin auth fixture と schema diff fixture による local visual evidence capture
- Optional future real-D1 seed: diff > 0 を再現する Google Form schema mock と既存登録済 `stableKey` (409 用) の投入 SQL を保持
- Auth.js storageState 実体は commit しない（今回の PASS 境界は fixture cookie injection）
- 11 PNG の取得と `outputs/phase-11/screenshots/` への配置
- `outputs/phase-11/manifest.json` 更新
- Phase 12 main.md / Phase 11 evidence.md の状態遷移反映
- staging 上の runtime smoke ログ取得（任意・推奨）

#### 含まないもの

- `SchemaDiffPanel.tsx` / `api.ts` / `apps/api/src/routes/admin/schema.ts` の実装変更（不変。設計変更が必要なら別 followup）
- 既存 API endpoint surface の変更 (`/admin/schema/diff` / `/admin/schema/alias` の shape 変更禁止)
- D1 schema migration の追加（不変条件 1 違反）
- 新規 UI primitive 追加（プロトタイプ正本順位 違反）

### 2.4 成果物

- 11 PNG ファイル（`outputs/phase-11/screenshots/` 配下）
- 更新済 `outputs/phase-11/manifest.json`
- Phase 12 main.md / Phase 11 evidence.md / `unassigned-task-detection.md` の状態更新差分
- 本 followup §3 への runtime evidence 取得手順記録

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 Cloudflare Workers + Auth.js + D1 binding を local で揃える難しさ

`apps/web` (Next.js via `@opennextjs/cloudflare`) と `apps/api` (Hono on Cloudflare Workers) は production runtime と local dev で binding 解決経路が異なる。具体的に以下が同時に成立する必要がある:

- `apps/api` を `wrangler dev` (または `pnpm --filter @ubm/api dev`) で起動し、`ubm-hyogo-db-*` D1 binding を local SQLite で解決
- `apps/web` を `pnpm --filter @ubm/web dev` で起動し、`INTERNAL_API_BASE_URL=http://127.0.0.1:8787` を `getEnv()` 経由で注入（`process.env.*` 直接禁止 / 不変条件参照）
- env は `bash scripts/with-env.sh` 経由で 1Password から動的注入し、`.env` 実値は触らない（CLAUDE.md 「ローカル `.env` の運用ルール」遵守）

### 3.2 Auth.js admin session cookie の受け渡し

`/admin/*` route は Auth.js gate でガードされており、Playwright headless / 手動 curl での screenshot 取得時に admin role を持つ session cookie が必要。具体的な詰まりポイント:

- Google OAuth flow を headless で完走させるのは不安定。Magic Link 経路 (`docs/00-getting-started-manual/specs/13-mvp-auth.md`) を local 専用で有効化する方が安定
- テストアカウント `manjumoto.daishi@senpai-lab.com`（admin 権限）でログインし、ブラウザ DevTools から session cookie を抜き出して Playwright `storageState` に保存する手順を確立する
- cookie domain は local 起動 host (`localhost:3000`) に固定。staging (`*.workers.dev`) と混在させない

### 3.3 D1 fixture seed (diff > 0 / 409 collision / 422 validation)

`/admin/schema/diff` が空でない結果を返すには、D1 上の正本 schema と Google Form の現行 schema を意図的に乖離させる必要がある。

- diff > 0 を再現する seed SQL を `outputs/phase-11/fixtures/seed-diff.sql` として一時配置（commit はしない、再現用メモのみ §3.6 に残す）
- 409 collision は既存登録済 `stableKey` を再 POST して再現
- 422 validation は regex 違反 `stableKey`（例: 空文字 / 全角 / 60 文字超）を submit して再現

### 3.4 staging deploy の OIDC / cf.sh ラッパー制約

local 取得が困難な場合の代替として staging (`dev` deploy) で screenshot 取得する経路がある。ただし以下の制約に従う:

- `wrangler` 直接呼び出しは禁止。`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` 等のラッパー経由のみ（CLAUDE.md「Cloudflare 系 CLI 実行ルール」遵守）
- API Token / OAuth トークン値はログ / ドキュメントに転記しない
- staging admin session も同じテストアカウントで取得し、cookie は揮発的に扱う

### 3.5 解決策候補（実施順）

1. **local stack 起動**: terminal A で `mise exec -- pnpm --filter @ubm/api dev`、terminal B で `bash scripts/with-env.sh mise exec -- pnpm --filter @ubm/web dev`
2. **D1 seed**: `bash scripts/cf.sh d1 execute ubm-hyogo-db-local --local --file=outputs/phase-11/fixtures/seed-diff.sql` で diff > 0 / 409 候補を投入
3. **admin session 取得**: Playwright `adminPage` fixture が `authjs.session-token` を注入。storageState JSON は作成・commit しない
4. **Playwright で 8 PNG 取得**: `SchemaDiffPanel` の 4 pane region を 1280 / 375 viewport で capture
5. **resolve フィードバック 3 PNG 取得**: 正常 submit / 409 / 422 を順に発火し、toast 表示直後をキャプチャ
6. **staging fallback**: local で再現困難な場合は `cf.sh` 経由で staging deploy し、同手順を staging URL に対して実行
7. **manifest 更新と state 反映**: `outputs/phase-11/manifest.json` を `pass: true` / `verdict: PASS` に更新、Phase 12 main.md の `phase_status (11) = completed` に修正

### 3.6 学んだこと / 横展開メモ

- Cloudflare Workers + D1 + Auth.js の三点結合 runtime 検証は user-gated の外部確認として残る。今回の consumed 境界は fixture-backed visual evidence completion。
- `INTERNAL_API_BASE_URL` を `getEnv()` 経由で注入する経路は `apps/web/src/lib/env.ts` zod schema 検証を通る必要があり、未定義時に error boundary (`apps/web/src/app/error.tsx`) に落ちる。screenshot 取得前に必ず `/admin/schema` で 200 を確認する
- `127.0.0.1:8787` のような local 限定 endpoint は `apps/web/src` 配下に焼き込み禁止（task-18 regression smoke の grep gate で検知される）。env 経由でのみ注入する

---

## 4. 受入条件 (AC)

- **AC-1**: `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots/` に下記 11 PNG が存在し、各ファイルが commit 可能サイズ（個別 ≤ 500KB 目安）
  - `admin-schema-diff-added-desktop.png` / `admin-schema-diff-added-mobile.png`
  - `admin-schema-diff-changed-desktop.png` / `admin-schema-diff-changed-mobile.png`
  - `admin-schema-diff-removed-desktop.png` / `admin-schema-diff-removed-mobile.png`
  - `admin-schema-diff-unresolved-desktop.png` / `admin-schema-diff-unresolved-mobile.png`
  - `admin-schema-diff-resolve-success.png` / `admin-schema-diff-resolve-409.png` / `admin-schema-diff-resolve-422.png`（上限超過時は AC-1 の主要 8 を優先）
- **AC-2**: `outputs/phase-11/manifest.json` が `pass: true` / `verdict: PASS` / `screenshots` 配列に上記ファイル名を含む状態に更新
- **AC-3**: `outputs/phase-12/main.md` の `phase_status (11)` が `completed` に、`workflow_state` が `completed` に、`evidence_state` が `PASS` に更新
- **AC-4**: 取得した 8 pane PNG が design token (`apps/web/src/styles/tokens.css` の OKLch トークン) と整合し、HEX 直書きや `bg-[#xxx]` / `text-[#xxx]` が含まれない（目視レビュー OK + grep gate 維持）
- **AC-5**: runtime 取得手順（local stack 起動 / D1 seed / admin session 取得 / Playwright 実行）が本 followup §3 に確定状態で記録され、serial-05 step-04 / step-05 で再利用可能
- **AC-6**: `outputs/phase-12/unassigned-task-detection.md` または本 followup の「Open Runtime Boundary」該当項目が consumed に更新
- **AC-7**: 既存 API endpoint surface (`/admin/schema/diff` / `/admin/schema/alias`) と D1 schema に変更が入っていない（diff 確認）

---

## 5. 関連タスク

- `parallel-09-followup-001-playwright-visual-evidence-completion`: 同種の Phase 11 runtime_pending 解消パターン。Playwright cache / disk space リカバリ手順は本タスクでも参照価値あり
- `serial-05-step-01` / `serial-05-step-02`: 同 admin mutation UI ファミリ。`useAdminMutation` hook / identity-conflicts merge UI も同じ runtime 前提を持つため、本タスクの手順を横展開可能

## 6. 参照資料

- `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence.md` - Phase 11 evidence 設計（5 点セット + screenshots）
- `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/main.md` - workflow_state / evidence_state 正本
- `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/implementation-guide.md` - 実装範囲と制約
- `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md` - 後続候補 / coverage layer 表
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-03-schema-diff-resolve/spec.md` - 親 spec
- `apps/web/src/components/admin/SchemaDiffPanel.tsx` - hardening 対象 component
- `apps/web/src/lib/admin/api.ts` - `postSchemaAlias()` mutation helper
- `apps/api/src/routes/admin/schema.ts` - `/admin/schema/diff` / `/admin/schema/alias` endpoint
- `apps/web/src/lib/env.ts` - `getEnv()` / `getPublicEnv()`（env access 不変条件）
- `docs/00-getting-started-manual/specs/13-mvp-auth.md` - Magic Link 認証経路
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」/「ローカル `.env` の運用ルール」/「UI prototype alignment / MVP recovery」不変条件

## 7. 状態語彙

| Key | Before | After |
| --- | --- | --- |
| `workflow_state` | `implemented-local-runtime-pending` | `completed` |
| `implementation_status` | `IMPLEMENTED_LOCAL_RUNTIME_PENDING` | `IMPLEMENTED_COMPLETED` |
| `evidence_state` | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | `PASS` |
| `phase_status (11)` | `runtime_pending` | `completed` |
| `runtime_evidence` | `local 5 点 evidence captured。runtime screenshots は pending` | `local 5 点 + fixture-backed runtime 11 valid PNG captured` |
| `governance_mutation_user_gate` | `false` | `false`（PR 作成時のみ user 明示承認で `true`、本 followup では変更しない） |

---
status: consumed
consumed_at: 2026-05-18
canonical_workflow: docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/
recovery_note: |
  Issue #775 was closed before a canonical workflow root existed.
  This unassigned-task file is preserved for backward link integrity.
  Runtime evidence completion was executed through the canonical workflow root above.
  Issue #775 reference mode: refs_only (no Closes #775).
---
