# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04a-parallel-public-directory-api-endpoints |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 4 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 11（手動 smoke） |
| 次 Phase | 13（PR 作成） |
| 状態 | pending |

## 目的

実装ガイド / system spec 更新 / changelog / unassigned task 検出 / skill feedback / compliance check の 6 成果物を生成し、`specs/` や `README.md` との同期を取る。同 Wave（04b / 04c）との命名・helper 整合を最終確認する。中学生レベルの概念説明を含めることで、後続実装担当の理解を保証する。

## Phase 12 必須成果物

| 成果物 | パス |
| --- | --- |
| 実装ガイド | outputs/phase-12/implementation-guide.md |
| system spec update summary | outputs/phase-12/system-spec-update-summary.md |
| changelog | outputs/phase-12/documentation-changelog.md |
| unassigned task 検出 | outputs/phase-12/unassigned-task-detection.md |
| skill feedback | outputs/phase-12/skill-feedback-report.md |
| compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md |

## Part 1: 中学生レベル概念説明（例え話）

- `/public/stats` は「学校の正面玄関にある掲示板で、今の登録者数や直近の活動を見せる窓口」
- `/public/members` は「卒業アルバムで顔と名前と所属を一覧にした名簿」
- `/public/members/:memberId` は「卒業アルバムで 1 人のページを開いた状態」
- `/public/form-preview` は「申し込み用紙の見本を窓口で配って、書く前に内容を確認できる仕組み」
- 名簿には「載せていい」と本人が同意した人だけが載る（`publicConsent='consented'`）
- ページに載せる項目も「公開していい」と決まっている項目だけ（`FieldVisibility='public'`）
- メールアドレスや管理者メモは載せない（`responseEmail` / `adminNotes` 除外）
- 未公開の人を直接 URL で叩いても「いません」と答える（404、403 で「いるけど見せない」とは言わない）

## Part 2: 技術者レベル詳細

| 項目 | 詳細 |
| --- | --- |
| task root | doc/02-application-implementation/04a-parallel-public-directory-api-endpoints |
| key outputs | outputs/phase-02/api-flow.mermaid, outputs/phase-04/test-matrix.md, outputs/phase-05/api-runbook.md, outputs/phase-07/ac-matrix.md, outputs/phase-09/leak-test-report.md, outputs/phase-11/manual-evidence.md |
| upstream | 02a / 02b / 03b / 01b |
| downstream | 06a / 08a / 08b |
| validation focus | 不変条件 #2 / #3 / #11 + leak ゼロ + AC × verify trace 完全性 |
| 採用案 | Alternative A（router → use-case → repository → view、leak 二重チェック）+ 部分 E（stats / form-preview のみ 60s cache） |

## system spec 更新概要

- spec 03-data-fetching.md の endpoint 一覧に 4 endpoint の Cache-Control 方針（stats / form-preview は 60s、members / profile は no-store）を追記する余地があるため、`system-spec-update-summary.md` に「specs/03 への Cache-Control 列追記提案」を残す
- spec 04-types.md の `PublicMemberProfile` 型を `Omit<MemberProfile, 'responseEmail' | 'rulesConsent' | 'adminNotes'>` で正式化する提案
- spec 12-search-tags.md の `density` パラメータが server side で使われない旨を明文化する提案（client filter であることの spec 明記）
- spec 01-api-schema.md の `responderUrl` 固定値を env でも override 可能にする運用補足提案

## documentation-changelog.md（生成内容）

