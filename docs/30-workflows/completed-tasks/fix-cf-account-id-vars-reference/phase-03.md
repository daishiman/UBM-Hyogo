# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | FIX-CF-ACCT-ID-VARS-001 |
| Phase | 3 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 実行タスク

1. 本 Phase の入力と制約を確認する。
2. 本 Phase の成果物に必要な判断、手順、証跡を記録する。
3. 完了条件と artifacts ledger の整合を確認する。

## 目的

Phase 1〜2 の設計に対して代替案を比較し、PASS / MINOR / MAJOR を判定して Phase 4 進行可否を決定する。


## 参照資料

- `index.md`
- `artifacts.json`
- `.github/workflows/backend-ci.yml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`

## 入力

- Phase 1 成果物
- Phase 2 成果物

## 代替案比較

### Option A（採用）: `secrets.X` → `vars.X` 参照置換

| 項目 | 内容 |
| --- | --- |
| 変更量 | 6 箇所の文字列置換（2 ファイル） |
| 既存 Variable 利用 | はい（`vars.CLOUDFLARE_ACCOUNT_ID` は登録済み） |
| 認証セキュリティへの影響 | なし（Account ID は識別子で資格情報ではない） |
| 公式慣行との整合 | 一致（Cloudflare / wrangler-action の公式ドキュメント） |
| 工数 | 最小（PR 1 件・差分 6 行） |

### Option B（不採用）: `CLOUDFLARE_ACCOUNT_ID` を Secret として再登録 + `secrets.X` を維持

| 項目 | 内容 |
| --- | --- |
| 変更量 | GitHub Repository Settings 変更 + 既存 `vars.X` 削除 + 各環境 Secret 登録 |
| セキュリティ向上効果 | **ゼロ**: Account ID は CI ログに wrangler 自身が平文出力。Secret 化しても露出経路を塞げない |
| 公式慣行との整合 | 不一致（Cloudflare 公式は Account ID を識別子扱い） |
| 運用コスト | 増（Secret ローテーション対象が無意味に増える、レビュー時の混乱） |
| 工数 | Option A の 2〜3 倍 |
| 不採用理由 | コストが便益を上回り、エレガンス（最小複雑性）を損なう |

### Option C（不採用）: Account ID を yaml にハードコード

| 項目 | 内容 |
| --- | --- |
| 変更量 | 6 箇所のハードコード |
| 公式慣行との整合 | 一致（Cloudflare 公式サンプルでも許容） |
| 不採用理由 | 既に Variable 登録があるため、未使用化は IaC 的に不健全。worktree / fork 時の差し替え柔軟性も失う |

## レビュー観点

| 観点 | 判定 | コメント |
| --- | --- | --- |
| 価値性 | PASS | main 本番デプロイの即時回復 |
| 実現性 | PASS | 参照表記のみ、副作用なし |
| 整合性 | PASS | Cloudflare / wrangler-action / OSS 慣行と一致 |
| 運用性 | PASS | 既存 Variable を活用、新規導入なし |
| 責務境界 | PASS | yaml 参照のみ。Repository 設定・Token・Cloudflare 側に侵襲なし |
| セキュリティ | PASS | 攻撃面の拡大なし（Phase 1 の Secret 不要根拠を採用） |
| テスタビリティ | PASS | static + runtime の二段検証で網羅 |

## 指摘事項

| Severity | 内容 | 対応 |
| --- | --- | --- |
| MINOR | 修正後 `vars` 参照が他 yaml にも増える際、命名の `CLOUDFLARE_*` プレフィックス統一が将来課題化する | scope out。CI/CD topology drift 系の派生タスクで扱う |
| MINOR | scope out した API Token スコープ監査は本来 priority HIGH の隣接タスク | Phase 12 `unassigned-task-detection.md` で起票候補として記録 |
| MAJOR | なし | - |

## ゲート判定

**PASS**: Phase 4 へ進行可。


## 統合テスト連携

- 本タスクは GitHub Actions workflow の設定修正であり、アプリケーション統合テストの追加は行わない。
- 代替検証は Phase 4 / Phase 5 / Phase 11 の grep、actionlint、yamllint、GitHub API、GitHub Actions run 確認で担保する。

## 完了条件

- [ ] 代替案が 3 件以上比較されている（Option A / B / C）
- [ ] 不採用理由が明記されている
- [ ] 指摘事項に Severity が付与されている
- [ ] ゲート判定が PASS / MINOR / MAJOR で記録されている

## 成果物

- `outputs/phase-03/main.md`
