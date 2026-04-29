# Phase 3: 設計レビュー - ut-gov-005-docs-only-nonvisual-template-skill-sync

> **状態**: completed
> **作成日**: 2026-04-29
> **対象タスク**: task-specification-creator skill への docs-only / NON_VISUAL 縮約テンプレ反映
> **GitHub Issue**: #148 (CLOSED)
> **入力**: Phase 1 (`outputs/phase-01/main.md`) / Phase 2 (`outputs/phase-02/main.md`)

---

## 1. 代替案比較

### 1.1 代替案一覧

| 案 | 名称 | 概要 |
| --- | --- | --- |
| A | 縮約せず通常テンプレを上書き | docs-only タスクでも screenshot 必須を緩めず、`manual-test-result.md` 等を「N/A」記入で済ませる運用ルールに留める |
| B | docs-only 専用 skill を新設 | `task-specification-creator-docs-only` という別 skill を作成し、判定ロジックを skill 選択側に移譲 |
| C | SKILL.md のみ追記し references は触らない | 判定ルールを SKILL.md にだけ書き、`phase-template-phase11.md` 等の既存テンプレは現状維持 |
| D（base case）| SKILL.md + references 連動追記 + mirror 同期 | Phase 2 で設計した形。SKILL.md にタスクタイプ判定フロー、各 reference に縮約テンプレ・Part 2 チェック・Phase 1 必須入力を追記し、`.agents/` mirror 差分 0 を AC で担保 |

### 1.2 評価マトリクス

| 観点 | 案 A | 案 B | 案 C | 案 D（base case）|
| --- | --- | --- | --- | --- |
| 適用精度 | 低（N/A 記入の形骸化）| 高（完全分離）| 中（SKILL.md と reference のドリフト残存）| 高（SKILL.md + reference + mirror 3 層整合）|
| 冗長成果物の解消 | 不解消（screenshot N/A が残る）| 解消 | 部分解消（reference で screenshot 要求が残ればドリフト）| 解消 |
| 実現コスト | 低 | **高**（skill 二重保守 + skill-fixture-runner 拡張）| 低 | 中（6 ファイル追記 + mirror 同期）|
| 運用負債リスク | **高**（判定ロジック不在で再発）| 中（skill 選択ミスで誤適用）| 中（SKILL ↔ reference ドリフト）| 低（AC-5 mirror 差分 0 + AC-6 Phase 1 必須入力で多重防御）|
| 自己適用性 | 不可 | 不可（別 skill になる）| 不完全（reference が古い）| **可**（本タスク Phase 11 で第一適用）|
| 遡及適用 | 困難 | 不可（既存タスク移行不能）| 中 | **可**（新規 Phase 1 から / 進行中は Phase 11 着手時再判定）|
| mirror parity | 触らない（既存ドリフト温存）| 二倍化 | 部分維持 | **AC-5 で必須化** |
| 自己適用順序ゲート設計 | 不要 | 不要 | 不完全 | **明確**（Phase 5 → Phase 11 不変条件）|

### 1.3 PASS / MINOR / MAJOR 評価

| 案 | 評価 | 主な指摘 |
| --- | --- | --- |
| A | **MAJOR** | 原典 §1.2「冗長成果物発生」「Part 2 チェック漏れ」「状態誤書換え」「mirror parity 喪失」のいずれも解消できない。`visualEvidence` メタ未設定問題も未解決。**却下** |
| B | **MAJOR** | skill 二重保守コスト + skill 選択ミス時の誤適用リスク + skill-fixture-runner 拡張が必要。Wave governance タスクとしては過剰投資。**却下** |
| C | **MINOR** | SKILL.md のみ追記は短期で済むが、reference の冗長記述が残るため再発防止が弱い。Phase 8 DRY 化で reference 側を統合する想定なら、結局 D と同じ作業になる。Phase 2 設計に統合 |
| D（base case）| **PASS** | SKILL.md（判定ルール）+ reference（縮約テンプレ実体）+ mirror 同期 + 自己適用検証で全リスクを多重防御。原典 AC-1〜AC-6 を漏れなく満たす |

