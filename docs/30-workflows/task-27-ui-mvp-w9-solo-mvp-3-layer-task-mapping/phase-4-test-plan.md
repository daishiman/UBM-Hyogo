# Phase 4: テスト作成（検証スクリプト設計）

> Phase: 4 / 13
> 名称: テスト作成
> 形態: docs-only / 構造検証チェックリスト

---

## 目的

`MVP-3LAYER-TASK-MAPPING.md` 生成物が不変条件を満たしているかを検証するチェックリストを作成する。実コードのテストではなく、markdown 構造とセル充足を検証する手順を定義する。

---

## テストカテゴリ

### TC-01: ファイル配置確認

- 検証: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md` が存在する
- 期待: ファイルあり / サイズ > 0

### TC-02: 必須セクション存在確認

- 検証: 9 セクション（概要・凡例 / 4 層定義 / Matrix A / Matrix B / WARN/FAIL 集約 / invariant 集約 / smoke 集約 / 戦略 readiness / 脚注）の見出しが存在する
- 期待: 全 9 セクション あり

### TC-03: 88 セル充足確認

- 検証: Matrix A の各行（22 task）について 4 層列の値がいずれも「必須 / 強関与 / 軽関与 / 無関係」のいずれか
- 期待: 88 セル空欄 0 件

### TC-04: 双方向一致確認

- 検証: Matrix A の `(task-XX, layer-Y) = K` ペアと、Matrix B の `layer-Y` バケツ `K` 内 `task-XX` の出現が一致
- 期待: 不一致 0 件

### TC-05: WARN/FAIL 集約整合確認

- 検証: task-23 `VERIFICATION-STATUS.md` の WARN/FAIL を含むすべてのタスクが、本 matrix の section 5 で影響層と共に列挙されている
- 期待: 取りこぼし 0 件（task-23 結果がない場合は「task-23 未完了」と明記）

### TC-06: 4 分類値の制約確認

- 検証: 各セルが厳密に「必須 / 強関与 / 軽関与 / 無関係」の 4 文字列のいずれか（表記揺れ禁止）
- 期待: 表記揺れ 0 件

### TC-07: 既存ファイル未変更確認

- 検証: `git diff --name-only` で本 PR の差分が `docs/30-workflows/task-27-.../**` と `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md` 以外を含まない
- 期待: 既存 task-01〜22 spec / 実装ファイルの差分 0 件

### TC-08: GFM table 構文確認

- 検証: Matrix A / B が GFM table として妥当（パイプ揃え / ヘッダ区切り行 / 改行整合）
- 期待: lint エラー 0 件

### TC-09: line budget 確認

- 検証: `MVP-3LAYER-TASK-MAPPING.md` の総行数が 600 行以下
- 期待: ≤ 600 行

### TC-10: route 一覧整合確認

- 検証: section 2 の「4 層 routes 一覧」が SCOPE.md と一致する 19 routes（公開 6 + 会員 2 + 管理 8 + 共通 3）を網羅する
- 期待: 漏れ 0 件、追加 0 件

---

## 実施タイミング

- TC-01〜09: Phase 5 完了直後（実装内検証）
- TC-10: Phase 5 着手前に SCOPE.md 読込時点で一度
- Phase 6 で TC-04 と TC-05 を cross-check として再実施

---

## 不合格時の対応

任意の TC が不合格の場合、Phase 5 に戻って matrix を修正し、TC-01〜10 を再実行する。
