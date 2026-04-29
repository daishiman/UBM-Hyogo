# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 上流 | Phase 2（設計） |
| 下流 | Phase 4（テスト戦略） |
| 状態 | completed |
| user_approval_required | false |

## 目的

Phase 2 で確定した編集計画 / mirror 同期手順 / 自己適用順序ゲート / Part 2 5 項目チェック表に対し、代替案 4 案以上を比較し PASS / MINOR / MAJOR を確定する。Phase 4 への着手可否ゲートを判定する。

## 入力

- `outputs/phase-02/main.md`
- 原典スペック §2.2 推奨 AC / §8 苦戦箇所
- 親タスク Phase 11 / 12 outputs（実証データ）

## 代替案比較

### 1.1 代替案一覧

| 案 | 名称 | 概要 |
| --- | --- | --- |
| A | 縮約せず通常テンプレを上書き | docs-only タスクでも screenshot 必須を緩めず、`manual-test-result.md` 等を「N/A」記入で済ませる |
| B | docs-only 専用 skill を新設 | `task-specification-creator-docs-only` という別 skill を作成し、判定ロジックは skill 選択側に移譲 |
| C | SKILL.md のみ追記し references は触らない | 判定ルールを SKILL.md にだけ書き、phase-template-phase11.md 等の既存テンプレは現状維持 |
| D（base case）| SKILL.md + references 連動追記 + mirror 同期 | Phase 2 で設計した形。SKILL.md にタスクタイプ判定フロー、各 reference に縮約テンプレ・Part 2 チェック・Phase 1 必須入力を追記し、`.agents/` mirror 差分 0 を AC で担保 |

### 1.2 評価マトリクス

| 観点 | 案 A | 案 B | 案 C | 案 D（base case）|
| --- | --- | --- | --- | --- |
| 適用精度 | 低（N/A 記入が形骸化しやすい） | 高（完全分離）| 中（SKILL.md と reference のドリフトが残る）| 高（SKILL.md + reference + mirror の 3 層整合） |
| 冗長成果物の解消 | 不解消（screenshot N/A が残る）| 解消 | 部分解消（reference で screenshot 要求が残るとドリフト）| 解消 |
| 実現コスト | 低 | **高**（skill 二重保守 + skill-fixture-runner 拡張）| 低 | 中（6 ファイル追記 + mirror 同期手順）|
| 運用負債リスク | **高**（判定ロジック不在で再発）| 中（skill 選択ミスで誤適用）| 中（SKILL ↔ reference ドリフト）| 低（AC-5 mirror 差分 0 + AC-6 Phase 1 必須入力で二重防御）|
| 自己適用性（drink-your-own-champagne）| 不可 | 不可（別 skill になる）| 不完全（reference が古い）| **可**（本タスク Phase 11 で第一適用）|
| 遡及適用 | 困難 | 不可（既存タスク移行不能）| 中 | **可**（新規タスクから / 進行中は Phase 11 着手時に再判定）|
| mirror parity | 触らない（既存ドリフトを温存）| 二倍化 | 部分維持 | **AC で必須化** |

### 1.3 PASS / MINOR / MAJOR 評価

| 案 | 評価 | 主な指摘 |
| --- | --- | --- |
| A | **MAJOR** | 原典 §1.2「冗長成果物発生」を解消できない。`visualEvidence` メタ未設定問題も未解決。**却下** |
| B | **MAJOR** | skill 二重保守コスト + skill 選択ミス時の誤適用リスク。Wave governance タスクとしては過剰投資。**却下** |
| C | **MINOR** | SKILL.md のみ追記は短期で済むが、reference の冗長記述が残るため再発防止が弱い。Phase 8 DRY 化で reference 側を統合するなら本案に統合可能。Phase 2 のコメント仕様で D に統合 |
| D（base case）| **PASS** | SKILL.md（判定ルール）+ reference（縮約テンプレ実体）+ mirror 同期 + 自己適用検証で全リスクを多重防御。原典 AC-1〜AC-6 を漏れなく満たす |

## PASS / MINOR / MAJOR の総合判定

### 2.1 base case（D）の評価

- **PASS**
- 価値性 / 実現性 / 整合性 / 運用性すべてで合格基準を満たす
- Phase 2 で設計した 6 ファイル追記 + mirror 同期手順 + 自己適用順序ゲートが原典 AC-1〜AC-6 を漏れなく網羅

### 2.2 残課題（PASS with notes）

