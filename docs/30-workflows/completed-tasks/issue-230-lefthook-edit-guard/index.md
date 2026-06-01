# Workflow: issue-230-lefthook-edit-guard

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。
> 本 workflow は **implemented_local_runtime_pending**（2026-05-31 実装サイクルで 8 ファイル全実装・focused vitest 12 PASS・typecheck/lint/shellcheck/YAML green）。CI run（verify-hook-integrity）・commit・push・PR・issue #230 mutation は user-gated（未実施）。

GitHub Issue #230（`[skill-ledger T-6 U-6] lefthook.yml 直編集禁止の grep / pre-commit ガード`）を
**最新コードに最適化した上で**根本解決するためのタスク仕様書一式。

- ブランチ: `feat/issue-230-lefthook-edit-guard-spec`
- ベースブランチ: `dev`
- 親ワークフロー（発見元）: `docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/`（Phase 12 unassigned-task-detection 候補 U-6）
- Issue 状態: **OPEN**（2026-05-31 に `gh issue view 230 --json state` で再確認）。PR 文脈は `Refs #230`。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク種別 | implementation |
| workflow_state | implemented_local_runtime_pending |
| implementation_state | implemented |
| visualEvidence | NON_VISUAL |
| Phase 12 strict 7 | `outputs/phase-12/` に implemented-local close-out evidence として物理配置 |
| artifacts parity | `artifacts.json` と `outputs/artifacts.json` を同一内容で同期 |

---

## 0. 事前調査結論（実装前ベースライン）

ユーザー依頼「別タスクで既に解決していないか、コードベースで実装完了しているか調査」に対する結論。

| 観点 | 調査コマンド/対象 | 結果 |
|------|------------------|------|
| 仕様書の存在 | `docs/30-workflows/unassigned-task/task-skill-ledger-t6-lefthook-edit-guard.md` | **存在しない**（未作成） |
| `.git/hooks/` 手書き検知ガード | `scripts/hooks/` 全 8 本 | **無し**（main-branch / staged-task-dir / block-test-suffix / stale-worktree-notice / verify-esbuild / indexes-drift / gate-metadata / phase12-compliance のみ） |
| `lefthook.yml` 直編集検知ガード | `lefthook.yml` / `scripts/hooks/` | **無し** |
| hook 整合性を検証する CI | `.github/workflows/verify-*.yml` 全 12 本 | **無し**（hook / lefthook 整合を検証する gate は存在しない） |
| CODEOWNERS による `lefthook.yml` review 必須化 | `.github/CODEOWNERS` governance path | `lefthook.yml` は **含まれていない**（AC-2 代替も未充足） |

> **結論: Issue #230 は別タスクを含めどこにも実装されていない（未解決）。** よって本 issue の実行は必要であり、不要ではない。
> CLAUDE.md の「`.git/hooks/*` の手書きは禁止」「`lefthook.yml` が hook の正本」という方針は現在も有効で、issue の前提は陳腐化していない。

### Issue 内容の最適化（最新コードへの適合）

issue 本文 AC-1「`.git/hooks/` 配下の手書き追加で **CI fail**」は、最新コードの実態に照らすと一部が **構造的に実行不可能** である。`.git/` ディレクトリは git の管理対象外でリポジトリに含まれないため、**CI runner の checkout には local `.git/hooks/` のカスタムファイルが一切現れない**。したがって AC-1 を「CI で観測」する literal 解釈は不可能。

本 workflow では根本問題（hook は `lefthook.yml` を唯一の正本とし、手書き hook / 偶発的 `lefthook.yml` 直編集を機械検知する）を満たすため、AC を観測可能な enforcement 面へ再配置して最適化する:

| 元 AC | literal 実行可否 | 最適化後の enforcement 面 |
|-------|------------------|--------------------------|
| AC-1 `.git/hooks/` 手書き追加で fail | local のみ観測可（CI 不可） | **pre-commit hook**（local enforcement。`.git/hooks/` を実際に observe できる唯一の地点）＋ CI 側は「`lefthook.yml` が参照する `scripts/hooks/*.sh` の実在 + tracked stray hook 不在」という**観測可能な SSOT 整合**へ再定義 |
| AC-2 `lefthook.yml` 変更時 review 必須化 or 確認プロンプト | solo 運用で必須 review は branch protection 上 0（CLAUDE.md）。「確認プロンプト」を採用 | pre-commit hook が staged `lefthook.yml` を検知し、明示 ack（`LEFTHOOK_EDIT_ACK=1`）が無ければ block + 確認メッセージ |
| AC-3 拒否メッセージから CLAUDE.md hook 方針へ辿れる | 実行可 | fail_text / echo に CLAUDE.md §「Git hook の方針」+ `docs/00-getting-started-manual/lefthook-operations.md` を明記 |
| AC-4 false positive 最小化（`lefthook install` 自動配置除外） | 実行可 | `.git/hooks/*.sample` 除外 + lefthook 注入署名（`LEFTHOOK`/`lefthook`）を含む hook を managed として除外 + merge/rebase/cherry-pick 時 skip |

