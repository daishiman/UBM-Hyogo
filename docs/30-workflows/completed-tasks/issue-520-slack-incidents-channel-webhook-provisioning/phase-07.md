# Phase 7: AC マトリクス — issue-520-slack-incidents-channel-webhook-provisioning

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 7 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で確定した AC-1〜AC-8 を、Phase 4 テスト戦略 / Phase 5 ランブック / Phase 6 異常系の出力と突き合わせ、**検証コマンド / evidence path / G ゲート紐付け / status / 失敗時 treatment** を 1 行 1 AC で確定する。Phase 9 / Phase 10 / Phase 11 / Phase 13 のいずれの段階でも本マトリクスを直接参照して通過判定する。

## 入力

- Phase 1 AC-1〜AC-8 / G1〜G4 / evidence path
- Phase 4 テスト分類表 / redaction grep pattern / secret-verify コマンド
- Phase 5 Step A〜J / 各 Step の DoD
- Phase 6 異常系 E-1〜E-8

## AC マトリクス（status は仕様書段階で全て pending）

| AC | 内容（要約） | 検証コマンド | evidence path | G ゲート | 関連 E ケース | status |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | `#ubm-hyogo-incidents` channel が存在し integration が posting 権限を持つ | Slack admin UI 目視確認 + `outputs/phase-11/channel-provisioning-log.md` の channel ID 先頭 4 文字記録 | `outputs/phase-11/channel-provisioning-log.md` (G1) | G1 | E-4 | pending |
| AC-2 | webhook URL が 1Password に保管。実値はドキュメント・evidence・log に出ない | `op item get "SLACK_WEBHOOK_INCIDENT" --vault UBM-Hyogo-Production --format json \| jq '.fields[] \| select(.label=="url") \| .label'`（label のみ表示・値非表示） | `outputs/phase-11/channel-provisioning-log.md` (G2 - op 参照 path のみ記録) | G1/G2 | E-1, E-7 | pending |
| AC-3 | Cloudflare Workers staging+production 双方の secret として `cf.sh secret put` 経由で投入済み | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging \| grep SLACK_WEBHOOK_INCIDENT` / `--env production` | `outputs/phase-11/channel-provisioning-log.md` (G2 staging) + `outputs/phase-11/webhook-smoke-log.md` (G3 production) | G2/G3 | E-5, E-6 | pending |
| AC-4 | GitHub Actions secret として登録済み | `gh secret list --repo daishiman/UBM-Hyogo \| grep SLACK_WEBHOOK_INCIDENT` | `outputs/phase-11/channel-provisioning-log.md` (Step G 記録) | G2 | E-5 | pending |
| AC-5 | staging smoke POST が `[STAGING SMOKE]` prefix で `#ubm-hyogo-incidents` に着弾 | issue-495 spec の staging route に対する手動 POST + Slack UI で prefix 確認 | `outputs/phase-11/webhook-smoke-log.md` (G3 - staging permalink の channel 名 + timestamp + first 4 chars のみ記録) | G3 | E-1, E-3 | pending |
| AC-6 | production smoke POST が `[PRODUCTION SMOKE]` prefix で着弾 | 同 production route + `x-smoke-production-confirm: YES` で POST + Slack UI 確認 | `outputs/phase-11/webhook-smoke-log.md` (G4 production セクション) | G3/G4 | E-1, E-2, E-3, E-8 | pending |
| AC-7 | response / log / evidence / PR 本文に webhook URL fragment が一切露出しない（redaction-safe） | `rg -n 'hooks\.slack\.com/services/' .` / `rg -n 'B[0-9A-Z]{8,}' .` / `rg -n 'xox[bp]-' .` がすべて 0 hits + `apps/api/src/routes/admin/smoke-observability.test.ts` redaction unit test PASS | `outputs/phase-11/webhook-smoke-log.md` (G4 grep 0 hits 証跡) + Phase 13 PR body grep 結果 | G4 + Phase 13 直前 | E-7 | pending |
| AC-8 | `observability-monitoring.md` / `deployment-secrets-management.md` に channel 名・webhook 命名規則・op:// 参照規約・redaction 規約が反映済み | `git diff main...HEAD -- .claude/skills/aiworkflow-requirements/references/observability-monitoring.md .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` で diff 確認 + indexes 再生成 | Phase 12 `outputs/phase-12/main.md` の差分要約 | Phase 9〜10 | - | pending |

## redaction-safe AC（AC-7）の grep コマンド明示

