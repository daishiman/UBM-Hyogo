# Phase 4: テスト戦略（runbook 検証ケース設計）

> **本タスクは docs-only / infrastructure-verification である**。コード ut/it は作成しない。本 Phase の「テスト」は runbook / checklist の **検証可能性テスト**（手順を実行した結果が期待出力に一致することの確認）として読み替える。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web production Worker route / secret / observability 移行確認 (UT-06-FU-A-PROD-ROUTE-SECRET-001) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（runbook 検証ケース設計） |
| 作成日 | 2026-04-30 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (runbook / checklist 文書化) |
| 状態 | spec_created |
| タスク分類 | specification-design（test-strategy / runbook-verification） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-06-FU-A (`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/`) |

## 目的

UT-06-FU-A で `[env.production].name = "ubm-hyogo-web-production"` に Worker 名を分離した結果、旧 Worker と新 Worker の間で **route / custom domain / secrets / observability** が split brain を起こしうる。本 Phase では、production deploy 承認**前**に runbook を実行する担当者が、各検証手順の **「実行 → 出力取得 → 期待値突合 → evidence 添付」** を機械的に再現できるよう、検証ケース（TC-01〜TC-06）を設計する。コード単体テストは作成しないが、検証ケースは Phase 5 runbook の各節に 1:1 でマップされ、Phase 6 で追加 TC（エッジケース）に拡張される。

## 実行タスク

1. 検証ケース 6 件（TC-01〜TC-06）を Pre / Steps / Expected / 失敗時の rollback 余地の 4 項目で設計する（完了条件: 全 TC で 4 項目埋まる）。
2. NON_VISUAL evidence の取得形式（key 名スナップショット / 出力ログ / 判断記録）を確定する（完了条件: 各 TC に evidence 種別と添付先が紐付く）。
3. セキュリティガード（secret 値そのものを出力に残さない / `.env` 中身を読まない / `wrangler login` 禁止）を全 TC に共通条件として明記する（完了条件: 全 TC で「ログ・evidence に値を残さない」前提が宣言）。
4. 全 TC で `bash scripts/cf.sh` ラッパーのみを使用することを再確認する（完了条件: TC 内のコマンド例に `wrangler` 直叩きが 0 件）。
5. 親タスク AC（AC-1〜AC-5）と TC のトレース表を作成する（完了条件: 全 AC が 1 つ以上の TC で覆われる）。
6. Phase 5 / Phase 6 への引き渡し条件を定義する（完了条件: TC ID が runbook 節番号と evidence ファイル名にマップ）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md | AC / スコープ / リスクの正本 |
| 必須 | docs/30-workflows/ut-06-followup-A-opennext-workers-migration/ | 親タスク runbook 配置先 |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `scripts/cf.sh` 経由必須 / `wrangler` 直叩き禁止 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Worker / route / secret / observability の操作仕様 |
| 必須 | apps/web/wrangler.toml | `[env.production].name = "ubm-hyogo-web-production"` の現行設定 |
| 参考 | https://developers.cloudflare.com/workers/wrangler/commands/#secret | `wrangler secret list/put` 仕様（cf.sh 経由で実行） |

## 検証ケース一覧

| TC ID | 目的 | 親 AC |
| --- | --- | --- |
| TC-01 | 認証確認（production Token が op 経由で正しく注入される） | AC-1 前提 |
| TC-02 | route / custom domain 突合（旧 Worker route が 0 件・新 Worker が想定数） | AC-3 |
| TC-03 | secret snapshot 差分（想定一覧と新 Worker 実 secret key 集合の差分が 0） | AC-2 |
| TC-04 | secret 再注入後の再検証（不足分を `secret put` 後に key 集合が完全） | AC-2 |
| TC-05 | observability target（Tail / Logpush / Analytics が新 Worker を指す） | AC-4 |
| TC-06 | 旧 Worker 処遇記録（残置 / 無効化 / 削除 / route 移譲のいずれかが runbook に記録） | AC-5 |

### TC-01: 認証確認

