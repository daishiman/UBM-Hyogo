# Phase 4: テスト計画

## 4.1 本タスクのテスト戦略

本タスクは **既存コードに恒久的変更を加えない**ため、新規 unit test は追加しない。代わりに次の 3 種を「テスト」と位置づける:

1. **既存テストの非劣化** — `StatusDistribution.spec.tsx` および `dashboard-ui.spec.ts` が変わらず pass すること
2. **静的検査の非劣化** — typecheck / lint / build / grep-gate が pass すること
3. **手動視覚検査** — Phase 11 で撮影する PNG が AC-1〜AC-3 を満たすこと

## 4.2 自動テストコマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/features/admin/components/_dashboard/StatusDistribution.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/admin/dashboard-ui.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web build
```

各コマンドの期待:
- typecheck: 0 error
- lint: 0 error / 0 warning
- vitest: 全 assertion green（差分ゼロのため pre-existing 結果と同一）
- build: success

## 4.3 grep-gate

```bash
grep -nE 'fill="#|bg-\[#|text-\[#' apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx
# 期待: 0 hit
```

## 4.4 手動視覚検査チェックリスト

Phase 11 で次を目視確認:

- [ ] placeholder PNG: 「公開ステータス」ヘッダ + 「分布データは現在集計対象外です」が読める
- [ ] chart PNG: bar 3 本が `var(--ubm-color-ok)` 緑系 / `var(--ubm-color-info)` 青系 / `var(--ubm-color-warn)` 黄系の OKLch 色で描画されている
- [ ] chart PNG: 各 bar 上に数値 (12 / 7 / 3)、bar 下に label (公開 / 会員限定 / 非公開) が表示
- [ ] 両 PNG: 画面外の admin 画面情報 (実会員 PII 等) が写り込んでいない (個人情報の有無確認)

## 4.5 revert 検証

```bash
git status apps/web/ apps/api/
# 期待: nothing to commit (working tree clean within these paths)

git diff --stat apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx
# 期待: 0 lines changed
```

## 4.6 Definition of Done

artifacts.json の dod_commands を全て実行して green、かつ AC-1〜AC-8 を全て満たすこと。
## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

runtime screenshot 取得後に実行する検証コマンドと期待結果を固定する。

## 実行タスク

- typecheck、lint、focused test、build、grep-gate、git status の実行順を定義する。
- PNG dimension / size の確認方法を定義する。

## 参照資料

- `phase-11-manual-test.md`
- `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx`
- `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx`

## 成果物

- テスト計画
- 検証コマンド一覧

## 完了条件

Phase 11 で保存すべき log と PNG 確認が明確である。

- [ ] Phase 11 で保存する log、PNG、git status の確認項目が列挙されている

## 統合テスト連携

Phase 11 で本 Phase のコマンドを log として保存する。