---

## 2. PASS / MINOR / MAJOR 総合判定

### 2.1 base case（D）の評価

- **PASS**
- 価値性 / 実現性 / 整合性 / 運用性すべてで合格基準を満たす
- Phase 2 で設計した 6 ファイル追記 + mirror 同期手順 + 自己適用順序ゲートが原典 AC-1〜AC-6 を漏れなく網羅
- 自己適用性（drink-your-own-champagne）が成立し、本タスクが第一適用例として機能する

### 2.2 残課題（PASS with notes）

| 残課題 | 対応 Phase |
| --- | --- |
| skill-fixture-runner による縮約テンプレ構造検証 | Phase 12 unassigned-task-detection で別タスク化（TECH-M-04）|
| mirror parity の CI gate 化（pre-commit / GitHub Actions）| Phase 12 unassigned-task-detection で別タスク化（TECH-M-02）|
| UT-GOV-001〜007 への遡及適用判断 | Phase 12 documentation で「新規 Phase 1 から / 進行中は Phase 11 着手時再判定」を明文化（TECH-M-03）|
| references 内の重複セクション統合 | Phase 8 DRY 化で対応（TECH-M-01）|

---

## 3. 着手可否ゲート

### 3.1 ゲート判定

**PASS**（仕様作成完了、Phase 4 以降への着手可）

### 3.2 着手前提条件（必須）

- [x] 親タスク（task-github-governance-branch-protection）の Phase 11 / 12 outputs が実証データとして存在
- [x] `.claude/skills/task-specification-creator/` および `.agents/skills/task-specification-creator/` が現存
- [x] mirror baseline parity を確認済（Phase 1 検証コマンドで取得）
- [x] `artifacts.json.metadata.visualEvidence=NON_VISUAL` / `taskType=docs-only` / `workflow_state=spec_created` が確定

### 3.3 NO-GO 条件

以下のいずれかに該当した時点で本タスク Phase 4 以降の着手を **見送る**。

- 親タスクの Phase 11 / 12 outputs が欠損（縮約テンプレの実証データが取れない）
- `.agents/skills/task-specification-creator/` mirror が baseline 時点で大幅にドリフトしている（先行修正タスクが必要）
- skill-fixture-runner が SKILL.md 追記によりエラーを返す構造変更が必要になる（本タスクスコープ外）
- GitHub Issue #148 を reopen する必要が発生した場合（本タスクは CLOSED のままで完結する設計）

### 3.4 Phase 13 blocked 条件

- AC-1〜AC-10 のいずれかが Phase 9 / Phase 10 で FAIL
- mirror 差分 0 が Phase 9 / Phase 11 で達成できない
- 縮約テンプレの自己適用（本タスク Phase 11）が失敗する
- Part 2 必須 5 項目（C12P2-1〜5）のいずれかが Phase 12 で FAIL

### 3.5 着手後の継続ゲート

| Phase | ゲート条件 |
| --- | --- |
| Phase 5（実装）| 6 ファイル追記完了 + `diff -qr` 差分 0 |
| Phase 9（品質保証）| `mise exec -- pnpm typecheck` / `pnpm lint` 成功 + mirror diff 0 |
| Phase 10（最終レビュー）| 縮約テンプレが skill にコミット済（自己適用可能状態）|
| Phase 11（手動 smoke）| 本タスク自身の `outputs/phase-11/` が縮約テンプレ通り 3 点で構成、screenshot 系ファイルが存在しない |
| Phase 12（ドキュメント）| C12P2-1〜5 すべて PASS、遡及適用方針明文化、TECH-M-02〜04 の未タスク化 |

---

## 4. 4 条件再評価

### 4.1 価値性（Value）

