# Phase 7: 実装-本体2（§4 tags / §5 meetings / §6 schema）

[実装区分: ドキュメントのみ]
判定根拠: 09g への記述追加のみ。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-21-w2-screen-blueprints-admin |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 実装-本体2（tags / meetings / schema） |
| Wave | W2 (parallel) |
| Mode | sequential / docs-only / NON_VISUAL |
| 作成日 | 2026-05-07 |
| 前 Phase | 6（§2 / §3 完成） |
| 次 Phase | 8（実装-本体3） |
| 状態 | completed |

## 目的

09g の §4 tags（プロトタイプ掲載）/ §5 meetings（未掲載派生）/ §6 schema（プロトタイプ掲載・二段確認）を 8 サブセクション完成形で埋める。
本 Phase 完了時点で 5 画面分（§2〜§6）の §X.1〜X.8 が揃い、AC-4 の合計 64 のうち 40 サブセクションが pass する。

## 主要意思決定

- **決定 1**: §4 tags は AdminTagsPage（L369-L507）を §4.1 に転記し、approve / reject confirm を §4.7 に明文化。
- **決定 2**: §5 meetings は phase-3 §3 §5.4 admin CRUD 派生ルールを §5 冒頭に `> 派生元: phase-3 §3 §5.4` で明示し、DataTable + Form Modal で構成。
- **決定 3**: §6 schema は SchemaDiffPage（L508-L657）を §6.1 に転記し、§6.3 mermaid に「diff 表示 → apply confirm」の **二段確認** を必須記述（AC-8）。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 6 | §2 / §3 完成 | §4〜§6 着手 baseline |
| 上流 | pages-admin.jsx L369-L657 | JSX 正本 | §4.1 / §6.1 |
| 上流 | phase-3 §3 §5.4 | admin CRUD 派生 | §5（meetings） |
| 上流 | phase-3 §2 | API 表 | §4.4 / §5.4 / §6.4 |

## 変更対象ファイル（C/R/M/D）

| 区分 | path | 用途 |
| --- | --- | --- |
| M | `09g-screen-blueprints-admin.md` | §4 / §5 / §6 本文埋め |
| C | `outputs/phase-07/main.md` | Phase 7 主成果物 |
| C | `outputs/phase-07/check-log.txt` | 検証 |

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

- 入力: pages-admin.jsx L369-L657, phase-3 §3 §5.4, phase-3 §2
- 出力: 09g §4 / §5 / §6 完成、check-log.txt

## §4 / §5 / §6 必須記述

### §4 /(admin)/admin/tags（プロトタイプ掲載）

| サブ § | 必須内容 |
| --- | --- |
| 4.1 | AdminTagsPage L369-L507 JSX 一字一句 |
| 4.2 | 左 list / 右 detail のコピー原文、approve / reject confirm 文言 |
| 4.3 | mermaid: idle → loading → success → confirming → success / error |
| 4.4 | `GET /admin/tags` / `POST /admin/tags/:id/approve` / `POST /admin/tags/:id/reject` |
| 4.5 | tags / selectedTagId / detailTag / confirmAction |
| 4.6 | confirm Modal `role="dialog"` + `aria-modal="true"` + focus trap + Esc close |
| 4.7 | 1. 左 list 選択 → 2. 右 detail 表示 → 3. approve / reject 押下 → 4. confirm Modal → 5. 確定 → API → 6. toast + 再取得 |
| 4.8 | 09c § / 09b / 09d / 09a 参照 |

### §5 /(admin)/admin/meetings（未掲載 → phase-3 §3 §5.4 admin CRUD 派生）

冒頭注記: `> 派生元: phase-3 §3 §5.4 admin CRUD`

| サブ § | 必須内容 |
| --- | --- |
| 5.1 | phase-3 §5.4 派生ルール正本転記（DataTable + Form Modal CRUD） |
| 5.2 | コピー原文（CRUD button label / form field / confirm 文言） |
| 5.3 | mermaid: idle → loading → success → editing（form open）→ confirming → success / error |
| 5.4 | `GET /admin/meetings` / `POST /admin/meetings` |
| 5.5 | meetings / formOpen / formData |
| 5.6 | Form Modal `role="dialog"` + `aria-modal="true"` + focus trap + Esc close |
| 5.7 | 1. 一覧表示 → 2. 新規作成 button → 3. Form Modal → 4. 確認 → POST → 5. toast + 再取得 |
| 5.8 | 参照 |

