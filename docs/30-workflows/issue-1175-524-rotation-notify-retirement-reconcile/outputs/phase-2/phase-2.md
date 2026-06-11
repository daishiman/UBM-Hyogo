# Phase 2: 設計

## 2.1 アプローチ選定

| 案 | 内容 | 採否 |
|----|------|------|
| **案A（採用・最小）** | #524 の通知統合対象テーブルから CF rotation reminder 行を削除し、参照節から dangling 2 パスを除去、冒頭に撤廃注記を追記、スコープを 2 件へ縮小 | ✅ 採用 |
| 案B（不採用） | CF token の Slack 通知を「定期 rotation reminder」から「漏洩時 event-based revocation 通知」へ置換 | ❌ 新規通知ソース設計を伴い YAGNI。別タスク化が望ましい |

> 親 followup spec（`docs/30-workflows/unassigned-task/cf-token-env-contract-and-rotation-retirement-followup-001-...md`）の推奨も案A。2026-06-10 の現行検証でも案A が current facts と整合することを確認した。

## 2.2 編集対象と責務境界

| 対象 | 責務 | ツール |
|------|------|--------|
| GitHub issue #524 本文（リモート正本） | 通知統合スコープの current facts 化 | `gh issue edit 524 --body-file <tmp>` |
| `docs/30-workflows/issues/issue-524.md`（ローカルミラー） | リポジトリ側の整合（dangling 除去） | テキスト編集 |

> 正本順位: GitHub issue 本文がリモート正本、ローカル md はミラー。両者を同一内容（メタ情報ブロックを除く本文部分）へ揃える。

## 2.3 #524 本文の Before / After（厳密差分）

### 差分 1: 冒頭に撤廃注記を追加（背景セクションの直前）

**After（追加するブロック）:**

```markdown
> **2026-06-08 更新**: CF API Token の 90 日 rotation 運用は撤廃した（`cf-token-rotation-reminder.yml` 削除・runbook tombstone 化）。
> これに伴い旧「CF rotation reminder → Slack 投稿」は**対象外**とし、本 Issue の通知統合スコープを **2 件**（post-release dashboard / analytics export）に縮小する。
> 経緯の正本: `docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement/`
```

### 差分 2: 「通知統合対象」テーブルから #407 行を削除

**Before:**

```markdown
| 由来 | 種別 | 現状の出力先 | Slack 統合後の期待 |
| --- | --- | --- | --- |
| Issue #407 | CF API Token 90 日 rotation reminder（85 日 reminder + label self-healing） | GitHub Issue 起票 | reminder 起票時に `#ubm-hyogo-ops` へ要約投稿（Token 値 / Token ID / scope 値は post しない） |
| Issue #351 | post-release dashboard automation（24h metrics 自動収集） | GitHub Actions artifact | dashboard.md の summary を `#ubm-hyogo-ops` に投稿（PII 非露出） |
| Issue #484 | Cloudflare Analytics monthly export | GitHub Actions artifact | export 成功 / 失敗を `#ubm-hyogo-ops` に投稿（zone/account redaction 維持） |
```

**After（#407 行を除去・2 行に縮小）:**

```markdown
| 由来 | 種別 | 現状の出力先 | Slack 統合後の期待 |
| --- | --- | --- | --- |
| Issue #351 | post-release dashboard automation（24h metrics 自動収集） | GitHub Actions artifact | dashboard.md の summary を `#ubm-hyogo-ops` に投稿（PII 非露出） |
| Issue #484 | Cloudflare Analytics monthly export | GitHub Actions artifact | export 成功 / 失敗を `#ubm-hyogo-ops` に投稿（zone/account redaction 維持） |
```

### 差分 3:「参照」節から dangling 2 パスを除去

**Before:**

```markdown
## 参照

- `.github/workflows/cf-token-rotation-reminder.yml`
- `.github/workflows/post-release-dashboard.yml`
- `.github/workflows/cloudflare-analytics-export.yml`
- `docs/30-workflows/operations/cf-token-rotation-runbook.md`
```

**After（削除済み workflow / tombstone runbook を除去）:**

```markdown
## 参照

- `.github/workflows/post-release-dashboard.yml`
- `.github/workflows/cloudflare-analytics-export.yml`
- 撤廃経緯: `docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement/`
```

### 差分 4:「スコープ」チェックボックスの表現を 2 件前提へ調整（任意・最小）

「上記 3 ワークフローからの投稿実装」→「上記 2 ワークフローからの投稿実装」へ数を整合させる。

**Before:** `- [ ] 上記 3 ワークフローからの投稿実装`
**After:** `- [ ] 上記 2 ワークフローからの投稿実装（post-release dashboard / analytics export）`

> secret hygiene 行の `Token 値 / Token ID / scope 値` 列挙は CF token 通知撤廃に伴い `zone / account` のみで足りるが、redaction 方針として残置しても害がないため Phase 3 で「残置可」と判定する（過剰削除を避ける）。

## 2.4 ローカルミラー（`docs/30-workflows/issues/issue-524.md`）の整合

ローカル md は冒頭にメタ情報 YAML ブロックを持つ。本文部分（背景以降）を #524 本文の After と同一にする。加えて:

- メタ情報 YAML の `updated_date: 2026-05-06` → `updated_date: 2026-06-10` へ更新。
- 本文の「参照」節を #524 After と一致させる。

## 2.5 検証パス設計

| 検証 | コマンド | 期待 |
|------|----------|------|
| #524 本文に #407 行が無い | `gh issue view 524 --json body -q .body \| grep -c "Issue #407"` | `0` |
| #524 本文に dangling workflow 参照が無い | `gh issue view 524 --json body -q .body \| grep -c "cf-token-rotation-reminder.yml"` | `0` |
| #524 本文に dangling runbook 参照が無い | `gh issue view 524 --json body -q .body \| grep -c "cf-token-rotation-runbook.md"` | `0` |
| #524 本文に撤廃注記がある | `gh issue view 524 --json body -q .body \| grep -c "2026-06-08 更新"` | `1` |
| ミラーに dangling 参照が無い | `grep -c "cf-token-rotation-reminder.yml\|cf-token-rotation-runbook.md" docs/30-workflows/issues/issue-524.md` | `0` |
| #1175 は closed のまま | `gh issue view 1175 --json state -q .state` | `CLOSED` |

## 2.6 SubAgent lane 設計（仕様書作成の並列化）

本タスクは docs-only かつ小規模のため、仕様書作成は以下 3 lane で並列化する（実装の並列ではなく仕様書出力の並列）:

| Lane | 対象 Phase | 責務 |
|------|-----------|------|
| Lane A | Phase 4-7 | 検証手順設計・編集手順・回帰 grep・カバレッジ |
| Lane B | Phase 8-11 | リファクタ判定・QA・最終レビュー・手動テスト(NON_VISUAL) |
| Lane C | Phase 12-13 | ドキュメント更新6成果物・PR作成（user-gated） |

validation lane（Phase 1-3 設計ゲート）は直列で締めてから Lane を fan-out する。

## 完了条件（Phase 2）

- [x] アプローチ（案A）を選定し根拠を記録した。
- [x] #524 本文の Before/After を 4 差分として厳密に設計した。
- [x] ローカルミラー整合方針を設計した。
- [x] 検証パス（6 コマンド）を設計した。
- [x] SubAgent lane を設計した。
