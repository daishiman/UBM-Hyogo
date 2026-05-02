# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-stablekey-literal-lint-enforcement |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 8b (lint config follow-up) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |
| Issue | #192 (CLOSED — 仕様書のみ再生成) |

## 目的

03a AC-7「stableKey 文字列リテラル直書き禁止」を、規約 + ユニットテストによる暫定担保から、lint / 静的検査レベルで CI が必ず fail する fully enforced 状態へ昇格させるための要件を、AC-1〜7 に quantitative に落とす。
許可された stableKey 供給モジュール（正本）を allow-list として明示し、許可外モジュールでの hard-coded 文字列リテラル出現を CI が検出する仕組みの要件、例外境界、開発者 DX、不変条件 #1 との射程整合を Phase 1 で確定する。

## 真の論点 (true issue)

- **論点 1**: 検出方式として「ESLint custom rule（`@typescript-eslint/utils` の AST 走査）」と「ts-morph ベース static script」のどちらを正本にするか。custom rule は monorepo lint pipeline に自然統合でき IDE で即時 feedback が得られる一方、ts-morph script は型情報を伴う高度な判定（symbol 解決 / declared origin 追跡）が容易。Phase 2 で alternative 比較を行うが、Phase 1 では「IDE 即時 feedback の重み付け」と「型情報依存の必要性」を要件として確定する。
- **論点 2**: stableKey 文字列の「判定ロジック」をどう定義するか。候補は 3 つある。(a) 正規表現マッチ（例: `/^[a-z][a-z0-9_]+$/` の特定 prefix を持つリテラル）、(b) 既知 stableKey enum / Zod schema との照合（正本モジュールから export された定数集合と完全一致するリテラル）、(c) AST node 種別 + 文字列内容の二重判定。本タスクは false positive 0 を AC-7 で求めるため、(b) 正本由来の有限集合との完全一致を一次方式とし、(a) は補助とする。
- **論点 3**: allow-list の表現粒度。filepath glob、package name、declared origin module（symbol が export された source）の 3 候補。`packages/shared/src/zod/field.ts` と `packages/integrations/google/src/forms/mapper.ts` 両方を起点に、既存ファイル構成と競合しない glob パターンを Phase 2 で固定する。
- **論点 4**: 例外境界。tests / fixtures / migration seed / docs のうち、どこまで「リテラル許可」とするか。テストコードでは正本との一致を意図的に書きたい場面が多いため override が必要だが、override 範囲を広げすぎると enforce 効果が薄れる。Phase 1 では「`*.test.ts(x)` / `__fixtures__/**` / `__tests__/**` / `migrations/seed/**` / `docs/**`」を例外候補として確定し、それ以外（生 prod コード）に override が必要なケースは「正本モジュールへの import に置き換える」を原則とする。
- **論点 5**: 「fully enforced」昇格のタイミング。本タスクは false positive 0 を最優先するため、Phase 10 の 3 段階リリース（warning / 7 日 monitor / error）を正とする。AC-7 の「fully enforced」表記は error 昇格と同じ wave でのみ更新する。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | 03a 本体 | AC-7 の convention-only 状態 / 正本モジュール構造 | enforce 化済み AC-7 / 03a workflow 側の AC-7 ステータス更新 diff |
| 上流 | wave 8b lint config | ESLint custom rule 配置先（共通 package or per-app）と lint pipeline 構成 | rule 仕様 / allow-list 設定 / 例外境界 |
| 上流 | `packages/shared/src/zod/field.ts` | stableKey 正本 export | allow-list entry / 既知 stableKey enum 集合 |
| 上流 | `packages/integrations/google/src/forms/mapper.ts` | stableKey 正本 export（mapping side） | allow-list entry |
| external gate | CI（GitHub Actions lint job） | 既存 lint job 実行基盤 | 違反時 fail の最終 gate |
| 関連 | 03b workflow | （共通基盤化された場合の自動波及範囲） | 共通 rule 仕様 |

## 価値とコスト

- **初回価値**: 不変条件 #1（実フォーム schema をコードに固定しすぎない / stableKey 二重定義禁止）を、人間レビューに依存せず CI 静的検査で恒久保護できる。03a AC-7 を「convention-only」→「fully enforced」に格上げでき、03a workflow の closed-loop 化が完了する。レビュー漏れによる drift（stableKey 二重定義 → schema sync 差分誤検知）を構造的に閉塞する。
- **初回で払わないコスト**: ランタイム guard、03b 側への明示的な展開（共通基盤化で自動波及するため別タスクで管理）、stableKey 値そのものの仕様変更、lint 設定基盤の刷新。これらは scope out とし、本タスクは AC-7 enforce 化の単一スコープに集約する。
- **トレードオフ**: 検出方式が AST + symbol 解決寄りに振れるほど精度は上がるが lint 走行時間と保守コストが増える。本タスクは「正本由来の有限集合との完全一致」を一次方式とし、`@typescript-eslint/utils` の AST 走査で十分な精度を達成する設計を Phase 2 で確定する。
- **DX トレードオフ**: error 即時化により、新規開発者が誤って stableKey リテラルを書いた場合に IDE / pre-commit / CI のいずれかで即座に弾かれる。導線として「正本モジュールから import する」エラーメッセージを Phase 2 で必須要件化する。

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 不変条件 #1 を静的に保護できるか | PASS | 許可外モジュールへの hard-coded literal を CI fail で 100% 検出可能（AC-1, AC-4） |
| 実現性 | 既存 lint 基盤上に rule 追加が現実的か | PASS | wave 8b lint config 完了後、`@typescript-eslint/utils` AST 走査で実装可能（既知パターン） |
| 整合性 | 既存 03a 実装が suppression 無しで PASS するか | PASS（Phase 1 確認要） | 03a 完了済み実装は規約遵守。AC-3 で再確認 |
| 運用性 | false positive 0 で運用可能か | PASS（運用要件） | allow-list メンテ手順 + 例外境界明確化（AC-2, AC-5, AC-7） |

