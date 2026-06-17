# _shared-context.md — home-dashboard-japanese-localization

> 本ファイルは全 Phase / 全 Lane が参照する **唯一の正本（SSOT）**。
> 文言・対象ファイル・行番号・不変条件はここを正とし、各 phase 文書はここを引用する。

---

## 0. タスク要旨

- **実装区分: 実装仕様書**（コード変更を伴う。CONST_004 デフォルト）
- **タスク種別: VISUAL UI task**（apps/web home 表示 + public API 境界補強）
- **workflow_state: implemented_local_evidence_captured**（本サイクルはローカル実装・証跡取得済み。commit・PR は user-gated）
- **対象画面**: 公開トップ `/`（ホーム画面）= `apps/web/app/(public)/page.tsx` が構成する 6 セクション
- **目的**: ホーム画面で英語表記になっている項目を、非エンジニアの会員にも直感的にわかる日本語へ整える。ホバー等のギミックは導入しない（ユーザー明示）。

### ユーザー要求（逐語要約）
> ホーム画面で各項目で英語表記になっている部分は日本語で記述してほしい。利用者はエンジニアではなくシステムに詳しくない人。技術的・英語表記は読みにくく直感的にわからない。直感的にわかる UI/UX に調整してほしい。ホバーでブーンと開く等のギミックは不要。直感的にわかる仕組みを整えてほしい。

### 確定したデザイン決定（AskUserQuestion 2026-06-11）
1. **見出し上の英語 overline は削除**し、直下の日本語見出しのみにする（重複解消・最もすっきり）。
2. **統計カード4ラベル**: 公開メンバー / 事業フェーズ / 年間の支部会 / 最終データ更新。**同期バッジ**「Forms 同期中」→「自動で最新化」。値・サブ文言は現状維持。

---

## 1. 日本語化マッピング（SSOT 正本表）

### A. 統計カードラベル（`apps/web/src/components/public/Stats.tsx`）

値（`data-role="value"`）とサブ行（`data-role="sub"`）は **現状維持**。`data-role="label"` の文言のみ変更。

| data-stat | 行 | 旧（英語） | 新（日本語） | サブ行（不変） |
| --- | --- | --- | --- | --- |
| `members` | 44 | `Members` | `公開メンバー` | 公開中のメンバー |
| `zones` | 49 | `Zones` | `事業フェーズ` | 0→1 / 1→10 / 10→100 |
| `meetings` | 54 | `Meetings / yr` | `年間の支部会` | 毎月の支部会 |
| `sync` | 59 | `Last sync` | `最終データ更新` | （バッジ）下記 B |

### B. 同期バッジ（`Stats.tsx:64` `data-role="badge-sync"` 内テキスト）

| 行 | 旧 | 新 |
| --- | --- | --- |
| 64 | `Forms 同期中` | `自動で最新化` |

> `data-role="dot"`（点滅ドット要素）は不変。テキストノードのみ差し替える。

### C. 英語 overline（eyebrow）削除 — 6 箇所

各 overline は直下に日本語見出しがあり意味が重複するため要素ごと削除する。

| # | ファイル | 行 | 旧 | 削除後に残る日本語見出し |
| --- | --- | --- | --- | --- |
| C-1 | `apps/web/app/(public)/page.tsx` | 75 | `eyebrow="UBM HYOGO · CHAPTER SITE"`（Hero への prop） | （ヒーロー）兵庫で、事業を育てる人のつながりを可視化する。 |
| C-2 | `apps/web/app/(public)/page.tsx` | 94 | `<p data-role="eyebrow">FEATURED MEMBERS</p>` | 参加している事業者たち |
| C-3 | `apps/web/src/components/public/AboutUbm.tsx` | 50 | `<p data-role="eyebrow">ABOUT</p>` | 事業支援コミュニティ「UBM」 |
| C-4 | `apps/web/src/components/public/AboutUbm.tsx` | 56 | `<p data-role="eyebrow">THREE ZONES</p>` | UBM区画 |
| C-5 | `apps/web/src/components/public/Timeline.tsx` | 51 | `<p data-role="eyebrow">RECENT MEETINGS</p>` | 最近の支部会 |
| C-6 | `apps/web/src/components/public/CallToActionCTA.tsx` | 24 | `<p data-role="eyebrow">FOR MEMBERS</p>` | メンバー情報の掲載をお願いします |

