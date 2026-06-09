# Phase 1: 要件定義 — issue-1127 authenticated staging visual の admin 画面横展開

> **[実装区分: 実装仕様書]** — 本タスクは `apps/web/playwright/tests/visual-staging-authenticated/` 配下に
> 新規 Playwright spec（`.spec.ts`）を 5 ファイル追加するコード変更を伴う。ユーザー指定ラベルは
> `type:improvement`（issue label）だが、目的達成（authenticated staging visual 回帰検出の横展開）には
> 必ず spec コードの追加が必要なため、CONST_004 に従い実装仕様書として作成する。判定根拠は §1.4 を参照。

## メタ情報

```yaml
workflow: issue-1127-authenticated-staging-visual-admin-screens-expansion
issue_number: 1127
issue_state: CLOSED            # ユーザー指示によりクローズドのまま仕様書作成（refs-only）
issue_reference_mode: refs_only
parent_workflow: issue-1077-bulk-tag-authenticated-staging-visual
consumed_unassigned_task: docs/30-workflows/unassigned-task/task-issue-1077-followup-002-authenticated-staging-visual-admin-screens-expansion.md
implementation_division: 実装仕様書
implementation_mode: new
task_classification: UI
visual_evidence: VISUAL_ON_EXECUTION
status: implemented_local_runtime_pending
category: 改善 / visual regression coverage 拡張
target_feature: apps/web /admin/* authenticated staging visual regression
priority: 低
scale: 中規模
created_date: 2026-06-07
spec_creation_strategy: optimize_to_current_codebase
```

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #1077 で、staging 環境に admin 認証 storageState を通した状態で実 UI を開いて screenshot を撮る
**authenticated staging visual 基盤**が確立された。具体的には:

- Playwright project `staging-visual-authenticated`（`apps/web/playwright.config.ts:375-394`）
- spec 配置ディレクトリ `apps/web/playwright/tests/visual-staging-authenticated/`
- admin/member storageState を mint する `apps/web/playwright/scripts/mint-staging-storage-state.ts`
- setup/teardown project（`setup.staging-auth.ts` / `teardown.staging-auth.ts`）
- 専用 CI `.github/workflows/playwright-staging-visual-authenticated.yml`

この基盤は **testDir + 逆引き除外方式**（`testDir: './playwright/tests/visual-staging-authenticated'`、
`testIgnore: setup/teardown のみ`）で構成されており、**ディレクトリに新しい `.spec.ts` を置くだけで
追加設定なしに project / CI が認識する**（Phase 2 §2.1 で実証）。

### 1.2 着手時点のカバレッジ調査（current facts / 2026-06-07）

`apps/web/playwright/tests/visual-staging-authenticated/` の現状:

| 既存 spec | 対象 route | 由来 workflow |
| --- | --- | --- |
| `profile-authenticated.spec.ts` | `/profile` | issue-901 |
| `admin-dashboard-authenticated.spec.ts` | `/admin` | issue-901 / T-07 |
| `admin-tags-authenticated.spec.ts` | `/admin/tags` | admin-tag-queue-ui-and-404-recovery / task-C |
| `admin-members-bulk-tag-authenticated.spec.ts` | `/admin/members`（bulk tag picker） | issue-1077 |

→ **#1127 が挙げた横展開候補のうち `/admin/tags` と `/admin`・`/admin/members` は別タスクで既に実装済み**。
未カバーは次の 5 画面である。

| 未カバー route | heading（role=heading name） | 既存の非認証 spec |
| --- | --- | --- |
| `/admin/audit` | 監査ログ | `visual-staging/admin-audit.spec.ts`（**非認証=ガード画面のみ**） |
| `/admin/requests` | 依頼キュー | `visual-staging/admin-requests.spec.ts`（**非認証=ガード画面のみ**） |
| `/admin/identity-conflicts` | Identity 重複候補 | なし |
| `/admin/schema` | スキーマ差分のレビュー | なし |
| `/admin/meetings` | 開催日 / 出席管理 | なし |

非認証版 `visual-staging/` の admin spec は API を `page.route` で bypass しガード/empty 状態を撮るだけで、
**admin 認証を通した実 D1 レスポンス + Cloudflare Workers runtime の実描画は撮れていない**。

### 1.3 放置した場合の影響

