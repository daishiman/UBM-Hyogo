# Phase 7: カバレッジ確認

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `web-worker-size-limit-fix` |
| phase | 7 / 13 |
| phase_name | カバレッジ確認 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| implementation_mode | `new` |
| 前Phase | 6（テスト追加） |
| 次Phase | 8（リファクタリング） |
| coverage 閾値 | apps/web Statements / Branches / Functions / Lines すべて >=80%（一律強制） |

## 目的

本タスクの変更が apps/web の coverage 閾値（4 軸 >=80%）を割らないことを保証する。本タスクは `next/og` 撤去（純削除）+ 静的設定変更が中心であり、新規ロジックの追加はほぼ無い。削除はカバレッジ低下リスクを生まないことを明示し、追加した regression spec（minify / `next/og` 0 件）と更新後 Playwright が変更面をカバーすることを記録する。広域閾値（全体 >=80%）に対し、変更ファイル周辺の実測値を証跡に残す。

## 実行タスク

1. coverage layer 表（対象ファイル / before / after / delta 方針）を確定する。
2. 削除中心の変更がカバレッジ低下を生まない根拠を記録する。
3. regression spec 追加分のカバレッジ寄与を記録する。
4. `bash scripts/coverage-guard.sh` exit0 と apps/web 4 軸 >=80% を完了条件として明記する。

## 参照資料

- `scripts/coverage-guard.sh`（全 package 4 軸 80% 一律強制 / `--changed` / `--package web`）
- `phase-5-implementation.md`（変更対象ファイル一覧）
- `phase-6-test-additions.md`（追加・更新テスト）
- `docs/30-workflows/coverage-80-enforcement/outputs/phase-12/implementation-guide.md`（coverage 正本）

## 実行手順

### coverage layer 表

| 対象ファイル | 変更種別 | before（カバー元） | after（カバー元） | delta 方針 |
| --- | --- | --- | --- | --- |
| `apps/web/app/opengraph-image.tsx` | 削除 | （カバレッジ計上外 or 既存テストなし） | 消滅 | 純削除。分母から除外されるため低下リスクなし |
| `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` | 削除 | `opengraph-image.spec.tsx`（4 ケース） | 消滅（テストも削除） | 被テストファイルとテストを同時削除。残コードのカバレッジに影響なし |
| `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx` | 削除 | — | 消滅 | テストファイル自体（計上対象外） |
| `apps/web/src/lib/seo/site-metadata.ts` | 編集（値変更のみ） | 既存 metadata テスト / Playwright meta | 同左（不変） | `ogImagePath` 値変更のみ・行数/分岐不変。カバレッジ不変 |
| `apps/web/app/(public)/members/[id]/page.tsx` | 編集（1 行削除） | 既存 page テスト / Playwright | 同左 | `ogImage` 行削除で分岐減。`buildPageMetadata` のフォールバック分岐は site-metadata 側で既カバー。低下リスクなし |
| `apps/web/public/og-default.png` | 新規（静的アセット） | — | — | 画像アセット。coverage 計上対象外 |
| `apps/web/open-next.config.ts` | 確認のみ（変更なし） | （config ファイル・通常 coverage 対象外） | `opennext-config-regression.spec.ts` の debug 有効化禁止 assert が static 読取でカバー | 無効な minify 設定を追加せず、production 既定 minify 維持を regression spec がガード |
| `apps/web/__tests__/opennext-config-regression.spec.ts` | 編集（2 assert 追加） | 既存 4 assert | minify / `next/og` 0 件 assert を追加 | テストファイル（計上対象外）だが、追加分が config / source guard をカバー |
| `apps/web/playwright/tests/public-metadata.spec.ts` | 編集（ケース更新） | 動的 OG ケース | 静的 PNG / 静的 og:image ケース | Playwright（vitest coverage 集計対象外）。OG meta 振る舞いを統合検証 |
| `scripts/check-worker-size.sh` | 新規（shell） | — | — | shell（vitest coverage 対象外）。OpenNext worker/handler gzip 合算の実行 evidence と override 分岐検証で担保 |
| `.github/workflows/web-cd.yml` | 編集（step 追加） | — | — | CI 定義（coverage 対象外） |

