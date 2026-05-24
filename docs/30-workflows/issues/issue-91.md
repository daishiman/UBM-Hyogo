# [#91] [UT-30] task-specification-creator Wave 1 タスク対応強化

## 概要

task-01b（zod view models + Google Forms API client）実装時に判明した 2 点の課題を `task-specification-creator` スキルに反映し、同種の Wave 1 タスクでの初稿出戻りと status 再判定コストを削減する。

## 目的

1. **Phase 12 Part 1 のジャンル別サンプル追加** — 型基盤 / SDK / UI / デプロイ等のカテゴリごとに「中学生レベル」概念説明のサンプルをテンプレに追加し、初稿の平易性・正確性バランスを最初から担保する。
2. **Wave 1 向け status 再判定ルールの明文化** — 同一ブランチで仕様→実装まで完結する場合に、Phase 12 で `spec_created` → `implementation_completed` へ再判定する標準手順を参照資料に追記する。

## スコープ

### 含む

- `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` へのジャンル別 Part 1 サンプルセクション追加（型基盤 / SDK / UI / デプロイ の 4 ジャンル最低各 1 例）
- `.claude/skills/task-specification-creator/references/patterns-phase12-optimization.md` への Wave 1 向け status 再判定フロー追記（判定条件・再判定トリガー・更新対象ファイルリスト）
- `.claude/skills/task-specification-creator/references/create-workflow.md` へのWave 1 フラグ定義追記
- 上記変更に対応した `SKILL-changelog.md` エントリ追加

### 含まない

- 既存 Phase 12 テンプレートの構造変更（サンプルセクションの追加のみ）
- Phase 1〜11 / Phase 13 への影響
- スキル本体のロジック変更（参照ドキュメント・テンプレートの加筆のみ）

## 苦戦箇所・知見

### Phase 12 Part 1 の抽象度バランス問題

branded 型・zod schema・ViewModel などの型基盤概念を「中学生レベル」で説明する際、日常用語の類推だけでは技術的な正確性が失われる。

- **発生したコスト**: Part 1 の初稿を複数回書き直す必要が生じた
- **有効だった対策**: 類推の直後に短い用語説明（インライン用語集）を挿入し、Part 2 への橋渡し文を明示した
- **テンプレへの反映方針**: ジャンル別に「類推 → インライン用語集 → Part 2 橋渡し」の構成パターンをサンプルとして追加

### 仕様判定（spec_created vs implementation_completed）の再判定ルール欠如

Wave 1 タスクでは仕様書作成と実装が同一ブランチで同時進行するため、Phase 1 時点で `spec_created/docs-only` と判定したものが、Phase 8〜10 で code パッケージが追加された段階で再判定が必要になる。

## 完了条件

- [ ] `phase-12-documentation-guide.md` に型基盤 / SDK / UI / デプロイ の各 Part 1 サンプルが 1 例以上追加されている
- [ ] 各サンプルが「類推 → インライン用語集 → Part 2 橋渡し」の構成パターンを満たしている
- [ ] `patterns-phase12-optimization.md` に Wave 1 再判定チェックリストが追記されている
- [ ] 再判定チェックリストにトリガー条件（code パッケージ追加）・更新対象ファイルリストが明記されている
- [ ] `create-workflow.md` の Phase 12 ステップに Wave 1 フラグ確認チェックポイントが追加されている
- [ ] `SKILL-changelog.md` に本改善エントリが追加されている
- [ ] 既存の Phase 12 テンプレート構造との整合が確認されている

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-30 (wave1-enhancement) |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 3 |
| 状態 | unassigned |
| 組み込み先 | `.claude/skills/task-specification-creator/` |

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md`
- `.claude/skills/task-specification-creator/references/patterns-phase12-optimization.md`
- `.claude/skills/task-specification-creator/references/create-workflow.md`
- `.claude/skills/task-specification-creator/SKILL-changelog.md`
- `docs/02-application-implementation/01b-parallel-zod-view-models-and-google-forms-api-client/`
