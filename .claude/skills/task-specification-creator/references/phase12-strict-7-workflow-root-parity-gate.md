# Phase 12 Strict 7 / Workflow Root Parity Gate

> 親ファイル: [phase12-checklist-definition.md](phase12-checklist-definition.md) / [phase-12-spec.md](phase-12-spec.md)

## 目的

parent workflow と sub-workflow（`parallel-NN-*` / `serial-NN-*`）の **Phase 12 strict 7 outputs**
配置責務を一意化し、複製・欠落・SHA drift を防ぐ gate を定義する。
parent root に集約する設計を SSOT とし、sub-workflow 単体に複製しない方針を機械検証可能にする。

## 集約原則（SSOT）

| 配置パターン | Phase 12 strict 7 の配置先 | 備考 |
|--------------|----------------------------|------|
| 単独 workflow（sub なし） | `docs/30-workflows/<workflow>/outputs/phase-12/` | 既存ルール |
| parent + sub-workflow 複数 | parent root の `outputs/phase-12/` に **集約** | sub-workflow 単体には複製しない |
| sub-workflow 固有の証跡が大量にある場合 | sub-workflow 配下に `outputs/phase-11/` 系のみ配置、Phase 12 strict 7 は parent root | strict 7 の物理重複を禁止 |

> **理由**: strict 7 を sub-workflow 側にも複製すると、Phase 12 close-out 時に SHA / 内容 drift が発生し、
> どちらが正本か reviewer が判定できなくなる。`verify-phase12-compliance` も sub 側を別 workflow と認識し
> 二重失敗 / 二重 pass が混在する。parent root 一本化で「workflow root = strict 7 SSOT」を維持する。

## 検証コマンド

### Step 1: strict 7 物理存在（parent root）

`phase12-checklist-definition.md` §「Phase 12 必須 7 outputs path existence pre-check」をそのまま使う。
parent root に対して exit 0 を確認。

### Step 2: sub-workflow 側に strict 7 が複製されていないこと

```bash
PARENT="docs/30-workflows/<workflow>"
STRICT_7=(
  "main.md"
  "implementation-guide.md"
  "phase12-task-spec-compliance-check.md"
  "system-spec-update-summary.md"
  "skill-feedback-report.md"
  "unassigned-task-detection.md"
  "documentation-changelog.md"
)
DUP=0
for sub in "$PARENT"/{parallel,serial}-*-*/; do
  [ -d "$sub" ] || continue
  for f in "${STRICT_7[@]}"; do
    if [ -f "$sub/outputs/phase-12/$f" ]; then
      echo "DUPLICATE: $sub/outputs/phase-12/$f"
      DUP=$((DUP+1))
    fi
  done
done
[ "$DUP" -eq 0 ] || { echo "FAIL: strict 7 duplicated in $DUP sub-workflow outputs"; exit 1; }
```

### Step 3: artifacts.json parity（root と outputs）

```bash
PARENT="docs/30-workflows/<workflow>"
# size / sha 比較
ROOT_JSON="$PARENT/artifacts.json"
OUT_JSON="$PARENT/outputs/artifacts.json"
[ -f "$ROOT_JSON" ] && [ -f "$OUT_JSON" ] || { echo "FAIL: artifacts.json missing"; exit 1; }

# title / type / status / phase artifact 名の同一性（jq があれば）
if command -v jq >/dev/null; then
  diff <(jq -S '{title, type, status, phases: [.phases[]?.artifacts[]?.name]}' "$ROOT_JSON") \
       <(jq -S '{title, type, status, phases: [.phases[]?.artifacts[]?.name]}' "$OUT_JSON") \
    || { echo "FAIL: artifacts.json parity drift"; exit 1; }
fi
```

これは `phase12-checklist-definition.md` 項目 #20 (artifacts parity) を sub-workflow 集約 case 用に拡張したもの。

### Step 4: sub-workflow の phase-12 docs は **compliance check のみ** 配置可

```bash
# sub-workflow 配下に許される phase-12 docs は phase-12-compliance-check.md のみ
PARENT="docs/30-workflows/<workflow>"
for sub in "$PARENT"/{parallel,serial}-*-*/; do
  [ -d "$sub" ] || continue
  for f in "$sub"phase-12-*.md; do
    [ -f "$f" ] || continue
    case "$(basename "$f")" in
      phase-12-compliance-check.md) ;;
      *) echo "FAIL: unexpected phase-12 doc in sub-workflow: $f"; exit 1 ;;
    esac
  done
done
```

## 参考例: parallel-04 shared page chrome (2026-05-19)

- parent root: `docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/` に strict 7 配置（SSOT）
- sub-workflow: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-12-compliance-check.md` のみ配置
- `outputs/phase-12/phase12-task-spec-compliance-check.md`（parent root）が sub-workflow の
  `phase-12-compliance-check.md` を canonical heading SSOT として参照
- 複製は 0 件、artifacts.json parity OK、strict 7 は parent root に集約

## FAIL 時の対応

| 検出 | アクション |
|------|------------|
| sub-workflow に strict 7 のいずれかが物理存在 | 即削除し、内容は parent root の strict 7 に統合（同 wave で `documentation-changelog.md` に統合履歴を記録） |
| artifacts.json parity drift | parent root を SSOT にし、`outputs/artifacts.json` を同期再生成 |
| sub-workflow に `phase-12-*` で `compliance-check` 以外が存在 | parent root の strict 7 に統合し sub からは削除 |
| parent root に strict 7 不在で sub に存在 | sub の内容を parent root へ移送し、sub からは削除（SSOT 反転禁止） |

## 関連ゲート

- [[phase12-checklist-definition]] — strict 7 path existence の機械検証コマンド本体
- [[phase-12-spec]] — canonical 9 headings SSOT (L441 周辺)
- [[completed-tasks-policy]] — workflow root 移動時の parent / sub 同 wave 移動規則
- [[patterns-phase12-sync]] — aiworkflow-requirements 同時更新フロー

## 機械検証 1 行ラッパー（CI 候補）

```bash
bash scripts/lib/phase12-compliance/verify-strict7-parity.sh "docs/30-workflows/<workflow>"
```

> 上記スクリプトは未実装。CI gate 追加時は `verify:phase12-compliance` script の sub-task として
> Step 1〜4 を 1 本にまとめて実装する。実装着手前は本 reference を SSOT として local で run する。
