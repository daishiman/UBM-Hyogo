# Phase 7: テストカバレッジ確認

- task_id: `admin-dashboard-jp-clarity-and-card-ux`
- 前提: Phase 4（テスト計画）/ Phase 5（実装 Green）/ Phase 6（テスト追加・GL/KG/SA/ZD/SD/RAT 実装）
- 本 Phase の責務: 本タスクで **変更したファイル / 関数に限定** して branch/line カバレッジを測定し、`coverage-standards.md` の閾値（80%・推奨 90%）に整合させる。全体一律計測は行わない（[Feedback BEFORE-QUIT-002] / [Feedback 5]）。

## 目的

`coverage-standards.md`（正本）の workspace 一律 80%（lines / branches / functions / statements ≥ 80%、推奨 90%）に対し、本タスクの **新規・変更コードのみ** が満たすことを確認する。
- プロジェクト全体閾値は既存負債の影響を受けるため、[Feedback BEFORE-QUIT-002][Feedback 5] に従い `--coverage.include` で **変更したファイルに範囲を絞って個別計測** する（全体一律でなく）。
- 特に `dashboardGlossary.ts` の fallback 分岐（`?? code` / `?? type` / `targetId ? : `）の **branch coverage を 100%** にする。
- CSS（globals.css に新規クラスは作らない設計だが、Tailwind utility / 既存 `.ui-card` の効き）は jsdom で評価不能（カバレッジ対象外）であり、レイアウト（はみ出し・横長解消）の実描画は **Phase 11 視覚確認**（user-gated）で担保する。

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 個別カバレッジ計測結果 | runtime | 対象ファイル（glossary + 5 コンポーネント）の Stmts/Branch/Funcs/Lines（≥80%・glossary は branch 100%）を Phase 11 記録へ転記 |
| テスト数実測値 | runtime | `--reporter=verbose` の実行結果・コマンド・日時（推定値不使用） |
| 本 Phase 7 仕様書 | 文書 | カバレッジ目標（変更範囲限定）・計測方法・CSS 非カバレッジ方針 |

## 実行タスク

### 1. カバレッジ目標（変更範囲限定・coverage-standards.md 整合）

| 指標 | 最低基準 | 推奨基準 | 本タスク対象範囲 |
| --- | --- | --- | --- |
| Line Coverage | 80% | 90% | 下記「2. 対象ファイル」の変更ファイルのみ |
| Branch Coverage | 80% | 90%（glossary は **100%**） | 同上 |
| Function Coverage | 80% | 90% | 同上 |
| Statement Coverage | 80% | 90% | 同上 |

> [Feedback BEFORE-QUIT-002][Feedback 5]: coverage 対象は **本サイクルで変更したファイル / 関数に限定** する。未変更ファイル・プロジェクト全体の一律計測は行わない（既存負債の影響を切り離す）。
> 本タスクは UI/UX 編集タスクであり実装テストが発生する（pure-docs ではない）ため「coverage AC 適用外」には該当しない。閾値は `index.md` メタ情報および本 Phase の `## 完了条件` に必須記載する。

### 2. カバレッジ対象ファイルと評価方針（変更したものだけ）

| ファイル | 変更内容 | カバレッジ評価 | 網羅する分岐 |
| --- | --- | --- | --- |
| `apps/web/src/lib/admin/dashboardGlossary.ts` | 新規（SSOT） | **計測対象（branch 100%）** | `describeAuditAction` の `?? code` / `describeTargetType` の `?? type` / `describeTarget` の `targetId ? : `（3 関数の fallback 両分岐） |
| `apps/web/src/features/admin/components/_dashboard/KpiGrid.tsx` | 編集（ラベル glossary 参照） | 計測対象（80%+） | 静的描画（分岐なし）。tone 切替（`untaggedMembers>0` / `unresolvedSchema>0` 三項）を fixture で踏む |
| `apps/web/src/features/admin/components/_dashboard/KpiCard.tsx` | 編集（uppercase 撤廃） | 計測対象（80%+） | `tone` 別 class（neutral/warning/danger/success）。KpiGrid fixture 経由で複数 tone を踏む |
| `apps/web/src/features/admin/components/_dashboard/SchemaAlertCard.tsx` | 編集（文言平易化） | 計測対象（80%+） | count>0 描画分岐 + count=0 非表示分岐（両方を spec で踏む） |
| `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` | 編集（eyebrow 日本語化） | 計測対象（80%+） | placeholder 分岐（:41）/ 通常分岐（:66）の 2 つを既存 spec が網羅 |
| `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` | 編集（横バー再設計） | 計測対象（80%+） | empty 分岐（slices undefined/[]）/ 非 empty 分岐 / `total>0 ? width : 0` / 部分データ |
| `apps/web/src/features/admin/components/_dashboard/RecentActionsTable.tsx` | 編集（カードリスト化） | 計測対象（80%+） | empty 分岐（items=[]）/ 非 empty 分岐 / `actorEmail ?? "—"` / `targetId ? :`（glossary 経由） |
| `apps/web/src/styles/globals.css` | 非変更（新規クラス 0） | **カバレッジ対象外** | CSS は jsdom 非実行。本設計は Tailwind utility + 既存 `.ui-card` のみで新規 CSS クラス 0（Phase 2 §4） |

