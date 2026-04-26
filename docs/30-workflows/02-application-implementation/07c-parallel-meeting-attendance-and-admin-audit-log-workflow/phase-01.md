# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 7 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | なし（Wave 7 並列開始） |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

「meeting attendance の重複登録阻止」「削除済み会員除外」「admin 操作 audit log 残置」の3責務を1タスク内で確定させ、後続 Phase（設計 / テスト / 実装ランブック）が AC-1〜7 を 1:1 でカバーできる状態にする。

## 真の論点 (true issue)

- attendance 重複阻止を **DB 制約で物理的に防ぐ** か **app 層 idempotent だけにする** か。本タスクは両方（DB UNIQUE + Hono handler 409 返却）を採用し、app 層が落ちても DB が最後の防壁になる構造とする。
- audit log の actor を「admin user (Auth.js session) 由来」とするか「request signature」とするか。本タスクは Auth.js session の `adminUserId` を真値とし、未認証 / 非 admin はそもそも router で 401/403 で弾く前提（認可 gate は 05a admin gate 経由）。
- 削除済み会員除外は **API resolver で削る** か **DB view で削る** か。本タスクは API resolver 側で `member_status.isDeleted = false` を WHERE 句に強制（D1 view は無料枠運用で複雑化を招くため非採用）。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | 04c admin API | `/admin/meetings/*` endpoint 形 | attendance 操作の audit hook 仕様 |
| 上流 | 06c admin pages | `/admin/meetings` UI のクリックトリガ | attendance idempotent 保証 |
| 上流 | 02c admin notes / audit / sync repo | `audit_log` repository | hook 経由の write 経路 |
| 上流 | 03b response sync | `member_status.isDeleted` 反映 | 削除済み除外 resolver の入力 |
| 上流 | 02b meeting / queue repo | `meetings.ts` `attendance.ts` | UNIQUE constraint 動作確認 |
| 下流 | 08a contract test | attendance 409 / audit 残置の検証ポイント | (後続が consume) |
| 下流 | 08b Playwright E2E | `/admin/meetings` の操作シナリオ | (後続が consume) |

## 価値とコスト

- **初回価値**: 不変条件 #15 を DB 制約 + API gate の二重防御として固定し、admin 操作の trail を必ず残す。これにより post-release verification（09c）で `audit_log` を引けば運用変更が再現可能になる。
- **初回で払わないコスト**: audit log の閲覧 UI、外部 SIEM 連携、attendance CSV import。すべて MVP スコープ外として明示する。
- **トレードオフ**: 二重防御は冗長だが、無料枠運用かつ単一 admin user 想定では DB 制約の保険が安価で確実。

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 不変条件 #15 と運用 trail を同時に成立させるか | PASS | DB UNIQUE + 409 + audit hook の3点で attendance 整合性 + 監査が閉じる |
| 実現性 | 無料枠 D1 + Workers で可能か | PASS | 1 attendance あたり 2 writes（attendance row + audit row）で 100k writes/日に十分余裕 |
| 整合性 | 04c API / 06c UI / 02c repo と矛盾しないか | PASS | endpoint 名・table 名を引き取り、新たな名前を作らない |
| 運用性 | rollback / handoff 可能か | PASS | `audit_log` を JSON 払い出し可能、attendance 削除も audit 残るので逆操作可 |

## 実行タスク

- [ ] 上流 04c / 06c / 02c / 03b / 02b の AC を読み、引き取り点を `outputs/phase-01/main.md` に列挙
- [ ] AC-1〜7 を quantitative に再記述（重複 INSERT 件数 / 除外件数 / audit 行数）
- [ ] 真の論点と非採用案を記録（DB constraint only / app-layer only / view 利用）
- [ ] 4 条件評価の根拠を埋める
- [ ] 次 Phase へ blocker / open question を引き渡す（例: `meeting_sessions` の `endsAt` 必須化要否）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | attendance / 管理メモ責務 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | `audit_log` `member_attendance` schema |
| 必須 | doc/00-getting-started-manual/specs/00-overview.md | 不変条件 #15 #11 #7 #5 |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | Wave 7c 詳細 |
| 参考 | doc/00-getting-started-manual/specs/07-edit-delete.md | 論理削除挙動 |

## 実行手順

### ステップ 1: 上流 AC の引き取り
- 04c admin API の `/admin/meetings/*` 仕様を確認し、本タスクで実装する 3 endpoint を確定
- 02c の `audit_log` repository signature を確認

### ステップ 2: AC-1〜7 を quantitative 化
- AC-1: 同一 (sessionId, memberId) で 2 回目 INSERT → HTTP 409 + 既存 row JSON
- AC-2: candidates 配列に isDeleted=true は 0 件
- AC-3: 1 admin 操作 = 1 audit row
- AC-4: payload に before/after を JSON 文字列で含む
- AC-5: attendance 削除も audit
- AC-6: profile 直接編集 endpoint は spec 上不在
- AC-7: 二重防御を README / runbook に明記

### ステップ 3: 4 条件と handoff
- 4 条件評価を埋める
- Phase 2 へ「audit hook を Hono middleware にするか個別 handler に書くか」を open question として引き渡す

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点と非採用案を Mermaid / table へ展開 |
| Phase 4 | AC-1〜7 を verify suite の test ケースと 1:1 対応 |
| Phase 7 | AC マトリクスの軸 |
| Phase 10 | GO/NO-GO 判定の根拠 |

## 多角的チェック観点

- 不変条件 **#5**: admin 専用 endpoint であり、公開 / 会員には漏れない（理由: attendance 操作は admin gate のみ）
- 不変条件 **#7**: 論理削除会員を candidate から除外（理由: `member_status.isDeleted=true` を resolver 側で WHERE）
- 不変条件 **#11**: profile 本文編集 endpoint を作らない（理由: attendance / status / notes に責務限定）
- 不変条件 **#13**: meeting / attendance は Forms schema 外（理由: admin-managed table）
- 不変条件 **#15**: 重複不可 + 削除済み除外（理由: DB UNIQUE + API gate 二重防御）
- a11y: attendance トグルは Switch + aria-label
- 無料枠: 1 操作 2 writes、100 操作/日想定で 200 writes / 100k writes 十分余裕

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 AC 引き取り | 1 | pending | 04c / 06c / 02c / 03b / 02b |
| 2 | AC-1〜7 quantitative 化 | 1 | pending | outputs/phase-01/main.md |
| 3 | 真の論点 / 非採用案記録 | 1 | pending | open question を Phase 2 へ |
| 4 | 4 条件評価 | 1 | pending | 価値 / 実現 / 整合 / 運用 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] AC-1〜7 が quantitative に記述済み
- [ ] 真の論点 + 非採用案 + 4 条件評価が記録済み
- [ ] Phase 2 への handoff（open question）が明記

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置
- [ ] 完了条件すべてチェック
- [ ] 異常系（権限 / 無料枠 / drift）も網羅
- [ ] 次 Phase 引き継ぎ事項を記述
- [ ] artifacts.json の phase 1 status を completed に更新

## 次 Phase

- 次: Phase 2 (設計)
- 引き継ぎ: 二重防御方針、3 endpoint 仕様、audit hook をどこに置くかの open question
- ブロック条件: AC-1〜7 と 4 条件評価のいずれかが未記入なら Phase 2 着手不可
