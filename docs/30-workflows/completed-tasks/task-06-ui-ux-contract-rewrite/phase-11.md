# Phase 11: 手動 smoke（NON_VISUAL 縮約）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-06-ui-ux-contract-rewrite |
| Wave | 2 |
| 実行種別 | parallel |
| Phase 番号 | 11 / 13 |
| 作成日 | 2026-05-07 |
| 上流 Phase | 10 (最終レビュー) |
| 下流 Phase | 12 (ドキュメント更新) |
| visualEvidence | NON_VISUAL |
| 状態 | completed |

## 目的

本タスクは markdown 1 ファイル（`docs/00-getting-started-manual/specs/09-ui-ux.md`）の全面書き換えを主成果物とする implementation / NON_VISUAL タスクであり、ブラウザ画面・UI screenshot を生成しない。Phase 11 は NON_VISUAL 縮約テンプレートに従い、screenshot に代えて以下 4 種の代替 evidence を `outputs/phase-11/evidence/` 配下に格納する形で完了とする。

- grep gate ログ（視覚詳細混入禁止 §6.2 の 4 種 grep）
- markdown lint ログ（章構造 / link 健全性）
- trace check ログ（phase-3 §2 API 接続表との完全一致）
- structure check ログ（章構造件数）

加えて、レビュアーは markdown rendering 結果（`### 2.1.1` 〜 `### 2.4.4` 19 routes 契約表 + `#### 3.1.x / 3.2.x` primitive 表 + §5 a11y 契約）を目視で 1 個ずつ確認する。

## NON_VISUAL 縮約テンプレ準拠の evidence 構造

| 区分 | path | 取得方法 |
| --- | --- | --- |
| canonical evidence | `outputs/phase-11/evidence/grep-gate.log` | §6.2 の 4 種 grep を順次実行・stdout/stderr を tee |
| canonical evidence | `outputs/phase-11/evidence/markdown-lint.log` | `mise exec -- pnpm lint:md` の出力 |
| canonical evidence | `outputs/phase-11/evidence/trace-check.log` | `diff <(extract_api_table phase-3) <(extract_api_table 09-ui-ux)` |
| 補助 | `outputs/phase-11/evidence/structure-check.log` | `grep -c "^## " / "^### 2\\."` の章構造件数記録 |
| 補助 | `outputs/phase-11/phase-11-non-visual-alternative-evidence.md` | 上記 4 ログの所在と判定基準を集約した代替 evidence サマリ |

> visual evidence（PNG / screenshot）は **作成しない**。`outputs/phase-11/screenshots/` ディレクトリも作らない。

## 実行タスク

1. grep gate スクリプトの整備と実行（HEX / oklch / px / `bg-[`）
2. markdown lint 実行
3. phase-3 §2 と新 §2 routes 契約の API 列 trace check
4. 章構造（§1〜§10 / 19 routes / primitives）の件数 grep
5. レビュアー目視チェックリスト（19 routes + a11y §5 4 章）
6. `outputs/phase-11/evidence/` に 4 ログ配置
7. `outputs/phase-11/phase-11-non-visual-alternative-evidence.md` 作成
8. `outputs/phase-11/main.md` 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | smoke 手順 |
| 必須 | outputs/phase-04/verify-matrix.md | 検証項目 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md | trace check の正本 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-06-w2-par-ui-ux-contract-rewrite.md §6 | テスト方針 |

## 実行手順

### ステップ 1: grep gate

```bash
F=docs/00-getting-started-manual/specs/09-ui-ux.md
{
  echo "=== HEX ===";   grep -nE '#[0-9a-fA-F]{3,8}\b' "$F" || echo "0 hits"
  echo "=== oklch ==="; grep -nE 'oklch\(' "$F" || echo "0 hits"
  echo "=== px ===";    grep -nE '\b[0-9]+px\b' "$F" || echo "0 hits"
  echo "=== bg-[ ===";  grep -nE '\bbg-\[' "$F" || echo "0 hits"
} | tee outputs/phase-11/evidence/grep-gate.log
```

判定: 4 種すべて `0 hits` であること。

### ステップ 2: markdown lint

```bash
mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09-ui-ux.md \
  | tee outputs/phase-11/evidence/markdown-lint.log
```

判定: error 0。

### ステップ 3: trace check（phase-3 §2 ↔ 09-ui-ux §2）

```bash
# phase-3 §2 の routes × endpoint × method の 3 タプル抽出と
# 09-ui-ux §2 の API 列抽出を diff
bash scripts/trace-09-ui-ux-api.sh \
  | tee outputs/phase-11/evidence/trace-check.log
```