> 本タスクは新規 CSS クラスを作らない設計（Phase 2 §4: `admin-meetings` の CSS 実体欠如の教訓回避）。したがって globals.css への変更は原則なく、CSS の効きは jsdom では確認できないため Phase 11 視覚で担保する。

### 3. glossary fallback の branch coverage 100% 観点

`dashboardGlossary.ts` の 3 関数はいずれも「既知キー → ラベル / 未登録 → raw」の 2 分岐を持つ。Phase 6 の GL ケースで両分岐を踏み、branch coverage 100% を保証する。

| 関数 | 分岐 | 踏むケース（Phase 6） |
| --- | --- | --- |
| `describeAuditAction(code)` | `AUDIT_ACTION_LABELS[code]`（truthy）/ `?? code`（未登録） | GL-3（既知）/ GL-4（未登録・空文字列） |
| `describeTargetType(type)` | `TARGET_TYPE_LABELS[type]`（truthy）/ `?? type`（未登録） | GL-5（既知）/ GL-6（未登録） |
| `describeTarget(type, id)` | `targetId ? `${label} ${id}` : label`（truthy / null） | GL-7（id 有・null・未登録 + null の 3 通り） |

> fallback の右辺（`?? code` / `?? type` / 三項 else）は「情報を握り潰さない契約（[WEEKGRD-02]）」の核であり、未登録キーで raw を返す分岐を必ず踏むことで branch 100% を達成する。これにより API のアクションコード体系が拡張されても未登録コードが空表示にならないことを機械保証する。

### 4. 個別ファイルカバレッジ計測コマンド（変更範囲限定）

プロジェクト全体閾値は既存負債の影響を受けるため、`--coverage.include` で本タスクの **変更ファイルだけ** に絞って計測する（`coverage-standards.md` §「個別ファイルカバレッジ計測」/ [Feedback BEFORE-QUIT-002]）。

```bash
# 本タスクで変更したファイルのみを個別計測（focused + coverage）
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  --coverage \
  --coverage.include='apps/web/src/lib/admin/dashboardGlossary.ts' \
  --coverage.include='apps/web/src/features/admin/components/_dashboard/KpiGrid.tsx' \
  --coverage.include='apps/web/src/features/admin/components/_dashboard/KpiCard.tsx' \
  --coverage.include='apps/web/src/features/admin/components/_dashboard/SchemaAlertCard.tsx' \
  --coverage.include='apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx' \
  --coverage.include='apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx' \
  --coverage.include='apps/web/src/features/admin/components/_dashboard/RecentActionsTable.tsx' \
  apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts \
  apps/web/src/features/admin/components/_dashboard \
  apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx
```

text reporter の出力で対象ファイルの `% Stmts` / `% Branch` / `% Funcs` / `% Lines` が **80% 以上**（`dashboardGlossary.ts` は `% Branch` **100%**）であることを確認する。

> 本タスクで `vitest.config.ts` は変更しない（coverage 設定は既存方針を踏襲）。閾値判定は `scripts/coverage-guard.sh` が package 単位で 80% を強制する。
> `--coverage.include` を変更ファイルに絞ることで、未変更の admin 画面群（members/tags/meetings 等）の既存負債を計測から除外し、本サイクルの追加コードの達成度のみを評価する（[Feedback 5]）。

### 5. 判定フロー（coverage-standards.md §判定フロー）

