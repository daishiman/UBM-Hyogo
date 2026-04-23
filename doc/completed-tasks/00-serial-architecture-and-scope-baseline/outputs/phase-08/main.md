# Phase 8 出力: main.md
# 設定 DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| Phase | 8 / 13 (設定 DRY 化) |
| 作成日 | 2026-04-23 |
| 状態 | completed |
| 入力 | outputs/phase-07/main.md (全 AC カバー済み / Phase 8 進行 GO) |

---

## 1. Before/After 比較表

以下の3つの統一対象について、Before/After と統一理由を記録する。

### 統一対象 1: branch 記法の統一

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| ブランチ名 (統合ブランチ) | `develop` または `dev` (揺れあり) | `dev` に統一 | 正本仕様 (deployment-branch-strategy.md) が `dev` を使用。`develop` は旧記法であり、下流タスクとの整合性を保つため `dev` に統一する |
| ブランチ名 (本番ブランチ) | `master` または `main` (揺れあり) | `main` に統一 | GitHub のデフォルトが `main` であり、正本仕様も `main` を採用しているため |
| ブランチ/環境対応表の記述 | 表ヘッダーが「ブランチ名」「環境名」で統一されていない場合あり | 「ブランチ」「対応環境」に統一 | canonical-baseline.md セクション2 の表ヘッダーに合わせる |
| ブランチフロー図 | `feature → develop → master` | `feature/* → dev → main` | 正本仕様との整合 |

**検証結果**: 本タスクの全 outputs ファイルは最初から `dev` / `main` で記述されており、事後修正は発生しなかった。今後の記述で `develop` / `master` を使用しないことを本 Phase で明文化する。

---

### 統一対象 2: runtime 記法の統一

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| Web 層の記述 | `OpenNext` または `Cloudflare Pages (OpenNext)` | `Cloudflare Pages` に統一 | OpenNext は実装ライブラリの一つであり、アーキテクチャ記述では採用サービスである `Cloudflare Pages` を使用する。OpenNext は decision-log.md の NA-02 (非採用候補) にのみ記述する |
| API 層の記述 | `Cloudflare Workers (OpenNext)` または `Workers` | `Cloudflare Workers` に統一 | 同上。サービス名で統一 |
| 全体表記 | `OpenNext 構成` | `Pages/Workers 分離構成` | 採用した構成の正式名称に統一 |
| アーキテクチャ図の記述 | `OpenNext` の記述を含む可能性あり | `Cloudflare Pages / apps/web` と `Cloudflare Workers / apps/api` で表記 | canonical-baseline.md セクション1 のアーキテクチャ図表記に統一 |

**検証結果**: 本タスクの outputs ファイルは最初から `Cloudflare Pages` / `Cloudflare Workers` の分離記法で記述されており、`OpenNext` は decision-log.md の NA-02 説明文にのみ登場している。正しく分離されていることを確認した。

---

### 統一対象 3: data ownership の統一

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| Sheets の位置づけ記述 | `Sheets/D1 混線` または曖昧な記述 | `Sheets input (non-canonical)` / `D1 canonical` に統一 | データ所有権の一意性が AC-1 と AC-3 の要件であり、全箇所で `Sheets = 入力源 / D1 = 正本` を明確にする |
| D1 の呼称 | `D1` / `Cloudflare D1` / `SQLite (D1)` の揺れ | `Cloudflare D1` に統一 (略称として `D1` も可) | 正本仕様の表記に合わせる |
| Sheets の呼称 | `Google Sheets` / `Sheets` / `スプレッドシート` の揺れ | `Google Sheets` に統一 (略称として `Sheets` も可) | 正本仕様の表記に合わせる |
| 同期の方向 | `Sheets ↔ D1` (双方向の誤解を招く) | `Sheets → D1` (一方向) | Sheets から D1 への一方向同期が決定されている。D1 から Sheets への書き戻しはスコープ外 |

**検証結果**: 本タスクの outputs ファイルでは全箇所で `Sheets = 入力源` / `D1 = canonical` が一貫して記述されていることを確認した。

---

## 2. 共通化パターン

本タスクで確立した記述ルールを以下に定義する。以後のタスクで参照すること。

### branch/env/secret placement の表現統一ルール

| 項目 | 統一ルール | NG 例 |
| --- | --- | --- |
| ブランチ名 | `feature/*` / `dev` / `main` のみ使用 | `develop`, `master`, `release/*` |
| 環境名 | `local` / `staging` / `production` のみ使用 | `develop環境`, `本番`, `prod` |
| secret 配置 (runtime) | `Cloudflare Secrets` | `env var`, `wrangler secrets` (略称は可) |
| secret 配置 (CI/CD) | `GitHub Secrets` | `GitHub Actions secrets` (略称は可) |
| secret 配置 (local) | `1Password Environments` | `1password`, `1pw` |
| シークレット実値 | `<PLACEHOLDER>` または `<YOUR_SECRET_NAME>` | 実際の値をそのまま記載 |

