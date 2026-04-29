# task-task-specification-governance-template-hardening

## メタ

| 項目 | 値 |
| --- | --- |
| タスク名 | task-specification governance template hardening |
| 発見元 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/skill-feedback-report.md |
| 状態 | unassigned |
| taskType | docs / NON_VISUAL |
| 対象 | .claude/skills/task-specification-creator/ |

## 苦戦箇所【記入必須】

UT-GOV-001 では、Phase 13 の二重承認、Phase 11 の NOT EXECUTED evidence、GET snapshot と PUT payload の用途分離、UT-GOV-004 完了前提の N 重明記、他タスク由来の secret wording 混入チェックが有効だった。一方、これらを task-specification-creator のテンプレや validator に即時反映すると既存 workflow への影響が大きい。

## スコープ

### 含む

- Phase 13 `user_approval_required: true` と Phase 11 NOT EXECUTED の双方向テンプレ注釈
- GET / PUT 用途分離 boundary の Phase 11 evidence 例
- 外部 API adapter（GET 形 → PUT 形）テンプレ化
- 順序事故防止の N 重明記パターン化
- Part 1 専門用語セルフチェック例への branch protection / snapshot / payload 追加
- secret wording grep guard の validator 汎化検討

### 含まない

- UT-GOV-001 の branch protection 実適用
- 既存 workflow の一括書き換え
- commit / PR / push の自動実行

## リスクと対策

| リスク | 対策 |
| --- | --- |
| validator 強化で既存 docs-only workflow が大量警告化 | warning → error の段階移行を設ける |
| テンプレ肥大化 | patterns / references へ分割し、SKILL.md には導線だけ置く |
| governance 固有ルールの過剰一般化 | 外部 API / destructive operation / user approval required の条件付きパターンに限定する |

## 検証方法

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-gov-001-github-branch-protection-apply
```

期待値: UT-GOV-001 の既存成果物が新テンプレ / validator でも PASS し、既存 workflow への影響範囲が記録されている。