この再定義は「先送り」ではなく **AC を観測可能面へ写像して 1 サイクルで完了させる最適化**（CONST_007 準拠）。スコープ分割・将来タスク化は行わない。

---

## 1. 根本問題（最適化後の1文定義）

> Git hook は `lefthook.yml` を唯一の正本とする運用だが（CLAUDE.md）、手書き `.git/hooks/*` の追加と `lefthook.yml` への偶発的直編集を**機械的に検知する手段が存在せず**、drift が静かに混入し得る。
> その根本原因は「hook 構成の正本逸脱を検知する guard（local pre-commit + CI integrity）が未実装」であること。

### 最適化された解決方針（Phase 2 で確定する設計の要旨）

| 論点 | 決定 | 根拠 |
|------|------|------|
| local enforcement | `scripts/hooks/lefthook-edit-guard.sh` を pre-commit に追加 | `.git/hooks/` を observe できる唯一の地点。AC-1 local / AC-2 / AC-3 / AC-4 を満たす |
| CI enforcement | `scripts/verify-hook-integrity.sh` + `.github/workflows/verify-hook-integrity.yml` | repo に observe 可能な「lefthook.yml ↔ scripts/hooks 参照整合 + tracked stray hook 不在」を gate 化（AC-1 の CI 観測可能面への再定義） |
| `lefthook.yml` 編集の扱い | block ではなく **ack ゲート**（`LEFTHOOK_EDIT_ACK=1`） | solo 運用で hook 改善は正当な作業。意図的編集を 1 step の明示 ack で通す（AC-2 確認プロンプト系） |
| false positive 抑制 | `.sample` 除外 / lefthook 署名除外 / merge・rebase・cherry-pick skip | AC-4 |
| テスト | vitest で一時 git repo fixture を組み、guard / integrity の両方を child_process 実行検証 | 既存 `scripts/coverage-guard.spec.ts` パターン踏襲。invariant #8（`*.spec.ts`） |

---

## 2. スコープ

### 含む（今回サイクル内で完了 — CONST_007）

1. `scripts/hooks/lefthook-edit-guard.sh`（新規）— pre-commit guard（AC-1 local / AC-2 / AC-3 / AC-4）
2. `scripts/verify-hook-integrity.sh`（新規）— lefthook.yml ↔ scripts/hooks 参照整合 + tracked stray hook 検知（local / CI 共用）
3. `.github/workflows/verify-hook-integrity.yml`（新規）— CI gate（push / PR → main, dev）
4. `lefthook.yml`（編集）— `pre-commit.commands.lefthook-edit-guard` を追加（fail_text 含む）
5. `scripts/hooks/__tests__/lefthook-edit-guard.spec.ts`（新規）— guard の fixture テスト
6. `scripts/__tests__/verify-hook-integrity.spec.ts`（新規）— integrity script の fixture テスト
7. `docs/00-getting-started-manual/lefthook-operations.md`（編集）— 新 guard の運用節を追記（AC-3 リンク先）
8. CLAUDE.md（編集）— hook 方針節に lefthook-edit-guard / verify-hook-integrity の存在を追記（AC-3 アンカー）

### 含まない（スコープ外。分離理由を明記 — CONST_007）

| 除外項目 | 理由 | 実施先 |
|---------|------|--------|
| `.git/hooks/` カスタムファイルの **CI** 検知 | `.git/` は repo 管理外で CI checkout に現れず、構造的に観測不能（§0 最適化参照） | 実施しない（local pre-commit で代替充足） |
| `lefthook.yml` の必須レビュー（required reviewers） | solo 運用ポリシーで `required_pull_request_reviews=null`（CLAUDE.md）。branch protection 変更は別 governance タスク | 実施しない（ack ゲート + CI integrity で代替） |

