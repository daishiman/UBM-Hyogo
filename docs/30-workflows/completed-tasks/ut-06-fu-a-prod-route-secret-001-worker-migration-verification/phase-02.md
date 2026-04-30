# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web production Worker 名分離に伴う route / secret / observability 移行確認 (UT-06-FU-A-PROD-ROUTE-SECRET-001) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-30 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビューゲート) |
| 状態 | spec_created |
| タスク分類 | docs-only / infrastructure-verification（runbook 追記設計） |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で確定した「Worker 名 split brain の差分可視化と非破壊再注入」要件を、(1) Worker inventory 設計、(2) route / secret / observability 突合・再注入設計、(3) 旧 Worker 処遇判断フロー、(4) runbook 追記の物理配置設計、の 4 軸に分解する。Phase 3 のレビューゲートが GO/NO-GO を一意に判定できる粒度の設計入力を作成する。

> **テスト系 Phase の縮退方針（重要）**: 本タスクは docs-only / infrastructure-verification のため、Phase 4-7 の自動テストは存在せず、代替として **「runbook walk-through による doc レビュー + checklist 整合確認 + 想定 secret 一覧との差分 0 検証」** に置換する。本 Phase でこの縮退方針を明文化し、Phase 3 のゲートで承認を得る。

## 実行タスク

1. **Worker inventory 設計**: 旧 Worker / 新 Worker `ubm-hyogo-web-production` の特定方法と一覧化フォーマットを設計する（完了条件: `outputs/phase-02/worker-inventory-design.md` に `bash scripts/cf.sh` 経由の取得コマンドと出力テーブル雛形が記載）。
2. **route / custom domain 突合手順設計**: ダッシュボード参照 + `bash scripts/cf.sh` API 経由スクリプトのいずれを正本にするか確定する（完了条件: 取得コマンド / 出力フォーマット / 旧 Worker 名残存検出ロジックが記載）。
3. **secret snapshot / 再注入設計**: `bash scripts/cf.sh secret list/put` の運用フローと、想定 secret 一覧（1Password / `.dev.vars` 想定）との差分検証フォーマットを設計する（完了条件: key 名のみ抽出ルール / 値漏洩防止規約 / 再注入順序が記載）。
4. **observability 設計**: Tail / Logpush / Workers Analytics の Worker 名照合方法を設計する（完了条件: tail コマンド + Logpush dataset binding 確認手順 + Analytics target 確認手順）。
5. **旧 Worker 処遇判断フロー**: 残置 / 無効化 / 削除 / route 移譲の判断ツリーを設計する（完了条件: 判断条件と記録テンプレが記載、削除実行は本タスク対象外と明示）。
6. **仕様語 ↔ 実装語対応表**: production Worker name = `ubm-hyogo-web-production` ↔ `wrangler.toml` `[env.production].name` 等のマッピングを表化する。
7. **runbook 配置設計**: `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` 配下のどのファイルに追記するか、章立て・テンプレート構造を確定する（完了条件: `outputs/phase-02/runbook-placement.md` にパス / 章立て / 既存 runbook との関係が記載）。
8. **検証コマンド一覧の整備**: 本タスクで使用する全 `bash scripts/cf.sh` コマンドを 1 表に集約する（完了条件: コマンド / 用途 / 期待出力 / 出力貼付ルール が列挙）。
9. **影響範囲・依存・セキュリティ整理**: `.env` 実値 / OAuth トークンの扱い、出力に値を残さない方針を明文化する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-01.md | 真の論点・AC・スコープ・制約 |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md | 正本仕様（§3 How / §5 検証方法 / §8.5 Phase 計画） |
| 必須 | docs/30-workflows/ut-06-followup-A-opennext-workers-migration/ | 親タスク runbook（追記先） |
| 必須 | apps/web/wrangler.toml | `[env.production].name = "ubm-hyogo-web-production"` の正本 |
| 必須 | CLAUDE.md `Cloudflare 系 CLI 実行ルール` | `bash scripts/cf.sh` 一本化の根拠 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | デプロイ規約 |
| 参考 | scripts/cf.sh | ラッパー実装 |