| 状況 | 対処 |
| --- | --- |
| 変更ファイル個別計測が 80%（glossary branch 100%）を満たす | Phase 7 PASS → Phase 8（リファクタ）へ |
| プロジェクト全体集計が既存負債で閾値割れ | `--coverage.include` の個別計測（本 §4）で本タスク新規コードの達成を確認。全体閾値割れは既存負債として別タスクに委ねる |
| 変更ファイル個別計測も 80% 未満 / glossary branch < 100% | Phase 6 へ戻り不足 branch を GL/SD/RAT に補完 |

### 6. テスト数の実測記録（coverage-standards.md §テスト数記載基準）

Phase 9 / Phase 10 のテスト数記載に向け、本 Phase 実行時に実測値を取得する（推定値禁止）。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  --reporter=verbose \
  apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts \
  apps/web/src/features/admin/components/_dashboard \
  apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx
```

> 本タスクの想定 spec 構成: `dashboardGlossary.spec.ts`（GL-1..7 = 7）/ `KpiGrid.spec.tsx`（KG-1..4 = 4）/ `SchemaAlertCard.spec.tsx`（SA-1..4 = 4・count=0 ケース追記時は +1）/ `ZoneDistribution.spec.tsx`（既存 4 + ZD-5 = 5）/ `StatusDistribution.spec.tsx`（SD-01..08 = 8）/ `RecentActionsTable.spec.tsx`（RAT-01..06 + axe = 7）。実数は実行時の verbose 出力で確定し、コマンドと実行日時を成果物に記録する。

## CSS / レイアウトの非カバレッジ方針

- jsdom は CSS を評価しないため、以下は **カバレッジに現れない**。class / 属性付与の事実のみ DOM で確認し、実描画は Phase 11 視覚で担保する:
  - `truncate`（`text-overflow:ellipsis`）による対象 ID のカード内収まり（RecentActionsTable）。
  - 横バー（`viewBox="0 0 100 8"`）のコンパクト描画・600px 横長の解消（StatusDistribution）。
  - `.ui-card` / Tailwind utility による余白・角丸・面色の実効。
- Phase 11（user-gated）で staging スクリーンショットを取得し、AC-4（はみ出さない）/ AC-5（横長でない）の見た目を最終確認する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| カバレッジ基準（正本） | `.claude/skills/task-specification-creator/references/coverage-standards.md` | 80% 閾値・個別計測・テスト数記載基準 |
| vitest 設定 | `vitest.config.ts`（ルート） | `coverage` provider / include / exclude / reporter |
| coverage guard | `scripts/coverage-guard.sh` | package 単位 80% 強制 |
| テスト追加 | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-6-test-additions.md` | 計測対象 spec（GL/KG/SA/ZD/SD/RAT） |
| 設計（実装対象） | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-2-design.md` | glossary fallback・各コンポーネント分岐 |
| 計測対象 lib | `apps/web/src/lib/admin/dashboardGlossary.ts` | fallback 3 関数（branch 100% 対象） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 統合テスト連携

- Phase 6 の spec が Green の状態で本 Phase の個別計測を実施し、不足 branch（特に glossary fallback）があれば Phase 6 へ戻して補完する。
- Phase 9 QA でテスト数実測値と focused vitest PASS を AC-10 判定根拠に用いる。
- Phase 11（user-gated）で CSS（jsdom 非カバレッジ）の実描画（AC-4 はみ出し解消 / AC-5 横長解消）を staging 実機で視覚確認し、カバレッジで担保できない領域を補完する。

## 完了条件

- [ ] coverage 対象を **本サイクルで変更したファイル / 関数に限定** して計測した（全体一律でない・[Feedback BEFORE-QUIT-002][Feedback 5]）。
- [ ] `dashboardGlossary.ts` の **branch coverage が 100%**（`?? code` / `?? type` / `targetId ? : ` の両分岐網羅）である。
- [ ] KpiGrid / KpiCard / SchemaAlertCard / ZoneDistribution / StatusDistribution / RecentActionsTable の変更分が Line/Branch/Function/Statement とも **80% 以上**（推奨 90%）である。
- [ ] プロジェクト全体閾値が既存負債で割れる場合、`--coverage.include` 個別計測で本タスク新規コードの達成が確認されている。
- [ ] CSS（globals.css・jsdom 非カバレッジ）は計測対象外であり、AC-4 / AC-5 の実描画を Phase 11 視覚で担保する旨が明記されている。
- [ ] テスト数は実測値（`--reporter=verbose`）で取得し、コマンドと実行日時が記録されている（推定値不使用）。
- [ ] カバレッジ閾値（80%・glossary branch 100%）が `index.md` メタ情報および本 Phase の完了条件に記載されている。
