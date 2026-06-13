# Phase 6: Test Expansion（テスト拡充 / 回帰ガード）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-3-to-4-major-upgrade |
| 前提 | phase-04 / phase-05（全 shard GREEN 後） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| Phase の主旨 | 新規機能テストは増やさず、**アップグレードの回帰ガード**（バージョン整合・D1 直列化の v4 等価表現・deprecation ゼロ）を継続確認できる状態にする |

## 本タスクでのテスト拡充の読み替え

通常の機能開発では「テスト拡充 = エッジケース・境界値・新規シナリオの追加」だが、本タスクは**依存ライブラリのメジャーアップグレード**であり、新しいプロダクト挙動を導入しない。**過剰な新規テスト追加はスコープ外**（index.md「含まないもの」: 新規テストの追加は該当機能タスクへ。v4 起因の回帰 guard 追加のみ本 Phase で最小限可）。本 Phase の拡充は次の 3 点に読み替える:

> **(a) バージョン整合の回帰ガード** — vitest と `@vitest/coverage-v8` が 4.1.x で完全一致し続け（exact pin）、plugin-react の peer 整合が維持されることを観測する。
> **(b) D1 直列化（v4 表現）の回帰確認** — `vitest.d1.config.ts` の `pool: "forks"` + `maxWorkers: 1`（`isolate: false` 不採用）が維持され、port exhaustion なく完走することを確認する。
> **(c) deprecation 警告ゼロ / C8 非混入の継続確認** — v4 削除 API（workspace / poolMatchGlobs / deps 系 / 第3引数オブジェクト等）の非混入を確認する。

## 回帰ガードテーブル

| 回帰観点 | 何を守るか | 確認手段 | 関連カテゴリ / AC |
| --- | --- | --- | --- |
| バージョン整合 | vitest と coverage-v8 の 4.1.x 完全一致（peer exact pin） | `mise exec -- pnpm why vitest` / `pnpm why @vitest/coverage-v8` の解決バージョン突合 | C7 / AC-1 / AC-2 / 不変条件 2 |
| vite 解決範囲 | vitest 4.1.8 が許す vite `^6/^7/^8` 範囲内の解決 + plugin-react ^5.2 の peer 警告ゼロ | `mise exec -- pnpm why vite` / `pnpm why @vitejs/plugin-react` | C5 / NFR-2 |
| D1 直列化動作 | `pool: "forks"` + `maxWorkers: 1`（`isolate: false` 不採用）の維持・port exhaustion 非再発 | `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1` が hang/EADDRINUSE なく完走 | C1 / AC-7 / NFR-4 / 不変条件 3 |
| isolate: false の状態リーク回避 | テスト間モジュール状態共有を導入しない | config grep で `isolate: false` が存在しないこと、api-d1 shard の繰り返し green | C1 / AC-5 |
| coverage shard 全 green | CI 5 shard（web / api-unit / api-d1 / packages / og）+ 補助 suite の green 維持 | 各 shard の coverage 系コマンド + `mise exec -- pnpm coverage:guard` | NFR-3 / AC-5 |
| deprecation 警告ゼロ | C8 削除 API・v4.1 deprecation（`vitest/*` エントリポイント / spy `toBe*` 系 / `vi.mock` トップレベル外）の非混入 | Phase 4 (a) の grep 再実行 + vitest 実行ログの warn ゼロ（または分類記録あり） | C8 / AC-6 |
| obsolete snapshot ゼロ | v4 は CI 上の obsolete snapshot で fail するため残骸ゼロを維持 | vitest 実行出力に obsolete 報告なし | C4 / AC-8 / NFR-7 |
| coverage 閾値維持 | C2（AST remapping）実測ずれ範囲を超えて閾値が下がっていない | 閾値ゲートの green と「v3→v4 実測差分」記録（Phase 7 正本） | C2 / 不変条件 8 |

> 上表は Phase 7（カバレッジ確認）/ Phase 9（品質保証）/ CI（`coverage-guard.sh`）で繰り返し実行される「回帰観点」のチェックリストとして機能する。

## 回帰 guard spec の最小追加（任意）

D1 直列化の v4 表現（`maxWorkers: 1`、`isolate: false` 不採用）は issue-617 の port exhaustion 回避を担う**構造的不変条件**であり、将来の config 編集で誤って外される退行を grep やレビューだけで防ぎにくい。これを assert する **config 検査 spec の追加は任意**とする（追加しなくても本 Phase は完了可。RED 採取結果と工数を見て判断する）。

追加する場合の規約:

