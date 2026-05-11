# Phase 12: ドキュメント更新（3c — Branch Protection contexts 更新）

| 項目 | 値 |
|------|----|
| 入力 | `phase-11.md` |
| 出力 | CLAUDE.md governance 整合確認結果 / 必要な追加更新の特定 |

---

## 1. CLAUDE.md governance 整合確認

### 1.1 確認対象セクション

| セクション | 期待整合 |
|------------|---------|
| `## ブランチ戦略` | `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` / `required_linear_history` / `required_conversation_resolution` / force-push & 削除禁止 |
| `## Governance / CODEOWNERS` | `require_code_owner_reviews` 無効（PR reviews=null） |

### 1.2 確認手順

```bash
# 1) CLAUDE.md の governance 期待値を抽出
grep -n -A2 'required_pull_request_reviews=null' CLAUDE.md
grep -n -A2 'lock_branch=false' CLAUDE.md
grep -n -A2 'enforce_admins=true' CLAUDE.md

# 2) post evidence の実値と突合
jq '{
  reviews: .required_pull_request_reviews,
  lock: .lock_branch.enabled,
  enforce: .enforce_admins.enabled,
  conv: .required_conversation_resolution.enabled,
  strict: .required_status_checks.strict,
  contexts: (.required_status_checks.contexts | sort)
}' outputs/phase-11/branch-protection-dev-post.json

jq '...' outputs/phase-11/branch-protection-main-post.json
```

### 1.3 期待整合表

| field | CLAUDE.md 期待 | post 実値（runtime） | 整合判定 |
|-------|----------------|----------------------|---------|
| `required_pull_request_reviews` | `null` | <runtime> | =null なら ✅ |
| `lock_branch.enabled` | `false` | <runtime> | =false なら ✅ |
| `enforce_admins.enabled` | `true`（governance 期待） | <runtime> | **乖離可能性あり** |
| `required_conversation_resolution.enabled` | `true` | <runtime> | =true なら ✅ |
| `required_status_checks.strict` | `false`（CLAUDE.md 不変条件） | <runtime> | =false なら ✅ |
| `required_status_checks.contexts` | 5 件（本仕様で確定） | <runtime> | sort 一致なら ✅ |

## 2. enforce_admins 乖離時のハンドリング

CLAUDE.md `## ブランチ戦略` には `enforce_admins=true` が governance 期待として明記されているが、現行 API default では `false` の運用ケースがある。本サブタスク 3c は **drift を増やさない**ことが第一義のため、pre と post で同値を維持し、CLAUDE.md 期待との突合は次の選択肢で取り扱う:

| 選択肢 | 内容 | 採用条件 |
|--------|------|---------|
| O-1 | 現状維持（pre 値を post で再 PUT） | 本サブタスクのデフォルト |
| O-2 | 別 issue 化して `enforce_admins=true` への切替を独立タスクで実施 | governance 期待への完全整合が必要な場合 |
| O-3 | CLAUDE.md `## ブランチ戦略` の文言を実値に合わせ更新 | governance 期待のほうが lag していた場合 |

→ Phase 11 evidence で乖離が観測された場合、本仕様書のスコープ外として **O-2 を選択**し、別 issue を作成する旨を Phase 13 引き継ぎに記載する。

## 3. ドキュメント追加更新の要否

| 対象 | 更新要否 | 理由 |
|------|---------|------|
| CLAUDE.md `## ブランチ戦略` の `required_status_checks.contexts` 記述（あれば） | 要更新 | 5 件構成への記述追加 |
| `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/index.md` 親 workflow | 不要 | 既に AC-05 / AC-06 に明記済み |
| 本サブタスク `index.md` | 不要 | 本仕様書策定時に整合済み |

> CLAUDE.md 本文に `contexts` の具体列挙が無い場合は、追加せず branch protection を正本とする方針（CLAUDE.md `## ブランチ戦略`「GitHub 側の branch protection 実値を正本とし、CLAUDE.md は運用参照として扱う」）に従う。

## 4. 引き継ぎ（Phase 13 へ）

| 項目 | 内容 |
|------|------|
| 残課題 | enforce_admins 乖離時の別 issue 起票（O-2 採用時） |
| 統合 PR 記載事項 | 3c は単独 PR を出さず、親 Phase 13 統合 PR に evidence + 仕様を含める |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl-3c
- phase: 12
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

CLAUDE.md governance との整合を確認し、ドキュメント追加更新の要否と乖離時のハンドリングを確定する。

## 実行タスク

- CLAUDE.md `## ブランチ戦略` / `## Governance` を再読する。
- post evidence と突合する jq クエリを定義する。
- 乖離時の選択肢 O-1..O-3 を提示する。
- ドキュメント追加更新の要否を判定する。

## 参照資料

- CLAUDE.md `## ブランチ戦略`
- CLAUDE.md `## Governance / CODEOWNERS`
- 本サブタスク phase-11.md

## 実行手順

1. CLAUDE.md 該当セクションを読む。
2. post evidence と突合する。
3. 乖離があれば O-2 で別 issue を起票する。

## 統合テスト連携

- NON_VISUAL phase は文書突合で代替する。

## 成果物

- 本 phase markdown
- 整合確認結果

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: NON_VISUAL のため evidence file 完備で代替する。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
