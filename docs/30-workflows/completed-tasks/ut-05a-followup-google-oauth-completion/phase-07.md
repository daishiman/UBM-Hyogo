# Phase 7: AC マトリクス / カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Google OAuth Staging Smoke + Production Verification 統合 (UT-05A-FOLLOWUP-OAUTH) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス / カバレッジ確認 |
| 作成日 | 2026-04-30 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | spec_created |
| タスク分類 | specification-design（traceability） |
| taskType | implementation |
| visualEvidence | VISUAL |

## 目的

`index.md` で確定した AC-1〜AC-12 を唯一の AC registry として、Phase 4（テスト戦略）/ Phase 5（実装ランブック）/ Phase 6（異常系）/ Phase 11（手動 smoke evidence）の各成果物に縦串でトレースする。本タスクは OAuth 設定運用変更タスクであり、自動テストの line/branch coverage は対象外のため、代替指標（手動 smoke 実行 PASS 率 / evidence 配置率 / 設定整合率）を確定する。staging（A）→ verification 申請（B）→ production smoke（C）の段階適用フローと、AC が staging / production のどちらの evidence path に紐付くかを明示する。

## 実行タスク

1. AC × 6 列（AC ID / 内容 / 検証方法 / evidence path / Phase / 状態）の 12 行マトリクスを完成する（完了条件: 空セル無し / staging or production の path がすべて指定）。
2. 段階適用 A/B/C と AC の対応を明示する（完了条件: AC ごとに該当 stage が記録）。
3. coverage 代替指標 3 種を確定する（完了条件: 目標値・計測方法が指定）。
4. 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）を Phase 4〜6 の成果物を踏まえて更新する（完了条件: 各条件で根拠ファイルが引用される）。
5. Phase 9 / Phase 11 への引き継ぎ項目（実測 evidence・gap 分析）を予約する（完了条件: 引き継ぎ箇条書きが明示）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/index.md | AC-1〜AC-12 の唯一の registry |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/phase-04.md | テスト戦略 |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/phase-05.md | 実装ランブック |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/phase-06.md | 異常系（failure case） |
| 必須 | docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/smoke-checklist.md | M-01〜M-11 / F-09 / F-15 / F-16 / B-01 の test ID 一覧 |
| 必須 | docs/00-getting-started-manual/specs/02-auth.md / 13-mvp-auth.md | secrets 配置 / B-03 状態の参照先 |
| 必須 | CLAUDE.md | scripts/cf.sh 経由実行ルール / wrangler login 禁止 |

## AC マトリクス（12 行）