## 実行タスク

- [ ] AC-1〜7 を quantitative に記述（rule 仕様 / allow-list / 既存 PASS / 違反 FAIL / 例外ポリシー / 親 AC-7 更新 / false positive 0）
- [ ] 真の論点 5 件と非採用案を `outputs/phase-01/main.md` に記録
- [ ] 4 条件評価の根拠を埋める
- [ ] Phase 2 への open question（rule 配置先、allow-list 表現粒度、エラーメッセージ、IDE 即時 feedback 要件）
- [ ] Issue #192 が CLOSED のまま再仕様化されている旨を Phase 1 main.md 冒頭に明記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-03a-stablekey-literal-lint-001.md | 元 unassigned-task spec（背景・課題・推奨アプローチ・苦戦箇所） |
| 必須 | docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/implementation-guide.md | AC-7 / Part 2 禁止事項 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #1 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | stableKey 仕様 |
| 必須 | packages/shared/src/zod/field.ts | 正本モジュール #1 |
| 必須 | packages/integrations/google/src/forms/mapper.ts | 正本モジュール #2 |

## 実行手順

### ステップ 1: 元 unassigned-task spec の引き取り
- `task-03a-stablekey-literal-lint-001.md` の Acceptance Criteria 3 件 + Required Work 3 件を、本タスクの AC-1〜7 に拡張的に対応付ける。
- 元 spec の苦戦箇所「monorepo の ESLint custom rule 基盤が wave 8b 待ちで、03a スコープに lint インフラ整備を含めるとスコープ膨張する」を、本タスクの依存境界（wave 8b lint config）として明記。

### ステップ 2: AC quantitative 化
- AC-1: rule 仕様確定（custom rule or ts-morph、検出方式、エラーメッセージ）
- AC-2: allow-list（最低 2 正本 + 候補列挙）
- AC-3: 既存 03a 実装 suppression 0 で PASS（数値: violation 0 件）
- AC-4: 違反 fixture で CI fail（dry-run PR 1 件で確認）
- AC-5: 例外ポリシー（filepath glob 5〜6 件で表現）
- AC-6: 親 03a workflow 側 AC-7 ステータス文字列更新 diff（implementation-guide.md 該当箇所）
- AC-7: false positive 0（既存全 lint 走行で violation 0 件）

### ステップ 3: 真の論点 5 件記録 + 4 条件評価 + handoff
- 5 論点と非採用理由
- 4 条件評価
- Phase 2 への open question（rule 配置先 / allow-list 表現 / エラーメッセージ / IDE feedback）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | rule 仕様 / allow-list / 例外境界 |
| Phase 4 | 既存 PASS / 違反 FAIL の test matrix |
| Phase 6 | 違反 fixture / bypass 試行 |
| Phase 7 | apps / packages 全域 lint 走行 |
| Phase 11 | lint pass log / 違反 fixture fail log |
| Phase 12 | 親 03a workflow AC-7 更新 diff |

## 多角的チェック観点

- 不変条件 **#1**: 実フォーム schema をコードに固定しすぎない（stableKey 二重定義の構造的閉塞）
- 不変条件 **#2**: consent キーは `publicConsent` / `rulesConsent` 統一（リテラル直書き禁止 rule の射程に consent 系も含めるかを Phase 2 で判定）
- 不変条件 **#4**: D1 への直接アクセスは `apps/api` に閉じる（schema 関連リテラル境界の保護）
- 開発者 DX: IDE 即時 feedback（VSCode ESLint 拡張で squiggle が出る）
- secret hygiene: rule 自体が secret を扱わないことの確認
- bypass 経路: `eslint-disable` コメントによる suppression 監査ポリシー（Phase 9 gate）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 元 unassigned-task spec 引き取り | 1 | pending | task-03a-stablekey-literal-lint-001.md |
| 2 | AC-1〜7 quantitative 化 | 1 | pending | 数値 / glob / diff で表現 |
| 3 | 真の論点 5 件記録 | 1 | pending | 検出方式 / 判定 / allow-list / 例外 / 昇格タイミング |
| 4 | 4 条件評価 | 1 | pending | — |
| 5 | Phase 2 open question 整理 | 1 | pending | rule 配置先・エラーメッセージ・IDE feedback |
| 6 | Issue #192 CLOSED 旨記載 | 1 | pending | Phase 1 main.md 冒頭 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 主成果物（AC-1〜7 / 論点 / 4 条件 / open question） |
| メタ | artifacts.json | phase 1 status |

## 完了条件

- [ ] AC-1〜7 quantitative 化済み
- [ ] 真の論点 5 件 + 4 条件評価記録
- [ ] Phase 2 への open question 明記
- [ ] Issue #192 が CLOSED のまま再仕様化されている旨が記録

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（false positive / suppression 濫用 / bypass 試行 / 例外境界濫用）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 1 を completed

## 次 Phase

- 次: Phase 2 (設計)
- 引き継ぎ: 検出方式（custom rule 寄り / ts-morph 寄り）、allow-list 表現粒度（filepath glob ベース）、例外境界 5〜6 glob、エラーメッセージ要件、IDE 即時 feedback 要件
- ブロック条件: AC-1〜7 quantitative 化未完なら Phase 2 不可。wave 8b lint config の rule 配置先未確定でも Phase 2 設計は進行可（配置先は alternative として記録）。
