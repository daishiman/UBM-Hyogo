# Phase 6: テスト追加（追加検証ケース）

> docs-only タスクのため「テスト追加」= Phase 4 の基本検証に対し、補正後の状態を恒久的に守る
> **回帰 guard（regression guard）** を read-only コマンドとして追加する。新規 spec ファイルは作成しない。

## 6.1 追加検証ケース一覧（VC-R1..VC-R5）

### VC-R1: root ↔ outputs の byte 一致（parity 回帰 guard）

`diff -u` で行差分を見るだけでなく、ハッシュ一致で byte 完全一致を保証する。

```bash
ROOT=docs/30-workflows/completed-tasks/members-list-ux-clarity/artifacts.json
OUT=docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/artifacts.json
shasum -a 256 "$ROOT" | awk '{print $1}'
shasum -a 256 "$OUT"  | awk '{print $1}'
diff <(shasum -a 256 < "$ROOT") <(shasum -a 256 < "$OUT") && echo "PARITY OK (byte-identical)"
```

- 期待: 2 つの SHA-256 が一致し `PARITY OK (byte-identical)` を出力。
- 守る不変: root を補正したのに outputs を更新し忘れる drift を検出する。

### VC-R2: 全 passed gate の passed_at が ISO8601 形式（gate-metadata 回帰 guard）

```bash
ROOT=docs/30-workflows/completed-tasks/members-list-ux-clarity/artifacts.json
jq -r '.metadata.gates[] | select(.status=="passed") | .passed_at' "$ROOT" | \
  grep -Ev '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(Z|[+-][0-9]{2}:[0-9]{2})$' \
  && echo "FAIL: non-ISO8601 passed_at found" || echo "OK: all passed_at are ISO8601"
```

- 期待: `OK: all passed_at are ISO8601`（非 ISO8601 の行が 0 件）。
- 守る不変: `passed` なのに `passed_at` が `null` や日付のみ（`2026-05-30`）になる退行を検出する。

### VC-R3: passed gate の evidence_path が実在（gate-metadata 回帰 guard）

```bash
WF=docs/30-workflows/completed-tasks/members-list-ux-clarity
jq -r '.metadata.gates[] | select(.status=="passed") | .evidence_path' "$WF/artifacts.json" | \
while read -r p; do
  case "$p" in
    docs/*) f="$p" ;;        # workflow ルートからの絶対 docs path
    *)      f="$WF/$p" ;;    # workflow ルート相対 path
  esac
  if [ -f "$f" ]; then echo "OK   $f"; else echo "MISSING $f"; fi
done
```

- 期待: 全行 `OK`（`MISSING` が 0 件）。Gate-A=`phase-3-design-review.md`、Gate-B=`outputs/phase-11/runtime-notes.md` がいずれも実在。
- 守る不変: `passed` 化したが evidence ファイルが存在しない（補正前 Gate-B の `manual-test-result.md` 状態）退行を検出する。

### VC-R4: sub-task と root の整合（矛盾ゼロ回帰 guard）

```bash
WF=docs/30-workflows/completed-tasks/members-list-ux-clarity
for f in "$WF/artifacts.json" \
         "$WF/outputs/artifacts.json" \
         "$WF/tasks/task-a-density-toggle-ux-clarity/artifacts.json" \
         "$WF/tasks/task-b-member-filters-live-affordance/artifacts.json" \
         "$WF/tasks/task-c-page-integration-and-visual-baseline/artifacts.json"; do
  ws=$(jq -r '.metadata.workflow_state' "$f")
  p12=$(jq -c '[.phases[] | select(.phase<=12) | .status] | unique' "$f")
  p13=$(jq -r '.phases[] | select(.phase==13) | .status' "$f")
  echo "$f | ws=$ws | p1-12=$p12 | p13=$p13"
done
```

- 期待: 全 5 ファイルが `ws=implemented_local_runtime_pending` / `p1-12=["completed"]` / `p13=pending` で一致。
- 守る不変: root は完了扱い・sub-task は `spec_created` のまま、といった親子矛盾を検出する。

### VC-R5: status enum の許容値外混入なし（正規化回帰 guard）

```bash
WF=docs/30-workflows/completed-tasks/members-list-ux-clarity
for f in "$WF"/artifacts.json "$WF"/outputs/artifacts.json "$WF"/tasks/*/artifacts.json; do
  jq -r '.phases[].status' "$f"
done | sort -u
```

- 期待出力: `completed` と `pending` の 2 値のみ（`spec_created` が 0 件）。
- 守る不変: sub-task 由来の `spec_created` 値が phase status に残留する退行を検出する。

## 6.2 既存 CI gate との連携

| gate | コマンド | 本タスクでの役割 |
|------|----------|------------------|
| gate-metadata:validate | `mise exec -- pnpm gate-metadata:validate` | VC-R2 / VC-R3 を CI で恒久検証 |
| verify:phase12-compliance | `mise exec -- pnpm verify:phase12-compliance` | status consistency セクションで register↔artifacts 整合を検証 |
| verify-test-suffix | （CI）| 本タスクは `*.spec.ts` を追加しないため無関係（非該当） |

## 6.3 不変条件

- 追加検証は全て read-only。`apps/` `packages/` を変更しない。
- 新規 spec ファイル（`*.spec.ts`）は追加しない（CLAUDE.md #8 に対しテスト追加自体が非該当）。
