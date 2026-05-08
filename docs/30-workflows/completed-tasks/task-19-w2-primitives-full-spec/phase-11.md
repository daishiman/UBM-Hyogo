# Phase 11: NON_VISUAL 縮約 smoke / grep evidence 採取

[実装区分: ドキュメントのみ]（CONST_004 例外: 純粋ドキュメント作成 task）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-19-w2-primitives-full-spec |
| Phase 番号 | 11 / 13 |
| Phase 名称 | NON_VISUAL 縮約 smoke / grep evidence 採取 |
| 作成日 | 2026-05-07 |
| 前 Phase | 10（最終レビュー） |
| 次 Phase | 12（ドキュメンテーション 6 必須タスク） |
| 状態 | completed |
| タスク種別 | docs-only |
| visibility | NON_VISUAL |
| implementation_mode | docs |
| PASS 状態 | **PASS**（runtime 不要 / 純ドキュメント / 後続 runtime 実装は task-10 へ委譲） |

## NON_VISUAL 宣言【WEEKGRD-03】

- タスク種別: **docs-only / specs 追加のみ**（task-19 primary deliverable はコード変更なし、UI 差分なし。隣接 apps/api diff は分離記録）
- 非視覚的理由: 09c-primitives.md は contract 仕様書であり、実装（task-10 ui-primitives）まで UI には反映されない。本 task の閉じる範囲では UI 差分を発生させ得ない。
- 代替証跡: `outputs/phase-11/evidence/grep-gate.log` / `markdown-lint.log` / `heading-count.log` の 3 点に絞る。
- screenshot は不要（`outputs/phase-11/screenshots/.gitkeep` を作成・コミットしない）。

## 通常 evidence の不要理由（表）

| 通常 evidence 種別 | 採否 | 不要理由 |
| --- | --- | --- |
| desktop-fullpage screenshot | N/A | UI 描画なし。09c は仕様書 |
| mobile-fullpage screenshot | N/A | 同上 |
| video walk-through | N/A | 状態遷移を持つ component を本 task で実装しない |
| Storybook snapshot | N/A | task-10 の責務 |
| wrangler / D1 実行ログ | N/A | API / D1 を触らない |
| OAuth / Magic Link smoke | N/A | auth 経路を触らない |

## 代替 evidence（3 点）

| ファイル | 役割 | PASS 条件 |
| --- | --- | --- |
| `outputs/phase-11/evidence/grep-gate.log` | task 正本 §6.2 の grep 4 件を 09c に対して実行した出力 | 4 grep すべて 0 件（HEX / oklch / px / `bg-[`）+ 末尾 `OK` |
| `outputs/phase-11/evidence/markdown-lint.log` | `pnpm lint:md docs/00-getting-started-manual/specs/09c-primitives.md` の終了ログ | error 0 件（warning は記録のみ） |
| `outputs/phase-11/evidence/heading-count.log` | §1〜§18 + §99 の heading 数 / JSX block 数の grep | `^## [0-9]+\. ` ≥ 18、`^## 99\. ` = 1、`^\`\`\`jsx$` ≥ 17 |

## 目的

09c-primitives.md の **整合性検査**（視覚値混入禁止 / heading 構造 / markdown lint）が pass し、Phase 12 ドキュメンテーション 6 必須タスクへ進める evidence を採取する。本 task は runtime 実装を持たず、PASS 状態は **PASS**（純ドキュメント）で確定する。`CONTRACT_READY_IMPLEMENTATION_PENDING` は不採用（後続実装が task-10 という別 task に明示分離されており、本 task の closure を阻害しないため）。

## 実行タスク

- §6.2 grep 4 件を 09c に対して実行し `grep-gate.log` を採取する
- markdown lint を実行し `markdown-lint.log` を採取する
- heading 数 / JSX block 数を grep し `heading-count.log` を採取する
- `outputs/phase-11/main.md` に 3 evidence への index link と PASS 宣言を記述する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md | §6.2 grep 4 件の正本 |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | 検査対象 |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | NON_VISUAL 縮約テンプレ |
| 参考 | outputs/phase-10/final-review-result.md | gate 結果 |

## 実行手順

### ステップ 1: grep gate 採取（task 正本 §6.2 の 4 件）

```bash
F=docs/00-getting-started-manual/specs/09c-primitives.md
{
  echo "# grep-gate.log"
  echo "## 1. HEX"
  grep -nE '#[0-9a-fA-F]{3,8}\b' "$F" || echo "(0 件)"
  echo "## 2. oklch()"
  grep -nE 'oklch\(' "$F" || echo "(0 件)"
  echo "## 3. px"
  grep -nE '\b[0-9]+px\b' "$F" || echo "(0 件)"
  echo "## 4. bg-["
  grep -nE '\bbg-\[' "$F" || echo "(0 件)"
  echo OK
} > outputs/phase-11/evidence/grep-gate.log
```

