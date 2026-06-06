---
workflow_id: issue-1076-member-og-design-token-alignment
workflow_state: implemented_local_evidence_captured
created_at: 2026-06-03
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: new
implementation_status: implemented_local_evidence_captured
branch: docs/issue-1076-member-og-design-token-alignment-spec
issue: 1076
issue_state: CLOSED
---

# Issue #1076 — member OG 画像の意匠デザイントークン整合 (FU-I1027-002)

## 実装区分

`[実装区分: 実装仕様書]`

本タスクはコード変更（`apps/og/src/render.tsx` のブランド配色・レイアウト・タイポグラフィを
デザイン正本 `apps/web/src/styles/tokens.css` と整合させ、整合を担保する回帰テストを追加）を伴う。
issue ラベルは `type:improvement`（docs-only ではない）。受け入れ条件「OG 画像の配色・レイアウトを
OKLch トークン正本と整合」「視認性担保」「render smoke test 更新」「bundle Free 3MiB 上限内」は
いずれもコード変更なしでは達成不可能であり、CONST_004 の判定により実装仕様書として作成した。

## Issue 状態に関する注記

- GitHub Issue #1076 は再確認時点（2026-06-03）で `CLOSED`（`closedAt: 2026-06-03T04:23:12Z`）である。
- 本ワークフローでは **Issue 状態を一切変更しない**（reopen も close もしない）。`issue_state` は実態 `CLOSED` を記録する。
- 本ワークフローは Issue #1076 が `CLOSED` かつ実装が landed（`implemented_local_evidence_captured`）である状態を踏まえ、`completed-tasks/` 配下へ close-out 移動済みである（移動採用は user 承認済み・2026-06-03）。`workflow_state` は `implemented_local_evidence_captured` を維持し、commit / push / PR / staging deploy / Issue mutation は引き続き user-gated。

## 事前調査結論（実装済みか否か）

| 観点 | 結論 | 根拠 |
| --- | --- | --- |
| OG 画像のデザイントークン整合 | **実装済み（本 wave）** | automation-30 改善で `apps/og/src/og-tokens.ts` を追加し、`render.tsx` を tokens.css 由来の暖色 stone/amber 系へ整合。旧青系 hex は `render-html.spec.ts` で不在を検証 |
| 他タスクで解決済みか | **未解決** | `git log -- apps/og` は #1084（#1027 実装）の 1 件のみ。以降 `apps/og` は一度も整合作業を受けていない |
| Issue 陳腐化 | **陳腐化なし（参照は現コードと一致）** | 受け入れ条件が参照する `apps/web/src/styles/tokens.css` 正本パスは現存。`render.tsx` の HEX 直書きも現コードと一致。タイトル「A/B 改善」は意匠案 A/B を比較検討して単一意匠へ磨き込む趣旨（ランタイム A/B テスト基盤は body AC に含まれず・スコープ外） |
| `verify-design-tokens` gate の保護 | **apps/og は対象外** | gate は `apps/web/app` / `apps/web/src` のみ scan（`scripts/verify-design-tokens.spec.ts`）。`apps/og` は Satori が具体色を要求するため HEX が許容されており、自動整合が存在しない＝ドリフト放置の構造的原因 |

→ Issue #1076 は実行が必要だったため、本ワークフローで Phase 1-13 の実装仕様書作成、`apps/og` 実装、focused tests、typecheck/lint、dry-run build、size gate まで同一サイクルで完了した（`implemented_local_evidence_captured`）。

## 目的

OG 専用 Worker `apps/og` が生成する 1200×630 OG 画像のブランド意匠（配色・レイアウト・タイポグラフィ）を、
デザイン正本 `apps/web/src/styles/tokens.css`（OKLch + sRGB フォールバック）の値と整合させる。
`apps/og` は独立 Worker であり Satori（`workers-og`）が `oklch()` を解釈できないため、トークンを実行時 import せず、
**tokens.css の確定 hex 値（`:root` の text/surface/border + `@supports not (color: oklch)` フォールバックの accent 系）を
単一の正本として OG 用色定数へ複製し、その一致を回帰テストで機械的に担保する**。member 名あり／なし両ケースの視認性を保証する。

## 設計方針（要点）

