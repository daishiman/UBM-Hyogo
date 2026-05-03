# ci.yml diff design（適用待ち / strict 0 violations 後にのみ適用）

## 配置位置

既存 `ci` job 内、`pnpm lint` step（`Lint` step）直後に挿入する。新 job は作らない（required status context `ci` を維持するため）。

## 追加 step（pseudo-diff）

```yaml
       - name: Lint
         run: pnpm lint

+      - name: Lint stableKey strict
+        run: pnpm lint:stablekey:strict
```

設計判断:

- `continue-on-error` は付けない（blocking gate）。
- `if:` ガードは不要。`ci` job は従来通り全 PR に対して必須実行される。
- 既存 step 直後に置くことで lint 系を視覚的にまとめ、レビュー性を確保。
- 新 job 化しない: 新 context 名 drift / branch protection PUT が発生し scope out に抵触するため。

## 命名

step 名は `Lint stableKey strict`（既存 `Lint` と区別、スネークでなくケバブケースは ci.yml 規約に未定義のため自然言語で統一）。

## rollback 方針

問題発生時は当該 step を一時的に削除して revert PR を出す（required context 名は変更しない）。

## 適用前提

`pnpm lint:stablekey:strict` が exit 0 / 0 violations であることを Phase 11 evidence で証明できていること。本サイクルでは未達のため適用しない。
