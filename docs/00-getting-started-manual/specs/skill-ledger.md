# skill-ledger — `.claude/skills/` 共有 ledger 設計

> 目的: 並列タスク間で skill 配下の ledger ファイル（`LOGS.md` / 自動生成 JSON / 肥大化した `SKILL.md` 等）が衝突する問題を、fragment 化・gitignore・merge=union・Progressive Disclosure の 4 施策で解消する
> 前提: 本ファイルは `task-conflict-prevention-skill-state-redesign` ワークフロー（phase-12）で凍結された方針を正本仕様として確定したもの
> 参照: `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/system-spec-update-summary.md` / `implementation-guide.md` / `skill-feedback-report.md`

---

## 1. 概要

複数の worktree で同じ `.claude/skills/<skill>/LOGS.md` や `indexes/keywords.json` 等を同時に追記・再生成すると、3-way merge で衝突が発生し、PR を block する。本仕様はこの衝突源を **設計レベルで除去** するための skill ledger 共通ルールを定める。

連絡ノートの例えでいうと、全員で同じホワイトボードに書くのをやめ、各自が付箋（fragment）を書いてから最後に時刻順で貼る方式に変える。

### 適用範囲

- 対象: `.claude/skills/**` 配下のすべての skill が共通で従う基盤ルール
- 非対象: UBM 兵庫支部会のドメイン仕様（フォーム / 認証 / D1 / UI）。これらは既存 specs（`00-overview.md` 〜 `13-mvp-auth.md`）で扱う

### 既存 specs との関係

`docs/00-getting-started-manual/specs/` 配下はすべてドメイン仕様。skill ledger は **開発基盤** の正本ルールであり、ドメイン仕様ファイルへの混入は責務違反となるため単独ファイルとして配置する。

---

## 2. 設計原則（4 施策）

| ID | 施策 | 対象 | 衝突解消メカニズム |
| --- | --- | --- | --- |
| A-1 | 自動生成 ledger の `.gitignore` 化 | `indexes/keywords.json` / `index-meta.json` 等 | git tree から外れるため衝突対象外 |
| A-2 | Changesets パターン fragment 化 | `LOGS.md` / `SKILL-changelog.md` / `lessons-learned-*.md` | 各 worktree が一意 path に新規作成 |
| A-3 | `SKILL.md` の Progressive Disclosure | 肥大化した skill 本体ファイル | 200 行未満の entrypoint + `references/` 分割 |
| B-1 | `.gitattributes merge=union` | 行独立な append-only ledger | 両 worktree の追記行を保存 |

### 共通原則

- **fragment 化を第一選択**にし、`merge=union` は fragment 化できない legacy ledger 限定の保険として用いる
- **行独立でないファイル**（JSON / YAML / 構造化テキスト）には `merge=union` を適用しない
- skill 利用者は外部 API（render CLI 等）のみを使い、内部 fragment 構造に直接依存しない

---

## 3. A-1 gitignore 化対象

自動で再生成可能な ledger は git tree から外し、hook やスクリプトで都度再生成する。

### 対象例

| ファイル | 種別 | 再生成手段 |
| --- | --- | --- |
| `indexes/keywords.json` | 集計 view | skill 内 generator script |
| `indexes/index-meta.json` | メタ情報 | skill 内 generator script |
| 集計 view 系 JSON | 派生 view | skill 内 generator script |

### 適用ルール

- `.gitignore` 化 **後** に generator が無いと CI が落ちるため、A-2（fragment 受け皿）整備後に適用する（順序は §7 を参照）
- 一旦 ignore 化したら、tracked のまま残った旧ファイルは `git rm --cached` で untrack する

---

## 4. A-2 fragment 化

`LOGS.md` / `SKILL-changelog.md` / `lessons-learned-*.md` 等の append-only ledger は、worktree ごとに一意 path で新規作成される **fragment** に分割する。

### 4.1 fragment 命名規約

- パス: `<skill>/LOGS/<YYYYMMDD-HHMMSS>-<escapedBranch>-<nonce>.md`
- `escapedBranch`: `/` を `-` に、英数字以外をハイフン化
- `nonce`: 8〜12 文字の小文字 hex / base36
- 同一秒・同一 branch でも `nonce` で一意性を担保

### 4.2 TypeScript schema

