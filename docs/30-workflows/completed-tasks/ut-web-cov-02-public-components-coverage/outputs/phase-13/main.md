# outputs phase 13: ut-web-cov-02-public-components-coverage

- status: implemented-local
- purpose: PR 作成 (草案テンプレ確定 / user 指示後に gh pr create 実行)

## PR タイトル

```
test(ut-web-cov-02): public components vitest coverage
```

## PR body 草案

```markdown
## Summary
- apps/web の public components 6 種と feedback component 1 種に Vitest unit test を追加
- happy / empty-or-null / interaction-or-prop-variant の最低 3 ケースを各 component で網羅
- 対象 7 component は Stmts/Lines/Funcs/Branches すべて 100%

## Test plan
- [x] `pnpm --filter @ubm-hyogo/web test -- apps/web/src/components/public/__tests__ apps/web/src/components/feedback/__tests__`
- [x] `pnpm --filter @ubm-hyogo/web test:coverage`
- [x] `coverage-summary.json` で 7 component の threshold を確認
- [x] 既存 web test に regression なし（40 files / 288 tests PASS）

## Coverage delta
| Component | Before (Lines) | After (Lines) | Branches | Funcs |
| --- | --- | --- | --- | --- |
| FormPreviewSections | 0% | 100% | 100% | 100% |
| Hero | 0% | 100% | 100% | 100% |
| MemberCard | 0% | 100% | 100% | 100% |
| ProfileHero | 0% | 100% | 100% | 100% |
| StatCard | 0% | 100% | 100% | 100% |
| Timeline | 0% | 100% | 100% | 100% |
| EmptyState | 0% | 100% | 100% | 100% |

## Invariants
- #2 responseId/memberId separation 維持
- #5 public/member/admin boundary 遵守
- #6 apps/web D1 direct access なし

## Evidence
- docs/30-workflows/ut-web-cov-02-public-components-coverage/outputs/phase-11/evidence/coverage-report.txt
- docs/30-workflows/ut-web-cov-02-public-components-coverage/outputs/phase-12/implementation-guide.md
```

## 実行コマンド（user 指示後のみ）

```bash
gh pr create \
  --base main \
  --title "test(ut-web-cov-02): public components vitest coverage" \
  --body "$(cat <<'EOF'
<上記 PR body 草案を貼り付け>
EOF
)"
```

## ポリシー

- **本タスクでは PR を作成しない**
- ユーザーの明示指示を受けてから上記コマンドを実行
