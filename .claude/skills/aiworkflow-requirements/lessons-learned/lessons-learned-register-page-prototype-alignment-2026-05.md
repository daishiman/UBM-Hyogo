# Lessons Learned — register-page-prototype-alignment（2026-05-26）

> workflow: `docs/30-workflows/register-page-prototype-alignment/`
> 関連 source: `apps/web/app/(public)/register/page.tsx`、`apps/web/src/components/public/Register{HeroCallout,StepGrid,Faq,BottomCTA}.tsx`、`apps/web/src/components/public/FormPreviewSections.tsx`、`apps/web/src/styles/legacy-public.css`、`apps/web/playwright/tests/register-prototype-alignment.spec.ts`
> 関連 reference: `references/workflow-register-page-prototype-alignment-artifact-inventory.md`、`changelog/20260526-register-page-prototype-alignment.md`

## 教訓一覧

### L-REGPROTO-001: primitive rename は後方互換の data-attribute hook を保持する

- **背景**: `RegisterCallout` → `RegisterHeroCallout` への分割 rename を行ったが、Playwright/e2e/axe spec は `data-component="register-callout"` と `data-role="register-cta"` を選択子として使っていた。component 名は意味的 (Hero/StepGrid/Faq/BottomCTA に責務分割) を取り、data-* hook は **観測契約** として変えない方針で切り分けた。
- **教訓**: UI primitive の rename / 分割では、(1) ファイル名 / export 名 = 設計言語、(2) `data-component` / `data-role` = 外部観測契約、の 2 層を分離して扱う。後者を変更すると Playwright spec・axe report・将来の visual baseline まで連鎖更新が必要になり 1 サイクルに収まらない。
- **将来アクション**: prototype alignment 系の rename は最初に「保持する data-* hook 一覧」を Phase 2 design で固定し、spec 側で grep gate（`data-component="register-callout"` 等の存在）として担保する。

### L-REGPROTO-002: `<details open={index===0}>` で初期開閉状態を server-render 側に閉じる

- **背景**: `FormPreviewSections` を collapsible へ刷新する際、最初のセクションだけ展開状態にしたかった。client island ("use client") を増やすと public segment の SSR/CSP 契約が変動するため、`<details>` 標準要素の `open` 属性を index 比較で渡し、JS なしで初期 1 セクション展開を実現した。
- **教訓**: 公開ページの「開閉初期状態」は client island 化せず、ネイティブ `<details>` の static `open` 属性で表現できる。client island は state transition / focus management / `useTransition` が必要な場合に限定する。
- **将来アクション**: `(public)` segment で新規 collapsible を追加する場合は、まず `<details open={条件}>` で SSR 完結を試み、それで足りない場合のみ client island 化する。Phase 4 test plan で「client island 増加なしで実装可能か」のチェック項目を追加する。

### L-REGPROTO-003: Playwright evidence 出力先は `process.cwd()` を基準に worktree-relative で固定する

- **背景**: register-prototype-alignment の Playwright spec は screenshot と axe-results を `docs/30-workflows/.../outputs/phase-11/` 配下に書き出す必要があった。`apps/web` から実行されるため `path.resolve(process.cwd(), "../../docs/30-workflows/.../outputs/phase-11")` で worktree root へ上昇する relative path を採用した。絶対 path を spec に焼き込むと worktree 横展開・CI 環境で破綻する。
- **教訓**: Playwright spec から workflow output を生成する場合、(1) `process.cwd()` を基準にし `apps/web` からの相対深度（`../..`）を固定、(2) `mkdir({ recursive: true })` で出力先を idempotent に作成、(3) screenshot は `register-desktop.png` / `register-mobile.png` のように **viewport 種別を suffix** にして overwrite 同一性を保つ、の 3 点を契約化する。
- **将来アクション**: prototype alignment / staging visual 系の新規 Playwright spec はこの 3 点をテンプレ化する。`EVIDENCE_ROOT` 定数を spec 冒頭で宣言し、`SCREENSHOT_DIR` / `EVIDENCE_DIR` の派生はテンプレ化された 3 行で表現する。

### L-REGPROTO-004: 既存 primitive (Card / Icon / ui-button) のみで prototype 整合を達成する

- **背景**: `MemberFormPage` プロトタイプを `/register` に取り込む際、Hero callout の見た目は新規 styled section ではなく、既存 `Card / CardHeader / CardContent / CardFooter` と `Icon` + `ui-button-primary ui-button-lg` の組み合わせで再現した。新規 primitive を追加せず、`register-callout__metrics` / `register-callout__consent` の局所 BEM modifier 2 件を `legacy-public.css` に追加するだけで完了した。
- **教訓**: prototype 未掲載画面（register / privacy / terms）でも、新規 primitive を生やさず既存 13+ primitive で構成する CLAUDE.md `不変条件 #3` を、`section data-component="…" + Card` + BEM modifier 1〜2 件 の合成で守れる。BEM modifier の追加は **legacy-public.css へ閉じる** ことで token / 共通 primitive 契約を汚染しない。
- **将来アクション**: 公開セクション系の prototype 取り込みでは最初に「既存 Card / Icon / ui-button-* の合成で表現可能か」を Phase 2 で評価する。新 primitive 提案は `09a-prototype-map.md` §5.1-§5.8 のいずれにも該当しない場合に限り unassigned-task として起票する。

### L-REGPROTO-005: visibility metrics は server-side pure function で算出し client island を回避する

- **背景**: `FormPreviewSections` の「公開 / 会員限定 / 管理用」設問数表示は `countByVisibility(fields, visibility)` の pure function を component 外に定義し、SSR 時に算出した。`useMemo` や client island は導入していない。
- **教訓**: 集計表示は (1) pure function を component 外に切り出し、(2) server component で同期算出、(3) `<dl>` semantic で表示、の 3 点で完結する。React state を経由しないことで Hydration mismatch・client bundle 増加・CSP nonce 契約への波及をゼロにできる。
- **将来アクション**: 公開ページの集計 UI を追加する際は、まず `pure function + server component + <dl>` で構成可能か検証する。client state が真に必要（filter / sort / search 連動）なケースのみ client island 化する。