## 1. Worker inventory 設計

### 1.1 目的

production deploy 直前に「現存する apps/web 系 Worker」を一覧化し、新旧の split brain を可視化する。

### 1.2 取得手順（設計）

```bash
# 認証確認
bash scripts/cf.sh whoami

# Workers 一覧（API）— ラッパー経由でのみ実行。直接 wrangler 不可。
# ダッシュボード参照: Cloudflare Dashboard → Workers & Pages → Overview
```

> **設計上の決定事項**: API 経由の Workers 一覧は `bash scripts/cf.sh` の subcommand として未整備の場合、暫定的に **ダッシュボード参照を正本**とし、スクリーンショット代わりに **Worker 名のみのテキスト一覧** を runbook に貼付する（NON_VISUAL 維持）。

### 1.3 出力テーブル雛形（runbook 添付用）

| Worker 名 | 用途推定 | `wrangler.toml` 由来か | 処遇（残置/無効化/削除/route 移譲） | 備考 |
| --- | --- | --- | --- | --- |
| `ubm-hyogo-web-production` | 新 production（apps/web） | YES (`[env.production].name`) | 残置（deploy 対象） | 本タスクの対象 |
| （旧 Worker 名・例: `ubm-hyogo-web` 等） | 旧 production | NO（rename 前 entity） | 残置（rollback 余地確保） | route 移譲計画を別記録 |

## 2. route / custom domain 突合設計

### 2.1 取得手順

- **正本**: Cloudflare ダッシュボード → Workers & Pages → 各 Worker → `Triggers` → `Routes` / `Custom Domains` を参照。
- **副本**: `bash scripts/cf.sh` 経由で Cloudflare API (`/zones/{zone}/workers/routes`) を呼ぶスクリプトを将来追加検討（本タスクスコープ外）。

### 2.2 旧 Worker 名残存検出ロジック

```
取得した route 一覧から script 名 = 旧 Worker 名 のレコードを抽出。
ヒットした場合は「deploy 前に新 Worker へ付け替え計画」を runbook に明記し、実行は別承認に委ねる。
ヒット 0 件であれば AC-3 を満たす。
```

### 2.3 出力テーブル雛形

| route パターン | 紐付き script 名 | 期待 script | 一致判定 | 是正計画 |
| --- | --- | --- | --- | --- |
| 例: `members.example.com/*` | `ubm-hyogo-web-production` | `ubm-hyogo-web-production` | OK | - |
| 例: 旧 route | 旧 Worker 名 | `ubm-hyogo-web-production` | NG | 別承認で route 付け替え |

## 3. secret snapshot / 再注入設計

### 3.1 想定 secret 一覧の出典

- 1Password Vault / Item path（CLAUDE.md「1Password Environments」）
- `apps/web/.dev.vars`（op 参照のみ。実値は含まない）

> **重要**: 想定 secret 一覧の **「key 名のみ」** を runbook に転記する。値（実 secret）は絶対に転記しない。

### 3.2 取得コマンド

```bash
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production
# 期待出力: JSON or テキストで key 名一覧（値は出力されない設計）
# 出力から key 名のみを抽出して runbook 添付する
```

### 3.3 差分検証フォーマット

| key 名 | 想定一覧に存在 | Worker 側に存在 | 差分 | 是正アクション |
| --- | --- | --- | --- | --- |
| 例: `AUTH_GOOGLE_CLIENT_ID` | YES | YES | OK | - |
| 例: `AUTH_SECRET` | YES | NO | 不足 | `secret put` で再注入 |
| 例: 廃止 key | NO | YES | 余剰 | `secret delete` 計画（本タスク対象外。別承認） |

### 3.4 再注入手順

