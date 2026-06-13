# Phase 6: テスト追加

[実装区分: 実装仕様書]

> SSOT: [shared-context.md](./shared-context.md)。Phase 4 の基本ケースに対し、fail path / 境界 / 回帰 guard を上乗せする。新規 test ファイルは `*.spec.{ts,tsx}` のみ（不変条件 / CLAUDE.md #8）。

## 目的

Phase 4 が AC ごとの正常系 + 主要分岐を固定するのに対し、Phase 6 は異常入力・境界・回帰 guard を上乗せして堅牢性を担保する。特に `generateTagCode` の null/undefined/巨大入力での fallback、用語集の未登録 key、`TagManagementGuide` の不正 variant fallback、フォームの上書き境界、既存 spec の DOM contract 非破壊を、Phase 4 と同一 wave 内で GREEN にする。

## 実行タスク

- `tagCodeAutogen.spec.ts` に異常入力・巨大入力・カナ畳み込み境界・パターン不変 guard を追加する（§2）。
- `tagManagementGlossary.spec.ts` に未登録 key・空 key・データ件数固定 guard を追加する（§3）。
- `TagManagementGuide.component.spec.tsx` に不正 variant・className 合成・相互リンク排他 guard を追加する（§4）。
- `TagDefinitionCreateForm.component.spec.tsx` に上書き境界・連続入力・送信値 guard を追加する（§5）。
- 既存テスト（`TagDefinitionPanel.component.spec.tsx` 等）の非破壊確認手順を記す（§6）。
- 回帰サマリと実行コマンドを記す（§7 / §8）。

## 参照資料

- [shared-context.md](./shared-context.md)（§6 アルゴリズム / §8 AC）
- [phase-4-test-plan.md](./phase-4-test-plan.md)（正常系 TC・AC → TC マッピング）
- [phase-5-implementation.md](./phase-5-implementation.md)（実装手順・fallback 仕様）

## 成果物

- 本 phase ドキュメント（`phase-6-test-additions.md`）= fail path / 境界 / 回帰 guard 追加計画の正本。
- Phase 4 §2 と同一の 4 spec ファイルへの追記 TC（新規ファイルは作らない）:
  - `tagCodeAutogen.spec.ts` 追記（§2 TC-G-NULL / HUGE / KANA / PAT-GUARD 群）
  - `tagManagementGlossary.spec.ts` 追記（§3 TC-GL-MISS / COUNT / DESC 群）
  - `TagManagementGuide.component.spec.tsx` 追記（§4 TC-D-INVALID / CLASS / LINK-EXCL 群）
  - `TagDefinitionCreateForm.component.spec.tsx` 追記（§5 TC-F-DIRTY-BOUND / NOREGRESS 群）
- 回帰サマリ表（§7）と既存 spec 非破壊確認手順（§6）。

## 1. 位置づけ

Phase 4 が「正常系 + 主要分岐」を固定するのに対し、Phase 6 は以下を上乗せする:

- **fail path**: null / undefined / 巨大入力 / 未登録 key / 不正 variant 時の安全な振る舞い（throw しない・fallback する）。
- **回帰 guard**: `generateTagCode` が常に `TAG_CODE_PATTERN` を満たす不変条件、コード手動上書きが二度と自動上書きされない不変条件。
- **補助ケース**: カナ畳み込み境界・データ件数固定・既存 DOM contract 非破壊。

追加先は Phase 4 §2 と同一の 4 spec ファイル（新規ファイルは作らない）。

---

## 2. `tagCodeAutogen.spec.ts` 追記（C1・fail path / 不変 guard）

