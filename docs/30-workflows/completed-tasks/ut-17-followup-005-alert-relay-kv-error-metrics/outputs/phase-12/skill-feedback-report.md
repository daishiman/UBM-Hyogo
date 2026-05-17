# Phase 12 — skill-feedback-report.md（UT-17-FU-005）

各 skill への feedback と structural change の要否を記録する。

---

## 対象 skill

| skill | 役割 | 本タスクでの変更要否 |
| --- | --- | --- |
| aiworkflow-requirements | システム正本仕様の検索・参照・更新 | **正本索引更新あり / structural change なし** |
| task-specification-creator | Phase 1-13 仕様書生成 | **変更なし** |
| skill-creator | skill メタ管理 | 対象外 |
| github-issue-manager | Issue 管理 | **運用ノートのみ**（下記） |

---

## aiworkflow-requirements skill への feedback

### structural change

なし。本タスクは observability 領域での emit 追加であり、skill の新ルールや
テンプレート変更は不要。ただし workflow の実装完了を検索可能にするため、
aiworkflow-requirements の indexes / task-workflow-active / artifact inventory / LOGS は
same-wave で更新する。

### references への記載要否

必要最小限。`event: "alert_relay_kv_op_failed"` のような後段集計の契約となる固定文字列は、
workflow の `outputs/phase-12/implementation-guide.md` と runbook が詳細正本であり、
aiworkflow-requirements には artifact inventory と検索索引として登録する。

UT-17-FU-006（dashboard 化）が完了した段階で、`event` 文字列契約 + dashboard URL を
セットで `aiworkflow-requirements/references/observability.md` 等に正本化する想定。

### indexes/keywords.json への追加要否

必要。`alert_relay_kv_op_failed` / `dedupeKeyHash` / `KV operation error` から
本 workflow と runbook に到達できるよう keywords を追加する。

---

## task-specification-creator skill への feedback

### structural change

なし。本タスクは既存 Phase 1-13 テンプレートに従って仕様書を生成しており、
template / format 改修の必要性は検出されなかった。

### 運用ノート

- Phase 12 strict 7 outputs のうち `skill-feedback-report.md` は本タスクのように
  「skill structural change なし」のケースでも省略しない（compliance gate のため）。
- `event` 文字列のような後段契約予約は `system-spec-update-summary.md` Step 2 に
  集約するパターンが、本タスクで再現性ある運用パターンとして確立した。

---

## github-issue-manager skill への運用ノート

### 観察

GitHub Issue #701 は `state=closed / state_reason=completed` だったが、
Issue close 時点では実コード未実装だった（issue close と実装完了の乖離）。本タスクのように
Issue closed のまま実装完了する経路を許容するため、以下を運用ノートとして残す:

- Issue closed 後に実装漏れが検出された場合、Issue を**再 open しない**選択肢を
  尊重する（ユーザー指示優先）。
- 完了 evidence は workflow `artifacts.json` の `Gate-B` / Phase 13 PR URL で代替する。
- `Closes #N` を PR 本文で使わず `Refs #N` のみとする（closed Issue を CI で再 trigger しないため）。

---

## 完了条件

- [x] aiworkflow-requirements skill への正本索引更新が記録されている
- [x] task-specification-creator skill への変更要否（なし）が記録されている
- [x] `event` 文字列契約の正本位置（原典 + implementation-guide.md）が明示されている
- [x] github-issue-manager の運用ノート（closed Issue + Refs 運用）が記録されている
