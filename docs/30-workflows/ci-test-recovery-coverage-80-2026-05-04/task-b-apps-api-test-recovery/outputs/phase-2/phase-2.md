# Phase 2: 設計（修復方針の振り分け）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 名称 | 設計 |
| status | spec_created |
| 入力 | `outputs/phase-1/main.md`（13 件分類表） |
| 出力 | `outputs/phase-2/main.md` |

## 目的

Phase 1 で分類した 13 件失敗それぞれに対し、**最小差分** で修復するための具体的な方針を設計する。テスト側を緩める修正は最小限に抑え、実装 bug が原因なら実装を直す方針を貫く。

## 実行タスク

### Step 1: 修復方針マトリクス作成

Phase 1 の 13 件分類表を引き継ぎ、各失敗に「修復アプローチ」を追加する。

| # | test file | 失敗種別 | 修復アプローチ | 修正対象ファイル | 期待差分行数 | risk |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | ... | impl bug | 実装側の null guard 追加 | `apps/api/src/routes/me/index.ts` | +3 / -0 | 低 |
| 2 | ... | setup drift | D1 binding mock の env 名修正 | `apps/api/test/setup.ts` | +1 / -1 | 低 |
| 3 | ... | mock contract drift | mock factory に新 column 追加 | `apps/api/src/repository/__tests__/_mocks/*.ts` | +5 / -0 | 中 |
| ... | ... | ... | ... | ... | ... | ... |

### Step 2: 共通修復パターンの抽出

複数 failure に共通する root cause があれば共通パターンとして集約する（DRY 化）。例:

| 共通パターン | 該当 failure 件数 | 共通修復 |
| --- | --- | --- |
| auth middleware の 401 期待値が 200 を返す | 3 件（admin/attendance, admin/audit, admin/schema） | session mock factory 1 か所修正で全件解消 |
| Miniflare D1 binding 名 `DB` vs `D1` 不一致 | 5 件（repository 系） | `vitest.config.ts` または `test/setup.ts` の binding 名修正 1 箇所 |

### Step 3: 修復順序の設計（依存解消優先）

setup drift / 共通パターン → 個別 impl bug の順で修復し、共通修復で消える failure を先に潰す。

| 順序 | 修復対象 | 想定解消件数 | 検証コマンド |
| --- | --- | --- | --- |
| 1 | `test/setup.ts` 修正 | N 件 | `pnpm --filter @ubm-hyogo/api test apps/api/src/repository` |
| 2 | session mock factory 修正 | M 件 | `pnpm --filter @ubm-hyogo/api test apps/api/src/routes/admin` |
| 3 | 個別 impl bug | 残全件 | failure ごとに targeted test |

### Step 4: 修復制約ルール

| ルール | 理由 |
| --- | --- |
| `it.skip` / `describe.skip` で逃がさない | 13 件 → 0 件達成のため skip 禁止 |
| coverage threshold 緩和を解として採用しない | Task D の前提が崩れる |
| schema 想定変更は不変条件 #1 違反として却下 | CLAUDE.md 不変条件 |
| D1 への直接アクセスを `apps/web` に追加しない | 不変条件 #5 違反 |
| `--no-verify` push 禁止 | CLAUDE.md ルール |

### Step 5: ライブラリ・依存追加の判定

| 判定軸 | 結論（spec 段階仮置き、Phase 5 で再評価） |
| --- | --- |
| 新規 npm パッケージ追加 | **不要前提**（Miniflare / vitest / hono は既存。追加が必要になった場合は Phase 5 で本タスク内の変更として扱う） |
| `miniflare` バージョン bump | 13 件のうち setup drift が該当バージョンに依存する場合のみ。Phase 1 で確認 |
| Wrangler バージョン bump | 不要前提 |

### Step 6: D1 binding / Miniflare 設計参照

`int-test-skill` の参照を検討:

- `.claude/skills/int-test-skill/SKILL.md`
- 該当パターン: per-test D1 ephemeral instance / migration apply on setup
- 既存 `apps/api/test/setup.ts` の構造と照合し、drift があれば patterns 通りに揃える

## 完了条件

- [ ] `outputs/phase-2/main.md` に 13 件分の修復アプローチ表が完成
- [ ] 共通修復パターンが抽出され「共通修復で消える件数」が確定
- [ ] 修復順序（setup → 共通 mock → 個別 impl）が確定
- [ ] 修復制約ルールが明記され Phase 5 実装エージェントが守るべき項目が明確
- [ ] 新規依存追加の要否が確定（不要前提）

## 多角的レビュー観点

- システム系: 共通 mock factory 修正が他の PASS test に regression を起こさないか（test 間結合度の評価）
- 戦略系: 「実装 bug を直すか test を直すか」の判定が CLAUDE.md 不変条件に整合しているか
- 問題解決系: 修復難度「高」が 3 件超なら本 wave 内完遂が困難。Phase 3 ゲートで再判定
