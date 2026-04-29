# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-29 |
| 上流 | Phase 1（要件定義） |
| 下流 | Phase 3（設計レビュー） |
| 状態 | completed |
| user_approval_required | false |

## 目的

Phase 1 で確定した AC-1〜AC-10 と苦戦箇所 6 件を元に、`task-specification-creator` skill 本体への追記 diff、`.agents/` mirror 同期手順、自己適用順序ゲート、state ownership を確定する。Phase 3 設計レビューの入力を凍結する。

## 入力

| 種別 | パス |
| --- | --- |
| 上流成果物 | `outputs/phase-01/main.md` |
| 改修対象 skill | `.claude/skills/task-specification-creator/SKILL.md` および `references/` 配下 6 ファイル |
| mirror 同期先 | `.agents/skills/task-specification-creator/` |

## 設計事項

### 1. 編集対象ファイルと変更計画

| パス | 変更種別 | 主な追記内容 |
| --- | --- | --- |
| `.claude/skills/task-specification-creator/SKILL.md` | 追記 | 「タスクタイプ判定フロー（docs-only / NON_VISUAL）」セクション。`visualEvidence` の Phase 1 必須入力ルール、縮約テンプレ発火条件、状態分離（`spec_created` vs `completed`）の正本記述 |
| `references/phase-template-phase11.md` | 追記 | docs-only / NON_VISUAL の縮約テンプレ。`outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点を必須 artefact として固定。screenshot 不要を明記。発火条件 = `artifacts.json.metadata.visualEvidence == "NON_VISUAL"` |
| `references/phase-template-phase12.md` | 追記 | Part 2 必須要件 5 項目（型 / API / 例 / エラー / 設定値）を一対一でチェック項目化。`phase-12-completion-checklist.md` への参照リンクを追加 |
| `references/phase-12-completion-checklist.md`（または同等 SKILL セクション） | 追記 / 新規節 | docs-only 用判定ブランチ。Part 2 必須 5 項目チェック。状態分離（`workflow_state = spec_created` を許容しつつ Phase 別 `status = completed` を別レイヤで判定） |
| `references/phase-template-phase1.md` | 追記 | Phase 1 で `artifacts.json.metadata.visualEvidence` を必須入力化するルール |
| `references/phase-template-core.md` | 追記（小） | タスクタイプ判定フローへの参照リンクを Phase 1〜3 共通セクションに追加 |
| `.agents/skills/task-specification-creator/SKILL.md` および `references/` 同名 6 ファイル | mirror 同期 | `.claude/` 側の編集を 1:1 で反映（`cp` または `rsync -a --delete` 相当） |

### 2. SKILL.md 追記セクション設計（仕様レベル）

```markdown
## タスクタイプ判定フロー（docs-only / NON_VISUAL）

Phase 1 で `artifacts.json.metadata.visualEvidence` を必ず確定する。未設定で Phase 11 縮約テンプレが発火しない事故を防ぐため、Phase 1 完了条件として必須化する。

| 入力（artifacts.json.metadata） | 適用テンプレ |
| --- | --- |
| `taskType: docs-only` かつ `visualEvidence: NON_VISUAL` | Phase 11 縮約テンプレ（references/phase-template-phase11.md §「docs-only / NON_VISUAL 縮約」）/ Phase 12 docs-only 判定ブランチ |
| `taskType: docs-only` かつ `visualEvidence: VISUAL` | UI task 追加要件（screenshot 必須） |
| `taskType: implementation` 等 | 通常テンプレ |

### 状態分離（spec_created vs completed）

| レイヤ | フィールド | 値の意味 |
| --- | --- | --- |
| workflow root | `metadata.workflow_state` または `index.md`「状態」 | `spec_created` = 仕様書作成済 / 実装着手前。Phase 12 close-out では書き換えない |
| Phase 別 | `phases[].status` | Phase 1〜3 = `completed`、4〜12 = `pending`、13 = `blocked` 等 |

Phase 12 `close-out` で workflow root を `completed` に書き換えるのは **実装完了タスクのみ**。docs-only / `spec_created` タスクは workflow root を据え置く。
```

### 3. phase-template-phase11.md 縮約テンプレ追記設計（仕様レベル）

既存 `docs-only / spec_created Phase 11 代替証跡フォーマット（必須3点）` セクション（既に `main.md` / `manual-smoke-log.md` / `link-checklist.md` を必須化）と整合させ、以下を **明示的な縮約テンプレ** として独立セクション化する。

```markdown
## docs-only / NON_VISUAL 縮約テンプレ（発火条件: visualEvidence=NON_VISUAL）

