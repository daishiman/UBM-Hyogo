# UT-25-DERIV-01: SA Service Account key 定期ローテーション運用 SOP

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-25-DERIV-01 |
| タスク名 | SA Service Account key 定期ローテーション運用 SOP |
| 優先度 | HIGH |
| 推奨Wave | Wave 2（UT-25 完了後） |
| 状態 | unassigned |
| 作成日 | 2026-04-29 |
| 既存タスク組み込み | なし（UT-25 は初回配置のみ、本タスクは継続運用 SOP の策定） |
| 組み込み先 | - |
| 検出元 | UT-25 Phase 11 `outputs/phase-11/main.md` §保証できない範囲 / Phase 12 `outputs/phase-12/unassigned-task-detection.md` UT-25-DERIV-01 |

## 目的

UT-25 で本番配置した Google Service Account JSON key（`GOOGLE_SERVICE_ACCOUNT_JSON`）を、定期的に無停止でローテーションする運用 SOP を策定する。UT-25 のスコープでは初回配置までを runbook 化したが、key 漏洩リスク低減と Google IAM ベストプラクティス遵守のためには定期ローテーション（90 日 / 半年など）の標準作業手順が必要であり、本タスクとして分離された。新 key 発行・1Password 反映・Cloudflare Secrets 上書き・旧 key 失効猶予期間管理・無停止性確認・rollback の一連を SOP 文書として `doc/00-getting-started-manual/runbooks/` 配下に整備することがゴール。

## スコープ

### 含む

- ローテーション頻度の決定（90 日 / 180 日のいずれかを採用根拠付きで明記）
- Google Cloud Console 上での新 SA key 発行手順
- 1Password の `op://<Vault>/<Item>/<Field>` 参照値（実値ではなく参照のみ）の更新手順
- `bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env staging` 上書き手順
- staging 検証完了後の `--env production` 上書き手順（順序固定）
- 旧 key 失効猶予期間（Google IAM 側 grace period）の管理手順
- `apps/api` Workers が処理中の旧 key を参照していないことを確認する無停止性チェック手順
- ローテーション失敗時の rollback 経路（`outputs/phase-13/rollback-runbook.md` への逆参照）
- ローテーション完了記録テンプレート（実施日 / 実施者 / 旧 key fingerprint / 新 key fingerprint）

### 含まない

- SA 自体の新規作成・削除（01c-parallel-google-workspace-bootstrap のスコープ）
- Sheets API 疎通確認の実装（UT-26 のスコープ）
- Cloudflare Secret audit log の取得自動化（UT-25-DERIV-03 のスコープ）
- SA key 失効監視 alert の実装（UT-25-DERIV-02 のスコープ）
- GitHub Actions 経由の自動ローテーション（UT-25-DERIV-04 のスコープ・将来）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-25（Cloudflare Secrets 本番配置） | 初回配置済の状態を前提に「上書き」手順を策定する |
| 上流 | UT-26（Sheets API E2E 疎通確認） | ローテーション後の動作確認に疎通テスト経路が必要 |
| 下流 | UT-25-DERIV-02（SA key 失効監視） | SOP の rollback 経路で監視 alert を起点にする |
| 下流 | UT-25-DERIV-03（Cloudflare Secret 監査ログ運用） | ローテーション操作の audit 記録経路として参照される |

## 着手タイミング

> **着手前提**: UT-25 Phase 13 完了（本番配置済 + runbook 確定）かつ UT-26 完了（疎通確認経路が動作する）状態であること。

| 条件 | 理由 |
| --- | --- |
| UT-25 完了 | 初回配置済でないと「上書きによるローテーション」の前提が成立しない |
| UT-26 完了 | ローテーション後の動作確認に疎通テストが必要 |
| 1Password Vault 構造確定 | 新 key 反映先 `op://<Vault>/<Item>/<Field>` のパスが固定されている必要がある |

## 苦戦箇所・知見

**1. ローテーション中の旧 key 失効猶予期間管理**
Google IAM 側で旧 key を即時 disable すると `apps/api` Workers が処理中のリクエストで認証エラーになる。新 key を Cloudflare Secrets に配置 → staging / production の `apps/api` が新 key を参照して安定動作することを確認 → 24〜48 時間の grace period を経過してから旧 key を Google Cloud Console で disable する順序を固定する。disable のタイミングを SOP で明文化し、即時 delete は禁止（disable 状態で 7 日間保持してから delete する）。

