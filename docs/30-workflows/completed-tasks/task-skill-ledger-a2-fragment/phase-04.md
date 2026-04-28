# Phase 04: テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-skill-ledger-a2-fragment |
| Phase | 4 |
| タスク種別 | implementation（refactoring） |
| visualEvidence | NON_VISUAL |
| workflow | implementation |

## 目的

Phase 2 設計に対する TDD Red を Phase 5 実装前に固定する。`renderSkillLogs()` の単体テスト、append helper の衝突回避テスト、CI guard（writer 残存 grep）の expected 結果を `outputs/phase-4/test-matrix.md` に列挙する。

## テストパターン（C 系統）

| ID | カテゴリ | テスト内容 | 期待結果 |
| -- | -------- | ---------- | -------- |
| C-1 | append 衝突回避 | 同秒・同 branch で 2 件生成 | nonce 差で path 衝突 0 件 |
| C-2 | append 衝突回避 | 異 branch / 異秒 | 衝突 0 件（自明） |
| C-3 | append fail | 同秒・同 branch・nonce 衝突を 3 回連続で人工注入 | 4 回目以降に retry exit 1 |
| C-4 | render 出力 | fragment 0 件 | 空出力 + exit 0 |
| C-5 | render 出力 | fragment 1 件 | 1 件出力 + exit 0 |
| C-6 | render 出力 | fragment N 件 | timestamp 降順で N 件出力 |
| C-7 | render fail-fast | timestamp 欠損 fragment 1 件混入 | 対象 path を stderr 出力 + exit 1 |
| C-8 | render fail-fast | front matter parse 不能 fragment | 対象 path を stderr 出力 + exit 1 |
| C-9 | render `--out` 拒否 | `--out` が tracked canonical ledger を指す | exit 2 |
| C-10 | render legacy | `--include-legacy` 指定で window 内 `_legacy.md` が末尾連結 | Legacy セクション末尾に出力 |
| C-11 | render legacy | window 外 `_legacy.md`（30 日超） | 出力されない |
| C-12 | render `--since` | ISO8601 since 以降の fragment のみ | filter 結果のみ降順出力 |
| C-13 | CI guard | writer 経路に `LOGS\.md` 直接追記が残存 | `git grep` ヒット ≥1 → CI fail |
| C-14 | CI guard | writer 経路に `SKILL-changelog\.md` 直接追記が残存 | `git grep` ヒット ≥1 → CI fail |
| C-15 | legacy migration | `git mv` 後 `git log --follow LOGS/_legacy.md` | 旧 `LOGS.md` 履歴が継続 |
| C-16 | 4 worktree smoke | verify/a2-{1..4} で fragment 生成 → main 順次 merge | `git ls-files --unmerged` 0 行 |

## 実行タスク

- Phase 1 `outputs/phase-1/main.md` のスコープ・命名 canonical・横断依存を読み、テスト対象が Phase 1 受入条件から外れていないことを確認する。
- 既存コードの命名規則（camelCase / kebab-case 等）を分析して `outputs/phase-4/main.md` に記録する。
- `mise exec -- pnpm install` + `mise exec -- pnpm --filter @repo/shared build` 等の依存整合確認を Phase 5 着手前チェックとして明記する。
- 全件 `pnpm test` が SIGKILL する場合の targeted run ファイルリストを事前列挙する：
  - `scripts/skill-logs-render.test.ts`
  - `scripts/skill-logs-append.test.ts`
- private method テスト方針：render engine 内部の `extractTimestampFromLegacy()` 等は `(facade as unknown as FacadePrivate)` キャストまたは public callback 経由でテストする方針を明記。
- C-1 〜 C-16 の expected 結果と検証コマンド（`mise exec -- pnpm vitest run scripts/skill-logs-render.test.ts` 等）を test-matrix に記載。
- 4 worktree smoke の手順を `bash scripts/new-worktree.sh verify/a2-{1..4}` で記載。
- TDD Red 確認：Phase 5 実装前にテストが全件 fail することを `outputs/phase-4/main.md` に明記する。

## 参照資料

- Phase 2 `outputs/phase-2/render-api.md` / `fragment-schema.md`
- Phase 3 `outputs/phase-3/review.md`
- 既存仕様書 §6 検証方法

## 成果物

- `outputs/phase-4/main.md`（命名規則分析・依存整合チェック・targeted run リスト・TDD Red 宣言）
- `outputs/phase-4/test-matrix.md`（C-1〜C-16 の詳細）

## 統合テスト連携

Phase 5 実装後にここで設計したテストが Green に変わることを Phase 6 / 7 で検証する。

## 完了条件

- [ ] C-1 〜 C-16 の全テストパターンが test-matrix.md に列挙されている。
- [ ] 各テストの検証コマンドが記載されている。
- [ ] targeted run ファイルリストが Phase 5 着手前チェックとして固定されている。
- [ ] TDD Red 状態（実装前に全件 fail）が宣言されている。
- [ ] 4 worktree smoke 手順が再現可能な形で記載されている。
- [ ] artifacts.json の Phase 4 status と整合。