> **C-1 の方法**: `Hero` は `eyebrow ? <p data-role="eyebrow">{eyebrow}</p> : null`（Hero.tsx:48）で条件描画。`page.tsx` の `<Hero>` から `eyebrow` prop を**渡さない**だけでよい。`Hero` 本体は eyebrow prop を残す（汎用コンポーネント・既存テスト互換）。

### D. dead CSS 削除（`apps/web/src/styles/legacy-public.css`）

C で eyebrow 要素を削除すると、対応する CSS セレクタが**マッチ対象ゼロの dead rule** になる。同一サイクルで削除する（dead CSS を残さない）。

| ルール | 行レンジ | 処理 |
| --- | --- | --- |
| `[data-component="call-to-action-cta"] [data-role="eyebrow"]` | 312–318 | 削除 |
| `[data-component="hero"][data-variant="card"] [data-role="eyebrow"]` | 817–824 | **保持**（Hero は prop 経由で eyebrow を依然サポート） |
| `[data-component="about-ubm"] [data-role="eyebrow"]` | 887–894 | 削除 |
| `[data-component="featured-members"] [data-role="eyebrow"]` | 984–991 | 削除 |
| `[data-component="timeline"] [data-role="header"] [data-role="eyebrow"]` | 1020–1027 | 削除 |

> **スペーシング検証**: 削除後、各見出し（`section-heading` / CTA `heading`）が親の先頭要素になる。
> - about-ubm / featured-members / timeline の `section-heading` は `margin-top:0` 相当で、カード/ヘッダー上端に揃う（視覚的に問題なし）。
> - CTA `[data-role="heading"]`（`legacy-public.css:320-323`）は `margin-top: var(--ubm-space-2)` を持ち、eyebrow と分離する目的だった。eyebrow 削除後は copy ブロック先頭の余白になるため **`margin-top` を 0 にする**（または copy 先頭要素に余白が出ないことを Phase 11 で確認）。
> - 行番号は CSS を上から削除すると後続がズレる。**セレクタ文字列で特定**して編集すること（行番号は参考値）。

### E. テスト更新（`apps/web/src/components/public/__tests__/` ほか）

| ファイル | 変更 |
| --- | --- |
| `Stats.component.spec.tsx` | L69 `toContain("Forms 同期中")` → `toContain("自動で最新化")`。新規 it: 4 ラベルが日本語（公開メンバー/事業フェーズ/年間の支部会/最終データ更新）であることを `[data-stat=…] [data-role="label"]` で assert。 |
| `AboutUbm.component.spec.tsx` | L33-39 「renders both eyebrows ABOUT and THREE ZONES」を置換: `[data-role="eyebrow"]` が **0 件**であること + `section-heading` が「事業支援コミュニティ「UBM」」「UBM区画」であることを assert。 |
| `Timeline.component.spec.tsx` | L23-25 eyebrow `RECENT MEETINGS` の assert 削除。L36 「header still rendered」を `[data-role="eyebrow"]` truthy → `[data-role="section-heading"]`（「最近の支部会」）truthy に変更。 |
| `CallToActionCTA.component.spec.tsx` | L80-83 「eyebrow text 'FOR MEMBERS'」it を削除。L91 `[data-role="eyebrow"]` `.not.toBeNull()` → `.toBeNull()`。L85 の data-role 列挙文言から `eyebrow` を除外。 |
| `app/(public)/page.spec.tsx` | 変更不要（全セクション stub 済・FEATURED MEMBERS overline は未 assert）。 |
| `Hero.component.spec.tsx` | Hero は eyebrow prop を保持する。単体テストのサンプル eyebrow は英語残存 grep の対象にならないよう `兵庫支部会サイト` へ更新し、optional eyebrow contract を維持する。 |
| `apps/web/src/lib/api/__tests__/public.spec.ts` | `topTags` が欠けた旧/部分レスポンスを `[]` に補完し、ホームの featured members が schema error panel に落ちないことを assert。 |

