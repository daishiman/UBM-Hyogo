# Phase 6: ローカル検証 / typecheck / lint / vitest / coverage-guard / Issue #549 Backfill

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| Source | `outputs/phase-6/phase-6.md` |
| 区分 | 実装（既存 artifacts.json への backfill + ローカル品質ゲート確認） |
| 想定所要 | 0.5 人日 |

## 目的

Phase 5 実装をローカル品質ゲート（typecheck / lint / vitest / coverage-guard）で検証し、Issue #549 の `artifacts.json` と `outputs/artifacts.json` を新 schema で backfill した上で `pnpm gate-metadata:validate` が exit 0 を返すことを確認する。

## 実行タスク

### 6.1 ローカル品質ゲート

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/shared test gate-metadata
mise exec -- pnpm vitest run scripts/gate-metadata
bash scripts/coverage-guard.sh
```

すべて exit 0 を要求。

### 6.2 Issue #549 backfill

#### 6.2.1 backfill 対象

- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/artifacts.json`（mirror）

#### 6.2.2 既存 `gateConditions[]` → `gates[]` マッピング

| 既存自由文 | 新 entry |
| --- | --- |
| "Gate-A: FU-03-C (#548) offline replay shows ML > threshold (precision/recall)" | `{ gate_id: "Gate-A", status: "passed", passed_at: "2026-05-08T00:00:00Z", evidence_path: "docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/phase12-task-spec-compliance-check.md", approver: "daishiman", notes: "FU-03-C #548 offline replay 完了 / Phase 12 strict 7 outputs 揃いを根拠に passed" }` |
| "Gate-B: fallback rate and Issue body redaction within tolerance" | `{ gate_id: "Gate-B", status: "pending", passed_at: null, evidence_path: "docs/runbooks/cf-audit-ml-fallback.md", approver: "CODEOWNERS:apps-api", notes: "production switch 後の 7 日観測まで pending" }` |
| "Gate-C: rollback approval (CODEOWNERS) obtained" | `{ gate_id: "Gate-C", status: "pending", passed_at: null, evidence_path: "docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/main.md", approver: "CODEOWNERS:apps-api", notes: "rollback 承認は production switch 直前に取得 → 取得時点で passed 化" }` |
| "Gate-D: if Gate-A fails, keep threshold and re-evaluate artifact in stage" | `{ gate_id: "Gate-D", status: "waived", passed_at: null, evidence_path: "docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/main.md", approver: "daishiman", notes: "Gate-A が passed したため fallback 条件 D は不要 → waived" }` |

> **注意**: status / passed_at は Issue #549 の現実の Phase 状態に基づき、本タスク作業時点で再確認すること。上表は本仕様書執筆時点（2026-05-10）の参照値。

#### 6.2.3 `gateConditions[]` の扱い

- **削除しない**（後方互換のため `gateConditions_legacy` にリネームして保持）。validator は `gates[]` のみを参照するため legacy フィールドは ignore される。
- 完全削除は別 PR で historical sweep として実施可能（本タスク範囲外）。

#### 6.2.4 backfill 後の検証

```bash
mise exec -- pnpm gate-metadata:validate
# 期待: exit 0、Issue #549 artifacts.json 2 件で OK が出力される
```

### 6.3 mirror 整合確認

```bash
diff -q docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json \
        docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/artifacts.json
```

byte-identical を要求。

## 変更対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json` | 編集 | `metadata.gates[]` 追加 / `gateConditions` を `gateConditions_legacy` にリネーム |
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/artifacts.json` | 編集 | 同 mirror |

## 入出力・副作用

- 入力: Phase 5 実装 / 既存 #549 artifacts.json。
- 出力: backfill 後の artifacts.json 2 件 + `outputs/phase-6/phase-6.md`（コマンド実行 stdout 抜粋・mapping 表）。
- 副作用: 既存 #549 artifacts.json を編集。

## テスト方針

Phase 4 / Phase 5 のテストはここで再実行。新規テスト追加なし（backfill 単体テストは validator が兼ねる）。

## ローカル実行・検証コマンド

§6.1 / §6.2.4 / §6.3 のコマンドをすべて実行し、stdout を `outputs/phase-6/phase-6.md` に抜粋記録する。

## 統合テスト連携

- Phase 8 は本 Phase の backfill 結果を CI workflow で再検証する。
- Phase 11 は本 Phase の validator stdout を NON_VISUAL evidence として記録する。

## 多角的チェック観点（AIが判断）

- **legacy フィールド命名**: `gateConditions_legacy` 以外の命名（例 `_deprecated`）でも可だが、jq / grep で容易に発見できる接頭辞を採用。
- **mirror 編集忘れ**: outputs/ 配下も同時編集しないと validator が ERROR を返す可能性 → §6.3 で diff -q 必須。
- **#549 spec の現実検証**: Phase 12 outputs 7 種揃い + Phase 13 blocked_pending_user_approval を grep して、Gate-A が実態 passed であることを再確認してから passed と書く。

## サブタスク管理

- ST-1: ローカル 6 コマンド全 green
- ST-2: #549 artifacts.json 編集（root）
- ST-3: #549 outputs/artifacts.json 編集（mirror）
- ST-4: validator 再実行 exit 0
- ST-5: mirror diff -q 確認
- ST-6: stdout を outputs/phase-6/phase-6.md に記録

## 成果物

- backfill 後の #549 artifacts.json × 2 + `outputs/phase-6/phase-6.md`。

## 完了条件（DoD）

- [ ] §6.1 全コマンド exit 0。
- [ ] #549 artifacts.json と outputs/artifacts.json に `gates[]` 4 件 backfill 済み。
- [ ] `gateConditions` → `gateConditions_legacy` リネーム済み。
- [ ] `mise exec -- pnpm gate-metadata:validate` exit 0。
- [ ] mirror diff -q 一致。
- [ ] `bash scripts/coverage-guard.sh` exit 0。

## タスク100%実行確認【必須】

- [ ] ST-1 ... ST-6 すべて完了
- [ ] `outputs/phase-6/phase-6.md` 生成済み
- [ ] Phase 7 着手 GO 判定済み

## 次Phase

[Phase 7: コードレビュー](phase-07.md)

## 参照資料

- `docs/30-workflows/issue-589-gate-metadata-structured-ledger/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
