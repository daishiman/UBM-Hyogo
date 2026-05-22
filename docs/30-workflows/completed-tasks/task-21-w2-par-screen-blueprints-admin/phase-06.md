# Phase 06: コードレビュー（task-21-w2-par-screen-blueprints-admin）

[実装区分: ドキュメントのみ]

> 判定根拠注記: 成果物は `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` の新規作成のみで、コード変更を一切伴わない pure docs タスクのため、CONST_004 の例外条件に該当する。本 Phase は「コードレビュー」を spec レビュー（一字一句一致 / API 一致 / Sidebar 集約）に読み替える。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-21-w2-par-screen-blueprints-admin` |
| Phase | 06 / 13（spec レビュー） |
| 推定工数 | 0.05 人日 |
| 依存 Phase | Phase 05 |
| 並列性 | 不可 |
| タスク種別 | `docs-only` / `NON_VISUAL` |
| 改訂日 | 2026-05-07 |

---

## 0. 自己完結コンテキスト

09g 本体の執筆完了後、レビュー観点（コピー文言維持 / current API 表一致 / Sidebar §1 集約 / confirm Modal 記述 / 派生 4 画面の primitive 制約）に従って目視＋簡易 grep 検証を行う。Phase 07 自動テストの前段ゲート。

---

## 1. 目的

09g spec が Phase 03 設計と Phase 04 実装計画に整合しているか、人間目視で検証する。

---

## 2. レビュー観点

### 2.1 構造観点

| ID | 観点 | 確認方法 |
|----|------|---------|
| R-01 | §1〜§9 + §99 = 10 セクションが揃う | `grep -cE '^## [0-9]+\. ' specs/09g-screen-blueprints-admin.md` → 10 |
| R-02 | §1 AdminSidebar が 1 箇所のみ | `grep -c '^## 1\. AdminSidebar' specs/09g-...` → 1 |
| R-03 | §X (X=2..9) が `## X. <route>` 形式 | 目視 |
| R-04 | 各 §X に 8 サブセクション X.1〜X.8 が存在 | `grep -E '^### [0-9]+\.[0-9]+'` → 64+ 行（8 × 8 = 64） |

### 2.2 内容観点

| ID | 観点 | 確認方法 |
|----|------|---------|
| R-05 | プロトタイプ掲載 4 画面（§2/3/4/6）の §X.1 に `pages-admin.jsx` 行範囲が明記 | 目視 + `grep -nE 'L[0-9]+-L[0-9]+'` |
| R-06 | プロトタイプ掲載 4 画面の §X.1 に prototype 由来説明 | 目視 |
| R-07 | コピー文言が維持され、視覚値 literal は token 名へ正規化 | verify script + 目視 |
| R-08 | 未掲載 4 画面（§5/7/8/9）冒頭に `> 派生元: phase-3 §3 §5.x` | `grep -c '> 派生元: phase-3'` ≥ 4 |
| R-09 | API 表が current admin API contract と一致 | endpoint grep gate（Phase 07 で機械化） |
| R-10 | mermaid block 8 件以上 | `grep -c '^```mermaid$'` ≥ 8 |

### 2.3 a11y / 操作観点

| ID | 観点 | 確認方法 |
|----|------|---------|
| R-11 | bulk-action / queue resolve confirm Modal の `role="dialog"` + `aria-modal="true"` + focus trap + Esc close | `grep -c 'role="dialog"'` ≥ 4（§3/§4/§7/§8 想定） |
| R-12 | schema alias apply 二段確認が §6.3 mermaid + §6.7 操作手順の双方に明記 | 目視 |
| R-13 | 各画面 §X.7 操作手順が 3〜5 ステップ | 目視 |

### 2.4 視覚値・link 観点

