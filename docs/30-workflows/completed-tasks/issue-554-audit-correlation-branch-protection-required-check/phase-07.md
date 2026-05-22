# Phase 7: governance 文書（CLAUDE.md）反映実装

## 目的

CLAUDE.md の「ブランチ戦略」「Governance / CODEOWNERS」章に、`audit-correlation-verify / verify` が dev / main の required status check であることを追記する。

## 変更対象

| ファイル | 種別 | 変更内容 |
| --- | --- | --- |
| `CLAUDE.md` | 編集 | 「ブランチ戦略」章の solo 運用ポリシー注記直後、および「Governance / CODEOWNERS」章の UT-GOV-001 確認手順に追記 |

## 編集手順

### 7.1 「ブランチ戦略」章

solo 運用ポリシー注記の直後（`grep` で確認可能な context: `required_pull_request_reviews=null`）に次を追記する:

```markdown
> **required_status_checks contexts（dev / main 共通）**: `audit-correlation-verify / verify` を含む。
> 直近の追加: Issue #554（`audit-correlation-verify` を Issue #516 で追加した後、main empirical green を経て本タスクで required 登録）。
> 完全な contexts 一覧は GitHub 側 protection 設定を SSOT とし、`gh api repos/daishiman/UBM-Hyogo/branches/<dev|main>/protection` で取得する。
```

### 7.2 「Governance / CODEOWNERS」章

既存の構文検証行に並べて、必須 contexts grep の手順を追記:

```markdown
required contexts 確認: `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection | jq -r '.required_status_checks.contexts[]' | grep -F 'audit-correlation-verify / verify'`（`main` も同様）。
```

## 検証

```bash
grep -n 'audit-correlation-verify / verify' CLAUDE.md   # 2 箇所以上 hit すること
```

## DoD（Phase 7）

- [ ] `CLAUDE.md` の 2 箇所に required contexts の記述が存在する
- [ ] `outputs/phase-7/phase-7.md` に追加した diff スニペットが記録されている
