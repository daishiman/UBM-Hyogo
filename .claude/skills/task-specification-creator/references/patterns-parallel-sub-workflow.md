# パターン集: parallel sub-workflow 構造 / artifacts 二重構造 / VISUAL_ON_EXECUTION

> 読み込み条件: 1 つの workflow を `parallel-NN-*/` / `serial-NN-*/` の sub-workflow 群に分解し、
> 各 sub が独立した Phase 1-13 / artifacts.json / outputs を持つケース。
> 第一適用例: `docs/30-workflows/ui-prototype-design-system-foundation/`（parallel-01..04 + serial-00 / serial-05..07）。
> 関連: [patterns-parallel-ipc.md](patterns-parallel-ipc.md)（並列「エージェント」実行の上限）/
> [completed-tasks-policy.md](completed-tasks-policy.md)（親→子同期）/
> [phase12-compliance-check-template.md](phase12-compliance-check-template.md)（canonical 9 headings SSOT）。

## 1. workflow root と sub-workflow の二重 `artifacts.json` / `outputs/` 構造

### 1-1. 役割分離（SRP）

| レイヤ | 配置 | 役割 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/<workflow>/artifacts.json` / `outputs/phase-*/` | 親集約。`sub_workflows` map で各 sub の status / boundary を記録し、全 sub を横断する gate（Gate-A/B/C）の正本 |
| sub-workflow | `docs/30-workflows/<workflow>/parallel-NN-*/artifacts.json` / `outputs/phase-*/` | 実行単位。Phase 1-13 を個別に持ち、`status`・`outputs`・`gates` を sub 単位で完結させる |

### 1-2. sub artifacts.json の必須フィールド

`sub_workflow` フィールドを **必ず明示** する（root と sub を機械判定するための SSOT）。

```jsonc
{
  "workflow_id": "ui-prototype-design-system-foundation",
  "sub_workflow": "parallel-01-globals-css-rhythm",
  "metadata": {
    "workflow_state": "runtime_pending",
    "taskType": "implementation",
    "visualEvidence": "VISUAL_ON_EXECUTION",
    "implementation_status": "local_css_selectors_added",
    "runtime_boundary": "serial-07 visual evidence pending"
  },
  "phases": [ /* 1..13 */ ],
  "outputs": { "phase_11": [ ... ], "phase_12": [ ... ] }
}
```

root artifacts.json には `metadata.sub_workflows` map を持たせ、各 sub の `status` /
`implementation_status` / `runtime_boundary` を duplicate しない参照だけ書く（実値は sub artifacts.json が正本）。

```jsonc
{
  "workflow_id": "ui-prototype-design-system-foundation",
  "metadata": {
    "workflow_state": "spec_created",
    "sub_workflows": {
      "parallel-01-globals-css-rhythm": {
        "status": "runtime_pending",
        "implementation_status": "local_css_selectors_added",
        "runtime_boundary": "serial-07 visual evidence pending"
      }
    },
    "gates": [ { "gate_id": "Gate-A", ... }, { "gate_id": "Gate-B", ... } ]
  }
}
```

### 1-3. 親が "spec_created"・子が "runtime_pending" の状態整合

- root の `workflow_state` は **最下位 sub の最も低い state を踏襲**する（`spec_created` → `runtime_pending` → `completed` の昇順）。
- 1 つでも sub が `runtime_pending` なら root を `completed` に昇格させない。
- 逆に、root を `spec_created` のまま据え置きつつ sub が `runtime_pending` なのは正当（local 実装は完了したが root 集約 visual evidence が未取得な過渡状態）。
- 状態語彙の詳細は [workflow-state-vocabulary.md](workflow-state-vocabulary.md) に従う。

### 1-4. 禁止パターン

| 禁止 | 理由 |
| --- | --- |
| sub artifacts.json に `sub_workflow` フィールドを書かない | parser / CI gate が root と sub を区別できず compliance check が誤検出 |
| root artifacts.json に sub の Phase status を直接展開（duplicate） | 同期 drift の温床。`sub_workflows` map の参照だけにする |
| sub `outputs/phase-12/*.md` を省略し root にだけ置く | sub 単独で Phase 12 compliance を満たせず、CI `verify-phase12-compliance` が sub root を fail 判定する |

---

## 2. root / sub の Phase 11/12 outputs parity 要件

### 2-1. strict 7 outputs を root と sub の双方で保持

[phase12-checklist-definition.md](phase12-checklist-definition.md) の Phase 12 必須 7 outputs（`main` /
`implementation-guide` / `phase12-task-spec-compliance-check` / `system-spec-update-summary` /
`skill-feedback-report` / `unassigned-task-detection` / `documentation-changelog`）は、
**親 workflow root と各 sub-workflow の両方で個別に保持** する。

| 配置 | strict 7 outputs |
| --- | --- |
| `docs/30-workflows/<workflow>/outputs/phase-12/` | 親集約版（横断観点） |
| `docs/30-workflows/<workflow>/parallel-NN-*/outputs/phase-12/` | sub 単位の compliance / changelog / unassigned 検出 |

### 2-2. canonical 9 headings の二重保持

[phase12-compliance-check-template.md](phase12-compliance-check-template.md) の canonical 9 headings は、
親 `outputs/phase-12/phase12-task-spec-compliance-check.md` と
sub `outputs/phase-12/phase12-task-spec-compliance-check.md`（あるいは sub のルート直下
`phase-12-compliance-check.md`）の **両方** で fully present であること。

- 親側 compliance check では「sub-workflow ごとの Phase 11 evidence inventory の集約表」を含める。
- sub 側 compliance check では「自分の sub-workflow が触る apps/ scripts/ の dirty diff inventory」と、
  自分の `outputs/phase-11/` 配下 evidence のみを inventory する。
- `## 4. Phase 11 evidence file inventory`（数字 prefix なし）見出しを採用すると、
  `scripts/lib/phase12-compliance/verify-compliance-file.ts` の `^\d+\.\s+` normalize と
  `scripts/hooks/phase12-compliance-guard.sh` の awk `/^## Phase 11 evidence file inventory/` の
  両方を PASS する（SKILL-changelog v2026.05.18-phase12-guard-fork-base-scope-fix 参照）。

