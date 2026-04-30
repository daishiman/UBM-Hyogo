# task-docs-aiworkflow-reference-line-budget-split-001

## 苦戦箇所【記入必須】

U-04 Phase 12 close-out の `validate-structure.js` は exit 0 だが、aiworkflow-requirements の既存 reference 5 ファイルが 500 行を超えていると警告した。
特に `deployment-cloudflare.md` は U-04 Cron 追記で 538 行となり、既存超過をさらに進めた。
generated index は PASS でも、line budget は classification-first で別 wave に分けないと同一 Phase 12 の範囲が膨らみすぎる。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 大規模 reference が検索・レビューしづらくなる | `spec-splitting-guidelines.md` に従い parent / child / history を同一 wave で分割する |
| `deployment-cloudflare.md` へ Cron / Workers / Pages / R2 が混在する | `deployment-cloudflare-cron.md` など責務名が読める semantic filename へ分離する |
| mirror drift | `.claude` を正本として `.agents` mirror sync と `diff -qr` を同一 wave で実行する |

## 検証方法

```bash
node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
diff -qr .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements
```

完了条件は対象 manual reference の 500 行超過警告が 0 件になること。

## スコープ

含む:

- `arch-state-management-skill-creator.md`
- `database-schema.md`
- `deployment-cloudflare.md`
- `task-workflow-completed-recent-2026-04c.md`
- `task-workflow-completed.md`

含まない:

- U-04 sync 実装コード変更
- commit / PR 作成
