# Phase 2: 設計 - ut-gov-005-docs-only-nonvisual-template-skill-sync

> **状態**: completed
> **作成日**: 2026-04-29
> **対象タスク**: task-specification-creator skill への docs-only / NON_VISUAL 縮約テンプレ反映
> **GitHub Issue**: #148 (CLOSED)
> **入力**: Phase 1 要件定義 (`outputs/phase-01/main.md`)

---

## 1. トポロジ

### 1.1 実行モード

- **execution_mode**: `serial`（単一 PR）
- **並列タスク**: なし
- **依存タスク**: 親タスク `task-github-governance-branch-protection` の Phase 11 / 12 outputs（実証データ）
- **後続タスク**: なし（UT-GOV-001〜007 への遡及適用は各タスク側で実施）

### 1.2 PR 構成

- 単一 PR で skill 改修 + mirror 同期 + 本タスク自身の Phase 1〜3 仕様書 + Phase 11 自己適用 outputs を一括コミット
- コミット粒度: 機能単位で分割（① skill 編集 / ② mirror 同期 / ③ 本タスク自己適用 outputs）
- ロールバック単位: skill 編集コミットの `git revert`

### 1.3 Wave 配置

- Wave: governance（skill improvement）
- 他 Wave 0 governance タスクと独立。並列実行可能だが、本タスクは単独 PR

---

## 2. ファイル変更計画

### 2.1 編集対象ファイル（skill 本体）

| パス | 変更種別 | 主な追記内容 |
| --- | --- | --- |
| `.claude/skills/task-specification-creator/SKILL.md` | 追記 | §「タスクタイプ判定フロー（docs-only / NON_VISUAL）」§「状態分離（spec_created vs completed）」 |
| `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | 追記 / 統合 | §「docs-only / NON_VISUAL 縮約テンプレ（発火条件: visualEvidence=NON_VISUAL）」（既存「docs-only / spec_created 必須3点」セクションと統合し、発火条件と必須 outputs 3 点を明文化） |
| `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | 追記 | §「Part 2 必須要件 5 項目チェック対応表」（C12P2-1〜5 と SKILL.md 記述の一対一対応） |
| `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`（または当該 SKILL セクションが存在しない場合は SKILL.md または phase-template-phase12.md へ統合）| 追記 | §「docs-only 用判定ブランチ」§「状態分離（workflow_state vs phases[].status）」「Part 2 必須 5 項目チェック」 |
| `.claude/skills/task-specification-creator/references/phase-template-phase1.md` | 追記 | §「Phase 1 必須入力: artifacts.json.metadata.visualEvidence」 |
| `.claude/skills/task-specification-creator/references/phase-template-core.md` | 追記（小） | タスクタイプ判定フローへの参照リンク（SKILL.md §「タスクタイプ判定フロー」に誘導） |

### 2.2 編集対象ファイル（mirror）

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `.agents/skills/task-specification-creator/SKILL.md` | mirror 同期 | `.claude/` 側の編集を 1:1 で反映 |
| `.agents/skills/task-specification-creator/references/<同名 6 ファイル>` | mirror 同期 | 同上 |

### 2.3 編集禁止ファイル

- `.claude/skills/task-specification-creator/EVALS.json` / `LOGS/` / `lessons-learned/` 等（本タスクは追記中心、既存ファイル内容書換えなし）
- VISUAL タスク向け既存セクション（`UI task 追加要件` / `screenshot-plan.json` 等）
- `phase-template-core.md` の Phase 1〜3 共通セクション順そのもの（順序変更は禁止、参照リンク追加のみ）

---

## 3. SKILL.md 追記セクション設計（仕様レベル diff）

```markdown
## タスクタイプ判定フロー（docs-only / NON_VISUAL）

Phase 1 で `artifacts.json.metadata.visualEvidence` を必ず確定する。未設定で Phase 11 縮約テンプレが
発火しない事故を防ぐため、Phase 1 完了条件として必須化する（references/phase-template-phase1.md
§「Phase 1 必須入力」）。

### 発火マトリクス

| 入力（artifacts.json.metadata） | 適用テンプレ |
| --- | --- |
| `taskType: docs-only` かつ `visualEvidence: NON_VISUAL` | references/phase-template-phase11.md §「docs-only / NON_VISUAL 縮約テンプレ」+ Phase 12 docs-only 判定ブランチ |
| `taskType: docs-only` かつ `visualEvidence: VISUAL` | UI task 追加要件（screenshot 必須） |
| `taskType: implementation` 等 | 通常テンプレ |

### 状態分離（spec_created vs completed）

| レイヤ | フィールド | 値の意味 |
| --- | --- | --- |
| workflow root | `metadata.workflow_state` または `index.md` メタ「状態」 | `spec_created` = 仕様書作成済 / 実装着手前。Phase 12 close-out で書き換えない |
| Phase 別 | `phases[].status` | `completed` / `pending` / `blocked` |

Phase 12 close-out で workflow root を `completed` に書き換えるのは実装完了タスクのみ。
docs-only / `spec_created` タスクは workflow root を据え置き、`phases[].status` のみ更新する。
```

