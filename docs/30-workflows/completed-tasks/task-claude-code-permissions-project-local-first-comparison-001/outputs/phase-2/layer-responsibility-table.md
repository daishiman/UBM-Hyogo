# 4 層責務表（D-1 ドラフト）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 区分 | 設計成果物（ドラフト） |
| 確定 Phase | Phase 3 R-1 でレビュー、Phase 5 で比較表 Section 1 として固定 |
| 作成日 | 2026-04-28 |
| visualEvidence | NON_VISUAL |

## 1. 4 層責務表

| 階層 | パス（例） | 想定利用者 | 変更頻度 | git 管理可否 | 担当キー（例） | 主な責務 |
| --- | --- | --- | --- | --- | --- | --- |
| global | `~/.claude/settings.json` | マシン所有者（個人） | 低 | 管理外（dotfile 個別運用） | `defaultMode` / `permissions.allow` / `permissions.deny` / `env`（key 名のみ） | マシン横断の既定モード・既定 permission を表現する層 |
| global.local | `~/.claude/settings.local.json` | マシン所有者（local override） | 中 | 管理外（実機固有値） | `defaultMode`（マシン上書き）/ `apiKey` 等の実機秘密 | 実機固有の override（クラウドに上げない実値） |
| project | `<project>/.claude/settings.json` | プロジェクト共有 | 低 | リポジトリにコミット | `permissions.allow` / `permissions.deny` / プロジェクト共有モード | チーム横断のリポジトリ共有設定 |
| project.local | `<project>/.claude/settings.local.json` | 個人開発者（当該プロジェクト） | 中〜高 | 通常 git ignore | `defaultMode`（個人開発時 bypass）/ 個人秘密 | 当該プロジェクト限定の個人 override |

## 2. 優先順位

### 評価順序（読み込み順）

```
global → global.local → project → project.local
```

### 勝ち優先順位（最終値）

```
project.local  >  project  >  global.local  >  global
```

> 出典: `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md` §1。Phase 3 R-1 で Anthropic 公式 docs と整合性を取る。

## 3. 各層の責務原則

| 原則 | 詳細 |
| --- | --- |
| 責務の局所化 | より内側（project.local）に書くほど影響半径は小さい |
| 共有 / 個人の分離 | `project` はチーム共有、`project.local` は個人 override（gitignore 前提） |
| 実値の隔離 | API token などは `*.local` 系のみに置き、`global` / `project` には記述しない |
| `defaultMode` の置き場 | 全 4 層に書ける。マシン全体既定なら global、当該プロジェクト限定なら project.local |
| `permissions.allow` / `deny` | 共有要件は project、個人要件は project.local。global は最終手段 |

## 4. 本タスクで触る範囲

| 階層 | 本タスク（spec_only）の扱い | apply タスクの扱い |
| --- | --- | --- |
| global | 読み取りのみ（現状値を記録、書き換え禁止） | 採用案 A / ハイブリッドで書き換え対象 |
| global.local | 触らない（実値含むため Read 自体しない） | 触らない |
| project | 読み取りのみ | 採用案次第（基本触らない） |
| project.local | 読み取りのみ（key 名・存在確認まで） | 採用案 B / ハイブリッドの主配置先 |

## 5. 出典スロット紐付け

各セルへの出典スロットは Phase 5 `comparison.md` で完成させる:

- `[公式 docs: settings 階層]` — 評価順序 / 勝ち優先順位の根拠
- `[実機観測: fresh プロジェクト, 2026-04-28]` — fresh 環境で各層が未配置の場合の挙動
- `[ソース MD §3.1]` — 4 層責務の用語定義

## 6. Phase 3 へのレビュー要求

- R-1: 上記表の整合性（重複 / 矛盾の不在、優先順位仮説の公式 docs 一致）
- R-2: project.local のみで fresh 環境の prompt 復帰を防げるか（再発判定）
- R-3: global を変更した場合、`~/dev` 配下の他リポジトリへの副作用件数

## 7. 参照資料

- `phase-02.md` D-1
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md` §1
- Anthropic 公式 docs（Claude Code settings 階層仕様）
