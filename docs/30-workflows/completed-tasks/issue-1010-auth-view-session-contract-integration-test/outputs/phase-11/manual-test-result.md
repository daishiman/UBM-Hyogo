# 手動テスト結果（NON_VISUAL 証跡メタ）

## 証跡メタ概要

| 項目 | 値 |
| --- | --- |
| visual_evidence | NON_VISUAL |
| 証跡の主ソース | focused Vitest（下表のテストファイル群） |
| 主ソースファイル | `apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts`（新規）+ 連帯回帰対象 3 ファイル |
| スクリーンショットを作らない理由 | UI/DOM 変更がなく、検証対象が型・shape レベルの契約のため画面差分が発生しない |
| workflow_state | `implemented_local_evidence_captured` |
| 実テスト結果の有無 | **あり**。focused Vitest 4 files / 61 tests PASS |

## 実テスト結果

新規 `authViewSessionContract.integration.spec.ts` を追加し、実 `buildAuthConfig().callbacks.session` 出力を `resolveAuthView()` / `getAuthView()` に連鎖させる focused Vitest を実行した。

## focused Vitest 結果

| テストファイル | 区分 | 実ケース数 | 主な検証内容 | 現状態 |
| --- | --- | --- | --- | --- |
| `authViewSessionContract.integration.spec.ts`（新規） | integration（契約テスト） | 8 | 実 `buildAuthConfig().callbacks.session({ token })` 出力を `resolveAuthView()`/`getAuthView()` に連鎖: ①member session → `member`/`/profile` ②admin session → `admin`/`/profile`/`/admin` ③`memberId` 欠落 → `guest` fail-closed ④`isAdmin` 欠落 → `member` ⑤空白 `memberId` → `guest` ⑥`isAdmin:null` → `member` ⑦`isAdmin:"true"` → `member` ⑧session callback 出力 field 名が `resolveAuthView` の読む field と byte 一致 | PASS |
| `getAuthView.spec.ts`（既存） | unit（回帰） | 4 | `getAuth().auth()` 経由の guest fail-close / member / admin 解決の回帰なし | PASS |
| `resolveAuthView.spec.ts`（既存） | unit（回帰） | 9 | pure resolver の guest/member/admin マッピング・blank `memberId` → guest の回帰なし | PASS |
| `auth.spec.ts`（既存） | unit（回帰） | 40 | `buildAuthConfig` / callbacks / getAuth / JWT encode-decode の既存回帰なし | PASS |
| 合計 | — | **61** | 新規 8 + 既存回帰 53 | PASS |

## 検証コマンド（実行済）

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts \
  apps/web/src/lib/auth-view/__tests__/getAuthView.spec.ts \
  apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts \
  apps/web/src/lib/auth.spec.ts
```

## 実行結果記録欄

| 観点 | 取得値 | 状態 |
| --- | --- | --- |
| 新規 integration ケース pass 件数 | 8 / 8 | PASS |
| 既存回帰 pass 件数 | 53 / 53 | PASS |
| Vitest exit code | 0（4 files / 61 tests、Duration 10.42s） | PASS |
| typecheck exit code | 0（`mise exec -- pnpm --filter @ubm-hyogo/web typecheck`） | PASS |
| lint exit code | 0（`mise exec -- pnpm lint`。stablekey warning 2 件は既存 warning mode、exit 0） | PASS |
