# Phase 12: 正本同期 / 実装ガイド

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase は (a) 後続実装者が一気通貫で着手できる「実装ガイド（Part 1 中学生レベル / Part 2 技術者レベル）」の作成、(b) strict 7 outputs に沿った正本同期、(c) CONST_005 必須項目の集約再掲、を実施する。実コード（CLAUDE.md / ADR / skill changelog）への追記も同 Phase で行う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | vitest.config の test/spec 二段階対応を spec 単一に収斂 (issue-623) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | 正本同期 / 実装ガイド |
| 作成日 | 2026-05-12 |
| 担当 | delivery |
| 前 Phase | 11（Evidence 収集） |
| 次 Phase | 13（PR 作成と振り返り） |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL |
| GitHub Issue | #623（CLOSED — Refs として参照） |

---

## 目的

Phase 1〜11 で生成した設計・実装・evidence を、(a) 正本ドキュメント（CLAUDE.md / ADR / skill spec）へ反映、(b) 後続実装者が読めば一気通貫で再現可能な `implementation-guide.md` を提供、の 2 軸で完成させる。

---

## 12-A. 中学生レベル概念説明（Part 1）

### なぜテストファイル名を `*.spec` だけにするのか

学校で「テスト用紙」と「練習プリント」を同じ箱に入れていたら、先生がどっちを採点するか毎回迷う。本タスクは「テスト用紙の名前を全部『spec』というシールに貼り替える」作業。

- **二段階対応（旧状態）**: テスト用紙には `test` シールと `spec` シールが両方貼られていて、先生（vitest）はどちらも採点していた。混乱の元。
- **spec 単一収斂（新状態）**: 「これからは `spec` シールだけ。練習プリント（モック・fixture）は対象外」と決め、シール貼り替え機（`git mv`）で 159 枚を一気に貼り替える。
- **CI gate（再混入防止）**: 「次から `test` シールを誰かが貼ろうとしたら、教室の入口で自動的にダメ出しする門番（lefthook / GitHub Actions）」を設置する。

### なぜ `*.test.ts` を CI で reject するのか

「家のルールを紙に貼っただけ」では、来月誰かが破る。本タスクは **構造的に破れない** ようにする:

1. **入口の門番（lefthook pre-commit）**: 家のドアに鍵をつける。ローカルで `*.test.ts` を commit しようとした瞬間に拒否される。
2. **マンションの管理人（GitHub Actions）**: 鍵を無視して入ってきた人（`--no-verify`）がいても、エレベーター（PR）で必ず確認される。

両方の関門が揃って初めて「もう `*.test.ts` は二度と入ってこない」と言える。

### なぜ rename と config 編集を同じ PR にまとめるのか

家具を運び出す前に部屋のドアを狭めると、家具が引っかかって出せなくなる。同じく:

- 先に `vitest.config.ts` を `*.spec` 単一に絞ると、まだ `*.test.ts` の名前で残っているファイルがテスト対象から外れる（silent skip = テストが消えたことに誰も気づかない）
- 先に rename だけして config を絞らないと、新規 `*.test.ts` 追加が引き続き許可されてしまう

順序: **rename 全件完了 → config 編集 → CI gate 投入** を 1 PR にまとめる。

---

## 12-B. 技術者レベル詳細（Part 2 / 実装ガイド）

### B-1. アーキテクチャ

```
[開発者]
   │ git add *.test.ts
   ▼
[lefthook pre-commit]
   │ block-test-suffix.sh が staged ファイルを scan
   │ 検出時 → exit 1（reject）
   ▼
[git commit 成立]
   │ git push
   ▼
[GitHub Actions: verify-test-suffix.yml]
   │ find ベースで全リポジトリ scan
   │ 検出時 → job fail
   ▼
[PR mergeable]
```

### B-2. 実装手順（CONST_005 必須項目を集約再掲）

> 後続実装者は本セクションをコピペで一気通貫実行できる。

