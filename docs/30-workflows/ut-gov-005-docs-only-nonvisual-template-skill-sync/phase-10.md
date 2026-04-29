# Phase 10: 最終レビュー（Go-No-Go）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー（Go-No-Go） |
| 作成日 | 2026-04-29 |
| 上流 | Phase 9（品質保証） |
| 下流 | Phase 11（手動 smoke / 縮約テンプレ自己適用検証） |
| 状態 | pending |
| user_approval_required | false |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |

## 目的

Phase 9 までの全成果物（skill 本体追記 / DRY 化 / mirror 同期 / indexes 再生成 / 200 行規約 / AC GREEN）を統合判定し、Phase 11（縮約テンプレ自己適用 smoke）への着手可否を確定する。本タスクは drink-your-own-champagne 構造のため、Phase 11 で本ワークフロー自身が縮約テンプレ第一適用例として動作する設計が破綻していないかを最終ゲートで確認する。

## 入力

- `outputs/phase-09/main.md`（検証ログ / 一括判定結果）
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-08/main.md`（DRY 化結果 / TECH-M-01）
- Phase 3 MINOR 追跡テーブル（`outputs/phase-03/main.md`）

## レビュー観点

### 1. AC 全件 PASS 確認

| AC ID | 内容 | Phase 9 結果 | 判定 |
| --- | --- | --- | --- |
| AC-1 | `phase-template-phase11.md` に縮約テンプレ追加（main / manual-smoke-log / link-checklist 3 点固定 / screenshot 不要明文化） | pending | pending |
| AC-2 | `visualEvidence == NON_VISUAL` 入力で縮約テンプレ発火する判定ルールが SKILL.md / phase-template-phase11.md 双方で明記 | pending | pending |
| AC-3 | Phase 12 Part 2 必須要件 5 項目（型 / API / 例 / エラー / 設定値）が compliance-check で一対一チェック項目化 | pending | pending |
| AC-4 | compliance-check に docs-only 用判定ブランチ追加 / `spec_created` と `completed` 状態分離記述 | pending | pending |
| AC-5 | `diff -qr` mirror parity 0（Phase 2 / 9 / 11 の 3 箇所で検証手順固定） | pending | pending |
| AC-6 | `phase-template-phase1.md` または `phase-template-core.md` に「Phase 1 で `visualEvidence` 必須入力確定」ルール追記 | pending | pending |
| AC-7 | docs-only / NON_VISUAL / skill_governance / docs-only が Phase 1 で固定され `artifacts.json.metadata` と一致 | pending | pending |
| AC-8 | 本ワークフロー Phase 11 / 12 が縮約テンプレを自己適用する設計（drink-your-own-champagne） | pending | pending（Phase 11 で最終確定） |
| AC-9 | Phase 3 で代替案 4 案以上比較 / base case D が PASS | pending | pending |
| AC-10 | Phase 1〜13 が `artifacts.json.phases[]` と完全一致 / 4 条件 PASS | pending | pending |

### 2. Go 条件

| 条件 ID | 内容 | 判定 |
| --- | --- | --- |
| G-1 | AC-1〜AC-10 全件 PASS（AC-8 のみ Phase 11 自己適用 smoke で最終確定） | pending |
| G-2 | DRY 違反 0（Phase 8 観点 1〜5 すべて重複削除済み or 明示性優先理由が記録済み） | pending |
| G-3 | mirror parity 0（`diff -qr` 標準出力なし） | pending |
| G-4 | Phase 12 Part 2 5 項目チェックが `phase-12-completion-checklist.md` に項目化済み（AC-3 と連動） | pending |
| G-5 | indexes drift 0 / Progressive Disclosure 200 行違反 0 | pending |

### 3. No-Go 条件（1 件でも該当すれば No-Go）

| 条件 ID | 内容 | 判定 |
| --- | --- | --- |
| NG-1 | 縮約テンプレが既存 broad テンプレ（`phase-template-phase11.md` の VISUAL 向け本体）と矛盾している | pending |
| NG-2 | `.agents/skills/task-specification-creator/` mirror 差分が残存（`diff -qr` 出力あり） | pending |
| NG-3 | `spec_created`（workflow root）と `completed`（ledger / Phase 別）の状態分離記述が `phase-12-completion-checklist.md` に欠落 | pending |
| NG-4 | 既存 docs-only タスクへの遡及適用方針（新規タスクから適用 / 進行中は Phase 11 着手時から適用）が Phase 12 documentation 計画に明記されていない | pending |
| NG-5 | `pnpm typecheck` / `pnpm lint` / `pnpm indexes:rebuild` のいずれかが FAIL | pending |
| NG-6 | skill-fixture-runner 互換性が壊れている（既存 SKILL.md 構造検証 FAIL） | pending |

### 4. 自己レビュー（レビューア視点）

| 観点 | チェック内容 | 判定 |
| --- | --- | --- |
| 後方互換性 | 既存 VISUAL タスク向けテンプレが本改修で挙動変化していないか（追記のみで上書きなし） | pending |
| 既存進行中タスク影響 | 進行中の docs-only タスク（UT-GOV-001〜004 等）が縮約テンプレを Phase 11 着手時から適用できる導線になっているか | pending |
| 自己適用テスト可否 | Phase 11 で本ワークフロー自身が `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点で完結できる設計になっているか | pending |
| 循環参照リスク | 縮約テンプレが skill 本体に **既にコミット済み** の状態で Phase 11 に入る順序ゲート（Phase 2 設計）が機能しているか | pending |
| MINOR 持ち越し | TECH-M-01 が Phase 12 documentation で確実に解決される導線が引かれているか | pending |

