# Phase 10: 最終レビュー（Go / No-Go）

> 実装区分: **実装仕様書**

## 1. 完了確認マトリクス

| 観点 | 状態 | 根拠 |
|---|---|---|
| 実装：`magic-link-client.ts` の typed error + 429 解析 | 仕様確定 | Phase 5 Step 1 |
| 実装：`MagicLinkForm.client.tsx` の catch 分岐 | 仕様確定 | Phase 5 Step 2 |
| Unit test 追加（client lib 4 ケース） | 仕様確定 | Phase 5 Step 3 / Phase 4 §2.1 |
| Component test 追加（form 2 ケース） | 仕様確定 | Phase 5 Step 4 / Phase 4 §2.2 |
| typecheck / lint / build PASS | 要確認 | Phase 5 Step 5 / Step 7 |
| coverage 維持 | 要確認 | Phase 7 |
| manual smoke | 要確認 | Phase 11 |

## 2. AC trace

| AC | Phase | 検証手段 |
|---|---|---|
| AC-1 (typed error) | Phase 4 §2.1 / Phase 6 §1 | `expect(e).toBeInstanceOf(MagicLinkRateLimitedError)` |
| AC-2 (countdown 起動) | Phase 4 §2.2 / Phase 6 §1 | `button.disabled === true` + label に countdown 文字列 |
| AC-3 (session 内復元のみ / reload 永続化 scope 外) | Phase 1 / Phase 6 §2 | 仕様明記 + テスト除外 |
| AC-4 (Vitest 検証) | Phase 4 / Phase 5 Step 6 | `pnpm --filter @ubm-hyogo/web test` で deterministic |
| AC-5 (不変条件 / 全 PASS) | Phase 9 §1〜§4 | typecheck / lint / build / regression spec |

## 3. Go / No-Go 判定基準

**Go 条件（全て満たすこと）:**

- Phase 9 QA チェックリストが全てチェック済み
- Phase 5 DoD が全てチェック済み
- Phase 11 manual test が PASS

**No-Go 条件（いずれか該当）:**

- `MagicLinkRateLimitedError` が `MagicLinkRequestError` の subclass でない（既存 catch 互換性破壊）
- 429 受信時に URL state が `error` / `sent` に遷移している
- 200 OK 経路に regression（既存 cooldown / state=sent 経路が壊れる）
- typecheck / lint / build いずれかが fail

## 4. ロールバック手順

1. `apps/web/app/login/_components/MagicLinkForm.client.tsx` の catch 内 `if (err instanceof MagicLinkRateLimitedError) { ... return; }` を削除（import も併せて削除）
2. `apps/web/src/lib/auth/magic-link-client.ts` の `MagicLinkRateLimitedError` export と 429 分岐ブロックを削除
3. 追加した spec 6 ケース（client 4 / form 2）を削除
4. `git revert <commit-sha>` で PR commit 一括巻き戻し

ロールバック後は Issue #275 以前の挙動（429 が `MagicLinkRequestError` 経由で URL `?state=error` に遷移し、cooldown が走らない）に戻る。API 側挙動は影響なし。
