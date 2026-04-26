# Phase 11: 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cloudflare-base-bootstrap |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-23 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

実際の Cloudflare 環境を人間が目視確認し、Phase 10 で PASS と判定した AC-4（Analytics 追跡）と AC-5（rollback ドライラン）を実地で検証する。全チェック項目に ✅ が入った時点で Phase 12 へ進む。

## 実行タスク

- Phase 10 の Go 判定と全 outputs を入力として確認する
- `outputs/phase-11/manual-cloudflare-checklist.md` を作成し全項目を目視確認する
- `outputs/phase-11/main.md` に Phase 11 実行サマリーを記録する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare セットアップ |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | Pages / Workers / D1 役割 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | token placement |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api split |
| 参考 | Cloudflare Dashboard / Wrangler CLI | 手動確認の操作対象 |

## 実行手順

### ステップ 1: input と前提の確認
- Phase 10 の GO 判定結果と outputs/phase-10/main.md を読む。
- 正本仕様との差分を先に洗い出す。
- Phase 10 で NO-GO が宣言されている場合は本 Phase を開始しない。

### ステップ 2: manual-cloudflare-checklist.md の作成と目視確認
- `outputs/phase-11/manual-cloudflare-checklist.md` を下記「チェックリスト構成」に従って作成する。
- Cloudflare Dashboard と Wrangler CLI を実際に操作して各項目を確認し、結果を記録する。
- 未確認項目（未デプロイ等）は理由を記録した上で Phase 12 行きとしてマークする。

### ステップ 3: Phase 成果物の作成
- `outputs/phase-11/main.md` に実行サマリーを記録する。
- downstream task から参照される path を具体化する。

### ステップ 4: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## manual-cloudflare-checklist.md の構成定義

`outputs/phase-11/manual-cloudflare-checklist.md` に記述すべき内容を以下のように定義する。

```markdown
## Cloudflare Pages 確認
- [ ] ubm-hyogo-web プロジェクトが Dashboard に存在する
- [ ] ubm-hyogo-web-staging プロジェクトが Dashboard に存在する
- [ ] main ブランチが production 環境に接続されている
- [ ] dev ブランチが staging 環境に接続されている
- [ ] Pages の build count が 500/月 枠内で追跡できる

## Cloudflare Workers 確認
- [ ] ubm-hyogo-api が Workers リストに存在する
- [ ] ubm-hyogo-api-staging が Workers リストに存在する
- [ ] Workers の request count が 100k/day 枠内で追跡できる

## Cloudflare D1 確認
- [ ] ubm-hyogo-db-prod データベースが存在する
- [ ] ubm-hyogo-db-staging データベースが存在する
- [ ] D1 のストレージが 5GB 枠内で追跡できる

## API Token 確認
- [ ] API Token のスコープが Pages:Edit + Workers:Edit + D1:Edit の3つのみ
- [ ] Token が GitHub Secrets の CLOUDFLARE_API_TOKEN に登録されている（または登録予定が記録されている）

## Rollback 確認（ドライラン）
- [ ] Pages の Deployments ページでロールバック対象のデプロイが選択できる
- [ ] wrangler rollback コマンドの実行方法が runbook に記載されている

## 環境変数確認
- [ ] NEXT_PUBLIC_API_URL が staging/production で正しく設定されている
- [ ] wrangler.toml の ENVIRONMENT 変数が staging/production で分岐している
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | Go 判定と AC 最終判定テーブルを入力として受け取る |
| Phase 7 | AC トレースに使用 |
| Phase 12 | 本 Phase の出力（チェックリスト結果）を入力として使用 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 11 | pending | Phase 10 の Go 判定と全 outputs を確認 |
| 2 | 成果物更新（チェックリスト） | 11 | pending | outputs/phase-11/manual-cloudflare-checklist.md |
| 3 | 成果物更新（サマリー） | 11 | pending | outputs/phase-11/main.md |
| 4 | 4条件確認 | 11 | pending | チェックリスト全項目に ✅ が入ることを確認後 Phase 12 へ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/manual-cloudflare-checklist.md | 手動確認チェックリスト（主要成果物） |
| ドキュメント | outputs/phase-11/main.md | Phase 11 実行サマリー |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 主成果物（manual-cloudflare-checklist.md）が作成済み
- チェックリスト全項目が ✅ または対処方針が記録済み
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

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: manual-cloudflare-checklist.md の確認結果と未解消項目（Phase 12 行き）を渡す。MINOR ドリフト M-01（develop→dev）の対応は Phase 12 で行う。
- ブロック条件: 本 Phase の主成果物（manual-cloudflare-checklist.md）が未作成なら Phase 12 に進まない。

## 失敗時の戻り先（逆引き表）

| 問題 | 戻り先 |
| --- | --- |
| branch / env drift | Phase 2 / 8 |
| source-of-truth drift | Phase 2 / 3 |
| output path drift | Phase 5 / 8 |
| API Token スコープ超過 | Phase 4 |
| rollback 手順が runbook に未記載 | Phase 5 / 8 |
| Analytics で quota 追跡不可 | Phase 5 |
