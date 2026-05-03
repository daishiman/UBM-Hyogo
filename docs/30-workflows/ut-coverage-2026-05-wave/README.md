# ut-coverage-2026-05-wave — 実行順序ガイド

| 項目 | 値 |
| --- | --- |
| 起票日 | 2026-05-01 |
| 起票根拠 | GitHub Issue #320 (UT-08A-01) + 同日実測の coverage<80% baseline |
| 状態 | spec_created / docs-only |
| 全タスク数 | 6（serial 1 + parallel 5） |

## 起票根拠（実測 baseline 2026-05-01）

| package / scope | Lines | Branches | Functions | Statements | 判定 |
| --- | ---: | ---: | ---: | ---: | --- |
| packages/shared | 96.79 | 87.67 | 100 | 96.79 | ✅ 対象外 |
| packages/integrations/google | 89.16 | 80.6 | 88.23 | 89.16 | ✅ 対象外 |
| packages/integrations | 100 | 100 | 100 | 100 | ✅ 対象外 |
| **apps/web (total)** | **39.39** | **68.01** | **43.51** | **39.39** | ❌ 全 metric <80% |
| apps/api | — | — | — | — | ⚠️ 13 test 失敗で計測不能 → wave-1 で unblock |

apps/web の <80% ファイルは合計 34 件（0% カバレッジ 20 件 / 部分カバレッジ 14 件）。
ファイル別の詳細は各タスクの `index.md` を参照。

---

## 実行順序

```
[wave-1: serial]                [wave-2: parallel × 5]
                                ┌─ ut-08a-01-public-use-case-coverage-hardening
                                ├─ ut-web-cov-01-admin-components-coverage
ut-api-cov-precondition-01 ───▶ ├─ ut-web-cov-02-public-components-coverage
                                ├─ ut-web-cov-03-auth-fetch-lib-coverage
                                └─ ut-web-cov-04-admin-lib-ui-primitives-coverage
```

### wave-1（直列・先行必須）

| Task | 役割 | 所要見込 |
| --- | --- | --- |
| [`ut-api-cov-precondition-01-test-failure-recovery`](../ut-api-cov-precondition-01-test-failure-recovery/index.md) | apps/api の 13 件 test 失敗を修復し coverage-summary.json 生成を可能にする。**wave-2 の `ut-08a-01-...` を blocker として停める** | 中 |

> wave-2 の `ut-08a-01-...` は apps/api を対象とするため、coverage 計測自体ができない状態では着手しても AC（coverage ≥85%）を closed にできない。よって wave-1 完了が前提。
> apps/web 系 4 タスクは apps/api の test 失敗とは無関係なので **理論上は wave-1 と並走可能** だが、wave-1 が先行修復タスクとして単独で 1 PR にまとまる方が安全（regression 切り分けが容易）。

### wave-2（並列・5 タスク同時）

| Task | 対象 | Status | visualEvidence |
| --- | --- | --- | --- |
| [`ut-08a-01-public-use-case-coverage-hardening`](wave-2-parallel-coverage/ut-08a-01-public-use-case-coverage-hardening/index.md) | apps/api public use-case 4 本 + route handler | spec_created | NON_VISUAL |
| [`ut-web-cov-01-admin-components-coverage`](../ut-web-cov-01-admin-components-coverage/index.md) | apps/web admin components 7 本 | implemented-local / Phase 1-12 completed | NON_VISUAL |
| [`ut-web-cov-02-public-components-coverage`](wave-2-parallel-coverage/ut-web-cov-02-public-components-coverage/index.md) | apps/web public components 7 本 | spec_created | NON_VISUAL |
| [`ut-web-cov-03-auth-fetch-lib-coverage`](wave-2-parallel-coverage/ut-web-cov-03-auth-fetch-lib-coverage/index.md) | apps/web auth/fetch/session lib 7 本 | spec_created | NON_VISUAL |
| [`ut-web-cov-04-admin-lib-ui-primitives-coverage`](wave-2-parallel-coverage/ut-web-cov-04-admin-lib-ui-primitives-coverage/index.md) | apps/web admin lib + UI primitives 13 本 | spec_created | NON_VISUAL |

#### 並列性の根拠

5 タスクは以下の理由で互いに依存しない:

- 対象ファイルが完全に分離（admin / public / auth-lib / admin-lib+primitives / api-use-case）
- shared package（`packages/shared`, `packages/integrations`）への変更を含まない（既に ≥80% 達成済み）
- 共通 fixture / helper の追加は各タスクで個別判定し、衝突が起きた場合のみ wave-2 後に DRY 化タスクを起票

#### 並列実行可否の評価

5 タスクは原則並列可能だが、以下の競合点がある:

