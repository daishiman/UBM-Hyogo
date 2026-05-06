# Phase 10: 最終レビュー — issue-352-postmortem-template-automation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-09c-postmortem-template-automation-001 |
| phase | 10 / 13 |
| wave | 09c-fu |
| mode | parallel（実依存は serial: 09c → 本タスク） |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| priority | low |
| scale | small |
| GitHub Issue | #352 |

## 目的

Phase 1〜9 の成果物（要件 / 設計 / レビュー / テスト戦略 / 実装ランブック / 異常系 / AC マトリクス / DRY / 品質保証）を横断レビューし、Phase 11 NON_VISUAL evidence と Phase 12 ドキュメント更新へ渡せる状態かを判定する。

特に以下を機械的・文書的に再確認する:

- AC-1..AC-10 と code path / test の trace
- 苦戦箇所 S1-S5 が構造で守られていること
- CONST_004（不変条件）/ CONST_005（必須項目）/ CONST_007（1 サイクル完結）整合
- 09c workflow との整合（phase-11 evidence path 参照が壊れていない）
- 上流 unassigned-task の同期

## 苦戦箇所 S1-S5（前 phase から転記）

- S1: blame 表現禁止
- S2: 09c Phase 11 evidence path 必須
- S3: runbook 責務分離
- S4: 冪等性
- S5: pnpm スクリプト統合

## レビュー観点表

### 1. AC trace 表（AC-1..AC-10 ↔ code path / test）

| AC | 要件サマリ | 対応 code path | 対応 test | evidence ファイル |
| --- | --- | --- | --- | --- |
| AC-1 | `pnpm postmortem:generate` で markdown 生成 exit 0 | `main()` / `generatePostmortem` | TC-U-01 / Phase 11 CLI smoke | `outputs/phase-11/script-execution.md` |
| AC-2 | 7 見出し（Timeline ... Follow-up Issues）が順序通り | `HEADINGS` 定数 + `generatePostmortem` | TC-U-02 (見出し順序 assert) | `outputs/phase-11/template-headings-grep.md` |
| AC-3 | blame 表現が含まれない | `template.md` 構造 + `HEADINGS` + 文字列置換 | TC-U-03 (blame regex 0 hit assert) | `outputs/phase-11/blame-vocabulary-check.md` |
| AC-4 | `--evidence` 不在で exit 1 + stderr | `ensureEvidencePathExists` | TC-U-04 / TC-U-05 | `outputs/phase-11/script-execution.md`（異常系セクション） |
| AC-5 | release / commit 形式バリデーション | `validateInput` 内の正規表現 | TC-U-06 / TC-U-07 | 同上 |
| AC-6 | `generatePostmortem` が pure 関数 | `generatePostmortem` シグネチャ | TC-U-08（同入力 → 同 output） | Phase 9 lint / typecheck |
| AC-7 | 同一入力 2 回実行で完全一致（冪等性） | `generatePostmortem` + `Date.now()` 不使用 | TC-U-09 (diff 0 assert) | `outputs/phase-11/idempotency-check.md` |
| AC-8 | README に follow-up issue 手順（gh CLI） | `README.md` §follow-up issue | docs review | `outputs/phase-11/main.md` 内リンク |
| AC-9 | README から既存 incident response runbook はリンクのみ・本文置換なし | `README.md` 構造 + grep gate | Phase 9 grep gate | `outputs/phase-09/grep-result.txt` |
| AC-10 | unit ≥ 80% / branch ≥ 60% / CLI smoke 1 件以上 | coverage report | coverage-guard.sh exit 0 | `outputs/phase-09/coverage/` |

> AC trace 表の各行は `outputs/phase-10/main.md` にコピーし、欠落セルがあれば FAIL 判定とする。

### 2. 苦戦箇所反映チェック（S1-S5）

| ID | チェック | 判定方法 | 結果記載 |
| --- | --- | --- | --- |
| S1 | template / コード / 出力に blame 表現なし | Phase 9 grep gate（0 hit） | PASS / FAIL |
| S2 | `ensureEvidencePathExists` が directory + `main.md` を確認 | コード review + TC-U-04 / TC-U-05 | PASS / FAIL |
| S3 | 既存 09c Phase 6 / incident response 本文を編集していない | `git diff main...HEAD docs/30-workflows/completed-tasks/09c-.../` 0 行 | PASS / FAIL |
| S4 | `generatePostmortem` に非決定要素なし | grep `Date.now\|Math.random` 0 hit + TC-U-09 diff 0 | PASS / FAIL |
| S5 | `package.json` に `postmortem:generate` 追加・`tsx` 経由実行可 | `grep '"postmortem:generate"' package.json` + Phase 11 CLI smoke | PASS / FAIL |

### 3. 多角的レビューゲート（CONST_004 / CONST_005 / CONST_007）

| ゲート | 内容 | 確認 |
| --- | --- | --- |
| CONST_004（不変条件） | 不変条件 #1〜#7（CLAUDE.md）に違反なし。本タスクは `apps/api` / `apps/web` / D1 / Google Form schema を一切触らず、scripts + docs のみで完結 | `git diff main...HEAD --name-only` の対象が `scripts/postmortem/**` `docs/30-workflows/runbooks/postmortem/**` `package.json` のみ |
| CONST_005（必須項目） | Phase 2 設計の「変更ファイル一覧 / 関数シグネチャ / 入出力副作用 / テスト方針 / ローカル実行コマンド」が全て埋まっている | Phase 2 spec 視認 + Phase 8 リファクタ後にも維持されていること |
| CONST_007（1 サイクル完結） | 「将来タスクへの先送り」前提のスコープ分割をしていない。Slack / GitHub Releases / 自動内容生成は明示的に scope out として別タスク参照 | Phase 1 scope out 表 + index.md の Scope Out |