```bash
# 値は op run 経由で動的注入されるため、ターミナルやシェル履歴に実値が残らないようにする
bash scripts/cf.sh secret put <KEY> --config apps/web/wrangler.toml --env production
# 標準入力で値を渡す場合も op 参照経由を維持。echo / printf / cat による平文渡しは禁止
```

### 3.5 値漏洩防止規約

- secret list の出力は **key 名のみ**を抽出して runbook に貼付（値は含めない）
- runbook ファイル / コミットメッセージに実値を絶対に書かない
- ターミナル履歴クリアは `op run` 経由のため不要だが、誤操作時は履歴を即時破棄

## 4. observability 設計

### 4.1 Tail（リアルタイムログ）

```bash
# deploy 直後の new Worker tail（deploy はユーザー承認後別タスクで実行）
bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production
```

- 期待: 新 Worker (`ubm-hyogo-web-production`) のログが流れる
- 1 リクエスト分のログ（メタ情報のみ・本文は貼付しない）を runbook に添付

### 4.2 Logpush

- ダッシュボード → Workers & Pages → 該当 Worker → `Logs` → `Logpush` で送信先 dataset と script 名 binding を確認。
- 旧 Worker 名指定が残っていれば「設定書き換え計画」を runbook に明記（実行は別承認）。

### 4.3 Workers Analytics

- ダッシュボード → Workers & Pages → 該当 Worker → `Metrics` で対象 script 名を確認。
- 新 Worker (`ubm-hyogo-web-production`) のメトリクスが取得できることを deploy 直後に再確認。

### 4.4 出力テーブル雛形

| 観測経路 | target script 名 | 期待 | 一致 | 是正計画 |
| --- | --- | --- | --- | --- |
| Tail | （実行時 tail 対象） | `ubm-hyogo-web-production` | OK/NG | - |
| Logpush | dataset binding | `ubm-hyogo-web-production` | OK/NG | 別承認で書き換え |
| Workers Analytics | metrics target | `ubm-hyogo-web-production` | OK/NG | 別承認で書き換え |

## 5. 旧 Worker 処遇判断フロー

```
旧 Worker は存在するか？
  └─ NO → 記録のみ（処遇不要）
  └─ YES → route が紐付いているか？
        ├─ YES → route 移譲計画を作成（実行は別承認）
        └─ NO  → 残置 / 無効化 / 削除のいずれかを判断
              ├─ 残置（推奨）: 新 Worker 安定確認まで保持。rollback 余地。
              ├─ 無効化: トリガー解除のみ。本タスク対象外（別承認）
              └─ 削除: 物理削除。本タスク対象外（別承認・rollback 不可）
```

> **本タスクで実施するのは「判断記録」のみ**。残置・無効化・削除・移譲のいずれの **実行** も本タスクの対象外。

### 判断記録テンプレ

| 旧 Worker 名 | route 紐付き | 判断 | 理由 | 実行責任タスク |
| --- | --- | --- | --- | --- |
| 例: `ubm-hyogo-web` | あり / なし | 残置 / 無効化 / 削除 / 移譲 | 本タスク runbook の判断ロジックに従う | UT-06 production deploy 後・別タスク |

## 6. 仕様語 ↔ 実装語対応表

| 仕様語 | 実装語 / 物理的な所在 |
| --- | --- |
| production Worker name | `apps/web/wrangler.toml` の `[env.production].name = "ubm-hyogo-web-production"` |
| 旧 Worker | rename 前 entity（具体名は inventory で特定） |
| 想定 secret 一覧 | 1Password Vault / Item の secret key 一覧（値は op 参照） |
| Worker 側 secret list | `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production` 出力 |
| Tail | `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` |
| ラッパー | `scripts/cf.sh`（`op run` + `mise exec` + `ESBUILD_BINARY_PATH`） |
| 親 runbook | `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` 配下 |

## 7. runbook 配置設計

### 7.1 配置パス候補（Phase 3 で確定）