| 項目 | 内容 |
| --- | --- |
| Pre | `.env` に `op://` 参照のみ存在し実値が記載されていない / 1Password に `CLOUDFLARE_API_TOKEN` 等が登録済み / `mise` で Node 24 / pnpm 10 が解決可能 |
| Steps | 1. `bash scripts/cf.sh whoami` を実行<br>2. 出力にアカウント名 / メールが含まれることを確認<br>3. exit code が 0 であること |
| Expected | exit 0、production 用アカウント表示、API Token 認証が通る |
| Evidence | `outputs/phase-04/evidence/tc-01-whoami.txt`（**Token 値はログ・evidence に残さない**。アカウント名のみで OK） |
| 失敗時の rollback 余地 | 認証失敗の段階では deploy も secret 操作も発生しないため副作用なし。`op signin` 再実行 → 1Password 側 token 期限を確認 |

### TC-02: route / custom domain 突合

| 項目 | 内容 |
| --- | --- |
| Pre | TC-01 PASS / 旧 Worker 名（rename 前 entity）と新 Worker 名 (`ubm-hyogo-web-production`) の inventory が事前作成済み |
| Steps | 1. Cloudflare ダッシュボード → Workers & Pages → Routes で Worker 名でフィルタ<br>2. 旧 Worker を指す route 一覧を取得（**0 件期待**）<br>3. 新 Worker (`ubm-hyogo-web-production`) を指す route 一覧を取得<br>4. 想定 route 数（親タスク runbook で事前に列挙）と一致するか確認 |
| Expected | 旧 Worker の route 件数 = 0 / 新 Worker の route 件数 = 想定数 |
| Evidence | `outputs/phase-04/evidence/tc-02-route-snapshot.md`（旧 Worker 名・新 Worker 名・route パターンの一覧。**実 host 名は親タスク方針に従い記録可**） |
| 失敗時の rollback 余地 | 検証段階では route を**変更しない**。差分が出た場合は Phase 5 runbook で「route 付け替え計画」として記録し、deploy 承認の前提条件とする |

### TC-03: secret snapshot 差分（再注入前）

| 項目 | 内容 |
| --- | --- |
| Pre | TC-01 PASS / 想定 secret key 一覧（1Password / `.dev.vars` 由来）が runbook に列挙済み |
| Steps | 1. `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production` を実行<br>2. 出力から **key 名のみ**を抽出（値は出力にも含まれないが念押し）<br>3. 想定 key 集合と新 Worker 実 key 集合の差分を取り、欠落 key と余剰 key を列挙 |
| Expected | 差分計算結果が runbook に記録される（差分が 0 でなくとも本 TC では「差分が観測できる」ことが PASS 条件。0 化は TC-04 で確認） |
| Evidence | `outputs/phase-04/evidence/tc-03-secret-keys-before.txt`（**key 名のみ**。secret 値は絶対に書かない） |
| 失敗時の rollback 余地 | `secret list` は read-only のため副作用なし |

### TC-04: secret 再注入後の再検証

| 項目 | 内容 |
| --- | --- |
| Pre | TC-03 で欠落 key が列挙済み / 1Password に対応する値が登録済み |
| Steps | 1. 欠落 key ごとに `bash scripts/cf.sh secret put <KEY> --config apps/web/wrangler.toml --env production` を実行（値は op 経由で stdin 注入。**ターミナル履歴 / ログに値を残さない**）<br>2. 全 key 投入後に再度 `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production` を実行<br>3. 想定 key 集合と完全一致することを確認 |
| Expected | 想定一覧との差分が 0 |
| Evidence | `outputs/phase-04/evidence/tc-04-secret-keys-after.txt`（**key 名のみ**） |
| 失敗時の rollback 余地 | `secret put` は前回値を上書きする破壊的操作のため、**再注入は同一値での冪等再投入のみ**を許可（新規発行は本タスクスコープ外）。誤って異なる値を put した場合は 1Password の正本値で即時上書き |

### TC-05: observability target

