# Phase 1: 要件定義

[実装区分: 実装仕様書] / Task: TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001

## 1.1 タスク分類

| 項目 | 値 |
|------|-----|
| Task type | implementation（UI task） |
| implementation_mode | new（catalog の profile データ拡充は新規コンテンツ。Lane B は verify_existing + 限定 gap-fix） |
| visualEvidence | VISUAL_ON_EXECUTION（公開詳細ページの目視確認が成果。implemented_local_evidence_captured のため PNG は pending） |
| docs-only 判定 | **否**。CONST_004 デフォルトの実装仕様書。catalog.ts（データ/コード）・build-seed-sql.ts・seed 生成物・apps/web 検証/修正・テストの実コード変更を伴うため、純粋ドキュメントでは目的達成不可。 |

## 1.2 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在する | 一部（commit 66d18af1b で公開詳細5セクション化 + TEST-MEM-01 seed richness が landed） | Lane B は「差分確認 → 回帰確認」にシフト可能。Lane A は TEST-MEM-02..10 のデータ追加 = 新規実装。 |
| upstream（dev/main）にマージ済み | 公開詳細5セクション化・TEST-MEM-01 richness は dev tip（HEAD）に含む | 再実装不要。本タスクは TEST-MEM-02..10 へ横展開する継続。 |
| 前提タスク完了済み | `test-accounts-seed-spec`（catalog/build/CLI 基盤）・`public-member-detail-survey-fields-richness`（5セクション描画 + TEST-MEM-01）完了済 | 依存解消済み。基盤を再利用。 |

> 結論: 本タスクは既存基盤の上に **TEST-MEM-01 で成立済みの全 public 項目描画を、残り 9 アカウントへ profile データを与えて再現する** こと。詳細ページ構造・API・D1 schema は変更しない。

## 1.3 受入条件（Acceptance Criteria）

| ID | 受入条件 | 検証 |
|----|----------|------|
| AC-1 | TEST-MEM-01..10 の per-member `profile` が表示バリエーション・マトリクス（index.md）通りに Google Form 31 stable_key を保持する | catalog.spec |
| AC-2 | 公開掲載 5 件（01,06,07,09,10）は visibility=public の全 29 項目を実データで持つ（09 は意図的に全項目入力、10 はエッジ値） | catalog.spec / contract.spec |
| AC-3 | member/admin 項目（birthDate/ubmJoinDate/challenges）も**データとして**投入される（公開ページには出ない） | catalog.spec |
| AC-4 | `scripts/gen-test-accounts-seed.mjs` 再生成結果が committed seed/cleanup/manifest と byte 一致（drift 0） | contract.spec / gen --check |
| AC-5 | in-memory D1 に seed 適用後、公開掲載 5 件の公開項目が API view 相当で全て取得でき、member/admin 項目は公開 view に漏れない | contract.spec |
| AC-6 | apps/web 公開詳細ページが full（01/06/07）/ all-fields（09）/ edge（10）データで全 public 項目を 5 セクション描画し、空項目は `—` fallback / 条件付き非表示で破綻しない | member-detail.spec / component spec |
| AC-7 | API endpoint / D1 schema / migration / Google Form schema を一切追加・変更していない（`git diff` で apps/api/src/routes・migrations(seed 以外)・packages/shared/zod に変更なし） | git diff 確認 |
| AC-8 | `pnpm typecheck` / `pnpm lint`（apps/api・apps/web）green。HEX 直書き 0・新規 primitive 0 | typecheck / lint / verify-design-tokens |
| AC-9 | `seed → cleanup → seed` 冪等（重複適用で件数不変・cleanup 後 0 件） | contract.spec |
| AC-10 | （user-gated）staging 適用後 `/members/TEST-MEM-06`（+01/07/09/10）で全 public 項目描画を目視確認しスクリーンショット取得 | Phase 11 手動 |

## 1.4 命名規則（既存コードベース分析）

| 対象 | 規則 | 根拠 |
|------|------|------|
| stable_key | camelCase（`fullName` / `urlWebsite`） | `packages/shared/src/zod/field.ts` `STABLE_KEY` |
| member_id | `TEST-MEM-NN`（2 桁ゼロ埋め） | `catalog.ts` literal type `TEST-MEM-${string}` |
| email | `test-mem-NN@test.ubm-hyogo.invalid` | catalog 既定（RFC 2606 `.invalid`） |
| 表示名先頭 | `[TEST] …` | テスト判別規約 |
| test ファイル | `*.spec.{ts,tsx}` のみ | 不変条件 #8 / lefthook |
| consent キー | `publicConsent` / `rulesConsent` | 不変条件 #2 |

## 1.5 inventory（既存資産）

- **再利用**: catalog.ts の 10 member 定義・build-seed-sql.ts のジェネレータ・gen-test-accounts-seed.mjs・seed-test-accounts.sh・公開詳細 5 セクション描画（adapter + 9 components）・既存 spec 群。
- **拡充**: 各 member の `profile` フィールド（現状 06 等は最小）。
- **新規**: 原則なし（既存ファイル編集中心。fixture は既存ファイル更新）。

## 1.6 リスクと前提

- **R1（最小）**: build-seed-sql が TEST-MEM-01 で全 public 項目を成立させている＝member_field_visibility seeding は既に汎用。10 件への適用でジェネレータ構造変更は原則不要。Phase 2 で確認する。
- **R2**: Lane B は表示漏れが見つからない可能性が高い（commit 66d18af1b で網羅済み）。その場合 Lane B はテスト追補 + fixture 更新 + 「ギャップなし」記録に縮退する（spec に明記）。
- **R3**: vitest メモリ制約時は targeted run（`apps/api/src/testing/test-accounts` / `apps/web/src/lib/adapters`）でファイル指定する。

## 完了条件

- 受入条件 AC-1..AC-10 を定義した。命名規則・inventory・リスクを固定した。Phase 2 設計へ進む。
