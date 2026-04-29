# Phase 8: DRY 化（重複記述の整理）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化（重複記述の整理） |
| 作成日 | 2026-04-29 |
| 上流 | Phase 7（AC マトリクス） |
| 下流 | Phase 9（品質保証） |
| 状態 | pending |
| user_approval_required | false |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |

## 目的

Phase 5 で skill 本体（`SKILL.md` / `references/phase-template-phase11.md` / `references/phase-template-phase12.md` / `references/phase-12-completion-checklist.md`）に追記した縮約テンプレ・判定ルール・チェック項目について、**ドキュメント間に発生した重複記述を単一の正本へ集約**し、相互参照リンクで冗長を排除する。skill 改修は追記中心であるため新規重複が発生しやすく、本 Phase で構造的に正本を確定しないと UT-GOV-001〜007 の Wave で判定ドリフトが再発する。

本タスクは docs-only / NON_VISUAL のため、refactor 対象は **skill 本体のテキストと相互参照リンクのみ**。コードや設定ファイルは触らない。

## 入力

- `outputs/phase-05/implementation-runbook.md`（Phase 5 で確定した skill 本体追記後の状態）
- `outputs/phase-07/ac-matrix.md`（AC-1〜AC-10 の現状）
- `.claude/skills/task-specification-creator/SKILL.md`（追記後）
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`（追記後）
- `.claude/skills/task-specification-creator/references/phase-template-phase12.md`（追記後）
- `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`（追記後）
- `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`（既存正本）

## DRY 化観点

### 1. docs-only 必須 3 点（main / manual-smoke-log / link-checklist）の重複検出

| 観点 | チェック内容 | 判定基準 |
| --- | --- | --- |
| 列挙箇所の特定 | `phase-template-phase11.md` 縮約テンプレ / `phase-11-non-visual-alternative-evidence.md` / `SKILL.md` タスクタイプ判定フロー の 3 箇所で「3 点固定」が列挙されていないか | 正本は `phase-template-phase11.md` の縮約テンプレに固定し、他 2 箇所は **相互参照リンクのみ** に縮約 |
| 文言ドリフト | 3 箇所で artefact 名称・順序・「screenshot 不要」記述が一字一句一致しているか | 不一致があれば正本にそろえる |
| 既存 NON_VISUAL evidence プレイブックとの境界 | `phase-11-non-visual-alternative-evidence.md` に列挙される代替 evidence と、縮約テンプレの 3 点固定の責務が重ならないか | プレイブック = NON_VISUAL evidence の発想カタログ / 縮約テンプレ = docs-only 限定の 3 点強制。境界をそれぞれの冒頭で明文化 |

### 2. 判定ルール（visualEvidence / taskType）の重複検出

| 観点 | チェック内容 | 判定基準 |
| --- | --- | --- |
| 判定フロー記載箇所 | `SKILL.md` / `phase-template-phase11.md` / `phase-template-phase12.md` / `phase-12-completion-checklist.md` の 4 箇所で発火条件（`visualEvidence == NON_VISUAL` && `taskType == docs-only`）が個別に書かれていないか | 正本は `SKILL.md` のタスクタイプ判定フロー 1 箇所に集約。references 側は「判定フローは SKILL.md §X を参照」とリンク化 |
| Phase 1 メタ確定ルールとの整合 | `phase-template-phase1.md` / `phase-template-core.md` 側の「visualEvidence 必須化」記述と SKILL.md 判定フローが矛盾しないか | Phase 1 = 入力確定 / SKILL.md = 判定 / Phase 11 = 発火、の 3 段階を一行で示す mermaid または表を SKILL.md にのみ置く |

### 3. Phase 12 Part 2 必須要件（5 項目）の重複検出

| 観点 | チェック内容 | 判定基準 |
| --- | --- | --- |
| SKILL.md と compliance-check の対応 | `SKILL.md` に列挙される Part 2 5 項目（型 / API / 例 / エラー / 設定値）と `phase-12-completion-checklist.md` のチェック項目が **一対一対応** で順序・粒度が揃っているか | 一対一でない場合、compliance-check 側を SKILL.md に合わせる。SKILL.md の項目定義は変更しない |
| 説明文の重複 | 5 項目の説明（中学生レベル概念）が両ファイルにフルテキストで重複していないか | 説明本文は SKILL.md にのみ置き、compliance-check 側は項目名 + チェック観点のみ |
| `phase-template-phase12.md` の重複 | テンプレ側で 5 項目を再度詳述していないか | テンプレは「Part 2 必須要件は SKILL.md §X / compliance-check §Y を参照」のリンクのみ |

### 4. 状態分離（spec_created / completed）記述の重複検出

| 観点 | チェック内容 | 判定基準 |
| --- | --- | --- |
| 状態定義の正本 | `spec_created`（workflow root）と `completed`（ledger / Phase 別 status）の差が複数箇所で重複定義されていないか | 正本は `phase-12-completion-checklist.md` の docs-only ブランチに集約。SKILL.md 側は「状態分離ルールは compliance-check §Z を参照」とリンク化 |
| 誤書換えパターンの記述 | Phase 12 close-out 時の `completed` 誤書換えパターンが SKILL.md と compliance-check で別記述になっていないか | 正本に集約し他はリンク化 |

### 5. mirror 同期手順の重複検出

| 観点 | チェック内容 | 判定基準 |
| --- | --- | --- |
| 同期コマンド | `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` が複数箇所に書かれていないか | Phase 2 設計 / Phase 9 品質保証 / Phase 11 smoke で同じコマンドを **同じ表記** で書く（コマンド自体の重複は許容、ただし表記揺れは禁止） |

## DRY 戦略

| 戦略 | 適用先 | 期待効果 |
| --- | --- | --- |
| 単一正本（Single Source of Truth） | SKILL.md = 判定フロー / phase-template-phase11.md = 縮約テンプレ / phase-12-completion-checklist.md = 状態分離ルール・5 項目チェック | 改修時の更新箇所を 1 箇所に限定し、判定ドリフトを構造的に防止 |
| 相互参照リンク | references 間 / SKILL.md ↔ references | 同じ内容を再記述せず、`§X` 形式のセクション番号でリンク |
| 表記統一 | 「3 点固定」「visualEvidence == NON_VISUAL」「`diff -qr` 差分 0」 | 一字一句一致でないと grep で見つからない事故を防ぐ |

## TECH-M-01 として記録

| 項目 | 内容 |
| --- | --- |
| ID | TECH-M-01 |
| 種別 | MINOR（DRY 違反の構造化解消） |
| 内容 | skill 本体追記時に発生する判定ルール・3 点固定・5 項目・状態分離の重複を、本 Phase 8 で正本集約 + 相互参照リンク化により恒久解消する |
| 戻り先 | Phase 5（実装ランブック）— 重複が残存する場合は追記方針を見直し |
| 完了条件 | 本 Phase 8 main.md に重複削除前後の diff と正本所在マップが記録されている |

## 実行タスク

1. skill 本体 4 ファイル + references 2 ファイル（合計 6 ファイル）を全文読み、上記 1〜5 の観点で重複箇所を抽出する
2. 重複箇所を「正本所在マップ」表として main.md に記録する（ファイルパス × セクション × 観点）
3. 正本以外の箇所を相互参照リンクへ縮約する diff 案を main.md に記載する（実適用は Phase 5 へフィードバックループ、または本 Phase 内で skill 本体を直接編集して同期）
4. 表記揺れ（3 点固定 / NON_VISUAL / `diff -qr`）を grep で全文検索し、揺れがある場合は正本表記に統一する
5. TECH-M-01 として MINOR 追跡テーブル（Phase 3 / Phase 7）に追記する
6. 重複削除後の AC-1〜AC-10 が全件 GREEN を維持していることを Phase 7 マトリクスと照合する

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-05/implementation-runbook.md` |
| 必須 | `outputs/phase-07/ac-matrix.md` |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` |
| 参考 | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` |
| 参考 | `docs/30-workflows/skill-ledger-b1-gitattributes/phase-08.md`（フォーマット模倣元） |

