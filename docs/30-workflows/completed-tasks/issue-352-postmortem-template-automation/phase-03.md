# Phase 3: 設計レビュー — issue-352-postmortem-template-automation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-09c-postmortem-template-automation-001 |
| phase | 3 / 13 |
| wave | 09c-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #352 |

## 目的

Phase 2 設計を、苦戦箇所 S1-S5・既存 09c Phase 6 / Phase 11 contract と突合してレビューし、欠落・矛盾・責務逸脱を Phase 4 以降に持ち越さない。**NO-GO 条件**を明記し、依存 09c Phase 11 evidence path に変動があった場合に Phase 4 着手を停止する gate を確立する。

## 実行タスク

1. 苦戦箇所 S1-S5 が Phase 2 で全て構造的に吸収されているか確認する。
2. 09c Phase 11 evidence の主要ファイル群（`main.md` 等）の path が現行リポジトリに存在することを確認する。
3. runbook 責務重複（既存 incident response 本文との overlap）が無いことを確認する。
4. NO-GO 条件を 5 件列挙し、Phase 4 着手 gate に紐付ける。
5. レビュー指摘を Phase 2 に差し戻すべきもの / Phase 4-5 で吸収するもの に振り分ける。

## 参照資料

| 資料名 | パス |
| --- | --- |
| Phase 1 | `outputs/phase-01/main.md` |
| Phase 2 | `outputs/phase-02/main.md` |
| 09c Phase 6 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-06.md` |
| 09c Phase 11 outputs | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/` |

## レビュー観点表

### 苦戦箇所反映チェック（S1-S5）

| ID | チェック | 結果根拠 |
| --- | --- | --- |
| S1 | template / スクリプトに blame 表現（"責任"/"blame"/"fault"/人名）が混入していないか | Phase 2 で 7 見出しを固定し、Root Cause の主語を「コード / 構成 / プロセス」と明記。Phase 5 grep gate で再確認 |
| S2 | `ensureEvidencePathExists` が `--evidence` 不在を exit 1 で拒否しているか | Phase 2 関数シグネチャで `fs.statSync` 必須・`main.md` 実在確認まで仕様化 |
| S3 | 既存 incident response runbook / 09c Phase 6 本文を編集していないか | Phase 2 「変更対象ファイル一覧」に既存 runbook が含まれない（追加のみ） |
| S4 | `generatePostmortem` が pure 関数で `Date.now()` 等の非決定要素を使わないか | Phase 2 で `occurredAt` を必須入力化、副作用なしを明記 |
| S5 | `package.json` の scripts に `postmortem:generate` が追加されているか | Phase 2 で追加例を明示、`tsx` 経由実行を仕様化 |

### 多角的チェック（リスク 3 種）

| リスク | 内容 | 緩和策 |
| --- | --- | --- |
| blame 表現の混入リスク | 担当者が template を後から拡張する際に "responsible" 列を追加する | README に「7 見出しを固定。追加は spec 改訂を要する」と明記。Phase 5 grep gate で `/responsible/i` `/blame/i` `/fault/i` `/責任/i` を 0 件 assert |
| evidence link 欠落リスク | `--evidence` を空文字 / 存在しない path で叩かれる | `ensureEvidencePathExists` でディレクトリ実在 + `main.md` 実在の二段確認。CI smoke でも検証 |
| runbook 責務重複リスク | 本タスクの runbook README に incident response 手順を書き込む誘惑 | README は「postmortem 生成と follow-up issue 起票のみ」とスコープを冒頭で明示。incident response 手順は 09c Phase 6 / 既存 runbook へリンクのみ |

### 後方互換性チェック

| 項目 | 影響 | 対応 |
| --- | --- | --- |
| `package.json` scripts 追加 | 既存 scripts に影響なし | 純粋追加 |
| `scripts/postmortem/` 新規ディレクトリ | 既存 scripts/ 配下に同名ディレクトリなし | Phase 1 の P50 で確認済み |
| `docs/30-workflows/runbooks/postmortem/` 新規ディレクトリ | `docs/30-workflows/runbooks/` 自体が新規 | 既存 ownership を侵害しない（`.github/CODEOWNERS` の global fallback `@daishiman` のみ適用） |

### コード境界レビュー

| 境界 | レビュー結果 |
| --- | --- |
| pure 関数 / CLI 層 | `generatePostmortem` は pure・`main` のみ I/O。テスタビリティが構造的に確保 |
| 外部 API | スクリプトから gh / Slack / Cloudflare を呼ばない。runbook 内の手動手順に閉じる |
| `apps/api` / `apps/web` | 影響なし（不変条件 #4 / #5 / #11 への影響なし） |