#### Step 0: 着手前提

```bash
git checkout dev
git pull origin dev
git checkout -b feat/issue-623-vitest-spec-suffix-convergence
mise install
mise exec -- pnpm install
```

#### Step 1: rename 前 baseline 取得

```bash
mkdir -p outputs/phase-09 outputs/phase-11/evidence-bundle
# *.test.ts(x) 件数
find . -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) \
  -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.open-next/*' \
  | tee outputs/phase-11/evidence-bundle/ac-1-find-before.txt
wc -l outputs/phase-11/evidence-bundle/ac-1-find-before.txt
# 期待 159

# vitest discovery JSON
mise exec -- pnpm test --run --reporter=json > outputs/phase-09/test-discovery-before.json

# coverage baseline
mise exec -- pnpm test --run --coverage --reporter=json-summary > outputs/phase-09/coverage-before.json
```

#### Step 2: rename 補助スクリプト作成（T-01）

`scripts/migration/rename-test-to-spec.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

target_dir="${1:?usage: rename-test-to-spec.sh <path> [--dry-run]}"
dry_run="${2:-}"

if [ ! -d "$target_dir" ]; then
  echo "Path not found: $target_dir" >&2
  exit 2
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is dirty. Commit or stash first." >&2
  exit 1
fi

count=0
while IFS= read -r -d '' f; do
  new="${f/.test.ts/.spec.ts}"
  new="${new/.test.tsx/.spec.tsx}"
  if [ "$dry_run" = "--dry-run" ]; then
    echo "would: git mv $f $new" >&2
  else
    git mv "$f" "$new"
  fi
  count=$((count + 1))
done < <(find "$target_dir" -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) \
  -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.open-next/*' -print0)

echo "$count"
```

```bash
chmod +x scripts/migration/rename-test-to-spec.sh
git add scripts/migration/rename-test-to-spec.sh
git commit -m "chore(test): add rename-test-to-spec.sh helper"
```

#### Step 3: rename 一括実行（T-02 〜 T-07）

```bash
bash scripts/migration/rename-test-to-spec.sh apps/web
git commit -m "refactor(test): rename apps/web *.test.ts(x) to *.spec"

bash scripts/migration/rename-test-to-spec.sh apps/api
git commit -m "refactor(test): rename apps/api *.test.ts(x) to *.spec"

bash scripts/migration/rename-test-to-spec.sh packages/shared
git commit -m "refactor(test): rename packages/shared *.test.ts(x) to *.spec"

bash scripts/migration/rename-test-to-spec.sh packages/integrations
git commit -m "refactor(test): rename packages/integrations *.test.ts(x) to *.spec"

bash scripts/migration/rename-test-to-spec.sh scripts
git commit -m "refactor(test): rename scripts *.test.ts to *.spec"

bash scripts/migration/rename-test-to-spec.sh .claude/skills
git commit -m "refactor(test): rename skill fixtures *.test.ts to *.spec"
```

#### Step 4: indexes 再生成 + import path 修正（T-08 / T-09）

```bash
mise exec -- pnpm indexes:rebuild
git add .claude/skills/aiworkflow-requirements/indexes
git commit -m "chore(skills): regenerate indexes after suffix rename" || echo "no diff"

# import path 影響評価
grep -rE "from ['\"].+\.test['\"]" apps packages scripts || echo "no import path to fix"
# ヒットがあれば該当ファイルを編集後 commit
```

#### Step 5: `vitest.config.ts` 収斂（T-10）

`vitest.config.ts` を Phase 2 D-2 通りに編集:

