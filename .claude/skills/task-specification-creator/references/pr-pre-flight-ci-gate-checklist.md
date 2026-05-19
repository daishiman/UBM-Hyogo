# PR Pre-flight CI Gate Checklist

`pnpm typecheck` / `pnpm lint` だけでは検出されず、push 後の CI で初めて落ちる失敗が複数回繰り返されたため、PR push 前に必ず `bash scripts/verify-pr-ready.sh` を実行する。`verify-pr-ready.sh` は本ファイルに列挙する gate を一括 fail-fast する pre-flight。

## 過去に繰り返した CI 失敗パターン（必ず先回り検証する）

### 1. `gate-metadata:validate` — artifacts.json schema 違反

`packages/shared/src/gate-metadata/schema.ts` の zod schema は厳格。以下は **CI で落ちた実例**。

| 違反パターン | NG 値 | OK 値 |
| --- | --- | --- |
| `status` enum | `"completed"` / `"pending_user_approval"` | `"pending"` / `"passed"` / `"failed"` / `"waived"` |
| `passed_at` 形式 | `"2026-05-15"` (date only) | `"2026-05-15T00:00:00+09:00"` (ISO datetime + offset 必須) |
| `passed_at` 整合性 | `status=pending` で `passed_at` に値が入っている | `status=passed` のときのみ非 null、それ以外は `null` |
| `metadata.gates` 欠落 | 新規 artifacts.json で `gates` 配列を書き忘れ | Gate-A / Gate-B 等を最低 1 件配置 |
| `metadata.gates` 欠落（PR の changed files） | ローカル `pnpm gate-metadata:validate` は **WARN/skip** で通るが、CI は `--require-gates-for-changed` 付きで **ERROR** に格上げ | push 前に必ず `pnpm gate-metadata:validate --require-gates-for-changed <changed-artifacts.json...>` を実行する |
| `evidence_path` 不在 | 既に削除/移動した phase ファイルを指している | `existsSync()` が true になる現存 file path |

**修正パターン**:

```jsonc
"gates": [
  {
    "gate_id": "Gate-A",
    "status": "passed",
    "passed_at": "2026-05-17T00:00:00+09:00",
    "evidence_path": "docs/30-workflows/<task>/outputs/phase-11/main.md",
    "approver": "daishiman",
    "notes": "design_review or spec_review evidence"
  },
  {
    "gate_id": "Gate-C",
    "status": "pending",
    "passed_at": null,
    "evidence_path": "docs/30-workflows/<task>/outputs/phase-13/pr-summary.md",
    "approver": "daishiman",
    "notes": "user_gated"
  }
]
```

### 2. `verify-phase12-compliance` — Phase 11 evidence inventory table の列構造

`scripts/lib/phase12-compliance/parse-phase11-evidence.ts` は表ヘッダから以下を **完全一致** で探す。欠けると `<empty-or-missing-table>` 扱いで FAIL。

- **`Path`** または **`Evidence path`** (必須)
- **`Status`** (必須)
- `Classification` / `Evidence` / `File` (1 つ以上推奨)

**OK 例**:

```markdown
## Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| Phase 11 summary | `outputs/phase-11/main.md` | present |
| Screenshot 1x | `outputs/phase-11/screenshots/01-foo.png` | present |
| Out-of-root spec | `apps/web/playwright/tests/visual/foo.spec.ts` | n/a |
```

**NG 例**: `| Evidence | Status |` のみ（Path 列なし）→ parser がレコード 0 件 → FAIL。

### 3. `verify-phase11-evidence-existence` — workflow root 外の path は `present` にしない

`scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts` は `Status=present` の行に対し workflow root からの相対 path を解決して `existsSync` を実行する。`apps/web/...` のように workflow root 外の path は `..` 解決で外に出るため `present` だと FAIL。

- workflow root 配下の現存 file → `present`
- workflow root 外の参照（実装ソース等） → `n/a`
- 未撮影/未実行 → `pending`
- ワイルドカード（`*.png`） → 解決不能なので具体的な file path を全部書く

