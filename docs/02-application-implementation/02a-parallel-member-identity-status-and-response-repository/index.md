# 02a-parallel-member-identity-status-and-response-repository — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-identity-status-and-response-repository |
| ディレクトリ | doc/02-application-implementation/02a-parallel-member-identity-status-and-response-repository |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | data / api |
| 状態 | pending |
| タスク種別 | spec_created |

## 目的

会員ドメインの D1 repository（`members` / `member_identities` / `member_status` / `member_responses` / `response_sections` / `response_fields` / `member_field_visibility` / `member_tags`）を `apps/api/repository/` 配下に実装し、上流の D1 schema (01a) と zod view model (01b) を組み合わせて view model を組み立てられる状態を作る。`responseId` と `memberId` の混同を型レベルで阻止する。

## スコープ

### 含む

- `apps/api/repository/members.ts` — members テーブル CRUD、unique constraint helper
- `apps/api/repository/identities.ts` — `member_identities` の upsert / `current_response_id` 切替（read-only API）
- `apps/api/repository/status.ts` — `member_status` の read / `publish_state` / `is_deleted` / consent 反映用 setter
- `apps/api/repository/responses.ts` — `member_responses` の page query、`current_response_id` 経由 fetch
- `apps/api/repository/responseSections.ts` / `responseFields.ts` — section / field 単位の正規化アクセス
- `apps/api/repository/fieldVisibility.ts` — `member_field_visibility` の read（admin / member / public フィルタの基底）
- `apps/api/repository/memberTags.ts` — read-only（`member_tags` への書込みは 07a queue resolve 経由のみ）
- `apps/api/repository/_shared/builder.ts` — fixture から `PublicMemberProfile` / `MemberProfile` / `AdminMemberDetailView` を組み立てる view assembler
- `MemberId` / `ResponseId` / `StableKey` の branded type test（混同を type レベルで阻止）
- repository unit test 用の in-memory D1 fixture loader

### 含まない

- meeting / attendance / tag queue / schema diff の repository（02b）
- admin_users / admin_member_notes / audit_log / sync_jobs / magic_tokens（02c）
- HTTP endpoint 実装（04a/b/c）
- Forms 同期実体（03a/b）
- `apps/web` からの D1 直接 import 禁止 ESLint rule（02c が責任）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 01a-parallel-d1-database-schema-migrations-and-tag-seed | D1 schema / migration が無いと repository が成立しない |
| 上流 | 01b-parallel-zod-view-models-and-google-forms-api-client | view model 型と zod schema が必要 |
| 下流 | 03b-parallel-forms-response-sync-and-current-response-resolver | response upsert と `current_response_id` 更新 API を提供 |
| 下流 | 04a-parallel-public-directory-api-endpoints | `PublicMemberListView` / `PublicMemberProfile` 組み立て元 |
| 下流 | 04b-parallel-member-self-service-api-endpoints | `MemberProfile` / `SessionUser` 解決元 |
| 下流 | 08a-parallel-api-contract-repository-and-authorization-tests | repository contract test の対象 |
| 並列 | 02b / 02c | 同 Wave、互いの table 群は独立 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | data flow / current response resolver / view merge |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | view model 4 層、`MemberProfile` / `PublicMemberProfile` / `AdminMemberDetailView` |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | D1 schema と整合ルール |
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | 本人本文の「Form 再回答が正本」原則（不変条件 #4） |
| 参考 | doc/02-application-implementation/_design/phase-2-design.md | Wave 2a 詳細仕様 |
| 参考 | doc/02-application-implementation/01a-parallel-d1-database-schema-migrations-and-tag-seed/ | DDL とテーブル名 |
| 参考 | doc/02-application-implementation/01b-parallel-zod-view-models-and-google-forms-api-client/ | zod schema と branded type |

## 受入条件 (AC)

