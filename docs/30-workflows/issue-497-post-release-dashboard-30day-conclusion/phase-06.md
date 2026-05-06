# Phase 6: 異常系（30 日未達 / retention 失効 / 機微情報混入 / schema drift / rate limit / failure 0 件）

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | post-release-dashboard 30 日連続実行 conclusion 集計と skill feedback 化 (issue-497) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系 |
| 作成日 | 2026-05-06 |
| 前 Phase | 5（仕様 runbook 作成） |
| 次 Phase | 7（AC マトリクス） |
| 状態 | spec_created |
| タスク分類 | docs-only（failure-mode-analysis） |
| taskType | docs-only（CONST_004 例外） |
| visualEvidence | NON_VISUAL |
| 実装区分 | ドキュメントのみ |

## 目的

issue-497 は read-only `gh run list` 集計とドキュメント追記に閉じるが、**30 日の時間依存**と **failure log の機微情報リスク**ゆえに固有の異常モードを持つ。本 Phase は 6 件の異常 Case を「発生条件 / 影響 / 検出方法 / 対処 / skill references への記録形式」の 5 軸で文書化し、Phase 11 実施時に「想定外」が発生しないことを保証する。

## 完了条件チェックリスト

- [ ] Case 1〜6 が 5 軸（発生条件 / 影響 / 検出方法 / 対処 / 記録形式）で揃っている
- [ ] 30 日未達 / retention 失効 / 機微情報混入 / schema drift / rate limit / failure 0 件 の 6 カテゴリが網羅されている
- [ ] 各 Case の対処が Phase 5 step sequence と紐付いている
- [ ] 機微情報混入 Case で「原文転記禁止 / 要約のみ」のルールが明記されている
- [ ] 不変条件への影響が「なし」と明記されている
- [ ] 4 条件評価が PASS 判定で根拠付き

## 異常 Case 一覧

### Case 1: 30 日未達（最古 run が着手日 - 30 日より新しい）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `gh run list --limit=80 --json createdAt --jq '.[0].createdAt'` の結果が 着手日 - 30 日 より新しい（issue-351 の post-release-dashboard.yml main merge から 30 日経過していない） |
| 影響 | AC-1（30 日連続期間カバー）が未達。集計を実施しても evidence の信頼性が成立しない |
| 検出方法 | Phase 5 step 1 の `30day-gate-check.log` で判定 |
| 対処 | (a) 仕様書を `spec_created` のまま据え置き、(b) `30day-gate-check.log` に未達理由（最古 run createdAt + 着手日 + 差分日数）を記録、(c) `index.md` の「再起動条件」を「最古 run createdAt が 着手日 - 30 日 ≦ となった時点」と明記、(d) 30 日経過後に再起動して step 2 以降を実行 |
| 記録形式 | skill references には追記しない（gate 不成立のため）/ `outputs/phase-11/30day-gate-check.log` に未達 trace のみ保存 |

### Case 2: artifact retention 失効（GitHub Actions 90 日超過で log-failed 取得不可）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | failure run の `databaseId` が 着手日 - 90 日より古く、`gh run view <id> --log-failed` がエラーまたは空出力 |
| 影響 | 該当 run の根本原因分類（Phase 5 step 7）が実施不可。AC-3（failure 根本原因分類表）に欠損期間が発生 |
| 検出方法 | Phase 5 step 4 の for loop で `|| true` により skip された id を `outputs/phase-11/log-failed-${id}.log` の不在で検出 |
| 対処 | (a) 取得可能な範囲で集計、(b) 欠損 id 一覧を `outputs/phase-11/aggregation.md` に「retention 失効」として明記、(c) skill references の failure 根本原因分類表に「retention 失効により根本原因不明: N 件」行を追加、(d) 次回 30 日 feedback タスクは ASAP に着手して retention 失効前に集計を完了するよう運用注記を追記 |
| 記録形式 | `### 30 日実測 feedback` の failure 根本原因分類表に `\| retention 失効（根本原因不明） \| N \| GitHub Actions 90 日 retention により log-failed 取得不可 \|` 行を追加 |

