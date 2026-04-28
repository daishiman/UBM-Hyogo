# Implementation Guide — A-1〜B-1 実装タスク向け

本書は本タスク（仕様書）完了後に着手する **4 つの実装タスク** が参照する作業ガイド。
PR メッセージのテンプレート元としても使用する。

## Part 1: はじめて読む人向け

### なぜ必要か

1 冊の連絡ノートを 4 人が同時に書き換えると、同じページの同じ場所に文字が重なってしまう。
今の skill 配下の記録ファイルもこれと同じで、複数の作業場所から同じ `LOGS.md` や自動生成ファイルを
更新すると、Git が「どちらを残すか」を決められず止まる。

この仕様は、連絡ノートを「人ごとの小さな紙」に分け、あとで順番に並べて読めるようにするための
設計図である。実コードはまだ変えず、後続の実装タスクが迷わないように、どの紙をどこへ置き、どう集め、どの変更を
記録しないかを決めた。

### 今回作ったもの

- A-1〜B-1 の実装順序と参照 runbook。
- 小さな記録ファイルの名前の付け方。
- 後続実装で使う検証手順と証跡の置き場所。

### 何をするか

- 自動で作り直せる一覧表は、Git に記録させない。
- 追記するだけの記録は、1 人 1 ファイルの小さな記録に分ける。
- 長くなった説明書は、入口だけを短くして、詳しい説明を別ファイルへ移す。
- どうしても 1 ファイルへ追記するものだけ、両方の追記を残す Git 設定を使う。

日常の例えでいうと、全員で同じホワイトボードに書くのをやめ、各自が付箋を書いてから最後に時刻順で貼る方式に変える。

## Part 2: 開発者向け技術詳細

### 概要 — 4 施策と目的

| ID | 施策 | 対象 | 衝突解消メカニズム |
| --- | --- | --- | --- |
| A-1 | 自動生成 ledger の `.gitignore` 化 | `indexes/keywords.json` / `index-meta.json` 等 | git tree から外れるため衝突対象外 |
| A-2 | Changesets パターン fragment 化 | `LOGS.md` / `SKILL-changelog.md` / `lessons-learned-*.md` | 各 worktree が一意 path に新規作成 |
| A-3 | SKILL.md の Progressive Disclosure | 肥大化した skill 本体ファイル | 200 行未満の entrypoint + `references/` 分割 |
| B-1 | `.gitattributes merge=union` | 行独立な append-only ledger | 両 worktree の追記行を保存 |

### TypeScript 型定義

```ts
export type SkillLedgerMeasure = "A-1" | "A-2" | "A-3" | "B-1";

export interface SkillLedgerFragment {
  skillName: string;
  timestamp: string;
  escapedBranch: string;
  nonce: string;
  relativePath: `LOGS/${string}.md`;
}

export interface RenderSkillLogsOptions {
  skill: string;
  since?: string;
  out?: string;
  includeLegacy?: boolean;
}
```

### CLIシグネチャ

```bash
pnpm skill:logs:render --skill <name> [--since <ISO>] [--out <path>] [--include-legacy]
```

```ts
export async function renderSkillLogs(options: RenderSkillLogsOptions): Promise<string>;
```

### 使用例

```bash
pnpm skill:logs:render --skill aiworkflow-requirements --since 2026-04-01T00:00:00Z --out /tmp/skill-logs.md
```

### 前提条件・依存関係

- 本タスク（task-conflict-prevention-skill-state-redesign）の Phase 1〜13 が承認済
- 各実装タスクの実装着手前に `outputs/phase-2/` 設計書を再読
- 並列開発中の他 worktree が同 ledger を触らないこと（タスク開始時に announce）

### 実装順序（A-2 → A-1 → A-3 → B-1）

| 順 | 施策 | 順序根拠 |
| --- | --- | --- |
| 1 | A-2 fragment 化 | render script と fragment 規約が他施策の前提。既存 `LOGS.md` を `_legacy.md` 退避してから、新規 fragment 受け入れ可能な状態を作る |
| 2 | A-1 gitignore 化 | A-2 で fragment 受け皿が出来た後、自動生成 ledger を ignore 化。先に ignore 化すると render script が参照できず破綻 |
| 3 | A-3 SKILL.md 分割 | 単独で並列衝突しないため、A-2/A-1 後に余裕を持って実施 |
| 4 | B-1 `.gitattributes` | fragment 化できない / 移行猶予中の legacy ledger に対する **保険**。最後に適用 |

