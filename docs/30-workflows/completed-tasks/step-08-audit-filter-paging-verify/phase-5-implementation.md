# Phase 5: 実装手順（コード変更ゼロの証跡取得 + 既存挙動の動作再確認）

**[実装区分: 実装仕様書（verify_existing）]**

> Phase 3 §1 の再解釈方針に従い、本 Phase は実装タスクの「GREEN 実装」を **「コード変更ゼロの証跡取得 + 既存挙動の動作再確認」** に置き換える。新規実装・既存コード変更は一切行わない。

## 1. 変更ファイル一覧（FB-RT-03）

| 区分 | ファイル |
|------|---------|
| 新規作成ファイル | `docs/30-workflows/completed-tasks/step-08-audit-filter-paging-verify/` 配下の仕様書・outputs、`.claude/skills/aiworkflow-requirements/references/workflow-step-08-audit-filter-paging-verify-artifact-inventory.md`、dated changelog |
| 修正ファイル | `.claude/skills/aiworkflow-requirements/` の index / ledger / changelog / history sync |
| 削除ファイル | **なし** |

> 本タスクの `apps/` / `packages/` 配下の変更は **ゼロ**。差分は `docs/30-workflows/completed-tasks/step-08-audit-filter-paging-verify/` 配下の仕様書・outputsと、Phase 12で必要な `.claude/skills/aiworkflow-requirements/` 同一wave同期のみ（NFR-5）。

## 2. コード変更ゼロの証跡取得手順

```bash
# 証跡 1: 未コミット差分も含め、apps/packages に変更がないこと
git status --short -- apps packages

# 証跡 2: apps/packages への diff が空であること（出力が空であれば PASS）
git diff -- apps packages

# 証跡 3: 全体差分が workflow docs + aiworkflow sync に限定されること
git status --short
```

| 証跡 | 期待結果 |
|------|---------|
| 証跡 1 | 標準出力が**空**（`apps/` / `packages/` dirty file 0） |
| 証跡 2 | 標準出力が**空**（`apps/` / `packages/` diff 行ゼロ） |
| 証跡 3 | `docs/30-workflows/completed-tasks/step-08-audit-filter-paging-verify/` と `.claude/skills/aiworkflow-requirements/` 同期差分のみ |

> いずれかで `apps/` 差分が検出された場合、verify_existing 前提が崩れる。その差分は本タスクのスコープ外であり、混入として除外（`git restore`）するか、Phase 10 で MAJOR として追跡する。

## 3. 既存挙動の動作再確認チェックリスト

監査結論（「✅ OK」）が現コードで成立することを、既存テストの観点に沿って再確認する。確認は Phase 4 の targeted regression run（T1/T3）の PASS をもって満たす。

| # | 観点 | 期待挙動 | 確認手段（既存テスト） |
|---|------|---------|----------------------|
| C1 | filter submit → URL 同期 | filter form は `action="/admin/audit"` の GET。各項目の `defaultValue` に既存 searchParams を反映。空文字フィールドは URL から skip | T1（defaultValue 反映 / 空文字 skip） |
| C2 | paging → cursor 付与 | `buildAuditHref` が filter 値を保持したまま `nextCursor` を URL に付与。`nextCursor=null` 時は「次のページはありません」を表示し次リンクを生成しない | T1（paging href / render 分岐）, T3（nextCursor 生成） |
| C3 | masking 二段 | API 層 `redactAuditPayload`/`redactString` で一次マスク → UI 層 `maskAuditJson`/`maskAuditText` で二次マスク。可視 DOM に raw PII を出さない | T3（API redact）, T1（UI mask） |
| C4 | 400 分岐 | `ListAuditQueryZ` が不正 email / limit 範囲外 / 不正 cursor / 不正 date range / from>=to を 400 で弾く | T3（query validation / date range / cursor） |
| C5 | mutation surface 不在 | audit route は read-only。編集・削除・再実行ボタンが DOM に存在しない（`useAdminMutation` 非依存） | T1（ボタン不在） |
| C6 | D1 直アクセスなし | page.tsx は `fetchAdmin` 経由で `/admin/audit` API を呼ぶのみ（不変条件5 / NFR-1） | Lane C grep（§4） |

## 4. 不変条件の静的確認（Lane C）

```bash
# NFR-1: apps/web の audit route が D1 binding を直接参照していないこと（grep ヒット 0 を期待）
grep -rn "D1Database\|env\.DB\|\.prepare(" apps/web/app/\(admin\)/admin/audit/ || echo "OK: no D1 direct access"

# NFR-3: audit UI に HEX 直書きがないこと（design-token gate と整合 / ヒット 0 を期待）
grep -rnE "#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#" \
  apps/web/app/\(admin\)/admin/audit/ \
  apps/web/src/components/admin/AuditLogPanel.tsx || echo "OK: no HEX literals"
```

| 確認 | 期待 |
|------|------|
| D1 直アクセス grep | ヒット 0（`fetchAdmin` 経由のみ） |
| HEX 直書き grep | ヒット 0（OKLch トークン正本化を維持） |

## 5. Validation lane（直列締め）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

| コマンド | 期待 |
|---------|------|
| `pnpm typecheck` | PASS（型エラー 0） |
| `pnpm lint` | PASS（lint 違反 0） |

> verify_existing のため typecheck/lint は「既存コードが現状でグリーンであること」の再確認であり、修正対象は発生しない見込み。違反が出た場合は本タスク差分（docs のみ）由来ではないため Phase 10 で切り分ける。

## 6. 完了条件（Phase 5 DoD）

- [ ] 変更ファイル一覧（§1）を workflow docs + aiworkflow sync として明記した。
- [ ] コード変更ゼロの証跡（§2、`git status --short -- apps packages` と `git diff -- apps packages` が空）取得手順を確定した。
- [ ] 既存挙動の動作再確認チェックリスト（§3、C1〜C6）を作成した。
- [ ] 不変条件の静的確認（§4、D1 直アクセス / HEX）手順を確定した。
- [ ] Validation lane（§5、typecheck / lint）の期待結果を明記した。
