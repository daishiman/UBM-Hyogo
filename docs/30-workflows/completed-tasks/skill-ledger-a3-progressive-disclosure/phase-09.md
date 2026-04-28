# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SKILL.md の Progressive Disclosure 分割 (skill-ledger A-3) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-28 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク分類 | docs-only / spec_created / NON_VISUAL（specification-design / QA） |

## 目的

Phase 8 までで確定した分割設計・重複解消・トレーサビリティを前提に、本タスク特有の品質観点（無料枠影響なし / skill loader 動作 / mirror 同期自動化 / 1 PR = 1 skill 厳守 / ドッグフーディング検証）を 5 観点で QA する。本タスクは Cloudflare / Google API を一切呼ばないため、**無料枠影響は「なし」と明示記録** する（`outputs/phase-09/free-tier-estimation.md`）。a11y は対象外（`.claude/skills/` の Markdown 構造のみ、UI 無し）。

## 依存境界

- 入力: Phase 8 の重複解消結果、Phase 7 AC マトリクス、Phase 5 implementation-runbook（PR 計画）。
- 出力: `outputs/phase-09/main.md`（QA サマリ） / `outputs/phase-09/free-tier-estimation.md`（影響なし記録）。
- 非対象: skill loader 本体への変更、`.claude/skills/` 配下の編集、PR 作成、コミット。

## 実行タスク

1. 無料枠影響を `outputs/phase-09/free-tier-estimation.md` に「影響なし」として記録する（完了条件: Cloudflare Workers / D1 / Google Sheets API いずれにもアクセスしない旨と根拠が記述）。
2. skill loader 動作確認手順を記述する（loader doctor が提供されている場合のみ実行、無い場合は N/A 明示）（完了条件: 実行可否と判断根拠が文書化）。
3. mirror 同期の自動化検討（rsync / `cp -r` 等の妥当性）を行い、Phase 5 ランブックの同期手順と整合させる（完了条件: 推奨コマンドと冪等性の根拠が記述）。
4. 1 PR = 1 skill 厳守チェックリストを作成する（完了条件: PR 単位粒度・revert 単位・announce ルールが項目化）。
5. ドッグフーディング検証として `task-specification-creator/SKILL.md` 自身の 200 行未満化が完了している（または完了見込み）ことを確認する（完了条件: 行数測定手順と PASS 条件が明記）。
6. a11y 対象外と line budget（各 phase-XX.md 100-250 行）の確認を行う（完了条件: 対象外宣言 + budget 表）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-05.md | 実装ランブック（PR 計画 / rsync） |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-07.md | AC マトリクス |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-08.md | DRY 化結果 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md | 1 PR = 1 skill / ロールバック原則 |
| 参考 | .claude/skills/task-specification-creator/SKILL.md | ドッグフーディング検証対象 |
| 参考 | .claude/skills/aiworkflow-requirements/SKILL.md | 既分割の整合参考 |

## 無料枠影響: 影響なし

> 詳細は `outputs/phase-09/free-tier-estimation.md` に記述。本仕様書では結論のみ。

| サービス | 本タスクでの利用 | 影響 |
| --- | --- | --- |
| Cloudflare Workers | 利用しない（Markdown 編集のみ） | なし |
| Cloudflare D1 | 利用しない（DB アクセスなし） | なし |
| Google Sheets API | 利用しない | なし |
| Google Forms API | 利用しない | なし |
| GitHub API（gh CLI） | PR 作成時のみ（Phase 13） | 無料枠内（個人開発・Issue/PR 通常使用） |

**結論: 本タスクは Cloudflare / Google API を一切呼ばない。無料枠影響は「なし」と記録する。**

## skill loader 動作確認

| 状況 | 対応 |
| --- | --- |
| loader doctor スクリプトが提供されている | 実行して entry SKILL.md が分割後も entrypoint として解決できることを確認 |
| loader doctor が未提供 | 本 Phase では N/A と明記。代替として Phase 11 の手動 smoke で `rg -n '^---' SKILL.md` 等で front matter 健全性を目視確認 |

> 本タスクのスコープでは loader / doctor 本体に手を入れない（index.md スコープ外）。動作確認は「entry が壊れていないこと」を起点とする最小確認に留める。

## mirror 同期の自動化検討

### 推奨コマンド

```bash
# canonical → mirror 全 skill 同期（destructive: --delete でずれを物理矯正）
rsync -av --delete .claude/skills/ .agents/skills/

# 単一 skill のみ同期
rsync -av --delete ".claude/skills/<skill>/" ".agents/skills/<skill>/"

# 差分検証（AC-5）
diff -r .claude/skills/<skill> .agents/skills/<skill>
```

### 冪等性の根拠

- `rsync --delete` は canonical を正本として mirror を完全一致させる。再実行で結果不変。
- `diff -r` で差分 0 を確認できる時点で同期は冪等的に達成。
- Phase 5 ランブックには「PR の最終 commit で必ず rsync を 1 回実行 → diff -r で 0 を確認」を含める。

### 自動化のスコープ判定

- Git pre-commit hook 等への組み込みは **本タスクスコープ外**（hook 整備は別タスク）。
- 本タスクでは「ランブック上の手順として明示」「`diff -r` を AC-5 として完了条件化」までで止める。

