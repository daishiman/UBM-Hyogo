# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-backoffice-api-endpoints |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed |

## 目的

実装ガイド / system spec 更新 / changelog / unassigned task 検出 / skill feedback / compliance check の 6 成果物を生成し、specs/ や README.md との同期を取る。同 Wave (04a / 04b) との命名・helper 整合を最終確認する。

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

- `/admin/dashboard` は「先生が職員室で全校生徒の状況を一覧で確認する手続き」
- `/admin/members` は「会員名簿の閲覧と検索（ただし生徒の応募用紙そのものは別保管）」
- `/admin/members/:memberId/status` は「特定生徒の公開可否を切り替えるカード」（公開 / 非公開 / 削除予定）
- `/admin/members/:memberId/notes` は「先生メモ帳」（生徒は読めない、先生だけ）
- `/admin/members/:memberId/delete` と `/restore` は「会員名簿から消す / 戻す手続き」（応募用紙は触らない）
- `/admin/tags/queue` は「先生が候補タグを承認 / 却下する受付窓口」（直接タグ書き換え不可）
- `/admin/schema/diff` は「フォームに新項目が追加された時に確認する差分メモ」
- `/admin/schema/aliases` は「新項目に既存の名前を割り当てる手続き」
- `/admin/meetings` と `/attendance` は「会合と出席記録」
- `/admin/sync/*` は「Google Form と D1 の同期ボタン」（cron 自動 + 手動 trigger）
- すべての mutation は `audit_log` に「いつ・誰が・何を・誰に」を記録

## Part 2: 技術者レベル詳細

| 項目 | 詳細 |
| --- | --- |
| task root | docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints |
| key outputs | outputs/phase-02/endpoint-spec.md, outputs/phase-04/test-matrix.md, outputs/phase-05/runbook.md, outputs/phase-07/ac-matrix.md, outputs/phase-09/free-tier.md, outputs/phase-11/manual-evidence.md |
| upstream | 02a / 02b / 02c / 03a / 03b / 01b |
| downstream | 05a / 05b / 06c / 07a / 07b / 07c / 08a |
| validation focus | 不変条件 #4, #5, #11, #12, #13, #14, #15 + AC × verify trace 完全性 |

## system spec 更新概要

- spec 11-admin-management.md の API 表に `/admin/sync/*` の 202 + 409 (SYNC_ALREADY_RUNNING) 仕様を明文化追加する提案
- spec 12-search-tags.md の tag queue API に `tag_assignment_queue` の repository 名統一仕様を提案
- spec 11-admin-management.md に「PATCH /admin/members/:memberId/profile および /tags は存在しない」を明文化追加する提案（不変条件 #11 / #13）
- spec 11-admin-management.md に attendance UNIQUE 制約 (sessionId, memberId) と DUPLICATE_ATTENDANCE response code を追記する提案

## documentation-changelog.md（生成内容）

