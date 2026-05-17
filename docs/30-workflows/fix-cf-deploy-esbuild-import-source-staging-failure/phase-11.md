# Phase 11: NON_VISUAL evidence

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 名称 | NON_VISUAL evidence |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | runtime_pending |
| 前 Phase | 10 (ロールバック手順) |
| 次 Phase | 12 (正本同期) |

## 目的

本タスクは UI を持たない（visualEvidence=NON_VISUAL）ため、視覚的成果物は不要。
代わりに **CI Run URL** を canonical evidence として保管する規約を定める。

## Canonical evidence path 規約

```
outputs/phase-11/
  ├── ci-evidence.md              # CI Run URL 一覧と緑化観測サマリ
  ├── web-cd-staging-run.txt      # web-cd / deploy-staging の Run URL（プレーンテキスト 1 行）
  ├── web-cd-production-run.txt   # web-cd / deploy-production の Run URL
  ├── backend-ci-staging-run.txt  # backend-ci / deploy-staging の Run URL
  └── backend-ci-production-run.txt
```

各 `*-run.txt` には URL を 1 行のみ記録する。`ci-evidence.md` で URL に対する観測結果（PASS/FAIL/skipped）と要点をまとめる。

## evidence 取得手順（参考）

```bash
# 最新の web-cd run を取得
gh run list --workflow=web-cd.yml --branch fix/cf-deploy-esbuild-import-source-staging-failure --limit 1 --json url,conclusion,name

# backend-ci 同様
gh run list --workflow=backend-ci.yml --branch fix/cf-deploy-esbuild-import-source-staging-failure --limit 1 --json url,conclusion,name
```

production 観測は main マージ後に同コマンドを `--branch main` で再実行する。

## `ci-evidence.md` テンプレ（参考）

```markdown
# CI evidence

| ジョブ | Run URL | conclusion | 観測日時 (UTC) | 備考 |
| --- | --- | --- | --- | --- |
| web-cd / deploy-staging | <URL> | success | YYYY-MM-DDTHH:MM:SSZ | esbuild エラー消失を確認 |
| backend-ci / deploy-staging | <URL> | success | ... | 同上 |
| web-cd / deploy-production | <URL> | success | ... | main マージ後 |
| backend-ci / deploy-production | <URL> | success | ... | 同上 |
```

## NON_VISUAL skip 宣言

- `visualEvidence: NON_VISUAL` を `artifacts.json` で明示済。
- 視覚的 evidence（screenshot / diff image）は不要。

## 実行タスク

- [ ] PR push 後、staging 2 job の Run URL を取得
- [ ] main マージ後、production 2 job の Run URL を取得
- [x] `outputs/phase-11/ci-evidence.md` に user-gated runtime boundary を記録
- [ ] `*-run.txt` を runtime evidence 取得後に配置

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/ci-evidence.md | CI Run URL 一覧と観測結果 |
| データ | outputs/phase-11/web-cd-staging-run.txt | web-cd staging Run URL |
| データ | outputs/phase-11/web-cd-production-run.txt | web-cd production Run URL |
| データ | outputs/phase-11/backend-ci-staging-run.txt | backend-ci staging Run URL |
| データ | outputs/phase-11/backend-ci-production-run.txt | backend-ci production Run URL |

## 完了条件

- [x] canonical evidence path 規約が定義されている
- [x] evidence 取得手順が記載されている

## 次 Phase

- 次: 12 (正本同期)
- ブロック条件: staging 2 job の Run URL が取得されていない状態では Phase 12 verdict を runtime pending 境界として扱う（production は main マージ後に追補）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` | 本 Phase の正本 |
| task-specification-creator | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase outputs / 状態語彙 / strict 7 |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Cloudflare wrapper / esbuild SSOT |

## 統合テスト連携

| 連携先 | 扱い |
| --- | --- |
| local dependency convergence | `pnpm exec esbuild --version` / `pnpm why esbuild` で確認 |
| local static gates | typecheck / lint は Phase 11 evidence 境界で扱う |
| GitHub Actions | commit / push / PR が user-gated のため runtime_pending |
