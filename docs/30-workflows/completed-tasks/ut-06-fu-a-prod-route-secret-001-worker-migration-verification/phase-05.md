# Phase 5: 実装ランブック（runbook / checklist 文書化）

> **本タスクは docs-only / infrastructure-verification である**。コード実装は一切行わない。Phase 5 の「実装」は **runbook / checklist 本体の記述（markdown 文書）** を意味する。コードのテストフェーズではなく、runbook の検証可能性を担保する文書化フェーズとして読み替える。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web production Worker route / secret / observability 移行確認 (UT-06-FU-A-PROD-ROUTE-SECRET-001) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（runbook 本体記述） |
| 作成日 | 2026-04-30 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証 / エッジケース TC 拡充) |
| 状態 | spec_created |
| タスク分類 | specification-design（runbook） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-06-FU-A (`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/`) |

## 目的

Phase 4 で確定した検証ケース TC-01〜TC-06 を、production deploy 承認直前に担当者が **コピペで実行可能** な runbook として固定する。runbook は親タスク UT-06-FU-A の配下に配置し、新規ファイル `runbook/production-worker-migration-verification.md` として作成する（Phase 2 で確定した配置に従う / 既存 runbook がある場合は追記）。**wrangler 直叩きは禁止**、`bash scripts/cf.sh` ラッパー経由のみを使用する。`.env` の中身を読まない、secret 値を evidence に残さない、`wrangler login` を実行しない、を不変条件とする。

## 実行タスク

1. runbook の節立て（前提 / 認証 / inventory / route / secret / observability / deploy 直後検証 / 旧 Worker 処遇 / rollback 余地）を確定する（完了条件: 9 節すべてに見出しと内容が揃う）。
2. 各節に対応する TC ID（Phase 4）を相互参照として明記する（完了条件: TC-01〜TC-06 が runbook 節に 1:1 で対応）。
3. evidence 添付ルール（何を / どこへ / どの粒度で / どこを伏せるか）を runbook 末尾に固定する（完了条件: 6 ファイルの配置先と禁則事項表が完成）。
4. セキュリティガード（secret 値禁止 / `.env` 禁止 / `wrangler login` 禁止 / `wrangler` 直叩き禁止）を runbook 冒頭の「禁止事項」節として明示する（完了条件: 4 項目が箇条書きで列挙）。
5. 旧 Worker 処遇判断フロー（残置 / 無効化 / 削除 / route 移譲）を decision tree として記述する（完了条件: 各分岐の前提・所要時間・rollback 余地が記述）。
6. canUseTool 適用範囲を明記する（完了条件: production deploy / `secret put` / 旧 Worker 削除のいずれかで人手承認の境界が明確）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-04.md | 検証ケース TC-01〜TC-06 の入力 |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md | AC / Phase 計画（P1〜P7）/ リスク |
| 必須 | docs/30-workflows/ut-06-followup-A-opennext-workers-migration/ | runbook 配置先（親タスクディレクトリ） |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `scripts/cf.sh` 経由必須 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Worker / route / secret / observability 仕様 |
| 必須 | apps/web/wrangler.toml | `[env.production].name` 現行設定 |

## 新規作成ファイル一覧

| パス | 役割 | 主な依存 |
| --- | --- | --- |
| `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/runbook/production-worker-migration-verification.md` | 本タスクの runbook 本体（または既存 runbook への追記） | Phase 4 TC / scripts/cf.sh / `apps/web/wrangler.toml` |
| `docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md` | 本タスク内の runbook 草稿（親 runbook へ転記する原本） | 同上 |
| `docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/evidence-attachment-rules.md` | evidence 添付ルール表 | Phase 4 evidence 計画 |

## 修正ファイル一覧

| パス | 修正内容 |
| --- | --- |
| `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/README.md`（または index） | 本 runbook へのリンク追記 |

> コード（`apps/web/*` / `apps/api/*` / `scripts/*`）は一切修正しない。

## runbook 構成（節立てと内容）

