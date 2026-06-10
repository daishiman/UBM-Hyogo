# Workflow Artifact Inventory — staging-test-accounts-full-data-and-detail-verify

## Summary

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/staging-test-accounts-full-data-and-detail-verify/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION`（visualEvidenceStatus = `staging_visual_pending_user_gate`・PNG 0） |
| purpose | `public-member-detail-survey-fields-richness`（`TEST-MEM-01` のみ）の continuation。10 テストアカウント全件に Google Form 31 stable_key の現実的ダミーを充填し、公開メンバー詳細 5 セクションを full / all-fields-with-blanks / edge の 3 表示パターンで検証する |
| 基盤 | `test-accounts-seed-spec`（catalog SSOT / build-seed-sql generator / 適用 CLI / drift guard contract spec）を再利用。基盤定義は変更しない |
| user gate | staging D1 seed apply、authenticated / staging screenshots（EV-01..08）、commit、push、PR |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/api/src/testing/test-accounts/catalog.ts` | per-member `profile` を TEST-MEM-01..10 全件へ拡充（フル / 全項目入力で一部空 / エッジ）。invalid な `ubmZone` を canonical enum へ補正 |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | `profile` を 31 `response_fields` 行へ展開し、`member_field_visibility`（public / member / admin）行を生成 |
| `apps/api/migrations/seed/test-accounts-seed.sql` | regenerated: 31 stable_key × 10 member の response_fields + visibility 行を反映 |
| `apps/api/migrations/seed/test-accounts-cleanup.sql` | regenerated: `member_field_visibility` cleanup を追加 |
| `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts` | profile key 網羅 / 非空 / canonical enum を検証 |
| `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | response_fields 行数 / visibility 行（public / member / admin）を検証 |
| `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` | byte drift / response_fields / visibility / escaped answer edge / cleanup 冪等を検証 |
| `apps/web/src/lib/adapters/member-detail.ts` | **gap fix（production 変更）**: `urlOthers`（free-text「その他 URL」）を `LINK_STABLE_KEYS` override で links セクションへ強制ルートし、`extractFirstUrl` で先頭 http(s) URL を抽出して `kind="url"` 描画 |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | detail public keys 保持 / URL link keys（urlOthers 含む）保持 / member/admin 非漏洩を検証 |
| `apps/web/src/fixtures/public-member-profile.ts` | URL リンク 10 件を含む richer public fixture（full / all-fields / edge 駆動） |

> `apps/api/migrations/seed/test-accounts.manifest.json` は本 wave で **再生成不要**（profile 拡充は response_fields / visibility 行のみ増やし、manifest の member / admin / meeting count は不変）。`git status` で実差分なしを確認済み。
> `apps/web/src/components/public/*.tsx` は **unchanged**（既存 5 セクションコンポーネントで全 public 項目が描画でき、追加の primitive / HEX を生やさない）。

## Evidence

| Evidence | Status |
| --- | --- |
| focused Vitest 5 files / 39 tests（catalog 5 / build-seed-sql 4 / member-detail 19 / contract 6 / issue-399 seed 5） | PASS |
| web typecheck | PASS |
| api typecheck | PASS |
| lint | PASS |
| Phase 11 authenticated / staging screenshots（EV-01..08） | pending_user_gate（PNG 0） |

## Invariants

新規 public API endpoint / API response contract / D1 schema / migration / Google Form schema / secret / 公開型は追加・変更しない（既存 surface のみ）。member/admin field（birthDate / ubmJoinDate / challenges / publicConsent / rulesConsent）はデータ投入するが `member_field_visibility` で公開 view へ出さない二重防御を維持。D1 直接アクセスは `apps/api` に閉じ、`apps/web` は `fetchPublicOrNotFound` 経由の API 取得のみ（不変条件 #5）。production seed apply は `scripts/seed-test-accounts.sh` の CLI guard で構造的に拒否。

## Lessons Learned

- **L-STAFDV-001（seed 拡充は catalog SSOT 1 箇所 → generator 再生成 → drift contract spec の 3 点で機械化）**: 10 member の中身を seed SQL へ直接手書きすると差分が膨大で誤りやすい。`catalog.ts` の per-member `profile` を唯一の編集点とし、`gen-test-accounts-seed.mjs` で `test-accounts-seed.sql` / `cleanup.sql` を再生成、`test-accounts-seed.contract.spec.ts` の byte 一致 assert で drift を強制する 3 点構成にすると、編集は catalog だけで済み生成物の正しさは contract spec が保証する。`public-member-detail-survey-fields-richness`（TEST-MEM-01 のみ）の同パターンを 10 member へ横展開した。
- **L-STAFDV-002（表示バリエーションは別 member に割当て 1 ページで網羅）**: 同じ「フル」会員を 10 人作っても表示検証の網羅性は上がらない。フル（01/06/07）/ 全項目入力で optional を一部空（09・`—` fallback と条件付き非表示の検証）/ エッジ（10・長文 wrap・絵文字 `🌊⚓️`・特殊文字 `%#&<>`・全 SNS URL）の 3 表示パターンを別 member へ割当てると、公開詳細ページを 1 巡するだけで「ふつう / 空欄あり / 極端」を一望できる。必須（fullName / location / occupation / ubmZone / ubmMembershipType / businessOverview）は全 member 必ず充填し、空にするのは optional のみとする。
- **L-STAFDV-003（free-text URL field は素の KIND_ROUTE で links に乗らない → override + extractFirstUrl の最小修正）**: 検証主体（verify_existing）の本タスクでも、`urlOthers`（free-text「その他 URL」例: `Podcast: https://...`）が adapter の `KIND_ROUTE` 素分類では links セクションへ乗らず SNS リンクとして描画されない gap を発見。`member-detail.ts` に `LINK_STABLE_KEYS`（`urlOthers`）override を足し、当該キーは routeKinds に依らず links へ強制ルートし、`extractFirstUrl`（`/https?:\/\/\S+/` の先頭一致）で free-text から URL を抽出して `kind="url"` で描画する最小差分で解消した。**教訓: 「表示検証だけで production adapter は unchanged」という事前想定は破れうる。free-text に URL を内包する field は KIND 分類とは別の link-override が要る**。Phase 12 system-spec-update-summary の `member-detail.ts: unchanged` 記述は実差分（14 行）と矛盾しており、`git diff` で実差分を取り直して訂正した。
- **L-STAFDV-004（fixture / seed データも値ドメインを canonical enum へ揃える）**: catalog の `ubmZone` に enum 外の値が混じると、表示・フィルタ側の enum 照合が滑る。`catalog.ts` の invalid `ubmZone` を canonical enum（`0_to_1` / `1_to_10` / `10_to_100` 等）へ補正し、`catalog.spec.ts` で canonical enum 所属を assert した。テストデータの値ドメイン一致は本番 sync 正規化（`ubm-normalize` 系）と同じ class の落とし穴。
- **L-STAFDV-005（member/admin field はデータ投入と公開非表示を `member_field_visibility` で両立）**: birthDate / ubmJoinDate / challenges / consent は「後で /profile・/admin で確認できるよう投入」しつつ「公開ページには絶対出さない」。`build-seed-sql.ts` が `member_field_visibility`（public / member / admin）行を生成し、`member-detail.ts` adapter の `visibility==="public"` 二重防御と合わせて、データ投入と公開非漏洩を構造的に両立する。adapter spec と contract spec の二重で member/admin 非漏洩を assert。
- **L-STAFDV-006（process: global skill sync は実装 landed 後の skill-sync wave で確定する延期方針）**: 本 workflow の spec wave（Phase 12 documentation-changelog）は「global skill sync は新規 I/F なし（Step 2 = N/A）かつ implemented_local で、コード landed と同一ターンで artifact inventory / ledger を確定するほうが drift を生まない」として task-workflow-active / quick-reference / resource-map / artifact-inventory を意図的に未着手のまま残した。本 skill-sync wave で初めて global sync（本 inventory 新規作成 + index 4 反映 + `indexes:rebuild`）を確定した。skill-sync 完了判定には `pnpm indexes:rebuild` の明示実行（topic-map / keywords 追従・冪等確認）が必須（L-PMDSR-006 と同型の頻出取りこぼし点）。
- **L-STAFDV-007（process: 生成物の再生成範囲は `git status` の実差分で確定する）**: Phase 12 summary は `test-accounts.manifest.json` を「regenerated」と列挙したが、profile 拡充は response_fields / visibility 行のみ増やし manifest の member / admin / meeting count は不変ゆえ実差分は出ていなかった。再生成スクリプトを流しても全生成物が変わるとは限らない。skill 反映時は doc の宣言でなく `git status --porcelain` の実差分セットを正本として artifact inventory を書く。
</content>
</invoke>
