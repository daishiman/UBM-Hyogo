# Phase 7: カバレッジ

## カバレッジの対象範囲（限定方針 / Feedback BEFORE-QUIT-002・Feedback 5）

Task C は **配線（wiring）タスク**であり、新規の純関数・ビジネスロジックを追加しない。
そのため coverage は「全ファイル一律」ではなく、**Task C が実際に変更した layout 2 ファイル + header を剥がした page 2 ファイル**に限定して計測・確認する。
shell 内部（`SidebarShellServer` / `SidebarUserMenu` / `SidebarMobileTrigger` / `useSidebarState`）は Task A/B/E の責務であり、本タスクの coverage 対象外とする。

| 区分 | 対象ファイル | 計測対象か | 理由 |
| --- | --- | --- | --- |
| 変更 layout | `apps/web/app/(public)/layout.tsx` | ✅ 対象 | `async` 化 + `SidebarShellServer` mount + `x-pathname` fallback 分岐を新設 |
| 変更 layout | `apps/web/app/(member)/layout.tsx` | ✅ 対象 | 同上（member theme） |
| header 剥がし page | `apps/web/app/(public)/page.tsx`（移動後の `/`） | ✅ 対象 | `PublicHeader` 直 mount を削除（剥がし差分の回帰確認） |
| header 剥がし page | `apps/web/app/(member)/profile/page.tsx` | ✅ 対象 | `MemberHeader` 直 mount 2 箇所を削除（剥がし差分の回帰確認） |
| shell 内部 | `apps/web/src/components/shell/**` | ❌ 対象外 | Task A/B/E の責務。Task C は mount のみ |
| 移動のみ page | `(public)/privacy/page.tsx` / `(public)/terms/page.tsx` / `(public)/login/**` | ❌ 対象外 | 本文ロジック不変（`git mv` による物理移動のみ）。差分は import 深度補正のみ |
| 既存 footer | `apps/web/src/components/public/PublicFooter.tsx` | ❌ 対象外 | 無変更で保持（不変条件 #6） |

## 計測する変更行・分岐（line / branch）

Task C で新たに導入される分岐は **layout の `x-pathname` fallback** のみ。両側を spec で踏むことを必須とする。

| 計測ポイント | 場所 | branch 両側の踏み方 |
| --- | --- | --- |
| `(await headers()).get("x-pathname") ?? "/"` | `(public)/layout.tsx` | (a) header に `x-pathname` 注入あり → 左辺採用 / (b) 未注入 → `?? "/"` fallback 採用 の 2 ケースを `layout.spec.tsx` で mock 切替 |
| `(await headers()).get("x-pathname") ?? "/profile"` | `(member)/layout.tsx` | (a) 注入あり / (b) fallback `"/profile"` の 2 ケースを `layout.spec.tsx` で mock 切替 |
| `SidebarShellServer` mount（`children` + `PublicFooter` 配置） | `(public)/layout.tsx` | `SidebarShellServer` を spy/mock し、`activePath` prop と children 末尾の `PublicFooter` 描画を 1 ケースで確認 |
| page 本文（header 剥がし後） | `(public)/page.tsx` / `(member)/profile/page.tsx` | 既存 `page.spec.tsx` を「header DOM が出現しない」観点で更新し、本文セクションが従来どおりレンダリングされる line を維持 |

> shell の `getSession()` / role 分岐は `SidebarShellServer` 内部（Task A/B）に閉じるため、Task C 側 spec では `SidebarShellServer` を mock し **layout が正しい props を渡すか**のみを検証する。role 別の branch coverage は Task B の責務。

## 配線タスクゆえの coverage 担保根拠

- 新規純関数（pure function）は **追加しない**（Phase 2 設計で配線のみと確定。`x-pathname` の解釈は inline 3 項のみ）。
- よって coverage は **既存 `layout.spec.tsx` の更新 + page.spec の header 剥がし観点追加**だけで担保できる。新規 util 用 spec ファイルは不要。
- focused test 一覧（Phase 1 / Phase 4 と一致）:

```
apps/web/app/(public)/layout.spec.tsx
apps/web/app/(member)/layout.spec.tsx
apps/web/app/(public)/page.spec.tsx
apps/web/app/(member)/profile/page.spec.tsx
apps/web/app/(public)/login/page.spec.tsx
```

## coverage コマンド（対象 path 限定）

`apps/web/package.json` の `test:coverage` は既定で `--coverage.include="apps/web/src/**"` を指定しており、`app/**` 配下の layout/page は計測 include に含まれない。Task C の変更ファイルは `app/**` 配下のため、**対象 path を明示した一時計測**を行う。

```bash
# Node 24 固定で実行（CLAUDE.md 規約）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --root=../.. --config=vitest.config.ts \
  --coverage \
  --coverage.reportsDirectory=apps/web/coverage \
  --coverage.include="apps/web/app/(public)/layout.tsx" \
  --coverage.include="apps/web/app/(member)/layout.tsx" \
  --coverage.include="apps/web/app/(public)/page.tsx" \
  --coverage.include="apps/web/app/(member)/profile/page.tsx" \
  "apps/web/app/(public)/layout.spec.tsx" \
  "apps/web/app/(member)/layout.spec.tsx" \
  "apps/web/app/(public)/page.spec.tsx" \
  "apps/web/app/(member)/profile/page.spec.tsx"
```

> 簡易版（焦点 run のみ・coverage 数値不要時）:
> `mise exec -- pnpm --filter @ubm-hyogo/web test --run "apps/web/app/(public)/layout.spec.tsx" "apps/web/app/(member)/layout.spec.tsx"`

## 完了条件

- 変更 layout 2 ファイルの **`x-pathname` fallback 両側分岐**が spec で踏まれている（branch 計測で当該行が covered）。
- header 剥がし後の page 2 ファイルが「header DOM 不在 + 本文レンダリング維持」の観点で covered。
- 対象外（shell 内部 / 移動のみ page）に coverage を要求しない方針が本ファイルに明記されている。
- coverage 未達がある場合は Phase 12 で未タスク化せず、**同一 execution wave 内**で focused spec を補完する（親 workflow 方針継承）。
