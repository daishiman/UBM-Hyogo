# MemberProfile.attendance 実データ統合 - タスク指示書

## Canonical Status

この旧単票は legacy stub として保持する。現在の正本 workflow root は `docs/30-workflows/ut-02a-attendance-profile-integration/`。

状態: implemented / Phase 1-12 completed / Phase 13 user approval pending。実装、Phase 11 NON_VISUAL evidence、Phase 12 same-wave sync は正本 workflow root 側で管理する。

## メタ情報

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | task-imp-02a-attendance-profile-integration-001                     |
| タスク名     | MemberProfile.attendance 実データ統合                                |
| 分類         | 改善                                                                |
| 対象機能     | Member Identity / Profile / Attendance History                      |
| 優先度       | 中                                                                  |
| 見積もり規模 | 中規模                                                              |
| ステータス   | implemented (Phase 1-12 完了 / Phase 13 user-approval pending)       |
| 発見元       | Phase 12（02a タスク: parallel-member-identity-status-and-response-repository）|
| 発見日       | 2026-04-27                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

02a タスク（`parallel-member-identity-status-and-response-repository`）では、`apps/api/src/repository/_shared/builder.ts` 内の `MemberProfile` 構築ロジックにおいて、`attendance` フィールドを実データではなく空配列 `[]` で stub している。これは 02a のスコープが「会員の identity / status / response repository」に限定されており、meeting / attendance ドメインは 02b（meeting / tag queue / schema diff repository）または独立した attendance 専用タスクに委譲する設計判断によるものである。

`MemberProfile` の interface 上は `attendance: AttendanceRecord[]` を持つ前提となっているが、現在は構造のみ用意されており、実データ取得経路が未実装のままとなっている。

### 1.2 問題点・課題

- `apps/api/src/repository/_shared/builder.ts` 内で `attendance: []` の stub が放置されている
- `meeting_sessions` / `member_attendance` テーブルから出席履歴を取得する repository が存在しない
- 会員マイページおよび admin の会員詳細画面において、出席履歴 UI が常に空配列を受け取り、機能として動作しない
- N+1 クエリを誘発しないバッチ取得経路が builder に組み込まれていない

### 1.3 放置した場合の影響

- マイページ「あなたの参加履歴」セクションが永続的に空表示となり、会員体験が劣化する
- admin 詳細画面で出席状況が把握できず、運営判断（連絡対象抽出・継続率分析）の品質が下がる
- builder に stub が残り続けることで、後続タスクの担当者が「実装済み」と誤認するリスクが残る
- meeting ドメイン側の repository 設計が遅延すると、出席登録機能（02b 以降）の連動実装が困難になる

---

## 2. 何を達成するか（What）

### 2.1 目的

`MemberProfile.attendance` フィールドに `meeting_sessions` / `member_attendance` テーブルから取得した実データを供給し、マイページおよび admin の出席履歴 UI を機能させる。

### 2.2 最終ゴール

- `apps/api/src/repository/_shared/builder.ts` の `attendance: []` stub が排除され、実データが注入される
- 単一会員取得・複数会員取得のいずれの経路でも N+1 を発生させずに attendance を解決できる
- `MemberProfile.attendance` の型契約が 02a で確定済みのまま維持され、02a 既存テストが回帰しない
- マイページ／admin 詳細の出席履歴 UI が実データを描画する

### 2.3 スコープ

#### 含むもの

- `meeting_sessions` テーブルおよび `member_attendance` テーブル定義の確認・必要なら微調整
- attendance 取得用 repository（例: `AttendanceRepository.findByMemberIds(memberIds)`）の新設
- builder への attendance 注入インタフェース実装（DI もしくは ctx 経由）
- バッチ取得（`IN (?,?,...)`）による N+1 防止
- 既存 `MemberProfile` 関連テストへの attendance 実データ系ケース追加
- マイページ／admin 詳細画面で attendance を表示する経路（既存 UI 流用可）の通電確認

#### 含まないもの

- 出席登録 / 編集 / 削除といった write 系オペレーション
- meeting session 自体の CRUD（02b 側のスコープ）
- attendance 集計ダッシュボード・統計可視化
- `MemberProfile` interface の構造変更（02a で確定済みのため固定）

### 2.4 成果物

- `apps/api/src/repository/attendance/`（新設、または 02b 配下）配下の repository 実装
- `apps/api/src/repository/_shared/builder.ts` の attendance 注入修正
- 単体・統合テスト（attendance あり／なし／複数件／削除済み meeting 除外 等）
- 仕様メモ更新（02a 側 builder の境界記述を「02b で解消済み」へ更新）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 02a タスクが Phase 12 まで完了し、`MemberProfile` interface および builder の責務が確定していること
- D1 スキーマに `meeting_sessions` / `member_attendance` 相当のテーブルが定義済み、または定義予定であること
- `apps/api` の repository 層パターン（branded type `MemberId` / `ResponseId` 等）を踏襲できる状態であること