## 1 PR = 1 skill 厳守チェックリスト

- [ ] 1 PR は 1 つの `.claude/skills/<skill>/` のみを変更する
- [ ] `task-specification-creator` は最優先・単独 PR で先行する
- [ ] Anchor 追記（AC-10「fragment で書け」「200 行を超えたら分割」）は分割本体とは別の小 PR で実施
- [ ] 同一 PR 内で複数 skill を編集しない（影響範囲局所化のため）
- [ ] PR タイトルに対象 skill 名を明記（例: `refactor(skill): split task-specification-creator into references/`）
- [ ] revert は 1 PR 単位で完結する
- [ ] PR 着手前に skill 単位で announce（並列衝突回避）

## ドッグフーディング検証

| 項目 | 確認方法 | PASS 条件 |
| --- | --- | --- |
| `task-specification-creator/SKILL.md` 行数 | `wc -l .claude/skills/task-specification-creator/SKILL.md` | < 200 |
| `task-specification-creator` 単独 PR | `git log --oneline -- .claude/skills/task-specification-creator/SKILL.md` | 単一 PR で完結 |
| Anchor 追記 | `rg -n 'fragment で書け\|200 行を超えたら分割' .claude/skills/task-specification-creator/` | 2 フレーズ存在 |
| references 配置 | `find .claude/skills/task-specification-creator/references -name '*.md'` | Phase 2 設計表通り |

> spec_created 段階では「上記 4 項目の検証手順が記述されている」ことが PASS 基準。実値検証は Phase 11 で実施。

## line budget / a11y 対象外

| ファイル | budget | 判定 |
| --- | --- | --- |
| index.md | 250 行以内 | 個別判定 |
| phase-01.md 〜 phase-13.md | 各 100-250 行 | 全 PASS 想定 |
| outputs/phase-XX/*.md | 個別 | 個別チェック |

- a11y: 本タスクは `.claude/skills/` 配下の Markdown 編集のみで UI を持たないため **対象外**。

## 実行手順

### ステップ 1: 無料枠影響なしの記録

- `outputs/phase-09/free-tier-estimation.md` を作成し、利用サービス表 + 結論を記述。

### ステップ 2: skill loader 動作確認方針

- loader doctor の提供状況を確認し、N/A の場合は代替確認手順を記述。

### ステップ 3: mirror 同期の推奨コマンド整備

- `rsync --delete` + `diff -r` のセットを Phase 5 ランブックと整合。

### ステップ 4: 1 PR = 1 skill チェックリスト確定

- 7 項目を `outputs/phase-09/main.md` に記述。

### ステップ 5: ドッグフーディング検証手順記述

- `task-specification-creator` の 4 項目検証を AC-9 / AC-10 と紐付け。

### ステップ 6: line budget / a11y 対象外を明文化

## 多角的チェック観点

- 価値性: ドッグフーディング矛盾（200 行超を推奨する skill が自身を破る）が解消されるか。
- 実現性: rsync + diff の運用が pnpm / mise 環境で動くか。
- 整合性: 1 PR = 1 skill 原則と Phase 5 PR 計画が矛盾しないか。
- 運用性: mirror 同期手順が Phase 5 ランブックと一意に紐付くか。
- 認可境界: 本タスクは Secret / Cloudflare / Google API を扱わない（無料枠影響なし）。
- 無料枠: 影響なしであることが客観的に記録されているか。

## 統合テスト連携

docs-only / spec_created のためアプリ統合テストは実行しない。品質保証は `wc -l`、`rg`、`diff -r`、validate / verify scripts の NON_VISUAL 証跡で代替する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリ（5 観点） |
| ドキュメント | outputs/phase-09/free-tier-estimation.md | 無料枠影響「なし」記録 |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] `outputs/phase-09/free-tier-estimation.md` に「影響なし」と根拠が記述
- [ ] skill loader 動作確認の実行可否（提供時実行 / 未提供時 N/A）が明記
- [ ] mirror 同期の推奨コマンド（rsync + diff）が記述
- [ ] 1 PR = 1 skill チェックリストが 7 項目以上
- [ ] ドッグフーディング検証手順（4 項目）が AC-9 / AC-10 と紐付き
- [ ] line budget 表が記述
- [ ] a11y 対象外と明記

## タスク 100% 実行確認【必須】

- 実行タスク 6 件すべて `spec_created`
- 成果物 2 ファイルが `outputs/phase-09/` 配下に配置予定
- 無料枠影響「なし」が客観的に記録
- 1 PR = 1 skill 原則が Phase 5 PR 計画と一致
- ドッグフーディング検証が AC-9 / AC-10 とトレース可能
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - 無料枠影響「なし」を Phase 10 GO/NO-GO の根拠として転記
  - 1 PR = 1 skill チェックリスト → Phase 13 PR 作成時の self-review に再利用
  - ドッグフーディング検証手順 → Phase 11 manual smoke の入力
  - mirror 同期コマンド → Phase 11 で `diff -r` 実行ログを取得
- ブロック条件:
  - 無料枠影響の記録が「不明」のまま
  - 1 PR = 1 skill チェックリストが Phase 5 PR 計画と矛盾
  - ドッグフーディング検証手順が AC-9 / AC-10 と紐付かない
