[実装区分: 実装仕様書]

# Phase 1: 要件定義

> **Issue #393 は CLOSED 状態のまま再仕様化される。本タスクは親 03a-stablekey-literal-lint-enforcement の post-condition である「legacy literal 0 化」を引き取り、strict CI gate 昇格を可能とする state へ持ち込むための実装仕様である。**

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-393-stablekey-literal-legacy-cleanup |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Mode | sequential |
| 作成日 | 2026-05-03 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |
| Issue | #393 (CLOSED — 仕様書のみ再生成) |

## 目的

親 workflow `03a-stablekey-literal-lint-enforcement` で配備された静的検査スクリプト
`scripts/lint-stablekey-literal.mjs` の strict 実行で残存している **148 violation / 14 ファイル** の legacy stableKey 文字列リテラルを、正本 supply module 経由の named import 参照に置換するための要件を AC-1〜7 に quantitative に落とす。

不変条件 #1（stableKey 二重定義禁止 / 正本一元管理）の静的保護を完成させる最終ステップとして、置換対象の family 分割粒度・正本 import 方式・既存挙動同一性の保証手順を Phase 1 で確定する。

## 真の論点 (true issue)

- **論点 1: family 分割と PR 粒度**
  14 ファイルを 7 family にグルーピング済み（A: jobs/mappers, B: repository, C: routes/admin, D: public use-case/view-model, E: profile components, F: public components, G: shared utils consent）。
  これを (a) 単一 PR 集約、(b) family ごと分割 PR、(c) 全 14 ファイル単一コミット、のいずれで行うか。
  Phase 1 は「solo 開発 / monorepo lefthook coverage guard」を踏まえ **(a) 単一 PR・family 単位コミット** を一次案とし、Phase 3 で alternative 比較を行う。

- **論点 2: 正本 module からの import 方式**
  `packages/shared/src/zod/field.ts` には `FieldByStableKeyZ` (Zod enum) が export されている。
  置換 import 形式の候補:
  - (a) `as const` object literal (`StableKey.fullName` のような名前空間)
  - (b) `string literal type alias` の named export (`STABLE_KEY_FULL_NAME`)
  - (c) `FieldByStableKeyZ` 由来の typed key map（例: `STABLE_KEY.fullName`）参照
  既存 export 構造を尊重し、Phase 2 で正本 module 側の実 export 名を確認した上で確定する。Phase 1 では「新たに正本 module の export 構造を変更しない」を制約として明記する。

- **論点 3: consent.ts (family G) の射程と不変条件 #2 整合**
  `packages/shared/src/utils/consent.ts` は `publicConsent` / `rulesConsent` という stableKey を参照している。これらは不変条件 #2 で「キー名統一」が求められる対象であり、置換後も literal 値が変わらないこと（output 文字列値が `"publicConsent"` `"rulesConsent"` のまま）を保証する必要がある。
  consent ロジックの output が変わると下流（Google Form 回答との突合・正本データ）が壊れるため、置換は **identity 変換** であることを Phase 2 設計と Phase 4 テスト戦略で確認する。

- **論点 4: 既存 strict count 計測テスト (`scripts/lint-stablekey-literal.test.ts`) の更新**
  既存テストは strict mode 期待値を「現状の violation 件数」または「閾値」として保持している可能性がある。本タスク完了時には strict 期待値を **0** に更新する必要がある。Phase 4 で既存テスト構造を確認し、更新範囲を確定する。

- **論点 5: 置換後の挙動同一性保証範囲**
  literal `"fullName"` を `StableKey.fullName` に置換した場合、TypeScript レベルでは型が `"fullName"` literal type に narrow される（または `string` に widen される）。runtime output が同一であることは自明だが、型 narrowing が呼び出し側に影響を与えないかを mapper / view-model / repository 各層で確認が必要。Phase 4 / Phase 7 で focused vitest と typecheck を gate 化する。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | 03a-stablekey-literal-lint-enforcement | strict 検査スクリプト / allow-list 仕様 / warning_mode 配備済 | strict violation 0 state |
| 上流 | `packages/shared/src/zod/field.ts` | `FieldByStableKeyZ` (31 stableKey enum) | 既存 export 構造を不変のまま import 利用 |
| 上流 | `packages/integrations/google/src/forms/mapper.ts` | mapping 正本 export | 既存 export を不変のまま import 利用 |
| 下流 | 後続 strict CI gate 昇格タスク | strict_ready state（violation 0 / focused test PASS） | required check 昇格判断材料 |
| 関連 | apps/web / apps/api / packages 全 14 ファイル | 既存挙動 | 同一挙動 + canonical import 採用 |

## 価値とコスト

- **初回価値**: 親 03a workflow が warning_mode で停止していた最終 gate（148 件の legacy violation）を解消し、strict CI required check 昇格の前提を整える。不変条件 #1 の構造的保護が完成し、stableKey drift（二重定義・typo・mapping ズレ）を構造的に閉塞できる。
- **初回で払わないコスト**: required check 昇格そのもの・runtime guard・stableKey 値変更・新規 schema 追加。これらは scope out。
- **トレードオフ**: family 単位の細分化が進むほどレビュー粒度は上がるが、merge コストと sync-merge 時の競合リスクが増える。本タスクは「単一 PR 内で family 単位コミット」を Phase 3 で評価採用する。
- **DX 影響**: 置換後は新規開発者が stableKey を扱う際に IDE で `import { StableKey } from ...` の補完が効く。strict 昇格前から legacy 置換が完了している状態は、開発者が「正本 import が標準」と認識する強い signal になる。

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | strict CI gate 昇格の前提が整うか | PASS | violation 0 + stableKeyCount=31 維持で AC-7 達成可能 |
| 実現性 | 14 ファイルの literal 置換が単一 PR で完了可能か | PASS | family 7 分割で sequential 適用可能、既存テストで挙動同一性検証可能 |
| 整合性 | 既存挙動を変えずに置換可能か | PASS（要 Phase 4 確認） | identity 置換のため runtime output 不変、focused test で gate 化 |
| 運用性 | suppression 0 件で達成可能か | PASS | 正本 import で代替可能、`eslint-disable` 一切不要（AC-6） |

