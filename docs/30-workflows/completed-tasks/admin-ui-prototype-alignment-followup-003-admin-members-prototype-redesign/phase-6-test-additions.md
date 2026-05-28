# Phase 6 — テスト拡充

[実装区分: 実装仕様書]

## 1. 拡充対象

Phase 4 で列挙した T-01〜T-10 / P-01..P-02 / C-01 の **fail path + regression** を補強する。

| # | 既存 | 追加ケース |
| --- | --- | --- |
| T-04 | 楽観更新 + rollback | (d) mutation in-flight 中の再 click を ignore (idempotency); (e) `onSuccess` callback が呼ばれること |
| T-08 | 行クリック / checkbox | (e) ヘッダ checkbox で全行選択; (f) 1 件だけ選択時の `selected.size === 1` 表示 |
| T-09 | drawer 4セクション構成 | (e) detail fetch error 時の error message DOM; (f) 復元ボタンの `confirm` キャンセル時に mutation 呼ばれない |
| T-10 | URL 同期 | (d) q + filter + sort 同時変更 → URL 一括更新; (e) router.refresh が Switch 成功時に呼ばれる |
| P-01 | 4 state × 4 viewport | (additional) keyboard focus ring screenshot (Tab で Switch にフォーカス) 1 枚 |
| C-01 | unauth → 401 | (additional) admin user で 200 / non-admin user で 403 が返る |

## 2. a11y 拡充

drawer-open state で:
- focus trap (`Tab` で drawer 外要素に出ない)
- `Esc` で close
- `role="dialog"` + `aria-modal="true"` 確認

`@testing-library/user-event` を使い keyboard scenario を Test。

## 3. mutation regression

`useAdminMutation` mock を用い、`PATCH /admin/members/:id/status` の body が `{ publishState: "public" | "hidden" }` であることを assert（プロパティ名 drift を防止）。

## 4. coverage / fail-on-coverage

新規 6 component + 1 util の branch coverage 80% を目標。`vitest.config.ts` の coverage threshold は既存設定を維持し、`--coverage --reporter=text` で確認。
