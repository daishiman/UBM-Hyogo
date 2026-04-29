# Phase 3 — レビュー詳細

## 観点別チェックリスト

### 整合性

- [x] fragment 命名 regex が `fragment-schema.md` / `render-api.md` / `scripts/lib/fragment-path.ts` の 3 箇所で一致
- [x] front matter 必須キー（timestamp/branch/author/type）が schema と render エラーメッセージで一致
- [x] CLI フラグ `--skill` `--since` `--out` `--include-legacy` の表記揺れなし

### 完全性

- [x] 受入条件 8 項目（fragment 受け皿 / legacy 退避 / writer 切替 / render / fail-fast / `--out` 拒否 / 30 日 window / 4 worktree smoke）すべて設計に反映
- [x] Phase 11 で 4 worktree smoke を実機実施する旨が明示（UT-A2-SMOKE-001 で実機検証）

### 実現性

- [x] nonce 衝突確率 1.16×10⁻⁴／retry 3 回で 1.56×10⁻¹²
- [x] path byte limit 240 が NTFS 互換マージン（NTFS 制約 260 char）
- [x] 単体テスト 15 件で C-1 〜 C-12 / F-1 〜 F-11 を網羅可能

### 運用性

- [x] legacy 擬似 timestamp が ISO → date → mtime の 3 段 fallback
- [x] `--since` で render 出力肥大を抑制可能
- [x] 4 worktree smoke 手順が `scripts/new-worktree.sh` で再現可能

### セキュリティ・安全性

- [x] `--out` tracked canonical 拒否で誤上書き防止
- [x] front matter 不正は silent fail せず exit 1 + stderr に path 出力
- [x] `_legacy.md` 削除を検出する R-3 回帰 guard を Phase 6 で登録

## 指摘一覧

### MAJOR

なし。

### MINOR

なし（Phase 9 で `log_usage.js` writer 残存を検出 → Phase 10 で未タスク化候補登録）。

### INFO

| ID | 内容 | 反映先 |
| -- | ---- | ------ |
| INFO-1 | 30 日超 legacy 履歴の閲覧手順を runbook 化 | `outputs/phase-6/fragment-runbook.md` |
| INFO-2 | `pnpm skill:logs:render` の実装後 smoke を 4 worktree で実施 | Phase 11 |

## 結論

MAJOR 0 件 → **GO**。Phase 4 テスト設計に進む。
