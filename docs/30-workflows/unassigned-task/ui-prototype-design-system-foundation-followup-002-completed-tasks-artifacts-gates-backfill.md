## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | ui-prototype-design-system-foundation-followup-002-completed-tasks-artifacts-gates-backfill |
| タスク名     | `completed-tasks/**/artifacts.json` の `metadata.gates` 一括補完 |
| 分類         | governance / metadata backfill |
| 対象機能     | `docs/30-workflows/completed-tasks/**/artifacts.json` および `outputs/artifacts.json` の `metadata.gates` 欄 |
| 優先度       | 中 |
| 見積もり規模 | 小〜中（343 件のスクリプト一括補完 + 仕様化） |
| ステータス   | 未着手 |
| 発見元       | ui-prototype-design-system-foundation Phase 12（gate-metadata zod schema warn 集計） |
| 発見日       | 2026-05-18 |
| 制作経路     | `task-specification-creator` skill で Phase 1-13 仕様生成 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`gate-metadata:validate` の zod schema は `metadata.gates` を任意ながら推奨欄として扱うが、完了済みワークフローの `artifacts.json` には `gates` 欄が無いものが多数残っており、validate 実行時に **WARN 343 件** が発生する。

### 1.2 問題点・課題

- 真の FAIL（schema 違反 / 値不整合）が WARN ノイズに埋没し、PR pre-flight で見逃しリスクが上昇する。
- `verify-pr-ready.sh` の出力が長大化し、Claude Code が必要な失敗パターンへ到達しにくい。
- `aiworkflow-requirements` indexes 側の topic-map と artifacts gates の整合性 audit が走らせにくい。

### 1.3 放置した場合の影響

- gate-metadata の WARN が常態化し、新規 FAIL に気づかず PR を進めてしまう恐れがある。
- completed-tasks 側の audit 再現性が下がる（gates から phase 別の `pass`/`fail` 推移を機械的に追えない）。

---

## 2. 何を達成するか（What）

### 2.1 目的

`completed-tasks/**` 配下の `artifacts.json` および `outputs/artifacts.json` のうち `metadata.gates` 欄を持たないものへ、最小スキーマ準拠の `gates` 配列を補完し、`gate-metadata:validate` の WARN 0 を達成する。

### 2.2 スコープ（含む）

- `docs/30-workflows/completed-tasks/**/artifacts.json` の `metadata.gates` 補完
- `docs/30-workflows/completed-tasks/**/outputs/artifacts.json` の同上
- 補完値の生成元: 既存 phase outputs の `quality-gates.md` / `test-plan.md` から派生可能な情報のみ。情報不足のものは `status: "unknown"` を schema 許容範囲で記述する設計を Phase 2 で決定
- バックフィル script の追加（idempotent / dry-run / write モード分離）

### 2.3 スコープ外

- 完了済みワークフローの再 audit / 再実行
- 未完了 workflow（`unassigned-task/` 含む）の artifacts 編集
- schema 自体の変更（schema 改訂は別タスク扱い）
- Phase 11 evidence の再収集や再生成

### 2.4 影響範囲

- 343 件の artifacts.json（変更は metadata.gates 追記のみ、他フィールドは不変）
- `verify-pr-ready.sh` の出力 WARN 件数
- `aiworkflow-requirements` indexes は変更不要（artifacts は indexes 対象外）

---

## 3. どのように実行するか（How）

### 3.1 推奨アプローチ

1. `task-specification-creator` skill を起動し Phase 1-13 仕様を起こす。
2. Phase 2 で zod schema 最小準拠 `gates` 配列の生成則を確定（例: `[{ "id": "<phase>-quality-gate", "status": "passed", "source": "backfill" }]` などの最小形）。
3. Phase 5 で `scripts/backfill-completed-artifacts-gates.mjs` を実装。
   - `--dry-run`: 変更予定の path と diff を stdout 出力
   - `--write`: 実書き込み（idempotent）
4. Phase 6 で dry-run / write を分離した unit / integration test を追加。
5. Phase 11 で `gate-metadata:validate` の WARN 件数 343 → 0 を evidence として記録。
6. Phase 12 で `unassigned-task-detection` を更新し、自己消化を記録。

### 3.2 idempotency 条件

- `gates` が既に存在する artifact は no-op
- 書き込み結果は再実行で diff 0
- JSON key 順は既存 artifact の順序を保持

---

## 4. 完了条件チェックリスト

- [ ] `metadata.gates` が欠如している artifact 件数が `verify-pr-ready.sh` 上で 0
- [ ] `gate-metadata:validate` の WARN 343 → 0
- [ ] `scripts/backfill-completed-artifacts-gates.mjs` が dry-run / write 両モードで動作
- [ ] バックフィル後の artifacts.json で zod schema parse が成功
- [ ] CI（`verify-gate-metadata`）が green
- [ ] `aiworkflow-requirements` の関連 references に backfill ポリシーを追記（必要時のみ）

---

## 5. 参照情報

- `docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
- `scripts/verify-pr-ready.sh`
- `.github/workflows/verify-gate-metadata.yml`（存在時）
- 関連 lessons-learned（想定参照）: L-UIPROTO-001..005（gate-metadata 運用 / WARN ノイズと FAIL 識別性 / backfill idempotency / artifacts schema 進化）
- 関連 skill: `task-specification-creator`（Phase 1-13 起こし）/ `aiworkflow-requirements`（artifacts schema 監査の正本）