## 依存Phase明示

- Phase 1 成果物（要件 / AC-1〜10）を参照する
- Phase 2 成果物（編集計画・正本所在の事前設計）を参照する
- Phase 5 成果物（実装ランブック）を入力とする
- Phase 7 成果物（AC マトリクス）で GREEN 維持を確認する

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-08/main.md` | 重複検出結果 / 正本所在マップ / DRY 適用後 diff / TECH-M-01 記録 / AC GREEN 維持確認 |

## 完了条件 (DoD)

- [ ] 観点 1〜5 すべてについて重複検出結果が main.md に記録済み
- [ ] 正本所在マップ（ファイル × セクション × 観点）が表形式で main.md に記載されている
- [ ] 相互参照リンク化の diff 案または適用結果が main.md に記録されている
- [ ] 表記揺れ（3 点固定 / NON_VISUAL / `diff -qr`）が grep で 0 件
- [ ] TECH-M-01 が MINOR 追跡テーブルに記録されている
- [ ] AC-1〜AC-10 が全件 GREEN を維持
- [ ] `.claude/skills/` を編集した場合、`.agents/skills/` mirror も同期済み

## 苦戦箇所・注意

- **過剰 DRY の罠**: 判定ルールを SKILL.md に集約しすぎると Phase 11 / 12 を実行する際に SKILL.md → references の往復が増える。短いセクション（5 行未満）は明示性優先で重複を許容する判断を main.md に記録する
- **相互参照リンクの解像度**: `§X` 表記でセクション番号を引用すると、SKILL.md 改版時にリンク切れが発生する。本タスクではセクション **見出しテキスト** を引用ターゲットとし、見出し変更を検知できるようにする
- **mirror への波及忘れ**: 本 Phase で skill 本体を直接編集する場合、`.agents/skills/` mirror の同期を Phase 9 まで持ち越さず本 Phase 内で確認する
- **DRY と自己適用の衝突**: 本タスクは drink-your-own-champagne であり、本ワークフロー Phase 11 が縮約テンプレを参照する。Phase 8 の DRY 適用が Phase 11 着手時にリンク切れを起こさないよう、リンク先見出しの安定性を確認する

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する
- [ ] 成果物パスと `artifacts.json` の outputs（`outputs/phase-08/main.md`）が一致していることを確認する
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の skill 改修であり、アプリケーション統合テストは追加しない
- 統合検証は `diff -qr` mirror parity / Phase 9 品質保証 / Phase 11 自己適用 smoke / `artifacts.json` 整合で代替する
- skill-fixture-runner による SKILL.md 構造検証は本タスクのスコープ外（別タスクで仕切る）

## 次 Phase

- 次: Phase 9（品質保証 / typecheck / lint / mirror diff）
- 引き継ぎ: 正本所在マップ / DRY 適用後 skill 本体 / TECH-M-01 / AC GREEN 維持確認