- **PASS（再確認）**
- docs-only / NON_VISUAL タスクの冗長成果物・判定ドリフト・状態誤書換え・mirror parity 喪失を一括解消
- UT-GOV-001〜007 系 Wave で再発する全 4 問題を構造的に防止
- 親タスク 1 件の実証知見を skill 正本に昇格させる構造で、再発防止効果が Wave 規模に波及
- 代替案 A（現状維持）は問題を再発させ、案 B / C はコストまたはドリフトが残る

### 4.2 実現性（Feasibility）

- **PASS（再確認）**
- 6 ファイルへの追記のみ。コード変更なし、CI / runtime 影響なし
- mirror 同期は `cp` + `diff -qr` で完結し、専用ツール不要
- ロールバックは 3 コミットの `git revert` で完了

### 4.3 整合性（Consistency）

- **PASS（再確認）**
- 既存の `phase-11-non-visual-alternative-evidence.md` および `phase-template-phase11.md`「docs-only / spec_created 必須3点」セクションと整合
- Phase 8 DRY 化で重複セクションを統合する余地を残す
- 不変条件 #5（D1 アクセス境界）に抵触しない

### 4.4 運用性（Operability）

- **PASS（with notes → resolved）**
- AC-5 mirror 差分 0 + AC-6 Phase 1 必須入力で多重防御
- 検証は `diff -qr` のみで完結し、専用 CI 不要
- 進行中タスクへの遡及適用方針は Phase 12 で明文化、CI gate 化は別タスクで仕切る

---

## 5. リスクと対策（Phase 1 / Phase 2 由来の集約）

| # | リスク | 影響度 | 発生確率 | 対策（Phase 配置） |
| --- | --- | --- | --- | --- |
| R-1 | `visualEvidence` メタ未設定で縮約テンプレ未発火 | 高 | 中 | AC-6 で Phase 1 必須入力化 + `phase-template-phase1.md` 追記（Phase 5）|
| R-2 | Phase 12 Part 2 必須 5 項目のチェック漏れ | 中 | 高 | C12P2-1〜5 一対一対応（Phase 2 §5 / Phase 5）|
| R-3 | `spec_created` が誤って `completed` に書換え | 中 | 中 | SKILL.md 状態分離節 + `phase-12-completion-checklist.md` docs-only ブランチ（Phase 5）|
| R-4 | `.agents/skills/` mirror 同期忘れ | 高 | 中 | AC-5 で `diff -qr` 差分 0 必須化 + Phase 5 末 / Phase 9 / Phase 11 の 3 箇所で検証 |
| R-5 | 自己適用循環で Phase 11 検証不能 | 中 | 低 | Phase 5 → Phase 11 順序ゲートを Phase 2 §9 で不変条件化 |
| R-6 | 既存セクションと新規縮約テンプレの重複 | 低 | 高 | Phase 8 DRY 化で統合（TECH-M-01）|
| R-7 | UT-GOV-001〜007 への遡及適用方針未定で運用が割れる | 中 | 中 | Phase 12 documentation で明文化（TECH-M-03）|
| R-8 | CI gate 化（mirror parity）の不在で将来再発 | 中 | 中 | Phase 12 で別タスク化（TECH-M-02）|
| R-9 | skill-fixture-runner が SKILL.md 追記で fail | 中 | 低 | Phase 9 で fixture runner 実行確認、fail なら追記形式を調整 |

---

## 6. MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決Phase | 解決確認Phase |
| --- | --- | --- | --- |
| TECH-M-01 | 既存 references セクション（docs-only 必須3点）と新規縮約テンプレの重複統合 | Phase 8 | Phase 8 / Phase 10 |
| TECH-M-02 | mirror parity の CI gate 化（pre-commit / GitHub Actions）を別タスクとして仕切る | Phase 12 | Phase 12 |
| TECH-M-03 | UT-GOV-001〜007 への遡及適用方針の明文化 | Phase 12 | Phase 12 |
| TECH-M-04 | skill-fixture-runner による縮約テンプレ構造検証を別タスク化 | Phase 12 | Phase 12 |