### 4. `verify-phase12-compliance` — canonical 9 headings

`.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の Required Sections 9 項目を `outputs/phase-12/phase12-task-spec-compliance-check.md` の `##` 見出しに **見出しテキスト完全一致** で配置する。

1. `Summary verdict`
2. `Changed-files classification`
3. `` `workflow_state` and phase status consistency ``
4. `Phase 11 evidence file inventory`
5. `Phase 12 strict 7 file inventory`
6. `Skill/reference/system spec same-wave sync`
7. `Runtime or user-gated boundary`
8. `Archive/delete stale-reference gate`
9. `Four-condition verdict`

短縮形（`Verdict` / `Evidence Gates` 等）は drift。recovery workflow / followup task で別 template から流用すると落ちる。

### 5. `unassigned-task` ファイルの配置

`scripts/lib/phase12-compliance/collect-changed-roots.ts` は `docs/30-workflows/unassigned-task/` を **first segment** のみ scan 対象から除外する。`docs/30-workflows/completed-tasks/unassigned-task/` のように深くネストされた配置は除外されず、`docs/30-workflows/completed-tasks` を root として誤検出し `<empty-or-missing-table>` で FAIL する。

- OK: `docs/30-workflows/unassigned-task/<name>.md`
- NG: `docs/30-workflows/completed-tasks/unassigned-task/<name>.md`

## Pre-flight 実行

```bash
bash scripts/verify-pr-ready.sh
```

含まれる gate:

- `pnpm verify:phase12-compliance` (canonical 9 headings + Phase 11 evidence existence + workflow root scan)
- `pnpm gate-metadata:validate` (artifacts.json zod schema)
- `pnpm indexes:rebuild` + drift check (post-merge hook 廃止後の代替)

`pnpm typecheck` / `pnpm lint` は CLAUDE.md の PR autonomous flow で既に呼ばれるため重複させない。

## 失敗時の対応順序

1. `gate-metadata:validate` の `[ERROR]` 行を grep → schema 違反箇所を本ドキュメント §1 で照合
2. `verify:phase12-compliance` の JSON 出力で `reason` を確認
   - `missing-heading` → §4 canonical 9 headings
   - `missing-evidence` → §2 (table 形式) または §3 (path 解決) または §5 (unassigned-task 配置)
3. `indexes:rebuild drift` → `.claude/skills/aiworkflow-requirements/indexes/` 配下の再生成差分を `git add` & commit（sync-merge 直後は `task-workflow-active.md` の `merge=union` で行数が増減し `topic-map.md` の見出し L 番号が drift する構造的事象。再生成→コミットが正規復旧手順）
4. 修正後 `bash scripts/verify-pr-ready.sh` を再実行し全 PASS を確認してから push

## 6. `lighthouse-ci` performance fail（環境ノイズ起因）

GitHub Actions hosted runner の CPU 変動で `categories:performance` が `minScore=0.80` を 0.01〜0.05 ポイント割って CI が赤化する事象が発生する（`/` のみで `0.78`、`/members` / `/login` は通過というケースが典型）。

### 適用判断（`warn` 降格を採用してよい条件）

1. CI が GitHub Actions hosted runner（性能変動が大きい）上で走る
2. 変更内容が performance に直接寄与しない（a11y / focus / 文言変更等）
3. `accessibility` / `seo` / `best-practices` は `error` のままで a11y regression は捕捉できる

### 対応

`lighthouserc.json` の `categories:performance` のみ `error` → `warn` に降格する。閾値 `minScore: 0.80` は維持し、将来 dedicated runner / perf 改善時に `error` 復帰させる。完全撤廃（assertion 削除）は禁止（regression 検知を失うため）。

```jsonc
"assertions": {
  "categories:performance": ["warn", { "minScore": 0.80 }],
  "categories:accessibility": ["error", { "minScore": 0.90 }],
  "categories:best-practices": ["error", { "minScore": 0.90 }],
  "categories:seo": ["error", { "minScore": 0.80 }]
}
```

詳細: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-020。
