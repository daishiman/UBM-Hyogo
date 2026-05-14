# Phase 5: 実装（matrix 生成）

## 目的

`VERIFICATION-STATUS.md` を `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` 直下に生成する。本 Phase は単一ファイル作成タスクとして実行する。

---

## 1. 新規作成ファイル

| パス | 役割 |
|------|------|
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md` | 22×4=88 セル matrix |

## 2. 修正ファイル

なし（既存 spec / 実装は read-only）。

---

## 3. 生成手順

```text
Step 1: ヘッダー（評価日付・評価者・参照 branch / commit）を書く
Step 2: 凡例セクションを書く（PASS / WARN / FAIL / N/A の意味）
Step 3: matrix table の header 行を書く
        | Task | 主題 | C1: 矛盾なし | C2: 漏れなし | C3: 整合性あり | C4: 依存関係整合 | 備考 |
Step 4: 22 行のデータ行を 1 行ずつ評価して書く
        - 各タスクの spec を読み、4 条件を Phase 2 §2 のロジックで判定
        - WARN / FAIL の場合は「備考」列に 1 行で理由を記述
Step 5: サマリー行を書く（PASS / WARN / FAIL / N/A の件数集計 + 合計 88）
Step 6: 末尾に「参照ファイル一覧」を脚注として書く
```

---

## 4. matrix セル評価ガイダンス（Phase 5 実行者向け）

### 4.1 各セルの調査手順

1. **C1（矛盾なし）**: 当該 task spec の `不変条件` セクションを開き、関連 spec（依存タスク・並列タスク）と論理矛盾がないか目視。矛盾なし → PASS。
2. **C2（漏れなし）**: 当該 task spec の `変更対象ファイル` を抽出し、`ls` / `find` で実体確認。すべて存在 → PASS。一部欠落 → WARN/FAIL。
3. **C3（整合性あり）**: spec の主要 identifier（関数名・型名・testid・route path）を `grep -r` で実装側に当てる。一致 → PASS。
4. **C4（依存関係整合）**: spec の `依存 (前)` 表を Phase 2 §4 の依存関係マップと突き合わせ、上流タスクが本 matrix の他行で PASS/WARN なら PASS、FAIL を含めば FAIL、上流なし → N/A。

### 4.2 評価の妥当性記録

各セル評価の根拠を `outputs/phase-5/implementation-notes.md` に行ごとに 1 行（最大 200 字）で記録する。

---

## 5. 差分確認

`implementation_mode: verify_existing` のため、Phase 5 は新規実装ではなく「既存 22 タスクの状態スナップショット採取」が主作業。回帰確認は Phase 6 / Phase 9 で行う。

---

## 6. 成果物

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md`（外部配置・最終成果物）
- `outputs/phase-5/implementation-notes.md`（評価根拠ログ）
