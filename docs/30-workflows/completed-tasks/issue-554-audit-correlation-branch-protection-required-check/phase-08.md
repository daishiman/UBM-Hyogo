# Phase 8: aiworkflow-requirements skill references / indexes 反映

## 目的

aiworkflow-requirements skill（`.claude/skills/aiworkflow-requirements/`）に、本タスクで決定した required context を反映する。

## 変更対象

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/branch-protection.md` | 新規 or 編集（既存有無を要確認） | Phase 3 §3.1 の skeleton を実装 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 編集 | governance 章に anchor 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | キーワード追加 |

## 8.1 `references/branch-protection.md`

存在確認:
```bash
test -f .claude/skills/aiworkflow-requirements/references/branch-protection.md \
  && echo EXISTS || echo NEW
```

存在する場合は `required_status_checks.contexts` 章を編集し `audit-correlation-verify / verify` の行を追加。
無い場合は Phase 3 §3.1 の skeleton をそのまま新規作成する。

## 8.2 `indexes/topic-map.md`

governance 章に次の anchor を追加（既存規約に合わせて整形）:

```
- branch-protection-required-checks
  - file: references/branch-protection.md
  - keywords: audit-correlation-verify, required status check, dev branch protection, main branch protection
```

> 既存 topic-map のフォーマットに必ず合わせること。整形は次 Phase の `indexes:rebuild` で正規化される。

## 8.3 `indexes/keywords.json`

次のキーワード群を governance / branch-protection 系トピックに追加:

```
"audit-correlation-verify",
"branch protection",
"required status check",
"required_status_checks.contexts",
"contexts merge"
```

既存 JSON の構造（topic → keywords 配列、または flat array）を必ず確認してから追記する。

## DoD（Phase 8）

- [ ] `references/branch-protection.md` が存在し `audit-correlation-verify / verify` を含む
- [ ] `indexes/topic-map.md` に anchor が追加されている
- [ ] `indexes/keywords.json` が valid JSON で、新キーワードが追加されている（`jq . < indexes/keywords.json > /dev/null`）
- [ ] `outputs/phase-8/phase-8.md` に編集 diff スニペットが記録されている
