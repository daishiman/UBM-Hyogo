# ut-gov-005-docs-only-nonvisual-template-skill-sync - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| タスク名 | task-specification-creator skill への docs-only / NON_VISUAL 縮約テンプレ反映 |
| ディレクトリ | docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Wave | governance（skill 改善 / drink-your-own-champagne 適用第一例） |
| 実行種別 | serial（skill 改善は単一 PR、mirror 同期は同 PR 内で完結） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | skill-improvement / docs-only |
| visualEvidence | NON_VISUAL |
| scope | skill_governance |
| 親タスク | task-github-governance-branch-protection |
| 発見元 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/unassigned-task-detection.md current U-5 |
| 原典スペック | docs/30-workflows/completed-tasks/UT-GOV-005-docs-only-nonvisual-template-skill-sync.md |
| GitHub Issue | #148 (CLOSED のままタスク仕様書として再構築) |

## 目的

`task-specification-creator` skill の `SKILL.md` / `references/phase-template-phase11.md` / `references/phase-template-phase12.md` /
`references/phase-12-completion-checklist.md`（または該当 SKILL セクション）に対して、docs-only / `visualEvidence: NON_VISUAL` /
`spec_created` 状態のタスク向け **縮約テンプレ・判定ルール・compliance-check ブランチ** を追加し、
`.agents/skills/task-specification-creator/` mirror へ差分 0 で同期する。
親タスク（task-github-governance-branch-protection）の Phase 6〜11 で実証された「screenshot 不要 / canonical artefact 3 点固定」運用を
skill 本体に反映し、UT-GOV-001〜007 系の Wave で再発する冗長成果物・判定ドリフト・状態誤書換え・mirror parity 喪失を構造的に防止する。

このワークフロー自体が docs-only / NON_VISUAL タスクであり、本タスクで追加する縮約テンプレを **自分自身の Phase 11 / 12 に適用する**
（drink-your-own-champagne）。テンプレ整備と適用第一例が同じ PR で閉じることを設計上の前提に据える。

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（`phase-NN.md`）作成
- Phase 1〜3 成果物本体（`outputs/phase-0N/main.md`）の作成
- `index.md`（本ファイル）と `artifacts.json` の作成
- skill 本体（`.claude/skills/task-specification-creator/`）への反映設計
  - `SKILL.md` への「タスクタイプ判定フロー（docs-only / NON_VISUAL）」追記設計
  - `references/phase-template-phase11.md` の縮約テンプレ追加設計（`main.md` / `manual-smoke-log.md` / `link-checklist.md` 3 点固定）
  - `references/phase-template-phase12.md` Part 2 必須要件のチェック項目化設計（型 / API / 例 / エラー / 設定値）
  - `references/phase-12-completion-checklist.md` への docs-only ブランチ追加設計（`spec_created` と `completed` の状態分離）
  - `references/phase-template-phase1.md` / `references/phase-template-core.md` への Phase 1 `visualEvidence` 必須入力ルール追記設計
- `.agents/skills/task-specification-creator/` mirror 同期手順と「差分 0」検証手順の設計
- 縮約テンプレの自己適用性（本タスク自身の Phase 11 / 12 を適用第一例として参照リンク化）の明文化

### 含まない

- skill 本体のリファクタ（Progressive Disclosure 再分割等。本タスクは追記中心）
- 親タスク（branch protection）の仕様変更
- 上記に列挙していない skill reference の改修
- VISUAL タスク向けテンプレの改修
- mirror 同期の pre-commit / CI 強制化（本タスクでは AC「mirror 差分 0」までを担保し、CI gate 化は別タスクで仕切る）
- skill-fixture-runner 側の検証ルール拡張（縮約テンプレの fixture テストは別タスク）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流参照 | task-github-governance-branch-protection | Phase 11 / 12 で「screenshot 不要 / 3 点 canonical artefact」「state ownership 分離」の運用実例を提供する親タスク |
| 上流参照 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-11/ | 縮約テンプレの第一実証データ（`main.md` / `manual-smoke-log.md` / `link-checklist.md`） |
| 上流参照 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/ | Phase 12 Part 2 必須要件の実例 / `spec_created` 状態の維持実例 |
| 上流参照 | .claude/skills/task-specification-creator/SKILL.md | 改修対象 skill 本体 |
| 上流参照 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | NON_VISUAL 代替 evidence プレイブック（既存正本） |
| 並列 | なし | 単一 PR で完結 |
| 下流 | UT-GOV-001〜007 / 後続 docs-only governance タスク | 本タスクで反映した縮約テンプレを Phase 1 から適用する |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-005-docs-only-nonvisual-template-skill-sync.md | 原典スペック。AC / 苦戦箇所 / スコープ境界の正本 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | 「タスクタイプ判定フロー」追記対象 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase11.md | 縮約テンプレ追記対象 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase12.md | Part 2 必須要件のチェック項目化対象 |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | NON_VISUAL 代替 evidence の既存正本（縮約テンプレと整合させる） |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1〜3 共通セクション順 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase1.md | Phase 1 メタ強制（visualEvidence 必須化）の追記対象 |
| 参考 | docs/30-workflows/skill-ledger-b1-gitattributes/ | docs-only / NON_VISUAL の先行先例（フォーマット模倣元） |
| 参考 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-11/main.md | 縮約テンプレ適用の第一実証データ |
| 参考 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-11/manual-smoke-log.md | 同上（smoke ログ実例） |
| 参考 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-11/link-checklist.md | 同上（link 検証実例） |

