# Phase 9: 品質保証（設計書）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 9 / 13 |
| 名称 | 品質保証 |
| 種別 | 設計書 |
| 判定 | line budget / link / mirror parity / token gate / 回帰を一括判定 |
| 戻り先 | QA fail 時は原因に応じて Phase 5（実装不具合）または Phase 8（リファクタ起因）へ戻す |

## 目的

typecheck・lint・OKLch トークン gate・回帰テスト・M-1 重複 0 確認を一括実行し、本タスクの変更全体が
品質ゲートを満たすことを PASS/FAIL で判定する。fail した場合の戻り先（Phase 5 / Phase 8）を明示する。

## 実行タスク

1. `pnpm typecheck`（web + api + og）で型整合を確認する。
2. `pnpm lint`（`--fix` 優先・残りを手修正）で lint 違反 0 にする。
3. OKLch トークン gate（`verify-design-tokens` 相当）で HEX 直書き 0 を確認する。
4. `git diff --stat` で `apps/api` / `apps/web` / `apps/og` の変更範囲を確認する。
5. 既存 `/profile`・`/admin/*` ゲートテスト GREEN 維持（AC-10 回帰）を確認する。
6. M-1 重複 0（[FB-UI-02-1] live import 0 含む）を確認する。

## 参照資料

| 参照資料 | パス | 用途 |
|---------|------|------|
| 品質基準 | `.claude/skills/task-specification-creator/references/quality-standards.md` | line budget / link / mirror |
| 設計レビュー（M-1/M-2） | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-3.md` | M-1 解決確認は本 Phase |
| トークン正本 | `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch gate 基準 |
| リファクタ結果 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-8.md` | 重複排除の確認対象 |

## 実行手順

### 手順 1: typecheck（web + api + og）

```bash
mise exec -- pnpm typecheck
```

- PASS 基準: 0 error。`apps/og` の `INTERNAL_AUTH_SECRET` env 型追加（Phase 2 §3.4）が型に反映され、`member-source.ts` の header 付与が型エラーにならないこと。
- FAIL 時の戻り先: 型不整合（env 型・middleware シグネチャ・helper 戻り型）→ **Phase 5**。helper 抽出での型崩れ → **Phase 8**。

### 手順 2: lint

```bash
mise exec -- pnpm lint        # まず確認
mise exec -- pnpm lint --fix  # 自動修正優先
# 残違反は手修正
```

- PASS 基準: lint 違反 0。新規ファイル（`LoginRequiredNotice.tsx` / `require-public-access.ts` / `verify-session-jwt.ts`）が既存 lint ルールに準拠。
- FAIL 時の戻り先: **Phase 5**（実装スタイル）。

### 手順 3: OKLch トークン gate（HEX 0 確認）

```bash
# web の design token gate（verify-design-tokens 相当）
mise exec -- pnpm --filter @ubm-hyogo/web verify:tokens
# 補助 grep: 新規コンポーネントに HEX 直書き / 任意色クラスが無いこと
grep -rnE "#[0-9a-fA-F]{3,6}\b|bg-\[#|text-\[#" apps/web/src/components/auth/
```

- PASS 基準: token gate PASS かつ `LoginRequiredNotice.tsx` に HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が 0 件（AC-12）。新規 primitive を生やしていない。
- FAIL 時の戻り先: **Phase 5**（色指定をトークン参照へ是正）。

### 手順 4: 変更範囲確認（git diff --stat）

```bash
git diff --stat -- apps/api apps/web apps/og
```

- 期待される変更ファイル（Phase 2 topology + Phase 8 helper）:
  - `apps/api`: `middleware/require-public-access.ts`（新規）/ `routes/public/index.ts` / `lib/auth/verify-session-jwt.ts`（新規・Phase 8）/ `middleware/require-admin.ts`（Phase 8）/ `middleware/session-guard.ts`（Phase 8）
  - `apps/web`: `src/components/auth/LoginRequiredNotice.tsx`（新規）/ `app/(public)/layout.tsx` / `src/lib/api/public.ts` / `src/lib/fetch/public.ts` / `app/sitemap.ts`
  - `apps/og`: `src/member-source.ts`（+ env 型）
- PASS 基準: 上記以外の意図しないファイル変更が無い。

### 手順 5: 既存ゲート回帰（AC-10）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test "middleware.spec.ts"
mise exec -- pnpm --filter @ubm-hyogo/api test \
  src/middleware/require-admin.spec.ts \
  src/middleware/session-guard.spec.ts
```