| TC-ID | 観点 | 入力 | 期待結果 |
|-------|------|------|----------|
| TC-G-NULL-01 | null / undefined を吸収（throw しない・ステップ 1） | `generateTagCode(null as unknown as string)` / `generateTagCode(undefined as unknown as string)` | throw せず fallback `tag_…` を返す。`TAG_CODE_PATTERN` 一致 |
| TC-G-HUGE-01 | 巨大入力でも 64 文字以内（ステップ 6） | `"あ".repeat(500)` // length: 500（ローマ字化後さらに長い） | 戻り値 `.length <= 64`、末尾 `_` 無し、`TAG_CODE_PATTERN` 一致。throw しない |
| TC-G-HUGE-02 | ASCII 巨大入力の切り詰め | `"x".repeat(1000)` // length: 1000 | `.length <= 64`、`TAG_CODE_PATTERN` 一致 |
| TC-G-KANA-01 | 濁音 / 半濁音のローマ字化（ステップ 3 境界） | `"ぱぴぷぺぽ"` // length: 5 | `KANA_ROMAJI_MAP` 経由で `[a-z]` のみの slug。`TAG_CODE_PATTERN` 一致 |
| TC-G-KANA-02 | 長音「ー」のスキップ（ステップ 3） | `"コーヒー"` // length: 4 | 長音が無視され `[a-z0-9_]` のみ。`TAG_CODE_PATTERN` 一致。throw しない |
| TC-G-MIX-01 | 漢字 + ひらがな混在（部分マッピング） | `"神戸のたぐ"` // length: 5 | 漢字スキップ + ひらがなローマ字化で `[a-z0-9_]` slug（空にならず fallback 不要 or 妥当な slug）。`TAG_CODE_PATTERN` 一致 |
| TC-G-PAT-GUARD-01 | **全分岐でパターン不変（網羅 guard）** | TC-G-01〜12 + 本 §の全入力を配列で回す `it.each` | すべての入力で `TAG_CODE_PATTERN.test(generateTagCode(input)) === true`。AC-3「常に一致」の恒久 guard |
| TC-G-PURE-01 | 純関数性（入力非変異・副作用なし） | 同一 string を 2 回呼ぶ | 2 回の戻り値が厳密一致。入力に副作用が無い |
| TC-G-MAP-GUARD-01 | `KANA_ROMAJI_MAP` の健全性 | `Object.values(KANA_ROMAJI_MAP)` | すべて `/^[a-z]+$/` に一致（マッピング値が code パターンを汚さない） |

---

## 3. `tagManagementGlossary.spec.ts` 追記（C3・fail path / 件数固定）

| TC-ID | 観点 | 入力 / 操作 | 期待結果 |
|-------|------|------------|----------|
| TC-GL-MISS-01 | 未登録 key で undefined（throw しない） | `getTagTerm("does-not-exist")` | `undefined`。throw しない |
| TC-GL-MISS-02 | 空文字 / 異常 key | `getTagTerm("")` | `undefined`。throw しない |
| TC-GL-COUNT-01 | **必須 8 キーの件数固定（将来欠落検出）** | `TAG_MANAGEMENT_GLOSSARY` のキー集合 | 必須 8 キーが**すべて含まれる**（件数が 8 未満にならない）。意図せぬキー削除を検出 |
| TC-GL-DESC-01 | description の非空・平易性 guard | 全エントリ | `description` が非空かつ「tag master API」等の技術語を含まない（非エンジニア向け文言の回帰固定） |

---

## 4. `TagManagementGuide.component.spec.tsx` 追記（C3・fail path / 排他 guard）

| TC-ID | 観点 | 入力 / 操作 | 期待結果 |
|-------|------|------------|----------|
| TC-D-INVALID-01 | 不正 variant の安全 fallback | `variant={"unknown" as TagManagementGuideProps["variant"]}` で render | throw せずに render される（既定では定義 / 割当いずれかへフォールバック、または空相互リンクで安全に描画）。アプリがクラッシュしない |
| TC-D-CLASS-01 | `className` 合成 | `variant="definition" className="extra-class"` | root 要素の `className` に `extra-class` が含まれる（外側 wrapper への合成が効く） |
| TC-D-LINK-EXCL-01 | **相互リンクの排他性 guard** | definition / assignment を別々に render | definition は `/admin/tags` のみ・`/admin/tag-master` を指さない。assignment はその逆。両方向リンクが同時に出ない（誘導の一貫性） |
| TC-D-TERM-SRC-01 | 文言が用語集 SSOT 由来 | render（definition） | 描画テキストが `getTagTerm("tag-definition")?.description` 等の用語集値と一致（ハードコード重複でなく SSOT 参照であることの回帰） |

---

## 5. `TagDefinitionCreateForm.component.spec.tsx` 追記（C1/C4・境界 / 送信 guard）

| TC-ID | 観点 / Lane | 入力 / 操作 | 期待結果 |
|-------|------------|-------------|----------|
| TC-F-DIRTY-BOUND-01 | **上書き停止の恒久 guard** | コード手動編集 → 表示名を**複数回**変更 | コード `value` が手動値のまま一度も自動上書きされない（`codeDirty` の単方向性。一度 dirty になったら戻らない） |
| TC-F-DIRTY-BOUND-02 | コードを空に手動編集した後の挙動 | 自動補完後コード欄を空文字に手動クリア → 表示名変更 | コード `value` は空のまま（手動編集＝空も dirty 扱い・自動補完が復活しない）。フォーム側 validation は既存挙動を維持 |
| TC-F-AUTO-EMPTY-01 | 漢字のみ表示名で fallback コード | 表示名 `"神戸支部"` // length: 4 を入力（コード未編集） | コード `value` が fallback `tag_…`（`generateTagCode` 経由）になり、空にならない。`TAG_CODE_PATTERN` を満たす値 |
| TC-F-SUBMIT-DIRTY-01 | 手動上書き値が送信される（外部 props） | コード手動編集後 submit | モック `createTag` に渡る `code` が手動上書き値と一致（自動値で上書きされない） |
| TC-F-NOREGRESS-01 | カテゴリ等 既存フィールドの送信 shape 不変 | 全フィールド入力 → submit | `createTag` ペイロードが既存 shape（`code` / `label` / `category` 等）のまま。自動補完追加でキーが増減しない（AC-12） |