### outputs 配置ルール統一

| 項目 | ルール |
| --- | --- |
| Phase 出力ファイルのパス | `outputs/phase-XX/main.md` (XX は2桁ゼロパディング) |
| Phase 追加ファイルのパス | `outputs/phase-XX/<descriptive-name>.md` |
| Phase 番号の記述 | `XX / 13` の形式 (例: `4 / 13`) |
| ファイル内のメタ情報 | タスク名 / Phase / 作成日 / 状態 / 入力 を冒頭に必ず記載 |

### 4条件名統一

| 条件 | 統一名称 | NG 例 |
| --- | --- | --- |
| 価値条件 | `価値性` | `有用性`, `ビジネス価値` |
| 実現条件 | `実現性` | `技術的実現可能性`, `フィジビリティ` |
| 整合条件 | `整合性` | `一貫性`, `矛盾なし` |
| 運用条件 | `運用性` | `運用可能性`, `オペラビリティ` |

---

## 3. 削除対象一覧

以下の項目は本タスクのドキュメントから削除または記述禁止とする。

| # | 削除対象 | 削除理由 | 現在の状態 |
| --- | --- | --- | --- |
| D-01 | legacy assumption: `develop` ブランチ | 正本仕様が `dev` に統一。`develop` は旧プロジェクト慣習による誤記法 | 本タスクに存在しないことを確認済み |
| D-02 | legacy assumption: `master` ブランチ | 正本仕様が `main` に採用。`master` は廃止 | 本タスクに存在しないことを確認済み |
| D-03 | scope 外サービスの先行導入記述: 通知基盤 (Slack/メール等) | 本タスクは Wave 0 であり、通知基盤の設計は対象外。OOS-04 で明示的に除外 | 本タスクに存在しないことを確認済み |
| D-04 | scope 外サービスの先行導入記述: CI/CD パイプライン実装 | 本タスクはブランチ戦略定義のみ。実装は下流タスク (02) の責務 | 本タスクに存在しないことを確認済み |
| D-05 | 実値前提のシークレット記述 | ドキュメントに API キー等の実値を含めることはセキュリティリスク | 本タスクに存在しないことを確認済み |
| D-06 | Sheets を canonical とする記述 | NA-01 で棄却済み。残存する記述は責務定義の混乱を招く | 本タスクに存在しないことを確認済み |
| D-07 | OpenNext を採用コンポーネントとする記述 | NA-02 で棄却済み。`OpenNext` は非採用候補の説明にのみ使用を限定 | decision-log.md NA-02 の説明文にのみ存在 (正しい配置) |

---

## 4. DRY 化後の確認結果

| 確認項目 | 確認方法 | 結果 |
| --- | --- | --- |
| branch 記法の統一 | 全 outputs ファイルで `dev` / `main` / `feature/*` のみ使用されていることを確認 | PASS |
| runtime 記法の統一 | `OpenNext` が canonical-baseline.md の設計本文に含まれていないことを確認 | PASS |
| data ownership の統一 | `Sheets = 入力源 (non-canonical)` / `D1 = canonical` が全箇所で一貫していることを確認 | PASS |
| 削除対象の不在 | D-01〜D-06 の削除対象が本タスクの outputs に含まれていないことを確認 | PASS |
| 共通化パターンの文書化 | セクション2 に表現統一ルールが記載されていることを確認 | PASS |

**DRY 化総合: 全確認項目 PASS**

---

## 5. Phase 9 への引き継ぎ

### Blockers

なし。DRY 化の全確認項目が PASS。Phase 9 (品質保証) に進行可能。

### Open Questions

なし。

### Phase 9 実行時の注意事項

- Phase 9 の命名規則チェックでは、本 Phase で定義した branch 記法統一ルールを基準として使用すること
- Secrets 漏洩チェックでは、D-05 (実値前提のシークレット記述) が残存していないことを機械的に確認すること

---

## 完了確認

- [x] branch 記法の統一 Before/After 記録済み
- [x] runtime 記法の統一 Before/After 記録済み
- [x] data ownership の統一 Before/After 記録済み
- [x] 共通化パターン定義済み (branch/env/secret / outputs 配置 / 4条件名)
- [x] 削除対象一覧作成済み (D-01〜D-07 / 全件「本タスクに存在しない」確認済み)
- [x] DRY 化後の確認結果記録済み (全件 PASS)
- [x] Phase 9 への引き継ぎ記載済み (blockers なし)
