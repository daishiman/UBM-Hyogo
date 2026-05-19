# parallel-03 admin/member AppShell runtime evidence 完遂 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| タスクID     | parallel-03-followup-002-admin-member-runtime-evidence-completion                     |
| タスク名     | parallel-03 AppShell layouts の admin/member runtime evidence 4 件 (EV-12/13/15/16) 完遂 |
| 分類         | 改善 / evidence completion                                                            |
| 対象機能     | parallel-03 で実装した AppShell 3 系統（public/admin/member）のうち admin/member runtime evidence |
| 優先度       | 中                                                                                    |
| 見積もり規模 | 小規模                                                                                |
| ステータス   | 未実施                                                                                |
| 発見元       | parallel-03 Phase 11 evidence inventory                                               |
| 発見日       | 2026-05-19                                                                            |

---

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/`
- 関連 sub-workflow: `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/`（admin/member full chrome 4 screens visual baseline 委譲先）
- 関連 sub-workflow: `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/`（`(member)` route group 内 child route 整備先）
- Phase 11 evidence 状態: `partial`（public は captured、admin/member は EV-12/13 pending、EV-15/16 deferred-to-serial-07）
- 関連 outputs:
  - `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-11-evidence-inventory.md`
  - `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/`
- 関連実装:
  - `apps/web/app/(admin)/layout.tsx`
  - `apps/web/app/(member)/layout.tsx`
  - `apps/web/app/(public)/layout.tsx`

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

parallel-03（AppShell layouts）では、UI prototype alignment / MVP recovery の不変条件3「プロトタイプ正本順位」に従い、public / admin / member の 3 系統の AppShell layout (`apps/web/app/(public)/layout.tsx` / `(admin)/layout.tsx` / `(member)/layout.tsx`) を `docs/00-getting-started-manual/claude-design-prototype/` の primitives + OKLch tokens で再構築した。

Phase 11 evidence inventory では、3 系統それぞれに対して **DOM scrape (data-* 契約検証用)** と **screenshot (visual regression baseline)** を取得する設計とし、20 件の EV 行を定義した。EV-11/EV-14 (public) は dev server `/members` で取得済み（`captured`）だが、以下 4 件は未取得のまま spec_created phase で保留している:

- **EV-12** admin DOM scrape (`outputs/phase-11/dom-scrape-admin.txt`): `pending`（authenticated admin session 取得後の `curl -b cookies.txt` scrape が必要）
- **EV-13** member DOM scrape (`outputs/phase-11/dom-scrape-member.txt`): `pending`（`(member)` route group 内に scrape 対象 child route が現状未実装）
- **EV-15** admin screenshot: `deferred-to-serial-07`（authenticated admin session fixture 要）
- **EV-16** member screenshot: `deferred-to-serial-07`（`(member)` 直下の current child route 無し）

`serial-07-regression-evidence` sub-workflow は full chrome 4 screens visual baseline を扱う別責務であり、parallel-03 自身の evidence row 充足は本 followup で個別追跡する（parallel-09-followup-001 と同型の運用パターン）。

### 1.2 問題点・課題

- Phase 11 evidence inventory が `pending` / `deferred-to-serial-07` のまま固定され、parallel-03 が `implemented_local_evidence_captured` に進めない
- data-* 契約（`data-theme` / `data-shell` / `data-route`）が admin/member shell で実際に DOM に出力されているか runtime 検証されていない（静的 spec はあるが、production-equivalent DOM の grep evidence が無い）
- admin authenticated session fixture が test 環境で未整備のため、`/admin` 配下 runtime evidence が連鎖的にブロックされる
- `(member)` route group 直下に child route が存在しないため、member shell の DOM 実態が未確認

### 1.3 放置した場合の影響

- parallel-03 が完了状態に進めず、依存する serial-05 / serial-07 / task-18 visual gate の前提が崩れる
- data-* 契約のレグレッションが起きた際、grep ベースの早期検知ができない（pixel diff のみに依存）
- admin session fixture 整備が他 admin 系タスク（e2e-stage-2-2c-admin-member-delete-001 等）と重複作業になる

---

## 2. 何を達成するか（What）

### 2.1 目的

parallel-03 Phase 11 で `pending` / `deferred-to-serial-07` 状態の EV-12 / EV-13 / EV-15 / EV-16 をすべて `captured` に昇格させ、phase-11-evidence-inventory.md の Status 列を更新する。admin / member shell の data-* 契約 grep 検証と visual baseline PNG を `outputs/phase-11/` 配下に確定保存する。

### 2.2 最終ゴール

- `outputs/phase-11/dom-scrape-admin.txt` / `dom-scrape-member.txt` が存在し、`data-theme` / `data-shell` / `data-route` 属性を含む
- `outputs/phase-11/screenshots/admin-shell.png` / `member-shell.png` が存在し、各 ≤ 500KB
- `phase-11-evidence-inventory.md` の EV-12/13/15/16 Status が `captured` に更新済み
- `verify:phase11-evidence` gate が pass

### 2.3 スコープ

#### 含むもの

- admin authenticated session cookie の test 環境取得手順整備（test admin: `manjumoto.daishi@senpai-lab.com`）
- `(member)` route group 直下に 1 件以上 child route 確保（serial-05 進捗待ちまたは最小 placeholder route）
- dev server 起動 → cookie 取得 → `curl` で DOM scrape → Playwright で screenshot capture
- 出力先: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/`
- phase-11-evidence-inventory.md の Status 列更新