| AC ID | 内容 | 検証方法 | evidence path | Phase | 状態 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | Google Cloud Console の OAuth client（staging / production）が同一 project / 同一 consent screen で登録され、redirect URI 一覧が `outputs/phase-02/oauth-redirect-uri-matrix.md` と一致 | Phase 5 runbook Step「redirect URI 一覧確認」で Console 設定を screenshot 化し、matrix 表と diff 0 を確認 | `outputs/phase-02/oauth-redirect-uri-matrix.md` / `outputs/phase-11/staging/redirect-uri-actual.md` / `outputs/phase-11/production/redirect-uri-actual.md` / `outputs/phase-11/production/oauth-client-screenshot.png` | Phase 5 / Phase 11 (Stage A + Stage B) | spec_created |
| AC-2 | Cloudflare Secrets（`AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`）が staging / production 環境双方で設定済（`bash scripts/cf.sh` 経由のみ。平文ファイル不在） | Phase 5 runbook で `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <staging\|production>` を実行し、key 名のみ stdout に出ることを確認（値は出力されない）。`git grep` で実値混入 0 を再確認 | `outputs/phase-11/staging/secrets-list.txt` / `outputs/phase-11/production/secrets-list.txt` | Phase 5 / Phase 11 (Stage A + Stage C) | spec_created |
| AC-3 | 1Password / GitHub Secrets / Cloudflare Secrets の配置表が `outputs/phase-02/secrets-placement-matrix.md` で更新され、`02-auth.md` および `13-mvp-auth.md` から参照される | Phase 12 で 2 ドキュメントから link 参照を追記し、参照 path が一致するか grep | `outputs/phase-02/secrets-placement-matrix.md` / `outputs/phase-12/system-spec-update-summary.md` | Phase 2 / Phase 12 | spec_created |
| AC-4 | staging で OAuth smoke 9 ケース（M-01〜M-11 / F-09 / F-15 / F-16 / B-01）が PASS。screenshot 9 枚 / curl response / `session-member.json` / `session-admin.json` / `wrangler-dev.log` が `outputs/phase-11/staging/` に配置 | Phase 11 Stage A の手動 smoke 実行。`smoke-checklist.md` の test ID を順次実行し PASS / FAIL を `manual-smoke-log.md` に記録 | `outputs/phase-11/staging/screenshot-{M-01..M-11,F-09,F-15,F-16,B-01}.png` / `outputs/phase-11/staging/curl-output.txt` / `outputs/phase-11/staging/session-member.json` / `outputs/phase-11/staging/session-admin.json` / `outputs/phase-11/staging/wrangler-dev.log` | Phase 11 (Stage A) | spec_created |
| AC-5 | `/login?gate=...` redirect、`/admin/*` 非管理者 redirect、admin_users.active 一致時のみ `/admin` へ進める動作が staging 実機で確認 | Phase 11 Stage A で M-04 / M-05 / M-08 を実行し、redirect chain（302 → `/login?gate=...`、302 → `/admin`）を curl の `Location` header で検証 | `outputs/phase-11/staging/admin-gate-redirect.txt` / `outputs/phase-11/staging/screenshot-M-04.png` / `outputs/phase-11/staging/screenshot-M-08.png` | Phase 11 (Stage A) | spec_created |
| AC-6 | Google OAuth consent screen が production / verification submitted（または verified）ステータスとなり、Google Cloud Console 設定 screenshot を `outputs/phase-11/production/consent-screen.png` に保存 | Phase 11 Stage B で Console「OAuth 同意画面」を Production publishing で submit し、submission 完了画面の screenshot を保存。verification status を `verification-submission.md` に記録 | `outputs/phase-11/production/consent-screen.png` / `outputs/phase-11/production/verification-submission.md` | Phase 11 (Stage B) | spec_created |
| AC-7 | testing user 以外の Google account（外部 Gmail）で本番 login smoke が PASS。screenshot を `outputs/phase-11/production/login-smoke.png` に保存 | Phase 11 Stage C で testing user 未登録の Gmail で `/login` → Google 同意画面 → `/admin` 到達まで実機実行し screenshot 撮影。session token / cookie 値は mask | `outputs/phase-11/production/login-smoke.png` / `outputs/phase-11/production/login-smoke-log.md` | Phase 11 (Stage C) | spec_created |
| AC-8 | privacy policy / terms / homepage URI が production domain で 200 を返し、Google verification 申請の URL 要件を満たす | Phase 5 runbook で `curl -I https://<production-domain>/privacy` / `/terms` / `/` の 3 URL を実行し HTTP 200 を確認。出力を保存 | `outputs/phase-11/production/url-200-check.txt` | Phase 5 / Phase 11 (Stage B 前提) | spec_created |
| AC-9 | `scripts/cf.sh` 経由以外で `wrangler login` / 平文 token を保持していないことを `git grep` / `~/Library/Preferences/.wrangler/` 不在チェックで確認 | Phase 5 runbook で `git grep -nE "(CLOUDFLARE_API_TOKEN=|wrangler login)"` が 0 件、`ls ~/Library/Preferences/.wrangler/config/default.toml` が `No such file` であることを確認 | `outputs/phase-11/staging/wrangler-login-absence.txt` / `outputs/phase-11/production/wrangler-login-absence.txt` | Phase 5 / Phase 11 (Stage A + Stage C) | spec_created |
| AC-10 | 既知制約 B-03（testing user 以外ログイン不能）が解除済 または verification submitted で待機中として `13-mvp-auth.md` から状態が読み取れる | Phase 12 で `13-mvp-auth.md` の B-03 セクションに verification status（verified / submitted / testing-user-only）を追記し、本タスク Phase 11 evidence へ link | `outputs/phase-12/system-spec-update-summary.md` / `docs/00-getting-started-manual/specs/13-mvp-auth.md`（更新後） | Phase 11 (Stage B/C) / Phase 12 | spec_created |
| AC-11 | 無料枠運用：Google Cloud は OAuth + Cloud Console 操作のみで課金 product を有効化していない。Cloudflare Workers / Secrets も無料枠内に収まる | Phase 9 で `free-tier-estimation.md` に Google Cloud / Cloudflare Workers / Secrets / 1Password の 4 サービス分の試算を記述 | `outputs/phase-09/free-tier-estimation.md` | Phase 9 | spec_created |
| AC-12 | 05a Phase 11 evidence の placeholder（`outputs/phase-11/main.md` 等）が本タスク成果物リンクで上書きされ、Phase 12 implementation-guide の証跡リンクも更新 | Phase 12 で 05a Phase 11 main.md の placeholder セクションに本タスク `outputs/phase-11/staging/` / `production/` への link を追加 | `docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/main.md`（更新後） / `outputs/phase-12/implementation-guide.md` | Phase 12 | spec_created |