---

## 4. references/phase-template-phase11.md 追記設計（仕様レベル diff）

既存「docs-only / `spec_created` Phase 11 代替証跡フォーマット（必須3点）」セクションと整合させ、以下を独立した「縮約テンプレ」セクションとして昇格する。

```markdown
## docs-only / NON_VISUAL 縮約テンプレ（発火条件: visualEvidence=NON_VISUAL）

`artifacts.json.metadata.visualEvidence == "NON_VISUAL"` のとき、Phase 11 outputs は以下 3 点に固定する。
screenshot は不要（生成禁止: false green 防止）。

### 必須 outputs

| ファイル | 役割 | 最小フォーマット |
| --- | --- | --- |
| `outputs/phase-11/main.md` | Phase 11 トップ index | テスト方式（NON_VISUAL / docs walkthrough）/ 発火条件 / 必須 outputs 一覧 / 第一適用例参照 |
| `outputs/phase-11/manual-smoke-log.md` | spec walkthrough / link 検証 / mirror parity の実行記録 | 「実行コマンド / 期待結果 / 実測 / PASS or FAIL」テーブル |
| `outputs/phase-11/link-checklist.md` | SKILL.md → references / mirror parity / workflow 内リンクのチェックリスト | 「参照元 → 参照先 / 状態（OK / Broken）」テーブル |

VISUAL タスクの必須 outputs（manual-test-checklist.md / manual-test-result.md / discovered-issues.md /
screenshot-plan.json）とは別セット。両者は混在させない。

### 発火条件の機械判定

```bash
jq -r '.metadata.visualEvidence // empty' \
  docs/30-workflows/<task>/artifacts.json
# => NON_VISUAL なら本縮約テンプレを適用
# => VISUAL なら UI task 追加要件
# => 空 / 未設定なら Phase 1 へ差戻し（references/phase-template-phase1.md 違反）
```

### 第一適用例（drink-your-own-champagne）

ut-gov-005-docs-only-nonvisual-template-skill-sync 自身が本テンプレの第一適用例。
`docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/` を参照。
```

> 既存「docs-only / `spec_created` Phase 11 代替証跡フォーマット（必須3点）」セクションは Phase 8 DRY 化で本セクションに統合する（TECH-M-01）。

---

## 5. references/phase-template-phase12.md / phase-12-completion-checklist.md 追記設計

### 5.1 Part 2 必須 5 項目チェック対応表（仕様レベル）

| # | チェック項目 | SKILL.md 記述 | implementation-guide.md Part 2 内の判定基準 |
| --- | --- | --- | --- |
| C12P2-1 | TypeScript 型定義 | SKILL.md Part 2「型定義」 | ` ```ts ` ブロックまたは `interface` / `type` 定義が 1 件以上 |
| C12P2-2 | API シグネチャ | SKILL.md Part 2「API シグネチャ」 | 関数シグネチャ / メソッド定義が 1 件以上 |
| C12P2-3 | 使用例 | SKILL.md Part 2「使用例」 | コード例（ts / bash / md）が 1 件以上 |
| C12P2-4 | エラー処理 | SKILL.md Part 2「エラー処理」 | try/catch / Result / Either / エラー型定義が 1 件以上 |
| C12P2-5 | 設定可能パラメータ・定数 | SKILL.md Part 2「設定値」 | env / `as const` / config table が 1 件以上 |

### 5.2 docs-only タスク向けの代替判定（追記）

docs-only タスクでは Part 2 が「型定義 / 配置ルール / 使用例」で代替されるため、本チェックも docs-only ブランチで以下のように相当する記述として判定する。

| # | docs-only での相当記述 |
| --- | --- |
| C12P2-1 | 型定義（YAML スキーマ / JSON スキーマ / メタフィールド型） |
| C12P2-2 | API 相当（SKILL.md セクション参照経路 / 発火条件式）|
| C12P2-3 | 使用例（タスク仕様書テンプレ実例 / 適用 PR）|
| C12P2-4 | エラー処理相当（NO-GO 条件 / 差戻しルール）|
| C12P2-5 | 設定値相当（artifacts.json.metadata 必須フィールド / 環境変数）|

### 5.3 状態分離記述（追記）

```markdown
## docs-only 用判定ブランチ: 状態分離

Phase 12 close-out 時、以下の判定で workflow root の `状態` を更新する / しないを決める。

