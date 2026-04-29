# 06a: 公開 Landing / Directory / Registration UI 実装の苦戦箇所

> 対象タスク: `docs/30-workflows/06a-parallel-public-landing-directory-and-registration-pages/`
> 同期日: 2026-04-29
> 実装範囲: `apps/web/app/page.tsx`、`apps/web/app/(public)/members/`、`apps/web/app/(public)/register/page.tsx`、`apps/web/src/lib/url/members-search.ts`、`apps/web/src/lib/fetch/public.ts`、`apps/web/src/components/public/{Hero,StatCard,MemberCard,Timeline,ProfileHero,FormPreviewSections}.tsx`、`apps/web/src/components/feedback/EmptyState.tsx`、`apps/web/app/{error,not-found}.tsx`、`apps/web/app/styles.css`

---

## L-06A-001: App Router の route group `(public)` と既存 `app/page.tsx` のルート衝突

### 苦戦点

Next.js App Router の **route group**（括弧つきセグメント `(public)`）は URL パスに含まれない。
すなわち `app/page.tsx` と `app/(public)/page.tsx` は同じ `/` ルートを指して衝突し、ビルド時に "two parallel routes resolve to the same path" エラーで止まる。

### 採用解

`app/(public)/page.tsx` を新設せず、**既存の `apps/web/app/page.tsx` を 06a の Landing 実装で上書き**する選択を取った。
`/members` / `/members/[id]` / `/register` は `app/(public)/` 配下に配置し、`(public)` グループは layout/共通装飾の論理的束ね役にとどめる。

### 教訓

- route group はパスを変えないため、`app/page.tsx` と `app/(group)/page.tsx` の **同一ルート衝突を Phase 5 設計時に必ずチェック**する
- task-specification-creator 側でも、`apps/web` の Next.js App Router 採用タスクには「既存 `app/page.tsx` の有無確認」を runbook に追加する候補
- group 採用の判断（採用したか / 既存 page を上書きしたか）は `apps/web/README.md` 等に記録し、後続タスクで再衝突しないようにする

---

## L-06A-002: Next.js 16 で `searchParams` / `params` が Promise 化された

### 苦戦点

Next.js 16 では Server Component の `searchParams` / `params` が **Promise 型**になっており、
従来の `function Page({ searchParams }: { searchParams: Record<string, string> })` のまま受けると型エラー、
実行時にも raw object として読めない。`use client` 側の `useSearchParams()` 互換ではない。

### 採用解

公開ルートの Server Component では `async function Page({ searchParams }: { searchParams: Promise<...> })` で受け、
**`await searchParams`** してから `parseSearchParams` に渡す形に統一した。
`apps/web/src/lib/url/members-search.ts` 側は同期関数のまま据え置き、Promise 解決は呼び出し側の責務とした。

### 教訓

- Next.js 16 系の App Router タスクは **`searchParams`/`params` の Promise 化**を実装テンプレに記載する
- task-specification-creator の Phase 2 設計テンプレに warning として追加候補（「Server Component で `searchParams` を使う場合は Promise として受ける」）
- URL helper（query parser）は同期で書き、Promise 解決は呼び出し側に閉じ込めると後方互換が保ちやすい

---

## L-06A-003: density 用語の表記揺れと URL 値の正本化

### 苦戦点

実装初期は `comfortable / compact` 系の英語ラベルと `comfy / dense / list` の URL 値が混在し、
`MemberCard` props 型・URL helper・spec ドキュメント・CSS modifier がそれぞれ別表記で書かれていた。
glossary が `docs/00-getting-started-manual/` に存在しないため、表記の正本がどこにあるか即時に判断できなかった。

### 採用解

URL query 値である **`comfy / dense / list`** を全層の正本に固定し、英語ラベル `comfortable/compact` は撤廃。
`docs/00-getting-started-manual/specs/12-search-tags.md` の URL 表に正値を明記し、
`MemberCard` の `density: 'comfy' | 'dense' | 'list'` props 型もこれに揃えた。

### 教訓

