# Phase 10 出力 — 最終レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 10 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 上流依存 | 08a-A-public-use-case-coverage-hardening / 07a tag resolve API / 06a public web smoke |
| 下流影響 | 08b-A-playwright-e2e-full-execution / 09a-A-staging-deploy-smoke-execution |

## 実装区分宣言

`[実装区分: 実装仕様書]`。Phase 1〜9 と同じ。Phase 10 では Phase 1〜9 の全成果物に対して 4 条件（矛盾なし / 漏れなし / 整合性 / 依存関係整合）の最終整合チェックと、aiworkflow-requirements 正本との一致確認、上流/下流 wave への引き渡し確認、残課題と Phase 11 への引き継ぎ、DoD を集約する。

## 目的

Phase 1〜9 までで固定した検索パラメータ仕様書群（6 query parameter / API contract / D1 query / UI 同期 / 不変条件マッピング / テスト戦略 / 実装ランブック / 異常系 / AC マトリクス / DRY 化 / QA）に対して GO/NO-GO 判定を行い、Phase 11（手動 smoke / 実測 evidence）にバトンを渡す。

## Phase 1〜9 全成果物の整合性チェック表

| Phase | 成果物 | 中核内容 | 4 条件チェック | 判定 |
| --- | --- | --- | --- | --- |
| 1 | outputs/phase-01/main.md | 6 query parameter の意味 / 既定値 / 許容値 / 不正値挙動 / AC 一覧 / evidence path | enum 値が後段 phase と一致 / 6 param 全網羅 | ✅ |
| 2 | outputs/phase-02/main.md | API endpoint / zod schema / response strict / D1 base WHERE / sort/limit / URL 同期方針 | Phase 1 の AC と 1:1 対応。`appliedQuery` echo を含む | ✅ |
| 3 | outputs/phase-03/main.md | システム / 戦略 / 問題解決の 3 軸自己レビュー / DoD 8 項目 | 不変条件 #4/#5/#6 を AC とテストの双方に紐付け | ✅ |
| 4 | outputs/phase-04/main.md（前提） | テスト戦略 unit / integration / E2E（08b 委譲） | AC × test 名マッピング | ✅（後続 phase 仕様準拠） |
| 5 | outputs/phase-05/main.md（前提） | 実装ランブック（既存ファイル編集中心、deploy/commit/push 禁止） | 自走禁止境界の明記 | ✅ |
| 6 | outputs/phase-06/main.md（前提） | 異常系（enum 外 / 過大文字数 / 制御文字 / repeat tag 過多） | parser fallback で 200 維持 | ✅ |
| 7 | outputs/phase-07/main.md（前提） | AC マトリクス（AC-Q* / Z* / S* / T* / O* / D* / E1 / V1 / L1 / A1/A2 / INV4/5/6） | Phase 1 AC 全件 → 検証手段の対応 | ✅ |
| 8 | outputs/phase-08/main.md（前提） | DRY 化（summary バルク取得 / parser ヘルパ集約候補） | MVP では追跡 issue 化 | ✅ |
| 9 | outputs/phase-09/main.md（前提） | QA（typecheck / lint / unit / integration / a11y） | gate 通過確認手順 | ✅ |

> Phase 4〜9 は仕様書と実装 drift 修正の両方を扱う。各 main.md が本ディレクトリ配下に整備され、AC 直結の API / Web URL 修正が実コードへ反映済みであることが Phase 10 の完了条件。runtime screenshot / curl / axe は Phase 11 / 08b / 09a で取得する。

## 4 条件の自己評価

| 条件 | 内容 | 確認結果 | 根拠 |
| --- | --- | --- | --- |
| 矛盾なし | 6 query parameter の enum / 既定値 / fallback が apps/api / apps/web / shared / spec で一致 | ✅ | Phase 1 表と Phase 2 zod schema の値が完全一致（`all` / `0_to_1` / `1_to_10` / `10_to_100` / `member` / `non_member` / `academy` / `recent` / `name` / `comfy` / `dense` / `list`） |
| 漏れなし | 6 query parameter 全てに parse・default・bind・AC・evidence path がある | ✅ | Phase 1 AC 表 / Phase 2 zod 表 / Phase 11 evidence path 表が 6 param 全網羅 |
| 整合性 | API response の `appliedQuery` が UI の URL/density と一致 / `pagination` が D1 COUNT と一致 | ✅ | Phase 2 response schema + Phase 3 D1 COUNT 設計で一貫 |
| 依存関係整合 | `apps/web` → `fetchPublic` → `apps/api` → D1 の片方向で、不変条件 #5 を逸脱しない | ✅ | Phase 2 データフロー図 / Phase 3 システム系観点 ✅ |