### 各施策の参照先 runbook

| 施策 | 参照ファイル |
| --- | --- |
| A-1 | `outputs/phase-5/main.md` / `outputs/phase-5/gitignore-runbook.md` |
| A-2 | `outputs/phase-6/main.md` / `outputs/phase-6/fragment-runbook.md` + `outputs/phase-2/fragment-schema.md` + `outputs/phase-2/render-api.md` |
| A-3 | `outputs/phase-7/main.md` / `outputs/phase-7/skill-split-runbook.md` |
| B-1 | `outputs/phase-7/main.md` / `outputs/phase-7/gitattributes-runbook.md` + `outputs/phase-2/gitattributes-pattern.md` |

### 設定項目と定数一覧

| 項目 | 既定 | 説明 |
| --- | --- | --- |
| fragment directory | `LOGS/` | skill ごとの append-only fragment 保存先 |
| timestamp format | `YYYYMMDD-HHMMSS` | ファイル名先頭の時刻 |
| nonce length | 8 hex | 同一秒・同一 branch の一意性担保 |
| SKILL.md target | 200 lines 未満 | entrypoint の行数目安 |
| legacy include window | 30 days | `_legacy.md` を render に含める移行期間 |

### エラーハンドリング

| ケース | 扱い |
| --- | --- |
| 同一 fragment path が既に存在 | エラーにし、nonce 再生成を促す |
| `--out` が tracked canonical ledger を指す | 書き込み拒否 |
| fragment front matter が壊れている | 対象ファイル名を表示して fail-fast |

### エッジケース

| ケース | 扱い |
| --- | --- |
| `_legacy.md` が存在しない | 警告なしで fragment のみ render |
| `merge=union` 対象が JSON / YAML | 適用禁止。行独立でないため Phase 3 へ戻す |

### テスト構成

| 層 | 参照 |
| --- | --- |
| 単体 | `outputs/phase-4/merge-conflict-cases.md` |
| 統合 | `outputs/phase-4/parallel-commit-sim.md` |
| 手動 smoke | `outputs/phase-11/manual-smoke-log.md` |
| リンク健全性 | `outputs/phase-11/link-checklist.md` |

### 検証手順

| 検証 | 参照 |
| --- | --- |
| 単体: 各施策の動作 | 各 runbook 末尾の検証コマンド |
| 統合: 4 worktree 並列衝突 0 件 | `outputs/phase-4/parallel-commit-sim.md` |
| 手動 smoke | `outputs/phase-11/manual-smoke-log.md` |
| リンク健全性 | `outputs/phase-11/link-checklist.md` |

各実装タスク完了時、上記 smoke を実行し `outputs/phase-11/evidence/<run-id>/` に
証跡を保存する。

### ロールバック戦略

| 施策 | ロールバック手順 |
| --- | --- |
| A-1 | `.gitignore` の該当行を revert → 自動生成物を再追跡 |
| A-2 | `LOGS/` ディレクトリを削除し `_legacy.md` を `LOGS.md` に rename |
| A-3 | `references/` 分割を revert（git revert で 1 コミットで戻る粒度を維持） |
| B-1 | `.gitattributes` の該当行を revert |

各実装は **1 PR = 1 施策** を原則とし、独立 revert を可能にする。

### PR テンプレート

```markdown
## Summary
- 施策: <A-1 / A-2 / A-3 / B-1>
- 仕様書: docs/30-workflows/task-conflict-prevention-skill-state-redesign/
- 参照 runbook: outputs/phase-<N>/<runbook>.md

## Changes
- 変更ファイル: <list>
- visual evidence: なし（NON_VISUAL）

## Verification
- [ ] runbook 単体検証 PASS
- [ ] 4 worktree smoke (`outputs/phase-11/manual-smoke-log.md`) で衝突 0 件
- [ ] evidence: `outputs/phase-11/evidence/<run-id>/`

## Rollback
- 本書 §6 に従う
```

### 関連リンク

- 本タスク index: `../../index.md`
- 仕様書一覧: `../../phase-01.md` 〜 `../../phase-13.md`
- specs 追記方針: `./system-spec-update-summary.md`
- 未タスク: `./unassigned-task-detection.md`
