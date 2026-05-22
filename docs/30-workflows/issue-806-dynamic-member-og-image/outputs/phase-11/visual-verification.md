# Phase 11 成果物: 視覚的検証 / 手動テスト

## 自動テスト

| ケース | 検証方法 | 結果 |
|---|---|---|
| TC-1 export shape | Vitest unit | ✓ PASS |
| TC-2 happy path (member 有) | Vitest unit | ✓ PASS |
| TC-3 404 path | Vitest unit | ✓ PASS |
| TC-4 error path | Vitest unit | ✓ PASS |

## 手動 / E2E（実行待ち）

以下は `pnpm --filter @ubm-hyogo/web dev` 起動 + API server 起動が前提のため、本サイクル内で curl 実機確認は環境セットアップ未整備により skip。Playwright spec は CI / staging deploy 時に実行される。

- AC-1: `curl -sI /members/<seeded-id>/opengraph-image` → 200 / `image/png`
- AC-2: HTML に `<meta property="og:image" content=".../members/<id>/opengraph-image">`
- AC-3: Playwright `public-metadata.spec.ts` の新規 3 ケース PASS
- AC-4: `/members/<nonexistent>/opengraph-image` → 404

## 視覚的検証ガイドライン (Apple UI/UX 視点)

実機確認時のチェックリスト:

- 1200×630 px 寸法が崩れていないか
- gradient（`#1e3a8a → #3b82f6`）が root OG と一致
- 氏名 96px / 肩書き 40px の階層が明確
- 余白 80×96px が左寄せで一貫
- 日本語フォント tofu（豆腐文字）が出ていないか → tofu 検出時はフォント埋め込み追加で同サイクル内修正

スクリーンショット画像はローカル / staging deploy 後に取得する。本仕様は build & unit test 段階のため image artifact なし。