### 2-3. parity 検証

```bash
# 親と sub 両方で canonical 9 headings の存在を確認する逐語コマンド
WF=docs/30-workflows/ui-prototype-design-system-foundation
for f in \
  "$WF/outputs/phase-12/phase12-task-spec-compliance-check.md" \
  $WF/parallel-*/outputs/phase-12/phase12-task-spec-compliance-check.md; do
  echo "=== $f ==="
  grep -nE '^## ' "$f" || echo "[FAIL] file missing"
done

# strict 7 outputs path existence は親 / sub 個別に
node scripts/lib/phase12-compliance/verify-phase12-compliance.ts \
  --workflow-root "$WF"
node scripts/lib/phase12-compliance/verify-phase12-compliance.ts \
  --workflow-root "$WF/parallel-01-globals-css-rhythm"
```

### 2-4. 分離失敗時の典型 drift

- sub の Phase 11 evidence inventory が root 側にしか書かれていない → CI sub-root scan で missing-evidence FAIL。
- sub の `phase-12-compliance-check.md` が canonical 9 headings のうち 1 つを欠落 → `verify-compliance-file.ts` で FAIL。
- 親集約 compliance check が sub の status を `completed` と書いたが、sub 側は `runtime_pending` のまま → state drift。

---

## 3. 命名規約: `parallel-NN-*` / `serial-NN-*`

### 3-1. 使い分け

| prefix | 適用 | 意味 |
| --- | --- | --- |
| `parallel-NN-<slug>` | 互いに依存せず同時実行可能な sub-workflow（CSS port、primitive 実装、layout 実装など） | 並列実行レーン。`NN` は execution wave 番号ではなく **識別 ID**。順序保証なし |
| `serial-NN-<slug>` | 前段 sub の出力に依存する直列フェーズ（design SSOT 集約 / route binding / visual evidence 集約 / PR 作成） | 直列実行レーン。`NN` は **実行順序**。00 が最先、最大 99 |
| `serial-00-<slug>` | 全 parallel に先立つ準備段（design tokens 確定 / SCOPE 確定 / route map 提示） | 必ず 00 を使う |
| `serial-NN-regression-evidence` | parallel 結果を集約して visual evidence / Playwright / a11y を最終取得する終端段 | 通常 06-09 帯 |

### 3-2. ディレクトリ規約

```
docs/30-workflows/<workflow>/
├── artifacts.json                  # root 集約（sub_workflows map / gates）
├── index.md                        # 親 navigation
├── SCOPE.md                        # 親 SCOPE（全 sub を横断する不変条件）
├── outputs/                        # 親集約成果物（Phase 11/12 strict 7）
├── serial-00-design/               # 全 parallel の前提を確定する SSOT
├── parallel-01-<slug>/             # 並列 sub（順序フリー）
│   ├── artifacts.json              # sub_workflow フィールド必須
│   ├── phase-01-requirements.md ... phase-13-commit-pr.md
│   └── outputs/                    # sub 単位の Phase 11/12 outputs
├── parallel-02-<slug>/
├── ...
├── serial-05-<slug>/               # 直列 sub（parallel 終了後）
└── serial-07-regression-evidence/  # visual evidence / a11y 集約
```

### 3-3. 禁止パターン

- `parallel-NN` を実行順序として使う → 並列実行レーン仕様と矛盾。順序が必要なら `serial-NN`。
- `parallel-NN-*` の `NN` を 1 桁にする（`parallel-1-...`） → sort 順が崩れる。常に 2 桁 zero-padded。
- `serial-NN-*` に依存先 parallel が完了する前に着手する → root artifacts.json `sub_workflows` で blocked を明示する。

