# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-29 |
| Wave | 1 |
| 実行種別 | parallel |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR 作成) |
| 状態 | spec_created |
| タスク分類 | implementation / docs sync（close-out） |
| user_approval_required | false |

## 目的

Phase 1〜11 で得られた設計・実装・smoke 知見を、`apps/api` 運用ドキュメント・正本仕様（`.claude/skills/aiworkflow-requirements/references/`）・LOGS / topic-map・GitHub Issue #41 (CLOSED) に反映し、close-out に必須の **5 タスク + Phase 12 自身の compliance check** を完了させる。Issue #41 は CLOSED のまま reopen せず仕様作成のみで履歴を完結させる方針（governance 採用条件）。same-wave sync ルールおよび二重 ledger 同期を必ず通す。

## 必須 5 タスク（task-specification-creator skill 準拠）

1. **実装ガイド作成（2 パート構成）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新（Step 1-A / 1-B / 1-C + 条件付き Step 2）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴作成** — `outputs/phase-12/documentation-changelog.md`
4. **未割当タスク検出レポート（0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`

加えて **Phase 12 自身の compliance check** を `outputs/phase-12/phase12-task-spec-compliance-check.md` に出力する（main.md と合わせて計 7 ファイル）。

## 実行タスク

- Task 12-1: 実装ガイド（Part 1 中学生 / Part 2 技術者）を 1 ファイルに統合作成する。
- Task 12-2: system-spec-update-summary を Step 1-A / 1-B / 1-C + 条件付き Step 2 で構造化記述する。
- Task 12-3: documentation-changelog をスクリプト（`scripts/generate-documentation-changelog.js`）相当のフォーマットで出力する。
- Task 12-4: unassigned-task-detection を 0 件でも必ず出力する（Phase 10 MINOR 指摘の formalize / 429 完全検証委譲 / production post-deploy smoke 委譲を含む）。
- Task 12-5: skill-feedback-report を改善点なしでも必ず出力する。
- Task 12-6: phase12-task-spec-compliance-check を実施する。
- Task 12-7: same-wave sync（LOGS.md ×2 / SKILL.md ×2 / topic-map）を完了する。
- Task 12-8: 二重 ledger（root `artifacts.json` と `outputs/artifacts.json`）を同期する。
- Task 12-9: `validate-phase-output.js` と `verify-all-specs.js` を実行し、全 PASS を確認する。
- Task 12-10: Issue #41 CLOSED governance 採用の Decision Log を index.md に記録する（reopen せず仕様作成のみで履歴完結）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Step 1-A/1-B/1-C / Step 2 / same-wave sync ルール |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | 同期手順 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/outputs/phase-11/manual-smoke-log.md | smoke 結果の引き継ぎ |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/outputs/phase-11/troubleshooting-runbook.md | 403 runbook |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/outputs/phase-10/go-no-go.md | GO 判定 / 残課題 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets / .dev.vars 管理 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | smoke route 規約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/topic-map.md | topic-map 同期対象 |
| 必須 | docs/30-workflows/LOGS.md | task-level LOGS 同期対象 |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-12.md | 構造リファレンス |

## 実行手順

### ステップ 1: 実装ガイド作成（タスク 1）

`outputs/phase-12/implementation-guide.md` に以下 2 パートを記述する。

**Part 1（中学生レベル / 日常の例え話必須・3 つ以上）**:

- 「Google スプレッドシートに保存された会員情報を、本当に Cloudflare のサーバー（apps/api）から読み出せるかを確かめる『試運転』です」
- 例え話 1（鍵交換）: 「Service Account JSON は『学校の図書室の鍵を借りるための職員証』です。職員証を持っていれば（JWT を作って Google に渡せば）、図書室を開ける一時的な鍵（access token）を 1 時間貸してもらえます」
- 例え話 2（キャッシュ）: 「1 時間のうちに何度も本を借りに行くなら、毎回鍵を借り直さず最初に借りた鍵をポケットに入れておけば速い（in-memory cache）」
- 例え話 3（403 切り分け）: 「鍵で開かないとき、(a) 図書室の名簿に職員が載っていない / (b) 職員証の文字がにじんでいる / (c) 図書室自体が今日休館 / (d) そもそも違う部屋の鍵を持ってきた、の 4 通りを 1 つずつ確認します」
- 専門用語チェック: 「JWT」「Edge Runtime」「Web Crypto API」「OAuth 2.0」を使う場合は括弧で日常語注釈を必ず添える。

**Part 2（技術者レベル）**:

- TypeScript インターフェース: `SmokeTestResult` / `SheetsAuthClient`（UT-03 から再利用）/ `TokenCacheEntry` / `SmokeErrorCode`（`smoke_unauthorized` / `sheets_permission_denied` / `sheets_rate_limited` / `sheets_invalid_spreadsheet`）
- API シグネチャ: `GET /admin/smoke/sheets`（dev/staging のみ） — Bearer 認証、レスポンス `{ ok, spreadsheetId, sheetTitle, rowCount, sampleRow, tokenCache: 'hit'|'miss', latencyMs }`
- エラーハンドリング: 401（無効 token）/ 403（PERMISSION_DENIED → 4 ステップ runbook 参照）/ 429（rate_limited / UT-10 へ委譲）/ 5xx（generic_sheets_error）
- 設定可能パラメータ: `SHEETS_SPREADSHEET_ID`（Variable）/ `GOOGLE_SHEETS_SA_JSON`（Secret）/ `SMOKE_ADMIN_TOKEN`（Secret）/ token TTL（既定 3600s）/ smoke route enabled flag（`[env.production]` では未バインドにより 404）

### ステップ 2: システム仕様更新（タスク 2）

`outputs/phase-12/system-spec-update-summary.md` を以下で構造化する。

**Step 1-A: 完了タスク記録 + 関連 doc リンク + 変更履歴 + LOGS.md ×2 + topic-map**

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | UT-26 の Phase 1〜13 spec_created 行追記 |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | requirements skill 側の同期参照ログ + 403 troubleshooting runbook 追加 |
| `.claude/skills/task-specification-creator/LOGS.md` | task-specification skill 側のフィードバック記録ログ |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴テーブル（更新事項あれば） |
| `.claude/skills/task-specification-creator/SKILL.md` | 変更履歴テーブル（更新事項あれば） |
| `.claude/skills/aiworkflow-requirements/references/topic-map.md` | 「Sheets API 疎通確認 / 403 troubleshooting」キーワードへのリンク追加 |
| 関連 doc リンク | UT-03 / UT-25 / 01c-parallel-google-workspace-bootstrap / UT-09 / UT-10 への双方向リンク |

**Step 1-B: 実装状況テーブル更新（spec_created）**

- 統合 README の実装状況テーブルで UT-26 を `spec_created` として記録（実コード混入時は `implemented` へ再判定）。
- `docs/30-workflows/unassigned-task/UT-26-sheets-api-e2e-smoke-test.md` から本タスクへのリンクを記録。

**Step 1-C: 関連タスクテーブル更新**

- UT-03 / UT-25 / 01c / UT-09 / UT-10 の index.md「下流 / 関連」テーブルに UT-26 spec_created 情報を反映。

**Step 2（条件付き）: 新規インターフェース追加時のみ**

- 本タスクは `GET /admin/smoke/sheets` の dev 限定エンドポイントを新設するため、`.claude/skills/aiworkflow-requirements/references/api-endpoints.md` に dev only / staging only / production disabled の三段階で記載する。
- `deployment-secrets-management.md` に「403 切り分け 4 ステップ」セクションを追加する（troubleshooting-runbook への双方向リンク）。
- `architecture-overview-core.md` には変更なし（apps/api 境界は不変）。
- 実コード（apps/api 配下）に変更が入った場合は `docs_only=false` / `implemented` へ再判定する。

**CLOSED Issue governance 記録**

- Issue #41 は CLOSED のまま reopen しない方針（採用条件: 既存方針の追認 / docs-only 再構築 / 仕様書として履歴を残すこと自体が目的）。
- index.md の Decision Log に「Issue #41 を reopen せず仕様作成のみで履歴を完結させる」根拠を 1 段落明記する。
- Issue #41 へは PR / 仕様書リンクを comment で残す（双方向リンク維持）。

### ステップ 3: ドキュメント更新履歴作成（タスク 3）

`scripts/generate-documentation-changelog.js`（または相当の手動フォーマット）で `outputs/phase-12/documentation-changelog.md` を生成する。

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-29 | 新規 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/ | UT-26 仕様書 13 Phase + index + artifacts.json |
| 2026-04-29 | 同期 | docs/30-workflows/LOGS.md | UT-26 spec_created 行追加 |
| 2026-04-29 | 同期 | .claude/skills/aiworkflow-requirements/LOGS.md | 403 troubleshooting runbook 追加記録 |
| 2026-04-29 | 同期 | .claude/skills/task-specification-creator/LOGS.md | NON_VISUAL smoke の Phase 11 適用例を追記 |
| 2026-04-29 | 同期 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/smoke/sheets` dev only 規約追加 |
| 2026-04-29 | 同期 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | 403 切り分け 4 ステップ |
| 2026-04-29 | 同期 | .claude/skills/aiworkflow-requirements/references/topic-map.md | キーワード追加 |

