# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cloudflare-base-bootstrap |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-23 |
| 前 Phase | 8 (設定 DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

phase-01〜phase-08 の成果物が artifacts.json と一致し、AC トレースが完全であり、正本仕様参照が残っていることを確認する。

## 実行タスク

- Phase 8 の DRY 化結果と全成果物パスを確認する
- 品質チェックリストを全項目実行し結果を記録する
- line budget チェックを実施する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare セットアップ |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | Pages / Workers / D1 役割 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | token placement |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api split |
| 参考 | Cloudflare Dashboard / Wrangler CLI | 初回セットアップ |

## 品質チェックリスト

| カテゴリ | チェック項目 | 確認方法 | 期待状態 |
| --- | --- | --- | --- |
| 完全性 | 全 phase の成果物が outputs/ に存在する | `ls outputs/` | phase-01〜phase-08 の main.md が存在 |
| 完全性 | cloudflare-topology.md が存在する | `ls outputs/phase-02/` | cloudflare-topology.md が存在 |
| 完全性 | cloudflare-bootstrap-runbook.md が存在する | `ls outputs/phase-05/` | runbook が存在 |
| 完全性 | token-scope-matrix.md が存在する | `ls outputs/phase-05/` | scope matrix が存在 |
| 整合性 | artifacts.json の phase 状態と実際のファイルが一致する | artifacts.json を読んで確認 | pending/completed が正確 |
| 整合性 | index.md の phase 一覧と phase-*.md のメタ情報が一致する | 手動確認 | 全 phase 名・ファイル名が一致 |
| リンク | 参照資料パスが全て存在する | `ls .claude/skills/aiworkflow-requirements/references/` | 4 参照ファイルが存在 |
| DRY | Phase 8 の DRY 化チェック結果が全て解消されている | outputs/phase-08/main.md を確認 | 未解消ドリフトがない |
| AC | AC-1〜AC-5 が Phase 7 のトレースマトリクスで全て追跡されている | outputs/phase-07/main.md を確認 | 全 AC に対応 Phase が記載 |

## line budget チェック（docs-only タスク向け）

| ファイル | 上限行数 | 確認コマンド |
| --- | --- | --- |
| phase-01.md〜phase-11.md | 200行 | `wc -l doc/01b-parallel-cloudflare-base-bootstrap/phase-{01..11}.md` |
| phase-12.md | 250行（6必須成果物+compliance checkのため） | `wc -l doc/01b-parallel-cloudflare-base-bootstrap/phase-12.md` |
| phase-13.md | 200行 | `wc -l doc/01b-parallel-cloudflare-base-bootstrap/phase-13.md` |
| index.md | 150行 | `wc -l doc/01b-parallel-cloudflare-base-bootstrap/index.md` |
| 各 outputs/phase-*/main.md | 100行 | `wc -l outputs/*/main.md` |

## 命名規則チェック

| 対象 | 基準 | 判定 |
| --- | --- | --- |
| task dir | wave + mode + kebab-case | TBD |
| branch 名 | `dev` / `main`（`develop` 表記禁止） | TBD |
| secret 名 | ALL_CAPS_SNAKE_CASE | TBD |
| Pages 名 | `ubm-hyogo-web` / `ubm-hyogo-web-staging` | TBD |
| Workers 名 | `ubm-hyogo-api` / `ubm-hyogo-api-staging` | TBD |
| D1 名 | `ubm-hyogo-db-prod` / `ubm-hyogo-db-staging` | TBD |

## 参照整合性チェック

- task-spec skill と aiworkflow reference の参照が生きているか
- README / index / phase / outputs の path が一致しているか
- artifacts.json の task_path が `doc/01b-parallel-cloudflare-base-bootstrap` を指しているか

## 無料枠遵守チェック

- Pages build budget を超過していない
- 常設通知や有料サービスを前提にしない
- D1 の無料枠（5GB / 5M rows read/day）を逸脱していない

## Secrets 漏洩チェック

- 実値を書いていない（プレースホルダーのみ）
- 1Password を local canonical としている
- Cloudflare と GitHub の配置先が混線していない
- `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` の変数名が全ドキュメントで統一されている

## 実行手順

### ステップ 1: input と前提の確認

- outputs/phase-08/main.md（DRY 化チェック結果）を読む
- 全 outputs/ ディレクトリを確認し、不足成果物を洗い出す
- artifacts.json の phase 状態と実ファイルの乖離を確認する

### ステップ 2: 品質チェックリストの実行

- 上記品質チェックリストを全項目実行する
- 各項目の結果を「OK / NG / 要確認」で記録する
- NG 項目は根拠と修正方針を明記する

### ステップ 3: line budget チェックの実行

- `wc -l` で各ファイルの行数を確認する
- 上限超過ファイルがあれば不要な重複行を削除する

### ステップ 4: Phase 成果物の作成

- 本 Phase の主成果物を outputs/phase-09/main.md に作成・更新する
- 品質チェック結果レポート（全カテゴリの判定結果）を含める
- downstream task から参照される path を具体化する

### ステップ 5: 4条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を再確認する
- 次 Phase に渡す blocker と open question を記録する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 本 Phase の品質チェック結果を最終レビューの入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 品質チェックにより、どのドキュメント不整合リスクを排除するか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか、AC トレースが全項目を網羅するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 9 | pending | Phase 8 の DRY 化結果と全成果物パスを確認 |
| 2 | 品質チェックリスト実行 | 9 | pending | 全カテゴリを確認・記録 |
| 3 | line budget チェック | 9 | pending | `wc -l` で各ファイルを確認 |
| 4 | 成果物更新 | 9 | pending | outputs/phase-09/main.md に品質チェック結果レポートを作成 |
| 5 | 4条件確認 | 9 | pending | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質チェック結果レポート |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 品質チェックリストの全項目が「OK / 修正済み」になっている
- AC-1〜AC-5 が Phase 7 のトレースマトリクスで全て追跡されている
- line budget チェックで全ファイルが上限以内に収まっている
- 正本仕様参照が残っている
- downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項: 品質チェック結果レポート（outputs/phase-09/main.md）を Phase 10 の最終レビューの入力として使用する。未解消 NG 項目がある場合は Phase 10 でブロック扱いとする。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。
