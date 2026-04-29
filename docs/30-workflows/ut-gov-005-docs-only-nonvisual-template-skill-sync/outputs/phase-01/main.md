# Phase 1: 要件定義 - ut-gov-005-docs-only-nonvisual-template-skill-sync

> **状態**: completed
> **作成日**: 2026-04-29
> **対象タスク**: task-specification-creator skill への docs-only / NON_VISUAL 縮約テンプレ反映
> **GitHub Issue**: #148 (CLOSED のままタスク仕様書として再構築)
> **原典**: `docs/30-workflows/completed-tasks/UT-GOV-005-docs-only-nonvisual-template-skill-sync.md`
> **親タスク**: `task-github-governance-branch-protection`

---

## 1. 背景と問題

### 1.1 背景

親タスク `task-github-governance-branch-protection` は docs-only / NON_VISUAL タイプであり、Phase 6〜11 の標準テンプレ（screenshot 取得・ビジュアル検証）を額面通り適用すると過剰成果物が発生した。実運用では Phase 11 の意味のある canonical artefact は `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点のみであり、screenshot は存在意義がなかった。また Phase 12 Part 2（実装ガイド技術者向け）の必須要件（型定義 / API シグネチャ / 使用例 / エラー処理 / 設定可能パラメータ）は SKILL.md に明記されているが `phase-12-completion-checklist.md` 側に項目化されておらず、ドリフトが発生していた。

`task-specification-creator` skill にこの実証知見を **正本** として反映しなければ、UT-GOV-001〜007 系の Wave 全体で同じ冗長成果物・判定ドリフトが再発する。本タスクは親タスクの Phase 11 / 12 outputs を入力として、skill 本体に「docs-only / NON_VISUAL 縮約テンプレ」「Phase 12 Part 2 5 項目チェック」「`spec_created` vs `completed` 状態分離」「`.agents/` mirror 同期 AC」を埋め込み、再発を構造的に防止する。

本タスクは自身が docs-only / NON_VISUAL であり、追加するテンプレを **自分自身の Phase 11 / 12 に第一適用する**（drink-your-own-champagne）。テンプレ整備と適用第一例が同じ PR で閉じる構造的特異性を Phase 1〜3 で明示する。

### 1.2 問題点・課題（原典 §1.2 抽出）

- **冗長成果物の発生**: docs-only タスクで Phase 11 が screenshot を要求する誤判定が頻発（`visualEvidence` メタ未設定が主因）
- **Part 2 必須要件のチェック漏れ**: 型定義 / API シグネチャ / 使用例 / エラー処理 / 設定可能パラメータの 5 項目が validator / compliance-check 側で項目化されておらず、SKILL.md と運用結果がドリフト
- **状態誤書換え**: workflow root の `状態` が `spec_created`（仕様書作成済 / 実装着手前）であるべきところを Phase 12 close-out で誤って `completed` に書き換えるパターンがある（workflow root と Phase 別 status の状態分離が未定義）
- **mirror parity 喪失**: `.claude/skills/` を更新後 `.agents/skills/` mirror への同期忘れで参照ドリフトが発生

### 1.3 放置した場合の影響（原典 §1.3 抽出）

- 次回以降の docs-only / NON_VISUAL / `spec_created` タスクで同じ冗長成果物・判定ドリフトが Wave 規模で再発
- Phase 12 Part 2 の品質低下（型・API シグネチャ・例の欠落が常態化）
- skill 本体と `.agents/` mirror の不一致でエージェントの参照経路が不安定化（`.agents/` 経由参照と `.claude/` 経由参照で内容が異なる）

---

## 2. 真の論点（システム / 戦略 / 問題解決の 3 系統レビュー）

### 2.1 システム論点

- skill の正本は `.claude/skills/` に閉じ、`.agents/skills/` は mirror として常に 1:1 で同期する。両者が異なる「正本」を持つことは設計上の不変条件として固定する
- 縮約テンプレの発火条件は `artifacts.json.metadata.visualEvidence == "NON_VISUAL"` というデータ駆動とし、文中ヒューリスティックで判定しない
- workflow root の `状態`（`spec_created` / `completed`）と `phases[].status`（`completed` / `pending` / `blocked`）は別レイヤであり、Phase 12 close-out では実装完了タスクのみ workflow root を書き換える

### 2.2 戦略論点

- 本タスクは UT-GOV-001〜007 系 Wave の **再発防止策** として位置付ける。親タスク 1 件の経験を skill 正本に昇格させ、後続タスクの Phase 1 から自動適用する
- 進行中の docs-only タスクへの **遡及適用** 方針は明文化する（Phase 12 documentation）。新規タスクは Phase 1 から、進行中タスクは Phase 11 着手時に再判定
- mirror parity の CI gate 化（pre-commit / GitHub Actions）は本タスクスコープ外。手動検証（`diff -qr`）で AC を担保し、CI gate は別タスクで仕切る

### 2.3 問題解決論点

- **`visualEvidence` の Phase 1 必須入力化**: Phase 1 完了条件として `artifacts.json.metadata.visualEvidence` の確定を必須にし、未設定で Phase 11 縮約テンプレが発火しない事故を防ぐ
- **Part 2 5 項目の一対一チェック化**: SKILL.md 記述と `phase-12-completion-checklist.md` の判定基準を 1:1 で対応させ、ドリフトを構造的に排除
- **mirror parity の AC 化**: `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` が差分 0 を返すことを AC-5 として固定し、Phase 5 末 / Phase 9 / Phase 11 の 3 箇所で検証
- **自己適用順序ゲート**: 本タスク Phase 5（skill 編集完了）→ Phase 11（縮約テンプレ自己適用検証）の serial 依存を不変条件化し、循環参照を防ぐ

---

## 3. 改修対象 skill ファイル一覧

| パス | 主な追記内容 |
| --- | --- |
| `.claude/skills/task-specification-creator/SKILL.md` | 「タスクタイプ判定フロー（docs-only / NON_VISUAL）」「状態分離（spec_created vs completed）」セクション追記 |
| `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | docs-only / NON_VISUAL 縮約テンプレ（必須 artefact 3 点固定 / screenshot 不要明文化 / 発火条件明記）追記 |
| `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | Part 2 必須 5 項目チェックの一対一対応化（C12P2-1〜5）|
| `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`（または当該 SKILL セクション）| docs-only 用判定ブランチ + 状態分離記述 |
| `.claude/skills/task-specification-creator/references/phase-template-phase1.md` | Phase 1 で `visualEvidence` を必須入力化するルール |
| `.claude/skills/task-specification-creator/references/phase-template-core.md` | タスクタイプ判定フローへの参照リンク |
| `.agents/skills/task-specification-creator/`（同名 6 ファイル）| 上記 6 ファイルへの編集を 1:1 mirror 同期 |

---

## 4. スコープ

### 4.1 含む

- skill 本体（`.claude/skills/task-specification-creator/`）への 6 ファイル追記設計
- `.agents/skills/task-specification-creator/` mirror 同期手順と「差分 0」検証
- 縮約テンプレの自己適用性（本タスク自身を第一適用例として参照リンク化）
- Phase 12 Part 2 必須 5 項目チェック（C12P2-1〜5）の一対一対応化
- `spec_created` / `completed` 状態分離ルールの明文化
- Phase 1 で `visualEvidence` を必須入力化するルールの追記

### 4.2 含まない

- skill 本体のリファクタ（Progressive Disclosure 再分割等）
- 親タスクの仕様変更
- VISUAL タスク向けテンプレの改修
- mirror parity の CI gate 化（pre-commit / GitHub Actions）→ 別タスクで仕切る
- skill-fixture-runner による縮約テンプレ構造検証 → 別タスクで仕切る
- UT-GOV-001〜007 への遡及適用作業（方針明文化までを本タスクスコープとし、各タスクへの実適用は当該タスク側で実施）

---

## 5. 受入条件

- **AC-1**: `references/phase-template-phase11.md` に docs-only / NON_VISUAL 向けの縮約テンプレが追加され、`outputs/phase-11/` の必須 artefact が `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点に固定。screenshot 不要を明文化
- **AC-2**: `artifacts.json.metadata.visualEvidence == "NON_VISUAL"` を発火条件とする判定ルールが `SKILL.md`（タスクタイプ判定フロー）と `phase-template-phase11.md`（タスク種別判定セクション）の双方に明記
- **AC-3**: Phase 12 Part 2 必須 5 項目（型定義 / API シグネチャ / 使用例 / エラー処理 / 設定可能パラメータ・定数）が `phase-12-completion-checklist.md`（または当該 SKILL セクション）でチェック項目化され、SKILL.md 記述と一対一対応
- **AC-4**: `phase-12-completion-checklist.md` に docs-only 用判定ブランチが追加され、`spec_created`（workflow root）と `completed`（Phase 別）の状態分離が明文化
- **AC-5**: `.claude/skills/task-specification-creator/` ↔ `.agents/skills/task-specification-creator/` の `diff -qr` が差分 0 を返すことが Phase 5 末 / Phase 9 / Phase 11 の 3 箇所で検証される
- **AC-6**: `phase-template-phase1.md`（または `phase-template-core.md`）に「Phase 1 で `artifacts.json.metadata.visualEvidence` を必須入力として確定する」ルールが追記
- **AC-7**: タスク種別 `docs-only` / `visualEvidence: NON_VISUAL` / `scope: skill_governance` / `workflow_state: spec_created` が `artifacts.json.metadata` と一致
- **AC-8**: 本ワークフロー自身の Phase 11 / 12 が縮約テンプレを自己適用（drink-your-own-champagne）する設計
- **AC-9**: Phase 3 で代替案 4 案以上（A: 現状維持 / B: docs-only 専用 skill 新設 / C: SKILL.md のみ追記 / D: SKILL.md + references + mirror 同期 = base case）が PASS / MINOR / MAJOR で評価され、base case D が PASS で確定
- **AC-10**: Phase 1〜13 が `artifacts.json.phases[]` と完全一致（Phase 1〜3 = `completed` / Phase 4〜12 = `pending` / Phase 13 = `blocked`）