### ステップ 4: 未割当タスク検出レポート（タスク 4 / 0 件でも出力必須）

Phase 10 MINOR 指摘の formalize を含めて `outputs/phase-12/unassigned-task-detection.md` を出力する（0 件の場合も「該当なし」のセクションは必ず作成する）。

| 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- |
| 429 レート制限の完全検証 | 検証 | 強制負荷で実 429 を観測しエラー分類を最終確定 | UT-10 error-handling-standardization |
| production 環境への post-deploy smoke | 実作業 | UT-09 production deploy 直後の read-only 疎通 | UT-09 後段 / 09b-cron-runbook |
| token cache 複数 isolate 跨ぎ挙動 | 検証 | KV ベースキャッシュへの移行検討 | next wave（任意） |
| smoke route の production disable 検証 | 設計 | `[env.production]` で route 自体が未バインドであることの自動テスト化 | UT-26 後段 / verify-all-specs.js 拡張 |
| 403 runbook の SKILL references 化 | ドキュメント | `deployment-secrets-management.md` への正式昇格 | Phase 12 Step 2 で実施 |

### ステップ 5: スキルフィードバックレポート（タスク 5 / 改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を出力する。

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | NON_VISUAL smoke（curl / wrangler tail / structured log）が Phase 11 で screenshots 除外と整合 | NON_VISUAL の場合の `outputs/phase-11/screenshots/` 自動除外チェックをテンプレ化 |
| aiworkflow-requirements | 403 troubleshooting の 4 ステップ runbook が `deployment-secrets-management.md` に存在しない | references に「外部 API 認証エラー切り分け」共通セクション追加 |
| github-issue-manager | Issue #41 (CLOSED) に対して reopen せず仕様作成のみで履歴を完結させる governance パターン | CLOSED Issue governance のテンプレ section をスキル references に追加 |

