# Phase 12 Implementation Guide: ut-web-cov-02-public-components-coverage

## Part 1: 中学生レベル

このタスクは、文化祭の案内板がどんな時でも読めるか確認する作業に似ている。会員カードや見出し、空の表示などは、見る人が最初に触れる大事な部品である。データがある時、ない時、押したり条件を変えたりした時に、画面が期待どおりになるかをテストする。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| coverage | チェック済みの割合 |
| component | 画面の部品 |
| prop | 部品に渡す設定 |
| interaction | クリックなどの操作 |
| assertion | 期待どおりかの確認 |

## Part 2: 技術者レベル

対象は `FormPreviewSections`、`Hero`、`MemberCard`、`ProfileHero`、`StatCard`、`Timeline`、`EmptyState`。各 component は happy / empty-or-null-data / interaction-or-prop-variant を最低1ケースずつ持つ。

04a public API の contract を変更せず、component input model に閉じてテストする。snapshot ではなく role/text/state ベースの assertion を優先する。

## 対象ファイルと実測結果

| Component | Test file | Lines | Statements | Functions | Branches |
| --- | --- | ---: | ---: | ---: | ---: |
| FormPreviewSections | `apps/web/src/components/public/__tests__/FormPreviewSections.test.tsx` | 100 | 100 | 100 | 100 |
| Hero | `apps/web/src/components/public/__tests__/Hero.test.tsx` | 100 | 100 | 100 | 100 |
| MemberCard | `apps/web/src/components/public/__tests__/MemberCard.test.tsx` | 100 | 100 | 100 | 100 |
| ProfileHero | `apps/web/src/components/public/__tests__/ProfileHero.test.tsx` | 100 | 100 | 100 | 100 |
| StatCard | `apps/web/src/components/public/__tests__/StatCard.test.tsx` | 100 | 100 | 100 | 100 |
| Timeline | `apps/web/src/components/public/__tests__/Timeline.test.tsx` | 100 | 100 | 100 | 100 |
| EmptyState | `apps/web/src/components/feedback/__tests__/EmptyState.test.tsx` | 100 | 100 | 100 | 100 |

## Test cases

| Pattern | Coverage |
| --- | --- |
| happy | primary render path and visible content assertions |
| empty-or-null-data | omitted optional fields, empty field arrays, no reset/action slots |
| interaction-or-prop-variant | density, custom labels/children, fallback visibility, CTA variants |

## Fixtures / mocks

- `apps/web/src/test-utils/fixtures/public.ts` builds shared `PublicMemberListItem`, `PublicStatsView`, and `FormPreviewView` fixtures.
- No network, API, D1, or Next.js route mocks are required.

## Commands

```bash
pnpm --filter @ubm-hyogo/web test -- apps/web/src/components/public/__tests__ apps/web/src/components/feedback/__tests__
pnpm --filter @ubm-hyogo/web test:coverage
```
