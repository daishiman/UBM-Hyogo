# Phase 11: 手動テスト - タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 11 |
| Phase名 | 手動テスト（NON_VISUAL） |
| 前提Phase | Phase 10 |
| 後続Phase | Phase 12 |
| ステータス | runtime_pending |
| 作成日 | 2026-05-24 |
| 機能名 | issue-838-schema-alias-rollback-notification |
| 実装区分 | 実装仕様書 |

---

## 目的

Phase 5-10 で実装した rollback 通知機能が、staging 環境で AC-1〜AC-7 を満たすことを runtime smoke によって確認する。手動テスト結果（smoke evidence）を tracked file として記録し、Phase 12 ドキュメント更新の証跡とする。

---

## NON_VISUAL 宣言

**本タスクは NON_VISUAL です。**

- 変更対象は `apps/api` バックエンドのみ（`apps/web` UI/UX 変更なし）
- スクリーンショットは不要であり、`outputs/phase-11/screenshots/` ディレクトリおよび `.gitkeep` は作成しない
- visual_category = NON_VISUAL（`index.md` メタ情報と一致）
- primary evidence: vitest / typecheck / lint 実行結果 + staging smoke ログ

---

## 評価軸

| 評価軸 | 適用 | 観点 |
| --- | --- | --- |
| Visual | N/A（NON_VISUAL） | — |
| Semantic | 適用 | 通知文面（Slack Block Kit / mail 本文）が rollback 内容を正確に伝えるか。actorRef が `admin:redacted` 形式で redact され生 email を含まないか |
| AI UX | 適用 | 運用者が rollback 発生を即時把握できるか。通知から audit log へのトレースが容易か |

---

## 実行タスク

### タスク0: Phase 10 完了確認

**目的**: Phase 10（最終レビュー）が PASS であることを確認してから手動テストに進む。

**実行手順**:
1. `outputs/phase-10/final-review-result.md` が存在し、総合判定が `PASS` であることを確認する
2. PASS でない場合は Phase 10 へ差し戻す

**期待される成果物**: 確認記録（`outputs/phase-11/manual-test-result.md` の冒頭に記載）

---

### タスク1: 自動テスト・静的解析の最終確認

**目的**: staging deploy 前に自動テスト・typecheck・lint がすべて green であることを確認する。

**実行手順**:
1. 以下コマンドを実行し、結果を `outputs/phase-11/manual-test-result.md` に記録する

```bash
# Node 24 / pnpm 10 で実行（mise exec 経由）
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter apps/api test run
```

2. 失敗がある場合は Phase 9 へ差し戻す（本 Phase では修正しない）
3. 全 green を確認したら次タスクへ進む

**期待される成果物**: `outputs/phase-11/manual-test-result.md`（§1 自動テスト結果）

---

### タスク2: staging deploy

**目的**: 最新の実装コードを staging 環境へデプロイし、smoke 実行環境を整える。

**実行手順**:
1. 以下コマンドで staging deploy する（Cloudflare CLI は必ず `scripts/cf.sh` 経由）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

2. deploy ログの最終行に "Deployed" が含まれることを確認し、`outputs/phase-11/manual-test-result.md`（§2 deploy 結果）に記録する
3. **注意**: deploy ログに `SLACK_WEBHOOK_URL` / `MAIL_PROVIDER_KEY` 等の secret 実値が出力された場合は、`outputs/phase-11/manual-test-result.md` には「secret set 確認済み（値は非記録）」とのみ記載し、実値を一切記録しない

---

### タスク3: staging smoke — AC-1 / AC-4 / AC-6 確認

**目的**: staging で schema alias rollback を実行し、Slack/mail 通知が dispatch されること・audit entry が記録されることを確認する（AC-1, AC-4, AC-6）。

#### シナリオ S-1: Slack 通知成功（SLACK_WEBHOOK_URL 設定済み）

**実行手順**:
1. staging の admin API に対して rollback リクエストを送る

```bash
# staging API base URL は wrangler.toml [env.staging] の route から取得
# actor は staging 用テストアカウントを使用
curl -s -X POST \
  "https://<staging-api-host>/admin/schema/aliases/<aliasId>/rollback" \
  -H "Authorization: Bearer <staging-admin-token>" \
  -H "Content-Type: application/json" \
  | jq .
```

