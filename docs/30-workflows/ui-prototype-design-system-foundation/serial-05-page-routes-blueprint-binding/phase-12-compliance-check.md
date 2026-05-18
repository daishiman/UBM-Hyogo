---
phase: 12
title: Compliance check — 中学生向け解説 + 不変条件適合
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-05-page-routes-blueprint-binding
status: draft
---

# Phase 12 — Compliance check

[実装区分: 実装仕様書]

## 1. このサブワークフローが何をするか（中学生向け解説）

ウェブサイトには「画面」がたくさんあります。例えば、

- トップページ（みんなが最初に見るところ）
- メンバー一覧（仲間の名前が並ぶところ）
- ログイン画面（パスワードを入れるところ）
- 管理画面（運営の人だけが入れるところ）

UBM兵庫支部会のサイトには、こういう画面が全部で **19 個** あります。

このサブワークフロー「serial-05」は、その 19 個の画面の **設計図（blueprint）** に書いてある通りに、画面のパーツ（ボタンやカードや表など）を組み立てる作業をします。

### たとえ話

LEGO ブロックを思い浮かべてください。

- **ブロック（パーツ）**: ボタン、入力欄、カード、表、見出し（これらは「primitive」と呼ばれ、既に作ってある）
- **作る作品（画面）**: トップページ、メンバー一覧、ログインなど
- **作品の設計図**: blueprint（09e / 09f / 09g という設計図ファイル）

serial-05 では、**新しいブロックを作らない**で、**ある材料だけで設計図通りに 19 個の作品を完成させる**のがゴールです。

### なぜ「設計図通り」が大事か

人によって作り方が違うと、サイト全体の見た目がバラバラになります。「どのページを開いても、同じ会社のサイトに見える」ようにするには、設計図に従うのが一番です。

### 「adapter（アダプター）」って何?

サーバーから届くデータの形と、画面が欲しいデータの形が違うことがあります。たとえば、

- サーバー: `{ name: "田中", age: 30 }`
- 画面: `{ displayName: "田中さん", profile: "30 歳" }`

この間に立って、形を変えてくれるのが **adapter** です。serial-05 では、新しいデータを取りに行く（API を作る）のではなく、**adapter で形を変えて既存データを活用** します。

## 2. 不変条件の遵守確認

| 不変条件 | 守られているか | 根拠 |
|---------|--------------|------|
| #1 実フォーム schema をコード固定しない | ✅ | adapter は section/field を配列で扱う |
| #2 consent key は `publicConsent` / `rulesConsent` 統一 | ✅ | 既存 API client の型をそのまま利用 |
| #3 `responseEmail` は system field | ✅ | adapter で hero / sections に分離 |
| #4 Form schema 外データは admin-managed として分離 | ✅ | admin route 群は独立 adapter |
| #5 D1 直接アクセス禁止 | ✅ | grep G-2 / NFR-2 |
| #6 GAS prototype 不採用 | ✅ | 参照のみ |
| #7 Google Form 再回答が正式更新経路（MVP） | ✅ | profile に form 編集 UI を作らない |
| #8 test suffix は `*.spec.{ts,tsx}` のみ | ✅ | grep / verify-test-suffix |

## 3. CLAUDE.md UI prototype alignment セクション §不変条件

| 不変 | 確認 |
|-----|------|
| 既存 API のみ接続 | ✅ NFR-3 |
| OKLch トークン正本化 | ✅ NFR-1 / G-4/5 |
| プロトタイプ正本順位 | ✅ Phase 5 で blueprint 行範囲を全件明示 |
| D1 直接アクセス禁止 | ✅ NFR-2 / G-2 |

## 4. canonical 9 headings（Phase 12 SSOT）

verify-phase12-compliance が期待する canonical heading は本ファイルでは以下を満たす:

1. このサブワークフローが何をするか（中学生向け解説）
2. 不変条件の遵守確認
3. CLAUDE.md UI prototype alignment セクション §不変条件
4. canonical 9 headings（Phase 12 SSOT）
5. ユビキタス言語の整合
6. Continuous Delivery 適合
7. 依存サブワークフローとの整合
8. 残課題（あれば）
9. 完了サインオフ

## 5. ユビキタス言語の整合

| 用語 | 本 SW での意味 |
|-----|----------------|
| route | Next.js App Router の URL path 1 個 |
| page.tsx | route の Server Component 実装ファイル |
| blueprint | `docs/00-getting-started-manual/specs/09e/f/g-*.md` の screen 設計仕様 |
| primitive | `apps/web/src/components/ui/` の汎用 UI 部品 |
| feature component | `apps/web/src/components/{public,admin,...}/` の領域別部品 |
| adapter | API 型 → blueprint 型 へ変換する pure function |
| AppShell | Topbar/Sidebar/Footer の共通 chrome |

## 6. Continuous Delivery 適合

- 1 PR = 1 SW 完結（dev へマージ可能）
- CI required checks 通過後に merge
- ロールバックは PR 単位 revert
- evidence は `outputs/phase-11/` で保全

## 7. 依存サブワークフローとの整合

| 依存 SW | 提供物 | 本 SW での利用 |
|---------|--------|--------------|
| parallel-01 | globals.css `@layer components` rhythm | page.tsx の `data-section-rhythm` 値が機能 |
| parallel-02 | tag-pill / member-card hover / visibility marker | page.tsx の `data-component` / `data-visibility` が機能 |
| parallel-03 | 3 系統 AppShell layout | page.tsx が AppShell 配下で chrome 継承 |
| parallel-04 | Root layout / error / not-found / loading | page.tsx の周辺 chrome が完成 |

後続:

| 後続 SW | 引き渡し物 |
|---------|----------|
| serial-06 | MemberDetail を response_fields 描画に拡張するための adapter `form-response.ts` の型エクスポート |
| serial-07 | Playwright visual snapshot baseline 化対象の 4 screens |

## 8. 残課題

- 本 SW 単体では visual baseline を固定しない（SW-07 引き継ぎ）
- MemberDetail の response_fields 描画は SW-06 の `MemberDetail.tsx` 改修と統合する

## 9. 完了サインオフ

DoD（Phase 8）全件 green + evidence inventory（Phase 11）全件物理存在を確認した時点で本 SW は完了。