## 実行タスク

- [ ] AC-1〜7 を quantitative に記述（violation 0 / stableKeyCount=31 / focused test list / typecheck / lint / suppression 0 / 親 AC-7 更新計画）
- [ ] 真の論点 5 件と非採用案を `outputs/phase-01/main.md` に記録
- [ ] 4 条件評価の根拠を埋める
- [ ] Phase 2 への open question（family 別 import 名 / 正本 export 確認 / consent identity 保証 / strict count test 更新範囲）
- [ ] Issue #393 が CLOSED のまま再仕様化されている旨を Phase 1 main.md 冒頭に明記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-03a-stablekey-literal-legacy-cleanup-001.md | 元 unassigned-task spec（背景・苦戦箇所・完了条件） |
| 必須 | docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/outputs/phase-12/implementation-guide.md | 親 AC-7 enforce 仕様 |
| 必須 | scripts/lint-stablekey-literal.mjs | strict 検査スクリプト |
| 必須 | scripts/lint-stablekey-literal.test.ts | strict 期待値 update 対象 |
| 必須 | packages/shared/src/zod/field.ts | 正本 module #1 |
| 必須 | packages/integrations/google/src/forms/mapper.ts | 正本 module #2 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #1 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | stableKey 仕様 |

## 実行手順

### ステップ 1: 元 unassigned-task spec の引き取り
- `task-03a-stablekey-literal-legacy-cleanup-001.md` の「完了条件 4 件」「検証方法 4 件」「リスクと対策 3 件」を本タスク AC-1〜7 へ写像。
- 苦戦箇所「strict mode に既存 literal が残るため CI blocking 昇格不可」を本タスク purpose の根拠として引き取る。

### ステップ 2: AC quantitative 化
- AC-1: strict violation 0（before 148）
- AC-2: stableKeyCount=31 が warning/strict 両モードで保持
- AC-3: focused test PASS（mapper / public member view / consent / admin members / admin requests / repository builder）
- AC-4: typecheck PASS
- AC-5: lint PASS（既存 ESLint + strict 検査両方）
- AC-6: suppression 新規追加 0 件
- AC-7: 親 AC-7 strict 昇格可能 state 到達 + Phase 12 で更新計画提出

### ステップ 3: 真の論点 5 件記録 + 4 条件評価 + handoff
- 論点 5 件と各非採用理由
- 4 条件評価
- Phase 2 への open question（import 方式 / family 別 import 名 / consent identity / 既存テスト更新範囲）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | family 別置換設計 / import 名 / 関数シグネチャ不変方針 |
| Phase 4 | family 別 focused test list / strict count 期待値更新 |
| Phase 5 | family sequential 実装ランブック |
| Phase 6 | 違反 fixture 1 行追加 fail 確認 / suppression bypass 試行 |
| Phase 7 | 統合 lint / typecheck / vitest / strict 検査 evidence |
| Phase 12 | 親 03a workflow AC-7 更新計画 |

## 多角的チェック観点

- 不変条件 **#1**: stableKey 正本一元管理（本タスクの主目的）
- 不変条件 **#2**: consent キー統一（family G 置換が identity 変換であること）
- 不変条件 **#4**: D1 直接アクセス境界（family B repository 層の置換境界保護）
- 開発者 DX: IDE 補完で `StableKey.*` が出る
- secret hygiene: stableKey は非機密、置換に伴う secret 露出はない
- bypass 経路: `eslint-disable` 追加禁止（AC-6）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 元 unassigned-task spec 引き取り | 1 | pending | task-03a-stablekey-literal-legacy-cleanup-001.md |
| 2 | AC-1〜7 quantitative 化 | 1 | pending | 数値 / file list / diff で表現 |
| 3 | 真の論点 5 件記録 | 1 | pending | 分割粒度 / import 方式 / consent / 既存 test / 挙動同一性 |
| 4 | 4 条件評価 | 1 | pending | — |
| 5 | Phase 2 open question 整理 | 1 | pending | family 別 import 名 / 正本 export 確認 |
| 6 | Issue #393 CLOSED 旨記載 | 1 | pending | Phase 1 main.md 冒頭 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 主成果物（AC-1〜7 / 論点 / 4 条件 / open question） |
| メタ | artifacts.json | phase 1 status |

## 完了条件

- [ ] AC-1〜7 quantitative 化済み
- [ ] 真の論点 5 件 + 4 条件評価記録
- [ ] Phase 2 への open question 明記
- [ ] Issue #393 が CLOSED のまま再仕様化されている旨が記録

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（consent identity 崩壊 / 型 narrowing 副作用 / 既存テスト想定外 fail / suppression 濫用）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 1 を completed

## 次 Phase

- 次: Phase 2 (設計)
- 引き継ぎ: 7 family 分割確定 / 正本 import 方式 3 候補 / consent identity 制約 / 既存 strict count test 更新範囲
- ブロック条件: AC-1〜7 quantitative 化未完なら Phase 2 不可。正本 module の実 export 構造確認は Phase 2 で実施可。