| 項目 | 決定 |
| --- | --- |
| 整合方式 | tokens.css の確定 hex を OG 用色定数（`apps/og/src/og-tokens.ts` 新規）へ複製。出典行をコメント明記。実行時 import はしない（Satori は `oklch()` 非対応・独立 Worker 維持） |
| ドリフト防止 | `og-tokens.spec.ts`（新規）が `apps/web/src/styles/tokens.css` を fs 読込・パースし、OG 色定数が正本 hex と一致することを assert。tokens.css 変更で OG が乖離すれば test fail |
| A/B 解釈 | 設計時に意匠案を比較し**単一意匠へ磨き込む**。ランタイム A/B テスト基盤（KV / 計測）は構築しない（body AC 外・Free 枠維持） |
| 配色 | surface=`#f5f4f1` / panel=`#ffffff` / title=`#1a1917` / subtitle=`#57554e` / footer=`#8a877e` / border=`#e7e5df` / accent=`#b08049` / accentInk=`#6f4f25` / accentSoft=`#f3ece1` |
| タイポグラフィ | eyebrow tracking `0.12em`（token 由来）、title 適応サイズ（長い氏名は縮小）、weight/階層を整理。font は既存 Noto Sans JP 400/700 を維持（serif 追加は将来・スコープ外） |
| 視認性（名あり/なし） | default OG（member なし）= "UBM 兵庫支部会" / "メンバーディレクトリと活動紹介"、member = `fullName` / `tagLine`（occupation/zone/type 欠落時は "UBM Hyogo member" フォールバック）。title 適応サイズ + subtitle 非空保証で両ケース legible |
| 不変条件 | 既存 API / D1 / Google Form 不変（#1〜#7）。bundle に font を bundle しない（runtime fetch 維持）→ size gate 不変。新規 endpoint なし |

## 実装対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/og/src/og-tokens.ts` | 新規 | tokens.css 由来の OG 色 / レイアウト / タイポグラフィ定数（出典コメント付き）。`titleFontSize()` 適応サイズ helper を含む |
| `apps/og/src/render.tsx` | 編集 | `BRAND` を `og-tokens.ts` 参照へ置換。`buildHtml` の構造（eyebrow / title / subtitle / footer）をトークン整合・階層整理。HEX 直書き除去 |
| `apps/og/src/__tests__/og-tokens.spec.ts` | 新規 | tokens.css 正本 hex と OG 色定数の一致を機械検証（ドリフトガード）。`titleFontSize()` 境界テスト |
| `apps/og/src/__tests__/render-html.spec.ts` | 編集 | `buildHtml` がトークン整合色を含み青系 hex を含まないこと、member 名あり／なし両レイアウト、escaping 維持を assert |
| `apps/og/src/__tests__/render-smoke.spec.ts` | 編集 | fallback PNG path 維持に加え、整合後も default / member 両 OG が PNG を返すデグレ防止を維持 |

> 既存 API endpoint surface・D1 schema・Google Form 仕様・`apps/web` 配下・`og-cd.yml` size gate は**一切変更しない**。
> ブランド色の hex 直書きは `apps/og`（Satori 制約）に閉じ、`apps/web` の `verify-design-tokens` 不変条件 #2 には抵触しない。

## Phase 一覧

| Phase | File | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-1/phase-1.md` | completed (spec) |
| 2 | `outputs/phase-2/phase-2.md` | completed (spec) |
| 3 | `outputs/phase-3/phase-3.md` | completed (spec) |
| 4 | `outputs/phase-4/phase-4.md` | completed (spec) |
| 5 | `outputs/phase-5/phase-5.md` | completed (spec) |
| 6 | `outputs/phase-6/phase-6.md` | completed (spec) |
| 7 | `outputs/phase-7/phase-7.md` | completed (spec) |
| 8 | `outputs/phase-8/phase-8.md` | completed (spec) |
| 9 | `outputs/phase-9/phase-9.md` | completed (spec) |
| 10 | `outputs/phase-10/phase-10.md` | completed (spec) |
| 11 | `outputs/phase-11/phase-11.md` | completed (spec) |
| 12 | `outputs/phase-12/phase-12.md`（サマリ: `outputs/phase-12/main.md`） | completed (spec) |
| 13 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## 関連リソース

- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/1076
- 親 workflow: `docs/30-workflows/completed-tasks/issue-1027-member-dynamic-og-worker-split/`
- 検出元: 親 `outputs/phase-12/unassigned-task-detection.md`（将来候補表）
- デザイン正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/09b-design-tokens.md`
- プロトタイプ: `docs/00-getting-started-manual/claude-design-prototype/`
- 既存実装: `apps/og/src/render.tsx`（#1084 で導入）
- size gate: `.github/workflows/og-cd.yml` / `scripts/check-worker-size.sh`