### §6 /(admin)/admin/schema（プロトタイプ掲載・二段確認）

| サブ § | 必須内容 |
| --- | --- |
| 6.1 | SchemaDiffPage L508-L657 JSX 一字一句 |
| 6.2 | コピー原文（diff label / apply button / 二段 confirm 文言） |
| 6.3 | **二段確認 mermaid**: idle → loading_diff → diff（表示）→ confirming（apply）→ applying → applied / error（AC-8 該当） |
| 6.4 | `GET /admin/schema/diff` / `POST /admin/schema/apply` |
| 6.5 | diff / confirmStage / applying |
| 6.6 | apply confirm Modal a11y（4 文字列） |
| 6.7 | 1. diff 表示 → 2. apply button → 3. **第 1 段 confirm**（diff 内容再確認）→ 4. **第 2 段 confirm**（最終確定）→ 5. POST → 6. applied 表示 |
| 6.8 | 参照 |

## テスト方針

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
# §4〜§6 サブセクション 24 件
[ "$(grep -cE '^### [4-6]\.[1-8] ' "$F")" = "24" ] && echo PASS || echo FAIL
# 派生元注記（§5）
grep -c '^> 派生元: phase-3 §3 §5\.4' "$F"  # 期待: 1
# §6.3 二段確認キーワード
awk '/^### 6\.3 / {flag=1; next} /^### 6\.4 / {flag=0} flag' "$F" \
  | grep -cE 'diff|confirming|applied'  # 期待: >= 3
# §4.6 / §6.6 a11y 4 文字列
awk '/^### [46]\.6 / {flag=1; next} /^### [46]\.7 / {flag=0} flag' "$F" \
  | grep -cE 'role="dialog"|aria-modal="true"|focus trap|Esc close'  # 期待: >= 8
# API 表
grep -cE '/admin/tags|/admin/meetings|/admin/schema/(diff|apply)' "$F"  # 期待: >= 5
# 視覚値 0 件
! grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|\b[0-9]+px\b|\bbg-\[' "$F"
```

## 実行コマンド

```bash
mkdir -p docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-07
sed -n '369,507p' docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx > /tmp/tags-jsx.txt
sed -n '508,657p' docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx > /tmp/schema-jsx.txt
$EDITOR docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
```

## DoD

- [ ] §4 tags: 8 サブセクション完成 + a11y 4 文字列
- [ ] §5 meetings: 派生元注記 + 8 サブセクション + Form Modal a11y
- [ ] §6 schema: 8 サブセクション + §6.3 二段確認 mermaid + §6.7 二段手順
- [ ] §4 / §5 / §6 視覚値 0 件
- [ ] check-log.txt に検証結果

## 完了条件チェック

- [ ] outputs/phase-07/main.md / check-log.txt 配置
- [ ] artifacts.json の phase 7 を completed
- [ ] 次 Phase 引き継ぎ事項記述

## 参照資料

- pages-admin.jsx L369-L657
- phase-3 §3 §5.4 admin CRUD
- task-21 §4.5（派生ルール表）
- task-21 §0.5 不変条件 6 / 7（confirm Modal a11y / schema 二段確認）

## 実行手順

### ステップ 1: §4 tags 完成
構造 contract 転記 + approve / reject confirm 手順を §4.6 / §4.7 に明文化。

### ステップ 2: §5 meetings 完成（派生）
冒頭に `> 派生元: phase-3 §3 §5.4` 注記、DataTable + Form Modal 構成。

### ステップ 3: §6 schema 完成
構造 contract 転記 + §6.3 二段確認 mermaid + §6.7 二段手順を必須記述。

### ステップ 4: 検証
a11y 文字列カウント / 二段確認キーワード / API endpoint カウントを check-log に保存。

## 次 Phase

- 次: Phase 8（実装-本体3: §7 / §8 / §9 / §99）
- 引き継ぎ: §4 / §5 / §6 完成版
- ブロック条件: §6.3 二段確認 mermaid 未記述なら Phase 8 不可。