### 4. 09c workflow との整合確認

| 確認項目 | 期待 | 確認コマンド |
| --- | --- | --- |
| 09c Phase 11 evidence path が現存 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/main.md` が存在 | `test -e <path> && echo OK` |
| README / template が 09c phase-11 evidence への参照リンクを持つ | grep でリンク文字列 1 件以上 | `rg -n "09c-serial-production-deploy-and-post-release-verification/outputs/phase-11" docs/30-workflows/runbooks/postmortem/` |
| 09c Phase 6 rollback 4 種への参照 | template の Response セクションに rollback type 列挙（worker / pages / D1 / cron） | template.md 内容 review |
| 09c の本文を破壊していない | `git diff main...HEAD docs/30-workflows/completed-tasks/09c-.../` が空 | 上記 diff コマンド |

### 5. 上流 unassigned-task との同期確認

| 確認項目 | 期待 |
| --- | --- |
| `docs/30-workflows/unassigned-task/task-09c-postmortem-template-automation-001.md` の status を `spec_created` または `in_progress` に更新（または別 phase で更新予定として明記） | Phase 12 で同期する場合は本 Phase でも同期予定であることを記録 |
| GitHub Issue #352 と本 spec の AC が一致 | Issue #352 body の AC リストと Phase 1 AC-1..AC-10 が同一 |
| 09c Phase 12 `unassigned-task-detection.md` から本タスクへの参照 | 「Postmortem template automation. — Future task after first incident exercise.」エントリが本仕様書 / Issue #352 にトレースされる |

## 判定区分

| 判定 | 条件 | 対応 |
| --- | --- | --- |
| PASS | 全観点で問題なし | Phase 11 へ進行 |
| MINOR | 軽微な指摘あり（docs typo 等） | 未完了タスクとして記録後 Phase 11 へ進行 |
| MAJOR | AC trace に欠落 / S1-S5 のいずれかで FAIL / runbook 責務逸脱 | Phase 5 / 8 / 9 へ差し戻し |
| CRITICAL | 不変条件違反 / 09c 本文破壊 / 外部依存追加 | Phase 1 へ戻り要件再確認 |

## 差し戻し条件

- AC のいずれかに code path / test / evidence 紐付けがない（→ Phase 4-5）
- S1 grep / S4 冪等性 / S5 pnpm 統合のいずれかが FAIL（→ Phase 5 or Phase 8）
- coverage が目標を下回る（→ Phase 4-5 で TC 追加）
- 09c の本文に diff が出ている（→ Phase 5 即修正・S3 違反）
- README が incident response 手順を本文として書いている（→ Phase 5・S3 違反）

## 統合テスト連携

| レビュー項目 | 確認内容 | 結果記載先 |
| --- | --- | --- |
| 全テスト結果 | unit 全 TC PASS | `outputs/phase-10/main.md` |
| カバレッジ | 80%+ 達成 | 同上 |
| 接続テスト | N/A（NON_VISUAL / CLI 単体） | - |
| 09c integration | evidence path 参照リンクが生きている | 同上 |

## 多角的チェック観点

- AC trace 表に空欄が無いか
- S3（runbook 責務分離）違反が grep gate で漏れなく検出できているか
- 09c の `outputs/phase-11/` ディレクトリ構造の変更があった場合に、本タスクの参照が壊れていないか
- Issue #352 の追加コメントで AC の追加 / 変更が無いか（あれば取り込み）
- CONST_007: 「Slack 通知」「GitHub Releases 自動化」を本タスク内に取り込もうとしていないか（別タスクへの委譲を再確認）

## サブタスク管理

- [ ] AC trace 表（AC-1..AC-10）作成・全行 evidence 紐付け
- [ ] S1-S5 反映 PASS / FAIL 判定
- [ ] CONST_004 / CONST_005 / CONST_007 確認
- [ ] 09c Phase 11 evidence path 参照確認
- [ ] 上流 unassigned-task 同期予定の確認
- [ ] 判定区分（PASS / MINOR / MAJOR / CRITICAL）確定
- [ ] 差し戻し有無 / 戻り先 phase 記録
- [ ] `outputs/phase-10/main.md` 作成

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 最終レビュー結果 | `outputs/phase-10/main.md` | AC trace / S1-S5 / CONST / 判定 / 差し戻し有無 |

## 完了条件

- [ ] AC trace 表が全行 evidence 紐付けで埋まっている
- [ ] S1-S5 / CONST_004 / CONST_005 / CONST_007 が PASS
- [ ] 09c Phase 11 evidence path 参照が生きている
- [ ] 上流 unassigned-task との同期予定が明記
- [ ] 判定結果（PASS / MINOR / MAJOR / CRITICAL）が記録
- [ ] 差し戻しがある場合は戻り先 phase が指定
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] レビュー結果が「無検証 PASS」になっていない（各観点に根拠表が伴う）
- [ ] 09c の本文 / 既存 runbook 本文を編集していない（S3）
- [ ] 不変条件 #1〜#7 違反がない（CONST_004）

## 次 Phase への引き渡し

Phase 11 へ、PASS / MINOR 判定、AC trace 表、09c Phase 11 evidence path 確認結果、NON_VISUAL evidence の対象一覧（5 件: script-execution / template-headings-grep / blame-vocabulary-check / idempotency-check / redaction-check）を渡す。
