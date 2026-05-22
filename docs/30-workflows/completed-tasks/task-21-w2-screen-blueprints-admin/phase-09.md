# Phase 9: リファクタ・最適化

[実装区分: ドキュメントのみ]
判定根拠: 09g markdown の重複除去 / リンク統一 / 行数調整のみ。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-21-w2-screen-blueprints-admin |
| Phase 番号 | 9 / 13 |
| Phase 名称 | リファクタ・最適化 |
| Wave | W2 (parallel) |
| Mode | sequential / docs-only / NON_VISUAL |
| 作成日 | 2026-05-07 |
| 前 Phase | 8（§7 / §8 / §9 / §99 完成） |
| 次 Phase | 10（段階的有効化） |
| 状態 | completed |

## 目的

09g の品質を 700〜1200 行 / Sidebar 重複 0 件 / 09c-09a 参照リンクの統一形 / mermaid block 8 件以上、の 4 観点で最終調整する。
本 Phase 完了時点で AC-1（行数 700〜1200）/ AC-2（Sidebar 1 箇所）が確定し、Phase 10 段階的有効化に進める品質基盤を固める。

## 主要意思決定

- **決定 1**: §2〜§9 各冒頭の「Sidebar は §1 を参照（本 § では再記述しない）」文言を一字一句統一する。
- **決定 2**: §X.8 参照リンク形式を `- primitive: 09c §<番号> / token: 09b §<番号> / icon: 09d §<番号> / mapping: 09a §<番号>` に統一。
- **決定 3**: 行数が 1200 行を超えた場合、コピー原文（X.2）と props/state（X.5）から冗長行を削減（構造 contract 転記 X.1 と派生ルール X.1 は削減対象外）。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 8 | 09g 全 10 セクション完成 | リファクタ後 09g |
| 下流 | Phase 10 | リファクタ済 09g | 段階的有効化対象 |

## 変更対象ファイル（C/R/M/D）

| 区分 | path | 用途 |
| --- | --- | --- |
| M | `09g-screen-blueprints-admin.md` | 重複除去・リンク統一・行数調整 |
| C | `outputs/phase-09/main.md` | リファクタ報告 |
| C | `outputs/phase-09/refactor-diff.md` | 変更点列挙 |

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

- 入力: Phase 8 完成 09g
- 出力: refactor 後 09g、refactor-diff.md

## テスト方針

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
# AC-1 行数
L=$(wc -l < "$F"); [ "$L" -ge 700 ] && [ "$L" -le 1200 ] && echo "PASS ($L)" || echo "FAIL ($L)"
# AC-2 Sidebar 1 箇所
[ "$(grep -c '^## 1\. AdminSidebar' "$F")" = "1" ] && echo PASS || echo FAIL
# Sidebar 参照文言統一（§2〜§9 各冒頭で同一文字列）
grep -c 'Sidebar は §1 を参照' "$F"  # 期待: 8
# 参照リンク統一（§X.8 で 4 種類リンク出現）
awk '/^### [2-9]\.8 / {flag=1; next} /^### / {flag=0} flag' "$F" \
  | grep -cE '09[abcd]'  # 期待: >= 32（8 画面 × 4 種類）
# mermaid block
[ "$(grep -c '^```mermaid$' "$F")" -ge "8" ] && echo PASS || echo FAIL
# 視覚値 0 件
! grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|\b[0-9]+px\b|\bbg-\[' "$F"
```

## 実行コマンド

```bash
mkdir -p docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-09
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
wc -l "$F"
grep -c 'Sidebar は §1 を参照' "$F"
$EDITOR "$F"
```

## DoD

- [ ] 行数 700〜1200 に収まる
- [ ] §2〜§9 冒頭の Sidebar 参照文言 8 箇所が完全一致
- [ ] §X.8 参照リンク形式 4 種類（09a / 09b / 09c / 09d）が全画面で出現
- [ ] mermaid block 8 件以上
- [ ] 視覚値 0 件継続
- [ ] refactor-diff.md に変更点列挙

## 完了条件チェック

- [ ] outputs/phase-09/main.md / refactor-diff.md 配置
- [ ] artifacts.json の phase 9 を completed
- [ ] 次 Phase 引き継ぎ事項記述

## 参照資料

- task-21 §0.5 不変条件 5（Sidebar 集約）
- task-21 §4.4（参照ルール）
- Phase 3 check-commands.md

## 実行手順

### ステップ 1: 行数確認
`wc -l` で行数を測り、1200 超なら X.2 / X.5 を圧縮。

### ステップ 2: Sidebar 参照文言統一
§2〜§9 冒頭の 8 行を `> Sidebar は §1 を参照（本 § では再記述しない）` に揃える。

### ステップ 3: 参照リンク統一
§X.8 を `- primitive: 09c § / token: 09b § / icon: 09d § / mapping: 09a §` 形式に揃える。

### ステップ 4: mermaid count 確認
8 件以上を確認。不足画面があれば X.3 を補完。

### ステップ 5: refactor-diff.md 作成
変更点（行数調整 / 文言統一 / リンク統一）を列挙。

## 次 Phase

- 次: Phase 10（段階的有効化）
- 引き継ぎ: refactor 済 09g / refactor-diff.md
- ブロック条件: 行数範囲外 / Sidebar 重複 / mermaid 不足のいずれかなら Phase 10 不可。
