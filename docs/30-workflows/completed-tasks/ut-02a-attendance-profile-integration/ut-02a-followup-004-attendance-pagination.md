# 大量出席履歴のページング対応 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | ut-02a-followup-004-attendance-pagination |
| タスク名 | `MemberProfile.attendance` のページング / cursor 化 |
| 分類 | 実装 / API / repository |
| 対象機能 | `AttendanceProvider.findByMemberIds` と `/me/profile` レスポンス |
| 優先度 | priority:low |
| 見積もり規模 | 小〜中規模 |
| ステータス | 未実施（実 evidence 出現後に着手） |
| 発見元 | ut-02a-attendance-profile-integration Phase 12 unassigned-task-detection |
| 発見日 | 2026-05-01 |
| 委譲先 wave | 02 系 follow-up |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

ut-02a-attendance-profile-integration では `AttendanceRecord[]` を全件返す read path を実装した。
レスポンスサイズが現実的な閾値を超えた場合のページング戦略は明示的に保留している（実 evidence 待ち）。

### 1.2 問題点・課題

- 長期会員（数百件以上の attendance）を持つユーザーで `/me/profile` レスポンスが肥大化する可能性
- Cloudflare Workers のレスポンスサイズ / CPU 制約に近づく恐れ
- UI 側でも全件描画は非現実的

### 1.3 放置した場合の影響

- 数年運用後に静かにレスポンスが重くなりユーザー体験が劣化
- D1 bind 上限 chunk + JOIN の負荷が線形増加

---

## 2. 何を達成するか（What）

### 2.1 目的

`MemberProfile.attendance` を cursor or 件数上限 + ページング API に切り出し、レスポンスサイズを制御する。

### 2.2 最終ゴール

- `/me/attendance?cursor=...&limit=...` 等のページング endpoint を新設、または `MemberProfile.attendance` を直近 N 件 + `hasMore` に変更
- `AttendanceProvider.findByMemberIds` に `limit` / `cursor` 引数を追加（後方互換あり）
- UI 側の追加読み込み導線（既存 06b で実装している場合は流用）

### 2.3 スコープ

#### 含むもの

- repository ページング引数
- 新 endpoint or 既存 endpoint 仕様変更
- UI 側の load more 導線（必要な場合）
- 単体 / 統合テスト

#### 含まないもの

- 集計 / ダッシュボード（[ut-02a-followup-002](ut-02a-followup-002-attendance-dashboard-analytics.md)）
- write path（[ut-02a-followup-001](ut-02a-followup-001-attendance-write-operations.md)）

### 2.4 成果物

- ページング対応 repository
- 新 endpoint or 仕様変更 + 03-API schema 更新
- UI 改修（必要時）
- テスト

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 実運用 evidence で「N 件超え会員が一定数存在する」ことを確認してから着手
- ut-02a-attendance-profile-integration の read path がマージ済み

### 3.2 実装手順

1. 閾値判断（held_on DESC で直近 N 件 + cursor）
2. repository 引数拡張（既存 `findByMemberIds` の戻り値型は維持し、optional limit）
3. endpoint 追加 or 既存仕様変更
4. UI 側追加読み込み（必要時）

---

## 4. 苦戦箇所【記入必須】

- 対象: `apps/api/src/repository/attendance.ts`
- 症状: ut-02a で `findByMemberIds(ids)` は `ReadonlyMap<MemberId, ReadonlyArray<AttendanceRecord>>` を返す設計。ページング追加時に「member_id 別の cursor」をどう設計するかが争点になる（複数 member 一括 + ページングは設計困難）。`/me/profile` 個人特化の場合は `findByMemberId(id, {limit, cursor})` を別関数で追加することが現実的。
- 対象: `apps/api/src/repository/_shared/builder.ts`
- 症状: builder 経由で全件 inject している箇所を「直近 N 件 + hasMore」に変える場合、`MemberProfile.attendance: AttendanceRecord[]` の interface 契約を破壊しないように `attendanceMeta?: { hasMore, nextCursor }` 等を別フィールドで追加すること。
- 参照: `docs/30-workflows/ut-02a-attendance-profile-integration/outputs/phase-12/implementation-guide.md`

---

## 5. リスクと対策

| リスク | 対策 |
| --- | --- |
| `MemberProfile` interface 破壊 | 既存 `attendance` は配列のまま、`attendanceMeta` を別 optional field で追加 |
| 複数 member 一括 + ページングの混在で複雑化 | 個人特化 endpoint を別途切り出し、bulk は全件 or 上限固定 |
| evidence なき早期実装で over-engineering | 実運用で N 件超えが観測されてから着手 |

---

## 6. 検証方法

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test attendance
mise exec -- pnpm --filter @ubm-hyogo/api test builder
```

期待結果: 既存 read path テスト regression なし、ページング新規ケース全 PASS。

---

## 7. 参考リンク

- `docs/30-workflows/ut-02a-attendance-profile-integration/index.md`
- `docs/30-workflows/ut-02a-attendance-profile-integration/outputs/phase-12/implementation-guide.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
