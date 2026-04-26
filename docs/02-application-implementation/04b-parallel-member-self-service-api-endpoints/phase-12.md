# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-self-service-api-endpoints |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

実装ガイド / system spec 更新 / changelog / unassigned task 検出 / skill feedback / compliance check の 6 成果物を生成し、specs/ や README.md との同期を取る。同 Wave (04a / 04c) との命名・helper 整合を最終確認する。

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

- `/me` は「学校で自分の学籍情報カードを取り出す手続き」
- `/me/profile` は「カードと一緒に登録時の応募用紙コピーを見せてもらう手続き」
- `/me/visibility-request` は「掲示板に名前を載せたくないと申請箱に紙を入れる手続き」
- `/me/delete-request` は「会員名簿から消してほしいと申請箱に紙を入れる手続き」
- 申請箱は admin 専用で、本人は申請後の中身を見られない（admin_member_notes）
- 自分の応募用紙の書き直しは Google Form という別の窓口で行う（本サイトでは編集できない）

## Part 2: 技術者レベル詳細

| 項目 | 詳細 |
| --- | --- |
| task root | doc/02-application-implementation/04b-parallel-member-self-service-api-endpoints |
| key outputs | outputs/phase-02/endpoint-spec.md, outputs/phase-04/test-matrix.md, outputs/phase-05/runbook.md, outputs/phase-07/ac-matrix.md, outputs/phase-09/free-tier.md, outputs/phase-11/manual-evidence.md |
| upstream | 02a / 02c / 03b / 01b |
| downstream | 05a / 05b / 06b / 08a |
| validation focus | 不変条件 #4, #11, #12 + AC × verify trace 完全性 |

## system spec 更新概要

- spec 07-edit-delete.md の API 表に `/me/visibility-request` と `/me/delete-request` の queue 投入仕様（admin_member_notes.type）を追記する余地が判明 → 12-Phase で `system-spec-update-summary.md` に「specs/07 への type 列追記提案」を残す
- spec 06-member-auth.md の SessionUser 型に `authGateState` を追加すべきか検討 → 04b では response 専用の `MeSessionResponse` で持つ方針、specs 側の SessionUser は変更しない
- spec 13-mvp-auth.md の MVP やらないことに「`/me/profile` の PATCH」を明文化追加する提案を残す

## documentation-changelog.md（生成内容）

| 種別 | 対象 | 変更概要 |
| --- | --- | --- |
| 新規 | doc/02-application-implementation/04b-parallel-member-self-service-api-endpoints/* | 15 ファイル新規（index + artifacts + phase 13 個） |
| 提案 | doc/00-getting-started-manual/specs/07-edit-delete.md | admin_member_notes.type 列追記の提案 |
| 提案 | doc/00-getting-started-manual/specs/13-mvp-auth.md | `/me/profile` PATCH 不在の明文化 |
| 同期 | doc/02-application-implementation/README.md | 04b の AC を README に反映 |

## unassigned-task-detection.md

- AC-3 の editResponseUrl 取得不能時の UI 案内文（"Google Form 再回答してください"等）は **06b 担当** で本タスクスコープ外
- rate limit の KV vs D1 baseline 切り替えは **02c 改修** で発生する可能性、現状は D1 baseline で確定
- 削除済み user の session revoke ロジック詳細は **05a 担当**（OAuth callback 内で revoke 判定）

## skill-feedback-report.md

- spec 07-edit-delete.md の visibility-request API の queue 投入先（admin_member_notes vs 専用テーブル）が読みづらかった → 該当 spec に「queue 投入先は admin_member_notes.type の範囲」を追記提案
- spec 13-mvp-auth.md と 07-edit-delete.md で「本文編集禁止」の根拠が分散 → 集約 doc が欲しい

## phase12-task-spec-compliance-check.md

| チェック項目 | 結果 |
| --- | --- |
| index.md の AC 全部に Phase 7 trace あり | TBD（実装時に確認） |
| 不変条件 #4, #11, #12 が phase-01 / phase-07 で言及 | TBD |
| 同 Wave 4a / 4c との命名衝突なし | TBD |
| Phase 12 必須成果物 6 個すべて存在 | TBD |
| Phase 13 が user 承認 gate を保持 | TBD |

## 同 Wave sync

| 対象 | sync 内容 |
| --- | --- |
| 04a | エラーレスポンス型 `{ code, message?, issues? }` を共通 lib に確定 |
| 04c | session middleware helper 名 `consumeAuthSession` を共通化 |

## LOGS.md 記録

- 04b 仕様書 15 ファイル新規生成
- 採用案: Alternative A（PATCH 不在 + path に :memberId 不在 + admin_member_notes.type で queue）
- 不変条件 #4, #11, #12 を構造的に保証
- 残存リスク R-1〜R-4 を Phase 13 PR 説明に明記

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
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | spec sync 提案根拠 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | spec sync 提案根拠 |
| 必須 | doc/02-application-implementation/README.md | 同 Wave sync |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | changelog を PR 本文に活用 |
| 04a / 04c | 同 Wave sync の確定 |

## 多角的チェック観点（不変条件マッピング）

- #4: implementation-guide で「PATCH /me/profile を作らない」を必須項として明示
- #11: implementation-guide で「path に :memberId を入れない」を必須項として明示
- #12: implementation-guide で「response 型に notes を含めない」を必須項として明示

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide 作成 | 12 | pending | outputs/phase-12/implementation-guide.md |
| 2 | system spec update summary | 12 | pending | spec 07 / 13 への提案 |
| 3 | changelog | 12 | pending | 4 件 |
| 4 | unassigned task 検出 | 12 | pending | 3 件 |
| 5 | skill feedback | 12 | pending | spec 読みづらさ 2 件 |
| 6 | compliance check | 12 | pending | 5 項目 |
| 7 | 同 Wave sync | 12 | pending | 04a / 04c |

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
- [ ] compliance check が 5 項目とも green 想定

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 12 を completed に更新

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: changelog と implementation-guide を PR 本文に組み込む
- ブロック条件: 必須成果物 6 種のいずれかが欠けていれば次 Phase に進まない