| 節 | タイトル | 内容 | 対応 TC |
| --- | --- | --- | --- |
| 0 | 前提と禁止事項 | CLAUDE.md ルール参照 / `wrangler` 直叩き禁止 / `.env` 中身を読まない / `wrangler login` 禁止 / secret 値を evidence に残さない | （全 TC 共通） |
| 1 | 認証確認 | `bash scripts/cf.sh whoami` 実行と期待出力 / 失敗時は `op signin` 再実行 | TC-01 |
| 2 | Worker inventory | 旧 Worker 名（rename 前 entity）と新 Worker 名 (`ubm-hyogo-web-production`) の一覧化テーブル | TC-02 前提 |
| 3 | route / custom domain 突合 | ダッシュボード操作手順 / 旧 Worker route 件数 = 0 / 新 Worker route 件数 = 想定数 / 突合結果スナップショット記録 | TC-02 |
| 4 | secret snapshot と再注入 | `secret list` で key 集合を取得（before）→ 想定一覧と差分 → 不足分を `secret put` で再注入（値は op 経由 / ターミナル履歴に残さない）→ 再 `secret list` で完全一致確認（after） | TC-03 / TC-04 |
| 5 | observability 設定確認 | Tail / Logpush / Workers Analytics の対象 Worker 名が `ubm-hyogo-web-production` であることを確認。旧 Worker を指す binding が無いこと | TC-05 |
| 6 | deploy 直後検証（参照） | **deploy はユーザー承認後・別タスクで実行**。本 runbook は deploy 直後に Tail で 1 リクエスト分のログを取得する手順を**記述のみ**する | TC-05 |
| 7 | 旧 Worker 処遇判断フロー | 残置 / 無効化 / 削除 / route 移譲の decision tree。安定確認まで削除しない方針 | TC-06 |
| 8 | rollback 余地確保ルール | 旧 Worker は新 Worker 安定確認まで残置 / route は新 Worker へ寄せた状態で旧 Worker は無トラフィック化 / secret は同一値での冪等再投入のみ | （全 TC 共通） |

## 節別記述テンプレート

### 節 0: 前提と禁止事項

```markdown
## 前提
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」に従う
- 全コマンドは `bash scripts/cf.sh` 経由で実行
- 本 runbook は **deploy を実行しない**。deploy はユーザー承認後・別タスクで行う

## 禁止事項
- `wrangler` 直叩き（`scripts/cf.sh` 経由必須）
- `wrangler login` によるローカル OAuth トークン保持
- `.env` の中身を `cat` / `Read` / `grep` で表示
- secret 値・API Token 値・OAuth トークン値を出力 / evidence / コミット / PR に転記
```

### 節 1: 認証確認（TC-01）

```bash
bash scripts/cf.sh whoami
# 期待出力例（Token 値は表示されない）:
# 👋 You are logged in with an API Token, associated with the email <production アカウント>
```

evidence: `outputs/phase-05/evidence/tc-01-whoami.txt`（アカウント名のみ・Token 値が出力に含まれていないことを確認の上で保存）

### 節 2: Worker inventory

| 種別 | Worker 名 | 出典 |
| --- | --- | --- |
| 新 (deploy target) | `ubm-hyogo-web-production` | `apps/web/wrangler.toml` `[env.production].name` |
| 旧 (rename 前) | （要記入：dashboard で確認） | Cloudflare ダッシュボード Workers & Pages 一覧 |

### 節 3: route / custom domain 突合（TC-02）

```markdown
- ダッシュボード → Workers & Pages → 該当 Worker → Triggers / Custom Domains を開く
- 旧 Worker を指す route のリスト → 想定 0 件
- 新 Worker (`ubm-hyogo-web-production`) を指す route のリスト → 想定数（事前に runbook に列挙）と一致
- 結果を `outputs/phase-05/evidence/tc-02-route-snapshot.md` に貼付（host 名 / Worker 名のみ）
```

### 節 4: secret snapshot と再注入（TC-03 / TC-04）

```bash
# before: 現状の key 集合を取得
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production

# 出力（key 名のみ）を outputs/phase-05/evidence/tc-03-secret-keys-before.txt に保存
# 想定一覧と差分計算 → 欠落 key を抽出

# 不足 key の再注入（値は 1Password から op 経由で stdin 注入）
bash scripts/cf.sh secret put <KEY> --config apps/web/wrangler.toml --env production
# プロンプトで値を貼り付ける際は **ターミナル履歴に残らない** ことを確認

# after: 再度 key 集合を取得
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production
# outputs/phase-05/evidence/tc-04-secret-keys-after.txt に保存
# 想定一覧と完全一致を確認
```

