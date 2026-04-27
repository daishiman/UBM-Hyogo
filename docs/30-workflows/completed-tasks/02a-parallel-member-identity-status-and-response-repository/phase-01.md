# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-identity-status-and-response-repository |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | 01a (D1 schema), 01b (zod / view model) |
| 下流 | Phase 2 (設計) |
| 状態 | completed |

## 目的

会員ドメインの D1 アクセス層を **どの責務に閉じ、どの type を境界にし、どの不変条件を守るか** を確定し、後続 Phase の手戻りをゼロにする。実装すべき repository ファイルと export interface、`MemberId` / `ResponseId` の混同防止戦略、`PublicMemberProfile` / `MemberProfile` / `AdminMemberDetailView` の組み立て責務をここで固定する。

## 真の論点

1. **`responseId` と `memberId` の混同を「実行時 test」ではなく「型レベルで構文不可」にできるか**（不変条件 #7）
2. **`member_responses` を immutable に扱う契約が repository API に表現されているか**（不変条件 #4 / #11）
3. **`apps/api/src/repository/_shared/builder.ts` が単一の view assembler となり、04a / 04b / 04c で同じ source から異なる view を出せるか**
4. **list query の N+1 を、上流 D1 schema の index（`idx_member_responses_email_submitted` / `idx_member_status_public`）と整合する形で防げるか**
5. **02b / 02c との相互 import を構造で禁じる**（dependency-cruiser ルール）

## 依存境界

| 種別 | 対象 | 引き渡し内容 |
| --- | --- | --- |
| 上流: 01a | D1 schema migration | `members` / `member_identities` / `member_status` / `member_responses` / `response_sections` / `response_fields` / `member_field_visibility` / `member_tags` / `deleted_members` の DDL と index |
| 上流: 01b | zod schema / branded type / view model | `MemberId` / `ResponseId` / `StableKey` の brand、`MemberProfile` / `PublicMemberProfile` / `AdminMemberDetailView` の TS 型 |
| 並列: 02b | 共通基盤共有 | D1 binding 共有、`apps/api/src/repository/_shared/db.ts` の placeholder |
| 並列: 02c | dependency boundary lint | `apps/web` → repository import 禁止ルールは 02c 側で実装 |
| 下流: 03b | response sync | `responses.ts` の `upsertResponse` と `identities.ts` の `updateCurrentResponse` を呼ぶ |
| 下流: 04a | public API | `builder.toPublicMemberListView()` と `builder.toPublicMemberProfile()` を呼ぶ |
| 下流: 04b | member API | `builder.toMemberProfile(sessionMemberId)` を呼ぶ |
| 下流: 08a | repository test | unit test fixture と公開 interface |

## 価値とコスト

| 区分 | 内容 |
| --- | --- |
| 初回価値 | 03b / 04a / 04b / 04c / 08a が「型と関数 signature」を確定して並列着手できる |
| 払うコスト | branded type の冗長性（`unwrapMemberId(id)` が必要な箇所が増える）、in-memory fixture の維持 |
| 払わないコスト | profile_overrides 系列、本人本文 update endpoint、admin の本文書込み API |

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 誰のどのコストを下げるか定義されているか | PASS | 03b / 04* / 08a が同じ repository を使うため、同期 / API / test の重複実装を回避 |
| 実現性 | 無料運用の初回スコープで成立するか | PASS | D1 read 中心、write は限定的、無料枠 500k reads/day 内に収まる試算 |
| 整合性 | 型 / branch / runtime / data / secret が矛盾しないか | PASS | branded type で `responseId !== memberId` を構文不可にする |
| 運用性 | rollback / handoff / same-wave sync が可能か | PASS | repository は idempotent な read 中心、write は upsert で再実行可能、02b/02c とは独立 |

## 実行タスク

1. **入力確認**
   - 01a の DDL を読み、扱うテーブル 9 種を確定
   - 01b の view model 型を読み、組み立てるべき view 型 3 種を確定
2. **責務確定**
   - repository ファイル 8 つの公開 interface を文章で固める（型 signature は Phase 2）
   - builder の入力 / 出力 / 副作用なし契約を明記
