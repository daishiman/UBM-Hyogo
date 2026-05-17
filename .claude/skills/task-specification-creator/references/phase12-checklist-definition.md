# Phase 12 Task 1/3/4/5 実体確認チェックリスト定義

## 概要

Phase 12 の必須成果物（Task 1/3/4/5）の物理的存在と最低要件を検証するためのチェックリスト。

## チェック項目一覧（20項目）

| #   | Task ID | チェック項目                                                                 | 確認対象ファイル                                                                       | 検証方法                                                                                  |
| --- | ------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Task 1  | implementation-guide.md Part 1（中学生レベル概念説明）が存在する           | outputs/phase-12/implementation-guide.md                                               | ファイル実在 + `## Part 1` セクション存在                                                 |
| 2   | Task 1  | implementation-guide.md Part 2（開発者向け実装詳細）が存在する             | outputs/phase-12/implementation-guide.md                                               | ファイル実在 + `## Part 2` セクション存在                                                 |
| 3   | Task 1  | Part 1 で「なぜ必要か」を先に説明している                                   | outputs/phase-12/implementation-guide.md                                               | `## Part 1` 内に `なぜ`/`必要` の説明ブロックがある                                       |
| 4   | Task 1  | Part 1 に日常生活の例え話が含まれている                                     | outputs/phase-12/implementation-guide.md                                               | `## Part 1` 内に `例え`/`たとえば`/`イメージ` のいずれかを含む                           |
| 5   | Task 1  | Part 2 に型定義（TypeScript）が含まれている                                | outputs/phase-12/implementation-guide.md                                               | `interface` または `type` を含むコードブロック                                            |
| 6   | Task 1  | Part 2 に APIシグネチャ/使用例が含まれている                               | outputs/phase-12/implementation-guide.md                                               | `onXxx` などのシグネチャ記述 + 使用例コードブロック                                       |
| 7   | Task 1  | Part 2 にエラーハンドリング/エッジケース/設定項目が記載されている          | outputs/phase-12/implementation-guide.md                                               | 「エラーハンドリング」「エッジケース」「設定」系見出し or 表の存在                        |
| 8   | Task 3  | documentation-changelog.md が作成されている                                | outputs/phase-12/documentation-changelog.md                                            | ファイル実在                                                                              |
| 9   | Task 3  | 全 Step の完了結果が記録されている                                           | outputs/phase-12/documentation-changelog.md 内                                         | Step完了セクション存在                                                                    |
| 10  | Task 4  | unassigned-task-detection.md が作成されている（0件でも必須）               | outputs/phase-12/unassigned-task-detection.md                                          | ファイル実在                                                                              |
| 11  | Task 4  | 検出した未タスクが3ステップ全完了している                                    | unassigned-task/指示書 + task-workflow.mdテーブル + 関連仕様書リンク                    | 3ステップ確認                                                                             |
| 12  | Task 5  | aiworkflow-requirements/LOGS.md が更新されている                             | .claude/skills/aiworkflow-requirements/LOGS.md                                         | 更新確認                                                                                  |
| 13  | Task 5  | task-specification-creator/LOGS.md が更新されている                           | .claude/skills/task-specification-creator/LOGS.md                                      | 更新確認                                                                                  |
| 14  | Task 5  | aiworkflow-requirements/SKILL.md / task-specification-creator/SKILL.md 変更履歴が更新されている | .claude/skills/aiworkflow-requirements/SKILL.md / .claude/skills/task-specification-creator/SKILL.md | 変更履歴更新確認                                                                          |
| 15  | Task 4  | 未タスク指示書で `## メタ情報` が1件のみである（重複なし）                              | docs/30-workflows/unassigned-task/*.md                                                 | `rg -n "^## メタ情報$"` で対象ファイルを確認し、1件であることを検証                     |
| 16  | Task 2/4 | system spec に今回実装の苦戦箇所が残っている                                  | `references/lessons-learned.md` または更新対象 domain spec                              | `苦戦箇所` / `5分解決カード` / 等価な lessons 参照があることを確認                        |
| 17  | Task 4  | 未実施の未タスクが completed-only area に混在していない                         | `docs/30-workflows/completed-tasks/*.md`, `docs/30-workflows/completed-tasks/**/unassigned-task/*.md`, `docs/30-workflows/completed-tasks/unassigned-task/*.md` | direct completed spec は `未実施|未着手|進行中` を持たないこと、継続 backlog は実際の parent workflow 配下にあることを確認 |
| 18  | Task 2/5 | user 指定の skill root が正本として更新され、mirror root との drift がない      | `.claude/skills/**` と `.agents/skills/**` などの mirror root                          | user 指定rootで validator 実行 + `diff -qr` または等価手段で mirror sync を検証 |
| 19  | Task 2/5 | completed workflow の `phase-12-documentation.md` と `outputs/phase-12/*.md` に `仕様策定のみ` / `実行予定` などの planned wording が残っていない | `phase-12-documentation.md`, `outputs/phase-12/*.md` | `rg -n "仕様策定のみ|実行予定|保留として記録|計画|予定|TODO|will be|を予定" <workflow>/phase-12-documentation.md <workflow>/outputs/phase-12/*.md` で 0件確認 |
| 20  | Task 2/5 | `artifacts.json` と `outputs/artifacts.json` の title / type / status / phase artifact 名が一致している | `<workflow>/artifacts.json`, `<workflow>/outputs/artifacts.json` | JSON 実体を比較し、片側だけ `spec_created` / `completed` などにずれていないことを確認 |
| 21  | Task 2/5 | ledger 4点（task-workflow-backlog.md / task-workflow-completed.md / lane index / artifacts.json）がsame-waveで同期されている | 上記4ファイル全て | 各ファイルのタスク状態・ステータスが一致していることを確認 |
| 22  | Task 2/4 | rename 系タスク（test suffix migration / ファイル移動 / 命名規約変更）では target root の **live root scan parity gate** を通過している | `<rename-target-root>`（例 `apps/web/`）, Phase 7 spec の expected count, Phase 11 evidence | `find <rename-target-root> -name '*.test.*' -o -name '*.spec.*' -o -name '*.test-d.*' -o -name '*.spec-d.*'`（`node_modules` / `.next` / `.open-next` 除外）の live count と Phase 7 spec の expected count を parity check。`apps/web/src` のような sub-tree 限定推定は禁止し、target root 全体で評価する。type-only `*.test-d.ts` を必ず discovery 対象に含める。0 件残存ゲート対象 suffix（rename 元）が live で 0 件かを `grep -rn` で確認。`scripts/lint-*.{mjs,js,ts}` 内の旧 suffix hardcode を全網羅で更新済みか grep で確認。aiworkflow-requirements `references/` に対しても rename target root scope 限定 grep で残存 0 件を確認（scope 外残存は phase12-task-spec-compliance-check.md に意図記録） |

## 機械検証コマンド

### Phase 12 必須 7 outputs path existence pre-check（spec_verified gate / 2026-05-09 stage-3-impl 由来）

`spec_verified` / `verified` / `implementation_complete_pending_pr` のいずれの状態に昇格させる場合も、**昇格前に必ず以下 7 ファイルの物理存在を asserts する**。1 件でも欠落していれば `phase12-task-spec-compliance-check.md` 総合判定を `FAIL` に固定し、`spec_verified` を付与してはならない（e2e-quality-uplift stage-3-impl 3a/3b/3c で本 gate 不在により compliance check が誤 PASS した実例あり）。

```bash
WF_DIR="docs/30-workflows/<FEATURE_NAME>"
REQUIRED_7=(
  "outputs/phase-12/main.md"
  "outputs/phase-12/implementation-guide.md"
  "outputs/phase-12/phase12-task-spec-compliance-check.md"
  "outputs/phase-12/system-spec-update-summary.md"
  "outputs/phase-12/skill-feedback-report.md"
  "outputs/phase-12/unassigned-task-detection.md"
  "outputs/phase-12/documentation-changelog.md"
)
MISSING=0
for f in "${REQUIRED_7[@]}"; do
  if [ -f "$WF_DIR/$f" ]; then
    echo "OK: $f"
  else
    echo "NG: $f (MISSING)"
    MISSING=$((MISSING+1))
  fi
done
if [ "$MISSING" -gt 0 ]; then
  echo "spec_verified gate FAIL: missing $MISSING/7 required outputs"
  exit 1
fi
```

判定ルール:

- 7 ファイル全て存在 → `spec_verified` 昇格可（他の compliance 項目と AND 条件）
- 1 件以上欠落 → `phase12-task-spec-compliance-check.md` を `FAIL` に固定し、`metadata.workflow_state` を `spec_created` から動かさない
- `main.md` が存在しない場合は他 6 ファイルが揃っていても **NG**（phase 12 entry point として必須）
- このコマンドの **exit code と検証日時** を `phase12-task-spec-compliance-check.md` 冒頭に転記する（runtime evidence と同様の扱い）

### 一括存在確認（簡易版・サブセット 4 ファイル / 後方互換）

```bash
WF_DIR="docs/30-workflows/<FEATURE_NAME>"
REQUIRED=(
  "outputs/phase-12/implementation-guide.md"
  "outputs/phase-12/documentation-changelog.md"
  "outputs/phase-12/unassigned-task-detection.md"
  "outputs/phase-12/skill-feedback-report.md"
)
for f in "${REQUIRED[@]}"; do
  if [ -f "$WF_DIR/$f" ]; then echo "OK: $f"; else echo "NG: $f (MISSING)"; fi
done
```

> **注意**: 簡易版は 7 outputs path existence pre-check の代替にしない。`spec_verified` 昇格判断には必ず 7 ファイル版を使う。

### Part 1/2 セクション確認

```bash
GUIDE="$WF_DIR/outputs/phase-12/implementation-guide.md"
grep -c "## Part 1" "$GUIDE" && grep -c "## Part 2" "$GUIDE"
```

### Part 1/2 内容要件の簡易確認

```bash
GUIDE="$WF_DIR/outputs/phase-12/implementation-guide.md"

# Part 1: 理由先行 + 例え
rg -n "なぜ|必要|例え|たとえば|イメージ" "$GUIDE"

# Part 2: 型/API/エッジケース/設定
rg -n "interface|type|API|シグネチャ|エッジケース|エラー|設定" "$GUIDE"
```

### LOGS.md 2ファイル更新確認（P1/P25対策）

```bash
git diff --name-only HEAD -- \
  .claude/skills/aiworkflow-requirements/LOGS.md \
  .claude/skills/task-specification-creator/LOGS.md
```

### SKILL.md 変更履歴更新確認

```bash
git diff --name-only HEAD -- \
  .claude/skills/aiworkflow-requirements/SKILL.md \
  .claude/skills/task-specification-creator/SKILL.md
```

## 検証結果テンプレート

```
チェックリスト検証結果:
- #1  implementation-guide.md Part 1: OK/NG
- #2  implementation-guide.md Part 2: OK/NG
- #3  Part 1 理由先行: OK/NG
- #4  Part 1 日常例え: OK/NG
- #5  Part 2 型定義: OK/NG
- #6  Part 2 APIシグネチャ/使用例: OK/NG
- #7  Part 2 エッジケース/設定項目: OK/NG
- #8  documentation-changelog.md: OK/NG
- #9  全Step完了結果記録: OK/NG
- #10 unassigned-task-detection.md: OK/NG
- #11 未タスク3ステップ完了: OK/NG/N/A(0件)
- #12 aiworkflow-requirements/LOGS.md: OK/NG
- #13 task-specification-creator/LOGS.md: OK/NG
- #14 aiworkflow-requirements/SKILL.md + task-specification-creator/SKILL.md: OK/NG
- #15 未タスク `## メタ情報` 重複なし: OK/NG
- #16 system spec に苦戦箇所記録: OK/NG
- #17 未実施UTの completed-only area 混在なし: OK/NG
- #18 canonical root + mirror sync: OK/NG/N/A
- #19 completed workflow に planned wording 残置なし: OK/NG
- #20 gate-metadata validator green (`pnpm gate-metadata:validate` exit 0): OK/NG/N/A

総合判定: PASS / FAIL (NG項目数: X/20)

### 補足: gate-metadata validator (#20)

`artifacts.json` に `metadata.gates[]` を含むタスクは、Phase 12 完了判定に
`mise exec -- pnpm gate-metadata:validate` exit 0（schema 適合 + 全 status の
`evidence_path` repo-root relative / path traversal なし + `status === "passed"` の
`evidence_path` 実体存在）を加える。PR CI では変更された `artifacts.json` を
`--require-gates-for-changed` に渡し、新規・編集 workflow の `metadata.gates[]` 欠落を ERROR にする。schema/CLI 仕様は
`.claude/skills/aiworkflow-requirements/references/gate-metadata.md` を SSOT とする。
`gates[]` 不在の歴史的 artifacts は WARN/skip 扱いで N/A 判定して良い。

#### よくある schema 違反と修正 (2026-05-17 追記)

| 誤った値 | 正しい値 | 補足 |
|---------|---------|------|
| `status: "completed"` | `status: "passed"` | local 実装完了。`passed_at` (ISO8601) と `approver: "local"` を併記 |
| `status: "verified"` | `status: "passed"` | local 検証完了。同上 |
| `status: "blocked"` | `status: "pending"` | user-gated。`passed_at: null` と `approver: "daishiman"` を併記 |
| `evidence_path` が `docs/30-workflows/<workflow>/...` のまま | `docs/30-workflows/completed-tasks/<workflow>/...` | completed-tasks/ 移動後はパス追従必須 |
| `artifacts.json` と `outputs/artifacts.json` の `metadata.gates` 不一致 | 両者を同一に維持 | CI gate は両ファイルを独立検証する |

詳細事例: [aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md](../../aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md) L-DEVSYNC-006。
```
