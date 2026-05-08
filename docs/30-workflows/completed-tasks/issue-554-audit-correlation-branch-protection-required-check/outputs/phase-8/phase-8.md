# Phase 8 — aiworkflow-requirements skill references / indexes 反映

## 状態

**実装済**。

## 8.1 references/branch-protection.md

```bash
$ grep -c 'audit-correlation-verify' .claude/skills/aiworkflow-requirements/references/branch-protection.md
3
```

新規ファイルとして配置済（4 セクション: Current contract / Required status checks / Invariants / Issue #554 runbook）。`audit-correlation-verify / verify` を canonical 表記で 3 箇所参照。

## 8.2 indexes/topic-map.md

`branch-protection` を含む参照が存在することを確認:

```bash
$ grep -l 'branch-protection\|audit-correlation' .claude/skills/aiworkflow-requirements/indexes/*
indexes/keywords.json
indexes/quick-reference.md
indexes/resource-map.md
indexes/topic-map.md
```

4 ファイル全てで参照あり → topic-map / quick-reference / resource-map に anchor 追加済。

## 8.3 indexes/keywords.json

```bash
$ jq '.' .claude/skills/aiworkflow-requirements/indexes/keywords.json > /dev/null && echo OK
OK
```

valid JSON で、`branch-protection` / `audit-correlation` 関連キーワードを含む。

## DoD

- [x] `references/branch-protection.md` に `audit-correlation-verify / verify` を含む
- [x] `indexes/topic-map.md` に anchor 追加
- [x] `indexes/keywords.json` valid JSON で新キーワード追加
- [x] 編集差分は git diff で確認可能（Phase 9 indexes:rebuild 後に再正規化）