| 項目 | 内容 |
| --- | --- |
| Pre | TC-04 PASS / production deploy はユーザー承認後に別タスクで実行される前提（本タスクは deploy しない） |
| Steps | 1. （deploy 直後を想定して runbook に記載） `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` を実行<br>2. ダッシュボード経由で Logpush dataset / Workers Analytics の対象 Worker 名が `ubm-hyogo-web-production` であることを確認<br>3. 旧 Worker 名を指す observability binding が残っていないか確認 |
| Expected | Tail 出力が新 Worker のリクエストを表示 / Logpush・Analytics 設定が新 Worker を指す |
| Evidence | `outputs/phase-04/evidence/tc-05-observability-target.md`（Tail 出力サンプル 1 件分。**個人情報・Cookie・Authorization ヘッダはマスク**） |
| 失敗時の rollback 余地 | 設定書き換えのみ。誤設定は dashboard で即時戻せる。deploy はしないため traffic 影響なし |

### TC-06: 旧 Worker 処遇記録

| 項目 | 内容 |
| --- | --- |
| Pre | TC-02〜TC-05 の結果が evidence として揃っている |
| Steps | 1. 旧 Worker の処遇判断（残置 / 無効化 / 削除 / route 移譲）を runbook 末尾の判断記録節に記入<br>2. 新 Worker 安定確認まで旧 Worker は削除しない（rollback 余地確保）方針を明示<br>3. 判断者・判断日時・前提となった TC ID を記録 |
| Expected | 判断記録が runbook に追記され、レビュー可能な markdown として保存 |
| Evidence | `outputs/phase-04/evidence/tc-06-legacy-worker-decision.md`（判断 / 根拠 / 期日 / TC 参照） |
| 失敗時の rollback 余地 | 記録のみのため副作用なし。判断保留が許容される（保留時は「保留」と明示） |

## NON_VISUAL evidence 設計

| 種別 | 形式 | 配置 | セキュリティ条件 |
| --- | --- | --- | --- |
| 認証ログ | テキスト | `outputs/phase-04/evidence/tc-01-whoami.txt` | Token 値・OAuth トークン値を絶対に残さない |
| route 一覧 | markdown 表 | `tc-02-route-snapshot.md` | 旧 / 新 Worker 名と route パターンのみ |
| secret key スナップショット (before/after) | テキスト | `tc-03-secret-keys-before.txt` / `tc-04-secret-keys-after.txt` | **key 名のみ**。値・hash・長さも書かない |
| observability target | markdown | `tc-05-observability-target.md` | Tail サンプルから Authorization / Cookie / 個人情報をマスク |
| 旧 Worker 処遇判断 | markdown | `tc-06-legacy-worker-decision.md` | 内部識別子（旧 Worker 名）は記録可 |

## セキュリティ共通条件（全 TC 適用）

- secret 値・OAuth トークン値・API Token 値を **ログ / evidence / コミット / PR 説明に転記しない**
- `.env` の中身を `cat` / `Read` / `grep` で読まない（実値は op 参照のみだが慣性事故防止）
- `wrangler login` を実行してローカル OAuth トークン (`~/Library/Preferences/.wrangler/config/default.toml`) を保持しない
- 全コマンドは `bash scripts/cf.sh` 経由とし、`wrangler` 直叩きは禁止
- evidence ファイルをコミットする際は事前に値が残っていないかレビュー

## AC × TC トレース表

| AC | 内容 | カバー TC |
| --- | --- | --- |
| AC-1 | runbook に Worker 名差分検証チェックリストが追記される | TC-01〜TC-06 全件（runbook 記述自体が AC-1 の成果） |
| AC-2 | secret list 出力 snapshot 取得 / 想定一覧との差分 0 | TC-03 / TC-04 |
| AC-3 | route / custom domain が新 Worker を指す | TC-02 |
| AC-4 | tail で deploy 直後に新 Worker のログが流れる | TC-05 |
| AC-5 | 旧 Worker 処遇判断が記録される | TC-06 |

## 検証コマンド集（scripts/cf.sh 経由必須）

