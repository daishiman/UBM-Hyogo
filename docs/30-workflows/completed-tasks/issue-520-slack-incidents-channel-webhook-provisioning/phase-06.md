# Phase 6: 異常系検証 — issue-520-slack-incidents-channel-webhook-provisioning

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 6 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 5 ランブック Step A〜J が踏むパスに対し、**redaction-safe を絶対要件として** 異常系シナリオを E-1〜E-8 として網羅し、各ケースの期待動作・evidence path・recovery 手順を確定する。本 Phase は仕様確定のみ。実発火は Phase 11 で G1〜G4 を順次通過させて行う。

## 入力

- Phase 1 AC / 自走禁止 / G1〜G4
- Phase 2 設計（webhook 共有案 A / redaction pattern）
- Phase 3 リスク評価（webhook 漏洩 / channel 削除 / redaction 漏れ / env 識別ミス / 同期ずれ / 自走）
- Phase 4 テスト戦略
- Phase 5 ランブック Step A〜J

## 異常系ケース表

| ケース ID | シナリオ | 発火 step | 期待動作 | evidence path |
| --- | --- | --- | --- | --- |
| E-1 | webhook URL 誤投入（typo / 別 channel の URL を投入） | Step C/E/F/G | Phase 11 staging smoke が Slack から 4xx 返却。route 応答は redacted body のみで webhook URL fragment を露出しない。Slack 着弾なし | `outputs/phase-11/webhook-smoke-log.md` の E-1 セクション（status code + redacted snippet） |
| E-2 | production confirm ヘッダ欠落 | Phase 11 production smoke | route が 403 を返し、body に webhook URL fragment / token が出ない。Slack 未着弾 | webhook-smoke-log.md の E-2（403 response の redacted body 抜粋） |
| E-3 | token mismatch（Authorization 不正） | Phase 11 staging / production smoke | 401 を返し、response / log mock のいずれにも token 値・webhook URL fragment が出ない | webhook-smoke-log.md の E-3 |
| E-4 | Slack channel 削除 / rename | 運用継続中 | webhook が Slack 側で 404 を返す。route はリトライせず redacted error を返却。runbook の rotate 手順に従い channel 再作成 + webhook 再発行 | runbook `slack-incidents-channel-provisioning.md` の rotate セクション + webhook-smoke-log.md の追記 |
| E-5 | Cloudflare secret 未投入時の起動 | Step E/F 未実行で smoke 発火 | route が `SLACK_WEBHOOK_INCIDENT` 不在を検知し 503 または明示的設定エラー（webhook URL fragment 非露出）を返す | smoke-observability.test.ts の対応 unit test + webhook-smoke-log.md の E-5 |
| E-6 | 1Password 認証失効時の `cf.sh` 失敗 | Step E/F 実行中 | `op run` が auth error で exit。secret は投入されず、`cf.sh` 出力に webhook URL 実値が一切出ない（op が token を取得できないため fail-fast） | terminal log redacted snippet を channel-provisioning-log.md の E-6 |
| E-7 | redaction grep に webhook fragment hit | Step H | `rg` がいずれかの pattern で 1 件以上 hit → CI fail / commit / push / PR ブロック。即座に webhook rotate（Step B〜G 再実行） | CI log + channel-provisioning-log.md の E-7 + rotate 完了記録 |
| E-8 | Slack rate limit（429） | Phase 11 smoke 連続発火時 | route は再試行を行わず 429 を redacted body で返却。`Retry-After` を尊重し log には header 値のみ記録（body 値は redacted）。本 MVP では指数バックオフ等の自動再送は実装せず、手動再実行ポリシー | webhook-smoke-log.md の E-8（429 status + Retry-After 秒数のみ） |

## 各ケースの recovery 手順

### E-1: webhook URL 誤投入

1. Step E/F/G で投入した secret を `cf.sh secret delete` / `gh secret delete` で削除
2. 1Password item の url field を正しい値に更新（Slack admin から正規 webhook URL を再取得）
3. Step E/F/G を再実行
4. Step H redaction grep を再実行
5. staging smoke を再発火し `[STAGING SMOKE]` 着弾確認

### E-2: confirm ヘッダ欠落