### 3.2 依存タスク

- **必須**: 02b（`parallel-meeting-tag-queue-and-schema-diff-repository`）または独立 attendance 専用タスクの先行着手
- **参照**: 02a Phase 12 成果物（`outputs/phase-12/unassigned-task-detection.md` / `implementation-guide.md`）

### 3.3 必要な知識

- Cloudflare D1 / SQLite における `IN (?,?,...)` バッチクエリと bind 制約（最大 100 程度）
- `apps/api/src/repository/_shared/builder.ts` の責務分離パターン（identity / status / response が分離されている前提）
- branded type（`MemberId`, `ResponseId`）の取り扱いと、新設する `MeetingSessionId` / `AttendanceRecordId` との型衝突回避
- Hono context 経由の DI パターン、もしくは builder への直接 inject パターンの選択

### 3.4 推奨アプローチ

1. **Interface 固定**: 02a で確定した `MemberProfile.attendance: AttendanceRecord[]` の型契約はそのまま維持する
2. **Repository 新設**: `AttendanceRepository.findByMemberIds(ids: MemberId[]): Map<MemberId, AttendanceRecord[]>` 形式でバッチ API を提供
3. **Builder 注入**: builder にオプショナル引数 `attendanceProvider?: AttendanceProvider` を追加し、未指定時のみ空配列フォールバック
4. **N+1 防止**: builder は 1 回のクエリで全対象 member の attendance をまとめて解決する
5. **型衝突回避**: `MeetingSessionId` などは独立した branded type として定義し、既存 `MemberId` / `ResponseId` の import を改変しない

---

## 4. 実行手順

### Phase構成

3 フェーズ構成: スキーマ確認 → repository 実装 → builder 統合と通電確認。

### Phase 1: スキーマと型契約の確認

#### 目的

`meeting_sessions` / `member_attendance` テーブルおよび `AttendanceRecord` 型の現状確認。

#### 手順

1. D1 マイグレーションファイル群を確認し、attendance 関連テーブルの定義状況を把握
2. `MemberProfile.attendance` および `AttendanceRecord` 型定義の所在を特定
3. 不足カラム・index がある場合はマイグレーション差分を起票
4. 02a で stub している builder.ts の該当箇所をマーキング

#### 成果物

- スキーマ差分メモ
- 型定義の所在ドキュメント

#### 完了条件

- attendance に必要なテーブル・index が D1 上で利用可能になっている

### Phase 2: AttendanceRepository 実装

#### 目的

バッチ取得可能な attendance repository を新設する。

#### 手順

1. `apps/api/src/repository/attendance.ts` に provider を追加
2. `findByMemberIds(ids: MemberId[]): Promise<Map<MemberId, AttendanceRecord[]>>` を実装
3. `IN (?,?,...)` で N+1 を回避し、bind 上限を超える場合はチャンク分割
4. branded type（`MeetingSessionId`）を定義し、既存 `MemberId` / `ResponseId` と衝突しないよう module 分離
5. 単体テストで「0 件 / 1 件 / 複数件 / 同一 member 複数 attendance / 削除済み meeting 除外」を網羅

#### 成果物

- `attendance` repository 本体 + 単体テスト

#### 完了条件

- 全テストグリーン、`pnpm typecheck` / `pnpm lint` 通過

### Phase 3: builder 統合と UI 通電

#### 目的

builder に attendance を注入し、UI まで実データが届くことを確認する。

#### 手順

1. `apps/api/src/repository/_shared/builder.ts` に `attendanceProvider` 引数を追加（未指定時は空配列）
2. profile 構築時に対象 `MemberId[]` を集約して 1 回で `findByMemberIds` を呼ぶ
3. 既存 02a テストが回帰しないことを確認
4. マイページ／admin 詳細画面で attendance が描画されることを E2E or 手動確認
5. 02a 側ドキュメントの「attendance は stub」記述を「02b/attendance タスクで解消」へ更新

#### 成果物

- builder.ts 修正
- 統合テスト追加
- ドキュメント差分

#### 完了条件

- builder に attendance 実データが流れ、UI が描画される

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `builder.ts` の `attendance: []` stub が排除されている
- [ ] `AttendanceRepository.findByMemberIds` がバッチ取得で動作する
- [ ] 単一会員・複数会員いずれの経路でも N+1 が発生しない
- [ ] マイページ／admin 詳細で出席履歴が描画される

### 品質要件