| ID | 観点 | 確認方法 |
|----|------|---------|
| R-14 | HEX 直書き 0 件 | `grep -nE '#[0-9a-fA-F]{3,8}\b'` → 0 |
| R-15 | oklch( 0 件 | `grep -nE 'oklch\('` → 0 |
| R-16 | px 数値 0 件 | `grep -nE '\b[0-9]+px\b'` → 0 |
| R-17 | `bg-[` 任意色 0 件 | `grep -nE '\bbg-\['` → 0 |
| R-18 | 各画面 §X.8 で 09a / 09b / 09c / 09d への link が揃う | `grep -E '09[abcd]\b' \| wc -l` ≥ 32（4 link × 8 画面） |
| R-19 | §1.4 で primitive 09c §9 / icon 09d / token 名参照 | 目視 |

### 2.5 派生制約観点

| ID | 観点 | 確認方法 |
|----|------|---------|
| R-20 | §5/§7/§8/§9 で新規 primitive を生成していない（09c 既存組合せのみ） | 目視: primitive 名が 09c §1〜§9 範囲内か |
| R-21 | §99 に TweaksPanel / theme switcher / data-theme の 3 件 | 目視 |

---

## 3. レビュー手順

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md

# 構造
grep -cE '^## [0-9]+\. ' "$F"            # 10 期待
grep -c '^## 1\. AdminSidebar' "$F"      # 1 期待
grep -E '^### [0-9]+\.[0-9]+' "$F" | wc -l  # 64+ 期待
grep -c '^```jsx$' "$F"                  # 4+ 期待（掲載 4 画面）
grep -c '> 派生元: phase-3' "$F"        # 4 期待（派生 4 画面）
grep -c '^```mermaid$' "$F"              # 8+ 期待

# 視覚値（全て 0 を期待）
grep -nE '#[0-9a-fA-F]{3,8}\b' "$F" | wc -l
grep -nE 'oklch\(' "$F" | wc -l
grep -nE '\b[0-9]+px\b' "$F" | wc -l
grep -nE '\bbg-\[' "$F" | wc -l

# Sidebar 重複なし（§2..9 内部に AdminSidebar JSX が無いこと）
# → 目視で「§1 参照」リンクのみが残ることを確認
grep -n 'AdminSidebar' "$F"

# confirm Modal a11y
grep -c 'role="dialog"' "$F"             # 4+ 期待
grep -c 'aria-modal="true"' "$F"         # 4+ 期待
grep -c 'focus trap' "$F"                # 4+ 期待
grep -c 'Esc close' "$F"                 # 4+ 期待

# link 完備
grep -E '09[abcd]\b' "$F" | wc -l        # 32+ 期待
```

---

## 4. NO-GO 条件

以下のいずれかが満たされた場合、Phase 07 へ進めず Phase 05 にループバック:

- [ ] R-01〜R-21 のいずれか NG
- [ ] 視覚値 1 件以上検出
- [ ] §1 が 0 個 / 2 個以上
- [ ] 派生 § で `> 派生元:` 行が欠落
- [ ] confirm Modal a11y 4 要素のいずれか欠落

---

## 5. レビュー結果記録

`outputs/phase-06/spec-review.md` に以下を記録:

| ID | 結果 | コメント |
|----|------|---------|
| R-01〜R-21 | PASS / FAIL | 修正箇所 |

---

## 6. 完了条件（Phase 07 へ進む gate）

- [ ] R-01〜R-21 全て PASS
- [ ] レビュー結果記録ファイルが配置
- [ ] NO-GO 条件全て NO

---

## 7. プロトタイプ参照表

`phase-03.md` §8 と同一（重複記載省略）。

---

## 8. リスク / 注意

| リスク | 緩和 |
|-------|------|
| 目視で見落とす視覚値 | Phase 07 grep で機械検出 |
| JSX 一字一句逸脱の見落とし | Phase 07 で完全一致 grep（行 diff） |
| API 表 drift | Phase 07 current admin API contract endpoint grep gate |

---

## 9. 次 Phase への引き渡し

Phase 07（自動テスト）は本 Phase の grep 観点（R-14〜R-17 / R-10 / R-04）を機械化する。R-07 / R-09 は current admin API contract の endpoint grep gate として自動化する。

## 実行タスク

- 09g に対して R-01〜R-21 のレビューを実施し結果を記録する。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| Phase 03 | `phase-03.md` | 設計（章立て / 8 サブ §） |
| Phase 05 | `phase-05.md` | 実装（執筆ガイド） |
| 09g 本体 | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | レビュー対象 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| spec review 結果 | `outputs/phase-06/spec-review.md` | R-01〜R-21 結果表 |
| phase specification | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/phase-06.md` | 本 phase の仕様書 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] R-01〜R-21 全て PASS。

## 目的

- 09g spec を目視＋簡易 grep でレビューし、Phase 07 自動テストの前段ゲートを通す。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。Phase 07 grep / Phase 08 link integrity を代替証跡とする。