| 残課題 | 対応 Phase |
| --- | --- |
| skill-fixture-runner による縮約テンプレ構造検証 | Phase 12 unassigned-task-detection で別タスク化（本タスクスコープ外） |
| mirror parity の CI gate 化（pre-commit / GitHub Actions） | Phase 12 unassigned-task-detection で別タスク化（本タスクは AC-5 の `diff -qr` 手動検証で担保） |
| UT-GOV-001〜007 への遡及適用判断 | Phase 12 documentation で「新規 Phase 1 から適用」「進行中は Phase 11 着手時再判定」を明文化 |
| references 内の重複セクション（既存「docs-only / spec_created 必須3点」と新規「縮約テンプレ」）の統合 | Phase 8 DRY 化で対応 |

## 着手可否ゲート

### 3.1 ゲート判定

**PASS**（仕様作成は完了、Phase 4 以降への着手可）

### 3.2 着手前提条件（必須）

- [x] 親タスク（task-github-governance-branch-protection）の Phase 11 / 12 outputs が実証データとして存在
- [x] `.claude/skills/task-specification-creator/` および `.agents/skills/task-specification-creator/` が現存（mirror baseline 取得済）
- [x] `artifacts.json.metadata.visualEvidence=NON_VISUAL` / `taskType=docs-only` / `workflow_state=spec_created` が確定

### 3.3 NO-GO 条件

以下のいずれかに該当した時点で本タスク Phase 4 以降の着手を **見送る**。

- 親タスクの Phase 11 / 12 outputs が欠損している（縮約テンプレの実証データが取れない）
- `.agents/skills/task-specification-creator/` mirror が baseline 時点で大幅にドリフトしている（先行修正タスクが必要）
- skill-fixture-runner が SKILL.md 追記によりエラーを返す構造変更が必要になる（本タスクスコープ外）

### 3.4 Phase 13 blocked 条件

- AC-1〜AC-10 のいずれかが Phase 9 / Phase 10 で FAIL
- mirror 差分 0 が Phase 9 / Phase 11 で達成できない
- 縮約テンプレの自己適用（本タスク Phase 11）が失敗する

### 3.5 着手後の継続ゲート

| Phase | ゲート条件 |
| --- | --- |
| Phase 5（実装）| 6 ファイル追記完了 + `diff -qr` 差分 0 |
| Phase 9（品質保証）| `mise exec -- pnpm typecheck` / `pnpm lint` 成功 + mirror diff 0 |
| Phase 10（最終レビュー）| 縮約テンプレが自己適用可能な状態で skill にコミット済 |
| Phase 11（手動 smoke）| 本タスク自身の `outputs/phase-11/` が縮約テンプレ通り 3 点で構成 |
| Phase 12（ドキュメント）| Part 2 必須 5 項目 C12P2-1〜5 がすべて PASS |

## 4 条件再評価

### 4.1 価値性（Value）

- **PASS（再確認）**
- docs-only / NON_VISUAL タスクの冗長成果物（screenshot N/A 等）を構造的に排除し、判定ドリフト・状態誤書換え・mirror parity 喪失を多重防御
- UT-GOV-001〜007 系 Wave で再発する全 4 問題（原典 §1.2）を一括解消
- 代替案 A（現状維持）は問題を再発させ、案 B / C はコストまたはドリフトが残る

### 4.2 実現性（Feasibility）

- **PASS（再確認）**
- 6 ファイルへの追記のみ。コード変更なし、CI / runtime 影響なし
- mirror 同期は `rsync` / `cp` + `diff -qr` で完結し、専用ツール不要
- ロールバックは追記コミットの `git revert` で完了

### 4.3 整合性（Consistency）

- **PASS（再確認）**
- 既存の `phase-11-non-visual-alternative-evidence.md` および `phase-template-phase11.md` の「docs-only / spec_created 必須3点」セクションと整合し、矛盾しない
- Phase 8 DRY 化で重複セクションを統合する余地を残す
- 不変条件 #5（D1 アクセス境界）に抵触しない

### 4.4 運用性（Operability）

- **PASS（with notes → resolved）**
- AC-5 mirror 差分 0 + AC-6 Phase 1 必須入力で多重防御
- 検証は `diff -qr` のみで完結し、専用 CI 不要
- 進行中タスクへの遡及適用方針は Phase 12 documentation で明文化

## リスクと対策（Phase 1 / Phase 2 由来の集約）