### カバレッジ非低下の根拠（削除中心）

- 削除する `opengraph-image.tsx` / `route.tsx` は被テストファイルとそのテストを同時に除去するため、coverage の分子・分母から同時に消える。残存コードの 4 軸比率は不変。
- 編集する `site-metadata.ts` は文字列値変更のみで実行行・分岐数が不変。`page.tsx` は `ogImage` 行削除で分岐がむしろ減るが、フォールバック経路（`input.ogImage ?? SITE.ogImagePath`）は site-metadata 側で既にカバー済み。
- 新規ロジックは `check-worker-size.sh`（shell・coverage 対象外）と config/CI（対象外）のみ。vitest coverage を押し下げる JS/TS の未カバー新規行は発生しない。

### 局所カバレッジ実測の証跡（広域閾値のため必須）

coverage 閾値は「apps/web 全体 4 軸 >=80%」の広域指定であるため、変更が触れた TS ファイルの局所実測を証跡に残す:

- `apps/web/src/lib/seo/site-metadata.ts`: 変更前後で line / branch カバレッジが不変であること（`buildBaseMetadata` / `buildPageMetadata` 周辺）。
- `apps/web/app/(public)/members/[id]/page.tsx`: `generateMetadata` の `ogImage` 行削除後も当該関数の line / branch カバレッジが維持されること。

### 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test            # regression / unit
bash scripts/coverage-guard.sh --package web              # apps/web 単独 4 軸判定
bash scripts/coverage-guard.sh                            # 全 package 一律 80% 判定（exit 0 必須）
```

## 統合テスト連携

- `coverage-guard.sh` は vitest `coverage-summary.json` を集計し 4 軸 80% を一律判定する。本タスクは削除中心のため、`--package web` で局所確認後、全体 `coverage-guard.sh` exit 0 を統合ゲートとする。
- Playwright（`public-metadata.spec.ts`）と `check-worker-size.sh` は vitest coverage 集計外だが、変更面の振る舞いを統合検証する（Phase 6 連携）。

## 多角的チェック観点（AIが判断）

- システム系: 被テストファイルとテストの同時削除が coverage の分子・分母を同時に動かし、比率を不変に保つ因果が表に反映されているか。
- 戦略・価値系: 削除中心タスクで「新規テストを足してカバレッジを稼ぐ」過剰投資を避けつつ、回帰 guard（regression spec）に必要十分なカバーを置いているか。
- 問題解決系: 広域閾値の盲点（変更行が薄く埋もれる）を局所実測の証跡で補っているか。

## サブタスク管理

| ID | 内容 | 依存 |
| --- | --- | --- |
| ST-7-1 | coverage layer 表確定 | Phase 5 / 6 |
| ST-7-2 | 削除非低下根拠の記録 | ST-7-1 |
| ST-7-3 | `coverage-guard.sh` exit0 と局所実測の証跡取得 | ST-7-1 |

## 成果物

- 本ファイル `phase-7-coverage.md`（coverage layer 表 + 非低下根拠 + 局所実測証跡方針 + 実行コマンド）

## 完了条件

- [ ] coverage layer 表（対象ファイル / before / after / delta）が確定している
- [ ] 削除中心の変更がカバレッジを低下させない根拠が記録されている
- [ ] regression spec 追加分（minify / `next/og` 0 件）のカバー寄与が記録されている
- [ ] 広域閾値に対する局所実測の証跡方針（site-metadata.ts / page.tsx）が定義されている
- [ ] coverage AC: apps/web の Statements / Branches / Functions / Lines がすべて >=80%
- [ ] `bash scripts/coverage-guard.sh` が exit 0 で完了する

## タスク100%実行確認【必須】

- [ ] ST-7-1 / ST-7-2 / ST-7-3 を完了した
- [ ] apps/web 4 軸 >=80% を完了条件に明記した
- [ ] `bash scripts/coverage-guard.sh` exit0 を完了条件に明記した
- [ ] 統合テスト連携（coverage-guard / Playwright / size gate）を残した

## 次Phase

Phase 8（リファクタリング）— 削除に伴う dead import / navigation drift の除去と、設定の重複排除を確認する。