- AC-1: `apps/api/repository/{members,identities,status,responses,responseSections,responseFields,fieldVisibility,memberTags}.ts` が存在し、それぞれ unit test pass する（vitest、in-memory D1 fixture）
- AC-2: fixture から `PublicMemberProfile` / `MemberProfile` / `AdminMemberDetailView` が組み立てられる builder test が green（snapshot 含む）
- AC-3: `MemberId` / `ResponseId` を相互代入しようとすると **TypeScript コンパイルエラー** になる branded type test が green
- AC-4: `member_status.is_deleted = 1` または `public_consent != 'consented'` の member は `PublicMemberProfile` に含まれない（builder test で confirm）
- AC-5: `member_field_visibility` の `admin` 設定 field は `PublicMemberProfile` / `MemberProfile` から除外される（builder test で confirm）
- AC-6: `member_tags` への書込みは repository 経由では行わず、read-only API のみ提供（write を試行する test が型エラー or runtime error）
- AC-7: D1 read query が無料枠（500k reads/day）を意識した N+1 防止設計（list + by-id batch fetch）になっている
- AC-8: 02b（meeting / queue）, 02c（admin / audit）と相互 import がゼロ（dependency-cruiser または ESLint で確認）

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | pending | outputs/phase-02/{main,module-map,dependency-matrix}.md |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-03/{main,alternatives}.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/{main,verify-suite}.md |
| 5 | 実装ランブック | phase-05.md | pending | outputs/phase-05/{main,runbook}.md |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/{main,failure-cases}.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/{main,ac-matrix}.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/{main,before-after}.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/{main,free-tier,secret-hygiene}.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/{main,go-no-go}.md |
| 11 | 手動 smoke | phase-11.md | pending | outputs/phase-11/{main,manual-evidence}.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/* 6 種 |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/* 4 種 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | phase-01.md 〜 phase-13.md | 13 phase 別仕様 |
| メタ | artifacts.json | 機械可読サマリー |
| ドキュメント | outputs/phase-02/module-map.md | repository ファイル群と call graph |
| ドキュメント | outputs/phase-04/verify-suite.md | unit / contract / authz テスト 設計 |
| ドキュメント | outputs/phase-05/runbook.md | 実装手順 + コード placeholder |
| ドキュメント | outputs/phase-07/ac-matrix.md | Phase 1 AC × Phase 4 検証 × Phase 5 実装 |
| ドキュメント | outputs/phase-12/implementation-guide.md | 後続実装エージェントへの手引き |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare D1 | repository アクセス先 | 5GB / 500k reads/day |
| Cloudflare Workers (apps/api) | repository を呼び出す runtime | 100k req/day |
| vitest | unit test runner | OSS |
| miniflare / @cloudflare/workers-types | D1 in-memory fixture | OSS |
| dependency-cruiser | 02b/02c との相互 import 検出 | OSS |

## Secrets 一覧（このタスクで導入）

なし（このタスクでは secret を新規導入しない。D1 binding は 01a / 01b で確定済み）。

## 触れる不変条件

| # | 不変条件 | このタスクでの扱い |
| --- | --- | --- |
| 4 | 本人プロフィール本文は D1 override で編集しない（Form 再回答が正本） | `member_responses` は immutable に扱い、`profile_overrides` 系列の table / repository を作らない |
| 5 | apps/web から D1 直接アクセス禁止 | repository は `apps/api/repository/` のみに配置。`apps/web` から import すると後続 (02c) の lint で error になる前提で API 公開しない |
| 7 | `responseId` と `memberId` を混同しない | `MemberId` / `ResponseId` を branded type 化、相互代入で TS エラー |
| 11 | 管理者は他人プロフィール本文を直接編集できない | repository は `member_responses` の write メソッドを admin context にも提供しない（response の write は 03b sync 経由のみ） |
| 12 | admin_member_notes は public/member view model に混ざらない | このタスクは `adminNotes` を扱わないが、`AdminMemberDetailView` builder の interface だけ確保し、実装は 02c に委譲 |

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC-1〜AC-8 が Phase 7 / 10 で完全トレースされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の implementation-guide が 03b / 04a / 04b / 08a の入り口になっている
- Phase 13 はユーザー承認なしでは実行しない

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-app.md
- 並列タスク: ../02b-parallel-meeting-tag-queue-and-schema-diff-repository/, ../02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/