### F. 視覚検証で検出した public members 旧 shape 耐性

Phase 11 screenshot で、`/public/members` の local response に `topTags` が無い場合に `PublicMemberListViewZ.parse` が失敗し、featured members が黄色い error panel になることを検出した。shared contract と apps/api は `topTags` 必須のまま維持し、web 境界で旧/部分レスポンスだけ `topTags: []` に補完する。

| # | ファイル | 処理 |
| --- | --- | --- |
| F7 | `apps/web/src/lib/api/public.ts` | `normalizePublicMemberList()` を追加し、`listMembers()` / `listMembersRaw()` の parse 前に `topTags` 欠落を空配列へ補完 |

---

## 2. 不変条件（全 Phase 共通）

1. **apps/web 内のみ**。`apps/api/` / `packages/shared/` の diff は空（`git diff dev -- apps/api packages/shared` 空）。新 endpoint・D1 schema・Google Form 仕様変更なし（UI prototype alignment 不変条件 #1）。`PublicMemberListViewZ` contract は不変で、web fetch 境界の旧レスポンス補完のみ。
2. **D1 直接アクセス禁止**（不変条件 #5）。データは `/public/stats` 経由のまま。`Stats` の props 契約・`PublicStatsView` 型は不変。
3. **DOM contract 保持**: `data-component` / `data-stat` / `data-role`（**eyebrow 除く**）/ `aria-*` / `role` / `id`（`stats-heading` 等）/ href / testid を変更しない。今回変更するのは「eyebrow 要素の削除」と「ラベル文字列の置換」のみ。
4. **OKLch トークン正本維持**（UI prototype alignment 不変条件 #2）。CSS は**削除のみ**で色追加なし。HEX 直書き / `bg-[#xxx]` 禁止 = 新規 0。`verify-design-tokens` 緑を維持。
5. **新規 component 0 / 新規 primitive 0**。文字列置換・要素削除・CSS 削除・テスト更新のみ。
6. **単一サイクル / 単一 PR（CONST_007）**。本タスクの全変更（実装7ファイル + テスト6ファイル）は 1 実装サイクルで完了する。未タスク（バックログ）への先送り分離は無し。
7. **再利用範囲の確認済み**: `Hero` / `AboutUbm` / `Timeline` / `CallToActionCTA` / `MemberGrid` / `Stats` はいずれも `app/(public)/page.tsx`（ホーム）からのみ利用（grep 確認済み）。eyebrow 削除は他画面へ波及しない。

---

## 3. 変更ファイル一覧（確定）

### 実装（apps/web・7 ファイル）
| # | パス | 種別 | 変更概要 |
| --- | --- | --- | --- |
| F1 | `apps/web/app/(public)/page.tsx` | 編集 | Hero `eyebrow` prop 削除（C-1）+ FEATURED MEMBERS overline 削除（C-2） |
| F2 | `apps/web/src/components/public/Stats.tsx` | 編集 | ラベル4件日本語化（A）+ 同期バッジ文言（B） |
| F3 | `apps/web/src/components/public/AboutUbm.tsx` | 編集 | ABOUT / THREE ZONES overline 削除（C-3, C-4） |
| F4 | `apps/web/src/components/public/Timeline.tsx` | 編集 | RECENT MEETINGS overline 削除（C-5） |
| F5 | `apps/web/src/components/public/CallToActionCTA.tsx` | 編集 | FOR MEMBERS overline 削除（C-6） |
| F6 | `apps/web/src/styles/legacy-public.css` | 編集 | dead eyebrow ルール4件削除 + CTA heading margin-top 調整（D） |
| F7 | `apps/web/src/lib/api/public.ts` | 編集 | `/public/members` 旧/部分レスポンスの `topTags` 欠落を `[]` に補完 |

