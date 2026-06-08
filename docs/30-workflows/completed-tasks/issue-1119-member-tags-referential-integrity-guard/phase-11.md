# Phase 11 — 手動テスト（NON_VISUAL）

> **[実装区分: 実装仕様書]**（`implementation_mode: new`）。本タスクは **NON_VISUAL** であり、視覚的検証（スクリーンショット / visual baseline）は対象外。代替として自動テスト結果を主証跡とし、手動 curl 確認手順を user-gated の参考として記載する。

## 0. NON_VISUAL 宣言（冒頭・Feedback WEEKGRD-03）

- **タスク種別**: NON_VISUAL（backend repository read 関数 + admin read-only JSON endpoint のみ）。
- **非視覚的理由**: 追加成果物は D1 read 関数 2 つ（`detectOrphanMemberTags` / `countOrphanMemberTags`）・型 `OrphanMemberTag`・JSON を返す `GET /admin/tags/orphans` endpoint・テスト・fixture 健全性確認のみ。**レンダリングされる UI 画面・コンポーネント・CSS・色トークンを一切変更しない**ため、視覚回帰の対象が物理的に存在しない。
- **代替証跡**: 自動テスト（repository spec + contract spec）の green 結果を主証跡とする。endpoint の挙動は contract test の JSON shape アサーションで保証され、画面描画を介さない。

## 1. 実地操作不可の明記（Feedback BEFORE-QUIT-001）

本タスクは実装仕様書作成であり、実コードの commit / deploy はスコープ外（user-gated）。したがって **ローカル / staging での実地操作によるブラウザ手動テストは本 Phase の時点では実施できない**。実地操作の代替として、以下を記録する。

- **主代替記録**: 自動テスト結果（テスト名・件数・期待値）。
- **既知制限**: 実行時の D1 実データ（staging の実際の member_tags 行）に対する孤児検出は、staging deploy 後の curl 確認（§4・user-gated）でのみ観測可能。本 Phase では自動テストの seed データに対する検出結果までを証跡とする。

## 2. 証跡の主ソース（自動テスト名 / 件数）

`outputs/phase-11/manual-test-result.md` に、実行後の以下を記録する（実行は実装着地後・user-gated）。

| 主ソース | spec ファイル | カバーする AC | 主要テスト名（設計） |
|----------|---------------|---------------|----------------------|
| repository spec | `memberTags.orphan.repository.spec.ts` | AC-2 / AC-3 | `detectOrphanMemberTags` 孤児あり / なし / 混在（TC-R01〜R07）+ `assignTagsToMember` 未定義 tag skip（TC-R08） |
| tags contract spec | `tags.contract.spec.ts` | AC-6 | `GET /admin/tags/orphans` 孤児 0 件 / 孤児あり応答（TC-C01〜C03）+ issue-1070 409 ガード非破壊 |
| members contract spec | `members.contract.spec.ts` | AC-3 / AC-5 | 既存 fixture 健全性確認（`tag_a`/`tag_b` 定義済み・fixture 差分なし） |
| tagDefinitions write spec | `tagDefinitions.write.repository.spec.ts` | AC-4 / AC-7 | issue-1070 count guard 非破壊（既存ケース） |

> **件数記録方針**: 実行後、各 spec の pass 件数を focused vitest 実走で確定し本表に追記する（推測値を書かない）。

## 3. スクリーンショットを作らない理由（Feedback 4）

- **作らない**: `outputs/phase-11/screenshots/` ディレクトリ・`.gitkeep`・`screenshot-plan.json` を**作成しない**。
- **理由**: NON_VISUAL タスクで UI 描画変更がゼロのため、視覚証跡（screenshot / visual baseline）は意味を持たない。endpoint の返す JSON shape は contract test のアサーションで機械検証され、画面キャプチャより厳密かつ再現性が高い。空の screenshots ディレクトリや placeholder を残すことは「視覚検証をしたかのような誤誘導」になるため、意図的に作らない。

## 4. 手動 curl 確認手順（staging・user-gated・参考）

実装 deploy 後に endpoint を実地確認する場合の参考手順（**実行は user-gated**・本 Phase では実施しない）。

```bash
# 前提: staging に apps/api deploy 済み・admin 認証 token を取得済み
# 孤児検出 endpoint を read-only で叩く（副作用なし）
curl -s -H "Authorization: Bearer <ADMIN_TOKEN>" \
  "https://<staging-api-host>/admin/tags/orphans" | jq .

# 期待レスポンス（健全状態 = 孤児 0 件）:
# { "ok": true, "count": 0, "orphans": [] }
#
# 期待レスポンス（孤児あり）:
# { "ok": true, "count": N, "orphans": [
#     { "memberId": "...", "tagId": "...", "source": "...",
#       "assignedAt": "...", "assignedBy": "..." | null }, ... ] }
```

- **確認観点**: (1) `ok:true` / HTTP 200、(2) `count` と `orphans.length` の一致、(3) read-only ゆえ叩いても member_tags / tag_definitions が変化しないこと（再実行で同一結果）。
- **認証**: admin 認証は既存ミドルウェアが担保。未認証は既存の admin route と同じく拒否される。
- **副作用ゼロ**: COUNT / SELECT のみで write 副作用がないため staging 実行は安全（無料枠の軽量 read のみ）。

## 完了条件（Phase 11）

- [ ] 冒頭に NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / 代替証跡）を明記した（Feedback WEEKGRD-03）
- [ ] 実地操作不可を明記し、自動テスト結果 + 既知制限を代替記録とした（Feedback BEFORE-QUIT-001）
- [ ] 証跡の主ソース（自動テスト名 / 件数）を記載した
- [ ] スクリーンショットを作らない理由を明記し、screenshots/ ・.gitkeep ・screenshot-plan.json を作成しないことを確定した（Feedback 4）
- [ ] `GET /admin/tags/orphans` の手動 curl 確認手順（staging・user-gated）を参考記載した
- [ ] 出力: [outputs/phase-11/manual-test-result.md](outputs/phase-11/manual-test-result.md) / [outputs/phase-11/ui-sanity-visual-review.md](outputs/phase-11/ui-sanity-visual-review.md)