**2. Cloudflare Secret 上書き順序（staging → production）**
`bash scripts/cf.sh secret put` は同名 secret に対して上書き動作する。staging を先に上書きして UT-26 の疎通テストを通過させてから production を上書きする順序を固定し、production を先行して上書きしない。`--env staging` / `--env production` を必ず明示する（フラグなし既定で production に到達しないようにする）。

**3. 無停止性確認（apps/api Workers が処理中の旧 key を参照していないことの保証）**
Cloudflare Workers の secret 上書きは新規リクエストから新 key を参照するが、上書き直前に開始したリクエストは旧 key を保持したまま完走する可能性がある。SOP では `secret put` 完了から最低 60 秒待機して新規リクエストが新 key で完走することを `wrangler tail` ログで確認した上で、UT-26 疎通テストを実走する手順を固定する。waiting period を SOP に明記し、即時の旧 key disable を禁止する。

**4. `bash scripts/cf.sh secret put` は stdin 経由のみ、shell 履歴に残さない**
key 値はコマンドライン引数や `echo` 経由では渡さず、`op read "op://<Vault>/<Item>/<Field>" | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env <env>` の stdin パイプ固定。実行時は `set +o history` と `HISTFILE=/dev/null` を併用し、shell 履歴に credentials やパイプライン全体が残らないようにする。tmux / screen のスクロールバッファもクリアする手順を SOP に含める。

**5. `wrangler secret list` は名前のみ確認可能で値の検証は UT-26 経由**
Cloudflare Secrets はセキュリティ仕様で配置後の値読み取りができない。`bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <env>` で `GOOGLE_SERVICE_ACCOUNT_JSON` の名前存在のみ確認できる。新 key が正しく機能しているかは UT-26 の Sheets API 疎通テストでのみ検証可能であり、SOP の完了判定を「list で名前確認 + UT-26 疎通テスト PASS」の 2 段で固定する。

## 実行概要

1. ローテーション頻度（推奨: 90 日 / 180 日）と採用根拠を SOP 冒頭に明記する
2. Google Cloud Console での新 SA key 発行手順を `gcloud iam service-accounts keys create` ベースで記述する
3. 新 key 値を 1Password に保管し、`op://<Vault>/<Item>/<Field>` 参照のみを SOP に書く（実値・JSON 内容は禁止）
4. `op read ... | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env staging` で staging 上書き
5. `wrangler tail` で 60 秒以上待機し新規リクエストが新 key で完走することを確認
6. UT-26 の疎通テスト経路で staging が PASS することを確認
7. 同じ stdin 経路で `--env production` を明示して production 上書き
8. production でも `wrangler tail` 60 秒待機 + UT-26 疎通テスト PASS を確認
9. 24〜48 時間の grace period 経過後、Google Cloud Console で旧 key を disable（delete はせず 7 日間保持）
10. ローテーション完了記録テンプレートに実施日 / 実施者 / 旧 key fingerprint / 新 key fingerprint を追記
11. UT-25-DERIV-02 の失効監視 alert に新 key fingerprint を反映する（連携経路を SOP に明記）

## 完了条件

- [ ] SOP 文書が `doc/00-getting-started-manual/runbooks/sa-key-rotation-sop.md` として確定している
- [ ] ローテーション頻度（90 日 / 180 日のいずれか）が採用根拠付きで明記されている
- [ ] staging → production の上書き順序が固定されている
- [ ] `bash scripts/cf.sh secret put` が stdin 経由のみであることと `HISTFILE=/dev/null` 併用が明記されている
- [ ] 旧 key 失効猶予期間（grace period 24〜48 時間 + disable 後 7 日保持）が明記されている
- [ ] 無停止性確認手順（`wrangler tail` 60 秒待機 + UT-26 疎通テスト）が明記されている
- [ ] ローテーション失敗時の rollback 経路が `outputs/phase-13/rollback-runbook.md` を参照する形で記述されている
- [ ] 実 secret 値・JSON 内容・OAuth トークンが文書中に一切含まれていない（`op://` 参照のみ）
- [ ] 完了記録テンプレートが SOP に同梱されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md | 初回配置タスク仕様（前提） |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-11/main.md | §保証できない範囲（検出元） |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-12/unassigned-task-detection.md | UT-25-DERIV-01 検出記録 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets 配置方針との整合性 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare Workers デプロイ運用方針 |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | `.dev.vars` および環境変数管理方針 |
| 参考 | https://cloud.google.com/iam/docs/keys-create-delete | Google IAM SA key create/delete API |
| 参考 | https://developers.cloudflare.com/workers/configuration/secrets/ | wrangler secret put / list コマンドリファレンス |
| 参考 | scripts/cf.sh | op run + esbuild 解決込み Cloudflare CLI ラッパー |