#### 含まないもの

- 新規 API endpoint 追加・D1 schema 変更（不変条件1違反）
- HEX 直書き / `bg-[#xxx]` の色指定（不変条件2「OKLch トークン正本化」違反）
- 新規 primitive 追加（不変条件3「プロトタイプ正本順位」違反）
- `apps/web` からの D1 直接 binding 利用（不変条件4違反）
- serial-07 が扱う full chrome 4 screens visual baseline（責務委譲先）

### 2.4 成果物

- `outputs/phase-11/dom-scrape-admin.txt`
- `outputs/phase-11/dom-scrape-member.txt`
- `outputs/phase-11/screenshots/admin-shell.png`
- `outputs/phase-11/screenshots/member-shell.png`
- `phase-11-evidence-inventory.md` Status 列更新差分

---

## 3. どのように実装するか（How）

### 3.1 前提条件

- dev server (`mise exec -- pnpm --dir apps/web dev`) がローカルで起動可能
- Auth.js の admin gate 経由で `manjumoto.daishi@senpai-lab.com` のセッション cookie が取得できる（local Magic Link / Google OAuth テストフロー）
- `(member)` route group 配下に 1 件以上の child route（serial-05 進行中なら最小 placeholder でも可）

### 3.2 実行手順

1. dev server 起動: `mise exec -- pnpm --dir apps/web dev`
2. admin session 取得: local 認証フロー経由でログインし、`cookies.txt` に session cookie を export
3. admin DOM scrape:
   ```bash
   curl -s -b cookies.txt http://localhost:3000/admin \
     | grep -E 'data-(theme|shell|route)=' \
     > docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt
   ```
4. member DOM scrape:
   ```bash
   curl -s -b cookies.txt http://localhost:3000/<member-child-route> \
     | grep -E 'data-(theme|shell|route)=' \
     > docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-member.txt
   ```
5. Playwright screenshot capture（admin / member それぞれ 1280x800 viewport）
6. `phase-11-evidence-inventory.md` の EV-12/13/15/16 Status 列を `captured` に更新
7. `verify:phase11-evidence` gate 実行: `bash scripts/verify-pr-ready.sh`

### 3.3 Playwright 専用 config の選択肢

`apps/web/playwright.parallel09.config.ts` と同型の `apps/web/playwright.parallel03.config.ts` を複製し、admin authenticated session の `storageState` を fixture から注入する設計を採用できる。spec は `apps/web/playwright/tests/visual/parallel-03-appshell.spec.ts` として配置候補。

---

## 4. 苦戦箇所・将来の留意点（重要）

### 4.1 admin authenticated session fixture の確立

Auth.js + Google OAuth / Magic Link の local 認証フローを Playwright fixture 化する必要がある。具体的には:

- Magic Link 経由の場合: dev SMTP（mailpit 等）からメール本文の token を抽出し、`/api/auth/callback/email?...` に直接 GET する fixture スクリプト
- セッション cookie (`next-auth.session-token` / `authjs.session-token`) を `storageState` JSON として保存し、Playwright `test.use({ storageState })` で再利用
- test admin: `manjumoto.daishi@senpai-lab.com`（MEMORY.md 記載のテストアカウント）

