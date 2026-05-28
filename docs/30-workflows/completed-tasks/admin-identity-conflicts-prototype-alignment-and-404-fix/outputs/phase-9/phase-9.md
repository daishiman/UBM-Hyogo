# Phase 9: セキュリティ確認 (PII / admin gate / fail-closed)

**[実装区分: 実装仕様書]**

(A) UI 改修 + (B) 404 修正サイクルにおいて、CLAUDE.md 不変条件と既存 security invariant に regression が無いことを確認する。

## 1. 不変条件チェックリスト

| 不変条件 | 関連 | 本サイクルでの確認方法 |
|----------|------|------------------------|
| #3 `responseEmail` は system field | API 側で部分マスク済 | UI で raw email を render しない。`IdentityConflictRow.tsx` の表示文字列を Phase 11 visual で確認 |
| #4 schema 外データは admin-managed | identity-conflicts は admin-managed | 表示項目に Google Form 由来 payload を直接埋めない |
| #5 D1 直接アクセスは API のみ | `apps/web` は `safeServerFetch` 経由 | grep `from "d1"` / `D1Database` を apps/web 配下で 0 件確認 |
| #10 admin mutation は `@/features/admin/hooks/useAdminMutation` | merge / dismiss POST | `IdentityConflictRow.tsx` の hook import が新パスのまま (legacy `@/lib/useAdminMutation` を導入しない) |

## 2. PII redaction invariant

| 項目 | 表示可否 | 根拠 |
|------|----------|------|
| responseEmail (raw) | **不可** | API 側で `***@domain.tld` にマスク済の値のみを表示 |
| responseEmailMasked | 可 | API レスポンス schema (`ListIdentityConflictsResponse`) で確定 |
| memberName | 可 (admin-managed) | identity 候補識別に必須 |
| 所属 (org) | 可 | 同上 |
| conflictId | 可 (内部 ID) | URL / log に含めても OK |
| requestId | 可 | log correlation 用 |

検証: Phase 11 で `outputs/phase-11/evidence/pii-grep.txt` に以下を保存する。

```bash
# UI に raw email pattern が出ていないか
rg -n '@[a-z0-9.-]+\.[a-z]{2,}' apps/web/app/\(admin\)/admin/identity-conflicts \
  apps/web/src/components/admin/IdentityConflictRow.tsx \
  | grep -v 'responseEmailMasked' | grep -v '//' | grep -v test \
  | tee outputs/phase-11/evidence/pii-grep.txt
# 期待: 空 (= 0 件)
```

## 3. admin gate (fail-closed) 確認

`(admin)/layout.tsx` が admin role を強制する設計のため、`/admin/identity-conflicts` 単独で auth gate を追加する必要はない。ただし B 系 404 修正で auth 経路を変更しないことを確認する。

| 検証 | 方法 |
|------|------|
| 未ログイン → `/login?gate=admin_required` redirect | Playwright `admin-identity-conflicts.spec.ts` の既存 case 維持 |
| 非 admin role → 同上 | 同上 |
| admin role + API 404 → `AdminSectionErrorClient` の `ADMIN_FETCH_404` UI 表示 | Phase 7 のエラーハンドリング表に対応 |
| admin role + API 500 → 同上 `ADMIN_FETCH_500` | 同上 |

invariant #11 (auth fail-closed): `getAuthEnv()` safeParse 経由のため、env 欠落で auth が緩む経路は無い。本サイクルでは env 設定を変更しないため、追加検証不要 (既存契約のまま)。

## 4. CSP / Cookie / CORS 影響

| 項目 | 影響 | 対応 |
|------|------|------|
| CSP | 新規 inline `<style>` / `<script>` 無し | grep gate (既存 `apps/web` issue-924 broad gate) で 0 件確認 |
| Cookie | session cookie のみ使用、本サイクルで追加無し | 確認不要 |
| CORS | same-origin proxy (`apps/web` → `INTERNAL_API_BASE_URL`) | INTERNAL_API_BASE_URL の hostname が誤って external に向いていないことを Phase 11 で wrangler config grep 確認 |

## 5. B 系 (404) 修正で導入禁止の事項

- 静的 bearer token fallback (issue-899 で撤去済)
- 401 を 404 にすり替える middleware (H4 仮説の禁止対応)
- D1 を `apps/web` から直接叩く 404 回避策 (不変条件 #5 違反)
- responseEmail raw 表示で「identity 突合のため」と称した invariant 緩和

## 6. 監査 (audit log) 影響

merge / dismiss は既存 audit log に書き込み済 (`apps/api/src/routes/admin/identity-conflicts.ts`)。本サイクルで audit schema 変更なし。新規 `admin_fetch_404` warn は **観測性ログ** であり監査ログとは別経路 (Phase 8 §3) に保つ。

## 7. 検証コマンド

```bash
# PII grep
rg -n '@[a-z0-9.-]+\.[a-z]{2,}' apps/web/app/\(admin\)/admin/identity-conflicts apps/web/src/components/admin/IdentityConflictRow.tsx

# D1 直接アクセス grep (不変条件 #5)
rg -n 'D1Database|env\.DB\b' apps/web/app/\(admin\)/admin/identity-conflicts

# legacy useAdminMutation grep (不変条件 #10)
rg -n 'from "@/lib/useAdminMutation"' apps/web/src/components/admin/IdentityConflictRow.tsx

# 既存 contract spec 維持
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/routes/admin/identity-conflicts.contract.spec.ts
```

## 8. DoD

- [ ] §1 不変条件 4 項目すべて確認済み (grep 0 件 / hook import 正)
- [ ] §2 PII grep 0 件 (raw email 露出なし)
- [ ] §3 admin gate Playwright 既存 case 維持 (regression 0 件)
- [ ] §5 禁止事項のいずれも実装に混入していない
- [ ] §7 検証コマンドすべて exit 0
- [ ] Phase 11 evidence に `pii-grep.txt` / `d1-grep.txt` / `legacy-hook-grep.txt` を保存

## 9. 参照

- CLAUDE.md「重要な不変条件」#3 / #4 / #5 / #10 / #11
- `outputs/phase-7/phase-7.md` (error handling)
- `outputs/phase-8/phase-8.md` (logging / Sentry tag scheme)
- 既存 `apps/api/src/routes/admin/identity-conflicts.ts` (audit log 出力点)
