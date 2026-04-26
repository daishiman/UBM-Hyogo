# GitHub Governance Map

## 設計根拠

正本仕様: `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md`

## Branch Protection 設計

### main ブランチ

| 設定項目 | 設定値 | 根拠 |
| --- | --- | --- |
| Require pull request reviews | ON | deployment-branch-strategy.md |
| Required number of approvals | **2** | deployment-branch-strategy.md |
| Require status checks to pass | ON | deployment-branch-strategy.md |
| Status check: `ci` | 有効 | deployment-branch-strategy.md / deployment-core.md |
| Status check: `Validate Build` | 有効 | deployment-branch-strategy.md / deployment-core.md |
| Require branches to be up to date | ON | deployment-branch-strategy.md |
| Restrict who can push | admins only | deployment-branch-strategy.md |
| Allow force pushes | **OFF** | deployment-branch-strategy.md |
| Allow deletions | **OFF** | deployment-branch-strategy.md |

### dev ブランチ

| 設定項目 | 設定値 | 根拠 |
| --- | --- | --- |
| Require pull request reviews | ON | deployment-branch-strategy.md |
| Required number of approvals | **1** | deployment-branch-strategy.md |
| Require status checks to pass | ON | deployment-branch-strategy.md |
| Status check: `ci` | 有効 | deployment-branch-strategy.md / deployment-core.md |
| Status check: `Validate Build` | 有効 | deployment-branch-strategy.md / deployment-core.md |
| Allow force pushes | **OFF** | deployment-branch-strategy.md |

## GitHub Environments 設計

| 環境名 | Required reviewers | Deployment branches | 用途 |
| --- | --- | --- | --- |
| `production` | **2 名** | `main` のみ | Cloudflare production デプロイ |
| `staging` | **0 名**（自動） | `dev` のみ | Cloudflare staging デプロイ |

## PR Template 設計

```markdown
## 概要

<!-- この PR で行った変更を簡潔に記述してください -->

## 関連 Issue

- True Issue: #<!-- このPRが解決する本質的な課題のIssue番号 -->
- Dependency: #<!-- 依存する先行タスクがあれば記載（なければ「なし」） -->

## 変更種別

- [ ] 機能追加
- [ ] バグ修正
- [ ] ドキュメント更新
- [ ] インフラ変更
- [ ] リファクタリング
- [ ] その他（説明: ）

## 4条件チェック

- [ ] **価値性**: 誰のどのコストを下げるか・どの課題を解決するかが定義されている
- [ ] **実現性**: 初回スコープ（無料枠・既存技術スタック）で成立する
- [ ] **整合性**: branch / env / runtime / data / secret の設定が正本仕様と矛盾しない
- [ ] **運用性**: rollback・handoff・same-wave sync が破綻しない

## テスト確認

- [ ] ローカルで動作確認済み
- [ ] CI が GREEN
- [ ] 影響範囲を確認済み（スコープ外サービスへの変更なし）
- [ ] secret 実値がコードに含まれていないことを確認済み
```

## CODEOWNERS 設計

```
# Global fallback
*                   @daishiman

# Infrastructure docs (Wave 1 parallel tasks)
doc/01a-*/          @daishiman
doc/01b-*/          @daishiman
doc/01c-*/          @daishiman

# GitHub governance files
.github/            @daishiman
```

**設計根拠:**
- `*` @daishiman: 全ファイルのフォールバックオーナー（1名プロジェクト）
- `doc/01a-*/`: 本タスク（github-and-branch-governance）のドキュメント
- `doc/01b-*/`: 並列タスク（cloudflare-base-bootstrap）のドキュメント
- `doc/01c-*/`: 並列タスク（google-workspace-bootstrap）のドキュメント
- `.github/`: PR template / CODEOWNERS 等の GitHub 設定ファイル

**衝突チェック:** `doc/01a-*/`, `doc/01b-*/`, `doc/01c-*/` はパスが完全に分離されており、責務衝突なし。

## Secrets 設計（名称確定・実値投入は Phase 04-5）

| 変数名 | 種別 | 配置先 | 投入 Phase |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | deploy auth | GitHub Secrets | 04 Phase 5 |
| `CLOUDFLARE_ACCOUNT_ID` | deploy metadata | GitHub Secrets | 04 Phase 5 |

- runtime secrets（`GOOGLE_*` / `AUTH_*` / `RESEND_*`）の正本配置は `02-auth.md` / `08-free-database.md` / `10-notification-auth.md` に残す
- このタスクでは `CLOUDFLARE_*` のみを固定し、他の secret placement は変更しない

## 設定値表（single source of truth）

| 項目 | 設定値 | 根拠 |
| --- | --- | --- |
| main branch reviewer | 2 名 | deployment-branch-strategy.md |
| dev branch reviewer | 1 名 | deployment-branch-strategy.md |
| main force push | OFF | deployment-branch-strategy.md |
| dev force push | OFF | deployment-branch-strategy.md |
| production env branch | main のみ | deployment-branch-strategy.md |
| staging env branch | dev のみ | deployment-branch-strategy.md |
| CI status checks | `ci`, `Validate Build` | deployment-core.md（ci.yml 定義） |

## 構成図

```
feature/* ブランチ → [PR 1名レビュー] → dev ブランチ → [自動デプロイ] → Cloudflare staging
                                                    ↓
                                        [PR 2名レビュー] → main ブランチ → [自動デプロイ] → Cloudflare production

GitHub Environments:
  production: main のみ / reviewer 2名
  staging:    dev のみ  / 自動デプロイ

Branch Protection:
  main: review 2名 + CI pass + force push 禁止 + up-to-date 必須
  dev:  review 1名 + CI pass + force push 禁止
```

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `00-serial-architecture-and-scope-baseline/` | baseline が確定していること |
| 下流 | `02-serial-monorepo-runtime-foundation` | branch protection 前提で PR フロー設計 |
| 下流 | `04-serial-cicd-secrets-and-environment-sync` | environment 名と secrets placement を参照 |
| 並列 | `01b-parallel-cloudflare-base-bootstrap` | 独立実行可能 |
| 並列 | `01c-parallel-google-workspace-bootstrap` | 独立実行可能 |

## Phase 3 への handoff

- **引き継ぎ**: 本ファイル（github-governance-map.md）をレビュー対象として渡す
- **design risk**: 設定値はすべて正本仕様から直接引用。drift リスクは低い
- **open questions**: なし
