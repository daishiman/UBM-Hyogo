# Phase 12: システム仕様更新サマリ

## メタ情報
正本: `outputs/phase-12/system-spec-update-summary.md` / 上位 SSOT: `../../_shared-context.md`

| 項目 | 値 |
|------|------|
| taskType | `implementation` |
| workflow_state | `implemented_local_evidence_captured` |

## 目的
本 WF の変更（T01 fail-soft 統一 / T02 `UBM-5001` 分類 / T03 契約テスト / T04 Issue 草稿）が正本システム仕様（`docs/00-getting-started-manual/specs/*.md`）への更新を要するかを Step1-A/1-B/1-C/Step2 で判定し、同一サイクルで行った skill / requirements 台帳同期も記録する。

## Step 判定

### Step1-A: 既存正本仕様の該当箇所特定

| 正本仕様 | 該当 | 内容 |
|----------|------|------|
| `docs/00-getting-started-manual/specs/01-api-schema.md` | **非該当** | `/me` の path・response shape（zod schema）・status 体系（200/401/404/410/5xx）は不変（AC-4）。`pendingRequests: {}` は既存 schema の valid ケース（optional フィールドのみ）であり schema 変更なし |
| `docs/00-getting-started-manual/specs/02-auth.md` | **非該当** | 認証フロー・session 検証（me-session-resolver P7/P8）は無変更。session-guard の変更は「D1 例外の分類」のみで認可判定ロジック・401/403 挙動は不変 |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | **非該当** | MVP 認証方針に変更なし |
| `docs/00-getting-started-manual/specs/08-free-database.md` | **非該当** | D1 schema・構成不変（不変条件 #5・AC-7） |

### Step1-B: 新規インターフェースの仕様化要否

| 対象 | 仕様化要否 | 理由 |
|------|-----------|------|
| `UBM-5001` の `/me` 系での利用 | **不要** | `packages/shared/src/errors.ts` に**既定義**のエラーコードの利用であり、新規コード・新規 meta 定義ではない。problem+json shape（`type/title/status/detail/code/traceId`）も既存 `toClientJSON` のまま |
| `context.scope` 3 値（`me-session-guard` / `me-profile-builder` / `me-pending-requests`） | **不要** | worker ログ専用の内部識別子。client へ返る response に構造的に含まれず（`log` は `toClientJSON` 非含有）、公開 API surface・運用契約の変更ではない。定義の正本は本 WF の SSOT §9（用語集）で足りる |
| fail-soft 後の `pendingRequests: {}` | **不要** | 既存 schema の valid 値への degrade であり、新フィールド・新挙動契約の追加ではない（photoUrl / editResponseUrl の既存 fail-soft 前例と同型） |
| 新規 endpoint / 新規 export | **該当なし** | 新規 production ファイル 0・新規 endpoint 0（existing-hardening） |

### Step1-C: 影響範囲

- 影響は `apps/api` の `/me` 系（session-guard / routes/me）の**例外時の内部挙動**に閉じる。意図された status（200/401/404/410）と response shape は不変。
- 唯一の外形挙動変化は「P4（pendingRequests）の D1 例外時に 500 → 200 + `{}`」だが、これは仕様逸脱の修正（既存 fail-soft 方針への統一）であり、公開仕様の変更ではない。
- apps/web・D1 schema・Google Form 仕様・公開 endpoint surface に影響なし。

### Step2: 正本仕様更新の要否判定

**判定: 不要（N/A）。**

根拠: `/me` の status 体系・response shape・path・認証フローのいずれにも変更がなく（AC-4）、追加されるのは (a) 既定義エラーコード `UBM-5001` の利用、(b) ログ専用の内部 scope 識別子、(c) 既存 fail-soft 方針への統一、のみ。いずれも公開 API surface・運用契約・D1 構成の変更を伴わないため、`docs/00-getting-started-manual/specs/*.md` の更新は発生しない。本サイクルでも本判定は変わらない（実装が本仕様書どおりであれば更新対象が生じない）。

## 実施記録

| 項目 | 値 |
|------|------|
| Step2 判定 | **不要（N/A）** |
| 更新対象 | なし |
| 本 Phase での実施 | 正本仕様（`docs/00-getting-started-manual/specs/*.md`）は編集なし。workflow / skill feedback / aiworkflow 台帳は同一サイクルで同期済み |
| task-specification-creator 同期 | `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` / `SKILL-changelog.md` を更新 |
| aiworkflow-requirements 同期 | `quick-reference.md` / `resource-map.md` / `task-workflow-active.md` / `workflow-issue-1190-me-5xx-root-fix-artifact-inventory.md` / `SKILL-changelog.md` を更新 |
| 再判定条件 | 本サイクルで設計から逸脱（status 変更・schema 変更・新規 export）が生じた場合のみ再判定する |

## 完了条件
- [x] Step1-A/1-B/1-C/Step2 の判定を記録した。
- [x] Step2「不要（N/A）」の根拠（/me status 体系・shape 不変・既定義コード利用のみ）を記録した。

## 成果物
- `outputs/phase-12/system-spec-update-summary.md`（本ファイル）

## 参照資料
- `../../_shared-context.md` §4（AC-4/AC-7）/ §5（不変条件）
- `docs/00-getting-started-manual/specs/01-api-schema.md` / `02-auth.md` / `13-mvp-auth.md` / `08-free-database.md`
- `packages/shared/src/errors.ts`（`UBM-5001` 既定義の根拠）

## 統合テスト連携
本判定（更新 N/A）は AC-4（status 体系・shape 不変）の契約テスト（TC-4 回帰）と整合する。本サイクルで逸脱が検出された場合のみ本サマリを再判定する。