- 第一候補: `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/outputs/phase-XX/production-deploy-preflight.md`（既存 phase output に相当する位置）
- 第二候補: 親タスクの runbook 系ドキュメント（既存ファイルがあれば）への章追記

### 7.2 章立て（テンプレ）

```markdown
## production deploy preflight: Worker 名差分検証チェックリスト

### 0. 認証
- bash scripts/cf.sh whoami の出力（アカウント名のみ）

### 1. Worker inventory
- 一覧テーブル（§1.3 雛形）

### 2. route / custom domain 突合
- 一致判定テーブル（§2.3 雛形）

### 3. secret snapshot / 差分検証
- 想定 vs 実態 差分テーブル（§3.3 雛形）
- 不足 secret 再注入ログ（key 名のみ）

### 4. observability target 確認
- Tail / Logpush / Analytics の target script 名テーブル（§4.4 雛形）

### 5. 旧 Worker 処遇判断記録
- §5 判断記録テンプレ

### 6. deploy 直後 smoke（deploy はユーザー承認後別タスクで実行）
- bash scripts/cf.sh tail で 1 リクエスト分のログ確認（メタ情報のみ貼付）
```

### 7.3 既存 runbook との関係

- 親タスク UT-06-FU-A の既存 runbook を **上書きせず、追記** する。
- 追記時に既存 phase 出力との重複が生じる場合は、本タスクの出力を **正本**として参照リンクを張る。

## 8. 検証コマンド一覧

| # | コマンド | 用途 | 期待出力 | 出力貼付ルール |
| --- | --- | --- | --- | --- |
| 1 | `bash scripts/cf.sh whoami` | 認証確認 | アカウント名 | アカウント名のみ貼付 |
| 2 | `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production` | Worker secret key 一覧 | key 名一覧 | key 名のみ抽出。値は絶対貼らない |
| 3 | `bash scripts/cf.sh secret put <KEY> --config apps/web/wrangler.toml --env production` | secret 再注入 | 成功メッセージ | 成功 / 失敗のステータスのみ |
| 4 | `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` | リアルタイムログ確認 | ログストリーム | メタ情報のみ・本文は貼らない |
| 5 | （deploy 実行）`# bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` | **本タスク対象外**（コメントアウトで参考表示） | - | runbook では実行コマンドではなく参考記述に留める |

> 上記以外の `wrangler` 直接実行コマンドは **すべて禁止**（CLAUDE.md C-1）。

## 9. 影響範囲・依存

| 影響範囲 | 内容 |
| --- | --- |
| `apps/web/wrangler.toml` | `[env.production].name` の正本（読み取りのみ。本タスクで変更しない） |
| production Worker `ubm-hyogo-web-production` | route / secret / observability の検証対象（変更は別承認） |
| 旧 Worker（rename 前） | inventory / 処遇判断の対象（実行は別承認） |
| 親 runbook | `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` 配下に追記 |
| UT-06 production deploy 承認 | 本タスク runbook が承認の前提 |

## 10. セキュリティ

| 観点 | 方針 |
| --- | --- |
| `.env` 実値 | Read / cat / grep しない。op 参照のみ |
| API Token / OAuth Token | 出力 / runbook / コミットメッセージに転記しない |
| secret 値 | runbook には key 名のみ貼付。値は絶対に貼付しない |
| tail ログ本文 | リクエスト本文・レスポンス本文は貼付しない（メタ情報のみ） |
| `wrangler login` | 使用禁止（CLAUDE.md）。`bash scripts/cf.sh` の op 経由 API Token に一本化 |

## テスト系縮退方針（Phase 4-7 への前提）

本タスクは docs-only / infrastructure-verification のため、Phase 4-7 は以下に縮退する:

