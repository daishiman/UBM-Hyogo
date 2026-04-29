# task-skill-ledger-t6-indexes-rebuild-fail-fast — `pnpm indexes:rebuild` の非ゼロ exit 保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-skill-ledger-t6-indexes-rebuild-fail-fast |
| 作成日 | 2026-04-29 |
| 起点 | docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md (U-5) |
| 種別 | tooling / NON_VISUAL |
| 優先度 | MEDIUM |
| 状態 | unassigned |
| GitHub Issue | 未起票（本タスクで起票予定） |

## 背景

`pnpm indexes:rebuild` が部分失敗（特定 skill の generator が途中で死亡）したときの中断挙動が、skill ごとの script 実装差で揃っていない可能性がある。Phase 2 / Phase 6 のレビューで「`set -euo pipefail` 相当の保証を script 層で固定する」必要性が指摘されたが、本 PR の docs-only スコープから外れたため未対応。

## スコープ

### 含む

- 各 skill の `indexes:rebuild` 経路を呼ぶ script を棚卸し
- `set -euo pipefail` 相当（または Node 同等処理）を一貫適用
- 部分書き込みの JSON / Markdown を `jq -e .` 等で検出し、削除して再生成する safety net
- 失敗時の標準エラー出力フォーマット（どの skill / どの index で失敗したか）の統一

### 含まない

- T-6 hook 本体の冪等化（U-1 task で対応）
- skill ごとの index 内容自体の改善
- CI 化（U-2 / U-4 task で扱う）

## 受入条件

- AC-1: `pnpm indexes:rebuild` が部分失敗時に必ず非ゼロ exit する。
- AC-2: 部分書き込みのファイルが残らない（成功した skill の index のみ更新される、または全削除して再開可能）。
- AC-3: 失敗ログから「どの skill / どの index」かが一意に特定できる。
- AC-4: T-6 hook が AC-3 の挙動を前提にできる程度に decisive な exit code になる。

## 苦戦箇所（記入予定枠）

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 実装着手時に記入 |
| 原因 | 実装着手時に記入 |
| 対応 | 実装着手時に記入 |
| 再発防止 | 実装着手時に記入 |

## 参照

- `docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-02.md`
- `docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-06.md`
- `docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md`
