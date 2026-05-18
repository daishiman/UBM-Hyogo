# Lessons Learned — Phase 11 evidence existence validator (parser + path guard)

> 起源: Issue #730 phase11-evidence-existence-validator（2026-05-17）
> Feedback 源: `docs/30-workflows/issue-730-phase11-evidence-existence-validator/outputs/phase-12/skill-feedback-report.md`
> 関連: [references/phase-11-non-visual-alternative-evidence.md](../references/phase-11-non-visual-alternative-evidence.md) / [references/phase12-compliance-check-template.md](../references/phase12-compliance-check-template.md) / [references/phase-12-pitfalls.md](../references/phase-12-pitfalls.md)

## 適用条件

以下を **同時に満たす** タスクで本パターン（および実装上の知見）を参照する。

1. Phase 11 evidence inventory（`## 4. Phase 11 evidence file inventory` を含む `main.md` または `phase-11.md`）を生成する task
2. Phase 12 compliance CI gate（`verify-phase12-compliance`）が `outputs/phase-11/*.md` の inventory 表に列挙された evidence file の実在を機械検証する task
3. parser / validator を `scripts/lib/phase12-compliance/` 配下に追加する task
4. fixture を `scripts/__tests__/fixtures/phase12-compliance/` の pass / fail-missing-evidence の 2 系統で構成する task

## パターン本体

### 1. 番号付き見出しの normalize は parser の責務に固定する（L-IS730-PSR-001）

