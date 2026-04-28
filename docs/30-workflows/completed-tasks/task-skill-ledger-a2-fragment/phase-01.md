# Phase 01: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-skill-ledger-a2-fragment |
| Phase | 1 |
| タスク種別 | implementation（refactoring） |
| visualEvidence | NON_VISUAL |
| workflow | implementation |

## 目的

skill ledger（`LOGS.md` / `SKILL-changelog.md` / `lessons-learned-*.md`）を 1 entry = 1 file の fragment 形式へ移行する **真の論点とスコープ**を Phase 1 で固定し、後続 Phase（設計・実装・検証）の前提を確定させる。

## 真の論点（4 系統）

1. **複数 worktree 並列追記による同一バイト位置 conflict の構造的解消**：append-only 規約だけでは解消できない 3-way / 4-way merge 衝突を、別 path 生成で物理的に発生させない。
2. **既存履歴の温存**：`_legacy.md` 退避により blame / `git log --follow` の連続性を維持する（履歴削除禁止）。
3. **集約 view の代替提供**：単一ファイル時代の「ファイルを読めば自然に時系列で読める」前提を、`pnpm skill:logs:render` の on-demand 集約に置き換える。
4. **writer 切替の最終化**：fragment 受け皿 → render → writer の順に整備し、移行期間中も legacy 経由で動作する設計を担保する。

## 実行タスク

- 真の論点 4 系統を `outputs/phase-1/main.md` で固定する。
- スコープ境界を確定する：
  - **含む**: fragment ディレクトリ作成・`.gitkeep` 追跡、legacy `git mv` 退避、writer / append helper の fragment 化、`pnpm skill:logs:render` 実装（T-5 包含）、legacy migration（T-7 包含）、front matter 必須項目検証（fail-fast）、4 worktree 並列 smoke。
  - **含まない**: A-1（`.gitignore` 化）、A-3（Progressive Disclosure 分割）、B-1（`.gitattributes merge=union`）、skill 本体機能変更、legacy ファイル物理削除。
- 命名 canonical を確定する：
  - fragment 命名 regex `^(LOGS|changelog|lessons-learned)/[0-9]{8}-[0-9]{6}-[a-z0-9_-]+-[a-f0-9]{8}\.md$`
  - timestamp `YYYYMMDD-HHMMSS`（UTC）／ nonce 8 hex／ escaped-branch ≤64 文字／ path ≤240 byte
  - 退避形式 `_legacy.md`（`LOGS/_legacy.md` / `changelog/_legacy.md` / `lessons-learned/_legacy-<base>.md`）
- 横断依存を洗い出す：上流 `task-conflict-prevention-skill-state-redesign`、下流 `task-skill-ledger-a1-gitignore` / `a3-progressive-disclosure` / `b1-gitattributes`。
- 既存コードの命名規則確認：`.claude/skills/<skill>/` 配下の既存ファイル命名・writer 経路（hook / shell / TS helper）を `git grep` で全列挙する宣言。
- 受入条件（Acceptance Criteria）を MECE で列挙：fragment 受け皿作成／legacy 退避／writer fragment 化／render script／front matter fail-fast／`--out` tracked 拒否（exit 2）／`--include-legacy` 30 日 window／4 worktree conflict 0 件。
- ドッグフーディング対象の明示：task-specification-creator の SKILL changelog と aiworkflow-requirements の LOGS を最優先 fragment 化対象として登録。
- 用語集初版を `outputs/phase-1/main.md` に列挙：fragment / Changesets パターン / append-only / nonce / legacy include window / front matter / render view。

## 参照資料

- Issue #130 https://github.com/daishiman/UBM-Hyogo/issues/130
- 既存仕様書 `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-2/fragment-schema.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-2/render-api.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-6/fragment-runbook.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`（`pnpm` / `mise exec --` 運用ルール）

## 成果物

- `outputs/phase-1/main.md`（真の論点・スコープ・命名 canonical・横断依存・受入条件・用語集初版）

## 統合テスト連携

NON_VISUAL のため Phase 1 では実行しない。Phase 4 で targeted vitest run と 4 worktree smoke を組み立てる前提のみ宣言する。

## 完了条件

- [ ] 真の論点 4 系統が `main.md` に明記されている。
- [ ] スコープ「含む / 含まない」が MECE で列挙されている。
- [ ] 命名 canonical（regex / timestamp / nonce / path 上限）が確定している。
- [ ] 横断依存（上流 1 / 下流 3）が列挙されている。
- [ ] ドッグフーディング対象 2 件（task-specification-creator の SKILL changelog、aiworkflow-requirements の LOGS）が明示されている。
- [ ] 受入条件チェックリスト（8 項目）が main.md に記録されている。
- [ ] artifacts.json の Phase 1 status と整合。
- [ ] ユーザー承認なしの commit / push / PR を行わない。