- これら 5 admin 画面のレイアウト崩れ・OKLch トークン回帰・認証境界の描画差分が staging 実機で検出されないまま残る。
- 既に確立済みの汎用基盤が 4 画面だけに使われ、横展開コストが極めて低い（ファイル追加のみ）にもかかわらず coverage が広がらない。
- 画面ごとの read-only / mutation 副作用境界判定を後回しにすると、誤った staging mutation を誘発するリスクが温存される。

### 1.4 実装区分の判定根拠（CONST_004）

- 目的「authenticated staging visual 回帰検出を 5 admin 画面へ広げる」は、**Playwright spec ファイルの新規追加（コード変更）なしでは達成不可能**。
- 成果物は `apps/web/playwright/tests/visual-staging-authenticated/*.spec.ts` 5 本（新規作成）であり、ファイル・関数・実行コマンド・テスト方針が含意される。
- よって **実装仕様書**（`[実装区分: 実装仕様書]`）として作成し、CONST_005 の必須項目（変更対象ファイル・関数シグネチャ相当の spec 構造・入出力/副作用・テスト方針・実行コマンド・DoD）を全 Phase に埋める。

---

## 2. 何を達成するか（What）

### 2.1 目的

issue-1077 で確立した authenticated staging visual 基盤を再利用し、未カバーの 5 admin 画面へ
**read-only 初期表示の visual baseline** を横展開して、staging 実機での authenticated visual 回帰検出範囲を広げる。

### 2.2 最終ゴール（今サイクル内で完了 / CONST_007）

- 5 画面（audit / requests / identity-conflicts / schema / meetings）が `staging-visual-authenticated` project の
  独立 spec として capture される。
- 各画面は 1 画面 1 spec として追加され、`admin` role の storageState を再利用する。
- 既存 CI `playwright-staging-visual-authenticated.yml` が追加 spec を追加設定なしに認識・実行する。
- 各 spec は **mutation を伴わない read-only 初期表示状態のみ** を capture し、共有 staging D1 へ破壊的副作用を残さない。

### 2.3 スコープ

#### 含むもの（今サイクルで完了）

- 新規 spec 5 本の追加（`apps/web/playwright/tests/visual-staging-authenticated/`）:
  1. `admin-audit-authenticated.spec.ts`
  2. `admin-requests-authenticated.spec.ts`
  3. `admin-identity-conflicts-authenticated.spec.ts`
  4. `admin-schema-authenticated.spec.ts`
  5. `admin-meetings-authenticated.spec.ts`
- 既存 `admin.storageState.json`（setup.staging-auth.ts が mint）の再利用。
- 画面ごとの read-only / mutation 副作用境界の判定と spec への明文化（コメント + 防御 assertion）。

#### 含まないもの（CONST_007 例外の明示）

- **mutation 結果状態（post-mutation result）の baseline 取得**: bulk tag result / 承認後 / merge 後 / 出席追加後 等の
  「mutation を実行した後の画面」は、staging 共有 D1 への seed/cleanup を伴う別タスク族（**C-1 系 mutation baseline**、
  issue-1125 と同型の seed/cleanup runner パターン）へ委ねる。
  - **これは「先送り」ではなく、issue #1127 自身が §2.3 で定義済みの恒久的なアーキテクチャ境界**である。
    read-only 初期表示 capture（本タスク）と post-mutation result capture（C-1 系）は、必要なインフラ
    （前者=storageState のみ / 後者=seed/cleanup SQL + trap cleanup + 残存 0 検証）が根本的に異なる独立タスクである。
  - CONST_007 の例外条件 1（今サイクルで完了させると技術的・整合性的に破綻する明確な理由 = staging 共有 D1 への
    破壊的 mutation を伴う）に該当し、実施場所（C-1 系 / issue-1125 系列）を明記する。
- 新規 Playwright project / 新規 CI workflow の追加（既存基盤を再利用）。
- `apps/web` / `apps/api` のプロダクトコード・D1 schema・Google Form 仕様の変更。
- production 環境での visual capture。
- commit / push / PR 作成（CONST_002 / user-gated）。
- staging に対する実 capture 実行（user-gated。implemented_local_runtime_pending 時点では実行しない）。

### 2.4 成果物

- 横展開対象 admin 画面ごとの read-only authenticated staging visual spec（5 本）。
- 画面選定と副作用境界判定の記録（read-only 確定 / mutation 除外の根拠 = Phase 2 §2.3）。
- capture command / 対象 URL / auth method の実行手順（Phase 6 / Phase 11）。
- Phase 11 / 12 evidence ledger（implemented_local_runtime_pending のため runtime 実 capture は execution 時 / 現時点 n/a）。

