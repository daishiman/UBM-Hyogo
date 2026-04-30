# システム仕様書更新サマリ

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 12 |
| ステータス | spec_created |

## Step 1-A: タスク記録

本タスクは UT-GOV-002（dry-run 仕様）で固定された設計・runbook・テストマトリクスに基づき、`pull_request_target` を triage / metadata 操作に限定し、untrusted build/test を `pull_request` workflow に分離する **実 workflow 編集**タスクである。

### 成果物（IMPL タスクとしての）
- `.github/workflows/pr-target-safety-gate.yml`（triage workflow）
- `.github/workflows/pr-build-test.yml`（untrusted build/test workflow）
- 13 Phase の `phase-NN.md` 仕様書
- `outputs/phase-N/*` 各 Phase 出力
- 静的検査ログ（`outputs/phase-5/static-check-log.md`）
- 品質ゲート（`outputs/phase-9/quality-gate.md`）
- go/no-go 判定（`outputs/phase-10/go-no-go.md`）
- 手動 smoke ログテンプレート（`outputs/phase-11/manual-smoke-log.md`）

### Phase 13 ユーザー承認後に実走する事項
- T-1〜T-5 dry-run smoke（same-repo / fork / labeled / workflow_dispatch audit / manual re-run）
- 各 run について `gh run view --log` で secrets / token 露出ゼロ目視確認
- GitHub Actions UI / branch protection 画面のスクリーンショット 7 枚撮影

### VISUAL evidence 保存先
- `outputs/phase-11/screenshots/<scenario>-actions-ui-<date>.png`（5 枚）
- `outputs/phase-11/screenshots/branch-protection-{main,dev}-required-checks-<date>.png`（2 枚）

## Step 1-B: 実装状況

**`spec_created`**

| 項目 | 状況 |
| --- | --- |
| 実 workflow 編集（Phase 5） | 仕様書化済（実ファイル草案配置） |
| dry-run 実走（Phase 11） | 未実施（Phase 13 承認後に実走見込み） |
| ドキュメント更新（Phase 12） | 本サマリ作成中 |
| 完了確認（Phase 13） | pending（user_approval_required: true） |

## Step 1-C: 関連タスク更新候補

| 関連タスク | 更新候補内容 | 緊急度 |
| --- | --- | --- |
| UT-GOV-001（github-branch-protection-apply） | required status checks の context 名同期確認手順に実 Actions context（workflow 名 + job 名。現時点の job 名は `triage` / `build-test`）を追記 | 中（本タスク完了後） |
| UT-GOV-007（github-actions-action-pin-policy） | 新規 workflow（pr-target-safety-gate.yml / pr-build-test.yml）の `uses:` が SHA pin 済であることを連携検証 | 中（本タスク Phase 5 と並行） |
| UT-GOV-002（dry-run 仕様） | 「IMPL 適用済」注記を index.md または完了タスクへの移動で表現（dry-run 仕様の docs-only 性は維持） | 低（本タスク完了後の手仕舞い） |

## Step 1-D: 上流 runbook 差分追記タイミング

Phase 5 runbook（`outputs/phase-5/runbook.md`）は dry-run 仕様の手順を実機向けに具体化したもの。実走（Phase 11）で実機差分が観測された場合：

- **追記タイミング**: Phase 11 実走後、smoke が PASS した直後
- **追記先**: `outputs/phase-5/runbook.md` の末尾「実機差分メモ」セクション（実走時に新規追加）
- **記録項目**: 実機で観測された GitHub Actions UI 表記の差・required status checks 名の細部・所要時間
- **逆同期**: 上流 dry-run 仕様（`docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/`）には反映しない（dry-run 仕様の docs-only 性を維持）

## Step 2: aiworkflow-requirements 正本更新要否判定

### 判定: **実施（CI/CD workflow inventory のみ）**

### 理由

本タスクは Governance / Branch Protection 系であり、変更対象は以下に限定される：
- GitHub Actions workflow（`.github/workflows/*.yml`）
- branch protection 設定（既存 UT-GOV-001 で適用済の context 名同期確認のみ）

アプリ層（`apps/web` / `apps/api`）の以下契約はいずれも **不変**：
- API スキーマ / IPC 契約
- UI / 画面遷移 / 状態管理
- セキュリティ契約（OAuth / Magic Link / D1 アクセス境界）
- D1 / KV データモデル
- RBAC / scope 定義

アプリ契約は不変だが、`.github/workflows/` の current inventory は新規 2 workflow で変化するため、以下の正本だけ同 wave で更新した：

| ファイル | 更新内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | workflow 構成に `pr-target-safety-gate.yml` / `pr-build-test.yml` を追加し、current inventory を 7 件へ更新 |
| `.agents/skills/aiworkflow-requirements/references/deployment-gha.md` | `.claude` 正本と mirror 同期 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | UT-GOV-002-IMPL same-wave sync を記録 |
| `.agents/skills/aiworkflow-requirements/LOGS/_legacy.md` | `.claude` LOGS と mirror 同期 |

### 再判定トリガ条件

以下のいずれかに該当した場合、`BLOCKED` として未タスク化または same-wave 更新を行う：

1. **OIDC 化**: `id-token: write` を job に追加し、AWS / Cloudflare 等への federation を導入する場合 → 認証契約変更
2. **`workflow_run` 採用**: 別 workflow を起点に secrets を持つ run を起動する場合 → trust boundary 変更
3. **D1 / KV メタデータ参照**: workflow 内で D1 / KV のメタデータを直接参照する場合 → データアクセス境界変更
4. **Secret 追加**: 新規 secret（OPENAI_API_KEY 等）を workflow で利用する場合 → secret inventory 変更
5. **RBAC 拡張**: GitHub team / role を workflow 判断ロジックに組み込む場合 → 認可契約変更

これらは別タスク（UT-GOV-002-EVAL / SEC / OBS）に委譲済み。

## 参照

- `index.md`
- `outputs/phase-5/runbook.md`
- `outputs/phase-9/quality-gate.md`
- `outputs/phase-10/go-no-go.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
