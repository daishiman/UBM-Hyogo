# Phase 5: 実装（TDD GREEN）

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL**

## 1. 新規作成ファイル一覧（必須）

| パス | 種別 | 備考 |
| --- | --- | --- |
| `apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts` | 新規作成 | 本タスク唯一の追加ファイル |

**production コード変更なし。** `buildAuthConfig` / `resolveAuthView` / `getAuthView` / `types` は既に export 済のため、
新規 source / 既存 source の編集は発生しない。`apps/web/src/lib/auth.ts` 等の本番ロジックには一切手を入れない。

## 2. 実装手順（実装者が辿る手順）

1. Phase 4 §3 の完全雛形を `apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts` として新規作成する。
2. `vi.mock("@opennextjs/cloudflare", ...)` が import より上（巻き上げ位置）にあることを確認する。
3. focused vitest を実行し、5 ケースが GREEN になるまで GREEN 注意点（§3）を順に潰す。
4. `typecheck` を実行し型エラー 0 を確認する（キャスト位置を実型署名に合わせ微調整）。
5. `lint` を実行し違反 0 を確認する（`vi.fn() as unknown as typeof fetch` 等の明示キャストが no-explicit-any 等に触れないか確認）。
6. 既存テスト（`getAuthView.spec.ts` / `resolveAuthView.spec.ts` / `auth.spec.ts`）が引き続き全 pass であることを確認する（regression なし）。

## 3. GREEN にするための注意点

| 注意点 | 内容 |
| --- | --- |
| cloudflare mock 必須 | `getCloudflareContext` を解決できないと `buildAuthConfig` / `getAuth` 経路が throw する。`vi.mock("@opennextjs/cloudflare", ...)` を spec 先頭に置く（`auth.spec.ts` と同形）。 |
| factories stub 必須 | `buildAuthConfig` は `providerFactories` 未指定だと build 時に throw する。`{ GoogleProvider: () => ({id:"google"}), CredentialsProvider: () => ({id:"magic-link"}) }` を必ず渡す。 |
| `produced.user` の型キャスト | session callback の返り値は Auth.js の `Session` 型のため、`resolveAuthView` に渡す前に `as SessionLike`（または `{ user } as SessionLike`）でキャストする。これは app-level contract に限定し Auth.js 内部型へ深追いしないため。 |
| TC-AVSC-04 の動的 mock | `getAuth` の mock は `vi.doMock` + 動的 `import("../getAuthView")` で行い、他 TC が実 `buildAuthConfig` を使う邪魔をしないこと。ケース末尾で `vi.doUnmock` する。 |
| async callback | `callbacks.session` は async の可能性があるため `await` で受ける（雛形は `await` 済）。 |

## 4. DoD（Definition of Done）

| 項目 | 基準 |
| --- | --- |
| focused vitest | 新規 spec 5 ケース（TC-AVSC-01〜05）すべて pass |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` でエラー 0 |
| lint | `mise exec -- pnpm lint` で違反 0 |
| 既存テスト regression | `getAuthView.spec.ts` / `resolveAuthView.spec.ts`（pure 9 ケース）/ `auth.spec.ts` が全 pass のまま |
| production 変更 | `git status --porcelain apps/web/src/lib/auth*.ts apps/web/src/lib/auth-view/{getAuthView,resolveAuthView,types,index}.ts` が空（spec 以外の差分ゼロ） |

## 5. 検証コマンド

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts \
  apps/web/src/lib/auth-view/__tests__/getAuthView.spec.ts \
  apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts \
  apps/web/src/lib/auth.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
```

## 完了条件（Phase 5）

- [ ] 新規作成ファイル一覧（spec 1 件のみ・production 変更なし）を記載した
- [ ] 実装手順（実装者の辿る順序）を記載した
- [ ] GREEN 注意点（cloudflare mock / factories stub / `as SessionLike` キャスト）を記載した
- [ ] DoD（focused 5 pass / typecheck 0 / lint 0 / 既存 regression なし）を定義した
- [ ] 検証コマンドを記載した
