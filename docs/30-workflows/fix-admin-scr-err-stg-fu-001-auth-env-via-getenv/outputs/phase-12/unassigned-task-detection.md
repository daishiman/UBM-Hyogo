# Unassigned Task Detection

[実装区分: 実装仕様書]

> 0 件でも出力必須。CONST_005 により、今回サイクル内で完了可能な同型改善は未タスク化しない。

## Summary

未タスク 0 件。初期仕様では `apps/web/src/lib/fetch/public.ts` の env 直接参照を follow-up 候補としていたが、
同サイクルで `getPublicFetchEnv()` 経由へ統一し、focused regression も PASS したため新規起票を撤回する。

## Current

| 候補 ID | 検出元 | 判定 | 理由 |
| --- | --- | --- | --- |
| `fetch-public-env-via-env-module` | 初期仕様の scope 外候補 | 完了・起票しない | `apps/web/src/lib/fetch/public.ts` は `getPublicFetchEnv()` 経由へ統一済み。`grep -nE "process\\.env|getCloudflareContext" apps/web/src/lib/fetch/public.ts` は 0 件。`fetch/public.spec.ts` 18 tests PASS。 |

## Baseline

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 新規 OAuth provider 追加 / Auth.js バージョンアップ | 起票しない | 本タスクの env 整流化と無関係 |
| `apps/api` 側の env 参照経路 | 起票しない | 本タスクは `apps/web` env boundary 限定 |
| `requestEnv()`（x-ubm-* header）/ `globalEnv()` 廃止 | 起票しない | process.env/cloudflare 非依存。挙動保持が正 |

## 結論

今回検出した改善点はすべて同サイクル内で完了。バックログ送り・別 PR 化・TODO コメント残しは 0 件。