| # | リスク | 影響度 | 発生確率 | 対策（Phase 配置） |
| --- | --- | --- | --- | --- |
| R-1 | `visualEvidence` メタ未設定で縮約テンプレ未発火 | 高 | 中 | AC-6 で Phase 1 必須入力化 + `phase-template-phase1.md` 追記（Phase 5）|
| R-2 | Phase 12 Part 2 必須 5 項目のチェック漏れ | 中 | 高 | C12P2-1〜5 一対一対応（Phase 2 §4 / Phase 5）|
| R-3 | `spec_created` が誤って `completed` に書換え | 中 | 中 | SKILL.md 状態分離節 + `phase-12-completion-checklist.md` docs-only ブランチ（Phase 5）|
| R-4 | `.agents/skills/` mirror 同期忘れ | 高 | 中 | AC-5 で `diff -qr` 差分 0 必須化 + Phase 5 末 / Phase 9 / Phase 11 の 3 箇所で検証 |
| R-5 | 自己適用循環で Phase 11 検証不能 | 中 | 低 | Phase 5 → Phase 11 順序ゲートを Phase 2 §7 で不変条件化 |
| R-6 | 既存セクションと新規縮約テンプレの重複 | 低 | 高 | Phase 8 DRY 化で統合 |
| R-7 | UT-GOV-001〜007 への遡及適用方針未定で運用が割れる | 中 | 中 | Phase 12 documentation で「新規 Phase 1 から / 進行中は Phase 11 着手時再判定」を明文化 |
| R-8 | CI gate 化（mirror parity）の不在で将来再発 | 中 | 中 | 本タスクスコープ外として Phase 12 で別タスク化（unassigned-task-detection）|

## MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決Phase | 解決確認Phase |
| --- | --- | --- | --- |
| TECH-M-01 | 既存 references セクション（docs-only 必須3点）と新規縮約テンプレの重複統合 | Phase 8 | Phase 8 / Phase 10 |
| TECH-M-02 | mirror parity の CI gate 化（pre-commit / GitHub Actions）を別タスクとして仕切る | Phase 12 | Phase 12 |
| TECH-M-03 | UT-GOV-001〜007 への遡及適用方針の明文化 | Phase 12 | Phase 12 |
| TECH-M-04 | skill-fixture-runner による縮約テンプレ構造検証 | Phase 12 | Phase 12 |

## 実行タスク

1. 代替案 A〜D の比較表作成
2. 観点別 PASS / MINOR / MAJOR 判定
3. リスク R-1〜R-8 と Phase 配置を確定
4. MINOR 追跡テーブル（TECH-M-01〜04）作成
5. Phase 4 着手可否ゲート判定
6. Phase 13 blocked 条件記述
7. 4 条件再評価（Phase 2 設計を踏まえた更新）

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-02/main.md` |
| 必須 | `docs/30-workflows/completed-tasks/UT-GOV-005-docs-only-nonvisual-template-skill-sync.md` |
| 必須 | 親タスク Phase 11 / 12 outputs |

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-03/main.md` | 代替案比較 / PASS-MINOR-MAJOR 判定 / 着手可否ゲート / 4 条件再評価 / リスク表 / MINOR 追跡 / Phase 4 引き継ぎ |

## 完了条件 (DoD)

- [x] 代替案 4 案（A / B / C / D）比較完了
- [x] PASS / MINOR / MAJOR 判定が観点別に確定
- [x] base case D が PASS
- [x] Phase 4 着手可否 = PASS（NO-GO 該当なし）
- [x] Phase 13 blocked 条件明記
- [x] MINOR 追跡テーブル（4 件）記載
- [x] 4 条件再評価で全 PASS

## 苦戦箇所・注意

- **案 A の誘惑**: 「現状維持で N/A 記入すればいい」という誘惑があるが、判定ロジックが skill 側に存在しないため必ず再発する。原典 §1.2 を必ず参照
- **MINOR の見落とし**: TECH-M-01〜04 はすべて Phase 8 / 12 で解決義務がある。MINOR 追跡テーブルから漏らさない
- **PASS だから即着手は禁物**: Phase 5 で skill 編集が完了するまで Phase 11 自己適用検証は実行不能。順序ゲート（Phase 2 §7）を Phase 4 / 5 設計でも再確認

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [x] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の skill 改善であり、アプリケーション統合テストは追加しない。
- 統合検証は `diff -qr` mirror parity、`pnpm typecheck` / `pnpm lint` の副作用なし確認、Phase 11 縮約テンプレ自己適用 smoke で代替する。

## 次 Phase

- 次: Phase 4（テスト戦略）
- 引き継ぎ: PASS 判定 / MINOR 4 件（Phase 8 / 12 で解決）/ リスク R-1〜R-8 / 自己適用順序ゲート / Part 2 5 項目チェック表
