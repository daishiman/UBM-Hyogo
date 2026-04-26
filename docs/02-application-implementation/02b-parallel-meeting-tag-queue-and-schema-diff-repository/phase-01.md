# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | meeting-tag-queue-and-schema-diff-repository |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | 01a (D1 schema), 01b (zod) |
| 下流 | Phase 2 (設計) |
| 状態 | pending |

## 目的

開催 / queue / schema 系 7 テーブルの D1 アクセス層について **責務 / 状態遷移 / 制約の置き場所** を確定し、後続 03a / 04c / 07a/b/c / 08a の手戻りをゼロにする。

## 真の論点

1. **`member_attendance` 重複防止を「アプリ層 if 文」ではなく「D1 PK 制約」で守れるか**（不変条件 #15）
2. **`tag_assignment_queue` の状態遷移を unidirectional に強制できるか**（不変条件 #13）
3. **`schema_diff_queue` の latest version 解決が並列 sync で race condition を起こさないか**
4. **`tagDefinitions` の write API を本タスクで提供しないことで、不変条件 #13（直接編集禁止）を構造化できるか**
5. **`attendance.listAttendableMembers` で削除済み会員を必ず除外できるか（02a の `member_status` を read-only で参照）**

## 依存境界

| 種別 | 対象 | 引き渡し内容 |
| --- | --- | --- |
| 上流: 01a | D1 schema | `meeting_sessions` / `member_attendance` / `tag_definitions` / `tag_assignment_queue` / `form_manifests` / `form_fields` / `form_field_aliases` / `schema_diff_queue` の DDL |
| 上流: 01b | zod / view model | `MeetingWithAttendance` / `TagAssignmentQueueItem` / `SchemaDiffReviewView` / `TagDefinition` |
| 並列: 02a | 共通基盤 | `_shared/db.ts` / `_shared/brand.ts` を import |
| 並列: 02c | dep-cruiser config / fixture loader | 02c が共通化 |
| 下流: 03a | schema sync | `schemaVersions.upsertManifest()` / `schemaQuestions.upsertField()` / `schemaDiffQueue.enqueue()` |
| 下流: 04c | admin API | `/admin/tags/queue`, `/admin/schema/diff`, `/admin/meetings`, attendance |
| 下流: 07a | tag queue resolve | `tagQueue.transitionStatus()` |
| 下流: 07b | schema alias | `schemaDiffQueue.resolve()` + `schemaQuestions.updateStableKey()` |
| 下流: 07c | attendance + audit | `attendance.add/remove` + `listAttendableMembers` |
| 下流: 08a | repository test | unit test fixture |

## 価値とコスト

| 区分 | 内容 |
| --- | --- |
| 初回価値 | 03a / 04c / 07a/b/c / 08a が並列着手可、queue / schema / attendance の意味論を repository が一手に握る |
| 払うコスト | tagQueue の status enum を TS と SQL の両側で管理（drift は test で防御） |
| 払わないコスト | tag 辞書編集 UI、tag rule 編集 API、attendance の bulk operation API |

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 誰のどのコストを下げるか | PASS | 04c / 07a/b/c が「queue とは何か」を実装ごとに再定義しなくて済む |
| 実現性 | 無料運用で成立 | PASS | D1 ベース、bundle size 加算なし |
| 整合性 | 型 / runtime / data | PASS | PK 制約 / status enum / dep-cruiser で構造化 |
| 運用性 | rollback / handoff | PASS | sync 失敗時の再実行が idempotent（`upsertManifest` / `enqueue` の重複は status で吸収） |

## 実行タスク

1. 01a の DDL を読み、扱う 7 テーブルを確定
2. 01b の view model 型を読み、組み立てる 3 view 型を確定
3. responsibilities 一覧（7 repo 別）を作成
4. 不変条件 #5 / #13 / #14 / #15 を「どのファイルでどう守るか」表に落とす
5. AC-1〜AC-9 を Phase 1 main.md にコピーし、test 検証可能性を確認
6. handoff document（03a / 04c / 07a/b/c / 08a 向け）を作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | data flow / queue 発生条件 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | view model 型 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | DDL / 整合ルール / index |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | tag queue / schema diff / meeting 仕様 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | tag 6 カテゴリ |
| 参考 | doc/02-application-implementation/_design/phase-2-design.md | Wave 2b |

## 実行手順

### ステップ 1: input と前提
- 01a 完了物（DDL）と 01b 完了物（zod / view model）を読む
- 02a の `_shared/db.ts` / `_shared/brand.ts` 設計を確認

### ステップ 2: Phase 成果物
- `outputs/phase-01/main.md` に下記を書く
  - 「責務一覧」: 7 repo のファイル別責務
  - 「公開 interface 文章版」
  - 「不変条件マッピング表」
  - 「状態遷移図」: tag_assignment_queue / schema_diff_queue
  - 「AC-1〜AC-9 の test 戦略」

### ステップ 3: 4 条件と handoff
- 4 条件 PASS 確認
- 03a / 04c / 07a/b/c / 08a 向け interface を箇条書き

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 責務 → module map |
| Phase 4 | AC → verify suite |
| Phase 7 | AC matrix のトレース起点 |
| Phase 12 | implementation-guide |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| D1 boundary | #5 | repository を `apps/api/src/repository/` に閉じる |
| tag 直接編集禁止 | #13 | `memberTags` write API は 02a / 02b の双方で提供しない、queue 経由のみ |
| schema 集約 | #14 | `schemaDiffQueue` / `schemaVersions` を `/admin/schema/*` の唯一の data source に |
| attendance 重複 / 削除済み | #15 | `member_attendance` PK + `listAttendableMembers` filter |
| 無料枠 | #10 | list query は index 利用 + LIMIT |
| 認可境界 | — | repository は context を引数で受ける、route 層が判定 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 01a DDL 読込 | 1 | pending | 7 テーブル |
| 2 | 01b view model 読込 | 1 | pending | 3 view |
| 3 | 責務一覧 | 1 | pending | 7 repo |
| 4 | 不変条件 mapping | 1 | pending | #5/#13/#14/#15 |
| 5 | 状態遷移図 | 1 | pending | tag queue / schema queue |
| 6 | AC test 戦略 | 1 | pending | AC-1〜AC-9 |
| 7 | handoff interface | 1 | pending | 下流 5 task |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 主成果物 |
| メタ | artifacts.json | Phase 1 → completed |

## 完了条件

- [ ] 主成果物作成
- [ ] 不変条件 #5 / #13 / #14 / #15 のマッピング完了
- [ ] AC-1〜AC-9 が test 戦略にマップ
- [ ] handoff interface 一覧が完成

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜7 が completed
- [ ] outputs/phase-01/main.md が配置
- [ ] 不変条件 4 件への対応が表で確認可能
- [ ] artifacts.json の Phase 1 を completed に更新

## 次 Phase

- 次: Phase 2 (設計)
- 引き継ぎ事項: 責務一覧 / 公開 interface / 状態遷移図 / 不変条件マッピング
- ブロック条件: マッピングが欠落していれば Phase 2 に進めない
