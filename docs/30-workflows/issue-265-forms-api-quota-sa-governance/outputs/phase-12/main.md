---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 12
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 12 — main (正本ポインタ)

Phase 12 の canonical 9 headings 正本は **`outputs/phase-12/phase-12.md`** を参照する。

## 中学生レベル説明（アナロジー）

このタスクは「Google Forms から会員データを定期的に引っ張ってくる仕組み」を安全に運用するための **取扱説明書** を作る作業。

| 概念 | 中学生レベルの例え |
| --- | --- |
| Forms API quota | 水道メーター。1 日に使える水の上限が決まっている |
| per-project / per-user quota | 「1 軒の家全体で使える量」と「家族 1 人あたりで使える量」両方に上限がある |
| Service Account (SA) | 家の鍵。Forms API を「読みに行く人」の身分証 |
| SA 分離 | 鍵をいろんな用途と兼用しない（1 つの鍵を 3 か所で使うと、紛失時に全部開け直し） |
| project 切替 trigger | 水の使用量が増えてきたら、別契約のメーターに分ける条件 |
| 余裕率 70% | 上限の 70% を超えたら危ない、という安全マージン |
| 実値非混入 | 鍵の写真をドキュメントに貼らない（写真が漏れたら鍵を作り直せる、けど面倒） |

## strict 7 ファイル

| ファイル | 役割 |
| --- | --- |
| `phase-12.md` | canonical 9 headings 正本 |
| `main.md`（本ファイル） | 中学生レベル説明 + 正本ポインタ |
| `implementation-guide.md` | Phase 13 実行手順（実行はしない） |
| `unassigned-task-detection.md` | 「unassigned task: 0 件」明記 |
| `system-spec-update-summary.md` | CLAUDE.md / specs 不変判断 |
| `documentation-changelog.md` | 新規 24 ファイル一覧 |
| `skill-feedback-report.md` | skill 波及（提案最小） |
| `phase12-task-spec-compliance-check.md` | canonical 9 自己チェック表 |

## 判断ログ（要約）

詳細は `phase-12.md` の「判断ログ」セクション参照。

- standalone 化判断（UT-03 CLOSED）。
- CLAUDE.md 不変判断（governance doc 単独完結）。
- unassigned 0 件判断（candidate なし）。
- NON_VISUAL 判断（docs-only）。