---

## 7. 派生実装タスクへの引き継ぎ事項

| 引き継ぎ先 | 内容 |
| --- | --- |
| Phase 4（テスト戦略）| Phase 2 §11 validation path / 自己適用順序ゲートをテスト戦略に展開。テストレベルは型 / 静的検証 / mirror parity / 自己適用 smoke の 4 層 |
| Phase 5（実装ランブック）| Phase 2 §2 編集計画 / §3〜§6 各 reference 追記 diff / §7 mirror 同期スクリプトを Step-by-step 化 |
| Phase 6（異常系検証）| Phase 3 §5 リスク R-1〜R-9 を異常系シナリオに展開（mirror 同期忘れ / 状態誤書換え / 自己適用循環）|
| Phase 7（AC マトリクス）| Phase 1 §5 AC-1〜AC-10 を検証手段マトリクスに展開 |
| Phase 8（DRY 化）| TECH-M-01: 既存「docs-only / spec_created 必須3点」セクションを新「docs-only / NON_VISUAL 縮約テンプレ」セクションに統合 |
| Phase 9（品質保証）| `pnpm typecheck` / `pnpm lint` の副作用なし確認 + `diff -qr` mirror parity 確認 + skill-fixture-runner 実行確認（fail しないこと）|
| Phase 10（最終レビュー）| 縮約テンプレが自己適用可能な状態で skill にコミット済か最終確認、TECH-M-01〜04 の解決状況確認 |
| Phase 11（手動 smoke）| 本タスク自身の Phase 11 outputs を縮約テンプレ通り 3 点（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）で作成。screenshot 不在を確認 |
| Phase 12（ドキュメント更新）| Part 2 必須 5 項目（C12P2-1〜5）チェック実施、TECH-M-02〜04 の未タスク化、UT-GOV-001〜007 遡及適用方針明文化 |
| Phase 13（PR 作成）| 単一 PR、3 コミット構成（skill 編集 / mirror 同期 / 自己適用 outputs）、CLOSED Issue #148 を reopen せずタスク仕様書として参照リンク化 |

---

## 8. レビュー結論

### 8.1 結論

- **base case D（SKILL.md + references 連動追記 + mirror 同期）を採用**
- ゲート判定: **PASS**（着手可、NO-GO 条件該当なし）
- Phase 2 設計は代替案比較で抽出された全リスクを Phase 配置レベルで網羅しており、追加修正は不要
- MINOR は 4 件（TECH-M-01〜04）あり、Phase 8 / 12 で解決義務がある

### 8.2 確定事項

1. **採用案**: D（SKILL.md + references 連動追記 + mirror 同期）
2. **編集対象**: skill 本体 6 ファイル + mirror 6 ファイル
3. **mirror 同期**: `cp` + `diff -qr` 差分 0、3 箇所（Phase 5 末 / 9 / 11）で検証
4. **自己適用**: 本タスク Phase 11 / 12 で第一適用、Phase 5 → 11 順序ゲートを不変条件化
5. **状態分離**: workflow root `状態`（`spec_created`）と `phases[].status`（`completed` 等）を別レイヤとして明文化
6. **Part 2 5 項目チェック**: C12P2-1〜5 を SKILL.md 記述と一対一対応化
7. **遡及適用方針**: 新規タスクは Phase 1 から / 進行中タスクは Phase 11 着手時再判定（Phase 12 documentation）
8. **CI gate 化**: 本タスクスコープ外、別タスクで仕切る（TECH-M-02）
9. **GitHub Issue #148**: CLOSED のまま、reopen しない

### 8.3 Phase 4 着手判定

**PASS — Phase 4 着手可。** Phase 4 では本 Phase の引き継ぎ事項に従ってテスト戦略を展開する。
