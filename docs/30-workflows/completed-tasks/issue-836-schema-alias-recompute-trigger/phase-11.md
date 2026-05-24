# Phase 11: 手動テスト（VISUAL evidence + runtime）

[実装区分: 実装仕様書]

> 目的: recompute 機能の runtime 受入（RAC-1 / RAC-2 / RAC-3）を 3 層評価（Semantic / Visual / AI UX）の枠組みで実行し、screenshot を **canonical 命名** で取得する。FB-VISUAL-CAP-001 / FB-LLM-MOD-05-001 に従い、TC 番号は metadata の `tc` フィールドのみで管理し、ファイル名へ TC 番号を埋め込まない。
> taskType: `implementation`
> visualEvidence: `VISUAL`（admin `/admin/schema` SchemaDiffPanel に recompute 実行ボタン + status バッジを新設するため screen diff あり）
> screenshot mode: `VISUAL`（FB-W1-02b-1）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 名称 | 手動テスト（VISUAL evidence + migration apply + recompute runtime） |
| 依存 | phase-05〜10（実装〜最終レビュー完了） |
| 成果物 | 本ファイル + outputs/phase-11/{visual-baseline,migration-apply,recompute-runtime}.md |
| 状態 | runtime_pending |
| RAC | RAC-1（migration apply）/ RAC-2（resolve→rollback→recompute runtime）/ RAC-3（visual baseline） |

## user-gated 注記（最重要）

本 Phase の runtime 操作は **すべて user 明示承認後のみ実行可能**。Claude Code は手順を spec 化するだけで、以下を **自律実行しない**:

- staging / production への migration apply（`bash scripts/cf.sh d1 migrations apply`）
- staging `/admin/schema` での実 admin actor 操作（dummy alias の resolve / rollback / recompute）
- D1 への SQL 実行（`PRAGMA` / `SELECT` 含む read-only であっても本番系は user-gated）

production apply は dev→main リリース時に別途 user-gated（CLAUDE.md ブランチ戦略）。secret / token / D1 binding 実値は evidence MD に一切記載しない（不変条件 9）。Cloudflare 操作は必ず `scripts/cf.sh` 経由で記述し `wrangler` を直接呼ばない（CLAUDE.md）。

---

## 1. テストケース（RAC → TC 展開）

| TC | 紐づく RAC | 概要 | 証跡ファイル | 実行区分 |
| --- | --- | --- | --- | --- |
| TC-RT-01 | RAC-1 | staging へ `0020_schema_alias_recompute_jobs.sql` を apply し、`PRAGMA table_info` / `PRAGMA index_list` でカラム + UNIQUE index を確認 | `outputs/phase-11/migration-apply.md` | user-gated |
| TC-RT-02 | RAC-2 | staging `/admin/schema` で dummy alias を resolve → rollback → recompute。`audit_log` 3 行 / `response_fields` の `__extra__:{qid}` 復帰 / job `completed` を確認 | `outputs/phase-11/recompute-runtime.md` | user-gated |
| TC-RT-03 | RAC-2 | 同一 alias で recompute を 2 回実行し、`response_fields` が不変（idempotency runtime 確認） | `outputs/phase-11/recompute-runtime.md` | user-gated |
| TC-VIS-01 | RAC-3 | SchemaDiffPanel recompute UI（idle / running / completed / failed）の Playwright visual baseline を追加 | `outputs/phase-11/visual-baseline.md` | local（baseline 撮影） |

各 TC の詳細手順・確認 SQL・期待 shape は上記証跡ファイルへ展開する。本ファイルは導線と評価枠組みの正本。

---

## 2. screenshot canonical 命名（FB-VISUAL-CAP-001 / FB-LLM-MOD-05-001）

命名規約: `<component>-<state>.png`。`<component>` は `schema-diff-panel-recompute`、`<state>` は UI 状態機械（`outputs/phase-02/ui-state-machine.md`）の status に対応。**TC 番号はファイル名に含めない**（metadata の `tc` フィールドのみで管理）。

| # | 状態 | canonical filename | 取得元 data-role |
| --- | --- | --- | --- |
| S-01 | idle（recompute 未実行・「再集計を実行」ボタン表示） | `schema-diff-panel-recompute-idle.png` | `recompute-action` / `recompute-trigger` |
| S-02 | running（CPU budget 跨ぎ・「再集計を続行」ボタン + 進行バッジ） | `schema-diff-panel-recompute-running.png` | `recompute-status[data-status="running"]` |
| S-03 | completed（「再集計済み」バッジ + processedCount） | `schema-diff-panel-recompute-completed.png` | `recompute-status[data-status="completed"]` |
| S-04 | failed（「失敗」バッジ + lastError + 「再試行」ボタン） | `schema-diff-panel-recompute-failed.png` | `recompute-status[data-status="failed"]` / `recompute-error` |

これらの canonical 名は以下 4 か所で完全一致させる:

1. 実画像ファイル名（`outputs/phase-11/screenshots/<filename>` または visual-full snapshot dir）
2. `outputs/phase-11/visual-baseline.md`（撮影対象表）
3. `outputs/phase-11/phase11-capture-metadata.json`（生成時）
4. `outputs/phase-12/implementation-guide.md`（evidence 参照表）

---

## 3. capture metadata（`outputs/phase-11/phase11-capture-metadata.json`・実行時生成）

