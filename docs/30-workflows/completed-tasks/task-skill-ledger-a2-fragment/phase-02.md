# Phase 02: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-skill-ledger-a2-fragment |
| Phase | 2 |
| タスク種別 | implementation（refactoring） |
| visualEvidence | NON_VISUAL |
| workflow | implementation |

## 目的

Phase 1 で固定したスコープを、**fragment schema / render API / topology / 状態所有権**の 4 軸で具体化する。後続 Phase 4（テスト設計）と Phase 5（実装ランブック）が単独で着手できる粒度まで設計を完成させる。

## 設計対象（Topology）

| レイヤー | 責務 | 状態所有権 |
| -------- | ---- | ---------- |
| Fragment Store | `LOGS/<YYYYMMDD>-<HHMMSS>-<escaped-branch>-<nonce>.md` の物理保存 | ファイルシステム（git tracked） |
| Append Helper | fragment ファイル生成（front matter 付与・nonce 採番） | `pnpm skill:logs:append` 共通実装 |
| Render Engine | fragment + `_legacy.md` を timestamp 降順で merge 出力 | `scripts/skill-logs-render.ts` |
| Legacy Bridge | `_legacy.md` の擬似 timestamp 抽出（mtime / 本文 heuristic） | render engine 内部の変換層 |
| CI Guard | writer 経路に `LOGS.md` / `SKILL-changelog.md` 直接追記が残らないことを保証 | `git grep` ベース 0 件チェック |

## 実行タスク

### 2.1 Fragment Schema 設計（`outputs/phase-2/fragment-schema.md`）

- ディレクトリレイアウト
  - `.claude/skills/<skill>/LOGS/`（旧 `LOGS.md`）
  - `.claude/skills/<skill>/changelog/`（旧 `SKILL-changelog.md`）
  - `.claude/skills/<skill>/lessons-learned/`（旧 `lessons-learned-*.md`）
- 命名 regex 確定：`^(LOGS|changelog|lessons-learned)/[0-9]{8}-[0-9]{6}-[a-z0-9_-]+-[a-f0-9]{8}\.md$`
- branch escape ルール：`/` → `-`、英大文字 → 小文字、許可文字 `[a-z0-9_-]`、上限 64 文字（超過は trailing trim）
- nonce: `openssl rand -hex 4`（4 byte / 8 hex）
- front matter（YAML）必須項目
  - `timestamp`: ISO8601 UTC（`2026-04-28T17:00:00Z`）
  - `branch`: escape 前の元 branch 名
  - `author`: git user.email（or `claude-code` 等の system author）
  - `type`: `log` / `changelog` / `lessons-learned` のいずれか
- 衝突回避ロジック：path 事前存在チェック → 衝突時 nonce 再生成最大 3 回
- legacy 退避規約：`_legacy.md` は固定名で配置し、render が必ず最後尾「Legacy」セクションへ連結

### 2.2 Render API 設計（`outputs/phase-2/render-api.md`）

- TypeScript 型
  ```ts
  export interface RenderSkillLogsOptions {
    skill: string;
    since?: string;       // ISO8601。指定した時刻以降の fragment のみ
    out?: string;         // 出力先 path（既定 stdout）
    includeLegacy?: boolean; // 既定 false。true で 30 日 window 内の _legacy.md を末尾連結
  }
  export async function renderSkillLogs(options: RenderSkillLogsOptions): Promise<string>;
  ```
- CLI: `pnpm skill:logs:render --skill <name> [--since <ISO>] [--out <path>] [--include-legacy]`
- 終了コード規約
  - `0`: 正常出力
  - `1`: front matter 欠損 / parse 不能 fragment を 1 件以上検出（対象 path を stderr に列挙）
  - `2`: `--out` が tracked canonical ledger を指す（誤上書き防止）
- legacy include window: 30 日（`Date.now() - 30d` より新しい `_legacy*.md` のみ末尾連結）
- 出力レイアウト
  ```
  # Skill Logs: <skill>

  ## Fragments (timestamp 降順)
  <fragment 本文>

  ## Legacy（--include-legacy 指定時のみ）
  <_legacy.md 本文>
  ```

### 2.3 Append Helper 設計（`outputs/phase-2/main.md` 内）

- 既存 writer 経路を `git grep -n 'LOGS\.md\|SKILL-changelog\.md' .claude/skills/` で全列挙
- 共通 helper（shell スクリプト or `tsx` script）に集約
- 同秒・同 branch でも nonce で衝突しないことを設計の前提とする

### 2.4 因果ループ・依存境界の確認

- 強化ループ: 並列 worktree 増加 → 衝突件数増加 → 解消コスト増加 → 並列性低下（A-2 がこれを断ち切る）
- バランスループ: fragment 数増加 → render 出力肥大 → `--since` filter で抑制
- 状態所有権の混在禁止: writer は **fragment 生成のみ**、render は **読み取りのみ**、CI guard は **検出のみ**。Bridge / Engine / Store を混ぜない。

### 2.5 価値とコストの分離

- 初回価値: conflict 0 件 / blame 連続性 / on-demand 集約
- 初回コスト: render script 実装、writer 全箇所書換え、4 worktree smoke 実機検証
- 将来層（本タスク外）: A-1 gitignore / A-3 Progressive Disclosure / B-1 merge=union

## 参照資料

- Phase 1 `outputs/phase-1/main.md`
- Issue #130 主要技術仕様
- 既存仕様書 `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md` §3-§4
- Changesets パターン（fragment + render の OSS 事例）

## 成果物

- `outputs/phase-2/main.md`（topology・状態所有権・因果ループ）
- `outputs/phase-2/fragment-schema.md`（命名規約・regex・front matter）
- `outputs/phase-2/render-api.md`（CLI / TS API・終了コード規約）

## 統合テスト連携

設計だけで完結。実機テストは Phase 4-5 で組み立てる。

## 完了条件

- [ ] fragment schema（命名・regex・branch escape・nonce・front matter）が確定。
- [ ] render API（型・CLI・終了コード・legacy include window）が確定。
- [ ] writer 共通 helper の集約方針が決定。
- [ ] 状態所有権が Store / Helper / Engine / Bridge / Guard の 5 層で混在していない。
- [ ] 因果ループ（強化 1 / バランス 1）が main.md に図示されている。
- [ ] 価値とコストが初回層 / 将来層に分離されている。
- [ ] 4 条件（価値性・実現性・整合性・運用性）の自己評価が main.md に記録されている。
- [ ] artifacts.json の Phase 2 status と整合。