### テスト（apps/web・6 ファイル編集）
| # | パス | 種別 |
| --- | --- | --- |
| T1 | `apps/web/src/components/public/__tests__/Stats.component.spec.tsx` | 編集 |
| T2 | `apps/web/src/components/public/__tests__/AboutUbm.component.spec.tsx` | 編集 |
| T3 | `apps/web/src/components/public/__tests__/Timeline.component.spec.tsx` | 編集 |
| T4 | `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` | 編集 |
| T5 | `apps/web/src/components/public/__tests__/Hero.component.spec.tsx` | 編集 |
| T6 | `apps/web/src/lib/api/__tests__/public.spec.ts` | 編集 |

> apps/api・packages/shared・D1 migration・Google Form 関連の変更は **無し**。

---

## 4. ローカル検証コマンド（DoD 共通）

```bash
# 1) 対象テスト（focused・ルートからフルパス指定）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/public/__tests__/Stats.component.spec.tsx \
  src/components/public/__tests__/AboutUbm.component.spec.tsx \
  src/components/public/__tests__/Timeline.component.spec.tsx \
  src/components/public/__tests__/CallToActionCTA.component.spec.tsx \
  src/components/public/__tests__/Hero.component.spec.tsx \
  src/lib/api/__tests__/public.spec.ts \
  app/(public)/page.spec.tsx

# 2) 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3) デザイントークン gate（HEX 直書き 0 を維持）
mise exec -- pnpm verify:design-tokens   # または verify-design-tokens 相当

# 4) 英語残存チェック（ホーム画面の英語表記が消えたことの回帰 grep）
grep -RnE 'CHAPTER SITE|FEATURED MEMBERS|RECENT MEETINGS|FOR MEMBERS|>ABOUT<|THREE ZONES|Members<|Zones<|Meetings / yr|Last sync|Forms 同期中' \
  apps/web/app/'(public)' apps/web/src/components/public   # ヒット 0 を期待

# 5) API 非接触の確認
git diff dev -- apps/api packages/shared   # 空を期待
```

### DoD（Definition of Done）
- [ ] F1–F7 の文字列置換・要素削除・CSS 削除・public members 旧 shape 補完が完了し、ホーム画面の英語表記（§1 A/B/C）が日本語化または除去され、featured members が schema error panel に落ちない
- [ ] T1–T6 のテストが新文言・eyebrow 不在・Hero optional eyebrow contract・`topTags` 補完を assert し、focused vitest が全 PASS
- [ ] `pnpm typecheck` / `pnpm lint` が緑
- [ ] `verify-design-tokens`（HEX 0）が緑、CSS 追加色 0
- [ ] §4 の英語残存 grep がヒット 0
- [ ] `git diff dev -- apps/api packages/shared` が空（apps/web 内のみ）
- [ ] ホーム画面の見た目崩れ（eyebrow 削除後の見出し上端余白）が無いことを Phase 11 ローカルスクリーンショットで確認（staging evidence は user-gated）

---

## 5. Phase 11 視覚証跡（VISUAL implemented_local_evidence_captured の扱い）

- 本タスクは VISUAL（見た目が変わる）が、**workflow_state=implemented_local_evidence_captured**（ローカル実装済み）のため Phase 11 capture は `local_fullpage_present_staging_pending`。
- ローカル実スクリーンショットは本サイクルで取得済み。追加 staging baseline は **user-gated**。
- Phase 11 evidence inventory は local PASS（PNG 3 + DOM verification PASS）で記録する。

### キャプチャ計画（ローカル取得済み・追加 staging は承認後）
| canonical name | 状態 |
| --- | --- |
| `home-localized-full.png` | ホーム全体（日本語化後・1280px） |
| `home-localized-stats.png` | 統計カード4枚（ラベル日本語） |
| `home-localized-about.png` | ABOUT/THREE ZONES overline 削除後の About/区画カード |