## NO-GO 条件（Phase 4 着手 gate）

以下のいずれかが真の場合、Phase 4 に進まず Phase 2 へ差し戻す:

1. **NO-GO-1**: 09c Phase 11 evidence の主要ファイル `main.md` が `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/main.md` に存在しない（dependency 09c の構造変動）。
2. **NO-GO-2**: 既存リポジトリに `scripts/postmortem/` または `docs/30-workflows/runbooks/postmortem/` が既存（重複作成のリスク）。
3. **NO-GO-3**: `package.json` に `postmortem:generate` script が既に存在する（重複）。
4. **NO-GO-4**: Phase 2 の template 7 見出しに「responsible」「責任者」「blame」「fault」を含む列が存在する（S1 違反）。
5. **NO-GO-5**: Phase 2 の `generatePostmortem` 設計に `Date.now()` `Math.random()` 等の非決定要素が含まれる（S4 違反）。

NO-GO ゲート確認スクリプト（Phase 4 着手前に実行）:

```bash
# NO-GO-1
test -e docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/main.md \
  && echo OK || echo NO-GO-1

# NO-GO-2
test ! -e scripts/postmortem && test ! -e docs/30-workflows/runbooks/postmortem \
  && echo OK || echo NO-GO-2

# NO-GO-3
! grep -q '"postmortem:generate"' package.json && echo OK || echo NO-GO-3

# NO-GO-4 / NO-GO-5 は Phase 2 spec 内の文言レビュー（人手）
```

## レビューチェックリスト

- [ ] S1: template の 7 見出しに blame 表現が無い
- [ ] S1: Root Cause セクションの主語が「コード / 構成 / プロセス」になっている
- [ ] S2: `ensureEvidencePathExists` が必須化され、`main.md` 実在まで確認する
- [ ] S3: 変更ファイル一覧に既存 runbook（09c Phase 6 / incident response 本文）が含まれない
- [ ] S4: `generatePostmortem` が pure 関数で `occurredAt` を必須入力化している
- [ ] S5: `package.json` 追加スニペットが Phase 2 に書かれている
- [ ] AC-1..AC-10 が Phase 2 の関数 / template / README に対応している
- [ ] NO-GO-1..NO-GO-5 のゲートが定義されている
- [ ] CONST_007: 「将来タスクへの先送り」前提のスコープ分割をしていない（本タスクが 1 サイクル内で完結）

## 指摘の振り分け

| 種別 | 内容 | 振り分け先 |
| --- | --- | --- |
| Phase 2 差戻し | NO-GO-4 / NO-GO-5 該当時 | Phase 2 |
| Phase 4 で吸収 | unit test の TC 採番（冪等性 / blame regex / バリデーション） | Phase 4 |
| Phase 5 で吸収 | grep gate（blame 候補語 / 既存 runbook diff 0 件） | Phase 5 |
| Phase 9 で吸収 | coverage 目標（line 80% / branch 60%） | Phase 9 |
| Phase 11 で吸収 | 実 evidence path での CLI smoke 1 件 | Phase 11 |

## サブタスク管理

- [ ] S1-S5 反映確認
- [ ] 多角的チェック（リスク 3 種）の緩和策確認
- [ ] 後方互換性チェック完了
- [ ] NO-GO-1..NO-GO-5 を gate スクリプト化
- [ ] レビュー指摘を Phase 4-5-9-11 に振り分け
- [ ] `outputs/phase-03/main.md` 作成

## 成果物

| 成果物 | パス |
| --- | --- |
| 設計レビュー | `outputs/phase-03/main.md` |

## 完了条件

- [ ] S1-S5 / 多角的チェック / 後方互換性 / コード境界 / NO-GO の 5 観点で OK
- [ ] NO-GO ゲートのスクリプトが実行可能な形で記載されている
- [ ] 指摘がある場合は振り分け先が明示されている
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 実装、commit、push、PR を実行していない
- [ ] レビュー結果が「無検証 PASS」になっていない（根拠が表で示されている）
- [ ] NO-GO ゲートが空欄になっていない（5 件全て条件記載済み）

## 次 Phase への引き渡し

Phase 4 へ、レビュー結果、NO-GO ゲート（実行コマンド込み）、Phase 4 で吸収すべき TC 採番候補（冪等性 / blame regex / 入力バリデーション / evidence 不在）を渡す。
