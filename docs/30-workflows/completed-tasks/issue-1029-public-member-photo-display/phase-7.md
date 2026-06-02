# Phase 7: カバレッジ確認

> **[実装区分: 実装仕様書]**。本 Phase は本 task で変更した関数 / ブロックに限定してカバレッジを実測する。

## メタ情報

- workflow_state: `implemented_local_runtime_pending` / taskType: `implementation`
- カバレッジ対象範囲: **本 task で新規追加 / 変更したファイルとブロックのみ**（[Feedback BEFORE-QUIT-002]）。リポジトリ全体一律のカバレッジ閾値は本 Phase の判定基準にしない。

## 目的

Phase 5 で追加 / 変更した関数とブロック（`listMemberPhotosByIds` / route resolver / use-case の photoUrl 分岐 / Avatar src 配線）の line / branch カバレッジを実測し、Phase 4/6 のテストが各分岐を踏んでいることを証跡として残す。

## カバレッジ対象（変更ブロックに限定）

| 対象シンボル / ブロック | ファイル | 必須カバレッジ |
|------------------------|---------|---------------|
| `listMemberPhotosByIds`（空配列 / 複数 / results undefined 分岐） | `apps/api/src/repository/memberPhotos.ts` | line 100% / branch 100%（空配列 return / `results ?? []`） |
| list route `resolvePhotoUrls`（secret 分岐 / bucket prod・staging / presign null 除外 / batch） | `apps/api/src/routes/public/members.ts` | branch: secret 未設定 / `MEMBER_PHOTOS` null / prod / staging / presign null・成功 を全て踏む |
| profile route `resolvePhotoUrl`（secret 分岐 / photo null / bucket / presign null） | `apps/api/src/routes/public/member-profile.ts` | branch: secret 未設定 / photo null / bucket null / presign null・成功 を全て踏む |
| list use-case photoUrl 注入分岐（resolver 注入有無 / try-catch fail-soft） | `apps/api/src/use-cases/public/list-public-members.ts` | branch: resolver 有 / 無 / throw catch を踏む |
| profile use-case photoUrl 注入分岐（resolver 注入有無 / try-catch / gate 不通過で未呼び出し） | `apps/api/src/use-cases/public/get-public-member-profile.ts` | branch: resolver 有 / 無 / throw catch / gate 不通過 を踏む |
| view-model photoUrl mapping（list / profile） | `public-member-list-view.ts` / `public-member-profile-view.ts` | line: photoUrl mapping 行を踏む |
| MemberCard Avatar src 配線（comfy / dense / list） | `apps/web/src/components/public/MemberCard.tsx` | branch: photoUrl 有（img）/ 無（hue）を各 density で踏む |
| ProfileHero Avatar src 配線 | `apps/web/src/components/public/ProfileHero.tsx` | branch: photoUrl 有 / 無 を踏む |

> 上記以外の既存コード（公開 gate repo / summary 取得 / Avatar internal `imgFailed` 既存ロジック）は本 task の変更対象外のため、本 Phase のカバレッジ判定に含めない。

## カバレッジ実測コマンド（変更 package 単位）

```bash
# api: repository batch / route resolver / use-case 分岐
mise exec -- pnpm --filter @ubm-hyogo/api test -- --coverage

# shared: schema photoUrl parse / reject 分岐
mise exec -- pnpm --filter @ubm-hyogo/shared test -- --coverage

# web: MemberCard / ProfileHero の src 分岐
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage
```

> vitest の coverage 設定（provider / reporter）は各 package の `vitest.config.*` に従う。本 Phase では coverage reporter 出力から上記対象ファイルの line / branch を抜き出して証跡に残す（全ファイル一律の閾値 fail で判定しない）。

## 実行タスク

- 上記コマンドで coverage を取得する。
- 「カバレッジ対象」表の各シンボルについて、line / branch カバレッジ実測値を記録する。
- 未踏 branch がある場合、Phase 4/6 のどのケースで踏むべきかを特定し、不足ケースを Phase 6 lane へ追記する（テスト追加で埋める。閾値緩和では埋めない）。
- 証跡を `outputs/phase-7/coverage-changed-blocks.md` に変更ブロック限定で記録する。

## 証跡の残し方（変更ブロック限定）

`outputs/phase-7/coverage-changed-blocks.md` に以下の表を記録する。

| シンボル | line % | branch % | 未踏 branch | 充足判定 |
|---------|--------|----------|------------|---------|
| `listMemberPhotosByIds` | 実測値 | 実測値 | なし / あり | OK / 不足 |
| list route resolver | 実測値 | 実測値 | ... | ... |
| profile route resolver | 実測値 | 実測値 | ... | ... |
| list use-case photoUrl 分岐 | 実測値 | 実測値 | ... | ... |
| profile use-case photoUrl 分岐 | 実測値 | 実測値 | ... | ... |
| MemberCard src 分岐 | 実測値 | 実測値 | ... | ... |
| ProfileHero src 分岐 | 実測値 | 実測値 | ... | ... |

> 全体一律のカバレッジ数値は記録しない。本 task のスコープ外コードの未カバレッジを本 Phase の fail 条件にしない（[Feedback BEFORE-QUIT-002]）。

## 参照資料

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| architecture | `.claude/skills/aiworkflow-requirements/references/architecture-*.md` | layer 境界（カバレッジ対象の責務確認） |

- `index.md` / `phase-4.md`（lane A-F）/ `phase-5.md`（変更ファイル一覧）/ `phase-6.md`（lane G-J）
- `.claude/skills/task-specification-creator/SKILL.md`

## 成果物

- Phase 7 カバレッジ確認方針（本ファイル）
- `outputs/phase-7/coverage-changed-blocks.md`（変更ブロック限定のカバレッジ証跡・本実装サイクルで生成）

## 完了条件

- [ ] カバレッジ対象が本 task の変更ファイル / ブロックに限定明記されている（[Feedback BEFORE-QUIT-002]）
- [ ] `listMemberPhotosByIds` の空配列 / 複数 / results undefined 分岐が全て踏まれている
- [ ] route resolver の secret 未設定 / bucket prod・staging / presign null・成功 の分岐が全て踏まれている
- [ ] use-case の resolver 有 / 無 / throw catch / gate 不通過 の分岐が全て踏まれている
- [ ] MemberCard（comfy/dense/list）/ ProfileHero の photoUrl 有 / 無 分岐が踏まれている
- [ ] 未踏 branch があればテスト追加（Phase 6 lane）で埋め、閾値緩和で埋めていない
- [ ] 証跡が変更ブロック限定で `outputs/phase-7/coverage-changed-blocks.md` に記録されている

## 統合テスト連携

本 Phase の未踏 branch 検出が Phase 6 のテスト追加へフィードバックされる。カバレッジ充足が Phase 9 品質保証（grep gate + 全 test PASS）の前提になる。
