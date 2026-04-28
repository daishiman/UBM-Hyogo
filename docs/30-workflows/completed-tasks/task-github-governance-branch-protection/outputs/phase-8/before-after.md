# Phase 8 — リファクタリング前後（before / after）

## Status
done

> docs-only / NON_VISUAL / spec_created タスクのため、本書はコード差分ではなく
> **文書構造・記述の重複統合・ナビゲーション整合**の before/after を扱う。

---

## 1. 重複統合 No.1: branch protection × auto-rebase の permissions 記述

| 観点 | Before（初稿想定） | After（統合後） |
| --- | --- | --- |
| permissions の記述場所 | branch protection 章と auto-rebase 章の双方で、`contents: write` の必要性を別文脈で説明 | auto-rebase 章 (§5) に集約。branch protection 章は「PR 経由のみ書き込み可」の方針宣言に限定 |
| 想定読者の混乱 | どちらが「正本」か不明瞭 | §5 を正本、§2/§3 はポリシー側の宣言として住み分け明確化 |
| 行数 | 重複により 12 行程度の冗長 | 重複削除で 6 行程度に圧縮 |

## 2. 重複統合 No.2: status check 命名の再掲

| 観点 | Before | After |
| --- | --- | --- |
| 記述箇所 | §1 と §2 / §3 で contexts 配列を別々に列挙 | §1 を **単一情報源** とし、§2 / §3 は `/* §1 と同一の 8 contexts */` でコメント参照 |
| 不整合リスク | contexts に追加が入るたび 3 箇所更新が必要 | §1 のみ更新で全章に伝播 |

## 3. 重複統合 No.3: pr-target safety gate の権限記述と branch protection の権限記述

| 観点 | Before | After |
| --- | --- | --- |
| 重複箇所 | branch protection の `restrictions: null` と pr-target の `permissions: {}` を同列に語っていた | レイヤを明示分離: branch protection = **誰が push できるか**、pr-target = **GHA job が何を持つか** |
| 結果 | レイヤ衝突に見えていた記述を削除し、責務境界を §6 冒頭で 1 行明記 |

---

## 4. ナビゲーション drift 検査

| 検査項目 | 検出結果 |
| --- | --- |
| `index.md` の Phase 表行数（13）と artifacts.json `phases` 件数（13）の一致 | 一致 |
| 各 Phase の `outputs` パスが artifacts.json と index.md で同一 | 一致 |
| `phase-NN.md` 各ファイルの存在 | 13 個すべて存在 |
| `outputs/phase-N/main.md` の存在 | 13 個すべて存在 |
| Phase 13 のみ `user_approval_required: true` | 一致 |
| 横断依存（index.md §横断依存 と artifacts.json `cross_task_order`） | 同一順序 |

ナビゲーション drift: **検出 0 件**。

---

## 5. 参照整合（index.md / artifacts.json / phase-NN.md）

| 参照元 | 参照先 | 整合 |
| --- | --- | :-: |
| index.md Phase 1 行 | `phase-01.md` ＋ `outputs/phase-1/main.md` | ✅ |
| index.md Phase 2 行 | `phase-02.md` ＋ `outputs/phase-2/{main,design}.md` | ✅ |
| index.md Phase 3 行 | `phase-03.md` ＋ `outputs/phase-3/{main,review}.md` | ✅ |
| index.md Phase 7 行 | `phase-07.md` ＋ `outputs/phase-7/{main,coverage}.md` | ✅ |
| index.md Phase 8 行 | `phase-08.md` ＋ `outputs/phase-8/{main,before-after}.md` | ✅ |
| index.md Phase 9 行 | `phase-09.md` ＋ `outputs/phase-9/{main,quality-gate}.md` | ✅ |
| artifacts.json `phases[*].outputs` | 上記すべてと一致 | ✅ |
| artifacts.json `cross_task_order` | index.md 横断依存節と同順 | ✅ |

---

## 6. before/after 行数の概況

| 文書 | Before（推定）| After | 増減 |
| --- | ---: | ---: | ---: |
| design.md（§1〜§9 統合後）| 約 280 | 266 | −14 |
| phase-07/coverage.md | スタブ（4） | 約 95 | +91（新規策定） |
| phase-08/before-after.md | スタブ（4） | 約 90 | +86（新規策定） |
| phase-09/quality-gate.md | スタブ（4） | 約 110 | +106（新規策定） |

> design.md の縮小は重複削除によるもの。Phase 7〜9 の追記は仕様要素網羅性／品質ゲート定義のため。

---

## 7. 判定

リファクタリング **完了**。重複 3 件を統合し、ナビゲーション drift 0 件を確認。
Phase 9 で artifacts parity と Phase 4↔5 トレース整合を最終チェックする。
