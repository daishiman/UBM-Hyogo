# issue-769-followup-003 admin error.tsx focus transfer 横展開 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| タスクID     | issue-769-followup-003-admin-error-focus-transfer                                                     |
| タスク名     | `(admin)/admin/error.tsx` への root 同等 a11y hardening (focus / aria-live / digest / logger) 横展開  |
| 分類         | 改善 / a11y (accessibility) followup                                                                  |
| 対象機能     | admin segment error boundary（admin top + 7 subroute = 8 routes 全体をカバーする segment-level 1 枚） |
| 優先度       | 中                                                                                                    |
| 見積もり規模 | 小（admin/error.tsx 全面書き換え 約 40 行 + spec/test 追記）                                          |
| ステータス   | pending                                                                                               |
| 発見元       | issue-769 Phase 12 unassigned-task-detection (`/admin/error.tsx` focus transfer 行)                   |
| 発見日       | 2026-05-17                                                                                            |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`（a11y hardening 系列）
- 親 workflow 状態: `implemented_local_evidence_captured`（root error.tsx focus は issue-769 で完了済み・admin segment は未達）
- 直接の親 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md`（spec section 4.3 「error boundary focus 管理」の admin segment 横展開）
- 発見元 evidence: `docs/30-workflows/issue-769-root-error-focus/outputs/phase-12/unassigned-task-detection.md`（Follow-up Candidates 表 3 行目）
- 横展開元 (reference impl): `apps/web/app/error.tsx`（issue-769 で `useRef` + `tabIndex={-1}` + `focus({ preventScroll: true })` 実装済み）
- 修正対象 (現状確認済):
  - `apps/web/app/(admin)/admin/error.tsx` — 既存だが a11y hardening が **未実装**（focus 管理なし / `aria-live` なし / digest 表示なし / logger 呼び出しなし）
  - `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx`（新規追加 または 既存ファイル追記）
- admin segment 構成 (8 routes すべて本 boundary 配下):
  - `(admin)/admin/page.tsx` (admin top / dashboard)
  - `(admin)/admin/members/`
  - `(admin)/admin/tags/`
  - `(admin)/admin/meetings/`
  - `(admin)/admin/schema/`
  - `(admin)/admin/requests/`
  - `(admin)/admin/identity-conflicts/`
  - `(admin)/admin/audit/`

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-769 で root `apps/web/app/error.tsx` の h1 自動 focus 移譲を実装し、`parallel-07` spec section 4.3 「Root error.tsx focus 管理」を達成した。同 Phase 12 unassigned-task-detection で **`/admin/error.tsx` への focus transfer 適用** が followup candidate として記録されたが、issue-769 のスコープ外として保留された (`docs/30-workflows/issue-769-root-error-focus/outputs/phase-12/unassigned-task-detection.md`)。

現状 `apps/web/app/(admin)/admin/error.tsx` を確認すると、root error.tsx と比べて以下が **すべて未実装**:

- `role="alert"` + `aria-live="assertive"`（screen reader 通知）
- `error.digest` の表示（運用調査の識別子）
- `useRef<HTMLHeadingElement>` + `tabIndex={-1}` + `focus({ preventScroll: true })`（自動 focus 移譲）
- `logger.error({ event: "error.boundary.caught", ... })`（構造化ログ）
- OKLch トークンに沿った className（`text-danger` / `bg-surface-2` / `border-border` 等）

admin segment は管理者業務の中核（members 編集 / tags 管理 / meetings 操作 / schema 変更 / requests 承認 / identity-conflicts 解決 / audit 閲覧）であり、Next.js App Router の error boundary 仕様上 `(admin)/admin/error.tsx` は admin 配下 8 routes 全体の障害をキャッチする **唯一の segment-level boundary** として機能する。

### 1.2 問題点・課題

- 管理者がエラー発生に気付くまでの遅延が運用ミス（誤承認 / 重複操作 / audit 取りこぼし）に直結する
- 現状 admin boundary は `error.message` をそのまま画面表示しており、stack や内部識別子が露出して情報漏洩面でも好ましくない（root error.tsx は `isDev` 分岐で本番抑制している）
- root boundary との a11y 実装非対称が残ると、task-22 regression smoke で「root だけ focus 移譲を期待・admin は期待しない」という分岐が育ち、横展開コストが恒常化する
- 共通 hook 抽出 (`useAutoFocusOnMount(ref)`) を検討する際にも、admin segment が未対応のままだと「3 箇所目の boundary」として後追い対応が必要になり、hook 化の効果が薄れる

