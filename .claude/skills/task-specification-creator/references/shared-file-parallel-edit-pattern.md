# Shared File Parallel Edit Pattern — 共有ファイル並列編集パターン

出典: `parallel-02-prototype-css-rules-port`（`ui-prototype-design-system-foundation` workflow, 2026-05-18）
での `apps/web/src/styles/globals.css` 共有編集知見。

## 適用シーン

複数の `parallel-XX-*` タスクが **同一ファイル** を同 wave で編集する場合に発生する以下を回避する:

- 並列 worktree 間で同一行範囲を編集 → merge conflict 多発
- `.gitattributes merge=union` を採用 → CSS / JS / YAML など **意味順序が結果に影響する** ファイルでは構造破壊が発生
- 後発タスクが先発タスクのブロックを上書き → primitive / token の adoption が回帰

## 適用対象ファイル例

| ファイル種別 | 例 | merge=union 可否 |
| --- | --- | --- |
| CSS (cascade) | `apps/web/src/styles/globals.css`, `tokens.css` | NG（後勝ち cascade が壊れる） |
| Tailwind / PostCSS config | `apps/web/tailwind.config.*` | NG（plugin 配列順序） |
| TypeScript barrel | `apps/web/src/components/primitives/index.ts` | 条件付き NG（export 衝突時） |
| ledger 純追記 | `docs/30-workflows/LOGS.md`, `SKILL-changelog.md` | OK（既に `.gitattributes` で union） |

CSS / cascade 系は本 reference の主対象とする。

## マーカー責務分離ルール

共有ファイル内で各 parallel-XX タスクが書き込むブロックを **明示マーカー** で囲み、責務範囲を物理的に分離する。

```css
/* === parallel-02 prototype css rules port (start) === */
:root {
  /* ... task-specific tokens / rules ... */
}
/* === parallel-02 prototype css rules port (end) === */

/* === parallel-05 motion tokens (start) === */
@media (prefers-reduced-motion: reduce) { /* ... */ }
/* === parallel-05 motion tokens (end) === */
```

### マーカー文法

| 要素 | 値 |
| --- | --- |
| start マーカー | `/* === <task-slug> <短い説明> (start) === */` |
| end マーカー | `/* === <task-slug> <短い説明> (end) === */` |
| `<task-slug>` | `parallel-XX-<kebab-name>` または workflow root の slug |

### 編集規約

1. **先着優先**: マーカー範囲は先に commit / merge されたタスクが ownership を持つ
2. **後発はマーカー範囲外で追加**: 後発タスクは別マーカー block を **ファイル末尾側** に追加する
3. **既存マーカー範囲を書き換えない**: 既存ブロック内の token / rule を変更したい場合は、所有タスクの follow-up unassigned-task を起票する
4. **空マーカーは禁止**: 空 block を予約として残さない（diff noise / 意味なし）

## Phase 仕様への組込み

Phase 1-13 spec で共有ファイル編集を含むタスクは、以下を **明示** する:

| Phase | 記述箇所 |
| --- | --- |
| Phase 2 (architecture) | 共有ファイル列挙 + マーカー名 + 並列タスク間の所有マッピング |
| Phase 4 (data contract) | マーカー schema（start/end 文法、`task-slug` 命名規則） |
| Phase 5 (implementation guide) | 「先着優先 / 後発はマーカー外追加」運用と conflict 時の retreat 手順 |
| Phase 11 (evidence) | `grep -n "=== <task-slug>" <共有ファイル>` の出力を tracked `.txt` に保存 |
| Phase 12 (compliance) | 共有ファイル diff が他タスクのマーカー範囲を侵食していないことの grep gate |

## conflict 発生時の手順

1. `git status` で衝突対象ファイルを特定
2. **`pnpm sync:resolve` は CSS には使わない**（union が cascade を壊す）
3. 自タスクのマーカー block を手動で末尾側に再配置
4. 先発タスクのマーカー範囲を **そのまま** 保持
5. `pnpm typecheck && pnpm lint` で構造健全性を確認
6. Phase 11 evidence に「conflict 解消手順 + 配置決定理由」を `.txt` で記録

## 禁則

- `.gitattributes` に CSS / config を `merge=union` で追加しない
- マーカー範囲を跨いでルールを記述しない
- 後発タスクが先発のマーカー名を流用しない（責務不明瞭化）
- 1 ファイル内で同一 `task-slug` のマーカーを **2 ブロック以上** 持たない（分散したら refactor）

## 関連 reference

- [patterns-parallel-ipc.md](patterns-parallel-ipc.md) — 並列実装一般則
- [phase-12-pitfalls.md](phase-12-pitfalls.md) — 共有ファイル diff scope 検出の落とし穴
- [unassigned-task-required-sections.md](unassigned-task-required-sections.md) — マーカー範囲書き換えが必要な場合の follow-up 起票