- URL query 値が型・ドキュメント・UI ラベルに横断する用語は **URL 値を正本**として固定し、UI ラベルは表示用変換に閉じる
- MVP でも spec 用語辞書（`docs/00-getting-started-manual/glossary.md` 等）の早期導入を検討（unassigned-task として 06a-followup で起票はしないが、spec 整備の継続課題）
- 用語のゆらぎは Phase 12 の skill-feedback-report で「困難だった点」として必ず記録する

---

## L-06A-004: zod `catch` だけでは string 加工フォールバックに不足

### 苦戦点

URL query の `q` を「未指定 / 200 文字超 / 前後空白あり」で安全に正規化するため、`z.string().catch('')` を使ったが、
`catch` は **input が schema に一致しない場合のみ**動作する（`z.string()` には大半の文字列が適合してしまう）。
結果、空白圧縮・長さ切り詰めが catch だけでは効かないケースが残った。

### 採用解

`z.string().trim().transform(s => s.replace(/\s+/g, ' ').slice(0, 200)).catch('')` のように
**`transform` で正規化、`catch` を最後の保険**として併用する pattern を採用。
`apps/web/src/lib/url/members-search.ts` の `parseSearchParams` に集約し、API 側 schema との 200 文字上限を一致させた。

### 教訓

- zod の `catch` は **enum / literal / 数値 / boolean などで型不一致した時の fallback** に向く
- string の前処理（trim / 空白圧縮 / 上限切り詰め）は `transform` で実施し、`catch` は副次的に
- API と Web で同じ正規化を二重実装すると drift する。`packages/shared` への抽出は 06a-followup ではなく 04a-followup-003 として継続管理

---

## L-06A-005: Phase 11 で `wrangler dev` esbuild バージョン不一致により実 Workers + D1 smoke 不能

### 苦戦点

`wrangler dev` を起動しようとすると、グローバル esbuild と `wrangler` 同梱 esbuild の **Host/binary version mismatch（0.27.3 vs 0.21.5）**で失敗する。
`scripts/cf.sh` は `ESBUILD_BINARY_PATH` 自動解決を deploy 系で行うが、`wrangler dev` のローカルセッションには未対応。

### 採用解

Phase 11 では実 Workers + D1 smoke を断念し、**local mock API による curl + Playwright screenshot** を代替証跡として
`outputs/phase-11/evidence/{curl,screenshot,cmd}/` に保存。phase-12 で「実 D1 smoke 未実施」を明示し、
`task-06a-followup-001-real-workers-d1-smoke.md` として未タスク化、08b / 09a 側で実施する引き継ぎ計画を記録。

### 教訓

- `wrangler dev` 起動は **scripts/cf.sh の改修対象**（`ESBUILD_BINARY_PATH` 自動解決を dev コマンドにも拡張）
- Phase 11 の証跡は「実環境 smoke が不能」になった場合、**local mock + screenshot + 不能理由 + 引き継ぎ先タスク** を成果物セットとして残す（証跡欠落＝Phase 11 未完了 ではない）
- 同種ブロッカーの再発時には followup-001 系で個別タスク化し、原因タスク側に Phase 11 証跡欠如を残さない

---

## 横断教訓

| 観点 | サマリ |
| --- | --- |
| skill-feedback への即時反映 | 困難だった点（route group 衝突 / Next.js 16 Promise 化 / density 用語ゆらぎ）は phase-12 の skill-feedback-report.md に必ず記録し、aiworkflow-requirements skill 同期 wave で lessons-learned-06a-* に昇格 |
| spec の正本性 | URL query 値・density 値・コンポーネント props 型は **`specs/12-search-tags.md` / `specs/09-ui-ux.md`** を正本に揃え、apps/web 実装はそこから派生 |
| follow-up の粒度 | 06a-followup-001（real Workers/D1 smoke）/ -002（OGP+sitemap）/ -003（mobile FilterBar+tag picker）に粒度分割。04a-followup-003（shared query parser）は 06a 差分追記のみ、独立 followup 化しない |