### 5. MINOR / MAJOR 戻り先

| 種別 | 該当 | 戻り先 |
| --- | --- | --- |
| TECH-M-01（Phase 8 由来） | DRY 違反の構造化解消 | Phase 12 documentation で再確認、Phase 8 で完了済みなら closed |
| Phase 3 由来 MINOR | 代替案比較で残存した MINOR があれば再掲 | Phase 12 で解決 |
| MAJOR | なし（残存する場合は Go 不可） | — |

### 6. Phase 11 着手可否

- 判定: G-1〜G-5 全件 PASS かつ NG-1〜NG-6 全件非該当の場合のみ Phase 11 着手可
- ブロック条件: 上記いずれかが FAIL
- AC-8（drink-your-own-champagne 自己適用）は Phase 11 outputs で最終確定するため、Phase 10 では「設計上の自己適用性が担保されている」ことのみを確認する

## 実行タスク

1. AC マトリクス（観点 1）を Phase 9 の実測結果で更新する
2. Go 条件（観点 2）を埋める
3. No-Go 条件（観点 3）を埋める
4. 自己レビュー（観点 4）を埋める
5. MINOR / MAJOR 戻り先（観点 5）を確定する
6. Phase 11 着手可否（観点 6）を判定する
7. Go / No-Go 結論を `outputs/phase-10/go-no-go.md` に記述する

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-09/main.md` |
| 必須 | `outputs/phase-07/ac-matrix.md` |
| 必須 | `outputs/phase-08/main.md` |
| 必須 | `outputs/phase-03/main.md`（MINOR 追跡） |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md`（追記後） |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`（追記後） |
| 参考 | `docs/30-workflows/skill-ledger-b1-gitattributes/phase-10.md`（フォーマット模倣元） |

## 依存Phase明示

- Phase 1 成果物（要件 / AC-1〜10）を参照する
- Phase 2 成果物（順序ゲート / mirror 同期手順）を参照する
- Phase 3 成果物（MINOR 追跡）を参照する
- Phase 7 成果物（AC マトリクス）を最終結果で更新する
- Phase 8 成果物（DRY 化 / TECH-M-01）を参照する
- Phase 9 成果物（検証ログ）を入力とする

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-10/go-no-go.md` | AC PASS マトリクス / Go 条件 / No-Go 条件 / 自己レビュー結果 / MINOR 戻り先 / Phase 11 着手可否 / Go-No-Go 結論 |

## 完了条件 (DoD)

- [ ] AC-1〜AC-10 全件判定済み（AC-8 は Phase 11 で最終確定の旨を明記）
- [ ] Go 条件 G-1〜G-5 全件記入
- [ ] No-Go 条件 NG-1〜NG-6 全件記入
- [ ] 自己レビュー 5 観点全件記入
- [ ] MINOR / MAJOR 戻り先明記
- [ ] Phase 11 着手可否判定
- [ ] Go / No-Go 結論を `go-no-go.md` 冒頭に明示

## 苦戦箇所・注意

- **AC-8 の pending 扱い**: drink-your-own-champagne の最終確定は Phase 11 自己適用 smoke で行う。Phase 10 では「Phase 11 outputs 3 点が縮約テンプレに準拠する設計になっている」ことのみを確認する
- **MINOR 流し**: 「PASS だから次へ」ではなく、TECH-M-01 を Phase 12 documentation-changelog で再確認する責務を必ず引き継ぐ
- **No-Go 条件の主観排除**: 「壊れていないように見える」ではなく Phase 9 実測値（`diff -qr` 出力 / `git diff --exit-code` exit code / 200 行制限超過数）で機械判定
- **遡及適用方針の見落とし**: NG-4 は実装ではなく Phase 12 documentation の話だが、Phase 10 で見落とすと運用が割れる。Phase 12 計画のドラフトが existing か必ず確認する
- **循環参照リスク**: Phase 11 着手時に skill 本体が **既にコミット済み** の前提が崩れていると本ワークフローが詰む。Phase 5 完了 → Phase 8 DRY → Phase 9 検証 → Phase 10 ゲート → Phase 11 自己適用、の順序が破綻していないか必ず確認

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する
- [ ] 成果物パスと `artifacts.json` の outputs（`outputs/phase-10/go-no-go.md`）が一致していることを確認する
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の skill 改修であり、アプリケーション統合テストは追加しない
- 統合検証は Phase 9 の機械判定 + Phase 11 自己適用 smoke + `artifacts.json` 整合で代替する
- 派生実装タスク（CI gate 化 / fixture 拡張）は本タスクスコープ外で別タスクとして仕切る

## 次 Phase

- 次: Phase 11（手動 smoke test / 縮約テンプレ自己適用検証）
- 引き継ぎ: AC PASS マトリクス（AC-8 pending）/ Go 判定 / Phase 11 着手前提条件（skill 本体コミット済 / mirror parity 0 / indexes drift 0）
