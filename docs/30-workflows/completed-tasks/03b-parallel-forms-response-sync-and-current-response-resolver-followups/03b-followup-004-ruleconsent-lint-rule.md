# 旧 ruleConsent / 単数形 consent キーを禁止する custom ESLint rule - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | 03b-followup-004-ruleconsent-lint-rule                                        |
| タスク名     | 旧 ruleConsent / 単数形 consent キーを禁止する custom ESLint rule             |
| 分類         | 品質ゲート整備                                                                |
| 対象機能     | 不変条件 #2「consent キーは publicConsent と rulesConsent に統一」の CI 担保   |
| 優先度       | 低                                                                            |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | 03b Phase 12 unassigned-task-detection #6                                     |
| 発見日       | 2026-04-28                                                                    |
| 引き取り候補 | linting 共通 task / リポジトリルートの ESLint・lint-boundaries 設定           |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

CLAUDE.md 不変条件 #2 は「consent キーは `publicConsent` と `rulesConsent` に統一する」を定めている。
しかし 03b 実装時、コード本体・テスト・`__fixtures__/` に旧名 `ruleConsent`（単数形）や、さらに古い単数 `consent` が混入する可能性が **grep ベースの目視レビューでしか検出できない** 状態だった。

現行の lint gate は `scripts/lint-boundaries.mjs`（禁止トークン grep）と `pnpm -r lint`（各 app 配下の package lint）の二段構えだが、`ruleConsent` / 単数 `consent` の禁止ルールは未登録である。

### 1.2 問題点・課題

- `ruleConsent`（旧名・単数形）と `rulesConsent`（正式名・複数形）の区別が grep だと差が 1 文字で見落としやすい
- 単数 `consent` キーが Zod schema / DB 列名 / API request body に紛れ込んでも気付けない
- 03b では fixture 側に「旧名で来た場合の正規化テスト」を残す必要があるため、**完全禁止ではなく fixture ディレクトリ除外** が要件
- リポジトリルートに ESLint config が存在しない（`.eslintrc*` / `eslint.config.*` 共に未配置）ため、custom rule を載せる土台から整える必要がある

### 1.3 放置した場合の影響

- 不変条件 #2 のドリフトが PR レビューでしか検出できず、見落とし時に DB 列名 / API contract / フォーム項目の3層で名称がズレる
- 03a / 03b / 04a / 04c の wave 間で consent 命名の差異が拡大し、回帰の温床になる
- `responseEmail` の system field 化（不変条件 #3）と同様の正本化方針が崩れる

---

## 2. 何を達成するか（What）

### 2.1 目的

`ruleConsent` / `ruleConsents` / 単数 `consent`（識別子・object key・文字列リテラル）を **CI で機械的に検出して fail させる** lint rule を恒久配置し、不変条件 #2 のドリフトをゼロにする。

### 2.2 最終ゴール

- リポジトリルート `pnpm lint` の中で、上記禁止トークンが検出された場合に exit 1 となる
- 例外として `__fixtures__/` 配下、および明示的に `// allow-legacy-consent: <理由>` コメントが付いた行は許容される
- 03b / 04a / 04c の後続 PR が merge される時点で禁止ルールが有効化されている

### 2.3 スコープ

#### 含むもの

- `scripts/lint-boundaries.mjs` への禁止トークン追加（最小コスト経路。既存 gate を拡張する）
  - `ruleConsent`（複数形でない方）
  - `ruleConsents`（s 付き旧名の派生形）
  - 単数 `consent`（object key として頻出する形のみ。語幹一致の誤検出は AST ベースに昇格して回避）
- もしくは ESLint custom rule として `eslint-plugin-ubm-hyogo/no-legacy-consent-key` を作成し、ルートに `eslint.config.mjs` を新設して `pnpm -r lint` に組み込む
- 除外設定: `**/__fixtures__/**`、`docs/**`、`.claude/**`、`node_modules/**`
- 例外コメント `// allow-legacy-consent: <理由>` の解釈
- 03b の implementation-guide / fixture 整備差分への追記（必要時）

#### 含まないもの

- 既存コードからの旧名一掃（別途棚卸しタスク。本タスクは gate を作るのみ）
- Zod schema / D1 DDL の rename（既に `rulesConsent` / `publicConsent` で正本化済み）
- `responseEmail` system field 周辺の lint（不変条件 #3 範囲。別タスク）

### 2.4 成果物

- `scripts/lint-boundaries.mjs` の禁止トークン拡張差分（推奨経路）または `eslint.config.mjs` 新規 + custom rule package
- 例外ディレクトリ・例外コメントを尊重するロジック
- 仕様書: 禁止トークン一覧と除外規則の対応表
- README / lint-boundaries の運用節への追記（CLAUDE.md「よく使うコマンド」節を変更しない）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `scripts/lint-boundaries.mjs` の現行実装（forbidden 配列を `apps/web` 配下のみに走らせる）を理解している
- リポジトリルートに ESLint config が **無い** ことを確認済み（2026-04-28 時点）
- 03b の `__fixtures__/` ディレクトリ運用が確立している

### 3.2 実行手順

#### 推奨経路: `scripts/lint-boundaries.mjs` 拡張

