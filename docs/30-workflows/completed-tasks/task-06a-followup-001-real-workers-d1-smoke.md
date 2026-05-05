## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-06a-followup-001-real-workers-d1-smoke |
| タスク名 | 06a public web real Workers/D1 smoke |
| 分類 | 検証 / E2E smoke |
| 対象機能 | `/`, `/members`, `/members/[id]`, `/register` |
| 優先度 | 高 |
| ステータス | 昇格済み（canonical: `docs/30-workflows/06a-followup-001-public-web-real-workers-d1-smoke/`） |
| 発見元 | 06a Phase 12 再検証 |
| 発見日 | 2026-04-29 |

---

## 昇格状態

本未タスクは `docs/30-workflows/06a-followup-001-public-web-real-workers-d1-smoke/` の Phase 1-13 仕様書へ昇格済み。以後の実行・evidence 保存・Phase 12/13 close-out は canonical task path 側で管理し、本ファイルは発見元の履歴として残す。

## 苦戦箇所【記入必須】

`pnpm --filter @ubm-hyogo/api dev` が `Cannot start service: Host version "0.27.3" does not match binary version "0.21.5"` で失敗し、04a public API 実体 + D1 binding を使った local smoke が実施できなかった。06a では local mock API で UI route の curl / screenshot smoke まで確認済み。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| mock response では D1 / Workers runtime / wrangler binding の問題を検出できない | wrangler mismatch 解消後に local D1 smoke を再実施する |
| staging で `PUBLIC_API_BASE_URL` が未設定だと web が localhost:8787 に向く | staging vars を確認し、`/` と `/members` の 200 を smoke gate に入れる |

## 検証方法

- `pnpm --filter @ubm-hyogo/api dev`
- `PUBLIC_API_BASE_URL=http://localhost:8787 pnpm --filter @ubm-hyogo/web dev`
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`
- `curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/members?q=hello&zone=0_to_1&density=dense"`
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/members/UNKNOWN`
- staging deploy 後に同等 URL を確認し、スクリーンショットを保存する。

## スコープ（含む/含まない）

含む:
- 04a public API 実体 + D1 binding を使った local smoke
- staging smoke
- Phase 11 evidence への追記

含まない:
- 06a UI の追加機能実装
- 04a API contract の変更
