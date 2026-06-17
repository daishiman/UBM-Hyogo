# PR テンプレート — ホーム画面の英語表記を非エンジニア向け日本語へ整える

> **commit / push / PR 作成は user の明示承認後にのみ実施する。** implemented_local_evidence_captured 段階では作成しない。
> base ブランチ: `dev`。

---

## タイトル案

```
feat(web): ホーム画面の英語表記を非エンジニア向け日本語へ整える（overline削除＋統計ラベル日本語化）
```

## base / ブランチ

- base: `dev`
- 作業ブランチ例: `feat/home-dashboard-japanese-localization`

---

## 変更概要

公開トップ `/`（ホーム画面）で英語表記になっている項目を、非エンジニアの会員にも直感的にわかる日本語へ整える。
apps/web 内のみの変更（文字列置換・要素削除・dead CSS 削除・public members 旧 shape 補完・テスト更新）。ホバー等のギミックは導入しない。

1. **統計カード4ラベルの日本語化**: `Members`→`公開メンバー` / `Zones`→`事業フェーズ` / `Meetings / yr`→`年間の支部会` / `Last sync`→`最終データ更新`。同期バッジ `Forms 同期中`→`自動で最新化`。値・サブ行は現状維持。
2. **英語 overline（eyebrow）6 箇所を要素ごと削除**: `CHAPTER SITE` / `FEATURED MEMBERS` / `ABOUT` / `THREE ZONES` / `RECENT MEETINGS` / `FOR MEMBERS`（直下の日本語見出しと重複のため）。
3. **dead CSS 削除 + CTA heading 余白調整**: eyebrow 削除で不要になった CSS ルール4件を削除（Hero eyebrow ルールは保持）。

---

## 変更ファイル一覧

### 実装（apps/web・6 ファイル）

- `apps/web/app/(public)/page.tsx` — Hero `eyebrow` prop 削除 + FEATURED MEMBERS overline 削除
- `apps/web/src/components/public/Stats.tsx` — ラベル4件日本語化 + 同期バッジ文言
- `apps/web/src/components/public/AboutUbm.tsx` — ABOUT / THREE ZONES overline 削除
- `apps/web/src/components/public/Timeline.tsx` — RECENT MEETINGS overline 削除
- `apps/web/src/components/public/CallToActionCTA.tsx` — FOR MEMBERS overline 削除
- `apps/web/src/styles/legacy-public.css` — dead eyebrow ルール4件削除 + CTA heading margin-top 調整

### テスト（apps/web・4 ファイル）

- `apps/web/src/components/public/__tests__/Stats.component.spec.tsx`
- `apps/web/src/components/public/__tests__/AboutUbm.component.spec.tsx`
- `apps/web/src/components/public/__tests__/Timeline.component.spec.tsx`
- `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx`

> apps/api・packages/shared・D1 migration・Google Form 関連の変更は無し。

---

## テスト

```bash
# focused vitest
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/public/__tests__/Stats.component.spec.tsx \
  src/components/public/__tests__/AboutUbm.component.spec.tsx \
  src/components/public/__tests__/Timeline.component.spec.tsx \
  src/components/public/__tests__/CallToActionCTA.component.spec.tsx \
  app/(public)/page.spec.tsx

mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:design-tokens

# 英語残存 grep（ヒット 0 を期待）
grep -RnE 'CHAPTER SITE|FEATURED MEMBERS|RECENT MEETINGS|FOR MEMBERS|>ABOUT<|THREE ZONES|Members<|Zones<|Meetings / yr|Last sync|Forms 同期中' \
  apps/web/app/'(public)' apps/web/src/components/public

# API 非接触
git diff dev -- apps/api packages/shared   # 空を期待
```

---

## スクリーンショット

> 実装後に添付する（implemented_local_evidence_captured 段階では捏造画像を貼らない）。

- [ ] `home-localized-full.png` — ホーム全体（日本語化・eyebrow 削除後・1280px）
- [ ] `home-localized-stats.png` — 統計カード4枚（ラベル日本語 + 自動で最新化バッジ）
- [ ] `home-localized-about.png` — About/区画カード（overline 削除後の見出し上端余白）

---

## 不変条件チェック

- [ ] apps/web 内のみ（`git diff dev -- apps/api packages/shared` が空）
- [ ] D1 直接アクセスなし（データは `/public/stats` 経由のまま・props 契約不変）
- [ ] DOM contract 保持（`data-component` / `data-stat` / `data-role`（eyebrow 除く）/ `aria-*` / `id` / href / testid 不変）
- [ ] OKLch トークン正本維持・HEX 直書き 0・追加色 0（`verify-design-tokens` 緑）
- [ ] 新規 component 0 / 新規 primitive 0
- [ ] 単一サイクル・単一 PR（未タスク分離なし）
- [ ] ホーム画面の英語表記残存 grep がヒット 0

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