```json
{
  "taskId": "issue-836-schema-alias-recompute-trigger",
  "mode": "VISUAL",
  "captureDate": "<YYYY-MM-DD>",
  "screenshots": [
    { "id": "S-01", "tc": "TC-VIS-01", "file": "schema-diff-panel-recompute-idle.png", "route": "/admin/schema", "viewport": "1280x800" },
    { "id": "S-02", "tc": "TC-VIS-01", "file": "schema-diff-panel-recompute-running.png", "route": "/admin/schema", "viewport": "1280x800" },
    { "id": "S-03", "tc": "TC-VIS-01", "file": "schema-diff-panel-recompute-completed.png", "route": "/admin/schema", "viewport": "1280x800" },
    { "id": "S-04", "tc": "TC-VIS-01", "file": "schema-diff-panel-recompute-failed.png", "route": "/admin/schema", "viewport": "1280x800" }
  ]
}
```

> `tc` フィールドが TC 番号の唯一の保持場所（FB-LLM-MOD-05-001）。`file` には TC を含めない。

---

## 4. 3 層評価（Semantic / Visual / AI UX）

### 4.1 Semantic（意味的検証）

| 観点 | 確認内容 |
| --- | --- |
| 役割の明示 | recompute ボタンは `type="button"`。status バッジは `role="status"` + `aria-live="polite"`（`ui-state-machine.md` アクセシビリティ） |
| 状態の機械可読 | `data-role="recompute-action"` / `recompute-trigger` / `recompute-status[data-status]` / `recompute-error` が DOM に出現 |
| disable の明示 | `submitting` 中はボタン `disabled` + `aria-disabled`（AC-6） |
| 撤去確認 | `data-role="recompute-warning"`（旧 248-250「再集計実行は本タスク外」）が DOM から消えている |

### 4.2 Visual（視覚検証 / Apple HIG 準拠）

| 観点 | 確認内容 |
| --- | --- |
| OKLch token のみ | status バッジ含め HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0 件（AC-10 / `verify-design-tokens` gate） |
| status 色の意味整合 | completed=success token / running=info token / failed=danger token（`ui-state-machine.md` token 表） |
| 余白・階調 | 既存 SchemaDiffPanel の impact パネル spacing を踏襲（新規 primitive を生やさない / UI 不変条件 3） |

### 4.3 AI UX（操作性検証）

| シナリオ | 期待 |
| --- | --- |
| rollback 完了後に recompute 導線が出る | impact `recomputeRequired=true` のときのみ「再集計を実行」ボタンが視認できる |
| recompute を 1 操作で起動 | ボタン 1 クリック → submitting → completed バッジ（自動実行はされない・AC-5） |
| 実行中の二重押下を防止 | submitting 中はボタン disable で再押下不可（AC-6） |
| 失敗時の回復 | failed バッジ + lastError 表示 + 「再試行」ボタンで server-derived triggerKey の同一 job を再試行（idempotent） |

---

## 5. フィードバックループ（HIGH 問題の自動起票）

3 層評価または runtime で **HIGH 重大度の問題**（例: recompute 後も `response_fields` が古い stable_key のまま / audit_log 行欠落 / idempotency 破れで二重変動 / visual baseline diff が想定外）を検出した場合、`docs/30-workflows/unassigned-task/` 配下へ followup task を自動生成する。

| 検出層 | HIGH 判定例 | 起票先 prefix |
| --- | --- | --- |
| runtime（RAC-1） | migration apply 後に UNIQUE index が存在しない | `unassigned-task/issue-836-followup-recompute-migration-*` |
| runtime（RAC-2） | audit_log が 3 行に満たない / response_fields 未復帰 | `unassigned-task/issue-836-followup-recompute-runtime-*` |
| visual（RAC-3） | baseline 差分が design token 違反由来 | `unassigned-task/issue-836-followup-recompute-visual-*` |

MEDIUM 以下は本 Phase の各 evidence MD に「既知の制限」として記録し、起票はしない。

---

## 6. 完了条件（DoD）

- [ ] §1 TC-RT-01 / TC-RT-02 / TC-RT-03 / TC-VIS-01 が各 evidence MD に展開済み
- [ ] §2 canonical 命名 4 枚が 4 か所一致（実画像 / visual-baseline.md / metadata / implementation-guide.md）
- [ ] RAC-1: `outputs/phase-11/migration-apply.md` に `PRAGMA table_info` / `PRAGMA index_list` 結果を記録（secret 非記載）
- [ ] RAC-2: `outputs/phase-11/recompute-runtime.md` に audit_log 3 行 / response_fields 復帰 / job completed を記録
- [ ] RAC-3: `outputs/phase-11/visual-baseline.md` に baseline 撮影手順と task-18 visual-full 整合方針を記録
- [ ] §4 3 層評価すべて PASS
- [ ] §5 HIGH 問題があれば `unassigned-task/` へ自動起票
- [ ] runtime 実行は user 明示承認後のみ実施（未承認時は `runtime_pending` を維持）

## 成果物

- `outputs/phase-11/visual-baseline.md`（RAC-3）
- `outputs/phase-11/migration-apply.md`（RAC-1）
- `outputs/phase-11/recompute-runtime.md`（RAC-2 / TC-RT-03）
- `outputs/phase-11/screenshots/schema-diff-panel-recompute-{idle,running,completed,failed}.png`（実行時）
- `outputs/phase-11/phase11-capture-metadata.json`（実行時）
- 実行後に `artifacts.json` の `phase11.status` を `completed` へ更新（仕様書作成時点は `runtime_pending`）