`artifacts.json.metadata.visualEvidence == "NON_VISUAL"` のとき、Phase 11 outputs は以下 3 点に **固定** する。screenshot は不要（生成禁止：false green 防止）。

| 必須 outputs | 役割 | 最小フォーマット |
| --- | --- | --- |
| `outputs/phase-11/main.md` | Phase 11 トップ index | テスト方式（NON_VISUAL / docs walkthrough）、発火条件と必須 outputs 一覧、第一適用例（drink-your-own-champagne）への参照 |
| `outputs/phase-11/manual-smoke-log.md` | spec walkthrough / link 検証 / mirror parity の実行記録 | 「実行コマンド / 期待結果 / 実測 / PASS or FAIL」テーブル |
| `outputs/phase-11/link-checklist.md` | SKILL.md → references / mirror parity / workflow 内リンクのチェックリスト | 「参照元 → 参照先 / 状態（OK / Broken）」テーブル |

VISUAL タスクの必須 outputs（`manual-test-checklist.md` / `manual-test-result.md` / `discovered-issues.md` / `screenshot-plan.json`）とは **別セット**。両者を混在させない。

### 縮約テンプレの自己適用第一例

ut-gov-005-docs-only-nonvisual-template-skill-sync 自身が本テンプレの第一適用例。`docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/` を参照。
```

### 4. phase-template-phase12.md Part 2 チェック項目化設計

Part 2「実装ガイド技術者向け」必須要件を `phase-12-completion-checklist.md` 側で 5 項目チェック化する。

| # | チェック項目 | 期待される記述場所 | 判定基準 |
| --- | --- | --- | --- |
| C12P2-1 | TypeScript 型定義 | `implementation-guide.md` Part 2 内 ` ```ts ` ブロック | 1 件以上 |
| C12P2-2 | API シグネチャ | 同上 / `interface` / `type` / 関数シグネチャ | 1 件以上 |
| C12P2-3 | 使用例 | コード例（ts / bash / md） | 1 件以上 |
| C12P2-4 | エラー処理 | try/catch / Result / Either / エラー型定義 | 1 件以上 |
| C12P2-5 | 設定可能パラメータ・定数 | 設定 / env / `as const` / config table | 1 件以上 |

docs-only タスクでは Part 2 が「型定義 / 配置ルール / 使用例」で代替されるため、本チェックも docs-only ブランチで 5 項目を「相当する記述」として判定する旨を `phase-12-completion-checklist.md` に明記する。

### 5. mirror 同期手順

```bash
# 1. .claude 側の編集完了後、.agents へ同期
rsync -a --delete \
  .claude/skills/task-specification-creator/SKILL.md \
  .agents/skills/task-specification-creator/SKILL.md

for f in phase-template-phase11.md phase-template-phase12.md \
         phase-12-completion-checklist.md \
         phase-template-phase1.md phase-template-core.md \
         phase-11-non-visual-alternative-evidence.md; do
  cp ".claude/skills/task-specification-creator/references/$f" \
     ".agents/skills/task-specification-creator/references/$f"
done

# 2. parity 検証（差分 0 必須）
diff -qr \
  .claude/skills/task-specification-creator \
  .agents/skills/task-specification-creator
# 期待: 出力 0 行
```

### 6. State Ownership 表

| エンティティ | 正本（writable） | mirror（read-only） | 同期 trigger |
| --- | --- | --- | --- |
| `SKILL.md` | `.claude/skills/task-specification-creator/SKILL.md` | `.agents/skills/task-specification-creator/SKILL.md` | 本タスク Phase 5 完了時に手動同期 |
| `references/*.md` | `.claude/skills/task-specification-creator/references/` | `.agents/skills/task-specification-creator/references/` | 同上 |
| 縮約テンプレ発火条件メタ | 各タスクの `artifacts.json.metadata.visualEvidence` | なし（タスク単位の正本） | Phase 1 で確定、Phase 5 で再判定 |
| `workflow_state`（spec_created / completed） | workflow root の `index.md` メタ表 / `artifacts.json.metadata.workflow_state` | なし | Phase 1 で確定、Phase 12 では実装完了タスクのみ書き換え |

### 7. 自己適用順序ゲート

| 順序 | Phase | アクション | ゲート条件 |
| --- | --- | --- | --- |
| 1 | Phase 5 | skill 本体（`.claude/skills/`）の編集を完了 | SKILL.md 追記 + references 6 ファイル追記が完了 |
| 2 | Phase 5 末 | mirror 同期 | `diff -qr` 差分 0 |
| 3 | Phase 9 | typecheck / lint / mirror diff の最終確認 | すべて PASS |
| 4 | Phase 11 | 本タスク自身の Phase 11 outputs を縮約テンプレに従って 3 点で構成 | 縮約テンプレが既に skill にコミット済 |
| 5 | Phase 12 | Part 2 必須 5 項目チェックを本タスク自身の implementation-guide で実施 | C12P2-1〜5 すべて PASS |