- 期待動作。recovery 不要（403 は仕様）。webhook-smoke-log.md に「期待通り 403 / Slack 未着弾」を記録。

### E-3: token mismatch

- 期待動作。recovery 不要。token を正しい値に修正して再発火。

### E-4: channel 削除 / rename

1. Slack admin で `#ubm-hyogo-incidents` を再作成 or rename を revert
2. 削除された場合は webhook も無効化されているため Step B から再発行
3. Step C〜G で再投入 + Step H redaction grep
4. runbook `slack-incidents-channel-provisioning.md` の rotate セクションに incident timestamp を追記

### E-5: secret 未投入

1. `cf.sh secret list --env <env>` で `SLACK_WEBHOOK_INCIDENT` 存在を確認
2. 不在なら Step E/F に戻る
3. route が 503 / 設定エラーで止まることを確認（不可視状態で smoke を続行しない）

### E-6: 1Password 認証失効

1. `op signin` で再認証
2. `op vault list` で `UBM-Hyogo-Production` 視認可能か確認
3. Step E/F を再実行
4. shell history に op の auth token が残っていないか確認（`history` を grep して `op signin --raw` 等の出力が無いこと）

### E-7: redaction grep hit

1. **最優先**: hit した webhook URL を即座に Slack admin で disable
2. 1Password の url field を新規発行値で置換
3. Step E/F/G で全配置先を rotate
4. hit した file を編集して fragment を `<webhook-url-from-1password>` プレースホルダに置換 + commit
5. Step H grep を再実行し 0 hits を確認
6. PR body / evidence にも fragment が出ていないか目視 + grep

### E-8: Slack rate limit

1. 429 を確認したら手動で 60 秒以上待機
2. `Retry-After` header の値を尊重
3. 連続発火が頻発する場合は smoke の頻度を見直す（runbook に最低発火間隔を追記）

## redaction-safe 原則（全ケース共通）

| 観点 | 規約 |
| --- | --- |
| response body | webhook URL の host (`hooks.slack.com`) や path token を一切返さない |
| error body | Slack 側の 4xx/5xx エラーをそのまま中継しない（route で redact） |
| log / evidence | terminal log / unit test mock log / Phase 11 evidence file に fragment を残さない |
| PR body | Phase 13 PR body 作成前に Step H grep を再実行 |
| shell history | `history -c` を rotate 時に必ず実行 |

## G1〜G4 との紐付け

| ケース | 該当 gate | 検知 phase |
| --- | --- | --- |
| E-1 | G2/G3 後の smoke で検知 | Phase 11 G3/G4 |
| E-2 | G3 通過後の production smoke で検知 | Phase 11 G4 |
| E-3 | G2/G3 通過後の smoke で検知 | Phase 11 G3/G4 |
| E-4 | 運用フェーズ（Phase 11 以降） | runbook 内 incident |
| E-5 | G2/G3 直前の secret-verify で検知 | Phase 11 G2/G3 |
| E-6 | G2/G3 step 内で検知 | Phase 11 G2/G3 |
| E-7 | Step H redaction grep で検知 | Phase 9 / Phase 11 G4 / Phase 13 PR 直前 |
| E-8 | smoke 連続発火時 | Phase 11 G3/G4 |

## 検証コマンド

```bash
# 仕様書 dir に実値混入なし
! rg -n 'hooks\.slack\.com/services/[A-Za-z0-9]' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/
! rg -n 'B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/
! rg -n 'xox[bp]-' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/

# 必須ケース
grep -q "E-1\|E-8" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/phase-06.md
grep -q "redaction-safe" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/phase-06.md
grep -q "rotate\|recovery" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/phase-06.md
```

## 成果物

- `outputs/phase-06/main.md`

## DoD（完了条件）

- [ ] E-1〜E-8 の表が完備（シナリオ / 期待動作 / evidence path）
- [ ] 各ケースに recovery 手順
- [ ] redaction-safe 原則が全ケース共通として明示
- [ ] G1〜G4 との紐付け表が存在
- [ ] 仕様書に実値混入なし

## 次 Phase への引き渡し

Phase 7 へ: E-1〜E-8 の検知 phase と AC 紐付け（特に E-7 → AC-7 redaction）。Phase 7 では AC マトリクスに統合する。

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