---

## 6. 4 条件評価

### 6.1 価値性（Value）

- **PASS**: docs-only / NON_VISUAL / `spec_created` タスクの冗長成果物・判定ドリフト・状態誤書換え・mirror parity 喪失を一括解消。UT-GOV-001〜007 系 Wave で再発する全 4 問題を構造的に防止
- 親タスク 1 件の実証知見を skill 正本に昇格させる構造で、再発防止効果が Wave 規模に波及

### 6.2 実現性（Feasibility）

- **PASS**: 6 ファイルへの追記のみ。コード変更なし、CI / runtime 影響なし
- mirror 同期は `rsync` / `cp` + `diff -qr` で完結し、専用ツール不要
- ロールバックは追記コミットの `git revert` で完了

### 6.3 整合性（Consistency）

- **PASS**: 既存の `phase-11-non-visual-alternative-evidence.md` および `phase-template-phase11.md`「docs-only / spec_created 必須3点」セクションと整合し、矛盾しない
- 不変条件 #5（D1 アクセス境界）に抵触しない（D1 を一切触らない）

### 6.4 運用性（Operability）

- **PASS（with notes）**: AC-5 mirror 差分 0 + AC-6 Phase 1 必須入力で多重防御。CI gate 化は別タスクで仕切る
- 進行中タスクへの遡及適用方針は Phase 12 で明文化