> 上記 2 件は「分量」ではなく **技術的に観測不能 / 運用ポリシー上不採用** という明確な理由による除外（CONST_007 例外）。今回スコープ（pre-commit guard + CI integrity + tests + docs）は単独で AC-1〜AC-4 を充足する垂直スライスで、1 実装サイクルで完了する。

---

## 3. 不変条件（実装時に厳守）

1. `lefthook.yml` が hook の正本。`.git/hooks/*` の手書きは禁止（CLAUDE.md「Git hook の方針」）
2. 新規 test は `*.spec.{ts,tsx}` のみ（CLAUDE.md invariant #8。lefthook `block-test-suffix` / CI `verify-test-suffix` が reject）
3. guard script は `set -euo pipefail` を持ち、merge/rebase/cherry-pick 中は skip（既存 sync-merge ポリシーと整合）
4. CI workflow の `permissions` は `contents: read` 最小権限（既存 verify-*.yml 踏襲）
5. guard の fail_text / メッセージは CLAUDE.md hook 方針 + `lefthook-operations.md` へのリンクを含む（AC-3）
6. `scripts/cf.sh` 等 1Password 参照系・秘密値は一切 echo しない（CLAUDE.md シークレット管理）

---

## 4. タスク表

| Task | スコープ | 想定ファイル数 | 並列 |
|------|---------|--------------|------|
| Task A — local pre-commit guard | `lefthook-edit-guard.sh` + lefthook.yml 編集 + guard spec | 3 | B と独立（並列可） |
| Task B — CI integrity gate | `verify-hook-integrity.sh` + workflow yml + integrity spec | 3 | A と独立（並列可） |
| Task C — docs / policy 追記 | `lefthook-operations.md` + CLAUDE.md 追記 | 2 | A/B 完了後（参照先確定後） |

Task A/B は独立で並列実装可。Task C は A/B の最終インターフェース確定後に追記する。すべて 1 実装サイクル内。

---

## 5. Phase 成果物マップ

| Phase | ファイル | 区分 |
|-------|---------|------|
| Phase 1 要件定義 | `phase-1.md` | 設計（直列） |
| Phase 2 設計 | `phase-2.md` | 設計（直列） |
| Phase 3 設計レビュー | `phase-3.md` | 設計（直列・ゲート） |
| Phase 4 テスト作成 | `phase-4.md` | 実装仕様 |
| Phase 5 実装 | `phase-5.md` | 実装仕様 |
| Phase 6 テスト拡充 | `phase-6.md` | 実装仕様 |
| Phase 7 カバレッジ確認 | `phase-7.md` | 実装仕様 |
| Phase 8 リファクタリング | `phase-8.md` | 実装仕様 |
| Phase 9 品質保証 | `phase-9.md` | 実装仕様 |
| Phase 10 最終レビュー | `phase-10.md` | 実装仕様 |
| Phase 11 手動テスト | `phase-11.md` | 実装仕様（NON_VISUAL） |
| Phase 12 ドキュメント更新 | `phase-12.md` | 実装仕様 |
| Phase 13 PR作成 | `phase-13.md` | 実装仕様（user-gated） |

---

## 6. メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | issue-230-lefthook-edit-guard |
| 分類 | implementation / governance / git-hook / CI gate |
| implementation_mode | `new`（P50: current branch 未実装・upstream 未マージ・未解決） |
| 優先度 | 低（priority:low）※ issue 踏襲 |
| 規模 | 小（scale:small） |
| visualEvidence | NON_VISUAL（UI 非接触。証跡は focused vitest + shell exit code + grep gate） |
| workflow_state | implemented_local_runtime_pending |
| GitHub Issue | #230（OPEN, PR 文脈は `Refs #230`） |

---

## 7. 参照

- Issue: https://github.com/daishiman/UBM-Hyogo/issues/230
- 発見元: `docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/`（U-6）
- hook 正本: `lefthook.yml` / `docs/00-getting-started-manual/lefthook-operations.md`
- 既存 guard 実装パターン: `scripts/hooks/block-test-suffix.sh`
- 既存 guard テストパターン: `scripts/coverage-guard.spec.ts`
- 既存 CI gate テンプレート: `.github/workflows/verify-test-suffix.yml`
- CLAUDE.md「Git hook の方針」「sync-merge 時の hook 挙動」
