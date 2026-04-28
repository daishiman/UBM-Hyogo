# Lessons Learned — 02c admin / data access boundary（2026-04-27）

> task: `02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary`
> 関連 spec: `database-admin-repository-boundary.md`
> 関連 LOGS: 2026-04-27 entry

## 教訓一覧

### L-02C-001: boundary tooling は **三重防御** で構成する
- **背景**: 02c では dependency-cruiser バイナリが未導入だった。`scripts/lint-boundaries.mjs` 単独では実行時 import グラフを追えず、AC-3 / AC-4 / AC-11 を完全には保証できない。
- **教訓**: `scripts/lint-boundaries.mjs`（自前 lint）/ `.dependency-cruiser.cjs`（dep-cruiser config 正本）/ ESLint rule（boundaries plugin）を三層で残し、何れかが欠けても他層で検出できる構成にする。dep-cruiser バイナリ導入は 09a / Wave 2 統合の責務として未タスクへ申し送り済み。
- **適用**: `apps/web → apps/api/src/repository/**` / `apps/web → D1Database` / `02a ↔ 02b ↔ 02c` cross-domain は必ず三層で網羅する。

### L-02C-002: 「赤がちゃんと赤になる」を Phase 9 / 11 で確認する
- **背景**: boundary tooling は green の確認だけでは不十分。意図的 violation snippet を作って **error が出ること** を確認しないと「何も検出していない」状態に気付けない。
- **教訓**: Phase 9 で boundary tooling 自己検証（intentional violation → expected error）、Phase 11 で同じ snippet を sandbox で再実行する S-6 シナリオを必ず含める。
- **適用**: dep-cruiser / ESLint / 自前 lint script を導入する全タスクの Phase 9 / 11 必須観点。

### L-02C-003: NON_VISUAL タスクの Phase 11 は **代替 evidence プレイブック** を使う
- **背景**: 02c は staging 未配備 + UI 差分なしの NON_VISUAL タスクで、phase-11.md の wrangler / dep-cruiser バイナリ前提シナリオを直接実行できなかった。
- **教訓**: in-memory miniflare D1 + typecheck + 自前 lint + import-graph snapshot を「代替 evidence」として確立し、その代替が **何をカバーし、何を 09a / Wave 2 統合へ申し送るか** を差分表で明示する。
- **適用**: staging 未配備 / バイナリ未導入の NON_VISUAL タスクで再現性ある Phase 11 を成立させる。

### L-02C-004: 共有正本（`_shared/`）は単一 task が排他管理する
- **背景**: 02c の `apps/api/src/repository/_shared/{db.ts,brand.ts}` と `__tests__/_setup.ts` は 02a / 02b の repository test も依存する。複数タスクが同時編集すると signature 競合が起きる。
- **教訓**: `_shared/` 正本管理者を documentation-changelog で明示し、02a / 02b は import のみとする運用ルールを確立。breaking change には 02a / 02b の test 影響評価を必須にする。
- **適用**: monorepo 内の repository / fixture / test setup を複数 task が共有する場合の標準運用。

### L-02C-005: adminNotes は builder の **引数で受け取り、戻り値に含めない**
- **背景**: 不変条件 #12（adminNotes は public/member view に混ぜない）を構造で保証したい。
- **教訓**: view model builder の signature は `build(member, adminNotes?)` で adminNotes を引数として受け取り、戻り値の DTO には絶対に含めない。これにより型レベルで「public response に adminNotes が漏れる」事故を防止できる。
- **適用**: 04b / 04c / 06a / 06b / 06c の view model 設計で必須。

### L-02C-006: auditLog は **append-only**、metadata に PII / token を載せない
- **背景**: auditLog の metadata に何を載せるか未定義のまま実装すると、PII や access token が監査ログに混入するリスクがある。
- **教訓**: `auditLog.append()` の metadata には「PII / token を含めない、変更前後の業務的 diff のみ」とガイドラインを明文化。04c / 07c の admin 操作でこのルールを統一適用する。
- **適用**: admin 操作で auditLog を出す全タスク。

## 申し送り先（unassigned-task-detection.md より）

- 00 foundation: env 型 / `__fixtures__/` prod build 除外
- 04c: admin endpoint + `auditLog.append` 挿入 / metadata ガイドライン
- 05b: Magic Link HMAC key + 送信 provider
- 06c: adminNotes 検索 UI / sync 失敗の admin 通知
- 09a / Wave 2 統合: dep-cruiser バイナリ導入 + CI gate / staging admin smoke seed
- 02c 保守: `_setup.ts` の miniflare D1 並列性