## 受入条件 (AC)

- **AC-1**: `references/phase-template-phase11.md` に docs-only / NON_VISUAL 向けの **縮約テンプレ** が追加され、`outputs/phase-11/` の必須 artefact が `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点に固定されている。screenshot 不要であることが明文化されている。
- **AC-2**: `artifacts.json.metadata.visualEvidence = NON_VISUAL` を入力として縮約テンプレが発火する判定ルールが、`SKILL.md`（タスクタイプ判定フロー）と `phase-template-phase11.md`（タスク種別判定セクション）の双方で明記されている。
- **AC-3**: `references/phase-template-phase12.md` Part 2 必須要件として、(1) TypeScript 型定義 (2) API シグネチャ (3) 使用例 (4) エラー処理 (5) 設定可能パラメータ・定数 の 5 項目が **チェック項目** として一対一で対応している（`phase-12-completion-checklist.md` 側、または当該 SKILL セクションに項目化）。
- **AC-4**: `phase-12-completion-checklist.md`（または等価セクション）に **docs-only 用判定ブランチ** が追加され、`spec_created`（workflow root）と `completed`（ledger / Phase 別 status）の **状態を分離する記述** がある。
- **AC-5**: `.claude/skills/task-specification-creator/` の更新が `.agents/skills/task-specification-creator/` mirror に同期されており、`diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` が **差分 0** を返す検証手順が Phase 2 / 11 で固定されている。
- **AC-6**: `phase-template-phase1.md`（または `phase-template-core.md`）に「Phase 1 で `artifacts.json.metadata.visualEvidence` を **必須入力** として確定する」ルールが追記されており、未設定で Phase 11 縮約テンプレが発火しない状況を防いでいる。
- **AC-7**: タスク種別 `docs-only` / `visualEvidence: NON_VISUAL` / `scope: skill_governance` / `taskType: docs-only` が Phase 1 で固定され、`artifacts.json.metadata` と一致している。
- **AC-8**: 本ワークフロー自身の Phase 11 / 12 が、追加した縮約テンプレを **自己適用** する設計になっている（drink-your-own-champagne）。Phase 11 outputs は `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点で構成し、第一適用例として参照リンク化されている。
- **AC-9**: Phase 3 で代替案（A: 縮約せず通常テンプレを上書き / B: docs-only 専用 skill を新設 / C: SKILL.md のみ追記し references は触らない / D: SKILL.md + references 連動追記 + mirror 同期 = base case）の 4 案以上が PASS / MINOR / MAJOR で評価され、base case D が PASS で確定している。
- **AC-10**: Phase 1〜13 が `artifacts.json` の `phases[]` と完全一致しており、Phase 1〜3 = `completed`、Phase 4〜12 = `pending`、Phase 13 = `blocked`。4 条件（価値性 / 実現性 / 整合性 / 運用性）がすべて PASS であることが Phase 1 と Phase 3 の双方で確認されている。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/test-strategy.md |
| 5 | 実装ランブック（skill 編集） | phase-05.md | pending | outputs/phase-05/implementation-runbook.md |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/ac-matrix.md |
| 8 | DRY 化（重複記述の整理） | phase-08.md | pending | outputs/phase-08/main.md |
| 9 | 品質保証（typecheck / lint / mirror diff） | phase-09.md | pending | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke（縮約テンプレ自己適用検証） | phase-11.md | pending | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md |
| 13 | PR 作成 | phase-13.md | blocked | outputs/phase-13/main.md |

## 主要成果物（Phase 1〜3 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（背景 / 課題 / 苦戦箇所 / スコープ / AC-1〜10 / 4 条件評価 / 自己適用性） |
| 設計 | outputs/phase-02/main.md | skill 編集計画 / SKILL.md 追記 diff / references 改修 diff / mirror 同期手順 / state ownership / 自己適用設計 |
| レビュー | outputs/phase-03/main.md | 代替案 4 案以上比較 / PASS-MINOR-MAJOR / 着手可否ゲート / 4 条件再評価 / Phase 4 引き継ぎ |
| メタ | artifacts.json | Phase 1〜13 機械可読サマリー（visualEvidence=NON_VISUAL / taskType=docs-only） |
| 仕様書 | phase-NN.md × 13 | Phase 別仕様（Phase 1〜3 = completed、4〜12 = pending、13 = blocked） |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| Git | mirror 同期検証（`diff -qr` / `git status`） | 無料 |
| pnpm / mise | `pnpm typecheck` / `pnpm lint` の副作用なし確認 | 無料 |
| GitHub | Issue #148 連携（CLOSED のまま） | 無料枠 |
| skill-fixture-runner | 縮約テンプレ追記後の SKILL.md 構造検証（参考。本タスクスコープ外） | 無料 |

