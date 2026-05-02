# 未タスク検出（Unassigned Task Detection）

Phase 1〜11 を通じて発見された、本 task のスコープ外で別途未タスク化すべき項目を列挙する。

## 1. UT-08A-01 — public route / use-case の coverage 補強【最重要】

| 項目 | 値 |
| --- | --- |
| 検出 phase | Phase 11 §2 / §5 |
| 重要度 | High |
| 推奨割当 | 09a（staging deploy 前）または 08a 追補 PR |
| formalized | `docs/30-workflows/unassigned-task/UT-08A-01-public-use-case-coverage-hardening.md` |

### 背景

Phase 11 の coverage 実測で **AC-6（Statements ≥ 85%）を 0.82pt 下回った**。Branches は達成しているが Statements / Functions / Lines が未達。

| 指標 | 実測 | AC 閾値 | 不足 |
| --- | --- | --- | --- |
| Statements | 84.18% | 85% | -0.82pt |
| Functions  | 83.37% | 85% | -1.63pt |
| Lines      | 84.18% | 85% | -0.82pt |

### 根本原因

`src/use-cases/public/*.ts` の以下 4 本が view-model 層に責務委譲済みで、use-case 直叩きの test が 0 件:

| ファイル | Stmts |
| --- | --- |
| `src/use-cases/public/form-preview.ts` | 9.67% |
| `src/use-cases/public/public-member-profile.ts` | 5.76% |
| `src/use-cases/public/public-stats.ts` | 7.54% |
| `src/use-cases/public/public-members.ts` | 14.28% |

加えて以下 route ハンドラも 40〜45% Stmts と低水準:

- `src/routes/public/members.ts` (40.00%)
- `src/routes/public/form-preview.ts` (44.44%)
- `src/routes/admin/sync-schema.ts` (43.15%)
- `src/services/mail/magic-link-mailer.ts` (49.18%)

### 推奨対応（推奨経路 = b）

**(b) `src/use-cases/public/*` への直接 unit test 追加**を推奨する。理由:
- view-model だけでは use-case 内部の D1 クエリ組立・null guard・mapper 呼出経路が網羅されない
- coverage 数値の改善（+1pt 以上見込み）と同時に、use-case → repository 結線の不変条件を独立検証できる
- 設計上の責務委譲を否定せず、層ごとに観測点を持つ「層ピラミッド」維持

代替: (a) vitest config の `coverage.exclude` に `src/use-cases/public/*.ts` を追加（簡便だが本来責務を持つ層を計測対象から外すため非推奨）。

### 受け入れ条件案

- 4 本の use-case それぞれに最低 3 ケース（happy / null-row / D1 fail）追加
- coverage 再計測で Stmts ≥ 85% / Funcs ≥ 85% / Lines ≥ 85% 達成
- 既存 442 件の test に regression なし

## 2. UT-08A-02 — visual regression test の未割当

| 項目 | 値 |
| --- | --- |
| 検出 phase | Phase 12 仕様書 §「unassigned-task-detection.md」 |
| 重要度 | Low |
| 推奨割当 | 08b（フロント a11y / visual） |

`@playwright/test --update-snapshots` ベースの visual regression は本 task スコープ外。08b の scope out 文書にも明記する。

## 3. UT-08A-03 — production 環境負荷テストの未割当

| 項目 | 値 |
| --- | --- |
| 検出 phase | Phase 12 仕様書 §「unassigned-task-detection.md」 |
| 重要度 | Low |
| 推奨割当 | 運用フェーズ（09b 以降の release runbook） |

無料枠制約下での負荷シナリオは MVP 後段の運用 task。

## 4. UT-08A-04 — 追加 D1 migration test の未割当

| 項目 | 値 |
| --- | --- |
| 検出 phase | Phase 12 仕様書 §「unassigned-task-detection.md」 |
| 重要度 | Medium |
| 推奨割当 | 02b 完了済みだが、新規 migration 追加時にこの task を参照 |

UT-04 / 02b で初期 migration test は完了している前提。**今後 migration を追加する際の test 化責任は未割当**であり、ガイドラインを 09b runbook に記載する。

## 5. UT-08A-05 — packages/shared 側 type test (`@ts-expect-error`)

| 項目 | 値 |
| --- | --- |
| 検出 phase | Phase 11 §4 シナリオ 3（N/A 判定） |
| 重要度 | Medium |
| 推奨割当 | 別 PR（packages/shared 担当 task） |

本 task は `apps/api` 単独スコープのため、`packages/shared` 配下の compile-time `@ts-expect-error` 観測テストは対象外。

## 6. UT-08A-06 — 既存 `*.test.ts` → `*.contract.spec.ts` の rename 段階移行

| 項目 | 値 |
| --- | --- |
| 検出 phase | Phase 10 §5 リスク表 |
| 重要度 | Low |
| 推奨割当 | 08a 追補 or 09a の小 PR |

既存 20 ファイル超の rename は本 task で実施せず、suffix 規約定義のみ行う方針（混在許容）。

## 検出件数サマリ

| 重要度 | 件数 |
| --- | --- |
| High   | 1（UT-08A-01） |
| Medium | 2（UT-08A-04 / 05） |
| Low    | 3（UT-08A-02 / 03 / 06） |
| **合計** | **6（≥ 3 件 OK）** |

## formalize 状態

| ID | formalize | 理由 |
| --- | --- | --- |
| UT-08A-01 | 完了 | AC-6 gate 未達で 09a/09b の前提を壊す High 課題のため正式未タスク化 |
| UT-08A-02〜06 | 完了（2026-04-30 時点） | `docs/30-workflows/unassigned-task/` 配下に個別ファイルとして配置済み。詳細は次節を参照 |

## 検出されたフォロー候補（formalized 一覧）

`docs/30-workflows/unassigned-task/` 配下に正式未タスク化されたフォロー候補。本 task の partial close-out に伴い、各 ID は後続 wave / 専任 PR で消化する。

| ID | パス | タイトル | 対応 AC / invariant |
| --- | --- | --- | --- |
| UT-08A-01 | `docs/30-workflows/unassigned-task/UT-08A-01-public-use-case-coverage-hardening.md` | public use-case の coverage 補強 | AC-6（Stmts/Funcs/Lines ≥ 85%） |
| UT-08A-02 | `docs/30-workflows/unassigned-task/UT-08A-02-visual-regression-coverage.md` | visual regression coverage | 08b a11y/visual scope（不変条件 #9 補助） |
| UT-08A-03 | `docs/30-workflows/unassigned-task/UT-08A-03-production-load-test.md` | production 環境負荷テスト | 運用フェーズ AC（09b release runbook） |
| UT-08A-04 | `docs/30-workflows/unassigned-task/UT-08A-04-d1-migration-test-guideline.md` | 追加 D1 migration test ガイドライン | 不変条件 #5（D1 access は apps/api 限定） |
| UT-08A-05 | `docs/30-workflows/unassigned-task/UT-08A-05-shared-package-type-test.md` | packages/shared 側 type test | 不変条件 #1（schema 過剰固定回避）/ AC-3 type |
| UT-08A-06 | `docs/30-workflows/unassigned-task/UT-08A-06-test-suffix-rename-migration.md` | `*.test.ts` → `*.contract.spec.ts` rename 段階移行 | suffix 規約（Phase 10 §5 リスク） |