```diff
- "apps/**/src/**/*.{test,spec}.{ts,tsx}",
+ "apps/**/src/**/*.spec.{ts,tsx}",
- "apps/**/app/**/*.{test,spec}.{ts,tsx}",
+ "apps/**/app/**/*.spec.{ts,tsx}",
- "apps/**/migrations/**/*.{test,spec}.ts",
+ "apps/**/migrations/**/*.spec.ts",
- "packages/**/src/**/*.{test,spec}.{ts,tsx}",
+ "packages/**/src/**/*.spec.{ts,tsx}",
- "scripts/**/*.{test,spec}.ts",
+ "scripts/**/*.spec.ts",
...
- "**/*.test.{ts,tsx}",
  "**/*.spec.{ts,tsx}",
```

```bash
git add vitest.config.ts
git commit -m "chore(test): collapse vitest include/exclude to *.spec only"
```

#### Step 6: `block-test-suffix.sh` 実装（T-11）

`scripts/hooks/block-test-suffix.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

violations=$(git diff --cached --name-only --diff-filter=AM \
  | grep -E '\.test\.(ts|tsx)$' \
  | grep -v '/node_modules/' || true)

if [ -n "${violations}" ]; then
  echo "🚫 新規テストファイルは *.spec.{ts,tsx} のみ許可されています。" >&2
  echo "${violations}" >&2
  exit 1
fi
exit 0
```

```bash
chmod +x scripts/hooks/block-test-suffix.sh
bash -n scripts/hooks/block-test-suffix.sh  # syntax check
git add scripts/hooks/block-test-suffix.sh
git commit -m "feat(hooks): add block-test-suffix pre-commit guard"
```

#### Step 7: `lefthook.yml` 配線（T-12）

`lefthook.yml` の `pre-commit.commands` に Phase 2 D-3 通り `block-test-suffix` を追加。

```bash
git add lefthook.yml
git commit -m "chore(hooks): wire block-test-suffix into lefthook"

# 動作確認（戻し付き）
git checkout -b _verify_block_test_suffix
cat > apps/api/src/__tests__/dummy-block-gate.test.ts <<'EOF'
import { describe, it } from 'vitest';
describe('d', () => it('n', () => {}));
EOF
git add apps/api/src/__tests__/dummy-block-gate.test.ts
git commit -m "verify(test): exercise gate" 2>&1 | tee outputs/phase-09/gate-pre-commit-log.txt || true
git restore --staged apps/api/src/__tests__/dummy-block-gate.test.ts
rm -f apps/api/src/__tests__/dummy-block-gate.test.ts
git checkout feat/issue-623-vitest-spec-suffix-convergence
git branch -D _verify_block_test_suffix
```

#### Step 8: `verify-test-suffix.yml` 追加（T-13）

`.github/workflows/verify-test-suffix.yml` を Phase 2 D-4 雛形通りに新規追加。

```bash
git add .github/workflows/verify-test-suffix.yml
git commit -m "ci: add verify-test-suffix workflow"
```

#### Step 9: 品質ゲート（Phase 10）

```bash
mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-10/g4-typecheck.txt
mise exec -- pnpm lint 2>&1 | tee outputs/phase-10/g5-lint.txt
mise exec -- pnpm test --run --reporter=json > outputs/phase-10/g6-vitest.json
mise exec -- pnpm test --run --coverage --reporter=json-summary > outputs/phase-10/g7-coverage-after.json

# Phase 10 SOP に従って G-1〜G-8 を確認
```

#### Step 10: Evidence 収集（Phase 11）

Phase 11 11-3 の転写スクリプトを実行し、`outputs/phase-11/evidence-bundle/` を埋める。

#### Step 11: docs 追記（T-14 〜 T-16, AC-8）

**CLAUDE.md** 「重要な不変条件」セクションに 1 行追加:

```
8. 新規テストファイルは `*.spec.{ts,tsx}` のみ許可。`*.test.ts(x)` は CI gate（lefthook + GitHub Actions）で reject される。
```

**ADR** (`docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md`) 末尾追記:

