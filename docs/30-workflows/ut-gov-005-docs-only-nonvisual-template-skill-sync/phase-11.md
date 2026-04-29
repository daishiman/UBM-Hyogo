# Phase 11: 手動 smoke（縮約テンプレ自己適用検証）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke（縮約テンプレ自己適用検証） |
| 作成日 | 2026-04-29 |
| 上流 | Phase 10（最終レビュー） |
| 下流 | Phase 12（ドキュメント更新） |
| 状態 | pending |
| user_approval_required | false |
| タスク種別 | docs-only / NON_VISUAL（screenshot 不要） |
| visualEvidence | NON_VISUAL |
| 縮約テンプレ適用 | **自己適用第一例（drink-your-own-champagne）** |

## 目的

Phase 5 で skill 本体（`.claude/skills/task-specification-creator/` 6 ファイル）に追記された
**docs-only / NON_VISUAL 縮約テンプレ** を、本タスク自身の Phase 11 outputs で **自分自身に適用** する。
これは本ワークフローの設計上の核（drink-your-own-champagne）であり、適用第一例として後続タスクの参照リンク元になる。

screenshot は **明示的に不要**（`visualEvidence: NON_VISUAL` / `taskType: docs-only` / 編集対象は markdown 6 ファイルのみ・UI 変更なし）。
代替 evidence プレイブック（`phase-11-non-visual-alternative-evidence.md` 既存正本）に従い、**3 点固定 artefact**（`main.md` /
`manual-smoke-log.md` / `link-checklist.md`）のみで Phase 11 を完結させる。AC-1 / AC-2 / AC-5 / AC-8 を最終確定する。

## 入力

- `outputs/phase-10/go-no-go.md`（Go 判定 / 縮約テンプレが skill にコミット済の確認）
- `outputs/phase-09/main.md`（typecheck / lint 副作用なし + mirror diff 0 結果）
- `outputs/phase-07/ac-matrix.md`（AC-1〜AC-10 の最終トレース）
- `outputs/phase-05/implementation-runbook.md`（skill 6 ファイル追記実体）
- `.claude/skills/task-specification-creator/SKILL.md`（タスクタイプ判定フロー追記済）
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`（縮約テンプレ追記済）
- `.agents/skills/task-specification-creator/`（mirror baseline）

## テスト方式

| 項目 | 値 |
| --- | --- |
| 種別 | NON_VISUAL（docs walkthrough + 自己適用 smoke + mirror parity 検証） |
| screenshot | **不要**（visualEvidence=NON_VISUAL、UI 変更なし、編集対象は markdown のみ） |
| 代替 evidence | `main.md` / `manual-smoke-log.md` / `link-checklist.md`（必須 3 点固定） |
| 自己適用性 | 本 Phase 自身が縮約テンプレの第一適用例として動作する |

### NON_VISUAL 宣言（Phase 11 必須）

`outputs/phase-11/main.md` 冒頭に以下のメタを記録すること。

- 証跡の主ソース: 自己適用 smoke（S-1〜S-5）+ mirror parity diff
- screenshot 非作成理由: `visualEvidence=NON_VISUAL`（skill 6 ファイル追記のみ / UI / runtime / D1 影響なし）
- 縮約テンプレ適用判定: `artifacts.json.metadata.visualEvidence=NON_VISUAL` && `taskType=docs-only` → 縮約発火（SKILL.md 判定フローに準拠）
- 自己適用宣言: 本 Phase 11 outputs 自体が縮約テンプレの第一適用例である

## smoke シナリオ

### S-1 mirror parity（差分 0 検証 / AC-5）

```bash
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
echo $?                                # => 0（差分なし）
```

期待: 出力 0 行 / exit 0。1 行でも差分があれば FAIL。

### S-2 SKILL.md 判定フロー文書整合（AC-2）

```bash
# タスクタイプ判定フローのキー語が SKILL.md に存在するか
rg -n 'visualEvidence' .claude/skills/task-specification-creator/SKILL.md
rg -n 'NON_VISUAL' .claude/skills/task-specification-creator/SKILL.md
rg -n 'docs-only' .claude/skills/task-specification-creator/SKILL.md
rg -n '縮約テンプレ|reduced template' .claude/skills/task-specification-creator/SKILL.md
```

期待: 4 キー語すべて HIT（タスクタイプ判定フローが追記されていること）。

### S-3 縮約テンプレ 3 点固定の検証（AC-1）

```bash
# phase-template-phase11.md に 3 点 artefact 固定が明記されているか
rg -n 'main\.md.*manual-smoke-log\.md.*link-checklist\.md|3 点固定|3 点必須' \
  .claude/skills/task-specification-creator/references/phase-template-phase11.md
# screenshot 不要の明文化
rg -n 'screenshot.*不要|screenshot.*not required' \
  .claude/skills/task-specification-creator/references/phase-template-phase11.md
