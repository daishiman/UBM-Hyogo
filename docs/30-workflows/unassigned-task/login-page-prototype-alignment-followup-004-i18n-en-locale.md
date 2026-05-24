# login-page-prototype-alignment i18n (英語ロケール対応) - タスク指示書

## メタ情報

| 項目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| タスクID     | login-page-prototype-alignment-followup-004-i18n-en-locale                            |
| タスク名     | login page の英語ロケール (en) 対応 / i18n framework 採用判断                         |
| 分類         | 機能拡張 / future-scope                                                               |
| 対象機能     | `apps/web/app/login/` 配下の UI 文言・error message・status banner の i18n            |
| 優先度       | 低                                                                                    |
| 見積もり規模 | 中規模                                                                                |
| ステータス   | future-scope                                                                          |
| 発見元       | login-page-prototype-alignment Phase 12                                               |
| 発見日       | 2026-05-23                                                                            |

## Canonical Workflow Status

- canonical_workflow: （未着手 / future-scope のため未採番）
- 親 workflow: `docs/30-workflows/login-page-prototype-alignment/`
- 親タスク状態: `implemented_local_visual_evidence_captured`
- Phase 11 evidence 状態: 親 workflow 側で visual evidence 取得済み（本 followup は未開始）
- 関連 outputs:
  - `docs/30-workflows/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md`（FU-LOGIN-004 行）
- 関連実装:
  - `apps/web/app/login/_components/LoginCard.tsx` - brand-title が `兵庫支部会 / Hyogo Branch` の 2 段構造
  - `apps/web/app/login/_components/LoginPanel.client.tsx` - subtitle / button label の jp 直書き
  - `apps/web/app/login/_components/LoginStatus.tsx` - status banner の jp 直書き
  - `apps/web/app/login/_components/MagicLinkForm.client.tsx` - input label / error message の jp 直書き
  - `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` - button label "Google でログイン"

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UBM = United Bible Members は国内外メンバーが混在する en/jp 二言語前提のコミュニティであり、長期的には会員サイト全体の i18n 対応が想定されている。

ただし MVP では「jp 単言語で全 19 routes を完成させる」ことをスコープ宣言（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`）で明示しており、login page の Phase 12 でも MVP 範囲外として `FU-LOGIN-004` を `future-scope` で記録した。

login page の LoginCard だけは brand identity の都合上 `兵庫支部会 / Hyogo Branch` という jp + en の 2 段構成を採っており、i18n 対応の素地はある。一方 subtitle / button label / error message / status banner / 利用規約遷移先テキストはすべて jp 直書きであり、en locale を後段で追加する場合は i18n framework 採用判断（next-intl / next-i18next / Lingui 等）から実施する必要がある。

### 1.2 問題点・課題

- login page だけ先行して i18n 化すると、他 18 routes との運用整合（locale switcher の置き場所・localStorage / cookie 設計・SSR locale negotiation）が崩れる
- Auth.js の error message は library 側 string と app 側 string が混在しており、library 側を含めて i18n するには provider 層の override が必要
- LoginCard の 2 段タイトルは「locale 切替なしで両言語を併記」する暫定設計で、i18n framework 導入後は片方を locale に応じて表示制御する形に変更する必要がある
- 利用規約 (`/terms`) / プライバシーポリシー (`/privacy`) も jp 単言語のため、login からの遷移先がそのまま en locale を持たない

### 1.3 放置した場合の影響

- 海外メンバー流入時に login 段階で UX 障壁となる
- 後段で route 全体 i18n 化する際、login だけ後追いで対応する追加コストが発生
- LoginCard の 2 段併記設計が「将来 i18n を阻害しない暫定」であるという経緯が失われ、framework 導入時にデザイン議論が再燃する

---

## 2. 何を達成するか（What）

### 2.1 目的

login page の en locale 対応を、サイト全体 i18n 戦略の pilot として実施し、framework 選定と locale switcher の MVP 外設計を確定する。

### 2.2 最終ゴール

- i18n framework 採用判断ドキュメントが `docs/00-getting-started-manual/specs/` 配下に存在
- `apps/web/app/login/` 配下の string が翻訳 catalog に抽出済み
- `/login` で `?locale=en` または `Accept-Language` ヘッダで en 表示に切替可能
- LoginCard の 2 段タイトルが locale に応じて主表示を切替（jp 時: 兵庫支部会 主 / Hyogo Branch 副、en 時: 逆転）
- Auth.js error message の en 翻訳が provider 層で適用

### 2.3 スコープ

#### 含むもの

- i18n framework 選定（next-intl 第一候補・Next 16 App Router 公式互換性確認込み）
- `apps/web/app/login/` 配下の string 抽出と translation catalog 作成（`messages/jp.json` / `messages/en.json` 等）
- en 翻訳の作成（subtitle / button label / error message / status banner / OrDivider 文言）
- locale switcher UI（最小実装・login page footer に小さく配置）
- Auth.js error message の i18n（provider layer の error → message map）
- LoginCard 2 段タイトルの locale-aware 表示ロジック

#### 含まないもの

- 全 route の i18n 化（別 workflow `site-wide-i18n` として future-scope に積む）
- コンテンツ DB の i18n（admin-managed data / meetings / tags の locale 拡張は別議論。D1 schema 変更を伴うため MVP 範囲外不変条件と要整合）
- Google Form 質問項目の i18n（Google Form 仕様変更禁止の不変条件に抵触）
- `/terms` / `/privacy` 本文の en 翻訳（法務確認が必要なため別タスク）

### 2.4 成果物

- i18n framework 採用判断ドキュメント（spec or ADR）
- `apps/web/messages/jp.json` / `apps/web/messages/en.json`（または framework 規定の path）
- `apps/web/app/login/` 配下の string 置換差分
- locale switcher component
- en 表示時の visual evidence（Playwright snapshot）

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 MVP スコープ宣言との整合

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` で「MVP は jp 単言語」を明示しているため、login だけ先行 i18n すると残 18 routes との整合が崩れる。本 followup を実行する前に site-wide-i18n の上位 workflow を起こし、login をその第一フェーズとして位置付ける必要がある。

