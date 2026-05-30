# Phase 4: テスト計画

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `web-worker-size-limit-fix` |
| phase | 4 / 13 |
| phase_name | テスト計画 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| implementation_mode | `new`（次サイクルで RED → GREEN 実装） |
| 前Phase | 3（設計レビュー） |
| 次Phase | 5（実装手順） |
| 命名規約 | 新規 test = `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止・CONST_008） |

## 目的

Task A（`next/og` 撤去 → 静的 OG 置換）と Task B（OpenNext production minify 維持 + Worker サイズ CI gate）に対して、本実装サイクルで RED → GREEN を回せる粒度のテスト計画を確定する。追加・削除・更新するテストを 1 件ずつ列挙し、各ケースの入力・期待値・PASS 条件を表化する。本 Phase はテストコードを書かず、Phase 6 で具体化する計画の正本を作る。

## 実行タスク

1. Task A のテスト棚卸し（削除 1 / 更新 1 / 新規 grep gate 1）を確定する。
2. Task B のテスト棚卸し（regression spec の assert 追加 2 系統 / dry-run size 計測の検証ケース）を確定する。
3. 各テストケースの期待値表を作り、Phase 6 の `it()` 記述に 1:1 で対応づける。
4. テスト操作対象が外部入力か内部状態かを明記する（本タスクは UI コンポーネント state を持たず、すべて static source / route response / shell 出力の検証）。
5. 既存テストの命名規約整合（`*.spec.*`）と coverage 影響を Phase 7 へ引き継ぐ前提を固定する。

## 参照資料

- `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx`（削除対象・現行テスト）
- `apps/web/playwright/tests/public-metadata.spec.ts`（更新対象）
- `apps/web/__tests__/opennext-config-regression.spec.ts`（assert 追加対象）
- `apps/web/src/lib/seo/site-metadata.ts`（`SITE.ogImagePath`）
- `apps/web/open-next.config.ts`（確認対象。OpenNext v1.19.4 に `minify` config key がないため変更しない）
- `scripts/check-worker-size.sh`（新規・Phase 5 で作成）
- `.github/workflows/web-cd.yml`（size gate step 挿入対象）
- `docs/00-getting-started-manual/specs/08-free-database.md`（無料 3 MiB 制約）

## 実行手順

### Task A: `next/og` 撤去のテスト計画

#### A-1. 削除するテスト

| 区分 | 対象ファイル | 削除理由 |
| --- | --- | --- |
| 削除 | `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx` | テスト対象の `members/[id]/opengraph-image/route.tsx`（動的 OG route）を Phase 5 で削除するため、テスト自体が dead になる。`vi.mock("next/og", ...)` を含む 4 ケース（profile 存在 / occupation 空 / notFound / rethrow）すべて撤去する。 |

> 削除後の残存参照チェック（Phase 6 完了条件）: `rg -n "opengraph-image" apps/web/app apps/web/src apps/web/playwright` で動的 route への live import が 0 件であること。

#### A-2. 更新するテスト（`apps/web/playwright/tests/public-metadata.spec.ts`）

静的 `/og-default.png` 前提に書き換える。現行の動的 OG PNG / 404 を検証する 2 ケースを削除し、静的 PNG 200 と og:image が静的 URL を指す検証へ更新する。

| ケース | 区分 | 入力 | 現行の期待値 | 更新後の期待値 |
| --- | --- | --- | --- | --- |
| TC-A201 `/og-default.png returns static PNG` | 新規（旧 `/opengraph-image returns PNG` を置換） | `request.get("/og-default.png")` | （旧）`/opengraph-image` 200 image/png | status 200 かつ `content-type` に `image/png` を含む。PNG マジックナンバー `89504e470d0a1a0a` を先頭 8 byte で検証 |
| TC-A202 `/members/[id] exposes static og:image path` | 更新（旧 `member-specific og:image path`） | `page.goto(SEEDED_MEMBER_DETAIL_PATH)` の `meta[property="og:image"]` / `meta[name="twitter:image"]` | content が `/members/<id>/opengraph-image` を含む | content が `/og-default.png`（絶対 URL 末尾一致）を含む。動的 path を含まないこと（`not.toContain("/opengraph-image")`） |
| TC-A203 `/members/<nonexistent>/opengraph-image returns 404` | 削除 | `request.get("/members/__nonexistent__/opengraph-image")` | 404 | route 自体を撤去するため検証不要。ケースごと削除 |
| TC-A204 `/members/[id]/opengraph-image returns PNG` | 削除 | seeded member の動的 OG route | 200 image/png | 同上。ケースごと削除 |
| TC-A205 既存 OG/Twitter meta tags 存在確認（公開3ルート + member） | 維持 | 各ルートの `og:image` / `twitter:card` 等 | `toHaveCount(1)` | 不変（静的 og:image でも meta tag 自体は 1 件存在する）。og:image が 1 件であることは維持される |

> 注: `writePhase11Evidence("og-image-seeded.png", ...)` 等の動的 OG PNG 保存ロジックは TC-A203/A204 削除と同時に除去する。`og-image-meta-grep.txt` 出力は TC-A202 更新後の content を記録するよう更新（任意 evidence のため Phase 11 で扱い）。

#### A-3. 新規 grep gate（`next/og` 0 件回帰）

| ケース | 区分 | 検証コマンド | PASS 条件 |
| --- | --- | --- | --- |
| TC-A301 `next/og` source 参照 0 件 | 新規（Task B の regression spec 内 assert として実装。A-3 は計画上の論点を A 側に明示） | `rg -n "next/og\|ImageResponse" apps/web/app apps/web/src` | 0 件（exit 1）。Phase 6 では `opennext-config-regression.spec.ts` の `it` として静的 source 読取で検証する（B-2 参照） |

> grep gate の実体は Task B の regression spec に同居させる（実行系統が同じ vitest static-source-guard のため）。Task A はこのケースが存在することを計画として明示し、Phase 6 では B-2 のケースとして 1 本化する。

### Task B: OpenNext production minify 維持 + Worker サイズ CI gate のテスト計画

#### B-1. dry-run size 計測の検証ケース（`scripts/check-worker-size.sh`）

`check-worker-size.sh` は Phase 5 で新規作成する shell。検証はローカル/CI 実行による振る舞い確認（自動テストは shell ロジックの単体ではなく実行結果ベース）。

| ケース | 区分 | 入力 | 期待値 |
| --- | --- | --- | --- |
| TC-B101 閾値内で exit 0 | 新規（手動/CI 検証） | `bash scripts/check-worker-size.sh` を minify + `next/og` 撤去後の `.open-next` に対して実行 | gzip サイズ < 3072 KiB と判定し exit 0。stdout に計測値（`gzip: NNNN KiB`）を出力 |
| TC-B102 warn 閾値超過で stderr 警告 | 新規 | gzip サイズが 2800 KiB 超 3072 KiB 未満を擬似入力 | warn メッセージを stderr に出すが exit 0（警告は失敗にしない） |
| TC-B103 上限超過で exit 1 | 新規 | gzip サイズが 3072 KiB 超を擬似入力（`WORKER_SIZE_OVERRIDE_KIB` 等の test hook 経由、または旧 next/og 入りバンドル） | exit 1 を返し CI を fail させる |
| TC-B104 計測ソース fallback | 新規 | `cf.sh dry-run` 出力に `gzip: NNNN KiB` が含まれない場合 | `.open-next` 配下の worker 関連ファイルの gzip 合算で代替計測し、同じ 3072 KiB 判定を行う |

> check-worker-size.sh は決定論的 shell であり vitest spec は持たない（Script First 原則）。検証は Phase 6 で `bash scripts/check-worker-size.sh`（dry-run）実行ログを evidence にする。test hook（環境変数で計測値を注入）を Phase 5 で用意し、TC-B102/B103 を CI を汚さず再現可能にする。

#### B-2. regression spec の assert 追加（`apps/web/__tests__/opennext-config-regression.spec.ts`）

既存 4 `it` に対し、production minify 維持 assert と `next/og` 0 件 assert を 2 系統追加する。

| ケース | 区分 | 検証方法 | 期待値 |
| --- | --- | --- | --- |
| TC-B201 production minify 維持 assert | 新規 `it` | `apps/web/open-next.config.ts` を `readFileSync` で static 読取し、`OPEN_NEXT_DEBUG` / `debug: true` が含まれないことを検証 | OpenNext v1.19.4 に `minify` config key がないため無効な設定を追加せず、production 既定 minify を維持する |
| TC-B202 `next/og` source 参照 0 件 assert | 新規 `it`（TC-A301 を 1 本化） | `apps/web/app` / `apps/web/src` 配下を再帰走査（`readdirSync` 再帰 or glob）し、各 `.ts/.tsx` に `next/og` / `ImageResponse` import が含まれないことを検証 | 全ファイルで一致 0 件。spec 自身のテスト文字列は対象外にする（source ディレクトリ限定走査） |
| TC-B203 既存 4 assert 維持 | 維持 | wrangler.toml / .assetsignore / package.json deploy script 不在 | 不変（回帰させない） |

> OpenNext v1.19.4 の型定義確認により `minify` config key は不在。assert は「無効な minify 設定追加」ではなく「debug 有効化禁止」に寄せる（identifier drift 防止）。

### web-cd.yml size gate のテスト

| ケース | 区分 | 検証方法 | 期待値 |
| --- | --- | --- | --- |
| TC-B301 staging job に size gate step が build と deploy の間に存在 | 新規（regression spec 任意 / 手動 review） | `.github/workflows/web-cd.yml` を読み、`deploy-staging` の `Build` step 後・`Deploy` step 前に `check-worker-size.sh` を呼ぶ step が存在することを確認 | 両 deploy job（staging / production）に size gate step が挿入されている |

## 統合テスト連携

- Playwright: `public-metadata.spec.ts` は静的 OG 前提に更新後、`mise exec -- pnpm --filter @ubm-hyogo/web` の Playwright suite（`playwright-smoke`）で OG meta / 静的 PNG 200 を統合検証する。
- vitest: `opennext-config-regression.spec.ts` は `mise exec -- pnpm --filter @ubm-hyogo/web test` で実行し、minify / `next/og` 0 件を静的に保証する。
- CI: `web-cd / deploy-staging` の size gate step が build 後 deploy 前に gzip < 3072 KiB を判定し、超過時は deploy を実行せず fail する（再発防止の統合点）。
- coverage: 本タスクは純削除＋静的設定変更が中心で、追加 regression spec が新規ロジックをカバーする。閾値判定は Phase 7 で `bash scripts/coverage-guard.sh` により統合確認する。

## 多角的チェック観点（AIが判断）

- システム系: 「動的 OG route 削除 → そのテストも削除」「`next/og` 撤去 → 静的 og:image へ meta が切替」の因果が、Playwright meta 検証と vitest static guard の双方で閉じているか。
- 戦略・価値系: 無料プラン制約下で OG の機能価値（個別 OG）を諦める代わりにデプロイ可能性を取るトレードオフが、テスト期待値（静的 og:image 許容）に反映されているか。
- 問題解決系: 再発防止の主問題は「サイズ超過の CI 非検出」。size gate（TC-B101..B301）が真の論点を直接カバーしているか。

## サブタスク管理

| ID | 内容 | 対象テスト | 依存 |
| --- | --- | --- | --- |
| ST-4A | Task A テスト棚卸し確定（削除/更新/新規 grep） | A-1 / A-2 / A-3 | なし |
| ST-4B | Task B テスト棚卸し確定（size gate / regression assert） | B-1 / B-2 / B-3 | なし |
| ST-4C | 期待値表の Phase 6 `it` 対応づけ | 全 TC | ST-4A / ST-4B |

## 成果物

- 本ファイル `phase-4-test-plan.md`（テスト棚卸し表 + 期待値表 + Phase 6 対応づけ）

## 完了条件

- [ ] Task A の削除（opengraph-image.spec.tsx）/ 更新（public-metadata.spec.ts）/ 新規 grep gate が表で確定している
- [ ] Task B の size 計測検証（TC-B101..B104）/ regression assert（TC-B201..B203）/ web-cd gate（TC-B301）が表で確定している
- [ ] 各テストケースに入力・期待値・PASS 条件が明記されている
- [ ] 削除テストの残存参照チェックコマンドが定義されている
- [ ] coverage AC 連携（apps/web 4 軸 >=80% / `bash scripts/coverage-guard.sh` exit0）が Phase 7 へ引き継がれることを明記している
- [ ] 新規テストが `*.spec.{ts,tsx}` 命名であること（既存 regression spec / Playwright spec に追記する方針）

## タスク100%実行確認【必須】

- [ ] ST-4A / ST-4B / ST-4C を完了した
- [ ] 削除 1 / 更新 1 / 新規 grep 1（Task A）と size 検証 4 / regression assert 3 / web-cd gate 1（Task B）を網羅した
- [ ] Phase 6 の `it` 記述へ 1:1 で落とせる粒度で期待値を固定した
- [ ] 統合テスト連携（Playwright / vitest / CI size gate / coverage）を残した

## 次Phase

Phase 5（実装手順）— 変更対象ファイル一覧と具体的変更方針、`check-worker-size.sh` 擬似ロジック、web-cd.yml step 挿入位置を確定する。