## 段階適用 A/B/C と AC の対応

| Stage | 範囲 | 該当 AC |
| --- | --- | --- |
| Stage A: staging smoke | OAuth flow / admin gate / wrangler-dev.log 取得 | AC-1（staging 部分）/ AC-2（staging）/ AC-4 / AC-5 / AC-9（staging） |
| Stage B: production verification 申請 | consent screen submit / privacy/terms URL 整備 | AC-1（production 部分）/ AC-6 / AC-8 / AC-10（submitted 経路） |
| Stage C: production smoke | 外部 Gmail login / Cloudflare Secrets production | AC-2（production）/ AC-7 / AC-9（production）/ AC-10（verified 経路） |
| Phase 12 反映 | docs / 05a placeholder 上書き | AC-3 / AC-10 / AC-12 |

> AC-11 は試算であり Phase 9 単独で完結（stage 横断観点）。

## coverage 代替指標と allowlist

### 目標

OAuth 設定運用タスクのため自動テストの line/branch coverage は適用しない。代替指標を採用:

| 指標 | 目標値 | 計測方法 |
| --- | --- | --- |
| 手動 smoke 実行 PASS 率 | 100%（staging 9 ケース + production 1 ケース = 10 ケース） | `outputs/phase-11/staging/manual-smoke-log.md` / `outputs/phase-11/production/login-smoke-log.md` で PASS / FAIL を記録 |
| evidence 配置率 | 100%（AC-4 / AC-6 / AC-7 / AC-9 で必要な evidence path がすべて生成） | Phase 11 完了時に `ls outputs/phase-11/staging/` / `outputs/phase-11/production/` で必須ファイルの存在確認 |
| 設定整合率 | 100%（redirect URI matrix / secrets placement matrix と Console / Cloudflare 実値が diff 0） | Phase 11 で actual 表を生成し matrix と差分なしを確認 |

### 計測対象 allowlist（変更ファイル限定）

```
outputs/phase-02/oauth-redirect-uri-matrix.md
outputs/phase-02/secrets-placement-matrix.md
outputs/phase-02/consent-screen-spec.md
outputs/phase-02/staging-vs-production-runbook.md
outputs/phase-05/implementation-runbook.md
outputs/phase-09/main.md
outputs/phase-09/free-tier-estimation.md
outputs/phase-11/staging/**
outputs/phase-11/production/**
outputs/phase-11/main.md
outputs/phase-11/manual-smoke-log.md
outputs/phase-12/**
```

### 禁止パターン（広域指定）

```
apps/**           # 本タスクは設定運用のみ。実装ファイルは触らない
.claude/**        # mirror parity 対象外
~/.config/**      # ローカル個人設定は触らない
```

## 計測の証跡記録

```bash
# Stage A（staging smoke）
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging \
  > outputs/phase-11/staging/secrets-list.txt
# 05a smoke-checklist の test ID を順次手動実行し screenshot を保存

# Stage B（verification 申請）
# Google Cloud Console「OAuth 同意画面」で Production publishing を submit
# submission 後の status を outputs/phase-11/production/verification-submission.md に記録

# Stage C（production smoke）
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production \
  > outputs/phase-11/production/secrets-list.txt
# 外部 Gmail で /login → /admin の screenshot を撮影

# wrangler login 不在確認（staging / production 双方）
git grep -nE "(CLOUDFLARE_API_TOKEN=|wrangler login)" \
  > outputs/phase-11/staging/wrangler-login-absence.txt
ls ~/Library/Preferences/.wrangler/config/default.toml 2>&1 \
  >> outputs/phase-11/staging/wrangler-login-absence.txt
```

> 出力ファイルにトークン値・client_secret 値が混入しないことを各ステップ完了時に目視確認する（Phase 9 セキュリティチェックでも再点検）。

## 4 条件評価（更新）

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS（高） | AC-7 / AC-10 で B-03 解除が evidence 化され、本番公開ブロッカーが解消。AC-4 で staging evidence の placeholder 解消が確定 |
| 実現性 | PASS | Phase 5 runbook が `scripts/cf.sh` 単一経路で書かれ、Cloudflare / Google Cloud Console / 1Password の既存運用と整合（CLAUDE.md `Cloudflare 系 CLI 実行ルール` 準拠） |
| 整合性 | PASS（要 Phase 11 Stage A 確認） | redirect URI matrix / secrets placement matrix / consent screen spec が Phase 2 で固定。Phase 11 Stage A で actual と diff 0 を最終確認（AC-1） |
| 運用性 | PASS | 段階適用 A/B/C と段階間ゲートが Phase 2 / Phase 5 で固定。verification 待機時も B-03 解除条件 b（submitted 暫定運用）として `13-mvp-auth.md` から読み取れる（AC-10） |

