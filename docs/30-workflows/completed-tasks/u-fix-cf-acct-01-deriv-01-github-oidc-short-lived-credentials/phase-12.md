# Phase 12: ドキュメント更新 — u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials

[実装区分: 実装仕様書]

判定根拠: Phase 11 で取得する 13 evidence と確定した OIDC 経路設計を、正本仕様（`specs/15-infrastructure-runbook.md`）/ aiworkflow-requirements（`deployment-gha.md` / `deployment-secrets-management.md`）/ 後続 unassigned-task / skill feedback に反映する。複数ファイルへの実コミットを伴うため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials |
| phase | 12 / 13 |
| upstream issue | #405 |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Phase 11 で取得予定の evidence contract と OIDC 経路設計を、関連ドキュメント・正本仕様・後続タスクに漏れなく反映する。本 spec-created cycle では runtime workflow edit / deploy / token revoke を未実行とし、後続 DERIV-02 / DERIV-03 / DERIV-04 は「DERIV-01 target contract 確定済 / runtime completion pending」を前提にする。

## 中学生レベルの概念説明（Phase 12 必須）

- **長命 API Token とは**: Cloudflare に「これを持ってる人は俺のアカウントを操作していいよ」と渡す合鍵のこと。今までは GitHub の金庫（Secrets）に 1 本入れっぱなしにしていた。落とす（漏らす）と長期間悪用される。
- **OIDC とは**: GitHub Actions が「自分は確かにこの repo の deploy job だよ」と Cloudflare 側に証明書を渡す仕組み。合鍵を持ち歩くのではなく、その場で身分証明して短い時間だけ使える鍵をもらう方式。
- **短命 credential とは**: 1 時間しか使えない鍵。job が終わったら自動で失効するので、漏れても被害が極小に抑えられる。
- **なぜ移行するか**: 鍵を「持ち歩く」方式から「その都度発行する」方式に変えると、鍵の管理ミスや漏洩事故の被害範囲が劇的に小さくなるから。

## Phase 12 必須 6 タスク / strict 7 outputs

Phase 12 の作業単位は 6 タスク、成果物は `main.md` を含む strict 7 outputs とする。

### タスク 1: 実装ガイド作成

`outputs/phase-12/implementation-guide.md` を作成。次の 2 部構成。

**Part 1（中学生レベル概念説明）**:
- 「鍵の持ち方を変える」というメタファでの全体像
- なぜ短命にするのか / なぜ OIDC を使うのか
- 図解（テキスト ASCII でも可）: GitHub Actions → AWS STS → job-scoped Cloudflare deploy credential → cf.sh → Cloudflare API

**Part 2（技術者レベル）**:
- OIDC trust 設計図（`sub` / `aud` / `iss` claim 設計表、environment / branch 単位の絞り込み）
- future implementation diff（`.github/workflows/web-cd.yml` / `backend-ci.yml` / `d1-migration-verify.yml` の変更前後。今回 cycle では実 workflow edit を行わない）
- future `scripts/cf.sh` 改修内容（job-scoped credential 受け取り経路 / 環境変数の揮発化 / `op run` との互換維持。今回 cycle では実コード変更を行わない）
- rollback 手順（5.1 staging 経路だけ revert / 5.2 旧長命 Token 24h 再注入 / 5.3 production 経路 revert）
- 24h 並行運用中の監視手順（旧 Token `last_used_on` 観測コマンド）
- 失効後の確認手順（`/user/tokens` API で旧 ID 不在）

### タスク 2: システム仕様書更新サマリ

`outputs/phase-12/system-spec-update-summary.md` に以下の更新行を **canonical absolute path** で列挙する:

| # | path | 更新内容 |
| --- | --- | --- |
| 1 | `/Users/.../docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | OIDC 経路の章を新規追加（trust policy / cutover 手順 / rollback 手順 / 24h 並行運用 / 旧 Token 失効） |
| 2 | `/Users/.../.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | target contract として OIDC → AWS STS → job-scoped credential を登録。`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_API_TOKEN_STAGING` は runtime cutover まで current fact |
| 3 | `/Users/.../.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | current-vs-target、rollback-only 24h、`CLOUDFLARE_API_TOKEN_STAGING` を含む revoke/grep 境界を追加 |
| 4 | `/Users/.../.github/workflows/web-cd.yml` | future implementation diff 対象。今回 cycle では未編集 |
| 5 | `/Users/.../.github/workflows/backend-ci.yml` / `.github/workflows/d1-migration-verify.yml` | future implementation diff / impact check 対象。今回 cycle では未編集 |
| 6 | `/Users/.../scripts/cf.sh` | future implementation diff 対象。今回 cycle では未編集 |

### タスク 3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を時系列で記録:
- 各 ref ファイルの更新行（before / after の要約）
- `.claude/skills/aiworkflow-requirements/SKILL.md` の更新行（OIDC 経路を topic に追加）
- `.claude/skills/aiworkflow-requirements/LOGS.md` の更新行（DERIV-01 完了記録）
- `pnpm indexes:rebuild` 実行ログ（`indexes/keywords.json` 等が再生成されたことの確認）

### タスク 4: 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md` を 0 件でも必ず出力。候補:

