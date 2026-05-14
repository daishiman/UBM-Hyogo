# Phase 8: リファクタリング

## 目的

Phase 5 で生成した matrix の可読性・運用性を向上させる。

---

## 1. リファクタ対象

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| 「備考」列 | WARN/FAIL 行ごとに散文記述 | 短文（80 字以内）+ 参照 spec パス末尾参照 | 列幅を整え GFM 縦並びを保つ |
| 凡例 | 本文中に分散 | 冒頭セクションに集約 | 読み手の認知負荷低減 |
| 依存関係 | 本文内で繰り返し説明 | Phase 2 §4 へ参照リンク | DRY |
| サマリー | 数値列挙のみ | 「PASS 比率 = NN%」付き | 健康度の一目把握 |

---

## 2. duplicate 削除

- task spec 内に既に書かれている情報（DoD 等）は matrix に重複転記しない
- C1〜C4 の判定根拠は `outputs/phase-5/implementation-notes.md` に分離し、matrix 本体は表のみ

---

## 3. navigation drift 除去

- matrix 内の参照リンクは相対パス（`./...` / `../...`）で記述
- 削除されたタスクへの参照が残らないことを Phase 9 で確認

---

## 4. 成果物

- `outputs/phase-8/refactor.md`