### 1.3 放置した場合の影響

- admin 配下 8 routes でランタイムエラーが発生した際、screen reader 利用の管理者がエラー認知できず、誤った状態のまま操作続行するリスク
- `parallel-07` spec section 4.3 が要求する error boundary a11y 要件の **admin segment への横展開未達** が `ui-prototype-alignment-mvp-recovery` Phase 13 まで持ち越される
- issue-769-followup-001 (`useAutoFocusOnMount` 共通 hook 抽出 candidate) の整備順序が複雑化（admin 含めて 3 箇所同時 refactor が必要になる）

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/web/app/(admin)/admin/error.tsx` を root error.tsx と同等の a11y hardening 水準まで引き上げ、admin 配下 8 routes 全体の error boundary として `parallel-07` spec section 4.3 を満たす。

### 2.2 最終ゴール

- `apps/web/app/(admin)/admin/error.tsx` が root error.tsx と同じ構造（`useRef` / `tabIndex={-1}` / `useEffect` 内 `logger.error → focus` / `aria-live="assertive"` / digest 表示 / `isDev` 分岐の stack 表示）を備える
- admin 文脈に合わせた文言調整（h1 文言を「管理画面を表示できませんでした」等にする / 「トップへ戻る」リンク先を `/admin` にする / ボタンとリンクの className を admin layout の OKLch トークンに整合）
- `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx`（新規）に focus 移譲・digest 表示・reset 動作・logger 呼び出しの単体検証を追加
- `pnpm typecheck` / `pnpm lint` / 該当 vitest が PASS
- `parallel-07` spec section 4.3 の admin segment 適用 DoD を達成

### 2.3 スコープ

#### 含むもの

- `apps/web/app/(admin)/admin/error.tsx` の全面書き換え（root error.tsx をテンプレートに admin 文脈で調整）
- `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx` 新規追加（既存 root の `error.component.spec.tsx` を参考にする）
- import 経路の確認: `../../../src/lib/logger` 相当の相対パス、または既存 path alias が使えるならそれを優先
- ローカル `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / 該当 vitest 実行

#### 含まないもの

- **admin auth gate のロジック変更**（未認証時のリダイレクト挙動 / `specs/13-mvp-auth.md` 仕様は不変）
- **管理 API のエラー型変更**（`apps/api/src/routes/admin/*` の error response shape は不変）
- **root error.tsx / login error.tsx / profile error.tsx の追加修正**（issue-769 / 別 followup で対応済 or 別タスク）
- **`useAutoFocusOnMount(ref)` 共通 hook の抽出**（issue-769-followup-001 として別途検討。本タスクは inline 実装で揃え、hook 抽出はその followup が走るタイミングで一括）
- **route-level error.tsx の分散配置**（`(admin)/admin/members/error.tsx` 等を個別に置く案。§3.1 で却下判断を記録）
- **admin layout / dashboard の CSS 変更**
- D1 / API endpoint surface への変更

### 2.4 成果物

- `apps/web/app/(admin)/admin/error.tsx` 書き換え差分
- `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx` 新規追加差分
- typecheck / lint / vitest PASS の evidence log
- 親 spec `parallel-i06-root-error-focus/spec.md` section 4.3 の admin segment 適用チェック

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 segment boundary 設計の意思決定: segment-level 1 枚 vs route-level 分散

Next.js App Router では error.tsx を **どの階層に置くか** で catch 範囲が変わる。admin 配下 8 routes に対して取りうる構成は 2 つ:

**案 A (採用): segment-level 1 枚 = `(admin)/admin/error.tsx` のみ**

- 配置: `apps/web/app/(admin)/admin/error.tsx` 1 ファイル
- catch 範囲: admin 配下 8 routes すべて（page.tsx, members/, tags/, meetings/, schema/, requests/, identity-conflicts/, audit/）
- 長所:
  - 実装 1 箇所で a11y hardening が完結
  - 文言・ログ event 名・トークン使用を 1 箇所で統一できる
  - root error.tsx と同じ「segment 単位 1 枚」原則に整合
- 短所:
  - route 固有の error UX（例: members 編集中なら「未保存変更がある可能性があります」等）を出し分けたい場合は `error` オブジェクトの digest / message から判定する必要あり（本タスクでは不要）

