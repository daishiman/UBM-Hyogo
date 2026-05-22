# Skill Feedback Report — Issue #608 E2E Quality Uplift Stage 3

> Workflow: `docs/30-workflows/e2e-quality-uplift-stage-3/`
> Phase: 12（監査フェーズ・read-only）
> 対象スコープ: `.claude/skills/{aiworkflow-requirements, github-issue-manager, task-specification-creator, skill-creator}`
> 編集禁止: 本 Phase は分析のみ。実反映は Phase 2 別エージェントが担当する。

---

## 0. 監査サマリ

| 観点 | 結果 |
|------|------|
| Stage 3 で新規確立した知見 | branch protection desired-state manifest（`.github/branch-protection/{dev,main}.json` + `apply.sh`）、`verify-branch-protection.sh` による drift gate、Lighthouse `nohup` + `pnpm dlx wait-on` readiness |
| 既存スキルでカバー済の領域 | NON_VISUAL × user-gated mutation の Phase 11/13 分割（L-554-002）、contexts-only adapter pattern（L-554-001）、tier-aware coverage 分離（L-E2EQU-003） |
| 新規スキル化候補 | 1 件（branch-protection-governance ＝ 後述「優先度 Medium・保留推奨」） |
| テンプレート準拠（Stage 3 Phase 12 strict 7） | 7/7 PASS（implementation-guide / documentation-changelog / main / phase12-task-spec-compliance-check / unassigned-task-detection / system-spec-update-summary / skill-feedback-report） |

---

## 1. 優先度別スキル改善リスト

### Priority 1（High）: `aiworkflow-requirements`

**現状の不足**

1. `lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md` は Stage 0-2 中心。Stage 3 で確立した「desired-state manifest pattern」「verify script による idempotent drift check」「Lighthouse local readiness」の 3 知見が Stage 0-2 lesson に混じったまま昇格していない。
2. `references/` 配下に **branch protection manifest（`.github/branch-protection/`）の正本参照ポインタ**が無い。`branch-protection.md` は GitHub API の payload 不変条件のみ記述し、リポジトリ内 desired manifest の存在を反映していない。
3. `indexes/keywords.json` に `desired-state manifest`, `apply.sh`, `verify-branch-protection.sh`, `lighthouse readiness`, `nohup wait-on` 等の Stage 3 固有キーワードが未登録（Phase 2 で要確認）。
4. `references/task-workflow-active.md`（1238 行）に Stage 3 完了行が Phase 13 land 後に追記必要。

**具体的な追記/新規作成案**

| パス | 内容 | 種別 |
|------|------|------|
| `lessons-learned/lessons-learned-e2e-quality-uplift-stage-3-2026-05.md` | L-E2EQU3-001 `desired-state manifest + apply.sh + verify.sh` 三点セット pattern / L-E2EQU3-002 Lighthouse CI `nohup`+`wait-on` readiness / L-E2EQU3-003 aggregate gate（`e2e-tests-coverage-gate`）で required contexts 最小化 | 新規追加 |
| `references/branch-protection-desired-state-manifest.md` | `.github/branch-protection/{dev,main}.json` を正本、`apply.sh` を adapter、`verify-branch-protection.sh` を drift gate と位置付ける canonical 参照 | 新規作成 |
| `references/branch-protection.md` | 上記 manifest reference への双方向リンク 1 行追記 | 既存追記 |
| `indexes/keywords.json` | `desired-state manifest`, `apply.sh`, `verify-branch-protection.sh`, `e2e-tests-coverage-gate`, `lighthouse readiness`, `nohup wait-on` を追加 | 既存追記 |
| `indexes/resource-map.md` / `quick-reference.md` | 上記 reference 新規 row 追加 | 既存追記 |
| `changelog/20260512-issue608-stage3-branch-protection-drift-gate.md` | Stage 3 land 時の changelog（Phase 13 完了後に Phase 2 が追加） | 新規追加 |

**理由**: Stage 0-2 と Stage 3 では「実装責務 vs governance 責務」が異なり、教訓を同一ファイルに混ぜると検索性が落ちる。Stage 3 は branch protection governance が主題のため独立 lesson が望ましい。

---

### Priority 2（High）: `task-specification-creator`

**現状の不足**