### ステップ 6: Phase 12 compliance check（必須）

`outputs/phase-12/phase12-task-spec-compliance-check.md` で以下を検証する。

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 7 ファイル（main.md + 6 補助）が揃っている | `outputs/phase-12/` 配下 | PASS |
| 実装ガイドが Part 1 / Part 2 構成 | 中学生例え話 3 つ以上 / 技術者 IF・API・パラメータ | PASS |
| Step 1-A / 1-B / 1-C が記述 | system-spec-update-summary に含まれる | PASS |
| Step 2 の必要性判定 | 新規 IF 追加時のみ実施 / smoke route + runbook 追加分 | PASS |
| same-wave sync が完了 | LOGS.md ×2 + SKILL.md ×2 + topic-map | PASS |
| 二重 ledger が同期 | root artifacts.json / outputs/artifacts.json | PASS |
| artifacts phase outputs が必須成果物と一致 | Phase 12 outputs に `main.md` / Task 1〜5 / compliance check / `outputs/artifacts.json` を含む | PASS |
| Phase 13 承認ゲートが機械可読 | root / outputs ledger で `status = approval_required`、`user_approval_required = true` | PASS |
| validate-phase-output.js | 全 Phase PASS | PASS |
| verify-all-specs.js | 全 spec PASS | PASS |
| Issue #41 CLOSED governance 記録 | index.md Decision Log に明記 | PASS |
| Secret hygiene | SA JSON / Bearer / private_key の平文が成果物に無い | PASS |

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| LOGS #1 | .claude/skills/aiworkflow-requirements/LOGS.md | YES |
| LOGS #2 | .claude/skills/task-specification-creator/LOGS.md | YES |
| SKILL #1 | .claude/skills/aiworkflow-requirements/SKILL.md | YES（更新事項あれば） |
| SKILL #2 | .claude/skills/task-specification-creator/SKILL.md | YES（更新事項あれば） |
| Index | .claude/skills/aiworkflow-requirements/references/topic-map.md | YES |

