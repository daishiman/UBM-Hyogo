# Phase 3 — alternatives: 設計案比較

## 案 A（採用）: 5 repo + boundary tooling 二重防御 + `_shared/` 02c 正本

### 内容
- repository 5 ファイル（adminUsers / adminNotes / auditLog / syncJobs / magicTokens）
- `.dependency-cruiser.cjs`（CI gate）+ `apps/web/eslint.config.js no-restricted-imports`（ローカル即時）の二重防御
- `_shared/{db,brand,sql}.ts` + `__tests__/_setup.ts` を 02c が正本管理、02a/02b は片方向 import

### 強み
- CI で dep-cruiser が境界違反を 100% 検出（forbidden severity error、再 export 経由でも検出）
- ローカル開発で ESLint が即時 feedback（IDE 内 red squiggle）
- `_shared/` を 02c 正本で重複ゼロ
- auditLog の append-only / magicTokens の single-use を **API 不在** / **楽観 lock** で守る
- syncJobs の ALLOWED_TRANSITIONS が 02b の tagQueue と統一
- 並列着手可能（5 ファイル独立、下流 6 task が並列）

### 弱み
- dep-cruiser config の維持コスト（rule 増加で読みにくくなる）
- ESLint plugin 設定が apps/web に必要

### 判定: **PASS**

---

## 案 B（却下）: dep-cruiser のみ

### 内容
- ESLint rule を入れず、CI の dep-cruiser だけで境界を守る
- apps/web 側に lint rule なし

### 強み
- tooling 1 種で済む、設定簡素
- monorepo 全体での依存グラフ管理が一元化

### 弱み
- ローカル開発で違反を見逃す（push してから CI で初めて気付く）
- apps/web エンジニアが import 候補に repository が出てしまい誤って選ぶリスク
- IDE 補完で `D1Database` を選んでも警告なし
- 修正サイクルが長くなる（push → CI fail → 戻して修正）

### 判定: **MAJOR**（事故率高、開発体験劣化 → 却下）

---

## 案 C（却下）: ESLint のみ

### 内容
- dep-cruiser を使わず、ESLint だけで `no-restricted-imports`

### 強み
- 単一 tooling、開発者の認知負荷低
- ローカル即時 feedback あり

### 弱み
- import path の文字列マッチに依存、再 export 経由（barrel file `index.ts`）で escape 可能
- 02a ↔ 02b ↔ 02c の cross-domain 禁止を ESLint で書くのが冗長（複数の app に同じ rule を repeat）
- CI gate として依存グラフの可視化（`pnpm depcruise --output-type dot`）が無い
- 動的 import や副作用 import を見落とす

### 判定: **MAJOR**（境界網羅性不足 → 却下）

---

## 案 D（却下、即時 reject）: runtime guard

### 内容
- repository 関数の冒頭で `if (typeof window !== 'undefined') throw` を入れる
- import を許してから実行時に落とす

### 強み
- 静的検出器（dep-cruiser / ESLint）の設定なしで動く

### 弱み
- bundle に repository が混入する → bundle size 肥大、不変条件 #5 の精神（apps/web に D1 知識を持ち込まない）に反する
- 静的検出にならず、production で初めて落ちる
- D1 binding はそもそも apps/web の bundle に存在しないため、実行時 throw する前にビルド/型エラーで落とすべき
- type-safety を損なう（`window` check は any 経路）

### 判定: **MAJOR**（即却下）

---

## 案 E（却下）: 5 repo を 1 ファイル admin.ts に統合

### 内容
- 5 機能（adminUsers / adminNotes / auditLog / syncJobs / magicTokens）を 1 ファイル `admin.ts` に集約
- import path を 1 種に削減

### 強み
- import path 簡素
- ファイル数が減る

### 弱み
- 1 ファイル肥大（>2000 LOC 想定）
- 並列着手不能（複数下流タスク 03a/b、04c、05a/b、07c が同時に編集 → conflict 多発）
- test の責務分離が崩れる（1 test ファイルで 5 ドメインを混在）
- AC-1（5 ファイル存在）に違反

### 判定: **MAJOR**（並列性 / 保守性損失 → 却下）

---

## 案 F（却下）: TS project references で物理分離

### 内容
- `apps/api/src/repository/` を独立 TS project にし、`tsconfig.references` で apps/web から参照不可にする

### 強み
- TS compiler レベルで boundary を強制（最強の物理分離）
- 別パッケージ化と等価の隔離

### 弱み
- 設定コスト過大（references / outDir / declaration map 全て管理）
- pnpm workspace との二重設定で運用負荷
- IDE が project references をうまく解決できないケースあり
- dep-cruiser + ESLint で十分な保証が得られる範囲で overengineering

### 判定: **MINOR**（強力だが overengineering、A の運用が破綻したら検討）

---

## 比較表

| 評価軸 | A（採用） | B | C | D | E | F |
| --- | --- | --- | --- | --- | --- | --- |
| 不変条件 #5 静的保証 | ◎ 二重 | ○ CI のみ | △ escape 可 | × runtime | × 関係なし | ◎ TS project |
| ローカル即時 feedback | ◎ ESLint | × | ◎ | × | × | △ |
| 再 export escape 耐性 | ◎ dep-cruiser | ◎ | × | △ | × | ◎ |
| 並列着手性 | ◎ 5 file | ◎ | ◎ | ◎ | × | ○ |
| 設定コスト | ○ | ◎ 単一 | ◎ 単一 | ◎ 不要 | ◎ | × |
| 開発体験 | ◎ | × push 後 | ○ | × prod fail | △ | △ |
| 判定 | **PASS** | MAJOR | MAJOR | MAJOR | MAJOR | MINOR |

## 結論

採用案: **A（5 repo + dep-cruiser + ESLint 二重防御 + `_shared/` 02c 正本）**

採用案の弱み（dep-cruiser config 維持コスト / ESLint config 同期）は Phase 8 DRY 化で改善対象として申し送る。