1. `references/non-visual-irreversible-task-rules.md`（179 行）に **「desired-state manifest を repo 内に置く governance task は Phase 11 を before/after の 2 split で必須化」** という具体テンプレが無い。Issue #554 の lesson L-554-002（before/after split）は概念的だが、manifest ファイル付き governance task の Phase 11 構成例が未提供。
2. `references/phase12-compliance-check-template.md`（61 行）の strict 7 outputs テンプレに、**「Phase 12 中学生レベル説明（Part 1）の governance task 向け簡易表現例」** が無い。Stage 3 の `implementation-guide.md` Part 1（「鍵を少なくして、守る範囲は減らさない設計」）は良例だが、テンプレ化されていない。
3. `references/coverage-standards.md` の tier 定義は Stage 0-2 で導入済だが、**aggregate gate（`e2e-tests-coverage-gate`）で複数 required contexts を 1 個に集約する pattern** がドキュメント化されていない。

**具体的な追記/新規作成案**

| パス | 内容 | 種別 |
|------|------|------|
| `references/non-visual-irreversible-task-rules.md` | §「Desired-state manifest pattern」を追記: ①repo 内 JSON manifest が正本 ②`apply.sh` は fresh GET + replace target + preserve other fields ③`verify.sh` は read-only drift gate ④Phase 11 は before snapshot を read-only 取得、after は Phase 13 user gate 後 | 既存追記（+30 行・合計 209 行で 500 行未満維持） |
| `references/phase12-governance-explanation-template.md` | 中学生レベル説明の governance task 向け 5 パターン例（鍵比喩、関門比喩、二重ロック比喩 等）。Stage 3 の「鍵」比喩を canonical 例に採用 | 新規作成（推定 80 行） |
| `references/coverage-standards.md` | §「Aggregate gate pattern」を追記: matrix の各 job ではなく `*-coverage-gate` 等の集約 job を required context にするポリシー | 既存追記 |
| `references/phase-11-non-visual-alternative-evidence.md` | external mutation × user gate の before/after split template（L-554-002 の将来アクション）を Stage 3 の `before-{dev,main}-protection.json` 実装例で具体化 | 既存追記 |

---

### Priority 3（Medium）: `github-issue-manager`

**現状の不足**

1. SKILL.md frontmatter Trigger に `branch protection drift`, `enforce_admins drift`, `lock_branch drift`, `required_status_checks drift`, `separate-PR remediation`, `O-2 同 PR 修正禁止` は既登録（L18-19）。**Stage 3 で確立した `desired-state manifest`, `apply.sh`, `verify-branch-protection.sh`, `aggregate gate context name change` の trigger は未登録**。
2. `scripts/` 配下に branch protection 系の gh CLI ヘルパー（例: `verify_branch_protection.js` / `apply_branch_protection.js`）が無い。Stage 3 では bash script で運用しているが、Issue 起票時に自動付随する `gh api` snippet を skill 化する余地あり。
3. Issue 自動起票 hook の対象が「タスク仕様書 → Issue」中心で、**「branch protection drift 検知 → 自動 Issue 起票」** の reverse trigger pattern が未対応。

**具体的な追記/新規作成案**

| パス | 内容 | 種別 |
|------|------|------|
| `SKILL.md` frontmatter | Trigger に `desired-state manifest`, `apply.sh`, `verify-branch-protection.sh`, `aggregate gate`, `e2e-tests-coverage-gate` を追記（既存 L18-19 governance drift 群の隣に並べる） | 既存追記 |
| `references/branch-protection-drift-issue-template.md` | `verify-branch-protection.sh` が non-zero exit した場合に起票する Issue template（title prefix `[drift]`、body に diff、labels: governance, drift） | 新規作成（推定 60 行） |
| `scripts/create_drift_issue.js`（候補） | CI から呼ばれる verify script の non-zero exit を受けて idempotent に drift Issue を起票（タイトル prefix で重複防止） | 新規作成候補（Phase 2 で要否判断） |

**注意**: scripts 追加は skill scope を肥大化させる懸念あり。Phase 2 で「SKILL.md trigger 追記 + reference 新規 1 本」までに留めるか、scripts まで踏み込むか要判断。

---

### Priority 4（Low）: `skill-creator`

**現状の不足**