- PASS 基準: `/profile`・`/admin/*` の既存ゲートテストが GREEN（middleware redirect 挙動が不変・AC-10）。Phase 8 の helper 抽出後も admin role 判定が GREEN。
- FAIL 時の戻り先: helper 抽出で admin 挙動が変わった → **Phase 8**。

### 手順 6: M-1 重複 0 / live import 確認（[FB-UI-02-1]）

```bash
# JWT decode 実体が helper 1 箇所のみ
grep -rn "verify.*jwt\|jwtVerify\|authjs.session-token" apps/api/src
```

- PASS 基準: JWT decode の実体が `lib/auth/verify-session-jwt.ts` の 1 箇所のみ。`require-admin.ts` / `session-guard.ts` / `require-public-access.ts` は helper を import して呼ぶだけ（重複本体 0）。
- [FB-UI-02-1] 補足: 本タスクはファイル削除を伴わない（stub 化なし）。仮に旧検証関数を残す場合は `grep -rn "import.*<旧関数>" apps/api/src` で live import 0 を証跡に残す。

### 手順 7: mirror parity（`.claude` 正本 → `.agents` mirror）

```bash
diff -qr .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements
```

- PASS 基準: 正本（`.claude`）と mirror（`.agents`）に差分 0（不変条件）。本 workflow がスキル正本を更新した場合は same-wave で mirror も同期する。

## PASS 基準（一括）

- [ ] `pnpm typecheck` 0 error（og env 型追加含む）
- [ ] `pnpm lint` 違反 0
- [ ] OKLch トークン gate PASS / 新規コンポーネント HEX 0
- [ ] `git diff --stat` が想定ファイルのみ
- [ ] `/profile`・`/admin/*` ゲートテスト GREEN（AC-10 回帰）
- [ ] M-1 重複 0（JWT decode 実体が helper 1 箇所）
- [ ] mirror parity 差分 0

## QA fail 時の戻り先

| fail 種別 | 戻り先 |
|----------|--------|
| 型不整合・lint・トークン・実装挙動 | **Phase 5**（実装） |
| helper 抽出起因の重複残存・admin 挙動変化 | **Phase 8**（リファクタリング） |
| テスト不足で分岐未検出 | **Phase 6**（テスト拡充）→ 再 QA |

## 統合テスト連携

- Phase 7 の coverage 証跡 + 本 Phase の回帰結果で、認証境界（C1/C2）の品質を確定する。
- Phase 10（最終レビュー）へ PASS 状態で引き継ぐ。

## 多角的チェック観点（AIが判断）

- システム系: token gate / typecheck / mirror parity は「正本不整合」を機械検出するバランスループ。手動確認に依存しない。
- 問題解決系: 回帰（AC-10）は「公開ゲート追加が既存 admin/profile ゲートを壊さない」ことの保証。多層防御の整合確認。

## サブタスク管理

- [ ] typecheck / lint / token gate を実行した
- [ ] git diff --stat で変更範囲を確認した
- [ ] 既存ゲート回帰 GREEN を確認した
- [ ] M-1 重複 0 を確認した
- [ ] mirror parity を確認した

## 成果物

| 成果物 | 配置 |
|--------|------|
| 品質保証（本書） | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-9.md` |
| QA 実行ログ | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/outputs/phase-9/qa-result.md` |

## 完了条件

- [ ] PASS 基準 7 項目がすべて PASS
- [ ] fail 時の戻り先（Phase 5/6/8）が明示されている
- [ ] M-1 解決確認（重複 0）が記録されている

## タスク100%実行確認【必須】

- [ ] typecheck / lint / token gate / 回帰 / 重複 0 / mirror parity を一括判定し PASS を記録した

## 次Phase

[phase-10.md](phase-10.md) — 最終レビュー（acceptance criteria / blocker 判定）
