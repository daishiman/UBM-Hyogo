# Phase 1: 要件定義

[実装区分: ドキュメントのみ]
判定根拠: 本 Phase の成果物は AC 一覧と論点記録のみ。コード変更なし。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-21-w2-screen-blueprints-admin |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | W2 (parallel) |
| Mode | sequential（phase 内）/ docs-only / NON_VISUAL |
| 作成日 | 2026-05-07 |
| 前 Phase | なし |
| 次 Phase | 2（設計） |
| 状態 | completed |
| Issue | （未起票） |

## 目的

`09g-screen-blueprints-admin.md` に admin 8 routes + AdminSidebar 共通の blueprint を「視覚値 0 件 / API trace 完全一致 / Sidebar 集約」を満たして格納するための要件を、AC-1〜AC-9 として quantitative に確定する。
P50 baseline で同名ファイルが既に存在する場合は、現行ファイルを削除せず AC-1〜AC-9 へ repair する。
プロトタイプ掲載 4 画面（dashboard / members / tags / schema）は 構造・copy・状態 contract 転記、未掲載 4 画面（meetings / requests / identity-conflicts / audit）は phase-3 §3 §5.3〜§5.7 派生ルール正本転記、という二系統の正本順位を本 Phase で固定する。

## 真の論点 (true issue)

- **論点 1**: AdminSidebar をどの粒度で §1 に集約するか。候補は (a) 構造 contract 転記のみ、(b) JSX + nav 表 + active state + token 参照を 4 サブセクションで分離。本タスクは「各画面で再記述しない」を不変条件 5 で要求するため、(b) の 4 サブセクション構成（1.1〜1.4）を採用し、§2〜§9 冒頭で「Sidebar は §1 参照」と明記する方針を Phase 1 で確定する。
- **論点 2**: 未掲載 4 画面の派生ルール表現。候補は (a) phase-3 §5.x を本ファイルに再転記、(b) phase-3 §5.x への link のみ、(c) 派生ルール抜粋 + link。本タスクは「09g 単独で実装可能」を要件とするため (a) を採用し、各 § 冒頭に `> 派生元: phase-3 §3 §5.x` を必ず付与する。
- **論点 3**: confirm Modal の a11y 記述粒度。bulk-action / approve-reject / schema-apply で個別記述するか共通定義を §1 横に置くか。Phase 1 では「各画面 §X.6 で `role="dialog"` + `aria-modal="true"` + focus trap + Esc close を必須記述」とし、共通定義は 09c primitive 仕様（task-19）への参照リンクで担保する。
- **論点 4**: schema-apply の二段確認をどこに記述するか。`§6.3 状態遷移 mermaid` のみで表現するか、§6.7 操作手順にも書くか。両方を要件化（mermaid で状態遷移、§6.7 で手順）し、片方欠落で AC fail とする。
- **論点 5**: 視覚値 0 件の実現方法。プロトタイプ JSX 内に Tailwind utility（`bg-white` 等）が現れる場合、これらは「視覚値直書き」ではなく primitive class として保持する。一方 `bg-[#xxx]` / `oklch(...)` / `12px` 等の生値は禁止する。判定基準は phase-3 grep gate（`#[0-9a-fA-F]{3,8}` / `oklch\(` / `[0-9]+px` / `bg-\[`）に一致する文字列が 0 件であること。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | task-01 scope-gate | admin 8 routes 確定 scope | route 一覧（§2〜§9 章立て） |
| 上流 | phase-1 §3 | admin route 一覧 | §1 nav 表の order |
| 上流 | phase-3 §2 | admin API endpoint surface | §X.4 API 表の正本 |
| 上流 | phase-3 §3 §5.3〜§5.7 | 派生ルール（queue / CRUD / diff / compare / timeline） | §5/§7/§8/§9 の構造 |
| 上流 | pages-admin.jsx | L1-L658 凍結正本 | §2/§3/§4/§6 の JSX ブロック |
| 下流 | Phase 2（設計） | AC-1〜9 / 論点 / 章立て確定 | §1〜§9/§99 のシグネチャ |
| 下流 | Phase 11（検証） | grep gate / API trace 要件 | evidence ファイル一覧 |

## 価値とコスト