3. **不変条件マッピング**
   - 不変条件 #4 / #5 / #7 / #11 / #12 を「どの ファイルでどう守るか」表に落とす
4. **AC 抽出**
   - index.md の AC-1〜AC-8 を Phase 1 main.md にコピーし、test 検証可能性をチェック
5. **handoff document**
   - 03b / 04a / 04b / 08a が読むべき「上流引き渡し interface」をリスト化

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | data flow / view merge |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | view model / branded type |
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | 本人本文 = Form 再回答 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | テーブル DDL / index |
| 必須 | docs/30-workflows/02-application-implementation/_design/phase-2-design.md | Wave 2a 詳細 |

## 実行手順

### ステップ 1: input と前提の確認
- 01a 完了物（DDL）と 01b 完了物（zod / view model）の差分を読む
- 01a の `member_responses` / `member_identities` / `member_status` テーブルが Phase 1 で扱う 9 テーブル全てを含むか確認

### ステップ 2: Phase 成果物の作成
- `outputs/phase-01/main.md` に下記を書く
  - 「責務一覧」: repository ファイル 8 + builder 1
  - 「公開 interface 文章版」: 関数名と引数 / 戻り値型を文で記述
  - 「不変条件マッピング表」
  - 「AC-1〜AC-8 と test 戦略の対応」

### ステップ 3: 4 条件と handoff の確認
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が全て PASS か再確認
- 03b / 04a / 04b / 08a が読む「上流引き渡し interface」を箇条書き化

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 本 Phase の責務一覧から module map を起こす |
| Phase 4 | AC を verify suite に変換する |
| Phase 7 | AC matrix のトレース起点 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | implementation-guide.md の入力 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 本人本文 immutability | #4 | repository に `member_responses` の write API は upsert（sync 専用）以外存在しない |
| D1 boundary | #5 | `apps/api/src/repository/` 配下にのみ配置、`apps/web` から import 不可（02c の lint で阻止） |
| 型混同防止 | #7 | `MemberId` と `ResponseId` を branded type 化 |
| admin 本文編集禁止 | #11 | admin context でも `member_responses` の write API を提供しない |
| view model 分離 | #12 | `PublicMemberProfile` / `MemberProfile` builder は `adminNotes` を返さない（Omit 済み） |
| 認可境界 | — | builder は呼び出し元の context（public / member / admin）を引数で受け取り、漏れを構造化 |
| 無料枠 | #10 | list query は `LIMIT/OFFSET` + index 経由、N+1 を `IN (?)` バッチで回避 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 01a DDL 読込 | 1 | completed | 9 テーブル確認 |
| 2 | 01b zod / view model 読込 | 1 | completed | 3 view 確認 |
| 3 | 責務一覧文書化 | 1 | completed | 8 repo + 1 builder |
| 4 | 不変条件マッピング表 | 1 | completed | #4/#5/#7/#11/#12 |
| 5 | AC test 戦略 mapping | 1 | completed | AC-1〜AC-8 |
| 6 | handoff interface 抽出 | 1 | completed | 下流 4 タスク向け |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 の主成果物（責務一覧 / interface 文章 / 不変条件マッピング / handoff） |
| メタ | artifacts.json | Phase 1 を completed に更新 |

## 完了条件

- [ ] 主成果物 `outputs/phase-01/main.md` が作成済み
- [ ] 不変条件 #4 / #5 / #7 / #11 / #12 が「どのファイルで守るか」表で書かれている
- [ ] AC-1〜AC-8 が test 戦略にマップ済み
- [ ] 03b / 04a / 04b / 08a 向け handoff interface 一覧が完成

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が completed
- [ ] outputs/phase-01/main.md が指定パスに配置
- [ ] 完了条件 4 項目に全てチェック
- [ ] 不変条件 #4 / #5 / #7 / #11 / #12 への対応が表で確認可能
- [ ] artifacts.json の Phase 1 を completed に更新

## 次 Phase

- 次: Phase 2 (設計)
- 引き継ぎ事項: 責務一覧 / 公開 interface 文章版 / 不変条件マッピング表
- ブロック条件: outputs/phase-01/main.md が未作成、または不変条件マッピングが欠落していたら Phase 2 に進めない
