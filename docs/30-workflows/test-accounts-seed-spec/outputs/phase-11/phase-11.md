# Phase 11 — 手動テスト（NON_VISUAL）

## 0. NON_VISUAL 宣言

| 項目 | 値 |
|------|-----|
| タスク種別 | implementation / seed（テストアカウント seed 生成基盤） |
| visualEvidence | **NON_VISUAL** |
| 非視覚的である理由 | UI / UX を一切変更しない。追加するのは D1 seed データ（catalog → SQL/manifest 生成物）と生成/適用スクリプト、E2E ログイン補助のみで、ユーザー向け画面・導線・スタイルを持たない |
| 代替証跡 | 本 wave での自動テスト（catalog 不変条件 / build 出力 / drift guard / in-memory D1 投入後のゲーティング期待値）。スクリーンショットは取得しない |

> 本タスクは画面描画を伴わないため、Playwright 等によるスクリーンショット evidence は作成しない。証跡は §3 の自動テスト群が主ソースとなる（詳細は `manual-test-result.md`）。

---

## 1. 実地操作（手動 UI 操作）

**実施不可。**

理由: 本タスクは画面要素・遷移を追加/変更しないため、ブラウザでの「クリックして遷移を確認する」種類の手動テストが存在しない。代わりに、seed 投入後の D1 状態（ログインゲート 7/3、公開掲載 5）を **自動テストで検証**する。seed の実 D1 投入（local/staging）と E2E ログイン mint は副作用を伴うため user-gated（§4）。

---

## 2. 代替検証（自動テスト）一覧

| ID | 検証内容 | 検証手段 | 対応 AC |
|----|----------|----------|---------|
| V1 | catalog の件数・ID 一意・ゲーティング派生件数 | `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts` | AC-1, AC-2, AC-3 |
| V2 | 生成 SQL 構造（トランザクション境界・冪等動詞のみ）・manifest shape | `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | AC-4, AC-8 |
| V3 | committed 生成物との byte 一致（drift guard） | `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts`（再生成 `===` 比較） | AC-7 |
| V4 | in-memory D1 へ seed 2 回適用で件数不変（冪等） | 同上（setupD1 + `vitest.d1.config.ts`） | AC-5 |
| V5 | cleanup 後に対象 10 テーブル 0 件 | 同上 | AC-6 |
| V6 | 公開掲載 5 件の `response_fields` に `fullName` 存在 | 同上 | AC-9 |
| V7 | 型・lint クリーン | `mise exec -- pnpm typecheck` / `pnpm lint` | AC-1, — |

---

## 3. 既知制限（user-gated）

| 制限 | 内容 | 扱い |
|------|------|------|
| seed 実投入 | `scripts/seed-test-accounts.sh --env local` / `--env staging` による実 D1 投入・撤去は副作用を伴う | 実行は user-gated。production は構造的に拒否（AC-10）で実投入対象外 |
| staging mint | `mint-test-account-storage-state.ts` による storage-state 生成は `STAGING_AUTH_SECRET` 等の env と staging 環境を要する | env 配線・実行は user-gated（Phase 10 MINOR-2） |
| 写真バイナリ | member_photos のメタデータ行のみ投入。R2 実体は未投入 | 別関心（index.md「含まない」）。写真描画 e2e は別タスク |

---

## 4. 完了条件

- §2 の自動テスト V1〜V7 が本 wave で全 PASS。
- スクリーンショット evidence は作成しない（NON_VISUAL 宣言に基づく）。
- seed 実投入・staging mint は user-gated として手順のみ確定し、本タスクでは実行しない。