| 種別 | 対象 | 変更概要 |
| --- | --- | --- |
| 新規 | doc/02-application-implementation/04a-parallel-public-directory-api-endpoints/* | 15 ファイル新規（index + artifacts + phase 13 個） |
| 提案 | doc/00-getting-started-manual/specs/03-data-fetching.md | Cache-Control 列の追記提案 |
| 提案 | doc/00-getting-started-manual/specs/04-types.md | `PublicMemberProfile` の Omit 型での正式化提案 |
| 提案 | doc/00-getting-started-manual/specs/12-search-tags.md | `density` が client side である旨の明文化提案 |
| 同期 | doc/02-application-implementation/README.md | 04a の AC を README に反映 |

## unassigned-task-detection.md

- form-preview の ETag / Last-Modified header 出力は **09a / インフラ wave 担当**で、本タスクスコープ外（Phase 9 R-2 として残置）
- members / profile の cache 整合（admin 操作の即時反映）の検証は **08b の E2E 担当**で、本タスクは no-store 設定のみ
- 検索の全文検索エンジン（Cloudflare Vectorize 等）導入は **将来タスク**、MVP は D1 LIKE で確定
- search query の SQL injection 防御は repository 層（02a）の prepared statement に依存、本タスクは parser 層のみ
- pagination の総件数 cache 化は **将来タスク**（Phase 9 open question で言及）

## skill-feedback-report.md

- spec 03-data-fetching.md の公開フィルタ条件が複数箇所に分散しており、1 箇所に集約した spec 章があると DRY しやすい → 該当 spec に「公開フィルタ条件のルールセクション」追記提案
- spec 04-types.md の `PublicMemberProfile` 型が「`Omit` で派生」とは書かれているが、key 名のリストが明示されていない → 該当 spec に「除外 key リスト（`responseEmail` / `rulesConsent` / `adminNotes`）」明記提案
- spec 12-search-tags.md と 03-data-fetching.md で query パラメータ仕様が分散 → 集約 doc が欲しい

## phase12-task-spec-compliance-check.md

| チェック項目 | 結果 |
| --- | --- |
| index.md の AC 全部に Phase 7 trace あり | TBD（実装時に確認） |
| 不変条件 #2 / #3 / #11 が phase-01 / phase-07 / phase-09 / phase-11 で言及 | TBD |
| 同 Wave 4b / 4c との命名衝突なし | TBD |
| Phase 12 必須成果物 6 個すべて存在 | TBD |
| Phase 13 が user 承認 gate を保持 | TBD |
| leak ゼロが Phase 9 leak-test-report で評価対象 | TBD |
| 公開境界（session middleware 不適用）が Phase 5 sanity check で確認 | TBD |

## 同 Wave sync

| 対象 | sync 内容 |
| --- | --- |
| 04b | エラーレスポンス型 `{ code, message?, issues? }` を共通 lib に確定、04a が主導 |
| 04c | session middleware helper 名 `consumeAuthSession` の有無、04a は consume せず |
| 04b / 04c | `paginationMeta` helper を 3 タスク共通化、04a 主導 |
| 04b / 04c | `app.onError` を 3 タスクで共通化、`code` 名の集合を統一 |

## LOGS.md 記録

- 04a 仕様書 15 ファイル新規生成
- 採用案: Alternative A（router → use-case → repository → view、leak 二重チェック）+ 部分 E（stats / form-preview のみ 60s cache）
- 不変条件 #2 / #3 / #11 を構造的に保証（公開フィルタ + view converter 二重 + 404 で存在隠蔽）
- 残存リスク R-1〜R-7 を Phase 13 PR 説明に明記

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] なぜこのタスクが必要かを、日常生活の例え話から説明する
- [ ] 専門用語を使う場合は、その場で短く説明する
- [ ] 何を作るかより先に、困りごとと解決後の状態を書く

### Part 2: 開発者・技術者レベル

- [ ] TypeScript の interface / type 定義を記載する
- [ ] API シグネチャ、使用例、エラーハンドリング、エッジケースを記載する
- [ ] 設定可能なパラメータ、定数、実行コマンド、検証コマンドを一覧化する

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | spec sync 提案根拠 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | spec sync 提案根拠 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | spec sync 提案根拠 |
| 必須 | doc/02-application-implementation/README.md | 同 Wave sync |
| 参考 | outputs/phase-09/leak-test-report.md | leak 結果 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | changelog を PR 本文に活用 |
| 04b / 04c | 同 Wave sync の確定 |
| 06a | implementation-guide.md を web 側 fetch 実装の入力に |

## 多角的チェック観点（不変条件マッピング）

- #2（consent キー）— implementation-guide で「`publicConsent='consented'` のみを 1 箇所で表現」を必須項として明示
- #3（`responseEmail`）— implementation-guide で「response 型に含めない / 検索対象から外す」を必須項として明示
- #5（apps/web → D1 直禁止）— implementation-guide で「web 側は本 4 endpoint 経由のみ」を必須項として明示
- #11（admin-managed 分離）— implementation-guide で「`adminNotes` を converter で delete、不適格は 404」を必須項として明示
- #14（schema 集約）— implementation-guide で「form-preview は schema_questions 動的構築、enum 直書き禁止」を必須項として明示

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide 作成 | 12 | pending | outputs/phase-12/implementation-guide.md |
| 2 | system spec update summary | 12 | pending | spec 03 / 04 / 12 / 01 への提案 |
| 3 | changelog | 12 | pending | 5 件 |
| 4 | unassigned task 検出 | 12 | pending | 5 件 |
| 5 | skill feedback | 12 | pending | spec 読みづらさ 3 件 |
| 6 | compliance check | 12 | pending | 7 項目 |
| 7 | 同 Wave sync | 12 | pending | 04b / 04c |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 主成果物 |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec sync 提案 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | changelog |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | unassigned 検出 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill feedback |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | compliance check |
| メタ | artifacts.json | Phase 12 を `completed` に更新 |

## 完了条件

- [ ] 必須成果物 6 種すべて生成
- [ ] 同 Wave sync が完了（命名 / helper / error type / paginationMeta）
- [ ] LOGS.md に変更要約と判定根拠を記録
- [ ] compliance check が 7 項目とも green 想定

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 全完了条件チェック
- [ ] artifacts.json の Phase 12 を `completed` に更新

## 次 Phase

- 次: 13（PR 作成）
- 引き継ぎ事項: changelog と implementation-guide を PR 本文に組み込む
- ブロック条件: 必須成果物 6 種のいずれかが欠けていれば次 Phase に進まない
