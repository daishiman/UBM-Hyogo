# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 12 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 実行タスク

1. 本 Phase の入力（Phase 1〜11 全成果物・artifacts.json）を確認する。
2. Task 12-1〜12-6 の必須 7 ファイル（`main.md` + 6 補助）を生成する。
3. 仕様書 root と `outputs/` の `artifacts.json` parity を確認する。
4. workflow_state を `spec_created` のまま据え置く（実装着手前のため）。
5. 完了条件と artifacts ledger の整合を確認する。

## 目的

skill 規約に従い Phase 12 の必須 7 ファイルを揃え、close-out parity を担保する。本タスクは spec 作成段階のため `workflow_state` は `spec_created` のままとし、`completed` には昇格させない。

## 参照資料

- `index.md`
- `artifacts.json` / `outputs/artifacts.json`
- Phase 1〜11 全成果物
- `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`
- 並列タスク仕様: `U-FIX-CF-ACCT-02`

## 必須タスク（5 タスク + root evidence）

| Task | 名称 | 必須 | 出力先 |
| --- | --- | --- | --- |
| 12-1 | 実装ガイド作成（Part 1 中学生向け + Part 2 技術者向け） | ✅ | outputs/phase-12/implementation-guide.md |
| 12-2 | システム仕様書更新サマリー（Step 1-A〜1-C, Step 2 判定） | ✅ | outputs/phase-12/system-spec-update-summary.md |
| 12-3 | ドキュメント更新履歴 | ✅ | outputs/phase-12/documentation-changelog.md |
| 12-4 | 未タスク検出レポート（0 件でも出力必須） | ✅ | outputs/phase-12/unassigned-task-detection.md |
| 12-5 | スキルフィードバックレポート（改善点なしでも出力必須） | ✅ | outputs/phase-12/skill-feedback-report.md |
| 12-6 | Phase 12 task spec compliance check（root evidence） | ✅ | outputs/phase-12/phase12-task-spec-compliance-check.md |

加えて `outputs/phase-12/main.md` をサマリとして出力（合計 7 ファイル）。

## Task 12-1: 実装ガイド構成

### Part 1（中学生向け）

- 例え話: API Token は「合鍵」、必要最小権限は「使える部屋を 4 つだけに限定した合鍵」
- なぜ必要か: もし合鍵を落としても、使える部屋が 6 つだけなら被害を最小に抑えられる
- 何をしたか: Cloudflare の合鍵に「触れる場所」を 4 種類だけに絞った。staging（リハーサル用）と production（本番用）で別々の合鍵を持つようにした。追加候補 2 種は実測で必要な場合だけ増やす
- 「なぜ Account ID は秘密にしないのか」: Account ID は「家の住所」、Token は「家の鍵」。住所を知っているだけでは家には入れない

### Part 2（技術者向け）

- API Token とは: Cloudflare API 認証用の Bearer Token。長命のため漏洩時のブラスト半径を権限スコープで制御する
- 必要最小権限 4 種: `Workers Scripts:Edit` / `D1:Edit` / `Cloudflare Pages:Edit` / `Account Settings:Read`
- 条件付き候補: `Workers KV Storage:Edit` / `User Details:Read` は Phase 11 実測で必要と判明した場合のみ追加
- 専門用語セルフチェック表: API Token / Secret / Variable / staging / production / rollback / permission scope の 7 用語を中学生向けに説明する
- staging→production 適用順序: staging Token 再発行 → `gh secret set --env staging` → Phase 11 smoke 全 PASS → production Token 再発行 → `gh secret set --env production` → 24h 旧 Token 保持 → green 確認後に旧 Token 失効
- rollback: 旧 Token を Dashboard で再有効化 → `gh secret set` で旧値再注入 → 新 Token 失効
- 視覚証跡: UI/UX変更なしのため Phase 11 スクリーンショット不要（代替証跡: `outputs/phase-11/manual-smoke-log.md` / `permission-matrix-validation.md`）

## Task 12-2: システム仕様書更新

| Step | 内容 | 本タスクでの扱い |
| --- | --- | --- |
| Step 1-A | active workflow / LOGS / topic-map 登録 | `spec_created` 状態として記録。completed-tasks には移動しない |
| Step 1-B | 実装状況テーブル更新 | `spec_created` として記録（`completed` には昇格しない） |
| Step 1-C | 関連タスクテーブル更新 | `U-FIX-CF-ACCT-02` / `UT-27` / `FIX-CF-ACCT-ID-VARS-001` との関係を current facts へ更新 |
| Step 2 | システム仕様更新 | Phase 11 verified 後のみ実施。spec_created 段階では「正本 4 権限との差分なし」を記録し、未検証の 6 権限へ上書きしない |