| Phase | 通常タスクでの内容 | 本タスクでの内容 |
| --- | --- | --- |
| 4 (テスト作成) | 自動テスト設計 | doc レビュー観点 + checklist 整合確認の設計 |
| 5 (実装) | コード実装 | 親 runbook への追記実施 |
| 6 (テスト拡充) | 異常系自動テスト | 異常系シナリオ列挙（旧 route 残存 / secret 不足 / observability 旧 target など）と runbook での扱い確認 |
| 7 (テストカバレッジ) | カバレッジ閾値 | AC-1〜AC-5 が runbook 章で完全カバーされる AC matrix |

> Phase 3 設計レビューゲートで本縮退方針の承認を得る。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計（§1〜§10）と縮退方針を base case として代替案・GO/NO-GO 判定に渡す |
| Phase 4 | doc レビュー観点 + checklist 整合確認設計の入力 |
| Phase 5 | 親 runbook への追記実施手順 |
| Phase 11 | runbook walk-through（手動 smoke 相当）の手順 placeholder |
| Phase 12 | unassigned-task-detection（旧 Worker 削除実行 / DNS 切替 / route 付け替え実行などの follow-up） |

## 多角的チェック観点

- CLAUDE.md ルール: 全コマンドが `bash scripts/cf.sh` 経由か。`wrangler` 直接実行が混入していないか。
- セキュリティ: secret 値・OAuth トークン・tail 本文を貼付しない設計か。
- スコープ境界: deploy 実行 / DNS 切替 / 旧 Worker 物理削除を **含まない** 旨が設計各所に明示されているか。
- rollback 余地: 旧 Worker の早期削除を要求していないか。
- runbook 配置: 親タスク runbook と整合し、上書きせず追記する方針か。
- aiworkflow-requirements 整合: `deployment-cloudflare.md` の規約と矛盾しないか。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計（主） | outputs/phase-02/main.md | 設計概要・テスト縮退方針・成果物索引 |
| 設計 | outputs/phase-02/worker-inventory-design.md | §1 Worker inventory（取得手順 + テーブル雛形） |
| 設計 | outputs/phase-02/route-secret-observability-design.md | §2 / §3 / §4（route / secret / observability の取得・差分・再注入） |
| 設計 | outputs/phase-02/runbook-placement.md | §7 配置パス候補・章立てテンプレ・既存 runbook との関係 |
| メタ | artifacts.json | Phase 2 状態の更新 |

## 完了条件

- [ ] Worker inventory 設計（取得コマンド / 出力テーブル雛形）が記載されている
- [ ] route / custom domain 突合設計（取得手順 / 旧 Worker 名残存検出）が記載されている
- [ ] secret snapshot / 再注入設計（取得 / 差分 / 再注入 / 値漏洩防止）が記載されている
- [ ] observability 設計（Tail / Logpush / Analytics の target 確認）が記載されている
- [ ] 旧 Worker 処遇判断フロー（残置 / 無効化 / 削除 / 移譲、実行は対象外）が記載されている
- [ ] 仕様語 ↔ 実装語対応表が完成している
- [ ] runbook 配置設計（パス候補 / 章立て / 既存との関係）が記載されている
- [ ] 検証コマンド一覧がすべて `bash scripts/cf.sh` 経由で記述されている
- [ ] テスト系 Phase 4-7 の縮退方針が明示されている
- [ ] セキュリティ規約（値・トークン・ログ本文を貼付しない）が記載されている

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビューゲート)
- 引き継ぎ事項:
  - §1〜§10 の設計を base case として代替案比較に渡す
  - テスト系 Phase 4-7 の縮退方針の承認を Phase 3 ゲートで取得
  - runbook 配置パスの第一候補 / 第二候補のいずれを採用するか Phase 3 で確定
  - production deploy 実行 / DNS 切替 / 旧 Worker 削除を含まないスコープ境界の維持
- ブロック条件:
  - `wrangler` 直接実行が設計内に混入
  - secret 値貼付ルールが曖昧
  - 旧 Worker 削除を本タスクで実行する設計
  - runbook 追記先が UT-06-FU-A 配下以外
