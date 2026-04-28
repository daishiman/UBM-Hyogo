# Skill Ledger Fragment Spec — A-2 fragment 化の正本

> 最終更新日: 2026-04-28
> 対象: A-2 / `task-skill-ledger-a2-fragment`
> 出典: `outputs/phase-2/fragment-schema.md` / `outputs/phase-2/render-api.md` / `outputs/phase-6/fragment-runbook.md` / `outputs/phase-12/implementation-guide.md`

## 1. 目的

`.claude/skills/<skill>/` 配下の append-only ledger を **1 entry = 1 file** の fragment 形式へ移行し、`pnpm skill:logs:render` による on-demand 集約 view を提供する。既存履歴は `_legacy.md` として温存し、`git log --follow` での連続性を維持する。

## 2. fragment 命名規約

### 2.1 パス

`<skill>/LOGS/<YYYYMMDD>-<HHMMSS>-<escapedBranch>-<nonce>.md`

| 構成要素 | 規則 |
| --- | --- |
| `<YYYYMMDD>-<HHMMSS>` | UTC タイムスタンプ |
| `escapedBranch` | branch の `/` を `-` に、英数字以外をハイフン化。上限 64 文字 |
| `nonce` | 8 hex（4 byte）小文字。同一秒・同一 branch でも一意性を担保 |
| パス全体上限 | 240 byte（NTFS 互換マージン） |

### 2.2 命名 regex

```
^LOGS/[0-9]{8}-[0-9]{6}-[a-z0-9_-]+-[a-f0-9]{8}\.md$
```

### 2.3 派生 fragment ディレクトリ

| skill 種別 | ディレクトリ |
| --- | --- |
| 一般 LOGS | `LOGS/` |
| skill changelog（task-specification-creator 等） | `changelog/` |
| lessons-learned 系 | `lessons-learned/` |

各ディレクトリは空でも tracked にするため `.gitkeep` を必ず置く。

## 3. front matter schema

fragment 冒頭には以下の YAML front matter を必須化する。欠損 / parse 不能なら **対象 path を stderr に出力して exit 1**（fail-fast）。

```yaml
---
timestamp: 2026-04-28T12:34:56Z
branch: feat/skill-ledger-a2-fragment
author: <github handle>
type: log | changelog | lessons-learned
---
```

| フィールド | 必須 | 説明 |
| --- | --- | --- |
| `timestamp` | yes | ISO 8601 (UTC) |
| `branch` | yes | 元の branch 名（escape 前） |
| `author` | yes | GitHub handle / commit author |
| `type` | yes | `log` / `changelog` / `lessons-learned` のいずれか |

## 4. TypeScript 型定義

```ts
export interface SkillLedgerFragment {
  skillName: string;
  timestamp: string;        // ISO 8601 (UTC)
  escapedBranch: string;
  nonce: string;            // 8 hex
  relativePath: `LOGS/${string}.md`;
}

export interface RenderSkillLogsOptions {
  skill: string;
  since?: string;           // ISO 8601
  out?: string;             // 出力ファイルパス（tracked canonical を拒否）
  includeLegacy?: boolean;
}

export async function renderSkillLogs(
  options: RenderSkillLogsOptions,
): Promise<string>;
```

## 5. render API（CLI / TS）

### 5.1 CLI シグネチャ

```bash
pnpm skill:logs:render --skill <name> [--since <ISO>] [--out <path>] [--include-legacy]
```

### 5.2 動作仕様

| 振る舞い | 仕様 |
| --- | --- |
| 既定ソート | `timestamp` 降順 |
| `--since` | 指定 ISO 以降の fragment のみ抽出 |
| `--out` | 出力ファイル。**tracked canonical ledger を指す場合は exit 2** |
| `--include-legacy` | legacy include window（30 日）内の `_legacy*.md` を末尾「Legacy」セクションに連結 |
| 不正 front matter | path を stderr 出力 → exit 1 |
| fragment 0 件 | 空出力（exit 0） |

### 5.3 使用例

```bash
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements --since 2026-04-01T00:00:00Z --out /tmp/skill-logs.md
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements --include-legacy
```

### 5.4 legacy 擬似 timestamp

`_legacy*.md` には fragment と同形式の timestamp が存在しないため、render は擬似 timestamp 抽出層を持つ:
- 第 1 順位: ファイル mtime
- 第 2 順位: 本文末尾 entry の日付を heuristic で抽出

`--include-legacy` 指定時のみ末尾「Legacy」セクションに連結し、純粋 fragment 群と混在させない。

## 6. append helper の責務

writer / hook / 手動運用は **`LOGS.md` 直接追記を一切行ってはならない**。共通 append helper（`pnpm skill:logs:append` 相当）に集約する。

```bash
# helper が内部で行う最小処理
ts=$(date -u +%Y%m%d-%H%M%S)
branch_esc=$(git rev-parse --abbrev-ref HEAD | tr '/' '-' | tr -c 'a-z0-9-' '-')
nonce=$(openssl rand -hex 4)
path=".claude/skills/${SKILL}/LOGS/${ts}-${branch_esc}-${nonce}.md"
# 事前存在チェック → 衝突時は nonce 再生成リトライ
```

CI には以下のガードを必須化する:

```bash
# writer 経路に LOGS.md 直接追記が残っていないことを確認
git grep -n 'LOGS\.md' .claude/skills/   # writer ヒット 0 件
```

## 7. エラーハンドリング

| ケース | 扱い |
| --- | --- |
| 同一 fragment path が既に存在 | エラーにし、nonce 再生成を促す |
| `--out` が tracked canonical ledger を指す | exit 2 で書き込み拒否 |
| fragment front matter が壊れている | 対象ファイル名を stderr 出力して exit 1 |
| `_legacy.md` が存在しない | 警告なしで fragment のみ render |

## 8. 4 worktree smoke

```bash
git checkout main
for n in 1 2 3 4; do bash scripts/new-worktree.sh verify/a2-$n; done
# 各 worktree で append → main から merge
git ls-files --unmerged   # => 0 行
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements   # 4 entry が降順
```

証跡は `outputs/phase-11/evidence/<run-id>/a2/` に保存。

## 9. 後方互換

- `_legacy*.md` は **削除禁止**（Phase 3 backward-compat 方針）
- legacy include window: 30 日（既定）
- skill 利用者は外部 API の変更を受けない（render CLI のみ追加）

## 10. 関連 references

- `skill-ledger-overview.md` — 4 施策の概要と適用順
- `skill-ledger-gitignore-policy.md` — A-1（A-2 完了が前提）
- `skill-ledger-gitattributes-policy.md` — B-1（A-2 完了後の保険）
- `lessons-learned-skill-ledger-redesign-2026-04.md` — 苦戦箇所
- `spec-splitting-guidelines.md` — classification-first の親ルール