### Step 2 更新対象（候補）

- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（Phase 11 verified 後にのみ追記）
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`（Phase 11 verified 後にのみ追記）
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`（Phase 11 verified 後にのみ追記）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（`generate-index.js` で再生成）

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を別ブロックで記録:

- workflow-local 同期（本タスク仕様書配下の `index.md` / `artifacts.json` / `outputs/artifacts.json` の更新差分）
- global skill sync（aiworkflow-requirements / task-specification-creator の LOGS.md 更新）
- 各 Step 1-A / 1-B / 1-C / Step 2 の結果を個別に明記（「該当なし」も記録）

## Task 12-4: 未タスク検出（0 件でも出力必須）

`U-FIX-CF-ACCT-02` と整合する scope out 候補を最低限列挙する:

1. GitHub OIDC → Cloudflare Trust Policy 連携への移行（Phase 3 Option D・将来課題、HIGH）
2. scope 別 Token 分割（Workers / D1 / Pages 専用、Phase 3 Option C、MEDIUM）
3. Token rotation の自動化（90 日サイクル、HIGH）
4. Cloudflare Audit Logs の常時監視・alerting（MEDIUM）

各候補は `状態: candidate` / 関連タスク差分確認（`U-FIX-CF-ACCT-02` との重複排除）/ 起票要否判定 を記載。Phase 3 で MINOR 指摘 2 件を確認済みのため 0 件判定は不可。

## Task 12-5: スキルフィードバックレポート

`outputs/phase-12/skill-feedback-report.md` に以下を記録（改善点なしでも出力）:

- テンプレート改善: NON_VISUAL + security-audit task における Phase 11 evidence 命名（`permission-matrix-validation.md` 等）の標準化候補
- ワークフロー改善: Token 値非露出のための `gh secret get` 禁止運用の skill ガイドライン化
- ドキュメント改善: Account ID = Variable / API Token = Secret の分離原則を `deployment-secrets-management.md` の trunk paragraph に格上げする提案

## Task 12-6: Compliance check 必須項目

`outputs/phase-12/phase12-task-spec-compliance-check.md` に以下を確認:

- Phase 12 の 7 ファイル（`main.md` + 6 補助）すべて存在
- root `artifacts.json` と `outputs/artifacts.json` の phase / status / file parity。`outputs/artifacts.json` がない場合は root `artifacts.json` が唯一正本であることを明記
- LOGS.md 2 ファイル更新（aiworkflow-requirements / task-specification-creator）
- `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` 実行結果（topic-map / quick-reference の stale 解消）
- 仕様書内に Token 値・Account ID 値が含まれていないこと

## Artifacts parity 同期手順

```bash
# root と outputs の artifacts.json を diff（outputs mirror がある場合）
test -f outputs/artifacts.json \
  && diff <(jq -S . artifacts.json) <(jq -S . outputs/artifacts.json) \
  || echo "PASS: outputs/artifacts.json absent; root artifacts.json is the single canonical ledger for spec_created"

# どちらも phase 12 = spec_created のまま据え置き（completed に昇格させない）
# Phase 13 status は blocked のまま（user 承認待ち）
```

## 完了条件

- [ ] Phase 12 の 7 ファイル（`main.md` + 6 補助）すべて作成されている
- [ ] 各 Task の Step が表化されている
- [ ] root `artifacts.json` と `outputs/artifacts.json` parity、または root 単独正本宣言が記録されている（`spec_created` 同値）
- [ ] aiworkflow-requirements の正本仕様は Phase 11 verified 後に同期する境界が記録されている
- [ ] LOGS.md 2 ファイルが same-wave で更新されている
- [ ] workflow_state は `spec_created` のままで `completed` に昇格していない
- [ ] 仕様書・ログに Token 値が含まれない

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 関連リンク

- `index.md`
- 並列タスク `U-FIX-CF-ACCT-02`
- 上流 `FIX-CF-ACCT-ID-VARS-001`（completed）

## 苦戦想定

- Phase 12 完了と同時に `completed` へ昇格させたくなるが、本タスクは spec 作成段階のため `spec_created` のまま据え置く必要がある（実装は別 wave）。
- `unassigned-task-detection.md` を 0 件で済ませたくなるが、Phase 3 で MINOR 2 件（OIDC・命名規約）が確認済みのため最低 2 件の候補起票が必要。
- `documentation-changelog.md` で workflow-local 同期と global skill sync を混ぜると後段の compliance check で不整合が出る。Phase 12 開始前に separate block 形式を準備する。
