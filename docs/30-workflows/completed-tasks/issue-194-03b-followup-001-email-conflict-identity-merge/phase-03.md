# Phase 3: 設計レビュー — issue-194-03b-followup-001-email-conflict-identity-merge

## 実装区分

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-194-03b-followup-001-email-conflict-identity-merge |
| phase | 3 / 13 |
| wave | 04c-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| 更新日 | 2026-05-03 |
| taskType | implementation-spec / implemented |

## 目的

代替案を比較評価し、Phase 2 の設計を PASS / MINOR / MAJOR で判定する。実装後の差分（initial spec
からの逸脱）に対しても ADR 形式で決定記録を残す。

## 実行タスク

1. 判定基準（第一段階）の代替案を比較する。
2. merge transaction の構成代替案を比較する。
3. UI 確認段階の代替案を比較する。
4. 実装時に発生した設計差分（generic proxy 流用 / Row 内 stage state 統合 / sync_jobs 入力源変更）の決定記録を残す。

## 多角的チェック観点

- #1 / #3 / #5 / #11 / #13 を unbroken で維持
- 誤 merge は不可逆に近いため、UI 確認段階は冗長側に倒す
- 第一段階の判定基準は「見逃し許容、誤検出抑止」に倒す

## サブタスク管理

- [x] refs を確認する
- [x] 代替案 PASS-MINOR-MAJOR 判定を付与する
- [x] 不変条件 touch 検証を再実施する
- [x] outputs/phase-03/main.md を作成する

## 成果物

- outputs/phase-03/main.md

## 完了条件

- 各代替案に PASS / MINOR / MAJOR が付与され採用方針が明示されている
- 設計差分が ADR として記録され、AC を破らないことが説明されている
- 不変条件 touch 検証が表として残っている

## 追加セクション（Phase 3）

### 代替案

#### 判定基準（第一段階）

1. **`name` 完全一致 AND `affiliation` 完全一致 / `trim` + `NFKC` 正規化のみ許容**（採用）
2. `name` + `phone` 一致: 電話番号は更新頻度が低い半面、PII 取扱（#3）が増える
3. `name` のみ: 同姓同名で誤検出多発、不採用

#### merge transaction

1. **D1 transactional batch（`db.batch`）で `identity_aliases` + `identity_merge_audit` + `audit_log` の 3 insert を atomic に記録し、batch 未対応環境は失敗させる**（採用）
2. 2 段階: source archive → 後続 batch で raw response 付替: 中間 state が公開され #11 / #5 違反リスク、不採用
3. 物理削除を伴う統合: 監査追跡不能、不採用

#### UI 確認段階

1. **二段階確認（候補表示 → `merge-confirm` ステージ → `merge-final` ステージで reason 入力 → 実行）**（採用）
2. ワンクリック merge: 誤操作リスク高、不採用
3. 三段階確認 + 24h 遅延実行: 運用負荷高すぎ、現段階では不採用

#### conflict row の永続化方針

1. **永続的 conflict row を持たず `${source}__${target}` を動的 conflictId として生成**（採用）
2. 専用 `identity_conflicts` テーブルを作る: 検出ロジックと永続化のニ重管理になり drift リスク、不採用

#### web → api 接続経路

1. **既存 generic proxy `apps/web/app/api/admin/[...path]/route.ts` を流用**（採用）
2. 専用 proxy ファイル群を新設: ファイル数増・generic proxy と重複、不採用

### PASS-MINOR-MAJOR 判定

| 領域 | 案 | 判定 | 理由 |
| --- | --- | --- | --- |
| 判定基準 | 案 1 | PASS | 完全一致のみで誤検出抑止、第二段階拡張余地あり |
| 判定基準 | 案 2 | MINOR | PII 増のため第二段階移行時に再評価 |
| 判定基準 | 案 3 | MAJOR | 同姓同名誤検出 |
| merge tx | 案 1 | PASS | 現行 schema と整合し raw response を移動しない / 3 insert 同一 batch で audit 欠落を防ぐ |
| merge tx | 案 2 | MAJOR | 中間 state 露出 |
| merge tx | 案 3 | MAJOR | 監査不能 |
| UI | 案 1 | PASS | 不可逆操作に対する admin 二段階確認 |
| UI | 案 2 | MAJOR | 誤操作リスク |
| UI | 案 3 | MINOR | 過剰、将来オプション |
| conflict row | 案 1 | PASS | 専用 PK 設計不要 / 検出と表示の単一情報源化 |
| conflict row | 案 2 | MINOR | drift リスクで保守コスト過多 |
| proxy | 案 1 | PASS | DRY / 4本のファイル新設不要 |
| proxy | 案 2 | MINOR | 過剰なファイル分割 |

