# System Spec Update Summary

本タスクは `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` として、local 実装・seed 再生成・focused tests・typecheck・lint まで完了した。staging D1 への seed apply、authenticated / staging スクリーンショット、commit / push / PR は user-gated 実行へ残す。

## Step 1-A: 完了タスク記録

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001 |
| 完了内容（本 wave） | Phase 1-13 仕様書、Phase 12 strict 7、artifacts.json（root / outputs parity）、apps/api catalog/seed 実装、apps/web fixture/spec 強化、local verification |
| 実コード完了 | **完了**。catalog 拡充・seed 再生成・visibility seed 修正・apps/web adapter検証・focused tests/typecheck/lint PASS |

> staging apply / screenshot / commit / push / PR は user-gated のため未実行。production seed apply は CLI guard で禁止。

## Step 1-B: 実装状況テーブル

| 対象 | 状態 |
| --- | --- |
| `apps/api/src/testing/test-accounts/catalog.ts` | implemented: TEST-MEM-01..10 profile を全項目入力へ拡充、invalid ubmZone を canonical enum へ補正 |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | implemented: 全31 `response_fields` と `member_field_visibility`（public/member/admin）を生成 |
| `apps/api/migrations/seed/test-accounts-seed.sql` | regenerated: 全31 stable_key × 10 member と visibility rows を反映 |
| `apps/api/migrations/seed/test-accounts-cleanup.sql` | regenerated: `member_field_visibility` cleanup を追加 |
| `apps/api/migrations/seed/test-accounts.manifest.json` | unchanged: profile 拡充は response_fields / visibility 行のみ増やし member/admin/meeting count は不変ゆえ実差分なし（`git status` で確認・再生成不要） |
| `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts` | implemented: profile key網羅・非空・canonical enumを検証 |
| `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | implemented: 31 response rows / 31 visibility rows / member/admin visibility を検証 |
| `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` | implemented: byte drift / response_fields 310 / visibility 260+30+20 / cleanup を検証 |
| `apps/web/src/lib/adapters/member-detail.ts` | implemented（gap fix・14 行）: 検証中に `urlOthers`（free-text「その他 URL」）が素 `KIND_ROUTE` で links に乗らない gap を発見し、`LINK_STABLE_KEYS` override + `extractFirstUrl`（先頭 http(s) URL 抽出）を追加して links へルート（`kind="url"`）。他の public 項目分類は既存どおり成立 |
| `apps/web/src/components/public/*.tsx` | unchanged: production component 差分なし |
| `apps/web/src/fixtures/public-member-profile.ts` | implemented: URLリンク10件を含むpublic fixtureへ強化 |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | implemented: detail public keys と URL link keys の保持を検証 |

workflow_state は全体として `implemented_local_evidence_captured`。Gate-A=passed（spec review）、Gate-B=passed（local implementation / tests）、Gate-C=pending（staging apply / capture / commit / push / PR は user-gated）。

## Step 1-C: 関連タスク

| 関連 | 関係 | 重複 |
| --- | --- | --- |
| `test-accounts-seed-spec` | catalog / build-seed-sql / 適用 CLI / drift guard の基盤・正本 | なし（本タスクは基盤を再利用し profile データを拡充する継続。基盤定義は変更しない） |
| `public-member-detail-survey-fields-richness`（completed-tasks） | 公開詳細 5 セクション化 + TEST-MEM-01 seed richness | なし（本タスクは TEST-MEM-02..10 へ横展開する継続。描画構造は変更しない） |
| commit `66d18af1b` | 公開詳細ページの 5 セクション全 public 項目描画 | なし（既に dev tip に landed。本タスクはこの描画を残り 9 アカウントで再現） |

## Step 2: 新規インターフェース sync 判定

**判定: N/A（新規インターフェース追加なし）**

本タスクは新規 public API endpoint / D1 schema / migration / Google Form schema / secret / 公開型を一切追加・変更しない（既存 surface のみ）。`catalog.ts` の per-member `profile` 拡充は既存 `TestMemberAccount` 構造内のデータ充填であり、新規エクスポート I/F を生まない。したがって global skill（aiworkflow-requirements）への新規 I/F 反映は不要。

新規 public API / D1 schema migration / Google Form schema は無いため Step 2 は N/A。ただし実装結果の workflow ledger / index 同期は本 workflow 配下の artifacts と Phase 12 summary に記録する。global aiworkflow index への恒久同期は、commit/PR方針確定時に実施する user-gated 周辺作業として扱う。

- local正本: `docs/30-workflows/staging-test-accounts-full-data-and-detail-verify/artifacts.json`
- local証跡: focused vitest / typecheck / lint 実行結果
- global skill sync: 新規I/Fなしのため必須同期なし

## Contract Impact

既存 D1 tables のみ利用し、API レスポンス契約・D1 schema・Google Form schema を変更しない。production seed apply は CLI で構造的に拒否する。apps/web は `fetchPublicOrNotFound` 経由の API 取得のみで D1 binding に直接アクセスしない（不変条件 #5）。visibility=public 二重防御を維持し、member/admin 項目は公開ページへ漏らさない。