### Case 3: 機微情報混入（redaction grep がマッチ）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | Phase 5 step 5 の `rg -i "(token\|bearer\|secret\|Authorization)" outputs/phase-11/log-failed-*.log` が 1 件以上マッチ |
| 影響 | failure log 原文を skill references に転記すると AI 学習コンテキスト混入事故。CLAUDE.md「ローカル `.env` 運用ルール」と同等の機密保護違反 |
| 検出方法 | `outputs/phase-11/redaction-grep.log` の行数 > 0 |
| 対処 | (a) マッチ原文を **どのドキュメントにも転記しない**、(b) 該当 failure を「token 失効」「OAuth エラー」等の **要約カテゴリ** のみで skill references に記録、(c) `outputs/phase-11/aggregation.md` には redaction-grep.log の **行数のみ** を記載し原文は省略、(d) `redaction-grep.log` 自体は `.gitignore` 対象ではないが本ファイル内容を PR に貼り付けない（PR diff には含まれるため commit 前に再確認） |
| 記録形式 | `### 30 日実測 feedback` の failure 根本原因分類表で「token 失効: N 件（要約のみ / 原文は redaction 済）」と明記 |

### Case 4: schema drift（post-release-dashboard.yml が変更され conclusion 取得形式が崩れる）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | 30 日期間中に `.github/workflows/post-release-dashboard.yml` が編集され、(a) workflow_id が変わる、(b) job 名 / step 構造が変わる、(c) `--json conclusion` の取得形式が変わる、のいずれかが発生 |
| 影響 | conclusion 分布集計（Phase 5 step 3）が前後で非整合。AC-2 の集計表が一貫性を失う |
| 検出方法 | `git log --follow .github/workflows/post-release-dashboard.yml` で 30 日期間内の commit を併記し、変更時点を `aggregation.md` に明記 |
| 対処 | (a) workflow file の git log を `outputs/phase-11/workflow-changes.log` に保存、(b) `aggregation.md` で変更前 / 変更後の集計を別表に分割、(c) skill references の `### 30 日実測 feedback` 節冒頭に「対象 workflow の変更履歴」サブセクションを追加 |
| 記録形式 | `### 30 日実測 feedback` 冒頭に `#### 対象 workflow 変更履歴` セクションを追加し、commit hash + 変更日 + 概要を表化 |

### Case 5: gh CLI rate limit（limit=80 でも rate limit にかかる）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | step 2 の `gh run list --limit=80` または step 4 の `gh run view` ループで GitHub API rate limit（5000 req/h）に到達 |
| 影響 | 取得が途中で停止し、raw JSON / log-failed が不完全 |
| 検出方法 | `gh` の exit code 非ゼロ + stderr に `rate limit exceeded` |
| 対処 | (a) `gh api rate_limit` で remaining / reset を確認、(b) reset まで待機 or 翌日に再実行、(c) for loop に `sleep 1` を挿入し `gh run view` ごとに 1 秒スリープ、(d) `--limit` を 30 に下げて分割取得（最古 createdAt + cursor で次ページ取得） |
| 記録形式 | `aggregation.md` に「rate limit による分割取得実施」注記を追加。skill references には影響なし |

### Case 6: failure 0 件（異常ではないが明示すべき）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | 30 日間で `conclusion=='failure'` の run が 0 件 |
| 影響 | 異常ではなく「schedule 安定」のポジティブ証跡。ただし AC-3（failure 根本原因分類表）/ AC-4（連続 failure 区間）が「該当なし」になることを明示しないと AC-PASS 判定が曖昧化 |
| 検出方法 | `jq '[.[] \| select(.conclusion=="failure" or .conclusion=="startup_failure" or .conclusion=="timed_out")] \| length' outputs/phase-11/post-release-dashboard-30d.json` の結果が 0 |
| 対処 | (a) failure 根本原因分類表は「該当なし（30 日間 failure 0 件）」を 1 行で記録、(b) 連続 failure 区間は「最大 0 日」と明記、(c) **連続成功日数**（最長連続 success 区間）と **cancelled 件数** を補助指標として記録、(d) failure 比率は 0% で「現状維持」判定 |
| 記録形式 | `### 30 日実測 feedback` に `#### 連続成功日数 / cancelled 件数` セクションを追加し、最長連続 success / cancelled / startup_failure / timed_out の件数を表化 |

## 異常検出マトリクス