**案 B (却下): route-level 分散 = 各 subroute に error.tsx を個別配置**

- 配置: `(admin)/admin/members/error.tsx`, `(admin)/admin/tags/error.tsx`, ... × 7+ ファイル
- 長所: route 固有の文言・復旧アクションを細かく制御可能
- 短所:
  - 同じ a11y hardening を 8 箇所複製 → DRY 違反 / 漏れリスク（まさに本 followup が解決しようとしている問題）
  - 共通 hook 抽出を強制される（hook 抽出は別 followup でやる段階性に反する）
  - segment-level boundary が無いと、subroute 未カバー領域（例: 将来追加される admin top の dashboard 直下）で fallback 不在

**判断**: **案 A を採用**。理由は (1) `parallel-07` spec が要求する a11y 水準は admin 配下で一律のため route 固有差別化の根拠が無い、(2) 共通 hook 抽出 followup までは inline 実装で揃えるのが横展開コスト最小、(3) Next.js のデフォルト error boundary 解決順序（最も近い segment-level error.tsx）と整合。

### 3.2 admin auth gate との競合（auth 未完了時の error boundary 動作）

`specs/13-mvp-auth.md` で admin route は session 検証 → 未認証なら `/login` リダイレクトという gate を持つ。auth check 失敗時に throw された Error を `(admin)/admin/error.tsx` で catch すると、以下の二重表示問題が起きうる:

- middleware / server component で `redirect('/login')` を投げた場合、Next.js は redirect を error として伝播 **しない**（`NEXT_REDIRECT` 内部例外として処理される）→ admin/error.tsx は catch しない → 問題なし
- server-side で `unauthorized` を throw した場合、admin/error.tsx が catch → 認証エラーをそのまま画面表示すると `/admin` で「画面を表示できませんでした」と表示されるだけで login 導線が無い

**対処方針**: 本タスクでは「`error.digest` / `error.message` を見て auth error を識別し login 導線を出す」ような分岐ロジックは **入れない**。理由は (1) admin gate の挙動は `specs/13-mvp-auth.md` で `redirect` 経路に統一されており現状 throw 経路は存在しないこと、(2) スコープ外（admin auth gate のロジック変更は禁止）。代わりに「トップへ戻る」リンクの遷移先を `/admin` ではなく `/`（公開 top）にすることで、auth が切れていた場合も無限ループしないフォールバックを担保する。

### 3.3 common hook 依存の整理

issue-769-followup-001 で `useAutoFocusOnMount(ref)` 共通 hook 抽出が検討中。本タスクで admin/error.tsx に inline 実装を入れると、hook 抽出時に「root / admin / login / profile」の 4 箇所を一括 refactor する必要が出る（DRY 化のメリットが増える）。

**選択**: **inline 実装を採用**。理由は (1) 共通 hook 抽出 followup は i05 / i06 / 本タスクが揃って merge された後の段階で実施するのが安全（並列実行下で同じ hook を編集して衝突するリスク回避）、(2) inline 実装の差分は 4 行程度で、hook 移行時の置換も機械的、(3) issue-769 の判断（"Requires i05 and i06 to settle first"）に整合。

### 3.4 解決策候補（実施順）

1. **現状確認**: `apps/web/app/(admin)/admin/error.tsx` を Read で確認 → root error.tsx 比較で差分明確化（本仕様書作成時点で確認済: a11y hardening 全項目未実装）
2. **テンプレート移植**: root error.tsx 全構造をコピー、文言と `Link href` を admin 文脈に調整
3. **logger import 経路**: admin error.tsx からの相対パスは `../../../src/lib/logger`（`apps/web/app/(admin)/admin/error.tsx` → `apps/web/src/lib/logger`）。path alias が利用可能なら `@/lib/logger` を優先（tsconfig 確認）
4. **テスト追加**: root の `error.component.spec.tsx` をベースに admin 版を新規作成。focus / digest / reset / logger の 4 観点を検証
5. **typecheck / lint / vitest** をローカル実行
6. **横展開メモ**: 完了報告で「共通 hook 抽出 followup (issue-769-followup-001) を走らせる時、admin/error.tsx も置換対象に含めること」を残す

### 3.5 学んだこと / 横展開メモ