| 候補 | 結論 | 移譲先 |
| --- | --- | --- |
| D1 / KV / Pages の scope 分割 | 本タスク scope 外 | U-FIX-CF-ACCT-01-DERIV-02 で扱う |
| 90 日 rotation runbook（OIDC 化後は trust policy 更新概念） | 本タスク scope 外 | U-FIX-CF-ACCT-01-DERIV-03 で扱う |
| Cloudflare audit logs の常時監視 | 本タスクは 24h 一回観測のみ | U-FIX-CF-ACCT-01-DERIV-04 で扱う |
| OIDC 信頼境界の継続評価 | 監査側責務 | UT-GOV-002-EVAL-oidc-and-workflow-run |
| secret 配置 OIDC との設計共有 | 並走 | UT-25-DERIV-04 |

新規起票が必要になった場合は `docs/30-workflows/unassigned-task/` 配下に追加。

### タスク 5: スキルフィードバックレポート

`outputs/phase-12/skill-feedback-report.md` を 3 観点固定で作成（改善点なしでも出力必須）:

1. **テンプレ改善**: task-specification-creator の Phase 1〜13 構成で OIDC / CI 認証経路変更タスク特有の章（lifetime 検証 / fork PR 漏洩試験 / 並行運用観測）が不足していないか
2. **ワークフロー改善**: G1〜G4 4 段 approval gate の運用負荷 / 待機時間（staging 7 日 / production 24h 並行）の見積精度
3. **ドキュメント改善**: aiworkflow-requirements 正本（`deployment-gha.md` / `deployment-secrets-management.md`）の OIDC 章追加でカバー漏れがないか

### タスク 6: タスク仕様書コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md` で以下を検査:

- Phase 1〜13 すべてに `[実装区分]` が明示されているか
- 各 phase に「実行タスク」「統合テスト連携」「次 Phase への引き渡し」「タスク100%実行確認」セクションが存在するか
- DoD 完了条件と各 Phase の完了条件が整合しているか
- visualEvidence: NON_VISUAL が一貫しているか
- CONST_007（先送り禁止）違反がないか

検査結果は PASS / FAIL マトリクスで列挙し、FAIL は当該 phase ファイルへの修正 commit 候補として記録。

## aiworkflow-requirements 正本同時更新ポリシー

`patterns-phase12-sync` に従い:

1. `references/deployment-gha.md` / `deployment-secrets-management.md` の更新差分を作成
2. `pnpm indexes:rebuild` を実行し `indexes/keywords.json` / `topic-map.md` を再生成
3. `.claude/skills/aiworkflow-requirements/LOGS.md` に DERIV-01 完了行を追記
4. `verify-indexes-up-to-date` CI gate を local で確認（`pnpm indexes:rebuild` で diff が出ないこと）

## workflow root の `metadata` 据え置き

本 Phase では `metadata.workflow_state` を `spec_created` のまま据え置き、各 `phases[].status` のみ更新する。`spec_created` → `runtime_executed` への遷移は別タスク（実装 PR）で行う。

## 検証コマンド

```bash
# strict 7 出力ファイルの存在確認
for f in main.md implementation-guide.md system-spec-update-summary.md documentation-changelog.md \
         unassigned-task-detection.md skill-feedback-report.md \
         phase12-task-spec-compliance-check.md; do
  test -f "docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/outputs/phase-12/$f" \
    && echo "OK: $f" || echo "MISSING: $f"
done

# aiworkflow-requirements indexes 再生成
mise exec -- pnpm indexes:rebuild

# secret hygiene 再確認
grep -RnE '(Bearer [A-Za-z0-9._-]{20,}|CLOUDFLARE_API_TOKEN=[A-Za-z0-9._-]{20,})' \
  docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/outputs/phase-12/ \
  || echo "[ZERO_MATCH] phase-12 secret hygiene PASS"

# typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 統合テスト連携

- 上流: Phase 11 で取得する 13 evidence
- 下流: Phase 13 PR / DERIV-02 / DERIV-03 / DERIV-04

## 多角的チェック観点

- 6 必須タスクすべてに出力ファイルが存在する（0 件でも skill-feedback / unassigned-task は出力必須）
- aiworkflow-requirements 正本同時更新が完了している（`indexes:rebuild` で diff なし）
- secret / token 値を含む文字列を新規ドキュメントに書いていない
- 中学生レベル概念説明 4 項目（長命 token / OIDC / 短命 credential / 移行理由）が必ず含まれている
- canonical absolute path で正本仕様の更新行が列挙されている

## サブタスク管理

- [ ] タスク 1〜6 の出力ファイル 6 件をすべて作成
- [ ] aiworkflow-requirements 正本（`deployment-gha.md` / `deployment-secrets-management.md`）を更新
- [ ] `pnpm indexes:rebuild` 実行 + diff なし確認
- [ ] `outputs/phase-12/main.md` を更新
- [ ] `metadata.workflow_state` を `spec_created` のまま据え置き、`phases[12].status` のみ `executed` に更新

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- 上記 system-spec-update-summary に列挙した正本仕様 6 ファイルの diff

## 完了条件

- [ ] strict 7 output files が揃っている
- [ ] aiworkflow-requirements 正本 2 ファイルの更新差分が `git diff --stat` で確認できる
- [ ] `pnpm indexes:rebuild` で diff 0
- [ ] secret hygiene zero match を再確認

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 中学生レベル概念説明セクションが埋まっている
- [ ] 本 Phase で commit / push / PR を実行していない
- [ ] CONST_007（先送り）違反がない

## 次 Phase への引き渡し

Phase 13 へ:
- 更新済ドキュメント一覧と diff
- strict 7 output files のパス
- 新規起票した unassigned-task のパス一覧
- skill feedback 反映の有無

## 実行タスク

- [ ] phase-12 の既存セクションに記載した手順・検証・成果物作成を実行する。

## 参照資料

- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `CLAUDE.md`
