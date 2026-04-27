# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | meeting-tag-queue-and-schema-diff-repository |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 2 |
| 下流 | Phase 4 |
| 状態 | pending |

## 目的

Phase 2 の設計に対し alternative 4 案を検討し PASS-MINOR-MAJOR 判定。特に **`tagQueue.transitionStatus` の状態遷移実装** と **attendance 重複防止の責務配置** について比較する。

## alternative 案

### 案 A: 採用案 = 「7 repository + 状態 enum + DB PK 制約」

- **構造**: ファイル 7 + `tagQueue` の `ALLOWED_TRANSITIONS` 定数 + `member_attendance` PK 制約で重複防止
- **メリット**:
  - 状態遷移ロジックが TS 側で型安全
  - 重複防止が DB 側で強制
  - 削除済み除外を `attendance.listAttendableMembers` の JOIN で保証
- **デメリット**:
  - status enum の TS / SQL 双方管理（drift リスク → test で防御）

### 案 B: 状態遷移を application service 層へ

- **構造**: `tagQueue.ts` には CRUD のみ、状態遷移は `apps/api/src/service/tagQueueService.ts`
- **メリット**: 関心の分離
- **デメリット**:
  - 07a workflow が薄くなり service 層が必須に
  - repository 層から「状態を不正に書き換え可能」になり不変条件 #13 が緩む

### 案 C: 重複防止をアプリ層 if 文で

- **構造**: `addAttendance` 内で `findAttendance(mid, sid)` を事前に呼び、重複なら return error
- **メリット**: TS の if 文だけで完結
- **デメリット**:
  - race condition で同時 INSERT が通る
  - 不変条件 #15 を構造で守れない（DB 制約の方が強い）

### 案 D: tag_definitions に CRUD API を提供

- **構造**: `tagDefinitions.ts` に `create/update/delete` を提供
- **メリット**: 将来の運用拡張に備える
- **デメリット**:
  - 不変条件 #13 違反リスク（`memberTags` 直接編集の入口になる）
  - MVP scope 外
- **判定**: 即却下

## トレードオフ比較表

| 観点 | 案 A | 案 B | 案 C | 案 D |
| --- | --- | --- | --- | --- |
| 不変条件 #13 (tag 直接編集禁止) | ◎ | △ | ◎ | ✗ |
| 不変条件 #14 (schema 集約) | ◎ | ◎ | ◎ | ◎ |
| 不変条件 #15 (attendance 重複 + 削除済み) | ◎ | ◎ | △ | ○ |
| 不変条件 #5 (D1 boundary) | ◎ | ◎ | ◎ | ◎ |
| 並列着手性 | ◎ | △ | ○ | ◎ |
| race condition 耐性 | ◎ | ○ | ✗ | ○ |
| 学習コスト | ○ | △ | ◎ | ○ |
| 採否 | **採用** | 不採 | 不採 | 却下 |

## PASS-MINOR-MAJOR 判定

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 全体設計 | PASS | 案 A は不変条件 #13/#14/#15/#5 を構造で守る |
| race condition | PASS | DB PK 制約で並列 INSERT も安全 |
| 並列着手性 | PASS | 03a / 04c / 07a/b/c が同 interface を再利用 |
| status enum drift | MINOR | TS / SQL 双方管理だが test で防御 |
| 学習コスト | MINOR | `transitionStatus` の API 設計を 07a に伝える必要 |
| 重大 blocker | なし | MAJOR 該当なし |

総合判定: **PASS（MINOR 2 件は許容、Phase 4 へ）**

## レビューチェックリスト

- [x] 不変条件 #5 boundary
- [x] 不変条件 #13 tag 直接編集禁止
- [x] 不変条件 #14 schema 集約
- [x] 不変条件 #15 attendance 重複 + 削除済み
- [x] race condition 安全
- [x] 02a / 02c との相互 import ゼロ
- [x] 03a / 04c / 07a/b/c が並列着手可能

## 実行タスク

1. 4 案を `outputs/phase-03/alternatives.md` に
2. 比較表 + PASS-MINOR-MAJOR 判定を `outputs/phase-03/main.md` に
3. MINOR 項目を Phase 5 申し送り
4. GO マーク

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 2 outputs | レビュー対象 |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | Wave 2b |

## 統合テスト連携

| 連携先 | 連携 |
| --- | --- |
| Phase 4 | verify suite |
| Phase 5 | MINOR 反映 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 案 A 採用 | #13 #14 #15 #5 | 構造で守る |
| 案 D 即却下 | #13 | tag 直接編集禁止 |
| 案 C 不採用 | #15 | race condition 耐性 |

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 4 案文書化 | pending |
| 2 | 比較表 | pending |
| 3 | 判定 | pending |
| 4 | 採用理由 | pending |
| 5 | MINOR 申し送り | pending |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-03/main.md | 判定 + 採用理由 |
| outputs/phase-03/alternatives.md | 4 案 |

## 完了条件

- [ ] 4 案文書化
- [ ] PASS 判定
- [ ] MINOR 申し送り

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 completed
- [ ] outputs/phase-03/* 配置済み
- [ ] artifacts.json の Phase 3 を completed

## 次 Phase

- 次: Phase 4
- 引き継ぎ事項: 採用案 A + MINOR 2 件
- ブロック条件: PASS でなければ Phase 2 戻し