- Phase 11 main.md / phase-11.md は `## 4. Phase 11 evidence file inventory` のように **番号 prefix が必ず付く**
- parser 側で `^\d+\.\s+` を strip する `normalizeHeading()` を持ち、heading 比較は lowercase 化した文字列で行う
- 同時にバックティック (` ` `) を strip しないと `## \`Phase 11 evidence file inventory\`` 表記の drift を吸収できない
- **やってはいけない**: heading SSOT 側を `## Phase 11 evidence file inventory`（番号なし）に書き換えて parser を単純化する。番号は Phase 12 compliance テンプレ全体の SSOT（`references/phase12-compliance-check-template.md` の Required Sections 9 項目）と整合しているため、normalize で吸収する

実装: `scripts/lib/phase12-compliance/parse-phase11-evidence.ts` の `normalizeHeading()` + `PHASE11_INVENTORY_HEADING` 定数。

### 2. path traversal / 絶対 path は parser ではなく validator 側で拒否する（L-IS730-PSR-002）

- `parsePhase11EvidenceClaims()` は **文字列としての** evidence path を返すだけにする
- `verifyPhase11EvidenceExistence()` の `resolveEvidencePath()` で:
  - `isAbsolute(cleaned)` → `null` 返却（fail 扱い）
  - `relative(root, resolved)` が `..` で始まる → `null` 返却（workflow root 外への traversal を拒否）
  - workflow root と一致または prefix の場合のみ `repoRoot` 起点で resolve、それ以外は workflow root 起点
- `null` を返した evidence path は `missing[]` 配列に分類し、`status: present` 行でも fail とする
- **やってはいけない**: parser 側で path validation を行う。parser 単体テストを「文字列抽出」に閉じ込めることで、status drift（`Present` / `PRESENT`）と path traversal の責務を分離できる

実装: `scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts` L16-33 (`resolveEvidencePath()`)。

### 3. status は lowercase strict（`Present` を invalid 扱い）（L-IS730-PSR-003）

- `VALID_STATUSES = new Set(["present", "pending", "n/a"])` で **lowercase のみ valid**
- `Present` / `PRESENT` / `present ` のような表記 drift は `invalidStatuses[]` に分類し fail
- cell の前後 trim は parser 側で行う（`cleanCell()`）が、case fold は意図的に行わない
- 効果: heading SSOT （`references/phase-11-non-visual-alternative-evidence.md` L194-202）で `present` を canonical 表記として固定化し、テンプレ生成側の typo を CI で fail させる
- **やってはいけない**: lowercase 化を parser 側に入れて寛容にする。heading SSOT との同期を破壊する

### 4. 空 inventory / heading 不在の擬似 entry 集約（L-IS730-PSR-004）

- `parsePhase11EvidenceClaims()` が空配列を返した場合、validator 側で **`[{ classification: "Phase 11 evidence inventory", evidencePath: "<empty-or-missing-table>" }]`** という擬似 entry を `missing[]` に push する
- これにより CI fail message が「`<empty-or-missing-table>`」を含むことで、heading 不在 / 表本体不在 を一目で判別可能
- 0 件 evidence を「PASS」と取り違える事故（UBM-009 系の pitfall）を Phase 12 close-out 前に検出できる
- **やってはいけない**: 空 inventory を ok 扱いにする。NON_VISUAL でも最低 1 行（`L1 manual smoke` 等）が必須

実装: `verify-phase11-evidence-existence.ts` L46。

### 5. heading SSOT 同期 PR の必須化（L-IS730-PSR-005）

- parser の `PHASE11_INVENTORY_HEADING` を変更する PR は、必ず以下 3 ファイルを **同一 PR** で同期する:
  1. `scripts/lib/phase12-compliance/parse-phase11-evidence.ts`（定数）
  2. `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` L194-202（heading SSOT 表）
  3. `scripts/__tests__/fixtures/phase12-compliance/pass/outputs/phase-11/*.md`（fixture）
- 1 つでも欠けると CI gate が drift を検出して fail
- Phase 12 compliance template の Required Sections 9 項目（`v2026.05.11-issue603` で固定済み）と heading SSOT を二重管理しないため、numeric prefix は normalize 側で吸収する戦略を維持

### 6. fixture は pass / fail-missing-evidence の 2 系統で構成する（L-IS730-PSR-006）

| fixture | 目的 | 構成 |
| --- | --- | --- |
| `scripts/__tests__/fixtures/phase12-compliance/pass/` | green path 検証 | `outputs/phase-11/<evidence files>` を実在させ、`outputs/phase-12/phase12-task-spec-compliance-check.md` の inventory 表で `status: present` を宣言 |
| `scripts/__tests__/fixtures/phase12-compliance/fail-missing-evidence/` | red path 検証 | inventory 表で宣言した path が `outputs/phase-11/` に存在しない（または `status` が `Present` 大文字）状態を再現 |

- 両 fixture を node:test / vitest spec から差し替えて `verifyPhase11EvidenceExistence()` の return shape を assert する
- 新 evidence pattern（path traversal 試行、絶対 path 試行）を追加するときは fail fixture に row を追加し、pass fixture は触らない
- **やってはいけない**: 1 fixture に pass / fail を mix する。spec から fixture root を切り替える設計を維持する

### 7. status case 厳格化 + path 存在の同時 fail を許容（L-IS730-PSR-007）

- 1 行が「status invalid」「path missing」を **同時に満たす** ケースを許容する
  - 例: `| ... | foo.log | Present |`（path missing + case drift）
- validator return type は union ではなく `{ ok: false, missing: [...], invalidStatuses: [...] }` の **両配列同居** とする
- CI fail message では両方を列挙し、修正者が 1 回で全件直せるようにする

実装: `verify-phase11-evidence-existence.ts` L41-65。

## 必須チェック

- [ ] `parse-phase11-evidence.ts` の `normalizeHeading()` が番号 prefix・バックティック・空白・大小文字を全て吸収する
- [ ] `verify-phase11-evidence-existence.ts` の `resolveEvidencePath()` が絶対 path と `..` traversal を `null` で拒否する
- [ ] `VALID_STATUSES` は `present` / `pending` / `n/a` の **lowercase のみ**
- [ ] 空 inventory / heading 不在で `<empty-or-missing-table>` 擬似 entry が `missing[]` に含まれる
- [ ] heading SSOT 変更 PR で parser 定数 / heading reference / pass fixture の 3 ファイル同期がある
- [ ] fixture は `pass/` と `fail-missing-evidence/` の 2 系統で構成し、spec から root を差し替える
- [ ] invalid status と missing path が同一 row で発生した場合、両配列に分類される

## やってはいけないこと

- heading SSOT を `## Phase 11 evidence file inventory`（番号なし）へ書き換えて parser を単純化する
- parser 側に path validation / status case fold を入れて責務を曖昧化する
- 空 inventory / heading 不在を ok 扱いにする
- pass fixture と fail fixture を 1 ディレクトリに mix する
- `status: Present`（大文字始まり）を `present` と等価扱いにする

## 参照ファイル

- 実装: `scripts/lib/phase12-compliance/parse-phase11-evidence.ts`
- 実装: `scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts`
- types 拡張: `scripts/lib/phase12-compliance/types.ts`
- 統合: `scripts/lib/phase12-compliance/verify-compliance-file.ts`
- spec: `scripts/__tests__/verify-phase12-compliance.spec.ts`
- fixture (pass): `scripts/__tests__/fixtures/phase12-compliance/pass/outputs/phase-11/`
- fixture (fail): `scripts/__tests__/fixtures/phase12-compliance/fail-missing-evidence/`
- heading SSOT: `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` L194-202
- workflow: `docs/30-workflows/issue-730-phase11-evidence-existence-validator/`
- CI gate: `.github/workflows/verify-phase12-compliance.yml`