| 項目 | 規定 |
| --- | --- |
| 命名 | `*.spec.ts` のみ（`*.test.ts` 禁止 / CLAUDE.md 不変条件 8）。例: `vitest-d1-serialization-guard.spec.ts` |
| 配置 | `scripts/__tests__/`（config 検査は scripts shard の責務。`vitest.config.ts` の include `scripts/**/*.spec.ts` で自動収集される） |
| 検証内容 | `vitest.d1.config.ts` の default export を import し、`test.pool === "forks"` / `test.maxWorkers === 1` / `test.isolate === false` / `poolOptions` 非存在、を assert する |
| 禁止事項 | プロダクトコードの import・D1 binding へのアクセス（config オブジェクトの静的検査に閉じる） |
| 実行確認 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts scripts/__tests__/vitest-d1-serialization-guard.spec.ts` |

> これ以外の新規 spec（機能テスト・カバレッジ引き上げ目的のテスト）は追加しない。

## fail path 整理（RED → GREEN の残骸確認）

Phase 5 の修正が「fail を握り潰す」形で終わっていないことを確認する:

1. **skip 件数の before/after 突合**（不変条件 7 / AC-8）:

```bash
# --- before（bump 前 / origin/dev 相当のベースラインで取得しておく） ---
grep -rn "\.skip\b" --include="*.spec.ts" --include="*.spec.tsx" apps packages scripts infra | wc -l
grep -rnE "(describe|it|test)\.(skip|skipIf)\b" --include="*.spec.ts" --include="*.spec.tsx" apps packages scripts infra | wc -l

# --- after（bump + 修正後 / 本ブランチで取得） ---
grep -rn "\.skip\b" --include="*.spec.ts" --include="*.spec.tsx" apps packages scripts infra | wc -l
grep -rnE "(describe|it|test)\.(skip|skipIf)\b" --include="*.spec.ts" --include="*.spec.tsx" apps packages scripts infra | wc -l
```

判定: **after の件数 ≤ before の件数**であること。増加していたら、その差分が v4 fail を握り潰した skip でないかを個別確認し、fail は期待値/モック/snapshot 修正で解消する方針へ戻す（`--passWithNoTests` は既存 script の設計であり skip 増加には数えない）。

2. **RED 分類記録と修正差分の突合**: Phase 4 で `RED-C{n}-{seq}` タグ付けした fail が全て「修正済み（GREEN）」または「エスカレーション済み」のいずれかに分類され、未処理の fail が残っていないことを確認する（AC-9 の分類記録として `outputs/` に残す）。

3. **テスト削除ゼロの確認**: `git diff dev...HEAD --stat -- '**/*.spec.ts' '**/*.spec.tsx'` で spec の削除（テストケース丸ごと削除による green 化）が発生していないことを確認する。

## 完了条件

- [ ] 「依存アップグレードにおけるテスト拡充の読み替え（(a)(b)(c)）」が記載されている
- [ ] 過剰な新規テスト追加はスコープ外であることが明記されている
- [ ] 回帰ガードテーブル（バージョン整合 / vite 範囲 / D1 直列化 v4 等価表現 / shard green / 警告ゼロ / obsolete ゼロ / 閾値維持）が記載されている
- [ ] 回帰 guard spec の追加が**任意**であること、追加時の `*.spec.ts` 命名・`scripts/__tests__/` 配置・検証内容が明記されている
- [ ] fail path 整理（skip 件数 before/after / RED 分類記録の突合 / テスト削除ゼロ確認）が記載されている
- [ ] 各回帰観点が関連カテゴリ（C1/C2/C4/C5/C7/C8）・AC へ紐付いている

---

## 目的

この Phase の目的は、上位 workflow `vitest-3-to-4-major-upgrade` の実装仕様を次の Phase へ矛盾なく引き渡すことである。既存本文の詳細記述を正本とし、本補助セクションは task-specification-creator validator 用の構造見出しを補う。

## 実行タスク

- 既存本文に記載された手順・表・チェック項目を、この Phase の実行タスクとして扱う。
- 実装前の `spec_created` 状態では、ここに列挙したタスクは実装サイクルで実行する。
- commit / push / PR / Issue mutation は Phase 13 の user gate まで実行しない。

## 参照資料

- `phase-04-test-creation.md`, `phase-05-implementation.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル: `phase-06-test-expansion.md`
- 後続 Phase が参照する判断・コマンド・証跡パスの確定情報
- 実装サイクルで更新される場合は、`artifacts.json` と `outputs/artifacts.json` の parity を維持する。