1. `references/patterns.md`（7735 行）が肥大化。Stage 3 知見はここに追記するべきでなく、別 reference に分割すべき（既に分割済 `patterns-*.md` 群あり）。
2. `references/skill-structure.md` に **「governance / drift detection 系スキルの構造テンプレ」** が無い。新規スキル化候補（branch-protection-governance 等）を立てる際の指針が欠落。
3. Stage 3 で確立した「desired-state manifest + adapter + verifier の 3 点セット」は skill design pattern としても再利用可能（IPC pattern 等と並ぶ抽象度）。

**具体的な追記/新規作成案**

| パス | 内容 | 種別 |
|------|------|------|
| `references/patterns-success-governance-drift.md` | desired-state manifest pattern を success pattern として登録。Stage 3 を canonical 実装例とする | 新規作成（推定 100 行） |
| `references/skill-structure.md` | governance スキルの最小構成セクション追記（SKILL.md / references/manifest-canonical.md / scripts/verify.sh / scripts/apply.sh） | 既存追記 |

---

## 2. 新規スキル作成提案

### 提案: `branch-protection-governance`（優先度: Medium / 保留推奨）

**動機**

- Stage 3 で desired-state manifest + apply + verify の 3 点セットが確立し、Issue #554 / #608 で同パターンが再利用された。
- 将来の governance task（CODEOWNERS drift, repo settings drift, secret scanning settings drift 等）にも同パターンが転用可能。

**提案構成**

```
.claude/skills/branch-protection-governance/
├── SKILL.md
├── references/
│   ├── manifest-format.md       # dev.json / main.json schema
│   ├── apply-pattern.md         # fresh GET + replace + preserve
│   ├── verify-pattern.md        # read-only drift gate
│   └── runbook-mutation.md      # user-gated PUT runbook
├── scripts/
│   ├── verify.sh -> ../../../scripts/verify-branch-protection.sh（symlink）
│   └── apply.sh -> ../../../.github/branch-protection/apply.sh（symlink）
└── LOGS/
```

**保留推奨理由**

- 現状 `aiworkflow-requirements/references/branch-protection.md` + `task-specification-creator/references/non-visual-irreversible-task-rules.md` + `github-issue-manager` Trigger 群で **3 スキル横断 cover が成立済**。
- 新規スキル化すると「正本がどこか」が再び曖昧化するリスクあり（scripts 実体は repo root の `.github/branch-protection/` と `scripts/`、スキルは参照のみ）。
- **代替案**: `aiworkflow-requirements/references/branch-protection-desired-state-manifest.md`（Priority 1 で提案）を中核 reference として整備し、新規スキル化は Stage 4 以降に同パターンが 3 件以上再利用された時点で再評価する。

**結論**: **新規スキル作成は今 cycle 見送り**。Priority 1-3 の既存スキル追記で十分。

---

## 3. テンプレート準拠状況（skill-creator のテンプレ照合）

| 観点 | 該当ファイル | 結果 |
|------|-------------|------|
| SKILL.md frontmatter（name / description / Anchors / Trigger） | 全 4 対象スキル | PASS（全て名前付き Anchors + Trigger 列挙形式に準拠） |
| references/ 分割原則（500 行/file） | 後述「500 行超過リスト」参照 | 部分 PASS（複数の `_legacy-*.md` と `patterns.md`, `keywords.json` が超過） |
| lessons-learned/ 命名規約（`lessons-learned-<topic>-YYYY-MM.md`） | aiworkflow-requirements/lessons-learned/ | PASS |
| changelog/ 命名規約（`YYYYMMDD-<topic>.md`） | aiworkflow-requirements/changelog/ | PASS |
| Stage 3 Phase 12 strict 7 outputs | `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-12/` | PASS（7 ファイル全存在） |

---

## 4. 500 行超過ファイル検出結果

`.claude/skills/` 配下の 500 行超過ファイル（自動生成 index / legacy / schema を含む実測値）:

