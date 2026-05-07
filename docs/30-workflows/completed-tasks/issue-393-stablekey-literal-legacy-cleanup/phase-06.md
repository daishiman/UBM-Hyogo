[実装区分: 実装仕様書]

# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (統合検証) |
| 状態 | pending |

## 目的

置換完了後の strict 検査が「実際に違反を検出できる状態」「suppression / bypass で迂回できない状態」であることを実測で確認する。これにより親 03a workflow AC-7 の strict CI gate 昇格が信頼可能であることを保証する。

## 異常系シナリオ

### シナリオ 1: 違反 fixture 1 行追加で strict fail することの確認

**目的**: 置換完了後も strict 検査が機能していることを実証。

**手順**:

1. 任意の family ファイル（例: `apps/api/src/repository/publicMembers.ts`）に意図的に literal を 1 行追加（例: `const dummy = "fullName";`）
2. `node scripts/lint-stablekey-literal.mjs --strict` を実行
3. exit code が 0 でないこと、violation 1 件が報告されることを確認
4. 該当変更を `git restore` で revert
5. 再度 strict 実行で exit 0 を確認

**期待 evidence**:
- `outputs/phase-06/violation-fixture-spec.md` に再現手順と期待出力を記載

### シナリオ 2: suppression (`eslint-disable`) 試行が gate を通らないことの確認

**目的**: `scripts/lint-stablekey-literal.mjs` は ESLint ではなく独立の AST 検査スクリプトのため、`// eslint-disable-next-line` を書いても無視される（=violation として検出される）ことを確認。

**手順**:

1. 任意の family ファイルに以下を追加
   ```
   // eslint-disable-next-line
   const bypass = "fullName";
   ```
2. `node scripts/lint-stablekey-literal.mjs --strict` 実行
3. violation がそのまま検出されることを確認（suppression は無視される）
4. 該当変更を revert

**判定基準**:
- スクリプトが ESLint comment を読まない実装 → suppression 不可（期待）
- もしスクリプトが ESLint comment を解釈してしまう実装 → 親 03a workflow への bug report として Phase 12 で記録

### シナリオ 3: bypass 試行（テンプレート文字列 / 変数 alias）の検出範囲限界

**目的**: 現行検出ロジックが「素の string literal」のみを対象としている場合、以下のような迂回は検出できない可能性がある。これを Phase 6 で実測し、検出範囲の限界を文書化する（本タスクスコープでの修正対象ではない・親 03a への feedback とする）。

| 試行パターン | 検出されるか（仮説） |
| --- | --- |
| `const x: string = "fullName";` | 検出される |
| ` const x = \`fullName\`; ` (template literal) | 検出されない可能性（要実測） |
| `const x = ["full", "Name"].join("");` | 検出されない（runtime 構築） |
| `const x: "fullName" = "fullName";` | 検出される（literal はそのまま） |

**手順**:

1. 4 パターンを順次任意 family ファイルに追加
2. それぞれ strict 実行で結果記録
3. 結果を `outputs/phase-06/violation-fixture-spec.md` に表として保存
4. すべて revert

**注**: 本タスクは検出ロジック改修を行わない。bypass 経路の限界は Phase 12 で親 03a workflow への feedback として記録する。

## 実行タスク

- [ ] シナリオ 1: 違反 fixture 追加 → strict fail → revert
- [ ] シナリオ 2: suppression 試行 → strict 検出維持 → revert
- [ ] シナリオ 3: bypass パターン 4 種実測 → 検出範囲表作成 → revert
- [ ] `outputs/phase-06/violation-fixture-spec.md` に再現手順と結果記録
- [ ] 親 03a workflow への feedback 候補（bypass 限界）を Phase 12 引き継ぎ用にまとめる

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | scripts/lint-stablekey-literal.mjs | 検出ロジック確認 |
| 必須 | outputs/phase-05/runbook.md | 完了済 state の前提 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 異常系検証サマリー |
| ドキュメント | outputs/phase-06/violation-fixture-spec.md | 3 シナリオの手順 / 期待 / 実結果 / 検出限界表 |
| メタ | artifacts.json | phase 6 status |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 統合 evidence への異常系結果転記 |
| Phase 12 | 親 03a workflow への bypass 限界 feedback |

## 多角的チェック観点

- 検出ロジックの ESLint comment 解釈有無（suppression hygiene の根本担保）
- bypass 経路の網羅範囲（ロジック改修は別タスクだが現状把握）
- fixture revert 漏れ（最終 commit に異常 fixture が混入しないこと）
- secret hygiene: fixture に実値を含めない（"fullName" 等の stableKey はそもそも公開仕様）

## 完了条件

- [ ] シナリオ 1〜3 実測完了
- [ ] violation-fixture-spec.md 完成
- [ ] 全 fixture revert 済み
- [ ] Phase 12 feedback 候補整理

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（fixture revert 忘れ / 検出ロジック spec 想定外動作）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 6 を completed

## 次 Phase

- 次: Phase 7 (統合検証)
- 引き継ぎ: 異常系結果 / bypass 検出限界表 / fixture revert 完了状態
- ブロック条件: 異常系シナリオ実測未了なら Phase 7 統合検証へ進めない