---

## 7. 自己適用性（drink-your-own-champagne）の確認

| 項目 | 確認 |
| --- | --- |
| 本タスク自身が `taskType: docs-only` / `visualEvidence: NON_VISUAL` か | ✅ `artifacts.json.metadata` で確定 |
| 本タスクの Phase 11 outputs が縮約テンプレ通り 3 点で構成されるか | ✅ `artifacts.json.phases[10].outputs` で `main.md` / `manual-smoke-log.md` / `link-checklist.md` を固定 |
| 本タスク Phase 5 で skill 編集が完了してから Phase 11 が走る順序か | ✅ Phase 2 §7 自己適用順序ゲートで不変条件化 |
| 縮約テンプレの参照リンクとして本タスクが第一適用例になるか | ✅ skill 本体（phase-template-phase11.md）に本タスクへの参照を埋め込む設計（Phase 2 §3）|

---

## 8. 苦戦箇所（原典 §8 抽出）

| # | 苦戦箇所 | 本タスクでの対策 |
| --- | --- | --- |
| 1 | `visualEvidence` メタ未設定で縮約テンプレ未発火 | AC-6 で Phase 1 必須入力化 |
| 2 | Phase 12 Part 2 必須 5 項目のチェック漏れ | AC-3 で SKILL.md 記述と compliance-check を一対一対応化 |
| 3 | `spec_created` が誤って `completed` に書換え | AC-4 で workflow root と Phase 別 status の状態分離を明文化 |
| 4 | `.agents/skills/` mirror 同期忘れ | AC-5 で `diff -qr` 差分 0 を必須化、3 箇所で検証 |
| 5 | 既存 docs-only タスクへの遡及適用判断割れ | Phase 12 documentation で「新規 Phase 1 から / 進行中は Phase 11 着手時再判定」を明文化 |
| 6 | drink-your-own-champagne の循環参照 | Phase 5 → Phase 11 順序ゲートを不変条件化（Phase 2 §7）|

---

## 9. 既存命名規則の確認

- skill ディレクトリ: `.claude/skills/<skill-name>/` および `.agents/skills/<skill-name>/`（mirror）
- references ファイル: `phase-template-phase<N>.md` / `phase<N>-*.md` の既存命名規約に準拠
- compliance-check: `phase-12-completion-checklist.md` の既存ファイル名を維持（新規ファイル作成は不可、既存ファイルへの追記または当該 SKILL セクションへの追記）
- 縮約テンプレ発火条件: `artifacts.json.metadata.visualEvidence` の値（`VISUAL` / `NON_VISUAL`）で判定する既存メタ規約に準拠

---

## 10. carry-over 確認

| 項目 | 確認 |
| --- | --- |
| 原典スペック §1 背景 / 課題 | §1.1〜1.3 に転記 → 反映済 |
| 原典スペック §2.1 目的 / §2.2 AC | §5 AC-1〜AC-10 に展開 → 反映済 |
| 原典スペック §2.3 スコープ | §4.1 / §4.2 に転記 → 反映済 |
| 原典スペック §3 影響範囲 | §3 改修対象 skill ファイル一覧に転記 → 反映済 |
| 原典スペック §6 参照情報 | index.md / phase-01.md「参照資料」に転記 → 反映済 |
| 原典スペック §8 苦戦箇所 | §8 苦戦箇所 6 件に展開 → 反映済 |
| 親タスク Phase 11 / 12 outputs（実証データ） | §1.1 背景および §7 自己適用性で参照リンク化 → 反映済 |
| GitHub Issue #148 CLOSED 状態 | `artifacts.json.github_issue_state: CLOSED` で固定 → reopen しない |
