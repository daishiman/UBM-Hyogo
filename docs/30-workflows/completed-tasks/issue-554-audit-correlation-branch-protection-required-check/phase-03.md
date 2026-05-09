# Phase 3: governance 文書 / SSOT 反映先設計

## 目的

CLAUDE.md / aiworkflow-requirements skill 双方で「`audit-correlation-verify / verify` が `dev` / `main` の required status check である」という事実を **どこに、どの粒度で、どの語彙で** 記述するかを確定する。

## 反映先一覧

| 反映先 | 種別 | 反映内容 |
| --- | --- | --- |
| `CLAUDE.md`「ブランチ戦略」章 | 編集 | solo 運用ポリシー注記の直後に「required_status_checks contexts: ... + `audit-correlation-verify / verify`」一行を追加 |
| `CLAUDE.md`「Governance / CODEOWNERS」章 | 編集 | UT-GOV-001 確認手順に「`required_status_checks.contexts` に `audit-correlation-verify / verify` が含まれることも grep する」を追記 |
| `.claude/skills/aiworkflow-requirements/references/branch-protection.md` | 新規 or 編集 | required contexts 一覧 / 不変条件 / 検証手順 の正本 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 編集 | governance 章の anchor `branch-protection-required-checks` を追加（topic-map ヘッダ規約に準拠） |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | キーワード追加: `audit-correlation-verify`, `branch protection`, `required status check`, `contexts merge` |

## `references/branch-protection.md` の構造案

```
# branch-protection (SSOT)

## 不変条件（dev / main 共通）
- intended required_pull_request_reviews: null（solo 運用。current drift がある場合は Phase 13 user gate で扱う）
- enforce_admins: true
- lock_branch: false
- required_linear_history: true
- required_conversation_resolution: true
- allow_force_pushes: false
- allow_deletions: false

## required_status_checks.contexts（dev / main 同一を維持）
- audit-correlation-verify / verify  ← 本タスクで追加
- （その他は GitHub 側 GET の結果を正本とし、本ファイルでは網羅しない。drift 検出は UT-GOV-001 系で実行）

## 検証コマンド
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection
gh api repos/daishiman/UBM-Hyogo/branches/main/protection
```

> その他の context 一覧をここに固定列挙すると、別 workflow が増減するたびに drift する。本ファイルは「不変条件 + 本タスクで追加した context」だけを正本扱いし、context 一覧そのものは GitHub 側を SSOT とする。

## 文言ガイドライン

- 「必須チェック」ではなく **「required status check」** で統一（aiworkflow-requirements 既存語彙）。
- workflow 名と job 名のセパレータは半角スラッシュ前後にスペース 1 個（GitHub canonical）。

## DoD（Phase 3）

- [ ] `outputs/phase-3/phase-3.md` に反映先 5 件の編集差分プレビュー（before/after スニペット）が記録されている
- [ ] `references/branch-protection.md` の skeleton が `outputs/phase-3/` に配置されている