- segment-level boundary 1 枚で admin 配下 8 routes をカバーする設計は、a11y 横展開を局所化できる最小コスト解
- admin auth gate (`redirect` ベース) は error boundary と衝突しない設計になっているため、本タスクで分岐ロジックを足す必要はない
- 共通 hook 抽出は本タスク完了後の followup で 4 箇所一括が最適
- admin/error.tsx の文言は root より「管理画面」「管理者にご連絡」を明示し、運用者向けの誘導を分離する

---

## 4. 受入条件 (AC)

- **AC-1**: `apps/web/app/(admin)/admin/error.tsx` で h1 に `ref={headingRef}` と `tabIndex={-1}` が付与されている
- **AC-2**: 同ファイル内 `useEffect` で `logger.error → headingRef.current?.focus({ preventScroll: true })` の順序で副作用が実行される
- **AC-3**: `useRef` / `useEffect` が React から import され、`useRef<HTMLHeadingElement>(null)` で生成されている
- **AC-4**: 外側 wrapper に `role="alert"` + `aria-live="assertive"` が付与されている
- **AC-5**: `error.digest` を `<code>` 内に表示する分岐が存在する
- **AC-6**: `process.env.NODE_ENV !== "production"` の `isDev` 分岐で stack 表示している（本番抑制）
- **AC-7**: 「トップへ戻る」リンクの遷移先が `/`（公開 top）であり、auth 切れ時の無限ループを避ける設計になっている
- **AC-8**: className が OKLch トークン (`text-danger` / `bg-surface-2` / `border-border` / `bg-accent` / `text-panel` / `text-text-3` 等) のみで構成され、HEX 直書きや `bg-[#xxx]` が無い（CLAUDE.md 不変条件 2 / `verify-design-tokens` 通過）
- **AC-9**: `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx` に「マウント直後に h1 に focus が当たる」検証が存在し PASS する
- **AC-10**: 同 test ファイルに「digest を表示する」「reset を click すると reset prop が呼ばれる」「logger.error が `event: "error.boundary.caught"` で呼ばれる」検証が存在し PASS する
- **AC-11**: `mise exec -- pnpm typecheck` がローカルで 0 error
- **AC-12**: `mise exec -- pnpm lint` がローカルで 0 error / 0 warning（既存 baseline 維持）
- **AC-13**: `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run error` が 0 fail で完走
- **AC-14**: 親 spec `parallel-i06-root-error-focus/spec.md` section 4.3 の admin segment 適用が達成済（本タスクの evidence で trace 可能）
- **AC-15**: admin auth gate (`specs/13-mvp-auth.md`) のロジック・redirect 経路に変更が無い（git diff で `apps/web/middleware.ts` / auth 関連が空であること）
- **AC-16**: D1 schema / `apps/api/src/routes/admin/*` の endpoint surface が変更されていない（CLAUDE.md 不変条件 5 / UI prototype alignment 不変条件 1 継承）

---

## 5. 参照資料

- `docs/30-workflows/issue-769-root-error-focus/outputs/phase-12/unassigned-task-detection.md` — 本タスクの発見元（Follow-up Candidates 3 行目）
- `docs/30-workflows/unassigned-task/integration-fixes-i06-root-error-focus.md` — 同根 root 側の完了済タスク（章立てフォーマット参考）
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md` — 親 spec section 4.3 (admin 横展開元)
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` — 親 workflow index
- `apps/web/app/error.tsx` — 横展開元（root reference implementation）
- `apps/web/app/__tests__/error.component.spec.tsx` — テスト構造の参考
- `apps/web/app/(admin)/admin/error.tsx` — 修正対象（現状: a11y hardening 全項目未実装）
- `apps/web/app/(admin)/admin/layout.tsx` — admin layout（OKLch トークン整合確認用）
- `docs/00-getting-started-manual/specs/13-mvp-auth.md` — admin auth gate 仕様（変更不可・継承確認用）
- `docs/00-getting-started-manual/specs/design-tokens.md` — OKLch トークン正本（AC-8）
- 関連 followup:
  - `issue-769-followup-001`（`useAutoFocusOnMount(ref)` 共通 hook 抽出 candidate / 本タスク完了後に 4 箇所一括 refactor）
  - `issue-769-followup-002`（`/profile/error.tsx` focus transfer / 既に focus 実装済の場合は close 判定）
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション 不変条件 1〜4 継承
- CLAUDE.md `apps/web` env アクセス不変条件 継承（本タスクで env 参照を増やさない）
