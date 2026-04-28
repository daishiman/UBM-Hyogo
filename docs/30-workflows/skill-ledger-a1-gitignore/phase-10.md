# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 自動生成 skill ledger の gitignore 化 (skill-ledger-a1-gitignore) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-28 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test / 4 worktree 検証) |
| 状態 | spec_created |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

## 目的

Phase 1〜9 で確定した要件・設計・レビュー・QA をもとに、AC-1〜AC-11（うち本 Phase の判定対象は Phase 1 で固定された主要 6 件 = AC-1 / AC-2 / AC-3 / AC-5 / AC-6 / AC-9）に対する PASS/FAIL マトリクスを作成し、blocker 判定基準と最終 GO/NO-GO を確定する。本ワークフローは docs-only / spec_created に閉じるため、最終判定は **「仕様書としては PASS / 実装は Phase 5 別 PR で実施するため status=spec_created」** とし、MINOR 指摘は Phase 12 で未タスク化する方針を明文化する。

## 実行タスク

1. AC 主要 6 件（AC-1 / AC-2 / AC-3 / AC-5 / AC-6 / AC-9）の達成状態を spec_created 視点で評価する（完了条件: 6 件すべてに PASS / FAIL / 仕様確定先が付与されている）。
2. AC-4 / AC-7 / AC-8 / AC-10 / AC-11 の補助 5 件についても spec_created 視点で評価する（完了条件: 11 件すべてに判定がある）。
3. 4 条件（価値性 / 実現性 / 整合性 / 運用性）に対する最終判定を確定する（完了条件: PASS/MINOR/MAJOR が一意に決定）。
4. blocker 判定基準を明文化する（完了条件: 「A-2 が完了していない」「実派生物の `git rm --cached` 漏れ」「4 worktree smoke 未実施」の 3 件以上）。
5. MINOR 指摘の未タスク化方針を確定する（完了条件: Phase 12 unassigned-task-detection.md への formalize ルートが記述）。
6. 最終 GO/NO-GO 判定を確定し、`outputs/phase-10/main.md` に記述する（完了条件: 「仕様書としては PASS / 実装は Phase 5 別 PR / status=spec_created」が明示）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/index.md | AC-1〜AC-11 / 不変条件 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-01.md | AC 確定先 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-03.md | base case 最終判定 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-09.md | QA 結果 |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/unassigned-task-detection.md | unassigned-task formalize ルート |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-10.md | 最終レビュー phase の構造参照 |

## AC × PASS/FAIL マトリクス（spec_created 視点）

> **評価基準**: 「Phase 1〜9 で具体的に確定し、Phase 5 ランブックで実装可能粒度に分解されているか」で判定する。実装そのものは未着手。

### 主要 6 件（Phase 1 で固定された AC のうち本 Phase の中核）

| AC | 内容 | 達成状態 | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | `.gitignore` に Phase 5 runbook §Step 1 の 4 系列 glob が追加 | 仕様確定（実 `.gitignore` 編集は Phase 5） | Phase 2 ファイル変更計画 / Phase 5 runbook | PASS |
| AC-2 | tracked 派生物の棚卸しが実態（`git ls-files .claude/skills`）ベース | 仕様確定 | Phase 1 / Phase 2 完了条件 | PASS |
| AC-3 | A-2 完了が必須前提として 3 箇所で重複明記 | 確定済み（Phase 1 / 2 / 3） | Phase 1 §依存境界 / Phase 2 §依存タスク順序 / Phase 3 §着手可否ゲート | PASS |
| AC-5 | 4 worktree smoke のコマンド系列が Phase 2 に固定 | 仕様確定 | Phase 2 §smoke コマンド系列 | PASS |
| AC-6 | ロールバック設計（`git add -f` / `revert(skill): re-track A-1 ledger files` 1 コミット粒度） | 仕様確定 | Phase 2 / Phase 3 レビュー | PASS |
| AC-9 | 4 worktree 並列で派生物 conflict 0 件が Phase 1 AC として固定 | 仕様確定 | Phase 1 §AC | PASS |

### 補助 5 件

| AC | 内容 | 達成状態 | 判定 |
| --- | --- | --- | --- |
| AC-4 | hook ガードが冪等設計として state ownership 表に記載 | Phase 2 で確定 | PASS |
| AC-7 | `docs-only` / `NON_VISUAL` / `infrastructure_governance` が Phase 1 / artifacts.json で一致 | 確定済み | PASS |
| AC-8 | 代替案 4 案以上が PASS/MINOR/MAJOR で評価され base case 確定 | Phase 3 で確定（A〜D 4 案） | PASS |
| AC-10 | Phase 1〜13 が artifacts.json と完全一致 / Phase 1〜3 = completed / 4〜13 = pending | 確定済み | PASS |
| AC-11 | 4 条件すべて PASS が Phase 1 / Phase 3 の双方で確認 | 確定済み | PASS |

