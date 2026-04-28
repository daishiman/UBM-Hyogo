# Phase 2 — 設計 main

## Topology / 状態所有権

| レイヤー | 責務 | 実装 | 状態所有権 |
| -------- | ---- | ---- | ---------- |
| Fragment Store | fragment ファイル物理保存 | `.claude/skills/<skill>/{LOGS,changelog,lessons-learned}/` | git tracked filesystem |
| Append Helper | fragment 生成（front matter 付与・nonce 採番・retry） | `scripts/skill-logs-append.ts` / `pnpm skill:logs:append` | 共通実装 |
| Render Engine | fragment + `_legacy.md` を timestamp 降順で集約 | `scripts/skill-logs-render.ts` / `pnpm skill:logs:render` | 読み取り専用 |
| Legacy Bridge | `_legacy.md` の擬似 timestamp 抽出 | `extractTimestampFromLegacy()` | render 内部変換層 |
| CI Guard | writer 経路の `LOGS.md` / `SKILL-changelog.md` 直接追記 0 件保証 | `git grep` ベース | 検出のみ |

5 層は混在禁止：writer は **生成のみ**、render は **読み取りのみ**、guard は **検出のみ**。

## 因果ループ

- 強化ループ（断ち切り対象）: 並列 worktree 増加 → 衝突件数増加 → 解消コスト増加 → 並列性低下。A-2 が「同一 path への同時追記」を物理的に発生させない構造に変えて断ち切る。
- バランスループ: fragment 数増加 → render 出力肥大 → `--since` filter / Phase 11 で確認する render 速度監視で抑制。

## 価値とコスト

- 初回層の価値: conflict 0 件 / blame 連続性 / on-demand 集約。
- 初回層のコスト: render script 実装、writer 全箇所書換え、4 worktree smoke 実機検証（Phase 11）。
- 将来層（本タスク外）: A-1 gitignore / A-3 Progressive Disclosure / B-1 merge=union。

## Append Helper 設計

- 既存 writer 経路は `git grep -n 'LOGS\.md\|SKILL-changelog\.md' .claude/skills/` で全列挙 → 共通 helper（`scripts/skill-logs-append.ts`）に集約。
- 同秒・同 branch でも nonce で衝突回避（衝突期待値 ≈ 1.16×10⁻⁴ at 1000/sec）。
- 衝突時 nonce 再生成最大 3 回 → 4 回目で `CollisionError` throw。

## 4 条件自己評価

| 条件 | 評価 | 根拠 |
| ---- | ---- | ---- |
| 価値性 | OK | 4 worktree 並列衝突を物理解消／blame 連続性維持 |
| 実現性 | OK | render LoC ≈ 250／単一依存（YAML parse 自前） |
| 整合性 | OK | 5 層責務分離が混在していない |
| 運用性 | OK | `pnpm skill:logs:render` で再現可能な集約 |

## 関連ファイル

- [`fragment-schema.md`](./fragment-schema.md)
- [`render-api.md`](./render-api.md)
