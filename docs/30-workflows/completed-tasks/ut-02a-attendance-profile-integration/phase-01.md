# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-attendance-profile-integration |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 2 (follow-up) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

Issue #107 の要件を `MemberProfile.attendance` 実データ統合タスクの AC-1〜10 に落とし込み、
真の論点（DI 方式選択 / branded type 衝突回避 / D1 bind 上限対応）を確定する。
02a で固定された interface を破壊せず、内部実装と repository 新設のみで attendance 実データを供給する境界を明示する。

## 真の論点 (true issue)

- **論点 1**: builder への attendance 注入方式は「`attendanceProvider` オプショナル引数追加」「Hono ctx 経由 DI」「DI container 導入」のいずれを採るか。本タスクは **オプショナル引数追加** を仮採用。理由は (1) 既存呼び出し箇所を破壊しない (2) ctx 拡張は repository 層全体の方針確定を要し本タスクのスコープを超える (3) DI container は MVP の no-magic 方針と齟齬。
- **論点 2**: `MeetingSessionId` / `AttendanceRecordId` を既存 `MemberId` / `ResponseId` と同 module に置くか別 module に置くか。本タスクは **独立 module** (`apps/api/src/repository/_shared/branded-types/meeting.ts`) に分離。理由: 既存 import path を改変せず、衝突可能性を構造的に排除するため。
- **論点 3**: D1 / SQLite の bind 上限超過時のチャンク戦略は「失敗時 retry」か「事前チャンク分割」か。本タスクは **事前チャンク分割（80 件単位）+ Promise.all** を採用。retry は重複読み込みを誘発するため不可。
- **論点 4**: 「実装済み UI への通電確認」の evidence は VISUAL screenshot を取るか NON_VISUAL（API レスポンス + UI 描画ログ）で足りるか。本タスクは **NON_VISUAL** とし、API curl evidence + UI 通電 markdown evidence で代替。理由: UI 自体は本タスクで実装しないため、API レスポンスの正しさが本質的な観測対象。
- **論点 5**: 02b 進行状況により本タスクを「02b 内包」「独立 attendance タスク」のいずれで進めるか。Phase 1 で独立タスクとして進める方針を確定した。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | 02a `parallel-member-identity-status-and-response-repository` | `MemberProfile` interface、builder の identity / status / response 部 | attendance 注入後の builder |
| 上流 | 02b `parallel-meeting-tag-queue-and-schema-diff-repository` | `meeting_sessions` / `member_attendance` schema | repository 経由の read 経路 |
| external gate | D1 schema availability | テーブル定義 / index | 不足分は schema diff で 02b 起票 |
| 下流 | mypage / admin 詳細 UI（既存） | attendance 実データ | UI 描画通電結果 |

## 価値とコスト

- **初回価値**: マイページ / admin 詳細の出席履歴 UI が機能化し、会員体験劣化と運営判断品質低下を解消。02a の stub 残置による「実装済み誤認リスク」を恒久排除。
- **初回で払わないコスト**: 出席登録 / 編集 / 削除の write 系（02b 以降）、attendance 集計ダッシュボード、UI 新規実装、`MemberProfile` interface 拡張。
- **トレードオフ**: オプショナル引数 + 空配列フォールバックを残すため、未注入呼び出しが将来再発する可能性。Phase 8 DRY 化で「default = AttendanceProvider 未指定時に warn ログ」の helper を検討。

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 出席履歴 UI が実データで機能するか | PASS | AC-1, AC-8, AC-9 で UI 通電まで観測 |
| 実現性 | 02a interface を壊さず実装可能か | PASS | builder にオプショナル引数追加で段階移行可 |
| 整合性 | 02b の meeting domain と境界整合するか | PASS | schema は 02b owner、read repository は本タスク owner |
| 運用性 | N+1 / bind 上限 / branded 型衝突を回避できるか | PASS | チャンク 80 件 + 独立 module + Map 返却 |

## 実行タスク

- [ ] AC-1〜10 を quantitative に記述（repository 1 + branded module 1 + builder 1 + tests N + evidence 4 = ファイル単位確定）
- [ ] 真の論点 5 件と非採用案を記録（`outputs/phase-01/main.md`）
- [ ] 4 条件評価の根拠を埋める
- [ ] Phase 2 への open question（chunk size 確定値、provider interface 名、`AttendanceRecord` 型の所在）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #1/#4/#5 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | API / repository 契約 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 bind 上限 |
| 必須 | docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md | 旧単票（要件源泉） |
| 必須 | apps/api/src/repository/_shared/builder.ts | 修正対象 |

## 実行手順

### ステップ 1: 旧単票 AC 引き取り
- 旧単票 `UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md` の完了条件チェックリストを 1:1 で本タスクの AC-1〜10 にマッピング。
- Issue #107 の受入条件（attendance read repository 新設 / N+1 防止 / builder 注入確定）を AC-1〜3 に対応付け。

### ステップ 2: AC quantitative 化
- AC-1〜3: repository 新設 + builder 修正 + chunk 戦略
- AC-4: test matrix（5 ケース以上）
- AC-5: 02a regression なし
- AC-6: typecheck / lint / build PASS
- AC-7: branded type 独立 module
- AC-8: API curl evidence
- AC-9: UI 通電 evidence（NON_VISUAL）
- AC-10: ドキュメント同期

### ステップ 3: 4 条件評価と handoff
- 4 条件評価記入
- Phase 2 へ open question 引き継ぎ

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | repository contract / DI 方式 / branded type module |
| Phase 4 | test matrix 設計 |
| Phase 5 | runbook の前提（schema availability） |
| Phase 7 | AC × test × 不変条件 |
| Phase 11 | API + UI 通電 evidence |

## 多角的チェック観点

- 不変条件 **#1**: 実フォーム schema 固定回避（attendance は admin-managed 側）
- 不変条件 **#4**: admin-managed data の form schema 外分離
- 不変条件 **#5**: D1 直接アクセスは apps/api に閉じる（本タスクは apps/api 内のみ）
- 02a 確定済み interface 不変（`MemberProfile.attendance: AttendanceRecord[]`）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 旧単票 AC 引き取り | 1 | pending | UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md |
| 2 | AC-1〜10 quantitative 化 | 1 | pending | repository / builder / tests / evidence |
| 3 | 真の論点記録 | 1 | pending | DI 方式 / branded 衝突 / chunk 戦略 / VISUAL 縮約 / 02b 内包判断 |
| 4 | 4 条件評価 | 1 | pending | — |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 主成果物 |
| メタ | artifacts.json | phase 1 status |

## 完了条件

- [ ] AC-1〜10 quantitative 化済み
- [ ] 真の論点 5 件 + 4 条件評価記録
- [ ] Phase 2 への open question 明記
- [ ] `artifacts.json.metadata.visualEvidence = NON_VISUAL` を確定（必須入力）

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（schema 不在 / 02b 未着手）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 1 を completed

## 次 Phase

- 次: Phase 2 (設計)
- 引き継ぎ: repository interface、builder 注入方式、branded type module 配置、chunk size、Schema Ownership 宣言
- ブロック条件: AC-1〜10 quantitative 化未完なら Phase 2 不可