## Secrets 一覧

本タスクは Secret を導入しない。`.claude/skills/` および `.agents/skills/` のテキスト追記のみで完結し、ランタイムシークレット / CI シークレット / 1Password 参照のいずれも追加・変更しない。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | 本タスクは D1 を触らない（skill 改修のみ）。違反なし |
| #6 | GAS prototype は本番バックエンド仕様に昇格させない | 影響なし |
| - | skill 本体と `.agents/` mirror は parity を保つ（リポジトリ規約） | 本タスクの AC-5 で「mirror 差分 0」を必須化することで規約強化 |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する（Phase 1〜3 = `completed` / Phase 4〜12 = `pending` / Phase 13 = `blocked`）
- AC-1〜AC-10 が Phase 1〜3 で全件カバーされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- 縮約テンプレの自己適用性（drink-your-own-champagne）が Phase 1〜3 のいずれかで明示されている
- mirror 同期検証コマンド（`diff -qr`）が Phase 2 設計および Phase 11 / 12 計画に固定されている
- 本ワークフロー自身が Phase 11 着手時に縮約テンプレ第一適用例として動作する設計になっている

## 苦戦箇所・知見（原典スペック §8 から抽出）

**1. visualEvidence メタ未設定問題**
docs-only タスクでも Phase 11 が screenshot を要求する誤判定が頻発する根本原因は、`artifacts.json.metadata.visualEvidence` が Phase 1 時点で確定されないこと。Phase 1 で必須入力化しないと縮約テンプレ自体が発火しないため、本タスクでは「Phase 1 でメタ確定」を `phase-template-phase1.md` / `phase-template-core.md` に必須ルールとして追記する。Phase 1 / Phase 5 双方での再判定ルールも明文化する。

**2. Phase 12 Part 2 必須要件のチェック漏れ**
`SKILL.md` には Part 2 の必須要件（型定義 / API シグネチャ / 使用例 / エラー処理 / 設定値）が箇条書きされているが、`phase-12-completion-checklist.md` 側で項目化されていないため実運用でドリフトする。本タスクで 5 項目を一対一でチェック項目化し、SKILL.md の記述と compliance-check の判定基準を機械的に対応付ける。

**3. 状態分離の罠（spec_created vs completed）**
workflow root の `状態` は `spec_created`（タスク仕様書として作成済 / 実装着手前）のままにすべきだが、Phase 12 close-out で誤って `completed` に書き換えられるパターンが頻発する。本タスクでは「workflow root = `spec_created`」「ledger / Phase 別 status = `completed`（Phase 1〜3 など）」の差を許容するルールを `phase-12-completion-checklist.md` に明文化し、judging point を分離する。

**4. skill mirror 同期忘れ**
`.claude/skills/` を更新しても `.agents/skills/` mirror 同期忘れで参照ドリフトが発生する。本タスクの AC-5 で「`diff -qr` で差分 0」を必須化し、Phase 2 設計 / Phase 11 smoke / Phase 9 品質保証の 3 箇所で検証コマンドを固定する。CI gate 化（pre-commit / GitHub Actions）はスコープ外として別タスクで仕切る（不要拡張防止）。

**5. 既存 docs-only タスクへの遡及適用判断**
進行中の docs-only タスクへ縮約テンプレを遡及適用するか、新規タスクからのみ適用するかを明文化しないと運用が割れる。本タスクでは「**新規タスクの Phase 1 から適用**、進行中タスクは Phase 11 着手時点で適用」を Phase 12 documentation で明示し、UT-GOV-001〜007 の各タスク仕様書で再判定する旨を申し送り（`unassigned-task-detection.md`）に残す。

**6. drink-your-own-champagne の罠**
本タスク自体が docs-only / NON_VISUAL であり、追加するテンプレを **自分自身に適用する** 構造のため、テンプレが未完成な段階で本タスクの Phase 11 / 12 が始まると循環参照になる。Phase 5（実装）で skill 本体の編集を完了し、Phase 11 着手時には縮約テンプレが skill 本体に **既にコミット済み** という順序を Phase 2 設計で固定する。

## 関連リンク

- 上位 README: ../README.md
- 原典スペック: ../completed-tasks/UT-GOV-005-docs-only-nonvisual-template-skill-sync.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/148 (CLOSED)
- 親タスク: ../completed-tasks/task-github-governance-branch-protection/
- フォーマット模倣元: ../skill-ledger-b1-gitattributes/index.md
- 改修対象 skill: ../../../.claude/skills/task-specification-creator/
- mirror 同期先: ../../../.agents/skills/task-specification-creator/