> **重要**: `secret list` の出力は key 名のみ（値は出力されない仕様）。誤って値を貼り付ける可能性があるのは `secret put` のみ。stdin 経由 / op 経由のいずれでもターミナル履歴 / シェル history / ログに値が残らない経路を選ぶ。

### 節 5: observability 設定確認（TC-05）

```markdown
- ダッシュボード → Workers & Pages → 該当 Worker → Logs / Triggers
- Logpush 設定があれば dataset が `ubm-hyogo-web-production` を指すか確認
- Workers Analytics の dataset 設定も同様に確認
- Tail 動作確認（deploy 後に実行・本 runbook では準備のみ）:
  - `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production`
- 結果サンプル 1 件を outputs/phase-05/evidence/tc-05-observability-target.md に保存
  - **Authorization / Cookie / 個人情報をマスク**
```

### 節 6: deploy 直後検証（記述のみ）

```markdown
> deploy はユーザー承認後・別タスクで実行する。本 runbook はその直後に Tail で 1 リクエスト分のログを取得することを **手順として記述するのみ** で、実行は本タスクスコープ外。
```

### 節 7: 旧 Worker 処遇判断フロー（TC-06）

```markdown
decision tree:
1. 旧 Worker に traffic があるか？
   - YES → route を新 Worker へ移譲完了させる（DNS 切替は別タスク UT-16）
   - NO → 次へ
2. 新 Worker は安定稼働しているか？（最低 7 日 / SLO 観測）
   - NO → 旧 Worker を **残置**（rollback 余地確保）
   - YES → 次へ
3. 旧 Worker を無効化（trigger 解除）→ さらに 7 日観測 → 削除可
4. いずれの分岐でも判断記録を outputs/phase-05/evidence/tc-06-legacy-worker-decision.md に保存
```

### 節 8: rollback 余地確保ルール

```markdown
- 旧 Worker は新 Worker 安定確認まで **削除禁止**
- route は新 Worker へ寄せ、旧 Worker は無トラフィック状態にする
- secret 再注入は **同一値の冪等再投入のみ**（新規発行は本タスク対象外）
- すべての破壊的操作は人手承認後に実行
```

## evidence 添付ルール

| evidence | 配置先 | 粒度 | 禁則 |
| --- | --- | --- | --- |
| tc-01-whoami.txt | `outputs/phase-05/evidence/` | アカウント名 1 行 | Token 値 |
| tc-02-route-snapshot.md | 同上 | 旧 / 新 Worker × route 一覧 | 個人情報を含む path は伏字 |
| tc-03-secret-keys-before.txt | 同上 | key 名のみ（1 行 1 key） | 値・hash・長さ |
| tc-04-secret-keys-after.txt | 同上 | 同上 | 同上 |
| tc-05-observability-target.md | 同上 | dataset 名 / Worker 名 / Tail サンプル 1 件（マスク後） | Authorization / Cookie / 個人情報 |
| tc-06-legacy-worker-decision.md | 同上 | 判断・根拠・期日・TC 参照 | （特になし） |

## セキュリティガード（runbook 冒頭固定）

- secret 値 / OAuth トークン値 / API Token 値の出力・記録・転記禁止
- `.env` の `cat` / `Read` / `grep` 禁止（値は op 参照のみだが慣性事故防止）
- `wrangler login` 禁止（ローカル OAuth トークン保持禁止）
- `wrangler` 直叩き禁止（`bash scripts/cf.sh` ラッパーのみ）
- evidence ファイルをコミット前にレビューし、上記値が混入していないことを確認

## canUseTool 適用範囲

- 自動編集を許可: runbook 文書（`Write` / `Edit`）、evidence ファイル新規作成（**値が混入していないことを目視確認後**）
- 人手承認必須:
  - `bash scripts/cf.sh secret put` 実行（破壊的・値投入のため）
  - 旧 Worker の **無効化 / 削除** 操作（rollback 余地に直結）
  - production deploy（本タスクスコープ外。実行する別タスクで人手承認）