---

## 3. 既存コードベース命名規則の分析（FB-01 / FB-SDK-07-4 対応）

| 規約 | current facts |
| --- | --- |
| spec ファイル名 | `<area>-<feature>-authenticated.spec.ts`（kebab-case）。例: `admin-members-bulk-tag-authenticated.spec.ts` |
| test suffix | `*.spec.ts` のみ（CLAUDE.md 不変条件 #8。`*.test.ts` 禁止） |
| storageState 参照 | `test.use({ storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json") })` |
| screenshot 名 | `toHaveScreenshot("<screen>-authenticated.png", ...)` の `{arg}` が `snapshotPathTemplate` で `-authenticated-staging-visual-{platform}.png` に展開される |
| アニメ無効化 | `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }` を `addStyleTag` |
| screenshot オプション | `{ fullPage: true, maxDiffPixelRatio: 0.05, animations: "disabled" }` |
| Phase 11 evidence 出力 | execution 時のみ `mkdirSync(phase11Dir)` → `page.screenshot({ path: join(phase11Dir, "<name>.png") })` |

> 新規 5 spec は上記 current 規約を**逐語踏襲**し、新しい命名パターン・新しい primitive を生やさない（CLAUDE.md 不変条件 #3 / UI prototype alignment）。

---

## 4. P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在するか | **No**（5 spec は未存在）| 通常の新規実装 Phase（`implementation_mode: new`）|
| upstream（dev/main）にマージ済みか | **No** | 未マージ。本仕様書は implemented_local_runtime_pending |
| 前提タスク（issue-1077 基盤）が完了済みか | **Yes**（project / mint / CI / 雛形 spec すべて landed）| 依存解消タスク不要。基盤再利用のみ |
| 横展開候補のうち既実装分 | `/admin` `/admin/tags` `/admin/members` は **既に authenticated spec あり** | スコープから除外（issue 最適化）|

> `implementation_mode: new` だが、対象は「新規 spec 追加」であり、プロダクトコード（apps/web/src・apps/api）は不変。
> Phase 5 は 5 spec ファイルの新規作成と既存雛形との整合確認が主作業。

---

## 5. 受け入れ条件（Acceptance Criteria）

| ID | 受け入れ条件 |
| --- | --- |
| AC-1 | 5 spec（audit / requests / identity-conflicts / schema / meetings）が `apps/web/playwright/tests/visual-staging-authenticated/` に新規追加されている |
| AC-2 | 各 spec は `admin.storageState.json` を `test.use` で読み込み、対象 route へ遷移し read-only 初期表示を `toHaveScreenshot` する |
| AC-3 | 各 spec は mutation トリガー（承認/却下/merge/別人マーク/割当/Bulk Resolve/Bulk Rollback/再集計/開催日作成・更新・削除/出席追加・削除）を **一切クリックしない**。Phase 2 §2.3 の防御 assertion で「mutation を実行していない」ことを spec 内で保証する |
| AC-4 | `playwright test --project=staging-visual-authenticated --list` に 5 spec が列挙される（project / CI 認識）|
| AC-5 | 既存 4 spec（profile / dashboard / tags / bulk-tag）に差分を加えない（回帰ゼロ）|
| AC-6 | `apps/web/src` / `apps/api` / D1 migration に変更がない（プロダクトコード不変）|
| AC-7 | read-only / mutation 副作用境界の判定が画面ごとに根拠付きで spec コメント + Phase 2 に記録されている |

---

## 6. Phase 1 完了条件

- [x] 実装区分を判定し冒頭に明記した（実装仕様書 / 根拠 §1.4）
- [x] current カバレッジ調査で「未カバー 5 画面」を特定し、既実装 3 画面をスコープ除外した（issue 最適化）
- [x] 5 spec の canonical 名（ファイル名・screenshot 名）を Phase 1 で確定した（artifact 命名ドリフト防止 / Feedback 1）
- [x] 既存命名規則を分析・記録した（FB-01 / FB-SDK-07-4）
- [x] P50 チェックを記録し `implementation_mode: new` を確定した
- [x] AC-1〜AC-7 を固定した
- [x] CONST_007 に従い「今サイクルで read-only 5 画面を完了」、mutation result は C-1 系の恒久境界として根拠付き除外した
