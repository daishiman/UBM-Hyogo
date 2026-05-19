# Phase 01 Path Topology Verification Gate

> 親ファイル: [phase-template-phase1.md](phase-template-phase1.md) / [phase12-skill-feedback-promotion.md](phase12-skill-feedback-promotion.md)

## 目的

Phase 1 entry で「実装対象 path（例: `apps/web/app/**` vs 旧 `apps/web/src/app/**`）」が
**正本仕様 / プロトタイプ / current worktree topology** の三者で一致していることを機械検証する gate。
stale path を Phase 1 に持ち込んだまま走ると Phase 5〜11 で routing drift / evidence path drift が連鎖し、
Phase 12 で大規模 rework が必要になる。

## Trigger（このゲートを必ず通すべきタスク種別）

| 条件 | 例 |
|------|------|
| UI / route 実装で `apps/web/app/**` を編集する | parallel-04 shared page chrome, public/admin route shells |
| 旧 `src/app` 系 path が正本仕様・プロトタイプに残っている可能性がある | UI prototype alignment、design-system foundation 系 |
| sub-workflow が parent workflow root の topology を継承する | parallel-N / serial-N 系 |
| docs-only でも `current_app_path` を仕様本文に転記する | API contract revision、route SSOT 更新 |

## 検証手順（Phase 1 必須）

### Step 1: current topology の実在確認

```bash
# repo の app route 実在 path を列挙
rg --files apps/web/app | head -50
rg --files apps/api/src/routes | head -50

# 旧 path が残っていないこと
test ! -d apps/web/src/app || echo "WARN: legacy src/app still exists"
```

### Step 2: 正本仕様内の path 引用を grep

```bash
# 仕様内の app route 引用 path
rg -n "apps/web/(src/)?app[^\s\"\`]*" docs/00-getting-started-manual/specs/ \
  docs/30-workflows/<workflow>/ | tee /tmp/path-refs.txt

# 旧 path （src/app）が残存していないか
rg -n "apps/web/src/app" docs/00-getting-started-manual/specs/ \
  docs/30-workflows/<workflow>/ && echo "FAIL: stale src/app path"
```

### Step 3: parent / sub-workflow 整合

`parallel-NN-*` / `serial-NN-*` 配下を持つ workflow では、parent root の Phase 1/2/3 文書と
sub-workflow の `phase-0N-*.md` が同一 path topology を使っていることを確認する。

```bash
PARENT="docs/30-workflows/<workflow>"
SUB="$PARENT/parallel-04-shared-page-chrome"
diff <(rg -o "apps/web/(src/)?app[^\s\"\`]*" "$PARENT"/phase-* | sort -u) \
     <(rg -o "apps/web/(src/)?app[^\s\"\`]*" "$SUB"/phase-* | sort -u) || \
  echo "FAIL: parent / sub-workflow path topology drift"
```

## FAIL 時の対応（同 wave 内に閉じる）

| ケース | アクション |
|--------|------------|
| 正本仕様に stale path が残っている | 同 wave で正本仕様を補正（Step 1-A current canonical sync で記録） |
| sub-workflow だけ stale | parent root に追随し sub-workflow phase docs を補正 |
| current topology そのものが未整備で path 不在 | Phase 5 実装対象として明示し、`spec_created` で close-out しない |
| 旧 path を残す合理的理由がある（supersede 境界） | `phase-01-requirements.md` に supersede 境界節を追加し、stale 引用に `[superseded]` マーカー付与 |

## 関連ゲート

- [[phase-01-spec]] — Phase 1 entry の必須入力
- [[workflow-state-vocabulary]] — `stale-current-verification` / `verified_current_no_code_change` との接続
- [[phase12-checklist-definition]] — 項目 #17 / #22 と同根（live root scan parity gate の Phase 1 版）
- [[phase12-skill-feedback-promotion]] — Workflow Path Existence Gate / Canonical Root Existence Gate との関係（route path レイヤ）

## 参考例: parallel-04 shared page chrome (2026-05-19)

`docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/` で
当初 `apps/web/src/app/{layout,error,not-found,loading}.tsx` を実装対象に挙げていたが、
current worktree topology は `apps/web/app/**` であった。Phase 1 で本 gate を通していれば
Phase 12 の `system-spec-update-summary.md` Step 1-C (`Stale Contract Withdrawal`) を実施せず
済んだ。実例として、parent workflow root の `09a-prototype-map.md` / `09h-shell-and-fixtures.md`
も同 wave で `apps/web/src/app` → `apps/web/app` へ補正している。

## 機械検証 1 行コマンド（CI 候補）

```bash
! rg -n "apps/web/src/app" \
  docs/00-getting-started-manual/specs/ \
  docs/30-workflows/$(basename "$WF_DIR")/ \
  --glob '!**/completed-tasks/**' \
  --glob '!**/lessons-learned/**' \
  --glob '!**/*-archive*.md'
```

exit 0 = clean / exit 1 = stale path 残存。Phase 1 entry checklist に `path-topology: OK` 行として記録する。
