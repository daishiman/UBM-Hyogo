# Implementation Guide

## Part 1: 中学生レベルの説明

学校の図書室で、本のラベルを貼り直したとする。
ラベルを直す作業そのものは終わっていても、「誰が、いつ、どの本のラベルを、何に直したか」が残っていないと、あとで間違いに気づいた時に確かめられない。
今の管理画面も同じで、フォームの質問とシステム内の名前のずれを直す画面はあるが、過去に直した記録を見る専用画面がない。
今回の仕様は、その記録を見る画面を作るための準備である。

新しい画面では、監査ログに残っている resolve 操作だけを取り出して、日付の新しい順に並べる。
検索条件として、操作者メール、期間、質問文を指定できるようにする。
履歴が多くなっても一度に全部出さず、50件ずつ次のページへ進む。

### 用語セルフチェック

| 用語 | 日常語への言い換え |
|---|---|
| schema diff | 「質問表」と「管理台帳」の名前が合っていない場所 |
| stableKey | 本棚のラベルのように、同じものを探すための決まった名前 |
| resolve | 間違ったラベルを正しいラベルに直して結びつけること |
| audit log | 先生の日誌のように、誰が何をしたかを残す記録 |
| cursor pagination | しおりを挟んで、次の50件を続きから読む方法 |
| EmptyState | 何も見つからない時に「ありません」と知らせる表示 |

## Part 2: 技術者向け

### 実装方針

- `apps/web/app/(admin)/admin/schema/history/page.tsx` を独立 route として追加する。
- `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` が filter、一覧、pagination、empty/error state を担う。
- `apps/web/src/lib/admin/api.ts` に `fetchSchemaAliasHistory()` を追加し、既存 admin audit endpoint を第一候補として利用する。
- `apps/web/app/(admin)/admin/schema/page.tsx` には履歴 page への最小導線だけを追加する。

### API 境界

既定は既存 `/admin/audit?action=schema_diff.alias_assigned` の再利用である。
Phase 5 着手時に `apps/api/src/routes/admin/audit.ts` の response payload を確認し、before stableKey / after stableKey / question text が不足する場合だけ `/admin/schema/history` を新設する。
案 B に昇格した場合は `docs/00-getting-started-manual/specs/01-api-schema.md` と artifacts decision を同じ wave で更新する。

### 検証コマンド

| Command | Purpose |
|---|---|
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | web type safety |
| `mise exec -- pnpm --filter @ubm-hyogo/web lint` | lint / token class hygiene |
| `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx` | component behavior |
| `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/admin/__tests__/api.spec.ts` | fetch helper behavior |
| `mise exec -- pnpm verify:phase12-compliance` | task-specification-creator compliance gate |
| `mise exec -- pnpm gate-metadata:validate --require-gates-for-changed docs/30-workflows/issue-777-schema-diff-resolve-history-view/artifacts.json` | gate metadata schema |

### Known Limits

This cycle implements only the API audit-payload prerequisite in `apps/api`; the `apps/web` UI remains pending.
Authenticated browser screenshot evidence is required after the UI exists and remains user-gated.
Commit, push, PR creation, and GitHub issue mutation are also user-gated.
