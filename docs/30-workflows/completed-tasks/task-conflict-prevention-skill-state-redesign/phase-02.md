# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-conflict-prevention-skill-state-redesign |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 視覚証跡区分 | NON_VISUAL |
| 作成日 | 2026-04-28 |
| 上流 | Phase 1 (要件定義) |
| 下流 | Phase 3 (設計レビュー) |
| 状態 | pending |

## 目的

Phase 1 で確定した FR / NFR を、**ファイル配置 / 命名規約 / API 仕様 / .gitattributes パターン**の
4 つの設計成果物に落とし込む。Phase 5–7 の実装ランブックがそのまま参照できる粒度で固定する。

## 真の論点

1. **fragment ディレクトリ構造**: `LOGS/` 直下フラット vs `LOGS/<YYYY>/<MM>/` 階層
2. **render script の入出力**: stdout テキスト vs `LOGS.rendered.md` ファイル生成
3. **SKILL.md 分割の topic 粒度**: 役割別 / 機能別 / 章別のどれか
4. **`.gitattributes` の glob**: ワイルドカード範囲とエスケープ規則

## 設計成果物

### 設計成果物 1: ファイル配置 (file-layout.md)

#### A-1: gitignore 化対象

```
.claude/skills/aiworkflow-requirements/LOGS.md          # → A-2 で fragment 化、当面は ignore
.claude/skills/aiworkflow-requirements/indexes/keywords.json
.claude/skills/aiworkflow-requirements/indexes/index-meta.json
```

`.gitignore` 追記イメージ:

```
# skill 派生物（hook で再生成）
.claude/skills/*/indexes/keywords.json
.claude/skills/*/indexes/index-meta.json
.claude/skills/*/LOGS.md
```

#### A-2: fragment 化対象 → 新配置

| Before | After |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | `.claude/skills/aiworkflow-requirements/LOGS/<YYYYMMDD-HHMMSS>-<escaped-branch>-<nonce>.md` |
| `.claude/skills/task-specification-creator/SKILL-changelog.md` | `.claude/skills/task-specification-creator/changelog/<version>.md` |
| `.claude/skills/*/lessons-learned-*.md` | `.claude/skills/*/lessons-learned/<YYYYMMDD>-<topic>.md` |

#### A-3: SKILL.md Progressive Disclosure

```
SKILL.md (200 行未満、index のみ)
├── references/usage.md
├── references/triggers.md
├── references/integration.md
├── references/glossary.md
└── references/<topic>.md
```

#### B-1: .gitattributes 配置

リポジトリルート `.gitattributes` に追記。

### 設計成果物 2: fragment スキーマ (fragment-schema.md)

#### LOGS fragment

- ファイル名: `LOGS/<YYYYMMDD-HHMMSS>-<escaped-branch>-<nonce>.md`
- 正規表現: `^LOGS/[0-9]{8}-[0-9]{6}-[a-z0-9._-]+-[a-z0-9]{8,12}\\.md$`
- branch 名は `feat/wt-3` のように `/` 含む可能性あり → `_` へエスケープして格納
- 1 ファイル 1 entry。冒頭に YAML front matter を強制:

```yaml
---
timestamp: 2026-04-28T10:15:14Z
branch: feat/wt-3
author: claude
kind: log
---
```

- 本文は自由 Markdown だが、行レベル独立であることが望ましい

#### changelog fragment

- ファイル名: `changelog/<semver>.md`（例: `changelog/1.4.0.md`）
- 正規表現: `^changelog/[0-9]+\\.[0-9]+\\.[0-9]+\\.md$`
- 1 ファイル 1 release

#### lessons-learned fragment

- ファイル名: `lessons-learned/<YYYYMMDD>-<topic>.md`
- 正規表現: `^lessons-learned/[0-9]{8}-[a-z0-9-]+\\.md$`

### 設計成果物 3: render script API (render-api.md)

#### コマンド

```
pnpm skill:logs:render [--skill <skill-name>] [--out <path>] [--since <ISO8601>]
```

#### 入力

- `.claude/skills/<skill>/LOGS/*.md`（fragment 群）

#### 出力

- 既定: stdout に時系列降順マージ済み Markdown
- `--out` 指定時: 指定パスに書き出し（git 管理外を強制: `.gitignore` に該当 path を含めること）

#### 動作

1. 対象ディレクトリ内の `*.md` を列挙
2. front matter の `timestamp` でソート
3. 各 fragment の本文を `---` 区切りで連結
4. `--since` 指定があれば `timestamp >= since` のみ出力

#### 副作用

- なし（読み取り + stdout / 単一ファイル書き出しのみ）

### 設計成果物 4: .gitattributes パターン (gitattributes-pattern.md)

```
# skill ledger - merge=union (A-2 移行までの暫定 + 行独立フォーマット恒久適用)
.claude/skills/**/LOGS.md            merge=union
.claude/skills/**/lessons-learned-*.md merge=union
```

**適用しないファイル**:

- `*.json`（構造体）
- `indexes/*`（A-1 で gitignore）
- `SKILL.md`（A-3 で分割するため不要）
- root `CHANGELOG.md`（skill ledger の責務外。明示 allowlist がある場合のみ別途判断）

**注意書き**:

- `merge=union` は行レベル独立を前提とする
- A-2 fragment 化が完了したファイルは `.gitattributes` から削除する（暫定策の解除）

## 実行タスク

### タスク 1: file-layout.md 作成

**実行手順**:
1. A-1 / A-2 / A-3 / B-1 ごとに before/after マップ作成
2. 各 path の glob 表現を確定
3. `outputs/phase-2/file-layout.md` に固定

### タスク 2: fragment-schema.md 作成

**実行手順**:
1. LOGS / changelog / lessons-learned の 3 種それぞれで命名規約を正規表現で固定
2. front matter スキーマを YAML で固定
3. `outputs/phase-2/fragment-schema.md` に記載

### タスク 3: render-api.md 作成

**実行手順**:
1. CLI シグネチャ確定
2. 入出力 / 副作用を文章化
3. ソート順 / 区切り規約を確定
4. `outputs/phase-2/render-api.md` に記載

### タスク 4: gitattributes-pattern.md 作成

**実行手順**:
1. 適用対象 glob を列挙
2. 適用除外を理由付きで列挙
3. A-2 完了時の解除手順を併記
4. `outputs/phase-2/gitattributes-pattern.md` に記載

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-1/main.md | FR / NFR / 並列シナリオ |
| 参考 | https://github.com/changesets/changesets | fragment パターン参照 |
| 参考 | https://git-scm.com/docs/gitattributes | merge=union 公式 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-2/main.md | 設計サマリー |
| ドキュメント | outputs/phase-2/file-layout.md | A-1〜B-1 ファイル配置マップ |
| ドキュメント | outputs/phase-2/fragment-schema.md | A-2 命名 / front matter |
| ドキュメント | outputs/phase-2/render-api.md | render script API |
| ドキュメント | outputs/phase-2/gitattributes-pattern.md | B-1 適用範囲 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計レビューの入力 |
| Phase 4 | fragment スキーマをテストケースに反映 |
| Phase 5–7 | 各実装ランブックの基礎仕様 |

## 完了条件

- [ ] 4 設計成果物が `outputs/phase-2/` に配置
- [ ] AC-1 / AC-2 / AC-3 / AC-4 を満たす根拠が明記
- [ ] artifacts.json の Phase 2 を completed に更新

## 次 Phase

- 次: Phase 3 (設計レビュー)
- 引き継ぎ事項: 4 設計成果物