| 行数 | ファイル | 種別 | 対応 |
|------|---------|------|------|
| 21942 | `aiworkflow-requirements/indexes/keywords.json` | JSON index | 機械生成・例外 |
| 7735 | `skill-creator/references/patterns.md` | 集約 reference | **要分割**（既に `patterns-*.md` 群があるので継続分割） |
| 6844 | `aiworkflow-requirements/indexes/topic-map.md` | 自動生成 index | 例外（`pnpm indexes:rebuild` で再生成） |
| 2796 | `aiworkflow-requirements/references/task-workflow-completed.md` | アーカイブ | **要分割**（年/四半期で分割推奨） |
| 2686 | `task-specification-creator/LOGS/_legacy.md` | legacy log | LOGS は legacy 許容（凍結扱い） |
| 2529 | `skill-creator/LOGS/_legacy.md` | legacy log | 同上 |
| 2365 | `aiworkflow-requirements/indexes/quick-reference.md` | 自動生成 index | 例外 |
| 1238 | `aiworkflow-requirements/references/task-workflow-active.md` | active index | **要監視**（Stage 3 land で追記必至・分割閾値接近） |
| 1010 | `aiworkflow-requirements/indexes/resource-map.md` | 自動生成 index | 例外 |
| 903 | `aiworkflow-requirements/lessons-learned/_legacy-current-2026-04.md` | アーカイブ | legacy 許容 |
| 844 | `aiworkflow-requirements/LOGS/_legacy.md` | legacy log | 凍結 |
| 744 | `aiworkflow-requirements/lessons-learned/_legacy-ipc-preload-runtime.md` | アーカイブ | legacy 許容 |
| 665 | `aiworkflow-requirements/references/deployment-cloudflare.md` | 通常 reference | **要分割候補**（環境別 sub-page へ） |
| 579 | `claude-agent-sdk/references/hooks-system.md` | 通常 reference | **要分割候補** |
| 572 | `aiworkflow-requirements/references/task-workflow-completed-recent-2026-04c.md` | 集約 | 許容範囲（直近のみ） |
| 557 | `aiworkflow-requirements/references/arch-state-management-skill-creator.md` | 通常 reference | **要分割候補** |
| 524 | `skill-creator/schemas/interview-result.json` | JSON schema | 例外（schema） |
| 514 | `aiworkflow-requirements/references/deployment-secrets-management.md` | 通常 reference | **要分割候補** |
| 507 | `aiworkflow-requirements/references/database-schema.md` | 通常 reference | 許容範囲（閾値接近） |
| 504 | `skill-creator/references/patterns-success-ipc-auth.md` | 通常 reference | 許容範囲 |

**今 cycle 推奨アクション**: 自動生成 index / legacy / schema を除く通常 reference の 500 行超過分割（`patterns.md`, `task-workflow-completed.md`, `deployment-cloudflare.md`, `hooks-system.md`, `arch-state-management-skill-creator.md`, `deployment-secrets-management.md`）は Stage 3 スコープ外。**別 workflow で起票推奨**。

---

## 5. 結論

- **新規スキル作成は不要**。既存 3 スキル（`aiworkflow-requirements`, `task-specification-creator`, `github-issue-manager`）への追記で Stage 3 知見を吸収可能。
- Stage 3 land 後、Phase 2 別エージェントは次の順で実反映する想定:
  1. `aiworkflow-requirements`: lesson 新規 + reference 新規 1 本 + indexes 更新 + changelog
  2. `task-specification-creator`: NON_VISUAL rules / coverage-standards 追記 + governance 説明テンプレ新規 1 本
  3. `github-issue-manager`: SKILL.md Trigger 追記 + drift issue template 新規 1 本
- 500 行超過の通常 reference 分割は別 workflow に切り出す。

---

## 旧バージョン（Stage 3 初期スタブ）の保持

- Template Improvements: strict 7 outputs を runtime-pending governance でも必須維持 → 既存 `phase12-compliance-check-template.md` で cover 済。
- Workflow Improvements: branch protection payload scope の厳密化 + aggregate CI gate 推奨 → 既存 `non-visual-irreversible-task-rules.md` + 本レポート Priority 2 で展開。
- Documentation Improvements: operational SoT（GitHub fresh GET）と repo desired-state manifest の区別、runtime mutation 完了前の `completed` 禁止 → 本レポート Priority 1 の新規 reference で正本化予定。

---

## 関連参照

- `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-12/implementation-guide.md`
- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-554-branch-protection-required-check-2026-05.md`
- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md`
- `.github/branch-protection/{dev,main}.json` / `apply.sh` / `README.md`
- `scripts/verify-branch-protection.sh`
- `.github/workflows/ci.yml`, `.github/workflows/lighthouse.yml`