- 該当なし: `whoami` / `secret list` / `tail`（read-only）

## 実行手順（runbook 文書化のステップ）

1. 上記節立て（0〜8）を `outputs/phase-05/runbook.md` に記述する。
2. 親 runbook ディレクトリ（`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/runbook/`）に `production-worker-migration-verification.md` を新規作成（既存 runbook がある場合は追記）し、上記内容を転記する。
3. evidence ディレクトリ（`outputs/phase-05/evidence/`）を準備（実 evidence は runbook 実行担当者が生成）。
4. 親タスクの README / index に本 runbook へのリンクを追加。
5. `wrangler` 直叩きが本ドキュメント内にゼロ件であることを `grep` で確認。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | TC-01〜TC-06 を runbook 節 1〜7 に対応付け |
| Phase 6 | 追加 TC-07〜TC-12（エッジケース）を runbook に追記 |
| Phase 7 | AC × TC × runbook 節のトレース表 |
| Phase 11 | runbook を staging で空実行（deploy なし）して再現性確認 |

## 多角的チェック観点

- 価値性: runbook を上から実行すれば AC-1〜AC-5 が全て成立するか。
- 実現性: `scripts/cf.sh` の op 注入が production token で確実に通るか。
- 整合性: 親タスク UT-06-FU-A の Phase 計画 P1〜P7 と runbook 節 1〜8 が対応するか。
- 運用性: 各節の Pre 不成立で停止できる構造になっているか。
- セキュリティ: 値漏洩経路（コマンド履歴 / log / evidence / コミット）すべてに対策が記述されているか。
- 認可境界: 破壊的操作（`secret put` / 旧 Worker 削除）に人手承認境界が明示されているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | runbook 節立て 0〜8 確定 | spec_created |
| 2 | TC ↔ 節マップ確定 | spec_created |
| 3 | evidence 添付ルール表 | spec_created |
| 4 | セキュリティガード冒頭配置 | spec_created |
| 5 | 旧 Worker 処遇 decision tree | spec_created |
| 6 | canUseTool 範囲判定 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/runbook.md | runbook 草稿（親 runbook への転記原本） |
| ドキュメント | docs/30-workflows/ut-06-followup-A-opennext-workers-migration/runbook/production-worker-migration-verification.md | 親タスク配下の runbook 本体（新規 or 追記） |
| ドキュメント | outputs/phase-05/evidence-attachment-rules.md | evidence 添付ルール表 |
| メタ | artifacts.json | Phase 5 状態更新 |

## 完了条件

- [ ] runbook 節 0〜8 が見出しと内容を揃えて完成
- [ ] TC-01〜TC-06 が runbook 節 1〜7 に 1:1 対応
- [ ] evidence 添付ルール 6 ファイルの配置先と禁則が表で明示
- [ ] セキュリティガード 4 項目が runbook 冒頭で宣言
- [ ] 旧 Worker 処遇 decision tree が rollback 余地確保ルールと整合
- [ ] canUseTool 適用範囲（`secret put` / 旧 Worker 削除 / deploy）で人手承認境界が明記
- [ ] `wrangler` 直叩きが runbook 内にゼロ件
- [ ] 親タスク runbook ディレクトリへ配置・索引追加が完了

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物 3 件（runbook 草稿 / 親 runbook 本体 / evidence 添付ルール）が配置済み
- secret 値・Token 値を残さないルールが runbook 冒頭で明示
- 本 Phase はコードを書かない docs-only タスクであることが冒頭で再宣言

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証 / エッジケース TC 拡充)
- 引き継ぎ事項:
  - runbook 節 1〜8 → Phase 6 で TC-07〜TC-12（エッジケース）を追記する対象
  - evidence 添付ルール → Phase 6 追加 TC でも同形式で運用
  - 旧 Worker 処遇 decision tree → Phase 6 で「未把握 route 発見時」「想定外 secret key 発見時」の分岐を追加
- ブロック条件:
  - `wrangler` 直叩きが runbook に残存
  - secret 値が evidence に書かれる経路が残る
  - 親タスク runbook ディレクトリへ配置されていない
