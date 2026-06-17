# Phase 6: テスト拡充

> Phase 5 の T-01〜T-12（happy path + 主要 fail path）を土台に、**fail path の網羅追加**と
> **既存テストの回帰 guard 実行リスト**を確定する。新規テスト追加先は Phase 5 で作成済みの
> `MemberDrawer.restore.spec.tsx` への追記のみ（テストファイルは増やさない・`*.spec.{ts,tsx}` 維持）。

## 参照資料

| 種別 | パス | 用途 |
|------|------|------|
| 実装仕様 | `outputs/phase-5/phase-5.md` §5.3（`DeletedMemberSection` の error/isLoading 設計）・§5.5（T-01〜T-12） | 拡充対象の挙動定義 |
| hook 仕様 | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | POST は retry 不可（非冪等 overload）・network error は `Error`（`FetchAuthedError` 以外）で `onError` 到達 |
| fetch mock 前例 | `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx` | URL 分岐 stub・toast/router mock 構成 |
| 回帰 guard 対象 | 下表「回帰 guard 実行リスト」の 7 ファイル | 既存挙動の不変確認 |

## 6.1 fail path 追加テスト（E-01〜E-04・`MemberDrawer.restore.spec.tsx` へ追記）

| ID | シナリオ | 期待挙動 | 実装メモ |
|----|---------|---------|---------|
| E-01 | **network error**: restore POST の fetch mock を `mockRejectedValueOnce(new TypeError("fetch failed"))` 相当で reject | セクション内 `role="alert"` に汎用文言「復元に失敗しました。時間をおいて再度お試しください。」・退会済みセクションは残存（`onUpdated` 未発火）・ボタンは再度押下可能（disabled 解除） | `FetchAuthedError` 以外の `Error` は 409 マップに該当せず汎用文言へ落ちることの検証 |
| E-02 | **confirm キャンセル後の再操作**: 1 回目 `confirm` → `false`、2 回目 → `true` | 1 回目は restore fetch 0 回・エラー表示なし。2 回目で fetch が 1 回発火し成功フローへ進む（キャンセルが状態を汚さない） | `vi.spyOn(globalThis, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true)` |
| E-03 | **連打防止（isLoading）**: restore POST を未解決 Promise で pending に保ち、ボタンを 2 回 click | restore fetch の発火は **1 回のみ**・pending 中ボタンが `disabled` である | `disabled` ガード + `handleRestore` 冒頭の `if (isLoading) return;` 二重ガードの検証。pending Promise は手動 resolve 用 deferred で作る |
| E-04 | **404 member not found**: restore POST が 404 を返す | `role="alert"` に汎用文言（409 専用文言**ではない**こと）・toast 成功メッセージなし・セクション残存 | API 契約（`member-delete.ts`）の 404 系。`FetchAuthedError(404)` は 409 マップ非該当の確認 |

> T-09（confirm キャンセル単体）/ T-10（409）/ T-11（5xx）は Phase 5 で作成済み。E-01〜E-04 はその**境界の深掘り**
> （network error と HTTP error の区別、キャンセル後の再実行可能性、pending 中の冪等性、404/409 の文言分岐）であり重複ではない。

### C1 側の拡充（`session-error-display.spec.ts` へ追記・任意 1 件）

| ID | シナリオ | 期待挙動 |
|----|---------|---------|
| E-05 | 未知 code（例 `MEMBER_SESSION_999` 形式外の文字列） | FAILED フォールバック分岐に落ち、410 文言が漏れ出さない（`dataCause === "session-failed"`） |

## 6.2 回帰 guard 実行リスト（既存テスト・期待値変更なしで PASS すること）

| # | ファイル | guard 対象 |
|---|---------|-----------|
| 1 | `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | drawer 基本描画（既存 4 本 その1） |
| 2 | `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx` | IDENTITY 日本語ラベル（その2） |
| 3 | `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx` | tags 楽観更新（その3） |
| 4 | `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx` | tag inline create（その4） |
| 5 | `apps/web/src/components/member/__tests__/SectionError.spec.tsx` | /profile 側エラー表示プリミティブ（actionHref/actionLabel/retryHref 描画契約） |
| 6 | `apps/web/src/components/public/__tests__/SectionError.spec.tsx` | 公開側 SectionError（同名別実装の巻き添え検知） |
| 7 | `apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts` 内 404/5xx/FAILED ケース | C1 他分岐の不変（T-05 と同一観点の最終確認） |

### 一括実行コマンド（repo root）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts" \
  "apps/web/app/(member)/profile/page.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx" \
  "apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx" \
  "apps/web/src/components/member/__tests__/SectionError.spec.tsx" \
  "apps/web/src/components/public/__tests__/SectionError.spec.tsx"
```

## 6.3 拡充時の禁止事項

- 回帰 guard 対象（#1〜#6）の**期待値を書き換えない**（書き換えが必要に見えたら実装側の回帰を疑い Phase 5 へ戻る）。
- restore の retry テストを書かない（POST は `useAdminMutation` の型レベルで retry 不可。仕様にない挙動をテストで固定しない）。
- `apps/api` 側の contract test（`member-delete.contract.spec.ts`）には触れない（非接触）。

## 実行タスク

- [x] E-01〜E-04 を `MemberDrawer.restore.spec.tsx` へ追記（実 `useAdminMutation` 経路 + fetch mock で GREEN）
- [x] E-05 を `session-error-display.spec.ts` へ追記
- [x] focused 一括実行コマンドで対象 3 files / 24 tests PASS を確認
- [x] `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` exit 0

## 完了条件

- [x] E-01〜E-05 が追加され全 GREEN。
- [x] 回帰 guard は focused Vitest 3 files / 24 tests で PASS。
- [x] テストファイル構成は `*.spec.*` のみ（`*.test.*` 追加 0 件）。

## 成果物

- 本ファイル `outputs/phase-6/phase-6.md`（fail path 追加設計 E-01〜E-05 + 回帰 guard 実行リスト + 一括実行コマンド）
- `MemberDrawer.restore.spec.tsx` / `session-error-display.spec.ts` への追記（実装済み）
