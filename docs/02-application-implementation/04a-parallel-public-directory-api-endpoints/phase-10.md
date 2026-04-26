# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04a-parallel-public-directory-api-endpoints |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| Wave | 4 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 9（品質保証） |
| 次 Phase | 11（手動 smoke） |
| 状態 | pending |

## 目的

GO/NO-GO 判定を出す。依存先 wave（02a / 02b / 03b / 01b）の AC が満たされているかを根拠として、Phase 11 以降に進む可否を確定する。leak ゼロ（不変条件 #2 / #3 / #11）と未認証 200（AC-9）が構造的に保証されているかを最終確認する。NO-GO の場合は blocker を列挙して上流タスクに差し戻す。

## GO/NO-GO 判定

### 判定基準

- すべての AC（AC-1〜AC-12）に verify suite と runbook step が紐付いている（Phase 7）
- すべての failure case（F-1〜F-22）が AC trace 済み or 残存リスク扱い（Phase 6）
- 不変条件 #1, #2, #3, #4, #5, #10, #11, #14 がすべて担保（Phase 7 逆引き）
- 上流 02a / 02b / 03b / 01b の AC が満たされている
- Phase 9 の無料枠見積もりが 5% 未満
- Phase 9 の secret hygiene checklist 全 pass
- Phase 9 の leak test report 10 ケースすべて placeholder 配置
- DRY 化（Phase 8）が AC matrix を破壊していない

### Blocker 候補

| # | blocker | 影響 | 対処 |
| --- | --- | --- | --- |
| B-1 | 02a の `membersRepository.findPublic / findByIdPublic / existsPublic` が未実装 | GET /public/members / :memberId が動かない | 02a wave 完了待ち |
| B-2 | 02a の `responseFieldsRepository.findByResponseId` / `responseSectionsRepository.findByResponseId` が未実装 | GET /public/members/:memberId の詳細が動かない | 02a wave 完了待ち |
| B-3 | 02b の `schemaQuestionsRepository.list` / `syncJobsRepository.findLatestPerKind` が未実装 | GET /public/form-preview / stats.lastSync が動かない | 02b wave 完了待ち |
| B-4 | 02b の `tagDefinitionsRepository.list` / `memberTagsRepository.findByMemberId` が未実装 | tag AND filter（AC-5）が動かない | 02b wave 完了待ち |
| B-5 | 03b の `current_response_id` が未確定（同期未実施 fixture） | `/public/members` 適格 0 件で leak test 不能 | 03b wave 完了待ち、または fixture mock |
| B-6 | 01b の zod schema（`PublicStatsView` 等 4 種）未確定 | converter parse できない | 01b wave 完了待ち |

### 判定

- 上流 02a / 02b / 03b / 01b が green の場合: **GO**
- いずれか NO-GO の場合: 本タスクも NO-GO とし、Phase 11 を保留

## 依存 wave AC チェック

| 依存 task | 必要 AC | 確認方法 |
| --- | --- | --- |
| 02a-parallel-member-identity-status-and-response-repository | repository unit test pass / `findPublic` / `findByIdPublic` / `existsPublic` 提供 | 02a artifacts.json |
| 02b-parallel-meeting-tag-queue-and-schema-diff-repository | meetings / tagDefinitions / memberTags / schemaQuestions / syncJobs repository 提供 | 02b artifacts.json |
| 03b-parallel-forms-response-sync-and-current-response-resolver | `current_response_id` 切替済み、`member_status.public_consent` 列同期済み | 03b artifacts.json |
| 01b-parallel-zod-view-models-and-google-forms-api-client | `PublicStatsView` / `PublicMemberListView` / `PublicMemberProfile` / `FormPreviewView` 型 export | 01b artifacts.json |

## 残存リスク

| # | リスク | 緩和策 |
| --- | --- | --- |
| R-1 | 検索 LIKE の性能（数百 member 想定、全文検索エンジン未使用） | MVP 規模では許容、INDEX を後付検討 |
| R-2 | form-preview と admin sync の整合（schema_sync 直後 60 秒キャッシュ） | client refresh / 条件を満たす場合は admin manual 操作 |
| R-3 | 公開フィルタ漏れによる leak | SQL where + view converter の二重チェックを Phase 5 で実装、Phase 9 の leak test で保証 |
| R-4 | D1 一時障害時の 5xx | 503 に統一、Cloudflare の自動 retry 任せ |
| R-5 | Cache hit 時に admin の publishState 変更が即時反映されない（stats / form-preview のみ 60s） | members / profile は no-store、stats / form-preview は 60s 許容として spec 化 |
| R-6 | OPTIONS preflight の挙動が browser 依存 | CORS 設定を Hono middleware で共通化、E2E で確認 |
| R-7 | 04b / 04c の helper 共通化が AC を壊す | Phase 8 で守るべき境界を明示、03 タスク間の合意で確定 |

## 同 Wave 4 整合確認

| 観点 | 確認内容 |
| --- | --- |
| router マウント | `/public/*`（04a）/ `/me/*`（04b）/ `/admin/*`（04c）が path 衝突なし |
| エラー型 | `{ code, message?, issues? }` を 3 タスクで統一 |
| session middleware | 04a は適用しない、04b/04c は適用 |
| zod schema import 元 | 全タスク 01b に集約 |

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | 02a / 02b / 03b / 01b の artifacts.json | 依存 AC 確認 |
| 必須 | 本タスクの phase-07.md / phase-09.md | GO/NO-GO 入力 |
| 必須 | outputs/phase-08/main.md | DRY 化と AC の矛盾チェック |
| 参考 | doc/02-application-implementation/_design/phase-3-review.md | 設計レビュー |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定後に手動 smoke 実施 |
| Phase 12 | GO/NO-GO 結果を documentation-changelog に記録 |
| 09a (Wave 9) | 本タスクの GO は staging deploy の前提 |

## 多角的チェック観点（不変条件マッピング）

- #2（consent キー）— Phase 7 / Phase 9 の leak test で確認、判定の入力
- #3（`responseEmail`）— contract test での keys 不在を最終確認
- #5（apps/api 限定）— router / handler / use-case 全て apps/api 内
- #10（無料枠）— Phase 9 見積もりが 5% 未満
- #11（admin-managed 分離）— `adminNotes` 不在、404 で存在隠蔽

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | GO/NO-GO 判定基準確認 | 10 | pending | main.md |
| 2 | 依存 wave AC チェック | 10 | pending | 02a / 02b / 03b / 01b |
| 3 | blocker / 残存リスク列挙 | 10 | pending | 6 件以上 / 7 件以上 |
| 4 | 同 Wave 整合確認 | 10 | pending | 04b / 04c と path / 型 / middleware |
| 5 | 判定結果記録 | 10 | pending | GO 想定（依存 green 前提） |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | Phase 10 主成果物 |
| メタ | artifacts.json | Phase 10 を `completed` に更新 |

## 完了条件

- [ ] GO/NO-GO 判定が記録
- [ ] blocker と残存リスクが列挙
- [ ] 依存 wave AC チェック表が完成
- [ ] 同 Wave 整合確認が完成

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 全完了条件チェック
- [ ] artifacts.json の Phase 10 を `completed` に更新

## 次 Phase

- 次: 11（手動 smoke）
- 引き継ぎ事項: GO の場合のみ Phase 11 開始、NO-GO の場合は blocker 解消待ち
- ブロック条件: NO-GO のまま Phase 11 を開始しない