```

期待: 3 点固定セクションと screenshot 不要明文化が同一ファイル内に存在。

### S-4 Phase 12 Part 2 必須 5 項目チェック（AC-3）

```bash
# C12P2-1〜C12P2-5 が compliance-check 側に存在するか
rg -n 'C12P2-[1-5]' .claude/skills/task-specification-creator/references/
# completion checklist 正本
rg -n '型定義|API シグネチャ|使用例|エラー処理|設定可能パラメータ' \
  .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md
```

期待: 5 項目すべて検出。一対一対応で Part 2 と compliance-check が同期。

### S-5 Progressive Disclosure 行数チェック（skill 構造健全性）

```bash
# SKILL.md は Progressive Disclosure の上限（500 行目安）以内か
wc -l .claude/skills/task-specification-creator/SKILL.md
# 各 reference は 1000 行以内か
wc -l .claude/skills/task-specification-creator/references/phase-template-phase11.md
wc -l .claude/skills/task-specification-creator/references/phase-template-phase12.md
wc -l .claude/skills/task-specification-creator/references/phase-template-phase1.md
```

期待: SKILL.md ≤ 500 行 / 各 reference ≤ 1000 行（追記後も Progressive Disclosure 健全性維持）。

### S-6 自己適用検証（drink-your-own-champagne / AC-8）

本 Phase 11 outputs 自身が縮約テンプレの 3 点構成と一致しているかを Phase 11 終了直前にセルフチェック。

```bash
ls docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/
# 期待出力（3 点のみ）:
# main.md
# manual-smoke-log.md
# link-checklist.md
```

screenshot ファイル / `manual-test-result.md` 等の冗長 artefact が **存在しないこと** を確認。

## 必須 evidence（3 点固定）

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | NON_VISUAL 宣言 / 自己適用宣言 / S-1〜S-6 結果サマリ / 必須 outputs リンク / AC-1/2/5/8 確定マーク |
| `outputs/phase-11/manual-smoke-log.md` | S-1〜S-6 の実行コマンド・期待・実測・PASS/FAIL テーブル / 実行日時 / branch 名 |
| `outputs/phase-11/link-checklist.md` | 全 cross-reference の死活確認（SKILL.md ⇄ references / `.claude` ⇄ `.agents` mirror / 仕様書 ⇄ outputs 双方向） |

### `manual-smoke-log.md` 必須メタ

- 証跡の主ソース: 自己適用 smoke（S-1〜S-6）
- screenshot 非作成理由: `visualEvidence=NON_VISUAL`（skill 6 ファイル追記のみ / UI 変更なし）
- 実行日時 / 実行者 / branch 名（`feat/issue-148-ut-gov-005-docs-only-nonvisual-template-skill-sync`）
- mirror diff 結果（`diff -qr` 出力 0 行の証跡）

### `link-checklist.md` 最小項目

- SKILL.md（タスクタイプ判定フロー）↔ `references/phase-template-phase11.md`（縮約テンプレ実体）
- SKILL.md（Part 2 5 項目）↔ `references/phase-12-completion-checklist.md`（C12P2-1〜5）
- `references/phase-template-phase1.md`（visualEvidence 必須入力）↔ `artifacts.json.metadata.visualEvidence`
- `.claude/skills/task-specification-creator/` ↔ `.agents/skills/task-specification-creator/` mirror（6 ファイル一対一）
- task workflow 内: `index.md` / `phase-01〜13.md` / `outputs/phase-0N/` 双方向リンク
- 親タスク参照: `completed-tasks/task-github-governance-branch-protection/outputs/phase-11/` 第一実証データへのリンク

## 実行タスク

1. S-1〜S-6 を順次実行し、生コマンド出力を `manual-smoke-log.md` に保存
2. PASS/FAIL テーブルを `manual-smoke-log.md` に記録
3. `link-checklist.md` の cross-reference 全件を OK 化（双方向リンク含む）
4. `main.md` に NON_VISUAL 宣言 / 自己適用宣言 / AC-1/2/5/8 確定マークを記録
5. S-6 で自己適用 3 点構成が崩れていないか最終チェック
6. screenshot / `manual-test-result.md` 等の冗長 artefact が **作成されていない** ことを `ls` で確認

## 検証項目（AC 確定対応表）

| AC | 確認 smoke | 期待結果 |
| --- | --- | --- |
| AC-1（縮約テンプレ追加 / 3 点固定 / screenshot 不要明文化） | S-3 | 3 キー語 HIT |
| AC-2（NON_VISUAL → 縮約発火 判定が SKILL.md と phase-template-phase11.md 双方に明記） | S-2 | 4 キー語 HIT |
| AC-3（Part 2 5 項目 一対一チェック） | S-4 | C12P2-1〜5 検出 |
| AC-5（mirror diff 0） | S-1 | diff 0 行 |
| AC-8（自己適用第一例） | S-6 | 3 点のみで構成 |

AC-4（state 分離）/ AC-6（visualEvidence Phase 1 必須入力）/ AC-7（メタ一致）/ AC-9（代替案評価）/ AC-10（Phase 状態整合）は Phase 5/9/10 で確定済のためここでは再確認のみ。

## 参照資料

### システム仕様（task-specification-creator skill）

> 実装前に必ず以下を確認し、縮約テンプレ判定フローと整合させること。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 11 NON_VISUAL 代替 evidence プレイブック | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | NON_VISUAL タスクの根拠（最重要） |
| Phase 11 テンプレ（縮約版含む） | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | 縮約テンプレ実体（Phase 5 で追記済） |
| Phase 11 detail | `.claude/skills/task-specification-creator/references/phase-template-phase11-detail.md` | Phase 11 詳細運用 |
| SKILL.md タスクタイプ判定フロー | `.claude/skills/task-specification-creator/SKILL.md` | NON_VISUAL → 縮約発火の判定ルール |

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-10/go-no-go.md` |
| 必須 | `outputs/phase-09/main.md` |
| 必須 | `outputs/phase-07/ac-matrix.md` |
| 必須 | `outputs/phase-05/implementation-runbook.md` |
| 参考 | 親タスク `completed-tasks/task-github-governance-branch-protection/outputs/phase-11/` 3 点（第一実証データ） |
| 参考 | `docs/30-workflows/skill-ledger-b1-gitattributes/phase-11.md`（NON_VISUAL 先行先例） |