### 不変条件 touch 検証

| 不変条件 | 状態 | 根拠 |
| --- | --- | --- |
| #1 schema 固定回避 | OK | `identity_aliases` / `identity_merge_audit` / `identity_conflict_dismissals` は admin-managed 独立 3 テーブル。Google Form schema 外。 |
| #3 PII 取扱 | OK | API 応答で `maskResponseEmail()` を使い `u***@example.com` 形式に。merge reason は `[redacted]` 置換（email + 電話 regex）。 |
| #5 D1 直アクセス apps/api 限定 | OK | apps/web は generic proxy `[...path]` 経由のみ。Server Component は `fetchAdmin` server-fetch を使用。 |
| #11 管理者も他人本文を直接編集しない | OK | merge は `identity_aliases` / `identity_merge_audit` への append のみ。`member_responses.*` / `response_fields.*` / `member_status.*` への UPDATE 一切なし。 |
| #13 admin audit logging | OK | `identity_merge_audit` への独立永続化に加え、`audit_log` にも `identity.merge` を append。dismiss は `identity_conflict_dismissals` に永続化。 |

### ADR (実装時に発生した設計差分)

#### ADR-01: conflictId は動的生成、永続 conflict row なし
- **決定**: `conflictId = "${source}__${target}"` を動的生成し、専用テーブルを作らない。
- **理由**: 検出ロジックと永続化のニ重管理を避け、新たな PK 設計を加えずに済む。
- **影響**: route 側で `parseConflictId()` の null ガードが必須。実装済。

#### ADR-02: list 入力源を `sync_jobs.error_json` から `member_identities × response_fields` に変更
- **決定**: `sync_jobs.error_json` に source memberId が含まれないため、`member_identities` を全走査して name+affiliation で交差比較する。`syncJobId` は最新 EMAIL_CONFLICT job_id をメタとして単一値で付与。
- **理由**: 実機データ構造との整合性。
- **影響**: AC「`EMAIL_CONFLICT` を起点とした候補一覧」は最新 EMAIL_CONFLICT 発生条件下で同等の結果集合を返すため維持。

#### ADR-03: 二段階確認モーダルを別ファイルにせず Row 内 stage state に統合
- **決定**: `IdentityConflictRow` 内で `stage: "idle" | "merge-confirm" | "merge-final" | "dismiss"` を保持し、別 dialog component を作らない。
- **理由**: コンポーネント数削減 / state を単一の Client Component に閉じる。
- **影響**: 二段階確認 / 別人マークの AC を満たしつつコード量を削減。

#### ADR-04: web → api proxy は generic `[...path]` を流用
- **決定**: `/admin/identity-conflicts` 系の専用 proxy ファイル群を作成しない。
- **理由**: DRY / 既存 generic proxy が同等の cookie forward / role gate を提供。
- **影響**: ファイル数を 4 本削減。

#### ADR-05: `db.batch` 必須化
- **決定**: `db.batch` 未対応環境では `MergeAtomicBatchUnavailable` として失敗させ、逐次 `run()` fallback は持たない。
- **理由**: merge は `identity_aliases` / `identity_merge_audit` / `audit_log` の 3 insert が同時成功することを契約にする。
- **影響**: test / production とも atomic contract が同一になる。mock は batch 対応 D1 fixture を使う。

### blocker / approval gate

- 実機 D1 への migration apply は本タスク外（spec の方針通り runtime apply は別段階）
- production deploy / commit / PR は user 指示まで保留

## タスク100%実行確認

- [x] この Phase の必須セクションがすべて埋まっている
- [x] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [x] 実装後も deploy / commit / push / PR は実行していない

## 次 Phase への引き渡し

Phase 4 へ、AC、blocker、evidence path、approval gate を渡す。