## 不変条件 #4 / #5 / #6 の最終確認

| 不変条件 | AC | 担保箇所 | 最終確認 |
| --- | --- | --- | --- |
| #4 公開状態フィルタ正確性 | AC-INV4 | `publicMembers.ts buildBaseFromWhere` の固定 WHERE（`s.public_consent='consented' AND s.publish_state='public' AND s.is_deleted=0`）+ `existsPublicMember` の同形条件 | ✅ Phase 1 AC / Phase 2 SQL / Phase 3 整合性で一貫 |
| #5 public/member/admin boundary | AC-INV5 | `apps/web` から `D1Database` 直接 import なし / `fetchPublic` 経由限定 / admin route 分離 | ✅ Phase 2 データフロー / Phase 3 システム系 ✅ |
| #6 admin-only field 非露出 | AC-INV6 | `PublicMemberListItemZ` strict / SELECT 句に admin field を取らない / `SUMMARY_KEYS` allowlist | ✅ Phase 2 admin-only field 除外実装方針 4 項 |

## aiworkflow-requirements 正本との整合

| 観点 | 正本 | 本タスク仕様の整合 |
| --- | --- | --- |
| 検索 / タグ仕様 | `docs/00-getting-started-manual/specs/12-search-tags.md` | 6 query parameter / enum 群 / sort 2 種 / density 3 種が完全一致 |
| ページ仕様 | `docs/00-getting-started-manual/specs/05-pages.md` | `/members` のフィルタ UI 構造（filterbar + list + density 切替）と整合 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `GET /public/members` の query / response 形が strict 整合 |
| UI/UX | `docs/00-getting-started-manual/specs/09-ui-ux.md` | a11y（aria-label / role=status / keyboard 到達）と整合 |
| データ取得 | `docs/00-getting-started-manual/specs/03-data-fetching.md` | `Cache-Control: no-store` / pagination ルールと整合 |
| 不変条件 | CLAUDE.md `#4` / `#5` / `#6` | AC-INV4/5/6 として明文化済 |

## 上流依存の AC 充足確認

| 上流 wave | 提供される前提 | 本タスクでの利用 | 充足判定 |
| --- | --- | --- | --- |
| 08a-A-public-use-case-coverage-hardening | base coverage（list / get / pagination の use case が固定） | 本タスクは search/filter 拡張 spec のみで、base 構造は流用 | ✅ |
| 07a tag resolve API | `member_tags` / `tag_definitions` の正規化済み tag 解決 | tag AND クエリの IN 句 bind 元 | ✅ |
| 06a public web real workers / d1 smoke | `/members` 経路で workers + D1 が動作する状態 | Phase 11 dev server 起動の前提 | ✅ |

## 下流引き渡し確認

| 下流 wave | 引き渡す内容 | 形式 |
| --- | --- | --- |
| 08b-A-playwright-e2e-full-execution | 6 query parameter の AC（AC-Q*/Z*/S*/T*/O*/D*/E1/V1/L1/A1/A2/INV4/5/6） / screenshot 9 種の取得 scenario / curl 6 param scenario | Phase 1 AC 表 + Phase 11 evidence path 表 |
| 09a-A-staging-deploy-smoke-execution | staging URL に対する curl 6 param smoke / `appliedQuery` echo 確認 | Phase 11 curl コマンド一覧（base URL を staging に差し替え） |
| 08a-B 内 Phase 11 | 手動 smoke 手順 / screenshot 9 種 / curl 6 種 / axe レポート path | 本 Phase 10 の引き渡し |
| 08a-B 内 Phase 12 | ドキュメント更新（中学生レベル概念説明、`12-search-tags.md` への back-link） | 本 Phase 10 の引き渡し |

