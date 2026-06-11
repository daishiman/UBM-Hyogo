# Phase 12 — Documentation Update

`implemented_local_evidence_captured`: 本ワークフローは「staging のテストアカウント TEST-MEM-01..10 を Google Form 31 stable_key の実データで埋め、公開詳細ページが全 public 項目を描画することを検証する」implementation / VISUAL_ON_EXECUTION タスクとして、local 実装・seed 再生成・focused tests・typecheck・lint まで完了した。staging D1 seed apply、authenticated staging スクリーンショット、commit / push / PR は user-gated として残す。

## 1. Status

| 項目 | 値 |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION`（visualEvidenceStatus = `staging_visual_pending_user_gate`・PNG 0） |
| relatedIssue | `null` |
| Gate-A | passed（spec review） |
| Gate-B | passed（local code / seed / focused tests / typecheck / lint） |
| Gate-C | pending（staging seed apply / authenticated staging capture / commit / push / PR は user-gated） |

## 2. Phase 12 strict 7 インデックス

本タスクの Phase 12 成果物は以下 7 ファイル。各々の責務を 1 行で示す。

| # | ファイル | 責務 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 概要・6 タスク（本ファイル含む strict 7）のインデックス（本ファイル） |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生向けの例え）+ Part 2（catalog 構造 / build-seed-sql / seed 適用 / 公開詳細 adapter の型・コマンド）+ 視覚証跡 |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/1-B/1-C 完了タスク記録・実装状況・関連タスク + Step 2 新規 I/F sync 判定（N/A） |
| 4 | `outputs/phase-12/documentation-changelog.md` | 全 Step の結果（該当なしも記録）・workflow-local 同期と global skill sync を別ブロック |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（0 件想定）・current / baseline 分離・関連タスク差分確認 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | テンプレート / ワークフロー / ドキュメント観点の skill フィードバック |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出しの準拠チェック（ok:true 相当・Phase 11 evidence は pending 分類） |

## 3. 本タスクの要点

| 観点 | 内容 |
| --- | --- |
| 真因 | TEST-MEM-06 等の seed `profile` が空で、さらに seed が `member_field_visibility` を出していなかったため、公開profileビルダーでは未設定visibilityが `member` 扱いになり publicSections が空になり得た。 |
| Lane A（主・apps/api） | 完了。`catalog.ts` の TEST-MEM-01..10 profile を全項目入力へ拡充し、`build-seed-sql.ts` が全31 `response_fields` と `member_field_visibility` を生成するよう修正。seed/cleanup/manifest を再生成し focused tests PASS。 |
| Lane B（apps/web） | 完了。production adapter/components は変更不要。fixture/spec を強化し、全public詳細項目とURLリンク10件の保持を検証。 |
| Lane C（scripts） | staging 適用手順 + 目視確認（user-gated 実行） |
| ユーザー判断（不可侵） | (1) 公開詳細ページは public 項目のみ表示（現状維持）。member/admin 項目はデータ投入のみで公開非表示。(2) 全アカウント 01-10 を全 31 項目で埋める。 |

## 4. 不変条件（全 Phase 遵守）

- 新規 API endpoint / D1 schema / migration / Google Form schema 変更なし（既存 surface のみ）。
- D1 直接アクセスは apps/api に閉じる。apps/web は `fetchPublicOrNotFound` 経由の API 取得のみ。
- OKLch トークン正本・HEX 直書き禁止・新規 primitive 禁止（Lane B）。
- visibility=public 二重防御維持。member/admin 項目を公開ページに漏らさない。
- 新規 test は `*.spec.{ts,tsx}` のみ。production seed apply は CLI で禁止。

## 5. User-Gated Boundary

staging D1 への seed apply、authenticated / staging スクリーンショット撮影、commit / push / PR はすべて user-gated（ユーザー明示承認後のみ）。production seed apply は `scripts/seed-test-accounts.sh` の CLI ガードで構造的に禁止。
