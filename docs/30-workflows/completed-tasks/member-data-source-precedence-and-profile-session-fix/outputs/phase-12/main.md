# Phase 12 — ドキュメント同期サマリ（member-data-source-precedence-and-profile-session-fix）

## 状態

| 項目 | 値 |
|------|-----|
| workflow_state | `implemented_local_runtime_pending`（apps/packages 実装とローカル検証は完了。commit/PR/D1適用/deploy/認証済み visual capture は user-gated） |
| taskType | implementation |
| visualEvidence | VISUAL（Lane D のみ。A/B/C/E は NON_VISUAL backend） |
| implementation_mode | new |
| related_issue | null（staging 観察 + ユーザー依頼起点） |
| canonical_workflow | `docs/30-workflows/completed-tasks/member-data-source-precedence-and-profile-session-fix/` |

## スコープ要約

Google Form / 回答スプレッドシートの会員情報を公開一覧 `/members`・公開詳細 `/members/[id]`・
マイページ `/profile` に正しく反映し、「初回 seed=スプレッドシート / 本人更新=Form 再回答 / 確定編集=本システム」の
**3層プレシデンス（L1>L2/L3）** で上書き事故を防ぐ。あわせて staging `/profile` の
「セッション情報を取得できませんでした」（RC-3）を修正する。全 Lane がコード変更を伴う実装仕様書。

## 根本原因（実測確定）

- **RC-1（最重要）**: Sheets 経路 `sync-sheets-to-d1.ts` の `UPSERT_COLUMNS` が `member_responses` に**存在しない列**へ INSERT → SQL レベルで全失敗。さらに表示が読む `response_fields` に一切書かない（CORR-1）。
- **RC-2**: `CONSENT_MAP` が実値 `"同意する（掲載OK）"` を持たず `public_consent=unknown` → 公開されない。
- **RC-3**: `/me` が 401/404 以外（500/transport）を返し `profile/page.tsx` 汎用エラー分岐に落ちる（CORR-2: resolver は member 不在で 401・H-1 棄却）。
- **CORR-3**: Form 経路 mapper も `X（Twitter）URL` / `その他のSNS・URL` の 2 ラベル不一致。

## Lane 結論

| Lane | 責務 | 結論 |
|------|------|------|
| A | データモデル基盤（override テーブル 0028 + provenance 列） | 実装済み |
| B | 取込是正（Sheets を response_fields 書込モデルへ合流 + ラベル/同意/enum 正規化 + import-once） | 実装済み |
| C | 表示プレシデンス純関数 `field-precedence.ts` + `PUT /admin/member-fields/:memberId` | 実装済み |
| D | Web UI（admin drawer field editor + 公開/会員 merged 表示） | 実装済み・runtime visual pending |
| E | `/profile` セッションエラー修正（web redirect fail-safe） | 実装済み |

## Step 判定（詳細は system-spec-update-summary.md）

| Step | 判定 |
|------|------|
| Step 1-A（workflow-local docs） | 完了 |
| Step 1-B（VISUAL runtime boundary・PNG 0） | 完了（pending_runtime_visual） |
| Step 1-C（system spec 反映要否） | **更新済み**（`00-overview.md` / `01-api-schema.md` / `08-free-database.md`） |
| Step 2（global skill sync） | **更新済み**（aiworkflow-requirements / task-specification-creator） |

## 視覚証跡

VISUAL（Lane D）だが canonical PNG は staging deploy + admin/member login + seeded D1/R2 状態を必要とするため本サイクルでは 0 枚。
capture 計画は `outputs/phase-11/` に `status=pending_runtime_visual` で記述。実撮影は user-gated。

## strict 7 成果物

`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` /
`unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`（本ディレクトリ）。