| `metadata.taskType` | `metadata.workflow_state` 入力 | Phase 12 close-out 後の workflow root | `phases[].status` |
| --- | --- | --- | --- |
| implementation | `in_progress` | `completed` に更新 | Phase 12 = `completed` |
| docs-only | `spec_created` | `spec_created` を維持 | Phase 1〜3 = `completed`、4〜12 = `pending`、13 = `blocked` |
| docs-only（実装済 docs 整備）| `in_progress` | `completed` に更新 | Phase 12 = `completed` |

`spec_created` を `completed` に書き換える条件: workflow がカバーする実装が完了しており、後続の派生実装タスクが存在しない場合のみ。
```

---

## 6. references/phase-template-phase1.md 追記設計

```markdown
## Phase 1 必須入力: artifacts.json.metadata.visualEvidence

Phase 1 の DoD として以下を必須化する。未設定の場合、Phase 11 縮約テンプレ / VISUAL UI task テンプレの
発火判定が不可能になり、Phase 1 を差し戻す。

| メタフィールド | 必須値 | 確定タイミング |
| --- | --- | --- |
| `metadata.taskType` | `docs-only` / `implementation` / `skill-improvement` 等 | Phase 1 完了時 |
| `metadata.visualEvidence` | `VISUAL` / `NON_VISUAL` | Phase 1 完了時（Phase 5 で再判定） |
| `metadata.scope` | タスクの責務領域 | Phase 1 完了時 |
| `metadata.workflow_state` | `spec_created` / `in_progress` / `completed` | Phase 1 完了時（Phase 12 close-out で更新可否判定）|

判定コマンド:
```bash
jq -e '.metadata | (.taskType and .visualEvidence and .scope and .workflow_state)' \
  docs/30-workflows/<task>/artifacts.json \
  || echo "Phase 1 メタ未確定: 差戻し"
```
```

---

## 7. mirror 同期手順

```bash
# 1. .claude 側の編集完了後、.agents へ同期
cp .claude/skills/task-specification-creator/SKILL.md \
   .agents/skills/task-specification-creator/SKILL.md

for f in phase-template-phase11.md phase-template-phase12.md \
         phase-12-completion-checklist.md \
         phase-template-phase1.md phase-template-core.md \
         phase-11-non-visual-alternative-evidence.md; do
  if [ -f ".claude/skills/task-specification-creator/references/$f" ]; then
    cp ".claude/skills/task-specification-creator/references/$f" \
       ".agents/skills/task-specification-creator/references/$f"
  fi
done

# 2. parity 検証（差分 0 必須）
diff -qr \
  .claude/skills/task-specification-creator \
  .agents/skills/task-specification-creator
