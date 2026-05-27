# google-form-reflection-diagnostics

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `google-form-reflection-diagnostics` |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| workflow_state | `implemented_local_runtime_pending` |
| canonical role | Google Form 31 項目が admin / profile / public 3 経路で反映されない事象を staging 上で機械的に切り分けるための診断基盤 (Spec-A) |
| upstream prerequisite | 既存 ingest job `apps/api/src/jobs/sync-forms-responses.ts` / cron `*/15 * * * *` / 表示 3 経路 (admin / profile / public) の実装完備 |
| runtime boundary | staging deploy / runtime evidence capture / Spec-B issue filing / commit / push / PR は user-gated |

## 目的

ユーザー観察「Google Form の 31 項目が admin / profile / public 3 経路すべてで反映されていない」に対し、修復前段の事実取得層を確立する。具体的には H1 (ingest 未稼働) / H2 (本人マッチング切れ) / H3 (公開フィルタで全 hidden) / H4 (schema alias 未割当) の 4 仮説を staging 上で機械的に切り分け可能とする `/admin/diagnostics/*` API と `/admin/sync-status` UI、メンバードロワー診断タブを実装する。

修復 (H1〜H4 ごとの実コード対応) は本 Spec-A 範囲外。診断結果を踏まえて Spec-B 以降を新規ワークフロー / Issue として起票する (CONST_007 例外、Phase 1 / 8 参照)。

## Phase 構成

| Phase | ファイル | 状態 |
| --- | --- | --- |
| 1 | `phase-01-requirements.md` | spec_created |
| 2 | `phase-02-architecture.md` | spec_created |
| 3 | `phase-03-task-breakdown.md` | spec_created |
| 4 | `phase-04-data-contract.md` | spec_created |
| 5 | `phase-05-implementation-guide.md` | spec_created |
| 6 | `phase-06-test-strategy.md` | spec_created |
| 7 | `phase-07-quality-gates.md` | spec_created |
| 8 | `phase-08-dod.md` | spec_created |
| 9 | `phase-09-risks.md` | spec_created |
| 10 | `phase-10-local-verification.md` | spec_created |
| 11 | `phase-11-evidence-inventory.md` | runtime_pending |
| 12 | `phase-12-compliance.md` | spec_created |
| 13 | `phase-13-commit-pr-draft.md` | pending_user_approval |

## Canonical Outputs

| 種別 | パス |
| --- | --- |
| root artifacts | `artifacts.json` |
| output artifacts mirror | `outputs/artifacts.json` |
| Phase 12 compliance | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 仮説 (H1-H4)

| ID | 仮説 | 想定 root cause | 主な diagnostic signal |
| --- | --- | --- | --- |
| H1 | ingest 未稼働 | cron 未起動 / secrets 不足 / Forms API 401 / lock 解放漏れ | `sync_jobs` 直近行が 0 件 or `status='failed'` 連続 / secrets readiness `false` |
| H2 | 本人マッチング切れ | `member_identities` の email / external_id alias 不一致 | profile 経路で本人 row 取得 0 件 / `responseEmail` ↔ session email 不一致 |
| H3 | 公開フィルタで全 hidden | `publicConsent=false` / `published=false` が全件 | public 経路 visible 件数 0 / 全件 hidden ratio = 100% |
| H4 | schema alias 未割当 | 31 項目 question_id ↔ field alias mapping が drift | `field_alias_pending_count > 0` / 表示側で 31 項目中 N 項目が null |

## User-Gated Operations

- staging への deploy と /admin/sync-status の実アクセス
- `outputs/phase-11/` の実ログ / screenshot / JSON snapshot evidence 取得
- Spec-B (H1〜H4 修復) の新規 Issue / ワークフロー発行
- commit / push / PR 作成
