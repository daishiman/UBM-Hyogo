# Implementation Guide

## Part 1: 中学生にも分かる説明

プロトタイプは「完成見本の写真」のようなもの。今回の仕様書は、その写真を見ながら、どの画面にどの部品を置くかを決める設計図である。

ただし、写真だけ見ても実際の家の住所が分からないと工事できない。そこで `PROTOTYPE-COVERAGE.md` に「見本のどの情報を、実コードのどのファイルへ反映するか」を一覧にした。実装者はこの表を見れば、すべてのプロトタイプ情報を迷わず反映できる。

なぜ必要か。見本と実際の画面の対応表がないと、別の場所を直したり、同じ画面だけ何度も直したりする。学校の文化祭で、教室の飾り付け見本と担当教室の表を一緒に貼っておくのと同じで、誰が見ても「どこを直すか」が分かる状態にする。

### 専門用語セルフチェック

| 用語 | 中学生向けの意味 |
| --- | --- |
| プロトタイプ | 完成形を先に見せる見本 |
| route | Web 画面の住所 |
| current_app_path | 実際に直すファイルの場所 |
| AppShell | 画面全体の共通わく |
| selector | CSS がどの部品に効くかを選ぶ目印 |
| visual evidence | 画面が正しく見えることを示すスクリーンショット |

## Part 2: 技術者向け実装手順

1. `PROTOTYPE-COVERAGE.md` の Source Inventory で prototype source を確認する。
2. Route Coverage Matrix の `current_app_path` を編集対象の正とする。
3. `serial-05` は page blueprint と primitive composition、`serial-06` は response_fields binding、`parallel-01/02` は CSS / selector、`parallel-03/04` は shell / fallback を担当する。
4. 実装後は `serial-07` の Playwright visual evidence で top / members-list / member-detail / admin-dashboard を取得する。
5. `/login` / `/profile` / `/privacy` / `/terms` は root 配下を編集し、route group 配下へ新規作成しない。

### Sub-workflow Guides

| owner | guide |
| --- | --- |
| `parallel-01` | `parallel-01-globals-css-rhythm/phase-05-implementation-guide.md` |
| `parallel-02` | `parallel-02-prototype-css-rules-port/phase-05-implementation-guide.md` |
| `parallel-03` | `parallel-03-appshell-layouts/phase-05-implementation-guide.md` |
| `parallel-04` | `parallel-04-shared-page-chrome/phase-05-implementation-guide.md` |
| `serial-05` | `serial-05-page-routes-blueprint-binding/phase-05-implementation-guide.md` |
| `serial-06` | `serial-06-form-response-binding/phase-05-implementation-guide.md` |
| `serial-07` | `serial-07-regression-evidence/phase-05-implementation-guide.md` |

## Verification Commands

```bash
cmp -s docs/30-workflows/ui-prototype-design-system-foundation/artifacts.json \
  docs/30-workflows/ui-prototype-design-system-foundation/outputs/artifacts.json

rg -n "pages-public.jsx|pages-member.jsx|pages-admin.jsx|styles.css|09e|09f|09g|09h" \
  docs/30-workflows/ui-prototype-design-system-foundation/PROTOTYPE-COVERAGE.md

mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/components/public/__tests__/MemberDetailSections.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web build
```

## Screenshot Evidence Boundary

This Phase 12 guide is a spec-readiness artifact. Runtime screenshots are still
owned by `serial-07-regression-evidence/outputs/phase-11/screenshots/` and must
be captured during the implementation execution cycle before visual completion
is claimed.
