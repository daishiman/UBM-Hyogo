# Phase 9: QA

> **実装区分: 実装仕様書** — implemented_local_evidence_captured / VISUAL_ON_EXECUTION 段階の QA 観点（line budget / link / mirror parity / 品質ゲート）を定義する。

## 9.0 本タスクの QA 前提

- 本タスクは **implemented_local_evidence_captured**（実装ファイル追加済み・local runner evidence 取得済み）。staging mutation + baseline 生成 + cleanup は user-gated（index §3）。
- Phase 9 QA は **仕様書の整合性 QA（doc QA）** と、後続実装サイクルで満たすべき **品質ゲートの境界定義**に分かれる。
- apps/api・apps/web 本体ソース・D1 schema・Google Form の差分は無い（AC-8）。

---

## 9.1 doc QA（implemented_local_evidence_captured で今やる）

| 観点 | 内容 | 判定 |
| --- | --- | --- |
| line budget | 各 phase ファイル 50〜140 行程度。本仕様群は閾値内 | 目視 + `wc -l` |
| link 整合 | index.md の phase-6..9 リンクが実ファイルと一致 | リンク先存在確認 |
| canonical 名一致 | `bulk-tag-result-all-success.png` / `bulk-tag-result-partial-failure.png` が phase-6 / phase-8 / phase-11 / implementation-guide / artifacts `canonical_screenshots` で完全一致（AC-4） | 文字列 grep 照合 |
| snapshot 名前空間分離 | staging baseline が project 名前空間 `{arg}-authenticated-staging-visual-{platform}` に入り、親 local fixture（`issue1036-bulk-member-tags.spec.ts` の同名 png）と物理衝突しない（AC-4） | project 設定確認 |
| mirror parity | workflow root の `artifacts.json` と `outputs/artifacts.json` が byte 一致 | `diff` / md5 |
| セレクタ実在 | spec が使う locator が実コードに存在（`region "一括操作"` / `data-testid="admin-members-row-{id}"` / `bulk-tag-result` / `-counts` / `-skipped` / `-not-found`・apply ボタン `…を付与`） | apps/web grep 済み（Phase 1/3 確認） |
| 不変条件 | apps/api・apps/web 本体ソース・D1 schema・Form 非変更を宣言（AC-8） | スコープ宣言 |

---

## 9.2 削除確認（本タスクは新規追加のみ）

- **削除ファイルなし。** 本タスクは新規 spec / seed SQL / cleanup SQL / runner shell / runner shell test の **追加のみ**。
- 既存 `issue1036-bulk-member-tags.spec.ts`（local fixture）は **残置**（noop / tag_not_found / unassigned の視覚を継続担保するため削除しない・Phase 7 §7.2）。
- issue-1077 read-only spec も残置（picker 2 状態の担保）。

---

## 9.3 HEX 直書き 0 / OKLch トークン遵守

- screenshot 対象は **既存 BulkActionBar の result summary DOM**。新規スタイル・新規 CSS・新規トークンを一切追加しない（Phase 8 §8.4）。
- 新規追加ファイル（Playwright spec / SQL / shell）に色値は出現しない（`freezeAnimations` の content も animation/transition 抑止のみで色を含まない）。
- → **HEX 直書き 0 / OKLch トークン遵守は構造的に自明**（色を扱うコードを追加しないため `verify-design-tokens` gate に抵触しない）。

---

## 9.4 staging 副作用の品質ゲート確認

| ゲート | 確認内容 | 機械化手段 |
| --- | --- | --- |
| staging guard | production target 拒否 / 非 staging `CF_D1_DATABASE` 拒否 / staging allowlist 一致 / production 環境では実行しない（AC-7） | runner `assert_staging_guard` + shell test RT-SH-02/03/05/06 |
| cleanup 残存 0 | capture 後（成功/失敗/中断いずれも `trap ... EXIT`）に cleanup を実行し、`member_tags`/`audit_log`/`member_status`/`member_identities`/`member_responses`/`tag_definitions` の synthetic 残存件数 0 を検証（AC-5） | runner `cleanup` の `count_by_table` 0 検証 + shell test RT-SH-10（残存 fail path） |
| synthetic prefix 限定 | mutation / seed / cleanup の対象が `e2e_test_issue1125_` prefix のみ（共有 staging D1 の本番データに触れない） | seed/cleanup SQL の `WHERE ... LIKE 'e2e_test_issue1125_%'` + spec が synthetic memberId のみ選択 |
| redact ログ | 認証経路・URL・command・保存先・mutation 対象 ID・seed/cleanup 結果を `redact.sh` で秘匿化記録（AC-6） | runner の `log_redacted` / `redact.sh` + shell test RT-SH-08 |

---

## 9.5 検証コマンド

| コマンド | 目的 | 期待 | 境界 |
| --- | --- | --- | --- |
| `mise exec -- pnpm typecheck` | 新 spec の型整合（Playwright `Page` 型等） | exit 0 | local |
| `mise exec -- pnpm lint` | lint（spec 命名・shell 構造） | exit 0 | local |
| `bash scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` | guard / 引数 / cleanup の shell 検証（実 D1 非接続） | RT-SH-01..10 PASS | local |
| focused vitest（`BulkActionBar.spec.tsx`） | 機能本体の回帰（apps 非変更ゆえ無変更緑） | TC-BAB-TAG-01..05 + a11y PASS | local |
| `bash scripts/smoke/capture-bulk-tag-result.sh staging` | seed→実 mutation→baseline 生成→cleanup→残存 0 検証 | baseline 2 枚生成 + 残存 0 | **user-gated（staging 副作用）** |

> 認証付き staging runner だけが secret / baseline 更新 / staging D1 mutation を伴うため user-gated。local typecheck / lint / shell test / focused vitest は本 wave の検証対象。

---

## 9.6 完了条件（Phase 9）

- doc QA 観点（line budget / link / canonical / 名前空間分離 / mirror parity / セレクタ実在 / 不変条件）が定義されている
- 削除ファイルなし（新規追加のみ）が明記されている
- HEX 直書き 0 / OKLch トークン遵守（新規スタイルなし）が確認されている
- staging guard / cleanup 残存 0 / synthetic prefix 限定 / redact の品質ゲートが機械化手段付きで定義されている
- local 検証コマンドと user-gated（staging）境界が明記されている