2. HTTP レスポンスが `200` かつ rollback 結果 JSON が返ることを確認する
3. 設定済みの Slack チャンネルに通知メッセージが届いたことを確認する
4. 通知本文に `actorRef` が「`admin:redacted`」形式（生 email でない）になっていることを確認する（AC-2）
5. 以下コマンドで audit entry を確認する

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT audit_id, action, target_id, after_json, created_at FROM audit_log WHERE action = 'schema_alias.rollback_notification' ORDER BY created_at DESC LIMIT 5;"
```

6. `action = 'schema_alias.rollback_notification'` かつ `after_json` の `status = 'sent'`, `channel = 'slack'` であることを確認する
7. `after_json` に `actor_email` の生値・`stableKey` が含まれていないことを確認する（AC-2）

**期待確認事項**:
- rollback レスポンスが 200 であること
- Slack に通知が届いていること
- audit entry の `status = 'sent'`, `channel = 'slack'`
- `after_json` に PII/secret が含まれないこと

**期待される成果物**: `outputs/phase-11/manual-test-result.md`（§3-S1 Slack 通知成功）

---

#### シナリオ S-2: mail fallback（SLACK_WEBHOOK_URL 未設定またはあえて失敗させた場合）

**実行手順**:
1. staging 環境の `SLACK_WEBHOOK_URL` を一時的に無効な値にするか、または Slack 送信が失敗する条件を確認する
   - 確認コマンド: `bash scripts/cf.sh whoami`（設定確認のみ・実値表示しない）
2. rollback リクエストを送り、mail（`OPS_NOTIFICATION_EMAIL` 宛）に通知が届くことを確認する
3. audit entry の `status = 'sent'`, `channel = 'mail'` であることを確認する

> **注意**: `SLACK_WEBHOOK_URL` の実値変更は staging のみで行い、production に影響しないこと。変更後は元の設定に戻す。設定変更コマンド: `bash scripts/cf.sh secret put SLACK_WEBHOOK_URL --env staging`（値を op 参照経由で設定）。

**期待される成果物**: `outputs/phase-11/manual-test-result.md`（§3-S2 mail fallback）

> シナリオ S-2 は staging secret の一時変更を要するため、実施が困難な場合は「実施不可の理由」と「unit テストで同等シナリオをカバー済みであること」を記録して代替可とする。

---

#### シナリオ S-3: config 未設定（skipped）確認

**目的**: 両 channel 未設定時に rollback が 200 を返し audit に `skipped` が記録されることを確認する（AC-3, AC-5）。

**実行手順**:
1. unit テスト（Phase 4/6）で config gate シナリオがカバー済みであることを確認する
2. staging での直接確認が困難な場合は「Phase 4/6 unit テストで検証済み」と記録して代替可とする
3. 実施できる場合は両 channel 未設定の staging コピー環境または dry-run で確認し、`status = 'skipped'` の audit entry を記録する

**期待される成果物**: `outputs/phase-11/manual-test-result.md`（§3-S3 skipped 確認）

---

### タスク4: Semantic / AI UX 評価

**目的**: 通知文面・audit 構造が運用者の即時把握を支援するかを評価し、改善点があれば記録する。

**実行手順**:
1. S-1 で受信した Slack 通知メッセージを確認し、以下の観点で評価する

#### Semantic 評価

| 確認項目 | 期待 | 結果 |
| --- | --- | --- |
| aliasId が明記されているか | `*aliasId*\n<id>` として表示 | 記録 |
| 影響件数（affectedResponseCount）が明記されているか | 数値として表示 | 記録 |
| 再集計要否（recomputeRequired）が明記されているか | 「要」or「不要」として表示 | 記録 |
| actorRef が redact 形式（`admin:redacted`）か | 生 email でないこと | 記録 |
| 実行時刻が ISO8601 または可読形式か | タイムスタンプが含まれる | 記録 |

#### AI UX 評価

| 確認項目 | 期待 | 結果 |
| --- | --- | --- |
| 運用者が通知文面だけで rollback 発生を即時把握できるか | ヘッダー / subject に「rollback」が含まれる | 記録 |
| 通知から audit log へのトレースが容易か（aliasId で検索可能か） | aliasId が通知に含まれ、audit 検索条件として使える | 記録 |
| mail fallback 時の本文も同等情報を含むか | Slack と同等の情報構造 | 記録 |

2. HIGH（即時修正が必要）な問題がある場合は `unassigned-task/` に新規タスクとして記録し、Phase 12 未タスク検出レポートに含める
3. MINOR な改善点は Phase 12 未タスク候補として記録する

**期待される成果物**: `outputs/phase-11/manual-test-result.md`（§4 Semantic / AI UX 評価）

---

### タスク5: AC 達成確認チェックリスト

**目的**: AC-1〜AC-7 がすべて runtime smoke で確認されたことを記録する。

**実行手順**:
1. 以下チェックリストを `outputs/phase-11/manual-test-result.md`（§5 AC 達成確認）に転記して記入する

| AC | 内容 | 確認方法 | 結果 |
| --- | --- | --- | --- |
| AC-1 | Slack 優先 / mail fallback で通知 | S-1 / S-2 smoke | 記録 |
| AC-2 | payload に PII/secret 非包含 | audit after_json 目視 + actorRef 形式確認 | 記録 |
| AC-3 | notification failure が rollback(200) を壊さない | S-3 または unit テスト代替 | 記録 |
| AC-4 | status が audit entry に併記 | audit_log query 確認 | 記録 |
| AC-5 | channel 未設定で skipped | S-3 または unit テスト代替 | 記録 |
| AC-6 | runtime smoke evidence が tracked file として残る | manual-test-result.md の存在 | 記録 |
| AC-7 | 既存テスト回帰なし | typecheck / lint / vitest all green | 記録 |

---

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 10 最終レビュー | `outputs/phase-10/final-review-result.md` | PASS 確認 |
| 設計（採用案 A） | `phase-2-design.md` | topology / config gate / redaction 設計 |
| AC 一覧 | `phase-1-requirements.md` | AC-1〜AC-7 の検証基準 |
| Cloudflare CLI ラッパー | `scripts/cf.sh` | staging deploy / D1 execute |
| DB 命名（staging） | `apps/api/wrangler.toml` | `[env.staging]` の binding 名 |

---

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| 手動テスト結果 | `outputs/phase-11/manual-test-result.md` | smoke ログ・AC 達成確認・Semantic/AI UX 評価 |

> **NON_VISUAL のため `outputs/phase-11/screenshots/` は作成しない。**
> Phase 12 実装ガイドの「視覚証跡セクション」では `phase-10-final-review.md` と `phase-11/manual-test-result.md` を代替証跡として参照する。

---

## フィードバックループ

| 問題レベル | 対応 |
| --- | --- |
| HIGH（AC 未達・rollback が 200 を返さない・通知が全く届かない） | Phase 10 または実装 Phase へ差し戻し。`unassigned-task/` に追跡タスクを生成する |
| MINOR（Semantic 評価での文面改善・audit after_json の構造改善等） | Phase 12 未タスク検出レポートに記録。本 Phase では修正しない |
| INFO（smoke 実施困難でunit テスト代替を選択） | `manual-test-result.md` に理由と unit テスト代替を明記。Phase 12 でフォローアップ候補として記録 |

---

## 完了条件

- [ ] Phase 10 の PASS を確認した
- [ ] typecheck / lint / vitest が全 green であることを確認した
- [ ] staging deploy が成功した（deploy ログに secret 実値を記録しないこと）
- [ ] S-1（Slack 通知成功）を実施し結果を記録した
- [ ] S-2（mail fallback）または代替記録を実施した
- [ ] S-3（skipped）または unit テスト代替記録を実施した
- [ ] Semantic / AI UX 評価を実施した
- [ ] AC-1〜AC-7 の達成確認チェックリストを記入した
- [ ] `outputs/phase-11/manual-test-result.md` が tracked file として存在する

---

## タスク100%実行確認【必須】

- [ ] 本Phase内の全タスクを100%実行完了
- [ ] 各タスクを100%完了し、完了を明記
- [ ] 成果物が全て生成されていることを確認

---

## 次Phase

`phase-12-documentation.md`（ドキュメント更新）へ進む。Phase 11 完了まで Phase 12 へ進まない。