## 依存Phase明示

- Phase 1 成果物（visualEvidence メタ）を参照する。
- Phase 2 成果物（mirror 同期手順）を参照する。
- Phase 5 成果物（skill 6 ファイル追記実体）を参照する。
- Phase 7 成果物（AC マトリクス）を参照する。
- Phase 9 成果物（typecheck / lint / mirror diff）を参照する。
- Phase 10 成果物（Go 判定）を参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 トップ index / NON_VISUAL 宣言 / 自己適用宣言 / AC 確定マーク |
| `outputs/phase-11/manual-smoke-log.md` | S-1〜S-6 実行ログ / PASS-FAIL テーブル（必須） |
| `outputs/phase-11/link-checklist.md` | cross-reference 双方向 checklist（必須） |

> **重要**: 本 Phase の outputs は **3 点のみ**。screenshot / `manual-test-result.md` 等を作らないこと。
> これは縮約テンプレ自己適用の核であり、冗長 artefact が混入した時点で AC-8 FAIL となる。

## 完了条件 (DoD)

- [ ] S-1 PASS（mirror diff 0 行）
- [ ] S-2 PASS（SKILL.md 判定フロー 4 キー語 HIT）
- [ ] S-3 PASS（縮約テンプレ 3 点固定 + screenshot 不要明文化）
- [ ] S-4 PASS（Part 2 5 項目 C12P2-1〜5 検出）
- [ ] S-5 PASS（Progressive Disclosure 行数制限内）
- [ ] S-6 PASS（自己適用 3 点構成・冗長 artefact なし）
- [ ] AC-1 / AC-2 / AC-5 / AC-8 確定 GREEN
- [ ] 必須 3 点（main / manual-smoke-log / link-checklist）作成済
- [ ] screenshot / `manual-test-result.md` が `outputs/phase-11/` に存在しない

## 苦戦箇所・注意

- **screenshot 強要の誤解**: NON_VISUAL タスクで screenshot を作ると false green になり AC-1 / AC-8 が FAIL する。代替 evidence 3 点を厳守
- **冗長 artefact 混入**: 「念のため」と `manual-test-result.md` / `verification-screenshot.png` を追加すると縮約テンプレが崩れる。S-6 で必ず 3 点のみであることを確認
- **mirror diff の見落とし**: `.claude` 側だけ編集して `.agents` 側を忘れる古典的事故。Phase 5 末で同期しても Phase 11 で再 diff 必須
- **判定フロー文書整合の片側欠落**: SKILL.md にだけ判定フローを書いて `phase-template-phase11.md` 側に書き忘れるとドリフト復活。S-2 / S-3 で双方検証
- **自己適用の循環**: skill 本体に縮約テンプレが未コミットの状態で Phase 11 を始めると自分自身を適用できない。Phase 5 → Phase 11 順序ゲート（Phase 2 §7）を遵守
- **遡及適用の混乱**: 既存進行中の docs-only タスクへ本テンプレを遡及適用しようとしないこと。新規タスクからのみ適用する方針（TECH-M-03）は Phase 12 documentation で明文化する
- **branch protection 抵触**: smoke 実施で main / dev に直接 commit しないこと。本 PR ブランチ内で完結させる

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する（3 点固定）。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の skill 改善であり、アプリケーション統合テストは追加しない。
- 統合検証は `diff -qr` mirror parity、`rg` による文書整合検査、`wc -l` Progressive Disclosure 行数チェック、自己適用 3 点構成 `ls` 検査で代替する。
- 後続タスク（UT-GOV-001〜007 系）は本 Phase 11 outputs を縮約テンプレ第一適用例として参照リンク化する。

## 次 Phase

- 次: Phase 12（ドキュメント更新）
- 引き継ぎ: AC-1 / AC-2 / AC-5 / AC-8 確定 GREEN / 自己適用 evidence 3 点 / mirror diff 0 ログ