> **重要**: Phase 5 が未完で Phase 11 に進むと、適用すべきテンプレが skill に存在しないため検証不能。Phase 5 → Phase 11 の serial 依存は本タスクの設計上の不変条件。

### 8. SubAgent Lane 設計

| Lane | 役割 | Phase | 並列性 |
| --- | --- | --- | --- |
| Lane 1 | SKILL.md 追記（タスクタイプ判定フロー） | Phase 5 | 単独 |
| Lane 2 | references 6 ファイル追記（縮約テンプレ / Part 2 チェック / Phase 1 メタ強制） | Phase 5 | Lane 1 と並列可（ファイルが排他） |
| Lane 3 | mirror 同期 + `diff -qr` 検証 + 自己適用 smoke（本タスク自身の Phase 11 outputs 作成） | Phase 5 末 / Phase 9 / Phase 11 | Lane 1 / 2 完了後 |

> Lane 数は 3 以下（phase-template-core の上限に準拠）。

## 実行タスク

1. Phase 1 AC-1〜AC-10 と苦戦箇所 6 件を Phase 2 設計に展開
2. SKILL.md 追記セクション（タスクタイプ判定フロー / 状態分離）を仕様レベルで確定
3. `phase-template-phase11.md` 縮約テンプレ追加 diff を仕様レベルで確定
4. `phase-template-phase12.md` Part 2 5 項目チェックの一対一対応表を確定
5. `phase-12-completion-checklist.md` の docs-only 判定ブランチを設計
6. `phase-template-phase1.md` への「Phase 1 で visualEvidence 必須入力」ルール追加を設計
7. mirror 同期手順（rsync / cp + `diff -qr`）を確定
8. 自己適用順序ゲート（Phase 5 → 11）を不変条件として明文化
9. State Ownership 表 / SubAgent Lane 設計を確定

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-01/main.md` |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` |
| 参考 | `docs/30-workflows/skill-ledger-b1-gitattributes/outputs/phase-02/main.md`（フォーマット模倣元） |

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-02/main.md` | 編集計画 / SKILL.md 追記 diff / references 改修 diff / mirror 同期手順 / state ownership / 自己適用順序ゲート |

## 完了条件 (DoD)

- [x] 6 ファイルへの追記 diff が仕様レベルで確定
- [x] mirror 同期手順（`rsync` / `cp` + `diff -qr`）が固定
- [x] 自己適用順序ゲートが不変条件として明文化
- [x] State Ownership 表が確定
- [x] Part 2 必須 5 項目（C12P2-1〜5）の判定基準が確定
- [x] SubAgent Lane が 3 以下で構成

## 苦戦箇所・注意

- **追記の二重化禁止**: `phase-template-phase11.md` には既に「docs-only / spec_created Phase 11 代替証跡フォーマット（必須3点）」セクションが存在するため、縮約テンプレを **追加** ではなく **既存セクションへの統合 + 発火条件の明文化** として設計する。重複セクションは Phase 8 DRY 化で除去
- **mirror 同期の漏れ**: 6 ファイル中 1 ファイルでも漏れると `diff -qr` で検出されるが、人手スクリプトでは順序ミスが起きる。Phase 5 のランブックで「全 6 ファイルを 1 コマンドで同期する」スクリプト化を推奨
- **自己適用循環**: Phase 5 で skill 編集が未完なまま Phase 11 に着手すると、検証対象が存在しない。順序ゲートを Phase 3 でも再確認する
- **状態分離の表現揺れ**: `状態` / `status` / `workflow_state` という 3 種の語彙を SKILL.md / artifacts.json / index.md で使い分けるため、Phase 2 設計で正準語彙を固定（本設計では `workflow_state` を artifacts.json 側、`状態` を index.md 側、`status` を `phases[]` 側に割り当て）

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [x] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の skill 改善であり、アプリケーション統合テストは追加しない。
- 統合検証は `diff -qr` mirror parity、`pnpm typecheck` / `pnpm lint` の副作用なし確認、Phase 11 縮約テンプレ自己適用 smoke で代替する。
- skill 構造の機械検証（YAML フロントマター / Anchors / セクション構造）は skill-fixture-runner で別タスクとして実施する。

## 次 Phase

- 次: Phase 3（設計レビュー）
- 引き継ぎ: 編集計画 6 ファイル / mirror 同期手順 / 自己適用順序ゲート / Part 2 5 項目チェック表 / State Ownership 表