```bash
# 認証
bash scripts/cf.sh whoami

# secret snapshot（key 名のみ取得・値は出力されない）
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production

# secret 再注入（値は op stdin 経由・ターミナル履歴に残さない）
bash scripts/cf.sh secret put <KEY> --config apps/web/wrangler.toml --env production

# Tail（deploy 後・本タスクスコープ外で実行）
bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production
```

> 上記以外（route 一覧 / observability dashboard 確認）は CLI で完結しない部分があるため、ダッシュボード操作の手順を Phase 5 runbook に明記する。`wrangler` 直叩きはどのケースでも禁止。

## 実行手順

1. 本ドキュメントを `outputs/phase-04/main.md` に転記する。
2. TC-01〜TC-06 の Pre / Steps / Expected / rollback 余地が 4 項目埋まっていることを目視確認。
3. evidence の配置先 6 ファイルを `outputs/phase-04/evidence/` ディレクトリ計画として記録（実 evidence は Phase 5 runbook 実行時に生成）。
4. AC × TC トレース表に空白 AC が無いことを確認。
5. `wrangler` 直叩きが本ドキュメント内にゼロ件であることを `grep` で確認。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | TC-01〜TC-06 を runbook の節 1〜8 に 1:1 でマップ |
| Phase 6 | TC-07〜TC-12（エッジケース）へ拡張 |
| Phase 7 | AC × TC × evidence のトレース表に流し込み |
| Phase 11 | runbook を staging で 1 サイクル空実行（deploy なし） |

## 多角的チェック観点

- 価値性: AC-1〜AC-5 が TC でカバーされているか。
- 実現性: `scripts/cf.sh` 経由で全 TC のコマンドが実行可能か。
- 整合性: 親タスク UT-06-FU-A-production-route-secret-observability.md の Phase 計画 P1〜P7 と TC ID が対応するか。
- 運用性: 検証ケースが「Pre 不成立」で停止できる順序になっているか。
- セキュリティ: secret 値を evidence に残さない原則が全 TC で一貫しているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | TC-01〜TC-06 設計 | spec_created |
| 2 | NON_VISUAL evidence 計画 | spec_created |
| 3 | セキュリティ共通条件確定 | spec_created |
| 4 | scripts/cf.sh 経由統一確認 | spec_created |
| 5 | AC × TC トレース表 | spec_created |
| 6 | Phase 5 / 6 引き渡し条件 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | 検証ケース一覧 / evidence 計画 / AC トレース |
| 計画 | outputs/phase-04/evidence/（ディレクトリのみ作成） | Phase 5 実行時に evidence が配置される |
| メタ | artifacts.json | Phase 4 状態更新 |

## 完了条件

- [ ] TC-01〜TC-06 の 6 件が Pre / Steps / Expected / rollback 余地 4 項目で完成
- [ ] 各 TC に evidence 種別 / 配置先 / セキュリティ条件が紐付く
- [ ] AC × TC トレース表で全 AC（AC-1〜AC-5）が 1 つ以上の TC で覆われる
- [ ] 全コマンドが `bash scripts/cf.sh` 経由で `wrangler` 直叩きゼロ
- [ ] secret 値・Token 値を evidence に残さないルールが全 TC に適用
- [ ] 旧 Worker 処遇判断（TC-06）が runbook に記録可能な形式で定義

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物 1 件（main.md）と evidence 計画 1 件が `outputs/phase-04/` に配置済み
- TC × AC × evidence の 3 軸トレースが完結
- 本 Phase は **コードを書かない** docs-only タスクであることが冒頭で宣言されている

## 次 Phase への引き渡し

- 次 Phase: 5 (runbook / checklist 文書化)
- 引き継ぎ事項:
  - TC-01〜TC-06 → runbook 節 1〜8 にマップ
  - evidence 6 ファイル → runbook 実行時に生成される配置先を予約
  - セキュリティ共通条件 → runbook 冒頭の「禁止事項」節へ移送
- ブロック条件:
  - `wrangler` 直叩きが TC 内に残存
  - secret 値を evidence に書く設計が残る
  - AC が未カバー