| Case | 検出層 | 検出 step | 影響 AC | 対処 Phase |
| --- | --- | --- | --- | --- |
| Case 1: 30 日未達 | shell（date 比較） | step 1 | AC-1 | Phase 10 gate / 据え置き |
| Case 2: retention 失効 | gh / file 不在 | step 4 | AC-3 | Phase 11 で欠損明記 |
| Case 3: 機微情報混入 | rg | step 5 | AC-8 | Phase 11 で要約のみ記録 |
| Case 4: schema drift | git log | step 3 補助 | AC-2 | Phase 11 で別表分割 |
| Case 5: rate limit | gh exit code | step 2 / 4 | AC-7 | Phase 11 で待機 + 分割取得 |
| Case 6: failure 0 件 | jq | step 3 | AC-3, AC-4, AC-5 | Phase 11 で「該当なし」明記 + 補助指標 |

## skill references への記録形式まとめ

| Case | references への記録 | 記録粒度 |
| --- | --- | --- |
| Case 1 | 追記なし（gate 不成立） | — |
| Case 2 | failure 根本原因分類表に「retention 失効」行 | 件数のみ |
| Case 3 | failure 根本原因分類表に要約カテゴリのみ | 原文転記禁止 |
| Case 4 | `#### 対象 workflow 変更履歴` セクション + 別表分割 | commit hash + 概要 |
| Case 5 | `aggregation.md` 注記のみ（references には影響なし） | — |
| Case 6 | `#### 連続成功日数 / cancelled 件数` セクション | 件数 + 最長連続日数 |

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | CLAUDE.md 全項目 | **影響なし** | 全 Case がドキュメント追記 / read-only シェル操作で完結 |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 6 Case の検出 / 対処 / 記録形式が固定され、後続実行者が想定外なく Phase 11 を完遂できる |
| 実現性 | PASS | 全 Case の検出が `gh` / `jq` / `rg` / `git log` / shell date のみで完結 |
| 整合性 | PASS | 全 Case の対処が Phase 5 step 1〜9 のいずれかと紐付き、skill references 記録形式が step 8 のセクション構造を拡張する形で整合 |
| 運用性 | PASS | gate 不成立 / failure 0 件 / retention 失効など「異常ではないが明示すべき状態」も含めて記録形式が確定 |

## 受入条件（AC）

本 Phase は **AC-1（gate 不成立時の据え置き）/ AC-3（retention 失効補完）/ AC-8（redaction）** の異常モード視点裏付けを担う。AC-2 / AC-4 / AC-5 についても異常時の代替記録形式を定義する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/index.md` | AC 正本 |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-05.md` | step sequence 連結 |
| 必須 | `docs/30-workflows/unassigned-task/task-issue-351-post-release-dashboard-30day-conclusion-001.md` § 7. リスクと対策 | retention / 機微情報リスクの正本 |
| 参考 | CLAUDE.md § シークレット管理 | 機微情報混入時の運用ポリシー |

## 苦戦箇所【記入必須】

- 「異常ではないが明示すべき」状態（Case 6: failure 0 件）を異常 Case として扱うかどうかで悩んだが、AC-4（連続 failure 区間 0 日でも明記）が明示している通り「失敗ゼロ = 自動 PASS ではなく、明示的に 0 を書く」運用に統一した。これにより AC 判定が客観化される。
- 機微情報混入（Case 3）は CI 経路で再発防止できないため、本 Phase の対処を「原文転記禁止 + 要約カテゴリのみ」に固定し、PR 作成時（Phase 13）に redaction-grep.log の中身が PR diff に含まれないことを再確認するチェックを追加した。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-06/failure-cases.md` | Case 1〜6 を 5 軸で記述 + 異常検出マトリクス + skill references 記録形式まとめ |
| メタ | `artifacts.json` | Phase 6 状態の更新 |

## 次 Phase への引き渡し

- 次 Phase: 7（AC マトリクス）
- 引き継ぎ事項:
  - 6 異常 Case と検出 step / 対処
  - skill references への記録形式（Case ごと）
  - 不変条件への影響「なし」
- ブロック条件:
  - 6 カテゴリのいずれかが Case として欠落
  - 機微情報混入の「原文転記禁止」ルールが欠落
  - retention 失効時の補完記録形式が欠落

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として `gh run list` raw JSON の `jq empty`、redaction grep、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
