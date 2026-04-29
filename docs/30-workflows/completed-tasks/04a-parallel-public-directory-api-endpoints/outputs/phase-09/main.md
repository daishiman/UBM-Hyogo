# Phase 9 — 品質保証 main

## 結論

| 観点 | 結果 | 根拠 |
| --- | --- | --- |
| typecheck | PASS | `pnpm --filter @ubm-hyogo/api typecheck` exit 0 |
| unit / contract test | PASS (47 files / 253 tests, 8 new files / 36 new tests) | `pnpm --filter @ubm-hyogo/api test` |
| leak test | PASS | `public-member-profile-view.test.ts` で `responseEmail / rulesConsent / adminNotes` 4 ケース確認 |
| 不変条件 #1〜#14 | PASS | `ac-matrix.md` の trace 表に網羅 |
| 無料枠超過リスク | LOW | `free-tier-estimate.md` 参照 |

## 不変条件 traceability

- #1 schema 固定禁止: schema_questions を runtime 取得 (`get-form-preview.ts`)。
- #2 consent: `publicConsent` のみ参照、`isPublicStatus` で唯一性。
- #3 responseEmail system field: 検索対象に含めず、converter で runtime delete。
- #4 admin-managed 分離: `adminNotes` runtime delete。
- #5 apps/web → D1 直接禁止: 構造的に保証（apps/api 内のみ）。
- #10 無料枠: `limit` clamp 100、`Cache-Control: max-age=60` (stats / form-preview)。
- #11 admin-managed leak: 不適格 → 404、converter で fail close。
- #14 schema 集約: schema_versions / schema_questions のみ参照。

## 残リスク

- R-1 (leak): unit test で押さえているが、03a/03b 同期実装の変更で `member_status` 列名が変わると壊れる。今後の schema 変更時は `_shared/public-filter.ts` を真っ先に更新する旨を `implementation-guide.md` に記載。
- R-3 (Cache-Control): `no-store` を members / profile に強制しているが、Cloudflare の cache rules が override する可能性。Phase 11 の manual smoke で response header を `curl -I` 確認すること。
- R-7 (free-tier): `aggregatePublicZones / Memberships` は GROUP BY を 2 回発行。member 数 1k 規模では問題ないが、将来 stats KV cache 化を検討。

## 完了条件チェック

- [x] 不変条件 traceability。
- [x] free-tier-estimate.md 作成。
- [x] leak-test-report.md 作成。
- [x] 残リスクを Phase 10 へ引き継ぎ。