この fixture は e2e-stage-2-2c-admin-member-delete-001 や他 admin 系 followup と共有化する余地があり、`apps/web/playwright/fixtures/admin-session.ts` 等で共通化を検討する。

### 4.2 `(member)` route group child route 依存

`(member)` route group 直下に child route が無いと screenshot 取得が原理的に不可能。serial-05-page-routes-blueprint-binding の進捗を待つか、本 followup 内で最小 placeholder route（例: `/profile` の visual harness route）を一時投入する選択肢がある。後者の場合は serial-05 完了時に削除する transient artifact として扱う。

### 4.3 serial-07 と本 followup の責務分離

`serial-07-regression-evidence` は full chrome 4 screens visual baseline (1280 / 768 / 375 / 1920 等) を扱う visual regression 専用 sub-workflow。本 followup は parallel-03 自身の evidence inventory row (EV-12/13/15/16) を `captured` に昇格させることが責務であり、1280x800 1 枚の baseline で十分。multi-viewport baseline は serial-07 に委譲する。

### 4.4 data-* 契約 grep の意味

`dom-scrape-*.txt` は単なる DOM dump ではなく、AppShell 契約属性（`data-theme="public|admin|member"` / `data-shell="appshell"` / `data-route="..."`）が production-equivalent HTML に出力されることを grep で機械検証する evidence。grep 0 hit の場合は contract regression として扱う。

### 4.5 OKLch トークンとプロトタイプ正本順位の維持

screenshot 比較時に HEX 直書きが混入していないこと、`docs/00-getting-started-manual/claude-design-prototype/` の primitives と視覚的に整合することを目視確認する。CI gate `verify-design-tokens`（task-18）が pass していることを前提とする。

### 4.6 D1 直接アクセス禁止の維持

admin/member shell の DOM scrape 結果に `apps/web` から D1 binding を直接呼ぶコード経路が露出していないこと（不変条件4）を、scrape 内容のクロスチェックで確認する。

---

## 5. テスト戦略

- `verify:phase11-evidence` evidence existence validator が `outputs/phase-11/dom-scrape-admin.txt` / `dom-scrape-member.txt` / `screenshots/admin-shell.png` / `screenshots/member-shell.png` の存在を検知し pass
- DOM scrape ファイルが grep で `data-theme=` / `data-shell=` / `data-route=` を 1 件以上含む（non-empty 検証）
- screenshot PNG が non-empty かつ ≤ 500KB
- `bash scripts/verify-pr-ready.sh` 全体 pass

---

## 6. 受け入れ条件（DoD）

- **AC-1**: EV-12 (admin DOM scrape) が `captured`、ファイルが data-* 契約属性を含む
- **AC-2**: EV-13 (member DOM scrape) が `captured`、ファイルが data-* 契約属性を含む
- **AC-3**: EV-15 (admin screenshot) が `captured`、PNG が `outputs/phase-11/screenshots/admin-shell.png` に存在
- **AC-4**: EV-16 (member screenshot) が `captured`、PNG が `outputs/phase-11/screenshots/member-shell.png` に存在
- **AC-5**: `phase-11-evidence-inventory.md` の Status 列が 4 行すべて `captured` に更新済み
- **AC-6**: `verify:phase11-evidence` gate が 0 fail で pass
- **AC-7**: 既存 API endpoint surface / OKLch トークン / プロトタイプ正本順位 / D1 直接アクセス禁止の 4 不変条件すべて遵守

---

## 7. 関連 path / refs

- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-11-evidence-inventory.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/`
- `apps/web/app/(admin)/layout.tsx`
- `apps/web/app/(member)/layout.tsx`
- `apps/web/app/(public)/layout.tsx`
- `apps/web/playwright.parallel09.config.ts`（複製ベース候補）
- `docs/30-workflows/unassigned-task/parallel-09-followup-001-playwright-visual-evidence-completion.md`（同型運用パターン参考）
- `docs/00-getting-started-manual/claude-design-prototype/`（プロトタイプ正本）
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション（4 不変条件）
- MEMORY.md「UBM-Hyogo テストアカウント」（admin: `manjumoto.daishi@senpai-lab.com`）