**合計: 11/11 PASS（spec_created 視点）**

## 4 条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 4 worktree 並列で派生物 conflict 0 件化が Phase 1 AC で固定、Phase 3 base case 評価でも PASS |
| 実現性 | PASS | `.gitignore` / `git rm --cached` / hook ガードはすべて既存技術。Phase 5 runbook で実装可能粒度に分解済み |
| 整合性 | PASS | 不変条件 #5 を侵害しない / skill ledger 派生物 / 正本境界を強化 / Phase 8 用語統一 |
| 運用性 | PASS | lefthook 経由で hook 配置、1〜2 コミット粒度のロールバック、Phase 9 検証コマンドが 1 行で再現可能 |

**最終判定: PASS（仕様書として）**

## blocker 判定基準

> 以下のいずれかに該当する場合、Phase 5 別 PR は **着手 NO-GO**。本ワークフロー（spec_created）は仕様書整備に閉じるため、これらの blocker は Phase 5 着手前の必須ゲートとして機能する。

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | A-2（task-skill-ledger-a2-fragment）が completed でない | 上流タスク（最重要） | A-2 PR が main にマージ済み、または `LOGS.md` の fragment 退避が完了 | A-2 ワークフローの artifacts.json `state: completed` 確認 |
| B-02 | 実派生物の `git rm --cached` 漏れ | 実装漏れ | `git ls-files .claude/skills | grep -E '(indexes/(keywords|index-meta)\.json|\.cache\.json|LOGS\.rendered\.md)$'` が空 | 上記コマンドが exit 0 かつ stdout 空 |
| B-03 | 4 worktree smoke 未実施 | 検証漏れ | 実装 PR の Phase 11 で `git ls-files --unmerged \| wc -l` = 0 を確認する | Phase 11 `manual-smoke-log.md` に NOT EXECUTED の手順 ||| B-03 | 4 worktree smoke 未実施 | 検証漏れ | 実装 PR の Phase 11 で `git ls-files --unmerged \| wc -l` = 0 を確認する | Phase 11 `manual-smoke-log.md` に NOT EXECUTED の手順 |
| B-04 | hook が canonical を書く設計が残っている | 設計違反 | Phase 2 state ownership 表 / Phase 8 ヘルパー仕様で「canonical 不可」が明記され、実 hook script でも遵守 | hook script の grep + Phase 11 smoke |
| B-05 | `LOGS.md` 本体が target globs に含まれている | 危険操作 | `.gitignore` に `LOGS.md` 直接記述がない（`LOGS.rendered.md` のみ） | `grep -E '^LOGS\\.md$' .gitignore` が 0 件 |

### blocker 優先順位

1. **B-01（A-2 未完了）**: 履歴喪失事故の主要因。原典スペック §9 で最重要苦戦箇所。Phase 1 / 2 / 3 で 3 重明記済み。
2. **B-02（git rm --cached 漏れ）**: untrack されないと `.gitignore` が無効化される。
3. **B-03（4 worktree smoke 未実施）**: AC-9（conflict 0 化）の唯一の客観根拠。
4. **B-04 / B-05**: 設計違反 / 危険操作だが、Phase 1〜3 の重複明記で再発防止済み。

## MINOR 指摘の未タスク化方針

- 本 Phase 10 では **MINOR 判定なし**（4 条件 + 11 AC すべて PASS）。
- 仮に Phase 11 / 12 で MINOR が発生した場合のルール:
  1. MINOR は **必ず未タスク化**（本ワークフロー内で抱え込まない）。
  2. `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/` 配下に新規 .md を作成、または `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/unassigned-task-detection.md` に追記登録。
  3. Phase 12 の `implementation-guide.md` / `unassigned-task-detection.md` に該当 ID を記載。
  4. 該当 task は次 Wave 以降の優先度評価に回す。
- 既知候補（Phase 3 open question 由来）:
  - #1: T-6（hook 本体実装）の踏み込み度合い → Phase 5 で確定予定
  - #2: 4 worktree smoke 失敗時の切り分け手順 → Phase 11 で消化
  - #3: 案 C（submodule 化）の将来導入時期 → Phase 12 unassigned
  - #4: B-1（gitattributes / merge=union）との順序 → Phase 12

## 最終 GO / NO-GO 判定

### 判定: **PASS（仕様書として）/ status=spec_created**

- 仕様書としての完成度: **PASS**（AC 11/11 / 4 条件すべて PASS / blocker 判定基準確定）
- 実装ステータス: **spec_created**（実 `.gitignore` 編集 / `git rm --cached` / hook ガード実装は Phase 5 別 PR）
- Phase 11 進行可否: 「仕様レベルの smoke コマンド系列レビュー」のみ可。実走 smoke は Phase 5 実装後にずれ込む。
- Phase 12 進行可否: implementation-guide.md / unassigned-task-detection.md の整備は本ワークフロー内で可能。

### GO 条件（すべて満たすこと）

