# Phase 3: 設計レビュー — main

## 1. 目的

Phase 2 で確定した **採用案 A（5 repo + boundary tooling 二重防御 + `_shared/` 02c 正本）** を、5 案以上の alternative と比較し PASS / MINOR / MAJOR で判定する。

詳細な比較は `outputs/phase-03/alternatives.md` を参照。

## 2. 判定結果

| 案 | 判定 | 理由 |
| --- | --- | --- |
| A: 5 repo + dep-cruiser + ESLint 二重防御 + `_shared/` 02c 正本 | **PASS** | 二重防御で網羅、共有資産の重複ゼロ、運用コストは許容範囲 |
| B: dep-cruiser のみ | MAJOR | ローカル feedback 欠如、push まで気付かない |
| C: ESLint のみ | MAJOR | 文字列マッチに依存、再 export で escape 可能 |
| D: runtime guard | MAJOR | 静的検出にならず production fail、bundle 肥大 |
| E: 5 repo を 1 ファイル admin.ts に統合 | MAJOR | 並列性 / 保守性損失、>2000 LOC |
| F: TS project references で物理分離 | MINOR | 強力だが overengineering、設定コスト過大 |

採用は **案 A**。

## 3. 案 A 採用根拠

1. **不変条件 #5 の二重防御**:
   - dep-cruiser: CI gate（push/PR で必ず通る）。再 export / barrel file 経由でも検出可能（依存グラフベース）
   - ESLint: ローカル即時 feedback（IDE 内で red squiggle）。開発体験 + 教育的効果
   - 単一 tooling では片方の弱点（feedback 遅延 or escape 容易性）を補えない

2. **不変条件 #12（adminNotes 分離）の構造的保証**:
   - dep-cruiser の `repo-no-cross-domain-*` rule で 02a → 02c 経路を禁止
   - builder の API signature が adminNotes を引数で受けない設計
   - type test で `PublicMemberProfile.adminNotes` 不在を固定

3. **append-only / single-use / 状態遷移を API 不在 / 楽観 lock / ALLOWED_TRANSITIONS で守る**:
   - auditLog: UPDATE/DELETE 関数を **そもそも export しない**（型エラーで阻止）
   - magicTokens: `consume` は `WHERE used_at IS NULL` の条件付き UPDATE で楽観 lock
   - syncJobs: ALLOWED_TRANSITIONS テーブルで `running → succeeded/failed` 一方向、逆遷移は throw

4. **`_shared/` 02c 正本の合理性**:
   - 02c が DDL 5 テーブル + boundary tooling を持ち、共有点として最も中心的
   - 02a / 02b は `_shared/` から片方向 import、編集 PR は 02c に向ける
   - `__tests__/_setup.ts` も 02c 提供（02a/02b の test がそれを import）

## 4. ハイレベル PR 観点

| 観点 | 採用案 A の対応 |
| --- | --- |
| 不変条件 #5 D1 boundary | dep-cruiser + ESLint 二重防御 |
| 不変条件 #6 GAS prototype 昇格防止 | `__fixtures__/` を dev only と明記、prod build 除外 |
| 不変条件 #11 admin 本文編集禁止 | adminNotes / auditLog から `member_responses` テーブルへの SQL を 1 行も書かない |
| 不変条件 #12 adminNotes 分離 | builder 経路に存在しない構造、type test で固定 |
| append-only | auditLog UPDATE/DELETE 関数不在（API 不在で守る） |
| single-use | magicTokens.consume が `WHERE used_at IS NULL` 楽観 lock + `usedAt` set |
| 状態遷移 | syncJobs.ALLOWED_TRANSITIONS、`IllegalStateTransition` throw |
| 02a/02b 整合 | `_shared/` 正本 02c、相互一方向 import |

## 5. 採用案の弱み（Phase 8 申し送り）

- **dep-cruiser config の維持コスト**: rule 増加で可読性低下のリスク
  - Phase 8（DRY 化）で domain glob を **配列で抽出**して rule の重複を解消する候補
  - 例: `const DOMAIN_2A = "(members|identities|status|...)\\.ts$";` を生成して 3 rule で再利用

- **ESLint config の apps/web 同期**: 将来 monorepo の apps が増える場合、各 app の eslint.config.js に同 rule を複製する負担
  - Phase 8 で eslint shared config として `packages/eslint-config-app/` に切り出す候補

## 6. サブタスク完了確認

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 案 A 採用根拠 | completed |
| 2 | 案 B/C/D/E reject 理由 | completed |
| 3 | PASS 判定 | completed |
| 4 | 弱み 申し送り（Phase 8） | completed |

## 7. 完了条件チェック

- [x] 3 案以上の alternative（A〜F の 6 案）
- [x] PASS 判定が記述
- [x] 採用案の弱みが Phase 8 に申し送り

## 8. 次 Phase 引き継ぎ事項

- 採用案 A、boundary tooling 二重防御
- Phase 4 で AC-1〜AC-11 を verify suite として定義する