```markdown
## 2026-05-12 update (issue-623)
- 二段階対応（*.{test,spec} 並存）を終了。
- vitest.config.ts の test.include / coverage.exclude を *.spec.{ts,tsx} 単一に収斂。
- 159 件の *.test.ts(x) を git mv で rename 完了。
- 再混入を block する CI gate を導入: scripts/hooks/block-test-suffix.sh + .github/workflows/verify-test-suffix.yml。
```

**skill changelog** (`.claude/skills/task-specification-creator/SKILL-changelog.md` および `.claude/skills/aiworkflow-requirements/SKILL-changelog.md`):

```
2026-05-12 issue-623: test suffix を *.spec 単一に収斂。新規 *.test.ts(x) 追加は禁止。
```

```bash
git add CLAUDE.md docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md .claude/skills/task-specification-creator/SKILL-changelog.md .claude/skills/aiworkflow-requirements/SKILL-changelog.md
git commit -m "docs(issue-623): record suffix convergence in CLAUDE.md / ADR / skill changelog"
```

#### Step 12: unassigned-task ファイル移動（T-17）

原典タスクは Phase 12 close-out で consumed として以下へ移動済み:

```text
docs/30-workflows/completed-tasks/task-issue-325-followup-003-vitest-spec-suffix-convergence.md
```

### B-3. シグネチャ（CONST_005）

| 名称 | I/F | 入力 | 出力 | 終了コード |
| --- | --- | --- | --- | --- |
| `scripts/hooks/block-test-suffix.sh` | bash | (なし) | stderr: 検出ファイル一覧 | 0 / 1 |
| `scripts/migration/rename-test-to-spec.sh` | bash | `$1=path`、`--dry-run` 任意 | stdout: rename 件数 / stderr: 一覧 | 0 / 1 / 2 |
| `.github/workflows/verify-test-suffix.yml` の `verify` job | YAML job | checkout 済み repo | (なし) | step exit code を反映 |

### B-4. 不変条件再掲

1. rename は `git mv` で実施し、history 保持
2. lefthook command 名は `block-test-suffix` 固定、bash script は `scripts/hooks/block-test-suffix.sh` 固定
3. workflow ファイル名は `.github/workflows/verify-test-suffix.yml` 固定
4. 既存 hook を改変せず独立 step として並列追加
5. coverage delta ±0.5pt 以内
6. rename と config 編集と CI gate を同一 PR にまとめる
7. `__tests__` ディレクトリ名は変更しない
8. fixture / mock 等 test 本体以外のファイル名は変更しない

---

## 12-C. strict 7 outputs

| # | output | 出力先 |
| --- | --- | --- |
| 1 | main.md | `outputs/phase-12/main.md` |
| 2 | implementation-guide.md | `outputs/phase-12/implementation-guide.md`（Part 1 + Part 2） |
| 3 | system-spec-update-summary.md | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | skill-feedback-report.md | `outputs/phase-12/skill-feedback-report.md` |
| 5 | phase12-task-spec-compliance-check.md | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 6 | documentation-changelog.md | `outputs/phase-12/documentation-changelog.md` |
| 7 | unassigned-task-detection.md | `outputs/phase-12/unassigned-task-detection.md` |

### 12-C-1. system-spec-update-summary.md

| Step | 内容 |
| --- | --- |
| 1-A | implemented-local close-out として aiworkflow-requirements / task-specification-creator の discovery 台帳へ workflow root を登録 |
| 1-B | root 状態は `implemented_local_runtime_pending` / `IMPLEMENTED_LOCAL_RUNTIME_PENDING` へ昇格。full `pnpm test --run` parity は runtime pending として分離 |
| 1-C | 関連タスク（issue-325 / unassigned-task）との関係を「source unassigned consumed / completed-tasks 移動」として記録 |
| Step 2 判定 | 新規 API なし / D1 schema 変更なし / UI 変更なし。正本反映は workflow 登録と suffix gate 実装契約の導線化のみ |

### 12-C-2. skill-feedback-report.md（5 カテゴリ）