```ts
export type SkillLedgerMeasure = "A-1" | "A-2" | "A-3" | "B-1";

export interface SkillLedgerFragment {
  skillName: string;
  timestamp: string;          // YYYYMMDD-HHMMSS
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

### 4.3 render API 規約

- CLI:

  ```bash
  pnpm skill:logs:render --skill <name> [--since <ISO>] [--out <path>] [--include-legacy]
  ```

- 関数:

  ```ts
  export async function renderSkillLogs(options: RenderSkillLogsOptions): Promise<string>;
  ```

- 既定ソート: timestamp 降順
- `--out` は tracked な canonical ledger path を拒否（書き込み防止）

### 4.4 設定項目と既定値

| 項目 | 既定 | 説明 |
| --- | --- | --- |
| fragment directory | `LOGS/` | skill ごとの append-only fragment 保存先 |
| timestamp format | `YYYYMMDD-HHMMSS` | ファイル名先頭の時刻 |
| nonce length | 8 hex | 同一秒・同一 branch の一意性担保 |
| legacy include window | 30 days | `_legacy.md` を render に含める移行期間 |

### 4.5 後方互換方針

- 既存 `LOGS.md` は `_legacy.md` として退避し、削除しない
- A-2 移行後 30 日間は `_legacy.md` を render に含める
- skill 利用者は外部 API の変更を受けない（render CLI のみ追加）

### 4.6 エラーハンドリング

| ケース | 扱い |
| --- | --- |
| 同一 fragment path が既に存在 | エラーにし、nonce 再生成を促す |
| `--out` が tracked canonical ledger を指す | 書き込み拒否 |
| fragment front matter が壊れている | 対象ファイル名を表示して fail-fast |
| `_legacy.md` が存在しない | 警告なしで fragment のみ render |

---

## 5. A-3 Progressive Disclosure（SKILL.md 分割）

`SKILL.md` は **200 行未満の entrypoint** に保ち、詳細は `references/<topic>.md` に分離する。

### 5.1 構造

```
.claude/skills/<skill>/
├── SKILL.md                # 200 行未満の entrypoint
├── references/
│   ├── <topic-1>.md        # 詳細仕様 1
│   ├── <topic-2>.md        # 詳細仕様 2
│   └── ...
├── LOGS/                   # A-2 fragment
└── indexes/                # A-1 gitignore 対象
```

### 5.2 ガード基準

| 項目 | 基準 |
| --- | --- |
| `SKILL.md` 行数 | 200 行未満（entrypoint） |
| `references/<topic>.md` 行数 | 500 行未満（個別 topic） |
| 責務 | entrypoint は「いつ呼ぶか・どこを読むか」のみ。詳細仕様は references/ |

`SKILL.md` が 200 行を超えた場合、もしくは references/ の 1 ファイルが 500 行を超えた場合は分割する。

---

## 6. B-1 `.gitattributes merge=union`

fragment 化が困難（履歴連続性が必要 / ツール側が単一ファイルを要求 等）な行独立 ledger に限り、`.gitattributes` で `merge=union` を付与する。

### 6.1 適用条件

| 条件 | 内容 |
| --- | --- |
| 行独立 | 各行が独立して意味を持つ（前後行への依存がない） |
| append-only | 末尾追記のみ。中間行の更新がない |
| fragment 化困難 | A-2 適用が技術的・運用的に不可 |

### 6.2 禁止条件

| 禁止対象 | 理由 |
| --- | --- |
| JSON / YAML | 構造化テキストのため行 union で破壊される |
| `SKILL.md` | Progressive Disclosure の対象。merge=union は適用しない |
| 中間行を更新するファイル | 行 union で重複行が残るため整合性破綻 |

### 6.3 位置付け

B-1 は fragment 化できない / 移行猶予中の legacy ledger に対する **保険** であり、第一選択ではない。

---

## 7. 適用順（A-2 → A-1 → A-3 → B-1）

| 順 | 施策 | 順序根拠 |
| --- | --- | --- |
| 1 | A-2 fragment 化 | render script と fragment 規約が他施策の前提。既存 `LOGS.md` を `_legacy.md` 退避してから、新規 fragment 受け入れ可能な状態を作る |
| 2 | A-1 gitignore 化 | A-2 で fragment 受け皿が出来た後、自動生成 ledger を ignore 化。先に ignore 化すると render script が参照できず破綻する |
| 3 | A-3 SKILL.md 分割 | 単独で並列衝突しないため、A-2 / A-1 後に余裕を持って実施 |
| 4 | B-1 `.gitattributes` | fragment 化できない / 移行猶予中の legacy ledger に対する保険。最後に適用 |

各実装は **1 PR = 1 施策** を原則とし、独立 revert を可能にする。

### ロールバック戦略

| 施策 | ロールバック手順 |
| --- | --- |
| A-1 | `.gitignore` の該当行を revert → 自動生成物を再追跡 |
| A-2 | `LOGS/` ディレクトリを削除し `_legacy.md` を `LOGS.md` に rename |
| A-3 | `references/` 分割を revert（git revert で 1 コミットで戻る粒度を維持） |
| B-1 | `.gitattributes` の該当行を revert |

---

## 8. 関連未タスク

本仕様の実装は以下の未タスクで進める。

| タスク | 施策 | パス |
| --- | --- | --- |
| skill-ledger A-1 | gitignore 化 | `docs/30-workflows/unassigned-task/task-skill-ledger-a1-gitignore.md` |
| skill-ledger A-2 | fragment 化 | `docs/30-workflows/unassigned-task/task-skill-ledger-a2-fragment.md` |
| skill-ledger A-3 | Progressive Disclosure | `docs/30-workflows/unassigned-task/task-skill-ledger-a3-progressive-disclosure.md` |
| skill-ledger B-1 | `.gitattributes` | `docs/30-workflows/unassigned-task/task-skill-ledger-b1-gitattributes.md` |

### skill 自身への適用

`skill-feedback-report.md` の F-1〜F-5 に基づき、`task-specification-creator` / `aiworkflow-requirements` skill 自身も上記 4 施策の対象に含める（独立 skill 改修タスクは起票せず、A-1〜B-1 の各タスクスコープに skill 自身を含める）。

| # | 提案 | 適用先 | 関連施策 |
| --- | --- | --- | --- |
| F-1 | `task-specification-creator/SKILL.md` を A-3 ルールに従い分割 | skill 自身 | A-3 |
| F-2 | `task-specification-creator/SKILL-changelog.md` を fragment 化 | skill 自身 | A-2 |
| F-3 | `aiworkflow-requirements/LOGS.md` を fragment 化（最優先） | skill 自身 | A-2 |
| F-4 | `indexes/keywords.json` 等を `.gitignore` 化、hook で再生成 | skill 自身 | A-1 |
| F-5 | skill 改修ガイドに「fragment で書け」「200 行を超えたら分割」を明記 | SKILL.md / references | A-2 / A-3 |

---

## 9. 不変条件・禁止事項

### 不変条件

1. fragment は append-only。生成後の中間行更新を禁止する
2. fragment 命名は `<YYYYMMDD-HHMMSS>-<escapedBranch>-<nonce>.md` 規約に従い、`nonce` で一意性を担保する
3. `SKILL.md` は entrypoint としての責務に限定し、200 行未満を維持する
4. render API は外部 API として後方互換を保つ（CLI / 関数シグネチャの破壊的変更を禁止）
5. `_legacy.md` は移行期間（既定 30 日）中、削除しない

### 禁止事項

| 禁止内容 | 理由 |
| --- | --- |
| `merge=union` を JSON / YAML に適用 | 構造化テキストが壊れる |
| `merge=union` を `SKILL.md` に適用 | Progressive Disclosure と矛盾 |
| `--out` で tracked canonical ledger を指定 | 衝突源を再生成してしまう |
| A-1 を A-2 より先に適用 | render script が参照する受け皿が無い |
| 1 PR で複数施策をまとめる | 独立 revert ができなくなる |
| GAS prototype と同様に skill 仕様を本番昇格させる | skill ledger は開発基盤であり、ドメイン仕様と混同しない |

---

## 10. 関連仕様

### CLAUDE.md / 既存 specs

- `CLAUDE.md` ルート: ブランチ戦略 / シークレット管理 / Cloudflare CLI ラッパー規約
- `docs/00-getting-started-manual/specs/00-overview.md`: システム全体概要（ドメイン仕様）
- ドメイン仕様（`01-api-schema.md` 〜 `13-mvp-auth.md`）: skill ledger の対象外

### skill 側の制約（参考）

- `task-specification-creator` の SKILL.md は 500 行制限を背景に変更履歴テーブルを圧縮した実績がある（`task-specification-creator/SKILL-changelog.md` v10.09.43 を参照）。本仕様の A-3（200 行未満 entrypoint）はこの制約を更に強化する位置付け
- skill 内不変条件（CONST_002 等）は各 skill の `SKILL.md` 内で定義され、本仕様はそれらを尊重する

### ワークフロー成果物（正本）

| ファイル | 内容 |
| --- | --- |
| `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/system-spec-update-summary.md` | specs 追記方針の凍結テキスト |
| `.../phase-12/implementation-guide.md` | A-1〜B-1 実装タスク向けガイド |
| `.../phase-12/skill-feedback-report.md` | skill 自身への適用（F-1〜F-5） |

### 検証

| 検証 | 手段 |
| --- | --- |
| docs lint | プロジェクトに統一 lint なし。手動レビューで代替 |
| typecheck / lint | docs-only のため不要 |
| リンク健全性 | `outputs/phase-11/link-checklist.md` の手順を再実行 |
| 4 worktree 並列衝突 | `outputs/phase-4/parallel-commit-sim.md` で 0 件を確認 |
