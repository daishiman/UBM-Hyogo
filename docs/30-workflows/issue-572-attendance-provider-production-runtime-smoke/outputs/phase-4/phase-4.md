# Phase 4: タスク仕様書記述（粒度確定 / 仕様書間依存）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | spec-confirmed |
| 親 Issue | #572（CLOSED） |
| 関連 Issue | #531 / #371 / #571（すべて CLOSED） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 仕様書記述（meta-spec） |

> 本ドキュメントはコード実装を行わない。Phase 5/6/7 が参照する仕様書粒度・依存関係・スコープ境界を確定するメタ仕様である。実装手順は Phase 6 outputs に記述する。

## 目的

production で `/admin/members*` および `/me*` の read-only GET smoke を PASS させ、`issue-371` の `workflow_state` を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から `PASS_RUNTIME_VERIFIED` / `completed` に昇格するために必要な仕様書粒度を確定する。本 Phase は Phase 5（実装計画）/ Phase 6（実装手順）/ Phase 7（単体テスト）の入口として、依存ファイル・スコープ境界・正本順位を固定する。

## 仕様書粒度の 3 分割

| Phase | 役割 | 担当する確定事項 |
| --- | --- | --- |
| Phase 5 | 実装計画策定 | 4 ワークストリーム（WS-1..4）の前後依存 / evidence 取得順序 |
| Phase 6 | 実装手順確定 | 変更対象ファイル一覧 / 関数・環境変数・引数のシグネチャ / 差分方針 |
| Phase 7 | 単体テスト仕様 | 追加テストファイル / ケース / 合成サンプル方針 |

> 3 Phase はいずれも spec の固定であり、実装は本サイクルで最小runner・redaction・runbookに反映済み。本サイクルの実装は Phase 6 の差分方針と Phase 7 のテストケースに対応済み。

## 仕様書間依存

```
Phase 4 (本 Phase: meta-spec)
  └─ Phase 5 (4 ワークストリーム計画)
       └─ Phase 6 (差分方針確定)
            └─ Phase 7 (単体テスト仕様)
                 └─ Phase 11 (production 本実行 / evidence 取得)
```

- Phase 7 の test 緑が Phase 6 実装の前提（test-first 設計）。
- Phase 6 の実装が完了してから Phase 11 で production 本実行 evidence を取得する。
- Phase 11 完遂後に親 Issue #371 の `workflow_state` 昇格 PR が作成可能になる。

## スコープ境界（含む / 含まない）

### 含むもの

- production 環境の `/admin/members*` および `/me*` read-only GET smoke スクリプトの仕様確定
- redact filter（`scripts/lib/redaction.sh`）の cf-* token / OAuth secret / email / fullName / profile body 実値除外パターン拡張仕様
- session cookie / Bearer token を shell 履歴・プロセス引数・evidence に残さない注入手順仕様（runbook 化）
- staging vs production の wrangler binding diff 検証手順仕様
- 親 Issue #371 の `workflow_state` 昇格 PR 仕様

### 含まないもの

- write 系（POST / PATCH / DELETE）endpoint の smoke
- 新規 endpoint 追加・既存 endpoint の仕様変更
- attendance 取得ロジックの再実装（`issue-371` で完了済み）
- `apps/web` 側 UI の動作確認
- Sentry / Slack 連携の評価（09b 系の別タスクで実施）

## 変更対象領域（4 領域に限定）

| 領域 | パス | 変更種別 |
| --- | --- | --- |
| smoke スクリプト | `apps/api/scripts/runtime-smoke/` | 新規 |
| redact filter 拡張 | `scripts/lib/redaction.sh` / `tests/unit/redaction.test.sh` | 既存編集 |
| runbook | `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` | 新規 |
| 親タスク state 更新 | `docs/30-workflows/issue-371-...//outputs/phase-12/main.md` | 既存編集 |

## DI-bound evidence 契約

```
.attendance | type == "array"
```

- 取得対象: `/admin/members/:memberId` および `/me/profile`
- evidence は **summary-only**: session cookie / Bearer / cf-* token / OAuth secret / email / fullName / profile body 実値を除外
- 配列長 / status code / endpoint path / commit hash / timestamp のみ記録

## 正本順位（衝突時の優先度）

1. Issue #572 本文（CLOSED 状態の最終仕様）
2. `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-{4,5,6,7,11}/`
3. `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/unassigned-task/runtime-smoke-attendance-provider-migration.md`（staging 用前駆指示書）
4. `apps/api/src/routes/**` の現行 endpoint surface

## 苦戦項目（Issue #572 ヘッダから踏襲）

| ID | 苦戦内容 | 対策 Phase |
| --- | --- | --- |
| ST-1 | wrangler binding 差分（staging/production） | Phase 5 WS-4 / Phase 7 wrangler-binding-parse test |
| ST-2 | shell 履歴漏洩（cookie / token） | Phase 5 WS-3 / Phase 6 session 注入手順 |
| ST-3 | API URL 取り違え（staging URL を production と誤認） | Phase 6 環境変数命名 / Phase 11 user 承認ゲート |
| ST-4 | redact filter production 偽陰性 | Phase 6 redact 拡張 / Phase 7 unit test 緑化 |

## DoD（完了定義）

- [ ] Phase 5/6/7 の 3 分割スコープが確定
- [ ] 4 ワークストリームの存在と Phase 5 への委譲が明記
- [ ] DI-bound evidence 契約（`.attendance | type == "array"`）が双方 endpoint で確定
- [ ] 変更対象が 4 領域に限定されることが明記
- [ ] 苦戦項目 4 件が Phase 5/6/7 のいずれかで mitigation 計画化されている
- [ ] 本 Phase 群はコード実装を行わない（実装手順は記述する）方針が冒頭で明示

## 次 Phase の前提条件

Phase 5 で 4 ワークストリームの実装ステップ・前後依存・evidence 取得順序を確定する。