| カテゴリ | 学び |
| --- | --- |
| 実装 | rename は `git mv` 一括でも 159 件規模なら安全。`R100` の検出に依存するので contents 変更との同時 commit は禁止 |
| セキュリティ | suffix gate は機密ではないが、CI gate の独立性（`--no-verify` 回避を別レイヤで担保）が再混入防止の決め手 |
| 運用 | 二段階対応の恒久化は「過渡期表現を ADR に書くだけ」では消えない。CI gate で構造化しないと必ず再混入する |
| 設計 | lefthook の `parallel: true` の前提で hook 同士の state 共有を作らない設計が後方互換に効く |
| ツール | `find -name '*.test.ts(x)'` + `grep -v node_modules` + `grep -v .next` + `grep -v .open-next` の 3 段除外がリポジトリ走査の標準形 |

### 12-C-3. phase12-task-spec-compliance-check.md

| # | 項目 | 結果 |
| --- | --- | --- |
| 1 | Phase 1〜13 仕様ファイルが存在し、root 状態が `implemented_local_runtime_pending` として一貫 | [ ] |
| 2 | strict 7 outputs が実ファイルとして出力済み | [ ] |
| 3 | Step 1-A の aiworkflow discovery 登録が同一 wave で完了 | [ ] |
| 4 | Step 1-B で artifacts.json / index.md / phase header が `implemented_local_runtime_pending` に整合 | [ ] |
| 5 | Step 1-C で issue-325 / source unassigned consumed 境界を記録 | [ ] |
| 6 | Step 2 N/A の根拠（API / DB / UI 変更なし）が記録 | [ ] |
| 7 | Phase 11 AC-1〜AC-6 / AC-8 は local evidence、AC-7 は runtime pending として分離 | [ ] |
| 8 | root / `outputs/artifacts.json` parity を記録 | [ ] |
| 9 | 不変条件（git mv / 固定命名 / 独立 hook / coverage ±0.5pt） に違反していない | [ ] |
| 10 | source unassigned は completed-tasks へ移動済みで、Phase 13 は user-gated として残る | [ ] |

### 12-C-4. documentation-changelog.md

```markdown
# issue-623 changelog (2026-05-12)

## workflow-local
### 新規
- docs/30-workflows/issue-623-vitest-spec-suffix-convergence/index.md / phase-01〜13.md / artifacts.json
- outputs/phase-01〜13 配下成果物

### 更新
- docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md（履歴追記）
- docs/30-workflows/unassigned-task/task-issue-325-followup-003-*.md は実装完了後に docs/30-workflows/completed-tasks/ へ移動予定（spec_created 時点では未移動）

## global skill sync (.claude/skills/)
- task-specification-creator/SKILL-changelog.md
- aiworkflow-requirements/SKILL-changelog.md
- aiworkflow-requirements/indexes/* / references/task-workflow-active.md（spec discovery 登録）

## コード
### 新規
- scripts/migration/rename-test-to-spec.sh
- scripts/hooks/block-test-suffix.sh
- .github/workflows/verify-test-suffix.yml

### 編集
- vitest.config.ts（include / coverage.exclude）
- lefthook.yml（block-test-suffix command 追加）
- CLAUDE.md（不変条件 +1 行）

### rename（git mv 159 件）
- apps/web 83 件 / apps/api 6 件 / packages/shared 17 件 / packages/integrations 11 件 / scripts 35 件 / .claude/skills 7 件
```

### 12-C-5. unassigned-task-detection.md