- [x] AC 11 件すべて PASS
- [x] 4 条件最終判定が PASS
- [x] blocker 判定基準が 3 件以上記述（本 Phase で 5 件記述）
- [x] MAJOR ゼロ
- [x] MINOR を抱え込まず未タスク化方針を明記
- [x] open question すべてに受け皿 Phase が指定済み

### NO-GO 条件（一つでも該当）

- 4 条件のいずれかに MAJOR が残る
- AC のうち PASS でないものがある
- blocker 判定基準が 3 件未満
- MINOR を未タスク化せず本ワークフロー内に抱え込む
- A-2 完了が前提として明記されていない

## 実行手順

### ステップ 1: AC マトリクス再評価
- Phase 1 で確定した AC-1〜AC-11 を spec_created 視点で再評価。

### ステップ 2: 4 条件最終判定
- Phase 3 base case を継承、Phase 9 QA 結果で再確認。

### ステップ 3: blocker 判定基準作成
- B-01〜B-05 の 5 件を確定。優先順位付き。

### ステップ 4: MINOR 未タスク化方針明文化
- 本 Phase で MINOR 0 を確認、ルールのみ記述。

### ステップ 5: GO/NO-GO 確定
- `outputs/phase-10/main.md` に「仕様書 PASS / 実装 spec_created」を明示。

### ステップ 6: open question を次 Phase へ送出
- Phase 3 open question 4 件を Phase 11 / 12 に振り分け。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に手動 smoke test（仕様レベルの review）を実施 |
| Phase 12 | unassigned-task 候補を formalize / implementation-guide.md にまとめ |
| Phase 13 | GO/NO-GO 結果を PR description に転記 |
| Phase 5 別 PR | blocker B-01〜B-05 を着手前ゲートとして再確認 |

## 多角的チェック観点

- 価値性: AC-9（conflict 0 化）の根拠が Phase 1 / 2 / 3 で確定。
- 実現性: Phase 9 QA で line budget / link 整合 / docs validator exit 0 を確認。
- 整合性: 不変条件 #5 / Phase 8 用語統一 / artifacts.json と一致。
- 運用性: blocker 5 件 + ロールバック 1〜2 コミット粒度。
- 認可境界: secret 導入なし、対象外明記済み。
- 無料枠: resource 消費なし、対象外明記済み。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-11 達成状態評価 | 10 | spec_created | 11 件 PASS |
| 2 | 4 条件最終判定 | 10 | spec_created | PASS |
| 3 | blocker 判定基準作成 | 10 | spec_created | 5 件 |
| 4 | MINOR 未タスク化方針確定 | 10 | spec_created | ルール明文化 |
| 5 | GO/NO-GO 判定 | 10 | spec_created | 仕様書 PASS / 実装 spec_created |
| 6 | open question 送出 | 10 | spec_created | 4 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | AC マトリクス × 4 条件 × blocker × GO/NO-GO 最終判定 |
| メタ | artifacts.json | Phase 10 状態の更新 |

> **path 表記正規化メモ**: Phase 10 outputs は `outputs/phase-10/main.md` に統一済み。artifacts.json / index.md / phase 本文の表記も同一である。

## 完了条件

- [ ] AC 11 件すべて PASS で評価
- [ ] 4 条件最終判定が PASS
- [ ] blocker 判定基準が 3 件以上記述（本仕様では 5 件）
- [ ] MINOR 未タスク化方針が明文化
- [ ] 最終判定が「仕様書 PASS / 実装 spec_created」で確定
- [ ] open question 4 件すべてに受け皿 Phase が指定
- [ ] outputs/phase-10/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物 `outputs/phase-10/main.md` 配置予定
- AC × 4 条件 × blocker × MINOR × GO/NO-GO × open question の 6 観点すべて記述
- artifacts.json の `phases[9].status` が `spec_created`

## 苦戦防止メモ

- 本ワークフローは「仕様書整備」が成果物。実 `.gitignore` 適用や `git rm --cached` は Phase 5 別 PR の責務であり、本 Phase で「実装 PASS」と書かない。常に **「仕様書 PASS / 実装 spec_created」** と二段で表現する。
- blocker B-01（A-2 未完了）は最重要。Phase 5 着手 PR の reviewer は本仕様書 §blocker を必ず参照すること。
- MINOR をその場で対応したくなる衝動を抑え、必ず Phase 12 unassigned-task ルートを通す。仕様書スコープを保つために重要。

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke test / 4 worktree 検証)
- 引き継ぎ事項:
  - 最終判定: 仕様書 PASS / 実装 spec_created
  - blocker 5 件（実装着手前に再確認必須）
  - open question 4 件の受け皿 Phase
  - Phase 10 outputs path 表記正規化（`main.md`）
- ブロック条件:
  - 4 条件のいずれかが MAJOR
  - AC で PASS でないものが残る
  - blocker 判定基準が 3 件未満
  - MINOR を未タスク化せず抱え込んでいる