1. `lint-boundaries.mjs` を以下のように 2 段化する
   - 第 1 段: `apps/web` への boundary 違反（既存）
   - 第 2 段: リポジトリ全体に対する `consent` 命名 lint（新設）
2. 第 2 段の禁止トークンを正規表現で定義する
   - `/\bruleConsents?\b/`（単数 / s 付き旧名）
   - `/\bconsent\b\s*[:=]/`（object key / 代入の単数 `consent`。文書コメント中は許容）
3. 走査対象を `apps/**`, `packages/**`, `scripts/**` の `*.ts` / `*.tsx` / `*.mjs` / `*.json` に拡張
4. 除外パスを定義: `**/__fixtures__/**`、`**/node_modules/**`、`**/.next/**`、`**/dist/**`、`docs/**`、`.claude/**`
5. 例外コメント `// allow-legacy-consent:` を含む行は skip
6. 違反時は `<file>:<line> contains forbidden consent key: <token>` を出力して exit 1
7. unit test を `scripts/__tests__/lint-boundaries.test.mjs` に配置（vitest）
   - 違反検出ケース / fixture 除外ケース / 例外コメント許容ケース / 正規名のみのクリーンケース

#### 代替経路: ESLint custom rule

1. ルートに `eslint.config.mjs` (`@eslint/js` flat config) を新設
2. `packages/eslint-plugin-ubm-hyogo/` を workspace として作成し、`no-legacy-consent-key` rule を実装
   - AST ベースで `Identifier` / `Property.key` / `Literal` を検査
   - option で `allowedDirs: ["__fixtures__"]` を受け取る
3. `pnpm -r lint` の各 package lint で当該 rule を `error` で有効化
4. 既存コードに違反があれば棚卸し別タスクで対応するため、本タスクは新規違反のみ block する設定で start
5. ルール unit test を ESLint `RuleTester` で記述

> 推奨は **第 1 経路**。ESLint 未導入の現状では導入コストが大きく、本タスクの責務（不変条件 #2 の恒久 gate）に対して過剰なため。将来 ESLint 導入時に第 2 経路へマイグレーションする方針を残す。

### 3.3 受入条件 (AC)

- AC-1: `pnpm lint` 実行時に `ruleConsent` / `ruleConsents` / 単数 `consent`（object key 形）が検出された場合 exit 1 となる
- AC-2: `__fixtures__/` 配下のファイルは検出から除外される（旧名で来た場合の正規化テストを保護）
- AC-3: `// allow-legacy-consent: <理由>` を行末に持つ行は許容される
- AC-4: 走査対象は `apps/**`, `packages/**`, `scripts/**` で、`docs/**` / `.claude/**` / `node_modules/**` / `.next/**` / `dist/**` は除外される
- AC-5: 違反時のエラーメッセージに **ファイル名・行番号・検出トークン** が含まれる
- AC-6: 推奨経路採用時、`scripts/__tests__/lint-boundaries.test.mjs` の vitest が pass する
- AC-7: 既存リポジトリ（main 時点）に対して新ルールを走らせて **正規名のみで違反 0 件** であることを確認した記録が PR description に残る

---

## 4. 苦戦箇所 / 学んだこと（03b で得た知見）

### 4.1 grep ベース検出の限界

03b 実装時、`ruleConsent` と `rulesConsent` の差は 1 文字（s）しかなく、目視レビューでも見落としやすかった。さらに単数 `consent` は変数名や英文ドキュメント中に頻出するため、単純な文字列マッチでは誤検出が大量に出る。**object key / 代入位置に絞った正規表現** または **AST ベース** に踏み込まないと運用可能な精度が出ない。

### 4.2 fixture 除外の必然性

03b の `_shared/normalize-consent.ts` は「旧名で来た payload を新名に正規化する」責務を持ち、unit test fixture には意図的に `ruleConsent` を残す必要がある。完全禁止にするとこのテストが書けなくなるため、`__fixtures__/` 除外は不変条件 #2 の運用上必須。

### 4.3 lint gate の二段化

`scripts/lint-boundaries.mjs` は元々 `apps/web` のみを対象とした boundary lint だったが、本タスクは **リポジトリ全体の命名規約 lint** を担う。責務が異なるため、ファイル分割（`scripts/lint-naming.mjs` 新設）も検討したが、`pnpm lint` から呼ぶ gate を増やすと追跡しにくくなるため、**同一スクリプトの第 2 段** として束ねるのが運用負荷最小。

### 4.4 ESLint 導入コストとの天秤

理想は ESLint custom rule（AST 解析・自動修正・editor 連携）だが、本リポジトリは現状 ESLint 未導入で、各 app の lint は biome / tsc に閉じている可能性がある。ESLint 導入は別件で議論すべきで、本タスクは **既存 gate 拡張で必要十分な精度** を狙う。

---

## 5. 関連リソース

- `scripts/lint-boundaries.mjs` - 拡張対象の lint gate
- `package.json` - `lint` script の定義
- `CLAUDE.md` 不変条件 #2 - consent キー統一規約
- `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/unassigned-task-detection.md` #6 - 検出元
- `doc/00-getting-started-manual/specs/01-api-schema.md` - consent キー schema 定義
- 03b implementation-guide.md - `_shared/normalize-consent.ts` の正規化方針