---

## 4. VISUAL_ON_EXECUTION: sub が runtime_pending / 親 serial-NN が visual evidence を集約

### 4-1. 想定シナリオ

CSS / primitive / layout など UI 変更を伴う parallel sub は、local では typecheck / lint / build /
grep gate / a11y 静的検証までしか取得できず、最終的な screenshot / Playwright visual diff は
親 workflow の `serial-NN-regression-evidence` で集約取得する。

### 4-2. visualEvidence の使い分け

| 値 | 配置 | 意味 |
| --- | --- | --- |
| `VISUAL` | sub artifacts.json | sub 単独で screenshot を取得し close-out |
| `VISUAL_ON_EXECUTION` | sub artifacts.json | local 実装は完了したが visual evidence は親 serial-NN で集約。`runtime_boundary` で集約先 sub を明示 |
| `NON_VISUAL` | sub artifacts.json | screenshot 不要（CSS hook / token SSOT / docs-only sub など） |
| `VISUAL` | root artifacts.json（集約観点） | 親 workflow 全体としては最終的に visual evidence で close-out する |

### 4-3. 状態遷移の典型 wave

```
[wave 1] parallel-01 sub:
  visualEvidence = VISUAL_ON_EXECUTION
  workflow_state: spec_created → runtime_pending
  Phase 1-10 completed / Phase 11 local NON_VISUAL evidence のみ取得
  runtime_boundary: "serial-07 visual evidence pending"

[wave 2] serial-07-regression-evidence sub:
  visualEvidence = VISUAL
  workflow_state: spec_created → runtime_pending → completed
  Phase 11 で全 parallel sub の selector / data-attr を集約 screenshot
  parallel-01..04 の runtime_boundary を解消し sub 側を completed に昇格

[wave 3] workflow root:
  workflow_state: spec_created → completed
  Gate-B / Gate-C 承認後、親 outputs/phase-11 / phase-12 を完了昇格
```

### 4-4. sub の `outputs/phase-11/` の最低構成（VISUAL_ON_EXECUTION）

```
parallel-NN-*/outputs/phase-11/
├── main.md                       # NON_VISUAL alternative evidence index
├── manual-smoke-log.md           # local 実行ログ要約
├── typecheck.log / lint.log / build.log
├── grep-*.txt                    # token / selector / arbitrary tailwind grep
├── verify-design-tokens.log      # CI gate local 実行
├── verify-pr-ready.log
└── PENDING_USER_GATE-screenshot.txt  # serial-NN で集約する旨を明示
```

screenshot 物理ファイルは sub 側に置かず、`PENDING_USER_GATE-*.txt` を物理配置して
集約先 sub-workflow path を本文に書く（[phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md) §user-gated runtime evidence 参照）。

### 4-5. 親 `serial-NN-regression-evidence` の責務

- 全 parallel sub の `outputs/phase-11/grep-selectors.txt` 等を集約 cross-reference する。
- Playwright visual diff / a11y / Lighthouse を sub_workflow を横断して 1 wave で取得し、
  `outputs/phase-11/<route>.png` の **物理 PNG** を tracked で配置する（Issue #746 path drift 対策）。
- 集約完了後、各 parallel sub の artifacts.json `runtime_boundary` を `null` に更新し、
  `workflow_state` を `completed` へ昇格する commit を同 wave に含める。

### 4-6. 失敗パターン（VISUAL_ON_EXECUTION 専用）

| 失敗 | 是正 |
| --- | --- |
| sub を `VISUAL` 宣言したまま local screenshot を取らずに close-out | `VISUAL_ON_EXECUTION` に再分類し `runtime_boundary` を明示。SKILL-changelog v2026.05.17-issue746 参照 |
| 親 serial 集約後に sub artifacts.json を更新せず置き去り | 集約 commit と同一 wave に sub の `runtime_boundary=null` / `status=completed` を含める |
| sub の Phase 11 evidence inventory に PNG path を書いたが物理ファイルが親側にしかない | sub 側は `PENDING_USER_GATE` placeholder のみ書き、PNG inventory は集約先 sub のみに置く |

---

## 関連

- [phase12-compliance-check-template.md](phase12-compliance-check-template.md): canonical 9 headings SSOT
- [phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md): NON_VISUAL / user-gated evidence
- [completed-tasks-policy.md](completed-tasks-policy.md): 親アーカイブ時の子 sub-workflow 同 wave 移動
- [workflow-state-vocabulary.md](workflow-state-vocabulary.md): `spec_created` / `runtime_pending` / `completed` boundary
- [patterns-parallel-ipc.md](patterns-parallel-ipc.md): 並列 _エージェント_ 実行（本 reference の sub-workflow 並列とは別軸）
