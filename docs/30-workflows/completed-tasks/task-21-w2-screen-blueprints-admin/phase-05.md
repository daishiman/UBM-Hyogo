# Phase 5: TDD GREEN（§1 AdminSidebar 集約）

[実装区分: ドキュメントのみ]
判定根拠: 仕様書 markdown ファイルへの記述追加のみ。`apps/` への code 変更なし。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-21-w2-screen-blueprints-admin |
| Phase 番号 | 5 / 13 |
| Phase 名称 | TDD GREEN（§1 集約） |
| Wave | W2 (parallel) |
| Mode | sequential / docs-only / NON_VISUAL |
| 作成日 | 2026-05-07 |
| 前 Phase | 4（TDD RED） |
| 次 Phase | 6（実装-本体1） |
| 状態 | completed |

## 目的

`09g-screen-blueprints-admin.md` を新規作成し、§1 AdminSidebar 集約セクションを 1.1〜1.4 まで完成させる。
本 Phase 完了時点で「§1 AdminSidebar 1 箇所のみ」AC-2 が pass し、§2〜§9 はスケルトンのみ存在する状態になる。

## 主要意思決定

- **決定 1**: 09g の冒頭に preface（タスク概要 / 不変条件 / 章立て目次）を 30〜50 行で配置する。
- **決定 2**: §1 はプロトタイプの AdminLayout 内 sidebar JSX を構造 contract 転記する。
- **決定 3**: §2〜§9 / §99 の見出し（`## N. <route>`）と Sidebar 参照リンク行のみをスケルトンとして配置し、本文は Phase 6〜8 で埋める。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 2 | section-signature.md / transcription-map.md | §1 構成 / §2〜§9 見出し |
| 上流 | pages-admin.jsx | AdminLayout sidebar JSX | §1.1 転記元 |
| 下流 | Phase 6 | §1 完成 / §2〜§9 スケルトン | §2 §3 着手の baseline |

## 変更対象ファイル（C/R/M/D）

| 区分 | path | 用途 |
| --- | --- | --- |
| C | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | 新規作成（preface + §1 + §2〜§9 §99 見出しスケルトン） |
| C | `outputs/phase-05/main.md` | GREEN Phase 主成果物 |
| C | `outputs/phase-05/green-log.txt` | 検証スクリプト出力 |

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

- 入力: pages-admin.jsx AdminLayout sidebar block, Phase 2 section-signature.md
- 出力: 09g（preface + §1 完成 + §2〜§9 §99 スケルトン）, green-log.txt

## テスト方針

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
# AC-2: §1 AdminSidebar 1 箇所
[ "$(grep -c '^## 1\. AdminSidebar' "$F")" = "1" ] && echo PASS || echo FAIL
# §1.1〜1.4 サブセクション 4 件
[ "$(grep -cE '^### 1\.[1-4] ' "$F")" = "4" ] && echo PASS || echo FAIL
# §2〜§9 + §99 見出し 9 件
[ "$(grep -cE '^## [2-9]\. |^## 99\. ' "$F")" = "9" ] && echo PASS || echo FAIL
# 視覚値 0 件（既に守られていることを確認）
! grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|\b[0-9]+px\b|\bbg-\[' "$F" && echo PASS || echo FAIL
```

## 実行コマンド

```bash
mkdir -p docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-05
# pages-admin.jsx の AdminLayout sidebar 行範囲を確認
grep -nE 'AdminLayout|<aside|<nav' docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx | head -20
# 09g 新規作成（編集ツールで preface + §1 + skeleton を投入）
$EDITOR docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
```

## DoD

- [ ] 09g が新規作成され preface が記述
- [ ] §1.1 prototype 由来 構造 contract 転記
- [ ] §1.2 nav 表（8 行 = Dashboard / Members / Tags / Meetings / Schema / Requests / IdentityConflicts / Audit）
- [ ] §1.3 active state（aria-current="page" + focus-visible）
- [ ] §1.4 token / icon 参照（09c §9 / 09d §X / 09b §X）
- [ ] §2〜§9 §99 見出しスケルトン配置
- [ ] §2〜§9 各冒頭に「Sidebar は §1 を参照」リンク文字列
- [ ] 視覚値 grep 0 件
- [ ] green-log.txt に検証結果記録

## 完了条件チェック

- [ ] outputs/phase-05/main.md / green-log.txt 配置
- [ ] artifacts.json の phase 5 を completed
- [ ] 次 Phase 引き継ぎ事項記述

## 参照資料

- pages-admin.jsx（AdminLayout 内 sidebar block）
- task-21 §4.3（§1 集約サンプル）
- Phase 2 outputs（section-signature.md）

## 実行手順

### ステップ 1: 09g 新規作成
preface（タスク概要 / 不変条件 / 目次）を記述。

### ステップ 2: §1.1〜§1.4 記述
pages-admin.jsx の sidebar JSX を構造 contract 転記、nav 表 / active state / token 参照を埋める。

### ステップ 3: §2〜§9 §99 見出しスケルトン
`## N. <route>` 行と「Sidebar は §1 を参照」行のみを配置。

### ステップ 4: 検証実行
Phase 3 check-commands を走らせ green-log.txt に保存。AC-2 / 視覚値 0 件が pass することを確認。

## 次 Phase

- 次: Phase 6（実装-本体1: §2 dashboard / §3 members）
- 引き継ぎ: 09g preface / §1 完成版 / §2〜§9 スケルトン
- ブロック条件: §1 AdminSidebar 集約が pass しない場合は Phase 6 不可。
