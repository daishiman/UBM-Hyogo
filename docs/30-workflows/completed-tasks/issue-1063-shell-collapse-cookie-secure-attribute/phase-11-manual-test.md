# Phase 11: 手動テスト / Evidence

> issue-1063 — shell collapse cookie に production 限定で `Secure` 属性を付与

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 11（手動テスト / Evidence） |
| task_id | issue-1063-shell-collapse-cookie-secure-attribute |
| workflow_state | implemented_local_evidence_captured |
| visual_category | NON_VISUAL |
| issue | #1063（CLOSED のまま再スコープ・reopen しない） |

## NON_VISUAL 宣言

- **タスク種別 = NON_VISUAL**
- **非視覚的理由**: `Secure` は cookie の **送信制御属性**であり、レンダリング結果（レイアウト・配色・寸法）にも `document.cookie` の read 値にも現れない。ブラウザは `Secure` 付き cookie を HTTPS 接続でのみ送信するが、JavaScript から `document.cookie` を読んだ値には `; Secure` の文字列は含まれない。したがって screenshot 比較・DOM read では検証不可能であり、serializer の戻り値文字列を直接検証する focused Vitest が唯一の自動検証経路となる。
- **代替証跡**: focused Vitest log（`apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts` スコープ・TC-1〜TC-6）+ serializer 戻り値文字列検証（明示 `secure=true` と HTTPS runtime 既定経路の双方で `; Secure` 終端を assert）。スクリーンショットは作成しない。

## 目的

`serializeShellCollapsedCookie` の `Secure` 環境分岐を、(a) focused Vitest で自動検証し、(b) production(HTTPS staging) / localhost(http) の両環境で DevTools 目視 smoke して回帰がないことを確認する手順を確定する。本サイクルでは local focused Vitest を実走済みで、browser smoke は user 承認後に `NOT EXECUTED` として残す。

## 実行タスク

### 11.1 実行前提（gate）

- 本サイクルではコード実装、focused Vitest、shell regression suite、typecheck、lint、grep gate、build を実施済み。browser smoke は user-gated として記録する。
- browser smoke（DevTools Application タブ）は commit/PR 前の外部操作に近い確認のため user-gated とする。
- 実装後の前提条件:
  - `mise exec -- pnpm typecheck` が green。
  - `mise exec -- pnpm lint` が green（lint-boundaries 含む。`process.env` / web storage トークン 0 件）。
  - `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts` が全 pass。

### 11.2 手動 smoke 手順（user 承認後に実走）

1. **production(HTTPS staging) で `Secure` ON**
   - staging（`https://` 配信）の shell 配下画面（例: `/profile`）を開く。
   - sidebar collapse toggle を押して collapsed にする。
   - DevTools → Application タブ → Cookies → 当該オリジンを開く。
   - `ubm_shell_collapsed` 行の **Secure フラグ列にチェック（✓）が付いている**ことを目視確認する。
2. **localhost(http) で `Secure` OFF**
   - `http://localhost` の dev サーバで shell 配下画面を開く。
   - sidebar collapse toggle を押す。
   - DevTools → Application → Cookies で `ubm_shell_collapsed` 行の **Secure フラグ列が空（チェック無し）**であることを目視確認する。
3. **dev 永続化が回帰しないこと**
   - localhost(http) で collapsed にしてリロード → **collapsed が維持**されることを確認（`Secure` 無しで cookie が書き込めている）。
   - expanded にしてリロード → **expanded が維持**されることを確認。
4. **既存属性が回帰しないこと**
   - 両環境とも `ubm_shell_collapsed` の `Path=/` / `SameSite=Lax` / `Max-Age=31536000` が維持されていることを DevTools の cookie 詳細で確認する。
   - `HttpOnly` 列にチェックが**付いていない**ことを確認する（client が読み書きするため）。

### 11.3 実行記録

> browser / DevTools を伴う smoke は user 承認後に実走する。focused Vitest は local evidence として取得済み。

| 項目 | 結果 | 備考 |
|------|------|------|
| production(HTTPS) で Secure フラグ ON（目視） | NOT EXECUTED | user-gated（browser smoke） |
| localhost(http) で Secure フラグ OFF（目視） | NOT EXECUTED | user-gated（browser smoke） |
| dev 永続化 collapsed 維持 | NOT EXECUTED | user-gated（browser smoke） |
| dev 永続化 expanded 維持 | NOT EXECUTED | user-gated（browser smoke） |
| 既存属性（Path=/ / SameSite=Lax / Max-Age=31536000） | NOT EXECUTED | user-gated（browser smoke） |
| HttpOnly 付かない（client 読み書き） | NOT EXECUTED | user-gated（browser smoke） |
| focused Vitest（TC-1〜TC-6）全 pass | PASS | `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`、10 tests PASS |
| serializer 戻り値 `; Secure` 末尾検証 | PASS | `serializeShellCollapsedCookie(true, true)` が `; Secure` で終端 |
| web lint / typecheck | PASS | `pnpm typecheck` / `pnpm lint` PASS |
| build | PASS | `mise exec -- pnpm build` PASS（Next build は既存 warning のみで完了） |
| `process.env` 0 件 grep（shell 配下） | PASS | fail 可能な grep gate で 0 件 |

主証跡: focused Vitest log（TC-1〜TC-6 + 既存ケース）+ serializer 戻り値文字列検証。`Secure` は送信制御属性で read 値・レンダリングに現れないため screenshot は作成しない（NON_VISUAL）。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| Phase 11 evidence 正本 | `outputs/phase-11/manual-test-result.md` | NON_VISUAL 宣言・証跡メタ・実行記録 |
| Phase 4 テスト | `phase-4-test-plan.md` | TC-1〜TC-6 |
| 起点 spec | `docs/30-workflows/completed-tasks/issue-1024-followup-001-cookie-secure-attribute-production-hardening.md` | 手動 smoke の設計判断（DevTools Secure 確認） |

## 統合テスト連携

統合テスト（Playwright / DOM read）は適用外。`Secure` 属性は `document.cookie` の read 値に現れないため、focused Vitest による serializer 文字列検証が唯一の自動証跡。browser DevTools の Application→Cookies での Secure フラグ目視は user-gated。

## 成果物

- 本ファイル（`phase-11-manual-test.md`）と `outputs/phase-11/manual-test-result.md` に NON_VISUAL 宣言・代替証跡・user-gated smoke 手順を確定する。

## 完了条件

- NON_VISUAL 宣言（タスク種別・非視覚的理由・代替証跡）が明記されている。
- 実行記録テーブルが `PASS`（local focused evidence）と `NOT EXECUTED`（user-gated smoke）を分離記録している。
- 主証跡（serializer 文字列検証）が固定されている。
