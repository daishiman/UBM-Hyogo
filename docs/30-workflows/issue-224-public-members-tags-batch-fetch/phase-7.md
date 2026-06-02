# Phase 7: カバレッジ確認

> **Phase 種別**: カバレッジ計測・確認
> **対象 issue**: #224 公開 members list の tags 一括取得 N+1 防止
> **前提**: Phase 5 実装完了 + Phase 6 テスト拡充完了（全テスト green）
> **次フェーズ**: Phase 8 以降（リファクタ / ドキュメント / レビュー）

---

## 7.1 このフェーズのゴール

本 issue で**変更した関数・分岐に限定**して line / branch カバレッジを実測し、
N+1 防止ロジックと expand 正規化が漏れなくテストで踏まれていることを証跡として残す。

> カバレッジは「変更箇所の網羅」を目的とし、リポジトリ全体の数値目標は本 issue の DoD にしない。
> 既存の coverage-guard（`scripts/coverage-guard.sh`）の閾値は別レーンで担保する。

---

## 7.2 カバレッジ対象範囲（変更関数に限定）

| ファイル | 関数 / 箇所 | 検証すべき分岐 | 担保 TC |
|---------|-----------|--------------|---------|
| `apps/api/src/_shared/search-query-parser.ts` | `parsePublicMemberQuery` の `expand` 前処理（split / trim / whitelist filter / dedup） | ① `expandRaw` が array / string / undefined ② whitelist 一致 → 採用 ③ whitelist 外 → 除外 ④ 重複 → dedup ⑤ 空文字 → `[]` | TC-8〜TC-11 + 未指定 default |
| `apps/api/src/use-cases/public/list-public-members.ts` | `listPublicMembersUseCase` の `wantTags` 分岐 + groupBy | ① `wantTags=false` → batch 取得しない ② `wantTags=true && memberRows.length>0` → batch + groupBy ③ `wantTags=true && memberRows.length===0` → 呼ばない ④ `tagsByMember?.get(id) ?? []` の hit / miss 両方 | TC-1〜TC-5, TC-12, TC-13 |
| `apps/api/src/view-models/public/public-member-list-view.ts` | `PublicMemberListItemSource.tags` 素通し（型追加） | ① tags 有り item の通過 ② tags 無し item の通過 | TC-1, TC-4 |
| `packages/shared/src/zod/viewmodel.ts` | `PublicMemberTagZ` / `PublicMemberListItemZ.tags` optional | ① tags 有り item の parse ② tags 無し item の parse | TC-1, TC-4（contract 経由 parse） |

> ④（use-case の `?? []`）の miss 分岐は TC-3 の「m2 が tags 未登録（grouped に存在しない）→ 空配列」で踏む。
> Phase 4/6 の fixture で「tags 未登録 member を 1 件混ぜる」ことでこの miss 分岐を確実に踏む。
> 注: view-model の `toPublicMemberListView` 本体は無改変（型のみ追加）のため、新規分岐は use-case 側に集約される。

---

## 7.3 スコープ外（カバレッジ対象にしない）

| 箇所 | 理由 |
|------|------|
| `listFieldsByResponseId` per-member ループ（fields の N+1） | **本 issue スコープ外の別系統**。`current_response_id` キーの既存 N+1 であり、本 issue では増減させない。tags（`member_id`）とは別レーン。 |
| `listTagsByMemberIds`（repository helper） | **無改変**。既存テストで担保済み。本 issue では呼び出し側（use-case）の分岐のみ対象。 |
| `listPublicMembers` / `countPublicMembers` / `aggregateTopTags` | 無改変。visibility filter 本体は既存テスト担保。 |
| `public-d1.ts` mock の `member_id IN` 分岐 | テストヘルパ。プロダクトコードのカバレッジ対象に含めない（テスト基盤）。 |

---

## 7.4 カバレッジ実測コマンドと証跡方針

```bash
# api パッケージのカバレッジ（変更ファイルを include で絞る）
mise exec -- pnpm --filter @ubm-hyogo/api test --run --coverage \
  --coverage.include='src/_shared/search-query-parser.ts' \
  --coverage.include='src/use-cases/public/list-public-members.ts' \
  --coverage.include='src/view-models/public/public-member-list-view.ts'

# shared パッケージ（viewmodel zod）
mise exec -- pnpm --filter @ubm-hyogo/shared test --run --coverage \
  --coverage.include='src/zod/viewmodel.ts'
```

> `--coverage.include` glob は Vitest（v8 / istanbul provider）設定に依存する。
> プロジェクトの `vitest.config.ts` が CLI override を許すか確認し、不可なら一時的に config の `coverage.include` を
> 変更箇所へ絞って計測する（**commit はしない**）。`@vitest/coverage-v8` provider の導入有無も確認する。

### 証跡として残すもの

- 上記出力の **per-file line % / branch %** を Phase 7 の実行ログ（例: `outputs/phase-7/coverage.md`）に貼る。
- 変更 4 ファイルの **branch カバレッジが 7.2 表の全分岐を踏んでいる**こと（uncovered branch = 0）を確認する。
- 未踏分岐が残る場合は、その分岐に対応する TC を Phase 6 に戻って追加する（カバレッジ駆動の補完）。

---

## 7.5 期待カバレッジ（変更箇所）

- **line**: 変更 4 ファイルの追加行（expand 前処理 / wantTags 分岐 / groupBy / tags 型 / zod）を 100% 近傍で踏む。
- **branch**: 7.2 表の全分岐に対応 TC が存在し uncovered branch = 0 を目標とする。
  特に N+1 防止の核心である use-case の `wantTags` 三分岐（false / true+件数あり / true+0件）は必ず全て踏む。

---

## 7.6 入出力・副作用

- **入力**: Phase 4-6 の全テスト（green 前提）。
- **出力**: カバレッジレポート（per-file line/branch %）。
- **副作用**: 計測のみ。プロダクトコード変更なし（config を一時変更した場合は計測後に戻す＝commit しない）。

---

## 7.7 ローカル実行コマンド（CONST_005）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --run --coverage
mise exec -- pnpm --filter @ubm-hyogo/shared test --run --coverage
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 7.8 DoD（Definition of Done）

- [ ] 変更 4 ファイル（parser / use-case / view-model / shared zod）の line / branch カバレッジを実測した
- [ ] 7.2 表の全分岐が対応 TC で踏まれている（uncovered branch = 0）
- [ ] use-case の `wantTags` 三分岐（false / true+件数 / true+0件）が全て踏まれている
- [ ] fields の N+1（`current_response_id` 系）はスコープ外として明記し対象に含めていない
- [ ] `listTagsByMemberIds` helper / visibility filter 本体 / D1 mock は無改変またはテスト基盤としてカバレッジ対象外と明記した
- [ ] カバレッジ証跡を Phase 7 出力（例: `outputs/phase-7/coverage.md`）に残した
- [ ] `git status apps/ packages/` 確認（config を一時変更した場合も戻して clean）
