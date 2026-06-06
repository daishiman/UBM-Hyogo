# Phase 13: PR 作成計画

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| workflow_state | `spec_created` |
| phase 状態 | **pending_user_approval** |
| base ブランチ | `dev`（既定。production リリース時のみ `main`） |
| related issue | #1079（CLOSED） |

> 本ファイルは PR 作成の**計画**であり、実 PR 作成は含まない。
> PR 作成・commit・push はすべて **user 明示承認後のみ**実行する（CONST_002）。
> 承認前は本計画に従った準備（含めるファイル一覧の取得方法・本文骨子）のみを記述する。
> runtime 完了語は本文に記載しない（spec authoring 段階）。

---

## 1. 前提（user 承認後に実行）

- 実装サイクル（Task A/B/C）が完了し、typecheck / lint / 全テスト緑（Gate-B）であること。
- Gate-C（`phase-10-final-review.md`）の AC-1..5 評価が PASS であること。
- Phase 11 の canonical screenshot 3 枚が `outputs/phase-11/` に取得済みであること。
- base ブランチは `dev`。作業ブランチは差分主題から `feat/issue-1079-bulk-tag-audit-batch-filter` を想定。

---

## 2. PR タイトル（案）

```
feat(issue-1079): audit viewer に bulk tag batchId 検索・表示・copy 導線を追加
```

---

## 3. PR 本文 骨子

`.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として扱い、`outputs/phase-12/implementation-guide.md`
の内容を漏れなく反映する。骨子は以下。

### 3.1 概要
- 親 #1036 が audit JSON に埋め込んだ `batchId` を、`/admin/audit` から検索・表示・copy できるようにする運用 UX 改善。
- schema 変更なし（`json_extract` による JSON 内検索）。新 endpoint なし（既存 `GET /admin/audit` の query 拡張）。

### 3.2 変更内容（Task 別）
- **Task A（apps/api）**: `audit.ts` の `ListAuditQueryZ` / `appliedFilters` に `batchId` 追加。`auditLog.ts` の `AuditLogListFilters` と `listFiltered` に after_json / before_json 両列 OR の `json_extract` 検索を追加（同一 `?N` 共有）。
- **Task B（apps/web）**: `AuditLogPanel.tsx` の `AuditSearchValues` / `buildAuditHref` / FilterForm に batchId を追加。`page.tsx` の searchParams 解析 + `buildAuditApiPath` に batchId 追加。`types.ts` の `AdminAuditFilters` に batchId 追加。
- **Task C（apps/web）**: `AuditLogPanel.tsx` に `extractBatchId` helper と AuditRow の batchId 表示を追加。新規 `BatchIdCopyButton.tsx`（"use client"）。

### 3.3 受入条件 達成状況
- AC-1（batchId 絞り込み）/ AC-2（row 表示 + copy）/ AC-3（action 併用）/ AC-4（cursor 保持）/ AC-5（full scan 方針明記）の達成を Gate-C 結果と紐付けて記載。

### 3.4 AC-5 full scan 方針
- keyset cursor + LIMIT による行数 bound / batchId UUID の sparse 性 / from·to·action 併用推奨。schema index 化は別タスク（未タスク候補）。

### 3.5 不変条件遵守
- D1 直アクセス（#5）= json_extract は apps/api のみ / FormField（#9）= batchId input は `<FormField>` 経由 / OKLch token（HEX 直書きなし）/ 既存 API surface のみ拡張。

### 3.6 スクリーンショット
- `outputs/phase-11/` に取得済みの canonical 3 枚を参照:
  - `audit-batchid-filter-empty.png`
  - `audit-batchid-filter-applied.png`
  - `audit-row-batchid-copy.png`
- 画像が存在しない場合はスクリーンショット専用セクションを作らない（VISUAL_ON_EXECUTION・取得後に追加）。

### 3.7 テスト
- repository spec（json_extract OR / binding 共有 / AND 併用）/ API contract spec（d1 config 必須）/ component spec（extractBatchId / AuditRow / buildAuditHref）/ 新規 BatchIdCopyButton spec（clipboard モック）。

---

## 4. 含めるファイル一覧の取得方法

PR 作成時に以下で確定する（diff-to-pr 完全自律フロー準拠）。

```bash
git fetch origin dev
git diff dev...HEAD --name-only   # PR に含まれるファイル一覧（漏れなし確認）
git status --porcelain            # 未コミット変更が空であること
```

想定される変更ファイル（Phase 2 §7 一覧）:

| パス | 区分 |
| --- | --- |
| `apps/api/src/routes/admin/audit.ts` | 編集 |
| `apps/api/src/repository/auditLog.ts` | 編集 |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 編集 |
| `apps/web/app/(admin)/admin/audit/page.tsx` | 編集 |
| `apps/web/src/lib/admin/types.ts` | 編集 |
| `apps/web/src/components/admin/BatchIdCopyButton.tsx` | 新規 |
| 各 spec（contract / repository / component / BatchIdCopyButton） | 新規 / 追記 |
| `docs/30-workflows/completed-tasks/issue-1079-bulk-tag-audit-batch-filter/**` | 仕様書一式 |

---

## 5. PR 作成コマンド（user 承認後）

```bash
gh pr create --base dev --title "feat(issue-1079): audit viewer に bulk tag batchId 検索・表示・copy 導線を追加" --body-file <本文>
```

> base は `dev`（production リリース時のみ `--base main`）。
> PR 本文末尾には diff-to-pr 規約に従い生成署名を付す。

---

## 6. PR 作成前チェック

- `git status --porcelain` が空であること。
- `git diff dev...HEAD --name-only` が取得できていること。
- `outputs/phase-12/implementation-guide.md` の主要見出しが PR 本文に反映されていること。
- `outputs/phase-11/` の画像数と PR 本文の画像参照が整合していること（画像が無ければスクリーンショット節を残さない）。
- 品質検証 4 コマンド（`pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`）が緑であること。

---

## 7. 判定

**Phase 13 = pending_user_approval**

- PR 作成・commit・push は user 明示承認後のみ実行する（CONST_002）。
- 承認前は本計画（タイトル / 本文骨子 / ファイル一覧取得方法 / 作成コマンド）の記述に留める。

---

## 完了条件 (DoD)

- PR タイトル / 本文骨子 / 含めるファイル一覧の取得方法が記述されている。
- screenshot 参照（canonical 3 名・取得後に追加 / 無ければ節を作らない）が記述されている。
- base = dev・PR 作成コマンド・作成前チェックが記述されている。
- phase 状態 = pending_user_approval（user 承認後のみ実行）が明記されている。