## 二重 ledger 同期【必須】

- root `artifacts.json`（タスク直下）と `outputs/artifacts.json`（生成物 ledger）を必ず同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType` / `github_issue_state`（CLOSED 維持）。
- Phase 12 outputs は `main.md`、Task 1〜5 の 5 ファイル、`phase12-task-spec-compliance-check.md`、`outputs/artifacts.json` を root / outputs ledger の両方に列挙する。
- Phase 13 は root / outputs ledger の両方で `status = approval_required`、`user_approval_required = true` とし、`index.md` の Phase 一覧と一致させる。
- 片方のみ更新は禁止（drift の主要原因）。

## spec_created close-out ルール【必須】

- 本タスクは `metadata.taskType = "implementation"` だが、本ターンでは仕様書作成のみで実コード混入は無い前提。
- 実コード（`apps/api/src/routes/admin/smoke-sheets.ts` 等）が混入した場合は `docs_only=false` / `implemented` に再判定し、Step 2 正本仕様同期を完了させる。
- Phase 11 NON_VISUAL の場合 `outputs/phase-11/screenshots/` を作らないルールを compliance check で再確認。

## validate-phase-output.js / verify-all-specs.js 実行確認

```bash
node scripts/validate-phase-output.js \
  --task ut-26-sheets-api-e2e-smoke-test