### 3.2 LoginCard 2 段併記の経緯

LoginCard が `兵庫支部会 / Hyogo Branch` の 2 段構成になっているのは、「現状の見た目を MVP では維持しつつ、将来 i18n を阻害しない」ための暫定設計である。i18n framework 導入後は以下のいずれかに変更することになる:

1. locale に応じて主タイトルを切替（jp: 兵庫支部会、en: Hyogo Branch）し、副タイトルを廃止
2. 両言語併記のまま、視覚的優先順位だけ locale に応じて反転（font-weight / size を切替）

どちらを採るかはデザイン議論として残っており、本 followup 着手時に再決定する。

### 3.3 Auth.js の error message i18n

Auth.js は internal error code（`OAuthSignin` / `OAuthCallback` / `EmailSignin` 等）を返すが、library 側に i18n catalog は存在しない。app 側で error code → localized message の map を持つ必要があり、library version up 時の error code 変化に追随する保守コストが発生する。

### 3.4 SSR locale negotiation と Cloudflare Workers

`@opennextjs/cloudflare` 経由で Cloudflare Workers にデプロイする構成のため、SSR 段階での `Accept-Language` 解釈と locale cookie の SSR/CSR 整合性に注意する。next-intl 採用時は middleware の Workers 互換性を事前検証する。

---

## 4. 受入条件 (AC)

- **AC-1**: i18n framework 採用判断ドキュメントが `docs/00-getting-started-manual/specs/` 配下に存在し、次の 4 観点を明記: (a) Next 16 App Router 互換、(b) Cloudflare Workers / OpenNext 互換、(c) translation catalog の置き場所、(d) locale negotiation 戦略
- **AC-2**: `apps/web/app/login/` 配下の jp 直書き string が translation key 経由に置換され、`grep -rE "兵庫|ログイン|送信|確認" apps/web/app/login/_components/` で hit が 0（catalog 経由のみ）
- **AC-3**: `/login?locale=en` または locale switcher 経由で en 表示に切替でき、Playwright snapshot で en 表示が確認可能
- **AC-4**: LoginCard 2 段タイトルが locale に応じて主/副を切替（または視覚的優先順位反転）
- **AC-5**: Auth.js error code（`OAuthSignin` / `OAuthCallback` / `EmailSignin` / `Verification` / `Default`）の en 翻訳が provider layer に存在し、login 失敗時に locale に応じて表示される
- **AC-6**: 親 workflow `outputs/phase-12/unassigned-task-detection.md` の FU-LOGIN-004 該当行が `future-scope` → `consumed`（または対応する workflow id への参照）に更新

---

## 5. 参照資料

- `docs/30-workflows/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` - FU-LOGIN-004 検知元
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` - MVP jp 単言語スコープ宣言
- `apps/web/app/login/_components/LoginCard.tsx` - brand-title 2 段構造（jp + en）
- `apps/web/app/login/_components/LoginPanel.client.tsx` - subtitle / button label の jp 直書き箇所
- `apps/web/app/login/_components/MagicLinkForm.client.tsx` - input label / error message の jp 直書き箇所
- `apps/web/app/login/_components/LoginStatus.tsx` - status banner の jp 直書き箇所
- `docs/00-getting-started-manual/specs/02-auth.md` - 認証設計（Auth.js error code との整合確認用）
- `docs/00-getting-started-manual/specs/13-mvp-auth.md` - MVP 認証方針
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション - 不変条件と正本順位