```bash
cd "$(git rev-parse --show-toplevel)"

# 1. Slack incoming webhook host + path 先頭
rg -n 'hooks\.slack\.com/services/' . && echo "FAIL AC-7" || echo "OK AC-7 pattern 1"

# 2. webhook URL の B<id>/<token> fragment
rg -n 'B[0-9A-Z]{8,}' . && echo "FAIL AC-7" || echo "OK AC-7 pattern 2"

# 3. Slack bot / user token
rg -n 'xox[bp]-' . && echo "FAIL AC-7" || echo "OK AC-7 pattern 3"

# 4. .gitignore された .env を含めた full scan（op:// 参照のみであることを確認）
rg -n --hidden --no-ignore 'hooks\.slack\.com/services/' . \
  | grep -v '^node_modules/' \
  || echo "OK AC-7 hidden scan"
```

3 pattern すべて 0 hits で AC-7 を PASS とする。

## AC を満たさない場合の treatment

| AC | 失敗パターン | treatment |
| --- | --- | --- |
| AC-1 | channel 不在 / private 設定でない / integration 不在 | Phase 11 G1 差し戻し。Step A/B を再実行 |
| AC-2 | 1Password に item が無い / field 名が違う / 実値が他所に漏洩 | G2 差し戻し + (漏洩時) **即時 webhook rotate**（E-7 recovery） |
| AC-3 | staging or production に secret 不在 | G2/G3 差し戻し。Step E/F を再実行（`cf.sh secret put`） |
| AC-4 | GitHub secret 不在 | Step G を再実行 |
| AC-5 | staging smoke 未着弾 / prefix 違い | **G3 進行禁止**。E-1/E-3 recovery を実行し再発火 |
| AC-6 | production smoke 未着弾 / prefix 違い / confirm bypass | G4 差し戻し + 自動 rollback。production secret は維持しつつ smoke のみ再発火 |
| AC-7 | grep gate hit | **fail-fast**: commit / push / PR をブロック。E-7 recovery（webhook rotate + 全配置先 rotate + file 修正 + grep 再実行） |
| AC-8 | docs 反映漏れ | Phase 9〜10 で差し戻し。Step I を再実行 + indexes:rebuild |

## fail-fast / 自動 rollback / G ゲート差し戻し の方針サマリ

| 種別 | 適用 AC |
| --- | --- |
| fail-fast（commit/push/PR ブロック） | AC-7 |
| 自動 rollback（直前の secret 配置を delete + 再投入） | AC-3, AC-4 |
| G ゲート差し戻し（前 gate へ戻す） | AC-1, AC-2, AC-5, AC-6 |
| Phase 9〜10 への戻し | AC-8 |

## 検証コマンド

```bash
# 仕様書 dir に実値混入なし
! rg -n 'hooks\.slack\.com/services/[A-Za-z0-9]' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/
! rg -n 'B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/
! rg -n 'xox[bp]-' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/

# AC マトリクスが全 AC を含む
for n in 1 2 3 4 5 6 7 8; do
  grep -q "AC-${n} " docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/phase-07.md \
    || echo "MISSING AC-${n}"
done

# G ゲート紐付けが全 AC に存在
grep -q "G1\|G2\|G3\|G4" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/phase-07.md

# treatment 規約
grep -q "fail-fast\|rollback\|差し戻し" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/phase-07.md
```

## 成果物

- `outputs/phase-07/main.md`

## DoD（完了条件）

- [ ] AC-1〜AC-8 が 1 行 1 AC で表化（検証コマンド / evidence path / G ゲート / E ケース / status）
- [ ] AC-7 の redaction grep コマンドが明示
- [ ] 失敗時 treatment（fail-fast / 自動 rollback / G ゲート差し戻し / Phase 9〜10 戻し）が AC ごとに割り当て済み
- [ ] status は全 AC で `pending`（仕様書段階）
- [ ] 仕様書に実値混入なし

## 次 Phase への引き渡し

Phase 8 へ: AC マトリクス（検証コマンド / evidence path / 失敗時 treatment）。Phase 8 では DRY 化観点で重複定義（特に redaction grep pattern が Phase 4/5/6/7 で 4 箇所に重複）を 1 箇所に集約できるか検討する。

## 実行タスク

- 本 Phase の確定事項を対応する outputs/phase-* 成果物へ反映する。

## 参照資料

- 本 workflow の前段 Phase。
- task-specification-creator / aiworkflow-requirements の該当 reference。

## 完了条件

- [ ] 必須成果物が存在する
- [ ] runtime pending と static PASS の境界が明記されている

## 統合テスト連携

- ローカル静的検証は focused test / validator / redaction grep で行い、実 Slack / secret / smoke は user approval 後の Phase 11 runtime wave で実行する。