| 競合リスク | 影響 | 対処 |
| --- | --- | --- |
| `vitest.config.ts` / setup file 同時編集 | apps/web の 4 タスクが test env / setupFiles を変更すると衝突 | Phase 4 で config 変更の要否を判定し、必要なら 1 PR で確定後に他は触らない |
| `pnpm-lock.yaml` 競合 | 新規 test 依存追加時に発生 | 並列 PR の最後にマージされる PR は rebase 必須 |
| 共通テストヘルパー重複 | cov-01/04 が auth mock を独自実装すると cov-03 と重複 | cov-03（auth/fetch lib）を先行させる |
| coverage threshold 設定の単一ソース | 各タスクで個別に閾値を上げると drift | wave-2 完了後に一括引き上げ |

#### 推奨実行戦略（3 案）

| プラン | 実行 | 推奨度 |
| --- | --- | --- |
| **A. 完全並列**（5 タスク同時） | 5 worktree 同時、PR 5 本同時化 | ○ 速度最大、ただし競合対処コスト増 |
| **B. 段階的並列**（tier 制） | tier-1（独立群）: `ut-08a-01` + `ut-web-cov-02` + `ut-web-cov-03` を並列 → tier-2（cov-03 ヘルパー利用群）: `ut-web-cov-01` + `ut-web-cov-04` を並列 | ◎ 推奨。速度と DRY のバランス |
| C. 完全直列 | 1 タスクずつ順次 | ✗ 並列性を活かせない |

#### 並列実行時の運用ルール（A / B 共通）

- 各タスクは独立 worktree / 独立ブランチで実行する（worktree 命名: `feat/<task-id>`）
- 同時 PR 化する場合、`pnpm-lock.yaml` 競合に備えて最後にマージされる PR は rebase 必須
- wave-2 全体完了時に `bash scripts/coverage-guard.sh` を再走させ、全 package で全 metric ≥80% を確認する
- `vitest.config.ts` 変更が必要なタスクは PR 説明で明示し、他タスクと merge 順序を調整する

---

## 既存 `08a-A-public-use-case-coverage-hardening` との関係（重要）

`docs/30-workflows/02-application-implementation/08a-A-public-use-case-coverage-hardening/` には同一スコープ（Issue #320）の Phase 1-13 仕様書が既に存在する。本 wave の `ut-08a-01-...` と内容は **実質重複** している。

### 推奨運用

| 選択肢 | 説明 | 推奨度 |
| --- | --- | --- |
| **A. `ut-08a-01-...` を canonical とする** | 本 wave 配下を正本とし、既存 `08a-A-...` は legacy mirror として `## refs` で参照のみ。実装は 1 回だけ実行 | ◎（user 指示の新規ディレクトリ尊重） |
| B. 既存 `08a-A-...` を canonical とする | 既存 dir で実装し、本 wave の `ut-08a-01-...` を legacy mirror 化 | ○（既存資産活用） |
| C. 両方執行 | 同一 AC を 2 度確認することになり、明確に冗長 | ✗ |

### 「先に既存 `08a-A-...` を実行すべきか」への回答

- **不要。重複実行は避ける**。両者は同じ apps/api public use-case を対象にしており、片方の coverage 補強がもう片方の AC を満たす。
- ただし **wave-1 の `ut-api-cov-precondition-01-...` は必ず先行**。これは既存 `08a-A-...` を選んだ場合でも同じく必要（apps/api の test 失敗 13 件は coverage 計測の前提を破壊しているため）。
- 共通部分（test fixture / D1 mock helper）は wave-1 で発見・整備し、wave-2 全タスクが利用する。これにより wave-2 の 5 タスクで helper の重複実装が起きないことを期待する。

### 結論（推奨実行プラン）

```
1. wave-1: ut-api-cov-precondition-01 を実行 → 13 test green → coverage-summary.json 生成
2. wave-2: 5 タスクを並列実行（ut-08a-01 を canonical 採用、既存 08a-A は legacy mirror）
3. 完了後: scripts/coverage-guard.sh 全パッケージ exit 0 を確認 → 各タスクの Phase 13 で個別 PR
```

---

## 共通仕様（全 6 タスク共通）

- AC 数値目標: Stmts ≥85% / Funcs ≥85% / Lines ≥85% / Branches ≥80%
- 状態: `spec_created / docs-only / remaining-only`
- taskType: `docs-only`（実装仕様書作成タスク。アプリケーションコード実装は後続実装フェーズ）
- Phase 11 evidence: `coverage-result.md` / `regression-check.md` / `manual-evidence.md`（本 wave は unit coverage / NON_VISUAL 証跡で閉じる）
- Phase 12 必須 7 成果物: `main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md`
- 不変条件: #1 / #2 / #5 / #6（タスクにより該当範囲は異なる、各 `index.md` 参照）

## 仕様書作成範囲外（明示）

- アプリケーションコード実装
- deploy / commit / push / PR 作成
- 実測 evidence の取得（Phase 11 実行）

これらは仕様書を起点に **実装フェーズ** で実施するもので、本仕様書作成タスクには含めない。