| 種別 | 対象 | 変更概要 |
| --- | --- | --- |
| 新規 | docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/* | 15 ファイル新規（index + artifacts + phase 13 個） |
| 提案 | doc/00-getting-started-manual/specs/11-admin-management.md | sync 202+409 仕様、PATCH /profile・/tags 不在の明文化、attendance UNIQUE 制約 |
| 提案 | doc/00-getting-started-manual/specs/12-search-tags.md | repository 名統一 (tag_assignment_queue) |
| 同期 | doc/02-application-implementation/README.md | 04c の AC を README に反映 |

## unassigned-task-detection.md

- AC-9 の audit_log archive 戦略は **09b 担当**（cron worker）で本タスクスコープ外
- AC-1 の admin gate KV cache 化は **05a 改修** で発生する可能性、現状は D1 1 query で確定
- 削除済み admin の session revoke ロジックは **05a 担当**（OAuth callback 内で revoke 判定）
- sync_jobs の cron 自動 trigger は **09b 担当**（Cloudflare Cron Trigger）
- B-3 の lint rule (apps/web → D1 直接禁止) 配備は **02c 担当**

## skill-feedback-report.md

- spec 11-admin-management.md の admin endpoint 一覧と spec 12-search-tags.md の tag queue API が分散しており、admin 全体の API 表が読みづらかった → spec 11 に admin endpoint の master 表を集約する提案
- spec 11 と spec 07-edit-delete.md の「本人本文編集禁止」と「admin 本人本文編集禁止」の根拠が分散 → 集約 doc が欲しい
- spec 12 の tag queue 状態遷移 (pending → resolved | rejected) の図が無く、ステート設計が読みづらい → mermaid 化提案

## phase12-task-spec-compliance-check.md

| チェック項目 | 結果 |
| --- | --- |
| index.md の AC 全部に Phase 7 trace あり | TBD（実装時に確認） |
| 不変条件 #4, #5, #11, #12, #13, #14, #15 が phase-01 / phase-07 で言及 | TBD |
| 同 Wave 4a / 4b との命名衝突なし | TBD |
| Phase 12 必須成果物 6 個すべて存在 | TBD |
| Phase 13 が user 承認 gate を保持 | TBD |
| 全 18 endpoint が phase-02 endpoint-spec.md に zod schema 化 | TBD |

## 同 Wave sync

| 対象 | sync 内容 |
| --- | --- |
| 04a | エラーレスポンス型 `{ code, message?, issues? }` を共通 lib に確定 |
| 04b | session middleware helper 名 `consumeAuthSession` を共通化 |
| 04b | pagination helper を 04b と共有（page/pageSize/total） |

## LOGS.md 記録

- 04c 仕様書 15 ファイル新規生成
- 採用案: Alternative A（admin gate を `/admin/*` mount 単位 + 本文 PATCH 不在 + tag は queue 経由 + schema は集約 endpoint + sync は 202 非同期）
- 不変条件 #4, #11, #12, #13, #14, #15 を構造的に保証
- 残存リスク R-1〜R-5 を Phase 13 PR 説明に明記

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
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | spec sync 提案根拠 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | spec sync 提案根拠 |
| 必須 | doc/02-application-implementation/README.md | 同 Wave sync |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | changelog を PR 本文に活用 |
| 04a / 04b | 同 Wave sync の確定 |

## 多角的チェック観点（不変条件マッピング）

- #4 / #11: implementation-guide で「PATCH /admin/members/:memberId/profile を作らない」を必須項として明示
- #12: implementation-guide で「list レスポンス型に notes を含めない、detail のみ admin context として含む」を必須項として明示
- #13: implementation-guide で「PATCH /admin/members/:memberId/tags を作らない、tag は queue resolve 経由のみ」を必須項として明示
- #14: implementation-guide で「schema 操作は /admin/schema/* の 2 endpoint に閉じる」を必須項として明示
- #15: implementation-guide で「attendance は (sessionId, memberId) UNIQUE 必須」を必須項として明示

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide 作成 | 12 | completed | outputs/phase-12/implementation-guide.md |
| 2 | system spec update summary | 12 | completed | spec 11 / 12 への提案 |
| 3 | changelog | 12 | completed | 4 件 |
| 4 | unassigned task 検出 | 12 | completed | 5 件 |
| 5 | skill feedback | 12 | completed | spec 読みづらさ 3 件 |
| 6 | compliance check | 12 | completed | 6 項目 |
| 7 | 同 Wave sync | 12 | completed | 04a / 04b |

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
| メタ | artifacts.json | Phase 12 を completed に更新 |

## 完了条件

- [ ] 必須成果物 6 種すべて生成
- [ ] 同 Wave sync が完了（命名 / helper / error type）
- [ ] LOGS.md に変更要約と判定根拠を記録
- [ ] compliance check が 6 項目とも green 想定

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 12 を completed に更新

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: changelog と implementation-guide を PR 本文に組み込む
- ブロック条件: 必須成果物 6 種のいずれかが欠けていれば次 Phase に進まない