# 期待: 出力 0 行
```

> 上記スクリプトは Phase 5 実装ランブックでシェルスクリプト化する。`rsync -a --delete` は他派生物（LOGS / outputs 等）まで巻き込むため不採用。`cp` で対象ファイルを明示列挙する。

---

## 8. State Ownership 表

| エンティティ | 正本（writable） | mirror（read-only） | 同期 trigger |
| --- | --- | --- | --- |
| `SKILL.md` | `.claude/skills/task-specification-creator/SKILL.md` | `.agents/skills/task-specification-creator/SKILL.md` | 本タスク Phase 5 完了時に手動同期 |
| `references/*.md` | `.claude/skills/task-specification-creator/references/` | `.agents/skills/task-specification-creator/references/` | 同上 |
| 縮約テンプレ発火条件メタ | 各タスクの `artifacts.json.metadata.visualEvidence` | なし（タスク単位の正本） | Phase 1 で確定、Phase 5 で再判定 |
| `workflow_state` | workflow root の `index.md` メタ「状態」 / `artifacts.json.metadata.workflow_state` | なし | Phase 1 で確定、Phase 12 close-out で実装完了タスクのみ書換え |
| `phases[].status` | `artifacts.json.phases[].status` | なし | Phase 完了時に該当 entry を更新 |

---

## 9. 自己適用順序ゲート（不変条件）

| 順序 | Phase | アクション | ゲート条件 |
| --- | --- | --- | --- |
| 1 | Phase 5 | skill 本体（`.claude/skills/`）の 6 ファイル追記完了 | 各ファイルの追記が完了し commit 済 |
| 2 | Phase 5 末 | mirror 同期 | `diff -qr` 差分 0 |
| 3 | Phase 9 | typecheck / lint / mirror diff の最終確認 | すべて PASS |
| 4 | Phase 11 | 本タスク自身の `outputs/phase-11/` を縮約テンプレ通り 3 点で構成 | 縮約テンプレが skill にコミット済（順序 1 完了済）|
| 5 | Phase 12 | Part 2 必須 5 項目（C12P2-1〜5）を本タスク自身の implementation-guide で実施 | 順序 1 / 4 完了済 |

> **不変条件**: 順序 1（Phase 5 skill 編集）が未完で順序 4（Phase 11 自己適用）に進むと、適用すべきテンプレが skill 本体に存在しないため検証不能。本タスクの設計上、Phase 5 → Phase 11 の serial 依存は破ることができない。

---

## 10. SubAgent Lane 設計

| Lane | 役割 | Phase | 並列性 |
| --- | --- | --- | --- |
| Lane 1 | SKILL.md 追記（タスクタイプ判定フロー / 状態分離） | Phase 5 | 単独 |
| Lane 2 | references 6 ファイル追記（縮約テンプレ / Part 2 チェック / Phase 1 メタ強制 / core 参照リンク） | Phase 5 | Lane 1 と並列可（ファイル排他） |
| Lane 3 | mirror 同期 + `diff -qr` 検証 + 自己適用 smoke（本タスク Phase 11 outputs 作成 + Phase 12 Part 2 5 項目チェック） | Phase 5 末 / Phase 9 / Phase 11 / Phase 12 | Lane 1 / 2 完了後 |

> Lane 数 3（phase-template-core の上限）。各 Lane の並列性は serial 依存として設計し、Lane 1 / 2 のみファイル排他で並列実行可。

---

## 11. Validation Path

### 11.1 skill 編集側（Phase 5）

```bash
# SKILL.md にタスクタイプ判定フローが追加されたか
grep -q "タスクタイプ判定フロー" .claude/skills/task-specification-creator/SKILL.md

# phase-template-phase11.md に縮約テンプレが追加されたか
grep -q "docs-only / NON_VISUAL 縮約テンプレ" \
  .claude/skills/task-specification-creator/references/phase-template-phase11.md

# Phase 1 必須入力ルール
grep -q "Phase 1 必須入力" \
  .claude/skills/task-specification-creator/references/phase-template-phase1.md

# Part 2 5 項目チェック
grep -E "C12P2-(1|2|3|4|5)" \
  .claude/skills/task-specification-creator/references/phase-template-phase12.md \
  .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md \
  2>/dev/null
```

### 11.2 mirror 側（Phase 5 末 / Phase 9 / Phase 11）

```bash
diff -qr \
  .claude/skills/task-specification-creator \
  .agents/skills/task-specification-creator
# 期待: 出力 0 行
```

### 11.3 自己適用側（Phase 11）

```bash
# 本タスクの Phase 11 outputs が縮約テンプレ通り 3 点で構成されているか
ls docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/main.md \
   docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/manual-smoke-log.md \
   docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/link-checklist.md

# screenshot 系ファイルが存在しないこと（NON_VISUAL）
! ls docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/screenshot-plan.json 2>/dev/null
```

---

## 12. ロールバック設計

### 12.1 ロールバック粒度

- skill 編集コミット 1 つ + mirror 同期コミット 1 つ + 本タスク自己適用コミット 1 つ = 計 3 コミットを順次 revert

### 12.2 ロールバック手順

```bash
# 1. 自己適用コミット revert（本タスク outputs/phase-11/）
git revert <self-apply-commit-sha>

# 2. mirror 同期コミット revert
git revert <mirror-sync-commit-sha>

# 3. skill 編集コミット revert
git revert <skill-edit-commit-sha>

# 4. 検証
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
# => 差分 0（baseline 状態に戻る）
```

### 12.3 副作用範囲

- `.claude/skills/` および `.agents/skills/` のテキスト追記のみが取消される
- 既存の workflow / 進行中タスクへの影響はなし（縮約テンプレが消えても screenshot 必須に戻るだけで、データ損失なし）
- ロールバック後、UT-GOV-001〜007 系 Wave での再発防止効果は失われる

---

## 13. 既存コンポーネント再利用可否

| コンポーネント | 再利用可否 | 備考 |
| --- | --- | --- |
| `phase-11-non-visual-alternative-evidence.md`（既存正本）| **可（必須）**| 縮約テンプレと整合させ、参照リンクで連携 |
| `phase-template-phase11.md`「docs-only / spec_created 必須3点」セクション | **可（統合）**| Phase 8 DRY 化で新セクションに統合（TECH-M-01）|
| skill-fixture-runner | 不採用（本タスクスコープ外）| 縮約テンプレ構造検証は別タスク（TECH-M-04）|
| pre-commit / GitHub Actions | 不採用（本タスクスコープ外）| mirror parity の CI gate 化は別タスク（TECH-M-02）|

---

## 14. 既存命名規則の確認

- skill ディレクトリ命名: `.claude/skills/<skill-name>/` / `.agents/skills/<skill-name>/`（mirror）
- references ファイル命名: `phase-template-phase<N>.md` / `phase<N>-*.md` の既存命名規約に準拠
- compliance-check: `phase-12-completion-checklist.md` の既存ファイル名を維持
- 発火条件メタ: `artifacts.json.metadata.visualEvidence` の値（`VISUAL` / `NON_VISUAL`）。新規メタフィールドの導入はなし
