# Phase 13: PR 作成 — ut-web-cov-02-public-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-02-public-components-coverage |
| phase | 13 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 12 までの成果物を踏まえ PR 草案（タイトル / 本文 / コマンド）を仕様書として確定する。**ユーザー指示があるまで PR 作成は実行しない。**

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- outputs/phase-12/implementation-guide.md
- outputs/phase-11/evidence/coverage-report.txt

## CONST_005 必須項目

| 項目 | 内容 |
| --- | --- |
| 変更ファイル | outputs/phase-13/main.md（PR 草案テンプレ） |
| シグネチャ | `gh pr create --title <title> --body <body>` |
| 入出力 | 入力: phase-12 成果物。出力: PR draft 文字列（実 PR 作成は user 指示後） |
| テスト | N/A |
| コマンド | `gh pr create ...`（user 指示後のみ） |
| DoD | PR title / body / coverage delta 表 / Test plan が outputs/phase-13/main.md に揃う |

## PR タイトル例

```
test(ut-web-cov-02): public components vitest coverage
```

## PR body テンプレ

```markdown
## Summary
- apps/web の public components 6 種と feedback component 1 種に Vitest unit test を追加
- happy / empty-or-null / interaction-or-prop-variant の最低 3 ケースを各 component で網羅
- 対象 7 component は Stmts/Lines/Funcs/Branches すべて 100%

## Test plan
- [x] `pnpm --filter @ubm-hyogo/web test -- apps/web/src/components/public/__tests__ apps/web/src/components/feedback/__tests__`
- [x] `pnpm --filter @ubm-hyogo/web test:coverage`
- [x] `apps/web/coverage/coverage-summary.json` で対象 7 component の threshold を確認
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

## gh pr create コマンド例（user 指示後のみ実行）

```bash
gh pr create \
  --base main \
  --title "test(ut-web-cov-02): public components vitest coverage" \
  --body "$(cat <<'EOF'
<上記 PR body テンプレを貼り付け>
EOF
)"
```

## 重要な実行ポリシー

- **本仕様書作成および本タスク完了時点では PR を作成しない。**
- ユーザーから明示的に「PR 作成」「diff-to-pr」等の指示があった場合に限り、上記コマンドを実行する。
- PR 作成前に Phase 11 evidence と Phase 12 documentation 6 種が揃っていることを再確認する。

## 実行手順

1. Phase 12 implementation-guide / changelog / evidence contract を読み込む。
2. 上記 PR body テンプレの delta 表に実測値を反映する。
3. outputs/phase-13/main.md に最終 PR 草案を保存する。
4. user 指示を待つ。

## 統合テスト連携

- 上流: phase-12 documentation
- 下流: 09a-A-staging-deploy-smoke-execution（PR merge 後）

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- 未実装/未実測を PASS と扱わない
- Phase 11 実測 evidence を PR body に反映する

## サブタスク管理

- [ ] PR 草案を outputs/phase-13/main.md に保存
- [ ] coverage delta 表を実測値で埋める
- [ ] user 指示を待つ
- [ ] 指示後 `gh pr create` を実行

## 成果物

- outputs/phase-13/main.md

## 完了条件

- PR title / body / Test plan / measured coverage delta / evidence link が main.md に揃う
- user 指示なしでは PR 作成を実行していない

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない（PR は user 指示後）

## 次 Phase への引き渡し

なし（最終 Phase）。user 指示後の PR 作成完了をもってタスククローズへ。