node scripts/verify-all-specs.js
```

- 期待: 両方とも exit code 0 / 全 PASS。
- FAIL 時: 該当 Phase の `outputs/` 不足ファイルまたは artifacts.json の drift を是正してから再実行。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | smoke 結果と既知制限・troubleshooting-runbook を `system-spec-update-summary.md` に転記 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 / Issue #41 CLOSED 取扱を引き渡し |
| 関連タスク | UT-03 / UT-25 / 01c / UT-09 / UT-10 の index.md を双方向更新 |

## 多角的チェック観点

- 価値性: Part 1 が非エンジニアでも読めるレベルになっているか（例え話 3 つ以上 / 専門用語注釈）。
- 実現性: Step 2 が実際の references 構造（api-endpoints.md / deployment-secrets-management.md）と整合しているか。
- 整合性: same-wave sync の 2 LOGS / 2 SKILL と topic-map が最新コミットで一致しているか。
- 運用性: unassigned-task-detection の委譲先タスクが実在 ID（UT-09 / UT-10）か。
- 認可境界: implementation-guide の API シグネチャが Phase 5 と一致し、production では disabled になることが明示されているか。
- Secret hygiene: ガイド内のサンプルコードに実 token / 実 SA JSON / 完全な spreadsheetId が含まれていないか。
- governance: Issue #41 CLOSED に対する reopen 不要判断が Decision Log に明文化されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装ガイド Part 1（中学生） | 12 | spec_created | 例え話 3 つ以上 |
| 2 | 実装ガイド Part 2（技術者） | 12 | spec_created | IF / API / 設定パラメータ |
| 3 | system-spec-update-summary | 12 | spec_created | Step 1-A/B/C + Step 2 |
| 4 | documentation-changelog | 12 | spec_created | スクリプト準拠フォーマット |
| 5 | unassigned-task-detection | 12 | spec_created | 0 件でも出力 |
| 6 | skill-feedback-report | 12 | spec_created | 改善点なしでも出力 |
| 7 | phase12-compliance-check | 12 | spec_created | 全 PASS |
| 8 | same-wave sync (LOGS×2 / SKILL×2 / topic-map) | 12 | spec_created | 必須 |
| 9 | 二重 ledger 同期 | 12 | spec_created | root + outputs |
| 10 | validate / verify スクリプト | 12 | spec_created | exit 0 |
| 11 | Issue #41 CLOSED governance Decision Log | 12 | spec_created | reopen せず履歴完結 |

## 成果物（必須 7 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 本体 | outputs/phase-12/main.md | Phase 12 本体サマリー |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生） + Part 2（技術者） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/1-B/1-C + 条件付き Step 2 |
| 履歴 | outputs/phase-12/documentation-changelog.md | 全変更ファイル一覧 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 0 件でも必須 |
| FB | outputs/phase-12/skill-feedback-report.md | 改善点なしでも必須 |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | 全項目 PASS |
| メタ | artifacts.json (root) | Phase 12 状態の更新 |
| メタ | outputs/artifacts.json | 生成物 ledger 同期 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 必須 7 ファイルが `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成で、Part 1 に日常の例え話が 3 つ以上含まれる
- [ ] Part 1 の専門用語（JWT / Edge Runtime / Web Crypto / OAuth 2.0）に日常語注釈がある
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C / Step 2（必要性判定含む）が明記
- [ ] documentation-changelog に変更ファイルが網羅されている
- [ ] unassigned-task-detection が 0 件でも出力されている（実際は 5 件想定）
- [ ] skill-feedback-report が改善点なしでも出力されている
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] same-wave sync（LOGS ×2 / SKILL ×2 + topic-map）が完了
- [ ] 二重 ledger（root + outputs の artifacts.json）が同期
- [ ] `validate-phase-output.js` / `verify-all-specs.js` が exit code 0
- [ ] Issue #41 CLOSED governance Decision Log が index.md に明記
- [ ] 成果物に SA JSON / Bearer / private_key の平文が無い

## タスク100%実行確認【必須】

- 全実行タスク（10 件）が `spec_created`
- 必須 7 成果物が `outputs/phase-12/` に配置される設計になっている
- Issue #41 CLOSED governance（reopen せず仕様作成のみで履歴完結）が記録される設計
- Step 2 再判定（実コード混入時）が手順に含まれている
- artifacts.json の `phases[11].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection → 関連タスク（UT-09 / UT-10）への双方向リンク反映済み
  - Issue #41 CLOSED 取扱 → PR では "Re-link to closed issue #41 (UT-26)" として扱う
- ブロック条件:
  - 必須 7 ファイルのいずれかが欠落
  - same-wave sync が未完了（LOGS ×2 / SKILL ×2 + topic-map）
  - 二重 ledger に drift がある
  - validate / verify スクリプトが FAIL
  - 実コード変更に対する Step 2 正本仕様同期が未実施
  - Issue #41 CLOSED governance Decision Log が未記録