---

## 6. 既存テスト非破壊の確認手順（AC-12）

ガイド / ヒント / 自動補完は **追加のみ** で、既存の testid / role / aria / 送信 shape を変えない。実装後に以下を確認する:

- `apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx`（既存）を focused 実行し PASS を確認（`TagDefinitionCreateForm` 変更がパネルテストを壊さない）。
- 既存タグ管理 spec（`TagQueuePanel` / `TagsQueueResolveDrawer` 系がある場合）を実行し、page 冒頭ガイド挿入が割当ロジックテストを壊さないことを確認。
- `apps/api` のタグ系テスト（**本タスク非接触**）は無変更で PASS（`git diff origin/dev...HEAD -- apps/api` が空であることが前提）。
- 同一 wave で Phase 4 + Phase 6 の全 TC を GREEN にし、既存 spec も含めて web スイートが回帰しないことを確認する。

## 7. 回帰サマリ（このタスク固有の guard）

| guard | 守る対象 | TC |
|-------|----------|----|
| `generateTagCode` が常に `TAG_CODE_PATTERN` 一致 | コード自動生成の不正値混入防止（AC-3） | TC-G-PAT-GUARD-01 / TC-G-NULL-01 / TC-G-HUGE-01/02 |
| 64 文字切り詰め | 巨大表示名でも API パターン違反しない | TC-G-HUGE-01/02 |
| 手動上書きの単方向性 | `codeDirty` が一度立ったら戻らない（AC-2） | TC-F-DIRTY-BOUND-01/02 / TC-F-SUBMIT-DIRTY-01 |
| 用語集件数・SSOT 参照 | ガイド / フォーム文言のドリフト防止（AC-8/9） | TC-GL-COUNT-01 / TC-GL-DESC-01 / TC-D-TERM-SRC-01 |
| 相互リンク排他 | 2 画面誘導の一貫性（AC-6/7） | TC-D-LINK-EXCL-01 / TC-D-INVALID-01 |
| 送信 shape 不変 | 既存 API 結合の非破壊（AC-12） | TC-F-NOREGRESS-01 |

## 8. 実行コマンド（Phase 4 と同一・SSOT §11）

```bash
mise exec -- pnpm --filter web exec vitest run \
  src/lib/admin/__tests__/tagCodeAutogen.spec.ts \
  src/lib/admin/__tests__/tagManagementGlossary.spec.ts \
  src/components/admin/__tests__/TagManagementGuide.component.spec.tsx \
  src/components/admin/__tests__/TagDefinitionCreateForm.component.spec.tsx
```

> 全 TC（Phase 4 + Phase 6）が GREEN で AC-1〜AC-4 / AC-6〜AC-9 / AC-11〜AC-12 を満たす。commit / PR は Phase 13（user-gated）。

## 統合テスト連携

- Phase 6 の fail path / 境界 / 回帰 guard は Phase 4 の正常系と同一 wave 内で GREEN にし、機能（自動生成）・情報設計（ガイド・用語集）・命名・既存非破壊を統合的に検証する。
- 新規の E2E / API 結合は追加しない（API 非接触・SSOT §7）。既存 web スイート全体の非回帰（§6）をもって統合整合とする。
- 実装後の最終確認は SSOT §11 の `typecheck` / `lint` / focused vitest / `verify:tokens` / `git diff -- apps/api` 空を一括実行する。

## 完了条件

- [ ] `tagCodeAutogen.spec.ts` に null/undefined/巨大入力/カナ境界/パターン不変 guard（§2）が追加されている。
- [ ] `tagManagementGlossary.spec.ts` に未登録 key/件数固定/平易性 guard（§3）が追加されている。
- [ ] `TagManagementGuide.component.spec.tsx` に不正 variant fallback/className 合成/相互リンク排他 guard（§4）が追加されている。
- [ ] `TagDefinitionCreateForm.component.spec.tsx` に上書き境界/送信 shape 不変 guard（§5）が追加されている。
- [ ] 既存テスト（`TagDefinitionPanel.component.spec.tsx` 等）の非破壊確認手順（§6・AC-12）が記載されている。
- [ ] 回帰サマリ（§7）と実行コマンド（§8・SSOT §11）が記載されている。
- [ ] 統合テスト連携（同一 wave GREEN・API 非接触）が記載されている。
- [ ] 新規 test ファイルが `*.spec.{ts,tsx}` のみである方針が記載されている。
