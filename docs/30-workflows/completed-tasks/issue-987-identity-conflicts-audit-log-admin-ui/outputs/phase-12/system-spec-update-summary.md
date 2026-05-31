# System Spec Update Summary（Issue #987 dismiss 監査ログ対称化）

本サイクルは `implemented_local_evidence_captured`。dismiss 監査ログ実装、focused D1 Vitest、aiworkflow 正本同期を同一サイクルで反映した。

## Step 1: 完了タスクの記録

### Step 1-A: 完了タスク記録方針

本タスクは「identity-conflicts の dismiss 操作を merge と対称化し、`audit_log` に `action='identity.dismiss'` を記録する」実装タスクである。本サイクルでは Phase 1-13 仕様書、実コード、focused tests、正本同期までを完了タスクとして記録する。

### Step 1-B: 実装状況

| 区分 | 状態 |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| コード実装 | 完了（`dismissIdentityConflict` audit_log append、route actorAdminEmail 配線、focused tests 追加） |
| migration | 不要（`audit_log` は既存） |
| UI | 変更なし（`/admin/audit` 既存活用） |

### Step 1-C: 関連タスクテーブル

| 関連 | 内容 | 状態 |
| --- | --- | --- |
| Issue #987 | identity-conflicts merge/dismiss 監査ログ admin UI 表示（本タスクの根拠 Issue） | CLOSED（最新コードへ最適化のうえ参照のみ。本タスクで再 OPEN しない） |
| 親サイクル `admin-identity-conflicts-prototype-alignment-and-404-fix` | FU-AIDC-002 起票元 | completed-tasks 配下 |
| Issue #989 | manualMergeReason schema 拡張（merge reason 入力 UX） | 関連 followup（本タスクとは独立。dismiss 監査記録の根本解決には不要） |

## Step 2: 新規インターフェース判定

### 判定対象

本タスクは以下 2 点の契約追加を含む。

1. **`dismissIdentityConflict()` のシグネチャ変更**: `actorAdminEmail: string | null` 引数を追加。戻り値に `dismissalId` を追加（`{ dismissedAt }` の外形互換は維持）。
2. **新 audit action 値 `identity.dismiss`**: `audit_log.action` の語彙に追加（merge の `identity.merge` と対称）。

### 判定結果

| 観点 | 判定 |
| --- | --- |
| API endpoint surface 変更 | なし（`POST /identity-conflicts/:id/dismiss` の外形不変。request body / status / 戻り値外形は維持） |
| D1 schema 変更 | なし（`audit_log` 既存。新規列・新規テーブルなし） |
| 監査契約の追加 | あり（`audit_log.action` に `identity.dismiss` という新値が出現する） |
| repository 内部シグネチャ変更 | あり（`dismissIdentityConflict` に `actorAdminEmail` 追加） |

→ **監査契約（audit action の語彙）の追加に該当する**ため、関連 system spec への契約記述反映が必要。

### 反映先の判定と記録

| 反映先候補 | 反映要否 | 内容 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/`（auth / audit / database 系） | 該当なし | 本タスクでは `.claude/skills/aiworkflow-requirements` 正本を更新対象とし、manual specs は既存 `/admin/audit` 契約の範囲内 |
| aiworkflow-requirements の audit/database 系 references | 反映済み | `api-endpoints.md` / `task-workflow-active.md` / indexes / artifact inventory に merge/dismiss の audit_log 記録対称性を同期 |
| `dismissIdentityConflict` シグネチャ | 要（コード側 spec） | `actorAdminEmail: string \| null` 追加。before_json / after_json の型を契約として固定 |

### 新 audit action 契約（明記）

- 値: `identity.dismiss`（`AuditAction` brand = `apps/api/src/repository/_shared/brand.ts:27`）。
- target_type: `member`、target_id: candidate target member id。
- before_json: `{ sourceMemberId, targetMemberId }`。
- after_json: `{ dismissalId, dismissedAt }`。自由記述 reason は `identity_conflict_dismissals.reason` 側で redaction 済み保存し、`audit_log.after_json` には含めない。
- 再 dismiss 時は `identity_conflict_dismissals.dismissal_id` も最新 UUID に更新し、最新 audit payload の `dismissalId` と永続行を一致させる。
- source / target member 不在時は 404 `MEMBER_NOT_FOUND` とし、dismissal / audit_log を書かない。
- 既存 `identity.merge` と同じ列順・brand 付与で記録する。

### 注記

本サイクルで上記 system spec への実反映を完了した。staging runtime evidence、commit、push、PR は Phase 13 の user-gated 境界に残す。
