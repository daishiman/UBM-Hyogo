# Phase 1 成果物 — 要件定義 main

> 正本: [`../../_shared-context.md`](../../_shared-context.md)。本書は SSOT §0–§3 を要件として固定する。

## 1. タスク分類（確定記録）

| 項目 | 値 |
| --- | --- |
| 実装区分 | 実装仕様書（コード変更を伴う・CONST_004 デフォルト） |
| タスク種別 | **VISUAL UI task**（見た目が変わる・apps/web home 表示 + public API 境界補強） |
| workflow_state | **implemented_local_evidence_captured**（本サイクルはローカル実装・証跡取得済み） |
| visualEvidence | `VISUAL` |
| implementation_mode | `new`（新規 workflow） |
| scope | `web_presentation_layer` |
| domain | `public-home` |
| local_verification | `spec_only_no_code_diff_yet` |

commit・PR・staging スクリーンショットはすべて **user-gated**。本フェーズで apps/web 配下のコードは一切変更しない。

## 2. ユーザー要求（逐語要約・SSOT §0）

> ホーム画面で各項目で英語表記になっている部分は日本語で記述してほしい。利用者はエンジニアではなくシステムに詳しくない人。技術的・英語表記は読みにくく直感的にわからない。直感的にわかる UI/UX に調整してほしい。ホバーでブーンと開く等のギミックは不要。直感的にわかる仕組みを整えてほしい。

→ 解釈: 「英語表記の日本語化」と「重複を生む装飾的英語 overline の整理」が主眼。アニメーション/ホバーギミックは**導入しない**。

## 3. 確定デザイン決定（AskUserQuestion 2026-06-11・SSOT §0）

1. **見出し上の英語 overline は削除**し、直下の日本語見出しのみにする（重複解消・最もすっきり）。
2. **統計カード4ラベル**: `公開メンバー / 事業フェーズ / 年間の支部会 / 最終データ更新`。**同期バッジ** `Forms 同期中 → 自動で最新化`。値・サブ文言は現状維持。

## 4. スコープ

- **対象**: 公開トップ `/` = `apps/web/app/(public)/page.tsx` が構成する 6 セクション（Hero / Stats / FeaturedMembers / AboutUbm / Timeline / CallToActionCTA）。
- **層**: apps/web 内のみ（home 表示 + public API 境界補強）。
- **対象外**: `apps/api` / `packages/shared` / D1 schema / Google Form 仕様（いずれも不変・SSOT §2-1）。新 endpoint・データ取得経路の変更なし。

## 5. 既存コードの命名規則（記録）

- DOM contract は **BEM 風の data 属性**で表現される: `data-component="hero|about-ubm|timeline|call-to-action-cta|featured-members"`、`data-stat="members|zones|meetings|sync"`、`data-role="label|value|sub|badge-sync|dot|eyebrow|section-heading|heading|header"`。
- コンポーネント props は **camelCase**（`eyebrow` / `title` / `subtitle` / `primaryCta` 等）。
- 今回変更するのは `data-role="label"` / `badge-sync` のテキストと、`data-role="eyebrow"` 要素の有無のみ。それ以外の data 属性・aria・role・id・href・testid は不変（SSOT §2-3）。

## 6. carry-over 確認

- 本タスクは**新規 workflow**（`implementation_mode="new"`）。前タスクからの未完了引き継ぎ・依存（`depends_on:[]` / `blocks:[]`）は無い。
- 既存の公開ホーム実装（Stats/Hero/AboutUbm/Timeline/CallToActionCTA）を編集対象とするが、機能追加ではなく**文言・装飾の整理**に閉じる。

## 7. 詳細インベントリ

§1 マッピング表（A/B/C）と変更ファイル一覧（F1–F6 / T1–T4）は [`inventory.md`](./inventory.md) に転記した。
