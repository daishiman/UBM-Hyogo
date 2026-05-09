# Implementation Guide

## Part 1: 中学生レベル

画面の部品は、学校で使う文房具セットのようなものです。ボタン、入力欄、カードを毎回ばらばらに作ると、色や形が少しずつ変わります。先に同じ形の文房具をそろえておくと、後で画面を作る人が迷わず同じ部品を使えます。

task-10 では、すでにある部品を捨てずに、足りない部品を足して、後の画面作りで使いやすいセットに整えます。

| 用語 | 日常語 |
| --- | --- |
| primitive | 小さな画面部品 |
| barrel export | まとめて取り出す棚 |
| props | 部品に渡す設定 |
| token | 色や形の名前札 |
| accessibility | 誰でも使いやすくする約束 |

## Part 2: 技術詳細

### Current implementation

- 既存 `apps/web/src/components/ui/index.ts` の export を維持する。
- task-10 の 11 primitive contract を `apps/web/src/components/ui/index.ts` から提供する。
- `Button / Avatar / Field / Input / Select` は optional props 追加で後方互換を維持する。
- `Card / Badge / Sidebar / Stat / EmptyState / Banner` を追加する。
- `buttonVariants()` / `badgeVariants()` と `cn()` を追加し、下流 task が同じ variant / class merge 契約を使えるようにする。

### TypeScript contract

| primitive | current contract |
| --- | --- |
| `Button` | `variant`, `size`, `block`, `leftIcon`, `rightIcon`, default `type="button"` |
| `Card` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `Badge` | `tone`, `outline`, `dot`, `badgeVariants()` |
| `Input` | `inputSize`, `invalid`, `aria-describedby` passthrough |
| `Select` | native `children` and legacy `options` both supported |
| `Sidebar` | `Sidebar`, `SidebarNavItem`, `SidebarSection` |
| `Stat` | `label`, `value`, `delta`, `tone` |
| `EmptyState` | `role="status"`, `icon`, `title`, `description`, `action` |
| `Avatar` | optional `memberId`, `hue`, `size: sm/md/lg/xl`, `className` |
| `Field` | render-prop aria injection and legacy children support |
| `Banner` | warning/danger => `role="alert"`, otherwise `role="status"` |

### Evidence and edge cases

- focused contract: `apps/web/src/components/ui/__tests__/task10-contract.test.tsx`
- regression: `apps/web/src/components/ui/__tests__/primitives.test.tsx`
- local quality: `outputs/phase-11/evidence/{typecheck,lint,test}.log`
- coverage: `outputs/phase-09/coverage.txt`
- build: `outputs/phase-11/evidence/next-build.log` PASS
- blocker: `outputs/phase-11/evidence/build.log` records `build:cloudflare` failure from OpenNext esbuild host/binary mismatch.
- `VISUAL_ON_EXECUTION` のため screenshot / axe は `build:cloudflare` blocker 解消後の runtime execution cycle で取得する。