- **初回価値**: task-15 / 16 / 17 が `09g` 単一ファイルを正本として admin 実装に着手できる。Sidebar 重複・視覚値混入・API drift を構造的に閉塞。
- **初回で払わないコスト**: 実装コード（task-15 / 16 / 17）、token 値（task-08）、primitive 定義（task-19）、icon 定義（task-22）、shell / fixtures（task-22）、運用 runbook。
- **トレードオフ**: 700〜1200 行 markdown は読解コストが高いが、§X.1〜X.8 の固定構成によりナビゲーション可能。Sidebar 集約により総行数を約 100 行圧縮できる。
- **DX トレードオフ**: 派生ルール正本転記により phase-3 と 09g に同一文が 2 箇所生じるが、09g 内の `> 派生元:` 注記で source of truth を明示し、phase-3 を必ず正本とする運用ルールで drift を防ぐ。

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | task-15/16/17 が 09g 単独で着手できるか | PASS | §1〜§9 で admin 全 routes 網羅、§X.4 で API 完全一致、§X.7 で操作手順明文化 |
| 実現性 | 凍結 構造 contract 転記 + 派生ルール転記が 1 人日で完了するか | PASS | プロトタイプ 658 行、派生ルール phase-3 §5.3〜§5.7 を 700〜1200 行に圧縮可能 |
| 整合性 | phase-3 §2 API と §X.4 が完全一致するか | PASS（gate 必要） | Phase 11 で行 diff check |
| 運用性 | 視覚値 0 件 / Sidebar 重複 0 件で運用可能か | PASS（gate 必要） | grep gate（HEX / oklch / px / bg-[）+ markdown structure check |

## AC（Acceptance Criteria）

- **AC-1**: `09g-screen-blueprints-admin.md` が新規作成され、行数 700〜1200 行（`wc -l` で確認）。
- **AC-2**: `^## 1\. AdminSidebar` が **1 箇所のみ**出現（grep で確認）。
- **AC-3**: `^## [0-9]+\. ` セクションが **9 件 + §99 = 10 件** 出現（dashboard / members / tags / meetings / schema / requests / identity-conflicts / audit / sidebar / 不採用）。
- **AC-4**: §2〜§9 各画面で X.1 / X.2 / X.3 / X.4 / X.5 / X.6 / X.7 / X.8 の 8 サブセクションが揃う（合計 64 サブセクション）。
- **AC-5**: 視覚値 grep（`#[0-9a-fA-F]{3,8}\b` / `oklch\(` / `\b[0-9]+px\b` / `\bbg-\[`）が **0 件**。
- **AC-6**: phase-3 §2 admin API（10 endpoint）と §X.4 の method/endpoint 列が **完全一致**（行 diff 0）。
- **AC-7**: 各画面 §X.6 に `role="dialog"` + `aria-modal="true"` + focus trap + Esc close の 4 文字列が出現（bulk-action / approve-reject / schema-apply 該当画面のみ）。
- **AC-8**: §6.3 状態遷移 mermaid に `diff` → `confirming` → `applied` の二段確認パスが明示。
- **AC-9**: §99 不採用要素に TweaksPanel / theme switcher / data-theme の **3 件**列挙。

## 変更対象ファイル（C/R/M/D）

| 区分 | path | 用途 |
| --- | --- | --- |
| C | `docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-01/main.md` | Phase 1 主成果物 |
| C/M | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | Phase 5〜10 の主対象。P50 で既存なら repair |
| R | task-21-w2-par-screen-blueprints-admin.md | 元仕様 |
| R | pages-admin.jsx | 転記元 |
| R | phase-1.md / phase-3.md | 上流 |

## 実行タスク

- 本 Phase の目的に対応する文書作成・検証・記録を実行する。
- 実行結果は `outputs/phase-N/` 配下へ保存し、root `artifacts.json` の該当 Phase status と整合させる。
- docs-only / NON_VISUAL のため、`apps/` / `packages/` の実装コードは本 Phase では変更しない。

## 統合テスト連携

N/A。pure docs-only / NON_VISUAL workflow のため、実装統合テストは発生しない。代替として本 Phase の grep / diff / lint / file-existence evidence を Phase 11 と Phase 12 compliance check に連携する。

## 成果物

- 本 Phase の `outputs/phase-N/main.md` または同等の phase evidence。
- 必要に応じた補助ログ・差分・チェック結果。
- root `artifacts.json` の phase status 更新。

## 入力 / 出力

- 入力: 元 task-21 仕様、phase-1 §3、phase-3 §2 §3 §5.3〜§5.7、pages-admin.jsx
- 出力: `outputs/phase-01/main.md`（AC-1〜9 / 5 論点 / 4 条件評価 / Phase 2 への open question）

## 実行コマンド

```bash
mkdir -p docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-01
# 元仕様の確認
sed -n '1,80p' docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-21-w2-par-screen-blueprints-admin.md
# プロトタイプ行数確認
wc -l docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
# P50 baseline: 既存 09g がある場合は現状を記録し、Phase 5 以降は repair として扱う
test -f docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md \
  && wc -l docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md \
  || echo "09g missing: create path"
```

## DoD

- [ ] AC-1〜9 が quantitative（行数 / 件数 / grep / 行 diff で表現）
- [ ] 真の論点 5 件と非採用案を outputs/phase-01/main.md に記録
- [ ] 4 条件評価に根拠記入
- [ ] Phase 2 open question（章立て確定 / 派生ルール抜粋粒度 / a11y 共通定義の取扱）

## 完了条件チェック

- [ ] 全実行タスク completed
- [ ] outputs/phase-01/main.md 配置
- [ ] artifacts.json の phase 1 を completed に更新
- [ ] P50 baseline（missing / existing + line count）を outputs/phase-01/main.md に記録
- [ ] 次 Phase 引き継ぎ事項記述

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-21-w2-par-screen-blueprints-admin.md | 元仕様 |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx | 凍結正本 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md | §3 admin routes |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md | §2 / §3 / §5.3〜§5.7 |

## 実行手順

### ステップ 1: 元 task-21 を全文確認
- §0.1〜§0.8 / §1〜§10 / diff scope 規律を読み、AC-1〜9 へ写像する。

### ステップ 2: AC quantitative 化
- 行数（AC-1）、件数（AC-2/3/4/9）、grep 件数（AC-5/7）、行 diff（AC-6）、mermaid キーワード（AC-8）。

### ステップ 3: 真の論点 5 件 + 4 条件評価記録
- Sidebar 集約粒度 / 派生ルール表現 / a11y 記述粒度 / schema-apply 二段確認 / 視覚値 0 件判定。

### ステップ 4: Phase 2 open question
- 章立て最終確定、派生ルール抜粋粒度（全文 vs 抜粋 + link）、§X.7 操作手順テンプレートの統一形。

## 次 Phase

- 次: Phase 2（設計）
- 引き継ぎ: AC-1〜9 / 章立て骨格 / 派生ルール正本転記方針 / a11y 必須文字列リスト
- ブロック条件: AC quantitative 化未完なら Phase 2 不可。