- [ ] 単体テスト・統合テストが追加され、すべてグリーン
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm build` が通過する
- [ ] branded type の衝突がなく、既存 import が回帰しない
- [ ] 02a の既存テストが回帰していない

### ドキュメント要件

- [ ] 02a Phase 12 アウトプットの未タスク検出メモが「解消済み」へ更新
- [ ] 02b（または独立タスク）の仕様書から本タスクへの参照リンクが張られている

---

## 6. 検証方法

### テストケース

- 出席 0 件の会員 → `attendance: []`
- 出席 1 件 → 1 件取得
- 出席複数件 → 開催日昇順／降順の安定性
- 同一 member が同 meeting に重複登録された場合のハンドリング
- 削除済み meeting に紐付く attendance が除外される
- 100 件超の `MemberId` 配列でチャンク分割が動作する

### 検証手順

1. ローカルで `pnpm test` / `pnpm typecheck` / `pnpm lint`
2. wrangler dev で API を起動し、profile エンドポイントを叩いて attendance が含まれることを確認
3. マイページ／admin 詳細を開き、UI 描画を目視確認
4. dev 環境にデプロイし、smoke test を実行

---

## 7. リスクと対策

| リスク                                                               | 影響度 | 発生確率 | 対策                                                                                       |
| -------------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| `MemberProfile` interface の破壊的変更が 02a に波及                  | 高     | 低       | interface は 02a で確定済みのまま固定し、本タスクは内部実装のみ修正                        |
| builder への引数追加で既存呼び出し箇所が壊れる                       | 中     | 中       | 引数を optional にしフォールバックを残す。段階的に呼び出し側を移行                          |
| N+1 クエリで D1 のバインド上限（最大 100 程度）を超過                | 中     | 中       | バッチを 80 件単位等でチャンク分割し、Promise.all でまとめる                                |
| 新設 `MeetingSessionId` branded type が既存 ID 型と衝突              | 中     | 低       | 独立 module に定義し、`Brand<'MeetingSessionId'>` として既存 `MemberId` / `ResponseId` と分離 |
| 02b の進行が遅延し本タスクの着手タイミングが見えない                  | 中     | 中       | 02b スケジュールを定例で確認し、独立 attendance タスクへの切り出しを並行検討                |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/index.md`
- `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/implementation-guide.md`
- `apps/api/src/repository/_shared/builder.ts`
- `docs/00-getting-started-manual/specs/08-free-database.md`

### 参考資料

- Cloudflare D1 limits（bind 数・クエリサイズ）
- `apps/api/src/repository/` 配下の既存 repository 実装パターン

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容 |
| -------- | ---- |
| 症状     | 02a タスク実行中、`MemberProfile.attendance` を実データで埋めるべきか stub で残すべきか判断に迷った。さらに builder に attendance をどう注入するかで「引数追加案」と「Hono ctx 経由の DI 案」のどちらを採るかで設計が止まった。加えて meeting 側の `MeetingSessionId` を導入する際、既存の branded type `MemberId` / `ResponseId` と型衝突しないかが懸念となった。 |
| 原因     | 02a のスコープが「member identity / status / response」に閉じている一方、`MemberProfile` interface 上は attendance を持つ前提で固定されてしまっており、ドメイン境界と interface 境界が一致しないことが根本原因。builder の DI 方針が repository 層でまだ確立されていなかったため、引数追加 vs ctx 注入の判断材料が少なかった。branded type についても新規 ID 型導入の前例が薄かった。 |
| 対応     | 「02a スコープ境界として meeting / attendance を 02b に委譲し、`MemberProfile.attendance` の interface だけは 02a で固定して中身は空配列 stub に倒す」という設計選択を採用。builder の注入方式は本タスクで `attendanceProvider` をオプショナル引数として追加する方針を仮採用（既存呼び出しを壊さず段階移行できるため）。`MeetingSessionId` は独立 module で `Brand<'MeetingSessionId'>` として定義し、既存の `MemberId` / `ResponseId` の import パスに触れない方針で衝突回避する。 |
| 再発防止 | (1) 「interface は 02a で確定／中身は他タスクで埋める」境界判断を 02b 含む後続タスクの仕様書冒頭に明記する。(2) builder の DI 方針を repository 層の共通ガイドラインとしてドキュメント化する。(3) 新規 branded type 導入時は専用 module を切るルールを「07-known-pitfalls」相当に追記する。 |

source evidence:
- `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/unassigned-task-detection.md`
- `apps/api/src/repository/_shared/builder.ts`

### レビュー指摘の原文（該当する場合）

```
（Phase 12 の自動検出による未タスク化のため、外部レビュー指摘原文なし）
```

### 補足事項

- 本タスクは 02b の進行状況に応じて「02b に内包する」か「独立 attendance タスクとして分離する」かを着手前に再判断する。
- `MemberProfile` interface 自体の変更が必要になった場合は、本タスクのスコープ外として別途仕様書を起票する（02a 確定済み契約の保護のため）。
