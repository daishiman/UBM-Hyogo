# Phase 6: テスト実行（grep gate / markdown lint）

[実装区分: ドキュメントのみ]（CONST_004 例外: 純粋なドキュメント作成）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-19-w2-primitives-full-spec |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト実行（仕様書の決定論的検証） |
| 作成日 | 2026-05-07 |
| 前 Phase | 5 (実装) |
| 次 Phase | 7 (リファクタリング) |
| 状態 | completed |
| task_kind | NON_VISUAL（pure-docs） |

## 目的

タスク正本 §6 / §7 に従い、Phase 5 で執筆された `09c-primitives.md` に対して **grep ベースの決定論的検証**を実行する。視覚値（HEX / oklch / px）の混入禁止、構造（§ 数 / JSX block 数）、JSX 転記の primitives.jsx との一致を機械的に確認し、fail 時は Phase 5 へ差し戻す。

## 実行タスク

- §6.1 markdown 構造検証（primitive 数 / §99 / JSX block 数）
- §6.2 視覚値混入禁止 grep gate（HEX / oklch / px / `bg-[`）
- §6.3 JSX 転記の primitives.jsx との一致確認
- markdown lint 実行
- fail 時の戻り Phase 判定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md | §6 テスト方針 / §7 実行コマンド |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | 検証対象（Phase 5 成果物） |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/primitives.jsx | JSX 転記照合元 |

## 実行手順

### ステップ 1: §6.1 markdown 構造検証

```bash
F=docs/00-getting-started-manual/specs/09c-primitives.md

# primitive 数（§1〜§18 + §99 で 19 件）
N=$(grep -cE '^## [0-9]+\. ' "$F")
test "$N" -ge 19 || { echo "FAIL: primitive 数 $N < 19"; exit 1; }

# §99 存在
grep -c '^## 99\. ' "$F" | grep -q '^1$' || { echo "FAIL: §99 不採用が無い"; exit 1; }

# JSX block 数（17+ 期待）
J=$(grep -c '^```jsx$' "$F")
test "$J" -ge 17 || { echo "FAIL: JSX block 数 $J < 17"; exit 1; }
```

期待出力: 全コマンド exit 0。

### ステップ 2: §6.2 視覚値混入禁止 grep gate

```bash
F=docs/00-getting-started-manual/specs/09c-primitives.md
fail=0
grep -nE '#[0-9a-fA-F]{3,8}\b' "$F" && fail=1
grep -nE 'oklch\(' "$F" && fail=1
grep -nE '\b[0-9]+px\b' "$F" && fail=1
grep -nE '\bbg-\[' "$F" && fail=1
test $fail -eq 0 || { echo "FAIL: 視覚値混入"; exit 1; }
echo OK
```

期待出力: `OK`。1 件でも mat ち → Phase 5 戻り。

### ステップ 3: §6.3 JSX 転記の一致確認

`primitives.jsx` の主要 const/function 宣言を `rg -n '^(const|function) [A-Z][A-Za-z0-9]*\b'` で抽出し、`09c-primitives.md` の JSX block 数（17 以上）と代表 excerpt の一致を確認する。

```bash
for sig in 'function Chip' 'function Button' 'function Switch' 'function Segmented' \
           'function Field' 'function Drawer' 'function Modal' 'function Toast' \
           'function KVList' 'function LinkPills'; do
  grep -q "$sig" docs/00-getting-started-manual/specs/09c-primitives.md \
    || { echo "FAIL: $sig が転記されていない"; exit 1; }
done
echo OK
```

### ステップ 4: markdown lint

```bash
mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09c-primitives.md
```

期待: error 0。warning は Phase 7 で解消する。

### ステップ 5: fail 時の戻り Phase 判定

| 失敗 gate | 戻り Phase | 修正方針 |
| --- | --- | --- |
| §6.1 構造（§ 数 / §99 / JSX block） | Phase 5 | 不足セクションの追加 |
| §6.2 視覚値混入 | Phase 5 | HEX/oklch/px → token 名へ置換 |
| §6.3 JSX 不一致 | Phase 5 | primitives.jsx から再転記 |
| markdown lint error | Phase 7 | 整形のみ（リファクタ範疇） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | gate fail 時の戻り先 |
| Phase 7 | lint warning の整形対象 |
| Phase 9 | DoD §8 の grep gate 実証データとして再利用 |

## 多角的チェック観点（AIが判断）

- 決定性: 検証コマンドが副作用なく再現可能か
- 厳密性: HEX 短縮形（`#fff`）/ oklch 異記法も含めて捕捉できているか
- 完全性: 18 primitive 全ての JSX 転記が grep で確認されるか
- 運用性: fail 時の戻り Phase が明確か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | §6.1 構造検証 | 6 | pending | grep -c |
| 2 | §6.2 視覚値 grep gate | 6 | pending | 4 パターン |
| 3 | §6.3 JSX 一致確認 | 6 | pending | 10 関数シグネチャ |
| 4 | markdown lint | 6 | pending | pnpm lint:md |
| 5 | fail 時戻り Phase 記録 | 6 | pending | gate-decision |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ログ | outputs/phase-06/grep-gate-result.md | §6.1〜§6.3 / lint 実行結果 |
| メタ | artifacts.json | Phase 6 状態更新 |

## 完了条件

- [ ] §6.1 構造検証が exit 0
- [ ] §6.2 視覚値 grep gate で 0 件
- [ ] §6.3 JSX 一致確認が全シグネチャ pass
- [ ] markdown lint で error 0
- [ ] fail 発生時は戻り Phase が記録され、再試行で全 gate pass
- [ ] coverage AC 適用外（pure-docs）

## タスク100%実行確認【必須】

- [ ] 5 サブタスク全て completed
- [ ] grep-gate-result.md に各コマンド出力が貼付済み
- [ ] 全完了条件にチェック
- [ ] 次 Phase への引き継ぎ事項を記述
- [ ] artifacts.json の Phase 6 を verified に更新

## 次 Phase

- 次: 7 (リファクタリング)
- 引き継ぎ事項: lint warning および章構成の重複・揺れを Phase 7 で整形
- ブロック条件: §6.2 視覚値混入が解消されない限り次 Phase に進まない
