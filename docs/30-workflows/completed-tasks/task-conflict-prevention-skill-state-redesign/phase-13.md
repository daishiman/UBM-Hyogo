# Phase 13: 完了確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-conflict-prevention-skill-state-redesign |
| Phase 番号 | 13 / 13 |
| Phase 名称 | 完了確認（PR 雛形 / 変更サマリー） |
| 視覚証跡区分 | NON_VISUAL |
| ワークフロー | spec_created |
| 作成日 | 2026-04-28 |
| 上流 | Phase 12 (仕様反映) |
| 下流 | （なし。完了） |
| 状態 | pending |
| ユーザー承認 | **必須** |

## 目的

仕様書生成タスクの最終成果物を集約し、change-summary と PR 雛形を用意する。
**実際の commit / push / PR 作成はユーザー承認後に別タスクで実行する**。
本 Phase ではこれらの実行は行わない。

## 制約（重要）

- ユーザー承認なしでは Phase 13 の commit / push / PR 作成を実行しない
- 本タスクの workflow は `spec_created`。Phase 5–7 の実装ランブックは
  別タスクで実行されるため、本タスクの完了 = 実装完了 ではない
- 生成物は Markdown / JSON / `.gitkeep` のみ。コードは含まない

## 実行タスク

### タスク 1: change-summary.md 作成

**実行手順**:
1. 本タスクで生成したファイル一覧を列挙
   - index.md
   - artifacts.json
   - phase-01.md 〜 phase-13.md（13 ファイル）
   - outputs/phase-1/.gitkeep 〜 outputs/phase-13/.gitkeep
2. 各 phase の主要決定事項を 1 行サマリー
3. 4 施策（A-1 / A-2 / A-3 / B-1）と Phase 5/6/7 の対応を表化
4. `outputs/phase-13/change-summary.md` に固定

### タスク 2: pr-template.md 作成

**実行手順**:
1. PR タイトル案: `docs(skill): task-conflict-prevention-skill-state-redesign の 13 phase 仕様書追加`
2. PR 本文雛形:
   ```markdown
   ## 概要

   並列開発時の skill ledger コンフリクトを構造的に解消する仕様書を追加。

   ## 4 施策

   - A-1: 自動生成 ledger を gitignore 化（Phase 5）
   - A-2: Changesets パターンで fragment 化（Phase 6）
   - A-3: SKILL.md の Progressive Disclosure 化（Phase 7）
   - B-1: .gitattributes による merge=union 適用（Phase 7）

   ## Test plan

   - [ ] 4 worktree 並列マージで衝突 0 件（Phase 11 で別タスク実行）
   - [ ] AC-1 〜 AC-9 トレース（phase-07.md）

   ## 注意

   - workflow: spec_created（実装は別タスク）
   - 生成物は Markdown / JSON / .gitkeep のみ
   ```
3. `outputs/phase-13/pr-template.md` に固定

### タスク 3: main.md 作成

**実行手順**:
1. 完了サマリー
2. ユーザー承認待ち項目の列挙
3. 次の実行タスク（A-1 〜 B-1 実装タスク群）の入口を明記
4. `outputs/phase-13/main.md` に固定

## ユーザー承認待ち項目

- [ ] 仕様書全 13 ファイルの内容承認
- [ ] PR 作成の実行可否
- [ ] specs 追記の配置（新規 `skill-ledger.md` か既存 spec への append か）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md | タスク全体サマリー |
| 必須 | outputs/phase-2/file-layout.md | 4 施策の対象ファイル一覧 |
| 必須 | outputs/phase-6/fragment-runbook.md | A-2 後続タスク入口 |
| 必須 | outputs/phase-7/skill-split-runbook.md | A-3 後続タスク入口 |
| 必須 | outputs/phase-7/gitattributes-runbook.md | B-1 後続タスク入口 |
| 必須 | outputs/phase-8/before-after.md | 完了サマリーの用語統一元 |
| 必須 | outputs/phase-9/quality-checklist.md | 品質ゲート結果 |
| 必須 | outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | outputs/phase-11/manual-smoke-log.md | 後続 smoke 手順 |
| 必須 | outputs/phase-12/documentation-changelog.md | 変更内容 |
| 必須 | outputs/phase-12/implementation-guide.md | 後続タスク入口 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | 完了サマリー |
| ドキュメント | outputs/phase-13/change-summary.md | 全変更ファイル一覧 |
| ドキュメント | outputs/phase-13/pr-template.md | PR タイトル / 本文雛形 |

## 完了条件

- [ ] 3 ファイル作成
- [ ] ユーザー承認待ち項目が明記
- [ ] artifacts.json の Phase 13 を completed に更新（status は spec_created を維持）
- [ ] commit / push / PR 作成は実行していない（ユーザー承認後の別タスク）

## タスク終了

本仕様書タスクは Phase 13 完了で終了。
A-1 / A-2 / A-3 / B-1 の実装は **別タスク**として、本仕様書を入力に着手する。