## 実行手順

1. 12 行 × 6 列の AC マトリクスを `outputs/phase-07/ac-matrix.md` に転記。
2. Stage A/B/C と AC の対応表を追記。
3. coverage 代替指標と allowlist / 禁止パターンを記録。
4. 計測コマンドを `scripts/cf.sh` 経由に固定して列挙。
5. 4 条件評価を Phase 4〜6 の成果物引用付きで更新。
6. Phase 9 / Phase 11 への引き継ぎ項目を箇条書きで明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | redirect URI matrix / secrets placement matrix の DRY 化（02-auth.md / 13-mvp-auth.md / environment-variables.md からの単一参照）の前提として AC-1 / AC-3 を再利用 |
| Phase 9 | 代替指標 3 種（PASS 率 / 配置率 / 整合率）の実測を `main.md` / `free-tier-estimation.md` に記録 |
| Phase 10 | go-no-go の根拠として AC マトリクスの空セル無しと 4 条件 PASS を参照 |
| Phase 11 | AC-4 / AC-5（Stage A）、AC-6 / AC-8（Stage B）、AC-7 / AC-9（Stage C）の evidence を実際に生成 |
| Phase 12 | AC-3 / AC-10 / AC-12 を `02-auth.md` / `13-mvp-auth.md` / 05a Phase 11 main.md に反映 |

## 多角的チェック観点

- 価値性: AC-1〜AC-12 が staging / production の evidence path にすべてトレースされ、placeholder が残らないこと。
- 実現性: 計測コマンドが `scripts/cf.sh` 単一経路で再現可能で、`wrangler` 直接呼び出しを含まないこと。
- 整合性: redirect URI / secrets / consent screen の 3 設定が Phase 2 matrix と Phase 11 actual で diff 0。
- 運用性: B-03 解除条件 a（verified）/ b（submitted）/ c（testing user 拡大）の優先順位が AC-10 で読み取れる。
- セキュリティ: evidence 内に client_secret / API token / session token の実値が混入しない（Phase 9 で再検査）。
- AI 学習混入防止: 仕様書本体に実値を書かない。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC マトリクス 12 行 × 6 列作成 | spec_created |
| 2 | Stage A/B/C と AC の対応表作成 | spec_created |
| 3 | coverage 代替指標 3 種確定 | spec_created |
| 4 | allowlist / 禁止パターン確定 | spec_created |
| 5 | 計測コマンド列挙（scripts/cf.sh 経由） | spec_created |
| 6 | 4 条件評価更新 | spec_created |
| 7 | Phase 9 / Phase 11 引き継ぎ項目明示 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 × evidence × Phase × 状態のトレース表 + 代替指標 + 4 条件評価 |
| メタ | artifacts.json | Phase 7 状態の更新 |

## 完了条件

- [ ] AC マトリクス 12 行 × 6 列に空セル無し
- [ ] staging / production の evidence path が AC ごとに 1 つ以上記載
- [ ] Stage A/B/C と AC の対応表が完成
- [ ] 代替指標 3 種が目標値・計測方法付きで定義
- [ ] allowlist / 禁止パターンが例示
- [ ] 計測コマンドが `scripts/cf.sh` 経由で記述（wrangler 直接呼び出し 0）
- [ ] 4 条件評価が根拠ファイル引用付きで PASS 判定
- [ ] Phase 9 / Phase 11 への引き継ぎ項目が箇条書き

## タスク100%実行確認【必須】

- 実行タスク 5 件が `spec_created`
- 成果物が `outputs/phase-07/ac-matrix.md` に配置済み
- AC-1〜AC-12 の 12 行が全て埋まる
- evidence path が `outputs/phase-11/staging/` または `outputs/phase-11/production/` のいずれかを必ず参照（Phase 9 / Phase 12 関連 AC を除く）
- coverage allowlist が Phase 11 の生成 evidence と一致
- wrangler 直叩きが本ドキュメント内にゼロ件
- artifacts.json の `phases[6].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC マトリクス → Phase 10 go-no-go の根拠として再利用
  - 代替指標 3 種 → Phase 9 で実測値取得 / Phase 11 で evidence 生成
  - 4 条件評価 → Phase 10 最終判定の入力
  - Stage A/B/C 対応表 → Phase 11 段階間ゲート判定の入力
  - 広域指定禁止ルール → Phase 8 / Phase 9 で逸脱を防ぐ
- ブロック条件:
  - AC マトリクス空セル残存
  - evidence path に staging / production 区別が反映されていない
  - allowlist が広域指定（apps/** など）に変質
  - 4 条件のいずれかが FAIL のまま
