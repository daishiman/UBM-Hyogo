# wrangler / esbuild override drift 検出 CI gate - タスク指示書

## メタ情報

| 項目         | 内容                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| タスクID     | fix-wrangler-esbuild-followup-002-wrangler-esbuild-dependency-drift-ci-gate         |
| タスク名     | wrangler / esbuild override drift 検出 CI gate                                      |
| 分類         | 改善 / ci-gate                                                                      |
| 対象機能     | CI で `pnpm view wrangler@X dependencies.esbuild` を実行し override と比較          |
| 優先度       | 中                                                                                  |
| 見積もり規模 | 小規模                                                                              |
| ステータス   | unassigned                                                                          |
| 発見元       | `completed-tasks/fix-wrangler-esbuild-import-source-error/` Phase 10 MINOR #2       |
| 発見日       | 2026-05-15                                                                          |

## Canonical Workflow Status

- 発生 workflow: `docs/30-workflows/completed-tasks/fix-wrangler-esbuild-import-source-error/`
- 状態: `unassigned`（Phase 10 で MINOR・未タスク化対象として宣言済み）

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`fix-wrangler-esbuild-import-source-error` インシデントの本質は、`wrangler` 同梱 `esbuild` と root `package.json#pnpm.overrides.esbuild` の **drift** が CI で検出されないまま staging deploy まで到達したことにある。再発防止には CI gate でこの drift を機械的に検出する必要がある。

### 1.2 問題点・課題

- 現状 `wrangler` 同梱 `esbuild` バージョンを CI で参照する仕組みが無い
- override は手動更新されるため、wrangler bump 後に放置されると静かに drift する
- followup-001 の自動 bump があっても、人為 PR や hotfix で drift する余地は残る

### 1.3 放置した場合の影響

- 同種 `import` source error / bundle 不整合の再発
- staging で初めて検知される運用負荷

---

## 2. 何を達成するか（What）

### 2.1 目的

CI に `verify-wrangler-esbuild-drift` 相当の gate を追加し、`pnpm view wrangler@<root の wrangler version> dependencies.esbuild` の結果と root override 値が一致しない場合は fail させる。

### 2.2 最終ゴール

- `.github/workflows/` に gate job が存在し、PR / push で必ず実行される
- drift 検出時は分かりやすいエラーメッセージで fail（修正方法を README リンク付きで提示）
- followup-001 の自動 bump PR ではこの gate が green になる

### 2.3 スコープ

#### 含むもの

- 比較スクリプト（Node / Bash）の実装
- CI workflow への組み込み（`backend-ci` 等の既存 workflow への追加 or 独立 workflow）
- branch protection 候補としての status check 名提示（実反映はユーザー承認後）
- 失敗時メッセージとドキュメント整備

#### 含まないもの

- 自動修正（drift があったら override を書き換える）→ followup-001 の責務
- OpenNext / `@opennextjs/cloudflare` 側の drift（followup-003）

### 2.4 成果物

- drift 検出スクリプト
- workflow YAML 追加 / 修正
- 運用ノート

---

## 3. どのように実行するか（How）

### 3.1 受入条件 (AC)

- AC-1: CI gate が PR で必ず実行される
- AC-2: 意図的に override をズラした PR で gate が fail することを evidence で示す
- AC-3: 現行 lockfile では gate が green
- AC-4: 失敗時メッセージに修正手順 / 関連 doc / followup-001 への導線が含まれる
- AC-5: followup-001 / followup-003 と整合する（重複検証にならない）

---

## 4. 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/fix-wrangler-esbuild-import-source-error/`
- Phase 10 MINOR #2: `…/phase-10.md` §10.3
- 関連: followup-001（自動 bump）/ followup-003（trio drift check）