PASS 条件: 末尾 `OK` 出力 + 4 grep すべて `(0 件)` で揃う。

### ステップ 2: markdown lint

```bash
mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09c-primitives.md \
  > outputs/phase-11/evidence/markdown-lint.log 2>&1 || true
```

PASS 条件: error 0 件。warning が出ても PASS とするが `main.md` に件数記録。

### ステップ 3: heading / JSX block 数

```bash
F=docs/00-getting-started-manual/specs/09c-primitives.md
{
  echo "## heading count"
  echo "primitive headings: $(grep -cE '^## [0-9]+\. ' "$F")"
  echo "section 99 headings: $(grep -cE '^## 99\. ' "$F")"
  echo "jsx blocks: $(grep -cE '^```jsx$' "$F")"
} > outputs/phase-11/evidence/heading-count.log
```

PASS 条件: numbered headings >= 19、§99 = 1、jsx blocks >= 17。

### ステップ 4: main.md / 申し送りの記述

- `outputs/phase-11/main.md` に PASS 宣言・3 evidence への link・「runtime 実装は task-10 で別途実施」を明記。
- `unassigned-task-detection.md`（Phase 12）への申し送り対象は本 task では **0 件**（task-10 が既に存在するため）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | gate 結果を入力として参照 |
| Phase 12 | 3 evidence を `phase12-task-spec-compliance-check.md` の根拠として参照 |
| task-10（ui-primitives） | 09c の DoD PASS 状態を実装着手前提として引き継ぎ |

## 多角的チェック観点（AIが判断）

- 価値性: 視覚値 0 件によって 09b（token 値）の正本性が壊れていないか。
- 実現性: heading / JSX block 数が DoD § 8 と一致するか。
- 整合性: markdown lint error 0 が再現可能（決定論的）か。
- 運用性: 3 evidence ファイルが workflow root から参照可能 path に置かれているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | grep gate 採取 | 11 | pending | §6.2 の 4 件 |
| 2 | markdown lint 実行 | 11 | pending | error 0 確認 |
| 3 | heading / JSX block 数 grep | 11 | pending | §1〜§18 + §99 + 17 jsx |
| 4 | main.md に PASS 宣言 + index link | 11 | pending | NON_VISUAL 宣言 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | NON_VISUAL 宣言 + PASS 宣言 + 3 evidence への index link |
| ログ | outputs/phase-11/evidence/grep-gate.log | task 正本 §6.2 grep 4 件の出力 |
| ログ | outputs/phase-11/evidence/markdown-lint.log | markdown lint 結果 |
| ログ | outputs/phase-11/evidence/heading-count.log | heading / JSX block 数 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] `grep-gate.log` が 4 grep すべて 0 件 + 末尾 `OK` で生成済み
- [ ] `markdown-lint.log` が error 0 で生成済み
- [ ] `heading-count.log` が DoD 期待値（≥ 18 / =1 / ≥ 17）に一致
- [ ] `main.md` に PASS 宣言 + 3 evidence への link + 「runtime 実装は task-10 委譲」の明記がある
- [ ] screenshot 関連 path（`outputs/phase-11/screenshots/`）を作成していない

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系（grep に違反 1 件以上 / lint error / heading 数不足）も検証済み
- [ ] 次 Phase への引き継ぎ事項を記述
- [ ] artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 12（ドキュメンテーション 6 必須タスク）
- 引き継ぎ事項: 3 evidence と PASS 宣言を Phase 12 `phase12-task-spec-compliance-check.md` の根拠として渡す。
- ブロック条件: いずれかの evidence で違反が検出された場合、Phase 9（QA）または Phase 6（実装）に差し戻し。

## 失敗時の戻り先（逆引き表）

| 問題 | 戻り先 |
| --- | --- |
| HEX / oklch / px / `bg-[` 残存 | Phase 6（09c 本文修正） |
| markdown lint error | Phase 6（heading / 表 / code fence 修正） |
| heading 数不足 | Phase 5（章立て再設計） |
| JSX block 数不足 | Phase 6（primitives.jsx 転記漏れ補完） |

## NON_VISUAL 代替 evidence 差分表

| 通常想定シナリオ | 元前提 | 代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| primitive を画面で目視 | UI 実装あり | task-10 で実装後に 09e/09f/09g（task-20-22）で目視 | 視覚 mapping は task-20-22 | 採用例 § 番号確定 |
| keyboard / aria 動作確認 | runtime あり | 09c §X.4 a11y 仕様の 文書整合のみ | 仕様文書一致 | task-10 実装時の vitest / playwright |
| token 値が画面に反映 | css runtime | 09b（task-08）と 09c §X.5 token 名 1:1 一致 | 名前のみ | task-10 実装で値解決 |