```markdown
# issue-623 完了サマリー

## タスク
vitest.config の test/spec 二段階対応を spec 単一に収斂

## 期間
2026-05-12 開始 〜 (完了日)

## 成果
- issue-623 の実装を Phase 1〜13 と strict 7 outputs で close-out
- rename / vitest.config 収斂 / lefthook / GitHub Actions / docs 追従の順序制約を確定
- local evidence と runtime pending evidence を分離し、AC-7 を runtime PASS 扱いしない
- aiworkflow-requirements discovery 台帳へ implemented-local workflow として登録

## 影響範囲
- リポジトリ全体（rename）
- vitest.config.ts / lefthook.yml / .github/workflows / scripts/hooks / scripts/migration
- docs（issue-325 ADR / unassigned-task → completed-tasks 移動）
- .claude/skills（LOGS / indexes 再生成）

## 後続タスクへの引き継ぎ
- 実装完了後に `*.test.ts(x)` rename / config 収斂 / CI gate 導入 / CLAUDE.md・ADR 追記を行う
- `__tests__` ディレクトリ整理は scope 外
- Playwright / Storybook の suffix 規約は scope 外
- coverage threshold 見直しは scope 外
```

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 11 evidence | AC-8 evidence を本 Phase の commit 後に確定 | `outputs/phase-11/evidence-bundle/ac-8-docs-diff.txt` を Phase 12 完了直後に再取得 |
| Phase 13 PR | strict 7 outputs を PR 本文の Evidence セクションに引用 | パス固定 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | strict 7 outputs ルール |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | 同期手順 |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/outputs/phase-11/ | AC evidence 入力 |
| 必須 | docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md | ADR 追記対象 |
| 必須 | CLAUDE.md | 追記対象 |
| 参考 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-12.md | フォーマット参考 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 概要 |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1 + Part 2 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | Step 1-A〜Step 2 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 5 カテゴリ |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 10 チェック項目 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 変更ファイル一覧 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 完了サマリー |
| 更新 | CLAUDE.md | 不変条件 +1 行 |
| 更新 | docs/30-workflows/issue-325-.../test-file-suffix-adr.md | 履歴追記 |
| 更新 | .claude/skills/task-specification-creator/SKILL-changelog.md | issue-623 spec_created formalization 行 |
| 更新 | .claude/skills/aiworkflow-requirements/SKILL-changelog.md | 同上 |
| 更新 | .claude/skills/aiworkflow-requirements/indexes/* / references/task-workflow-active.md | discovery 登録 |
| 未移動 | docs/30-workflows/unassigned-task/task-issue-325-followup-003-*.md | 実装完了後に completed-tasks へ移動 |

---

## 完了条件

- [ ] strict 7 outputs が全て `outputs/phase-12/` に存在
- [ ] implementation-guide.md が Part 1（中学生）+ Part 2（技術者）の 2 部構成
- [ ] aiworkflow-requirements / task-specification-creator discovery 台帳が更新済み
- [ ] artifacts.json / index.md / Phase 12 outputs が `spec_created` として整合
- [ ] phase12-task-spec-compliance-check.md の 10 項目が `spec_created` suffix 付きで判定済み
- [ ] `outputs/artifacts.json` 不在時の root-only parity が明記済み
- [ ] unassigned-task ファイル未移動の理由と実施条件が記録済み

---

## aiworkflow-requirements 参照セクション

| 参照対象 | 用途 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/testing.md` | 規約追記対象（存在する場合） |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | rename 後の再生成対象 |
| `.claude/skills/task-specification-creator/references/resource-map.md` | resource-map 更新候補 |

---

## タスク 100% 実行確認【必須】

- [ ] 全仕様化タスクが `spec_created` として整合
- [ ] strict 7 outputs + discovery 更新が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-12 を `spec_created` として維持

---

## 次 Phase 引き継ぎ事項

- 次: Phase 13（PR 作成と振り返り）
- 引き継ぎ事項: documentation-changelog.md → PR 本文「変更点」、unassigned-task-detection.md → PR 本文「Summary」、implementation-guide.md → PR レビュア向け参照
- ブロック条件: strict 7 outputs に欠落 / mirror parity 未解消 / CLAUDE.md / ADR / skill changelog 追記未完了

## 実行タスク

- strict 7 outputs と same-wave discovery sync を作成する。
