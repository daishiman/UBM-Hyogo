# Issue #577 followup 003 / D1 利用テストの grouping refactor（軸E）- タスク指示書

## メタ情報

```yaml
issue_number: 618
status: expanded_consumed_by_issue_617_workflow
consumed_by: docs/30-workflows/issue-617-ci-test-time-reduction-split/
consumed_at: 2026-05-11
```

## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | task-issue-577-followup-003-test-grouping-by-d1-usage |
| タスク名     | D1 利用テストの grouping refactor（軸E） |
| 分類         | 改善（refactor） |
| 対象機能     | `@ubm-hyogo/api` test suite / Vitest config |
| 優先度       | 低（最終手段） |
| 見積もり規模 | 大規模 refactor |
| ステータス   | expanded_consumed_by_issue_617_workflow |
| GitHub Issue | #618 |
| 発見元       | Issue #577 Phase 12 implementation-guide.md L62-69 「別 Issue 候補」 |
| 発見日       | 2026-05-09 |

## 2026-05-11 追記: Issue #617 workflow への拡張移管

この follow-up は歴史的には GitHub Issue #618 として記録されているが、ユーザー要望により closed Issue #617 の CI test time reduction 文脈へ拡張され、次の workflow に consumed trace として移管した。

- 移管先: `docs/30-workflows/issue-617-ci-test-time-reduction-split/`
- 移管理由: 原案の apps/api D1 grouping に加え、apps/web / packages を含む CI coverage shard 化まで同一サイクルで設計するため
- Issue 取扱: #617 は CLOSED 維持。PR 文脈は `Refs #617` のみを使い、`Closes` / `Fixes` / `Resolves` は使わない
- #618 取扱: 本ファイルの履歴番号として保持し、新規未タスクとしては扱わない

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #577 で軸 B（`--maxWorkers=1`）が採用され port exhaustion は解消したが、wall-clock は 506s と長い。followup-001（軸 D shard）と followup-002（上流追跡）が両方とも限界に達した場合の最終手段として、D1/Miniflare を使う heavy test と pure unit test を物理的に分離する案が残されている。

### 1.2 問題点・課題

現状すべての test が同一 vitest config / 同一 npm script で実行されるため、D1 を使わない pure unit test まで serial 化されて時間を浪費している。grouping すれば unit group は parallel、D1 group のみ serial で全体時間を短縮できる可能性がある。

### 1.3 放置した場合の影響

- 軸 B / 軸 D で頭打ちになった際の改善余地が無くなる
- 将来 test 数増加で CI 時間が線形に悪化する
- D1 binding 依存の境界が test ファイルに暗黙化したまま残り、保守性が下がる

---

## 2. 何を達成するか（What）

### 2.1 目的

D1 binding を使う test と使わない test を物理的に分離し、別 vitest config / 別 npm script で実行できるようにする。D1 group は serial、unit group は parallel で全体 wall-clock を短縮する。

### 2.2 最終ゴール

- `apps/api` の test ファイルが「D1 group」「unit group」に明示的に分類されている
- 別 vitest config（例: `vitest.d1.config.ts` / `vitest.unit.config.ts`）が存在する
- 別 npm script（例: `test:coverage:d1` / `test:coverage:unit`）が存在する
- CI workflow が両 group を実行し coverage を merge する
- 全体 wall-clock が軸 B 単独より短縮されている evidence がある

### 2.3 スコープ

#### 含むもの

- 既存 test ファイルの D1 binding 依存調査と仕分け
- 新 vitest config 2 種の作成
- npm script 分割
- CI workflow 更新
- coverage merge 戦略の確立
- before/after evidence

#### 含まないもの

- `apps/api` 実装ロジック変更
- D1 schema 変更
- coverage 閾値変更
- 既存 test の assertion 内容変更
- commit / push / PR 作成
- 他タスクへの侵食

### 2.4 成果物

- 新 vitest config ファイル
- 仕分け結果一覧（test ファイル → group マッピング）
- `apps/api/package.json` script 差分
- CI workflow 差分
- before/after wall-clock evidence

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Issue #577 軸 B 設定が稼働
- followup-001 / followup-002 の評価が完了し限界判定されている（最終手段としての発動条件）
- ローカルで test:coverage が PASS

### 3.2 依存タスク

- 親: `docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/`
- 前提: followup-001（shard）, followup-002（上流追跡）の限界判定