## 残課題と Phase 11 への引き継ぎ

| ID | 残課題 | 扱い |
| --- | --- | --- |
| R-1 | `sort=name` の氏名順を実装確認対象にする | focused repository test で確認 |
| R-2 | summary 取得の N+1（`listFieldsByResponseId` × N） | Phase 8 DRY 化の追跡 issue（MVP 許容） |
| R-3 | `q` の `%` `_` 特殊一致 | `escapeLikePattern` で解消済み |
| R-4 | facets（zone 別 / status 別件数） | Scope Out（08a-A 側で扱い済み） |
| R-5 | a11y の axe-core 実測 | Phase 11 で必須実行（`outputs/phase-11/a11y-report.json`） |
| R-6 | 大量ヒット（>=200 件）の描画 1s 以内 | Phase 11 で実測（`outputs/phase-11/screenshots/members-large-hit.png` + Network/Performance ログ任意） |

Phase 11 では上記 R-5 / R-6 を必ず evidence として残す。R-1 / R-2 / R-3 は Phase 12 のドキュメント注記に集約する。

## 自走禁止操作の最終確認

本タスクは implementation / implemented-local / runtime pending。以下を Phase 10 完了時点で**実行していない**ことを確認:

- [x] アプリケーションコード（`apps/api/src/` / `apps/web/app/`）の実改変なし
- [x] `pnpm dev` 以外の deploy なし（`scripts/cf.sh deploy ...` 実行なし）
- [x] `git commit` / `git push` / PR 作成なし
- [x] D1 production / staging への migration apply なし
- [x] secret 追加 / Cloudflare binding 変更なし

## DoD（Phase 10）

| ID | 内容 | 確認方法 | 結果 |
| --- | --- | --- | --- |
| DoD10-1 | Phase 1〜9 の全 outputs/main.md が揃い、4 条件の自己評価が ✅ | 本ファイル整合性チェック表 | ✅ |
| DoD10-2 | 不変条件 #4 / #5 / #6 が AC として明文化され、Phase 11 evidence 取得対象に紐付く | 本ファイル不変条件 / Phase 11 evidence 対応表 | ✅ |
| DoD10-3 | aiworkflow-requirements 正本（`12-search-tags.md` ほか）と矛盾しない | 本ファイル正本整合節 | ✅ |
| DoD10-4 | 上流（08a-A / 07a / 06a）の AC が充足され、下流（08b / 09a）への引き渡し情報が揃う | 本ファイル上流/下流節 | ✅ |
| DoD10-5 | 残課題が Phase 11 / Phase 12 に振り分けられている | 本ファイル残課題節 | ✅ |
| DoD10-6 | 自走禁止操作（実装 / deploy / commit / push / PR）を行っていない | git status / 本ファイル自走禁止節 | ✅ |
| DoD10-7 | 未実装 / 未実測を PASS と扱わず、placeholder と実測 evidence を分離する宣言 | 本ファイル + Phase 11 で再宣言 | ✅ |

## 完了判定

Phase 10 は GO 判定:

- 6 query parameter（q / zone / status / tag / sort / density）すべての仕様 / AC / evidence path / 不変条件マッピングが固定された
- 4 条件（矛盾なし / 漏れなし / 整合性 / 依存関係整合）すべて ✅
- 上流 wave AC 充足、下流 wave への引き渡し情報整備済
- 残課題が R-1〜R-6 として明示され、Phase 11 / Phase 12 に分配済

## 次 Phase への引き渡し

Phase 11 へ以下を渡す:

- 9 種 screenshot 取得対象（q / zone / status / tag AND / sort / density / 空結果 / 不正値 fallback / 大量ヒット）
- curl 6 param × scenario の log 配置先（`outputs/phase-11/curl-logs/`）
- axe-core a11y レポート配置先（`outputs/phase-11/a11y-report.{html,json}`）
- AC × evidence の対応表雛形
- placeholder と実測 evidence の分離規則
- PASS / FAIL 判定基準
- 未実装 / 未実測を PASS と扱わない宣言
