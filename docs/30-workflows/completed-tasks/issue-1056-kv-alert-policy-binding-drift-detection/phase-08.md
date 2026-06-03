# Phase 8: DRY 化・リファクタリング（重複排除・既存資産再利用・over-abstraction 回避）

> **Automation-30 改善追記（2026-06-02）**
> 本 Phase 作成当初の「実コード編集は後続」表現は historical context。`loadExpected()` 再利用、`BindingPolicyDrift` 分離、const mapping、`cf.sh alerts` 体系への追加は今回サイクルで実装済み。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフト検知（issue-1056 / issue-57-followup-003） |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化・リファクタリング |
| 作成日 | 2026-06-02 |
| 前 Phase | 7 (AC / カバレッジマトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1056（**現状 OPEN** のまま参照のみ・mutation user-gated） |

## 目的

本検知モジュールが既存資産を最大限再利用し、重複コードと over-abstraction の双方を回避していることを確定する。具体的には (1) policy `enabled` 取得は `load.ts` の `loadExpected().policies` を再利用して JSON 再パースを作らない、(2) CLI は新スクリプトを生やさず `cf.sh alerts` 体系に同型サブコマンドとして追加する、(3) drift 表現は既存 `Drift` union と別型 `BindingPolicyDrift` に分離して責務を混線させない、(4) mapping は const で十分であり設定ファイル化・汎用 framework 化しない、を判断基準とともに記録する。これらの判断は今回サイクルの実装済みコードに反映済み。

## 既存資産再利用による重複排除

| 再利用元（既存資産） | 再利用する責務 | 重複を作らない理由 | 対応 AC |
| --- | --- | --- | --- |
| `infra/cloudflare-alerts/lib/load.ts` `loadExpected(repoRoot).policies` | policy JSON の読込 + canonical 化（`CanonicalPolicy.enabled`） | policy JSON を `binding-policy-drift.ts` から再 read / 再 parse すると quota-base 適用・canonical 化ロジックが二重化する。`loadExpected` を呼ぶだけで `enabled` を正本取得できる | AC-2 |
| `infra/cloudflare-alerts/lib/types.ts` `CanonicalPolicy` | policy の型（`name` / `enabled`） | 新規 policy 型を再定義せず import。型の単一正本を維持 | AC-2 |
| `infra/cloudflare-alerts/lib/cli.ts` `runCli` switch / `usage()` / `Flags` / exit code 規約 | CLI ディスパッチ・フラグ解釈・exit code（0/2/64） | 新スクリプトを作らず `cmdBindingDrift` を switch に 1 行追加。`Flags`（`--json` 等）と usage を再利用 | AC-5 |
| `scripts/cf.sh` `alerts` allowlist（case 文）+ tsx 実行経路 | サブコマンド allowlist + Node 24/tsx 実行ラッパ | `binding-drift` を allowlist に 1 行追加するだけ。新 wrapper script を作らない | AC-5 |
| `package.json` `cf:alerts:*` / `test:alerts` | npm script 正本 + vitest glob | `cf:alerts:binding-drift` を 1 行追加。`test:alerts` は `__tests__` 全体 glob のため新 spec を自動包含（明示追加不要） | AC-5 / AC-6 |

## 重複を意図的に避けた分離（責務分離）

| 論点 | 分離の方針 | 根拠 |
| --- | --- | --- |
| drift 型 | 既存 `Drift`（宣言 vs デプロイ）と **別型** `BindingPolicyDrift`（活性 vs enabled）を新設 | 突合軸が異なる別ガード。`Drift` を拡張すると `diffPolicy` / `diffWebhook` と意味が混線し、両者の field が肥大化する。型分離が DRY 違反でないのは「同じ概念の重複」ではなく「異なる概念」だから |
| CLI 経路 | `cmdBindingDrift` は `cmdDiff` と別関数。`setAlertTokenMode` / `loadActual` を共有しない | `cmdDiff` は Cloudflare API を呼ぶ（secret 必須）。binding-drift は local-only。共有すると read-only / secret 不要の不変条件が壊れる |
| CI job | 既存 `diff` job（secret 使用）に相乗りせず PR `validate` job（secret 不要）に step 追加 | local-only 検知のため secret job への混入は不要な権限拡大。job 分離で全 PR 強制を最小コストで実現 |

## over-abstraction 回避

| 過剰抽象の誘惑 | 不採用の判断 | 採用する最小形 |
| --- | --- | --- |
| binding↔policy mapping を JSON / YAML 設定ファイル化 | mapping は KV→2件 / R2→1件 の 2 エントリのみ。設定ファイル化は読込 IO・schema 検証・テストを増やすだけで価値ゼロ | `BINDING_POLICY_MAP` を `as const` でコード内に固定（型で読み取り専用保証） |
| 汎用 "binding parser framework"（任意 binding kind を plugin 化） | 対象は KV / R2 の 2 kind のみ。汎用化は将来要件の投機（YAGNI 違反） | `BindingKind = "kv" \| "r2"` の閉じた union + 直書き分岐 |
| drift 検知の汎用 rule engine 化 | drift 判定は active×enabled の 2×2 真理値表のみ。engine 化は分岐を隠蔽し可読性を下げる | `buildBindingPolicyDrift` 内の素朴な if/else（2 種列挙） |
| wrangler 解析の TOML ライブラリ導入 | TOML ライブラリはコメント block を捨て active/commented を区別不能（ALERT_DEDUP_KV 判定不可）。導入は依存追加 + 要件未達 | コメント尊重の自作 line parser（数十行・依存ゼロ） |

> over-abstraction 回避は CONST（必要十分・先回り抽象禁止）に整合。mapping が将来 3 kind 以上に増えたら、その時点で初めて設定化を検討する（投機的に今やらない）。

## 命名一貫性

| 観点 | 規則 | 本タスクでの適用 |
| --- | --- | --- |
| モジュールファイル名 | kebab-case（既存 `quota-base.ts` と整合） | `binding-policy-drift.ts` |
| 関数名 | camelCase（既存 `loadExpected` / `diffPolicy` と整合） | `parseActiveBindings` / `buildBindingPolicyDrift` / `loadActiveBindings` |
| 型名 | PascalCase（既存 `CanonicalPolicy` / `Drift` と整合） | `BindingKind` / `ActiveBindingSet` / `BindingPolicyMapping` / `BindingPolicyDrift` |
| const | UPPER_SNAKE（mapping テーブル） | `BINDING_POLICY_MAP` |
| CLI サブコマンド | kebab-case（既存 `list` / `diff` / `plan` / `apply` と並ぶ） | `binding-drift` |
| npm script | `cf:alerts:<sub>` 形式 | `cf:alerts:binding-drift` |
| drift ラベル | UPPER_SNAKE（出力ラベル） | `MONITORING_GAP` / `STALE_MONITORING` |
| テストファイル | `<module>.spec.ts`（不変条件 #8） | `binding-policy-drift.spec.ts` |

## 実行タスク

1. 既存資産（`load.ts` / `types.ts` / `cli.ts` / `cf.sh` / `package.json`）の再利用点を重複排除表として固定する（完了条件: 再利用元 5 件が表に存在し AC に紐付く）。
2. 既存 `Drift` 型・`cmdDiff` 経路・`diff` job との分離を責務分離表として固定する（完了条件: 分離 3 件が根拠付きで記述）。
3. over-abstraction 4 件（設定ファイル化 / 汎用 framework / rule engine / TOML ライブラリ）を不採用理由とともに記録する（完了条件: 過剰抽象回避表が存在）。
4. 命名一貫性（kebab-case モジュール / camelCase 関数 / PascalCase 型 / UPPER_SNAKE const）を既存命名と照合する（完了条件: 命名一貫性表が既存資産と整合）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | 関数シグネチャ / 設計上の選択 6 件 / 変更ファイル 7 件 |
| 必須 | phase-03.md | 代替案 A〜E（B/C 不採用根拠 = 重複・発見性） |
| 必須 | infra/cloudflare-alerts/lib/load.ts | `loadExpected` 再利用元 |
| 必須 | infra/cloudflare-alerts/lib/diff.ts | 既存 `Drift` union（排他確認） |
| 必須 | infra/cloudflare-alerts/lib/cli.ts | switch / usage / Flags / exit code 再利用元 |
| 必須 | scripts/cf.sh | alerts allowlist 再利用元 |

## スコープ

### 含む

- 既存資産再利用（重複排除）の設計確定
- 既存 `Drift` / `cmdDiff` / `diff` job との責務分離の確定
- over-abstraction 回避の判断記録
- 命名一貫性の照合

### 含まない

- 追加の実コード編集（今回サイクルの実装済み 7 ファイルを越える範囲）
- 既存 `load.ts` / `diff.ts` / `cli.ts` 既存関数のリファクタリング（本タスクは追加のみ・既存に手を入れない）
- mapping の設定ファイル化・汎用化（over-abstraction として不採用）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 再利用境界（`load.ts` 再利用部分は coverage 対象外）を AC マトリクスへ反映済 |
| Phase 9 | 重複排除（新 IO なし）/ over-abstraction 回避を line budget（QG-5）の根拠に渡す |
| Phase 10 | 既存資産整合・責務分離を最終レビューの「変更ファイル 7 件整合」へ渡す |

## 多角的チェック観点

- policy 読込が `load.ts` 再利用で重複していないか（`binding-policy-drift.ts` 内に policy JSON 直 read がないこと）。
- 新スクリプトファイルを `scripts/` に増やしていないか（`cf.sh alerts` 体系への同型追加に留まること）。
- 既存 `Drift` 型を拡張していないか（別型 `BindingPolicyDrift` で分離）。
- mapping が const で十分か、設定ファイル化していないか（YAGNI）。
- 既存関数（`loadExpected` / `cmdDiff`）に破壊的変更を入れていないか（追加のみ）。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 既存資産再利用（重複排除）表の固定 | completed | `load.ts` 等 5 件 |
| 2 | 既存 `Drift` / `cmdDiff` / `diff` job 分離の固定 | completed | 責務分離 3 件 |
| 3 | over-abstraction 回避の記録 | completed | 過剰抽象 4 件不採用 |
| 4 | 命名一貫性の照合 | completed | 既存命名と整合 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | （本 phase-08.md に内包。artifacts.json では別 main.md を持たない） | 重複排除表 / 責務分離表 / over-abstraction 回避表 / 命名一貫性表 |
| メタ | artifacts.json `phases[7].outputs` | 空配列（本 phase-08.md が正本） |

> **Automation-30 改善後の現行状態**: `load.ts` 再利用配線、責務分離、const mapping は今回サイクルで実装済み。

## 完了条件 (Acceptance Criteria for this Phase)

- [x] policy 読込が `load.ts` `loadExpected().policies` 再利用で JSON 再パースを作らない方針が記録されている
- [x] CLI が `cf.sh alerts` 体系への同型サブコマンド追加で新スクリプトを作らない方針が記録されている
- [x] drift 表現が既存 `Drift` と別型 `BindingPolicyDrift` に分離され責務が混線しない方針が記録されている
- [x] over-abstraction（mapping 設定ファイル化 / 汎用 framework / rule engine / TOML ライブラリ）が不採用理由とともに回避されている
- [x] 命名一貫性（kebab-case モジュール / camelCase 関数 / PascalCase 型 / UPPER_SNAKE const）が既存資産と照合されている
- [x] 既存関数への破壊的変更がなく「追加のみ」であることが記述されている

## タスク100%実行確認【必須】

- 全実行タスク（4 件）が `completed`
- artifacts.json で Phase 8 は別 output を持たないため、本 phase-08.md が正本
- 再利用元 5 件・責務分離 3 件・over-abstraction 回避 4 件が記録済み
- artifacts.json の `phases[7].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - 重複排除（新 IO なし）/ over-abstraction 回避を line budget（QG-5）の根拠に渡す
  - 「既存関数は追加のみ・破壊的変更なし」を変更範囲ゲート（QG-7）の基準に渡す
  - 既存 `Drift` との型分離を read-only 検証（QG）へ申し送り
- ブロック条件:
  - policy 読込に重複（JSON 再 read）が残る
  - 既存 `Drift` 型を拡張してしまう（責務混線）