判定: diff の差分行 0。

### ステップ 4: 章構造件数

```bash
{
  echo "## count:";   grep -c '^## '   docs/00-getting-started-manual/specs/09-ui-ux.md
  echo "### 2. count:"; grep -c '^### 2\.' docs/00-getting-started-manual/specs/09-ui-ux.md
  echo "#### 3.1 count:"; grep -c '^#### 3\.1\.' docs/00-getting-started-manual/specs/09-ui-ux.md
} | tee outputs/phase-11/evidence/structure-check.log
```

判定: `## ` = 10、`### 2.` = 19+、`#### 3.1.` = 13。

### ステップ 5: レビュアー目視

| # | 観点 | 判定基準 |
| --- | --- | --- |
| 1 | 19 routes 表 1 個ずつ目視 | 列構成（10 列）が全 routes で同一 |
| 2 | §5.1 全画面共通 a11y | landmark / heading / focus 記述 |
| 3 | §5.2 dialog / drawer | role + aria-modal + focus trap + Esc |
| 4 | §5.3 form / input | label 連結 + required + error 連結 |
| 5 | §5.4 live region | status / alert role 記述 |

### ステップ 6: NON_VISUAL 代替 evidence サマリ作成

`outputs/phase-11/phase-11-non-visual-alternative-evidence.md` に上記 5 ステップの判定結果と canonical log path を集約。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | implementation-guide.md に evidence path を引用 |
| Phase 13 | PR description に NON_VISUAL evidence サマリ link を貼る |

## 多角的チェック観点（不変条件参照）

- **元仕様 §0.5 #4**（視覚詳細値 0 件）: grep-gate.log で確認
- **元仕様 §0.5 #6**（login 5 状態正本化）: 目視で §4.2 が 5 行であること
- **元仕様 §0.5 #7**（dialog WAI-ARIA）: 目視で §5.2 にカバー
- **CLAUDE.md #5**（D1 直接禁止）: trace-check.log の API 列に apps/api endpoint のみ記録

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | grep gate 実行 | 11 | completed | 4 種 0 hits |
| 2 | repository lint | 11 | completed | exit 0 |
| 3 | trace check | 11 | completed | route / API / method 対応 PASS |
| 4 | 章構造件数 | 11 | completed | 10 / 19+ / 13 |
| 5 | レビュアー目視 5 観点 | 11 | completed | チェックリスト |
| 6 | 代替 evidence サマリ | 11 | completed | NON_VISUAL 専用 |
| 7 | outputs/phase-11/main.md | 11 | completed | 集約 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 結果サマリー |
| ドキュメント | outputs/phase-11/phase-11-non-visual-alternative-evidence.md | NON_VISUAL 代替 evidence サマリ |
| evidence | outputs/phase-11/evidence/grep-gate.log | §6.2 grep 4 種ログ |
| evidence | outputs/phase-11/evidence/markdown-lint.log | markdown lint ログ |
| evidence | outputs/phase-11/evidence/trace-check.log | phase-3 §2 trace |
| evidence | outputs/phase-11/evidence/structure-check.log | 章構造件数 |
| メタ | artifacts.json | Phase 11 を completed |

## 完了条件

- [x] grep gate 4 種 0 hits（HEX / oklch / px / `bg-[`）
- [x] repository lint exit 0
- [x] trace check PASS
- [x] 章構造件数 PASS（## = 10 / ### 2. ≥ 19 / #### 3.1. = 13）
- [x] レビュアー目視 5 観点 PASS
- [x] 代替 evidence サマリ配置済み
- [x] visual screenshot を **作成していない**

## タスク 100% 実行確認【必須】

- [x] 全 7 サブタスク completed
- [x] outputs/phase-11/evidence/ に 4 ログ配置
- [x] outputs/phase-11/main.md と phase-11-non-visual-alternative-evidence.md 配置
- [x] artifacts.json 更新

## 次 Phase

- 次: Phase 12（ドキュメント更新）
- 引き継ぎ事項: 4 evidence path → implementation-guide.md
- ブロック条件: 4 evidence のいずれかが判定不合格

## NON_VISUAL 宣言

本 phase は visual evidence を**取得しない**。理由:

1. 成果物は markdown 1 ファイルのみで、UI 画面 / browser screenshot を生成しない
2. プロトタイプ画面は `docs/00-getting-started-manual/claude-design-prototype/` に既存・本 task で変更しない
3. 視覚詳細の正本は task-07（09a）/ task-08（09b）/ Storybook（task-10 以降）に分離委譲済み

代替 evidence: 上記 canonical log 4 種 + レビュアー目視。