### 3.3 必要な知識

- Vitest multi-config / projects 機能
- Miniflare D1 binding の test 内利用パターン
- coverage merge ツール（istanbul / nyc / vitest merge-reports）

### 3.4 推奨アプローチ

import grep と AST 走査で D1 binding 依存テストを検出し、移動ではなく config の `include` / `exclude` で論理分離する案を優先する（diff 最小化）。物理移動が必要な場合のみ慎重に行う。

---

## 4. 実行手順

### Phase 1: 依存調査

#### 目的

各 test ファイルが D1 binding を使うか判定する。

#### 手順

1. `apps/api` 配下の test ファイルを列挙
2. `env.DB`, `D1Database`, Miniflare D1 setup 等の import / 利用を grep
3. D1 / unit に分類しマッピング表を作成

#### 完了条件

- 全 test ファイルが分類されている

### Phase 2: config 分割

#### 目的

物理 / 論理分離を確立する。

#### 手順

1. `vitest.d1.config.ts` を作成（`maxWorkers=1`）
2. `vitest.unit.config.ts` を作成（`maxWorkers=auto`）
3. それぞれの `include` を分類結果に基づき設定
4. `package.json` に `test:coverage:d1` / `test:coverage:unit` / `test:coverage`（両方+merge）を追加

#### 完了条件

- 両 group が個別に PASS する

### Phase 3: CI 更新と evidence

#### 目的

CI を新構成に切替え、wall-clock 短縮を検証する。

#### 手順

1. workflow を 2 job 並列化
2. coverage を merge
3. before/after evidence を記録

#### 完了条件

- 両 job PASS、merge coverage が閾値を満たす、wall-clock 短縮が確認できる

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] D1 group / unit group が分離され両方 PASS
- [ ] coverage merge が閾値を満たす
- [ ] port exhaustion 非再発

### 品質要件

- [ ] 実装ロジック・schema・閾値を変更していない
- [ ] 既存 assertion を変更していない

### ドキュメント要件

- [ ] 仕分け結果と before/after evidence が残っている

---

## 6. 検証方法

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:unit
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage
```

期待: 個別・統合とも exit 0、merge 後 coverage が既存閾値を満たす。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| 誤分類で D1 依存 test が unit group に入り並列実行で port exhaustion 再発 | 高 | 中 | 初回は保守的に分類し、疑わしきは D1 group。CI で 0 EADDRNOTAVAIL を gate にする |
| coverage merge 失敗で閾値判定崩壊 | 高 | 中 | merge 前に per-group artifact を保持し、failsafe として single-config 実行を残す |
| integration test の境界曖昧で grouping が定まらない | 中 | 高 | binding 利用の有無を機械判定可能なルールに固定（grep + AST） |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-12/implementation-guide.md`
- `apps/api/package.json`
- `apps/api/vitest.config.ts`（または相当）

### 参考資料

- Vitest projects / multi-config 機能
- aiworkflow-requirements: `D1 直接アクセスは apps/api 経由のみ`（不変条件 5）

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 軸 B / 軸 D 両方が限界に達した場合のみ発動する最終手段で、refactor が大規模 |
| 原因 | 既存 test の D1 依存関係が暗黙的で、機械的に仕分けるルールが不在 |
| 対応 | 事前に依存調査を行い、grep + AST + 命名規約の三段階で機械判定する |
| 再発防止（future-self への観点） | (1) D1 依存の機械判定ルールを CI gate 化し、新規 test の誤分類を継続的に防ぐ (2) test ファイル命名規約（`*.d1.test.ts` / `*.unit.test.ts`）を導入する選択肢を残す (3) integration test の境界（D1 + 他 binding 併用ケース）の扱いを設計時に決め、3 group 化の余地を残す (4) coverage merge は per-group artifact + 統合 job の二段で必ず failsafe を持つ (5) 軸 B / 軸 D が将来 sufficient になれば本タスクは不要と判断する条件を明示する |

### 補足事項

本タスクは「最終手段」であり、followup-001 / followup-002 を経由せずに着手しない。commit / push / PR 作成はスコープ外。他タスク（UI prototype alignment 等）への侵食を避け、`apps/api` 実装ロジック・D1 schema・coverage 閾値は触らない。`apps/web` から D1 binding に直接アクセスする変更も禁止（aiworkflow-requirements 不変条件 5）。
