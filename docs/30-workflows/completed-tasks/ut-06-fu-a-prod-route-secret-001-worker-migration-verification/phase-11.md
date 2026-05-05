# Phase 11: 手動テスト検証（NON_VISUAL 縮約）

## NON_VISUAL 縮約適用宣言【冒頭必須】

> **本 Phase は NON_VISUAL 縮約テンプレを適用する。**
>
> 適用根拠:
> - **visualEvidence = NON_VISUAL**（正本仕様 §1 メタ情報）
> - **taskType = docs-only**（runbook 文書整備のみ・production deploy 非実行）
> - 本タスクの成果物は `docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` 配下の runbook 文書および checklist のみで、エンドユーザー向け UI を一切提供しない
> - production deploy / DNS 切替 / 実 secret 値再注入は本タスクスコープ外（正本 §2.3「含まないもの」/ Phase 10 R-4・R-7）
> - したがって **screenshot は不要**。CLI 出力（マスク済み）/ runbook 通読記録 / dry-run ログ / 旧 Worker 処遇判断 markdown が一次証跡となる
>
> 参照: `.claude/skills/task-specification-creator/references/phase-template-phase11-detail.md` の NON_VISUAL 縮約節。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web production Worker route / secret / observability 移行確認 (UT-06-FU-A-PROD-ROUTE-SECRET-001) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト検証（NON_VISUAL 縮約） |
| 作成日 | 2026-04-30 |
| 前 Phase | 10 (最終レビュー / ユーザー承認ゲート) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | infrastructure-verification（manual / non-visual / docs-only） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| user_approval_required | false（Phase 10 で取得済み） |

## 目的

Phase 5 の runbook（production deploy 承認直前チェックリスト）が **production deploy を実行せずに verify 可能** な粒度に到達していることを、NON_VISUAL 代替 evidence で確認する。実 deploy・実 secret 値再注入・DNS 変更を行わず、以下 3 軸で本 Phase を完結させる:

1. runbook 通読 + 整合性 grep
2. 想定オペレーションの **dry-run**（`whoami` 等の安全 CLI のみ実行 / 値の転記なし）
3. 出力テンプレ（key 名のみ記録 / マスク済みログ / 旧 Worker 処遇判断 markdown）の構造確認

**wrangler 直接実行は禁止**、すべて `bash scripts/cf.sh` ラッパー経由（CLAUDE.md 準拠）。

## 実行タスク

1. `outputs/phase-05/runbook.md` を通読し、停止条件が明記されていることを確認する。
2. E-1〜E-7 の NON_VISUAL evidence ファイルを作成する。
3. secret 値、token 値、個人情報が evidence に含まれないことを確認する。
4. shell code block 内の行頭 `wrangler` 直接実行がないことを確認する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Runbook | `outputs/phase-05/runbook.md` | walkthrough target |
| Phase 11 template | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | NON_VISUAL evidence |
| CLI rule | `CLAUDE.md` | wrapper / secret hygiene |

## screenshot 不要の N/A 理由テーブル

| シナリオ | screenshot が想定されるケース | 本タスクでの状態 | N/A 理由 |
| --- | --- | --- | --- |
| UI 画面の視覚回帰 | アプリ画面のレイアウト・色・テキスト | 該当なし | apps/web の UI を変更しない（runbook 文書のみ） |
| ダッシュボード表示確認 | Cloudflare ダッシュボード Routes 画面の目視 | 代替 evidence で対応 | route 確認は API or CLI 出力（マスク済み）で記録、画面 PNG 不要 |
| エラーモーダル | 5xx 画面 / 認証エラー画面 | 該当なし | deploy 非実行のためエラー画面が発生する操作なし |
| ブラウザ動作確認 | tail / log の流れる様子 | 代替 evidence で対応 | tail 出力（テキスト）でログ流入を記録、画面録画不要 |
| 多デバイス確認 | mobile / desktop での表示 | 該当なし | UI なし |

> **結論**: 本 Phase の検証対象は CLI 出力 / 文書 / 設定ファイル のみで完結し、視覚的回帰・UI 状態を持たない。`outputs/phase-11/screenshots/` ディレクトリは作成しない。

## 代替 evidence 一覧

| ID | 代替 evidence 名 | 取得コマンド / 手段 | 採取先 | 値の取り扱い |
| --- | --- | --- | --- | --- |
| E-1 | `bash scripts/cf.sh whoami` 出力（アカウント名のみ） | `bash scripts/cf.sh whoami` | `outputs/phase-11/manual-verification-log.md §1` | アカウント名のみ。**API token 値は含めない** |
| E-2 | route スナップショット（旧/新 Worker 対応表） | ダッシュボード or API（旧 Worker 名 / 新 Worker 名 / route パターンの対応表として記述） | `outputs/phase-11/route-snapshot.md` | route パターン（例: `members.example.com/*`）と Worker 名のみ。Zone ID は **マスク** |
| E-3 | secret key スナップショット（key 名のみ） | `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production`（dry-run 不可の場合は **想定 key 名一覧** を記述） | `outputs/phase-11/secret-keys-snapshot.md` | **key 名のみ**。値は一切含めない |
| E-4 | Tail 1 リクエスト分のログ（PII / secret マスク済み） | `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` を **deploy 後の参考フォーマット** として 1 リクエスト分のテンプレ記述（実行は本 Phase スコープ外） | `outputs/phase-11/tail-sample.md` | PII / Authorization ヘッダ / Cookie / Bearer は **マスク** |
| E-5 | 旧 Worker 処遇判断記録 | runbook P7 に基づき「残置 / 無効化 / 削除 / route 移譲」の判断フローを記述 | `outputs/phase-11/legacy-worker-disposition.md` | 安定確認まで残置を default として明記 |
| E-6 | runbook 通読チェックリスト | runbook 各セクションを目視確認 | `outputs/phase-11/runbook-walkthrough.md` | 完了 chk のみ |
| E-7 | 整合性 grep ログ | `grep -rn 'wrangler ' docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` で `bash scripts/cf.sh` 経由でない直呼びが 0 件 | `outputs/phase-11/grep-integrity.md` | grep 結果（パス + 行番号のみ） |

## 検証手順

### ステップ 1: runbook 通読

1. `docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md`（Phase 5 で生成）を最初から最後まで通読する。
2. 各セクション（P1〜P7）の手順について「想定オペレーション」「期待出力」「漏れやすい点」が記述されているかチェックリスト化する。
3. `outputs/phase-11/runbook-walkthrough.md` に通読チェックリストを記録（E-6）。

### ステップ 2: 想定オペレーションの dry-run

1. **安全コマンドのみ実行**（destructive でない / 値を読み出さない）:
   ```bash
   bash scripts/cf.sh whoami
   ```
   出力（アカウント名）を `outputs/phase-11/manual-verification-log.md §1` に記録（E-1）。**token 値は表示・転記しない**。
2. **dry-run 不可の destructive / 値読み出しコマンド**は **実行せず**、想定出力テンプレのみ記述:
   - `secret list` → `outputs/phase-11/secret-keys-snapshot.md` に **想定 key 名一覧**として記述（E-3）
   - `tail` → `outputs/phase-11/tail-sample.md` に **deploy 後の参考フォーマット**として 1 リクエスト分のマスク済みサンプルを記述（E-4）
   - `secret put` → 実行しない（実 secret 注入は deploy 承認後・別オペレーション）
   - `deploy` → 実行しない（本タスクスコープ外）

### ステップ 3: 出力テンプレ確認

1. 各代替 evidence ファイル（E-1〜E-7）が `outputs/phase-11/` 配下に配置されることを確認。
2. 各ファイルが以下のヘッダを満たすこと:
   - 取得日時 / 取得コマンド / 値の取り扱い注意（key 名のみ・値マスクなど）
   - 旧 Worker 名 / 新 Worker 名（`ubm-hyogo-web-production`）の対応
3. 整合性 grep を実行し `outputs/phase-11/grep-integrity.md` に記録（E-7）:
   ```bash
   grep -rn 'wrangler ' docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/ \
     | grep -v 'scripts/cf.sh' | grep -v '禁止' | grep -v 'wrangler.toml'
   ```
   - 期待: 一致 0 件（`bash scripts/cf.sh` 経由でない `wrangler` 呼び出しが残っていない）

### ステップ 4: 旧 Worker 処遇判断の文書化

1. `outputs/phase-11/legacy-worker-disposition.md`（E-5）に以下を記述:
   - 旧 Worker 名（rename 前 entity）
   - 現状の route 紐付け
   - 処遇判断（残置 / 無効化 / 削除 / route 移譲）と理由
   - **default は「安定確認まで残置」**（rollback 余地確保）
   - 削除判断の前提条件（新 Worker 安定運用 N 日 / 観測ログでの異常 0 件 等）

## セキュリティガード【厳守】

| 禁止事項 | 理由 | 検証方法 |
| --- | --- | --- |
| `.env` の中身を `cat` / `Read` / `grep` 等で表示・読み取らない | AI コンテキストへの実値混入防止（CLAUDE.md「禁止事項」） | grep `Read.*\.env` が 0 件 |
| API Token 値・OAuth トークン値・secret 値を出力やドキュメントに転記しない | 実値漏洩防止 | runbook / outputs を grep で値パターン検出 |
| `wrangler login` でローカル OAuth トークンを保持しない | `.env` op 参照に一本化（CLAUDE.md「禁止事項」） | `~/Library/Preferences/.wrangler/config/default.toml` 不在確認は本 Phase スコープ外（CLAUDE.md ルール再掲のみ） |
| `bash scripts/cf.sh` 以外の `wrangler` 直接実行 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」違反 | E-7 grep で 0 件 |
| Tail サンプルに Authorization / Cookie / Bearer / PII を残す | 個人情報・認証情報漏洩 | E-4 サンプルは `<MASKED>` 表記のみ |
| Zone ID / database_id / API Token 値の転記 | 識別子経由の被害拡大防止 | E-2 ではマスク表記 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC matrix の検証列に E-1〜E-7 のパスを記入 |
| Phase 10 | GO 判定の前提として本 Phase の代替 evidence 全件採取を確認 |
| Phase 12 | 検証で判明した運用知見を `unassigned-task-detection.md` / `skill-feedback-report.md` に登録 |
| 親 UT-06-FU-A | runbook 完成度を親タスクへフィードバック |
| UT-06（本番デプロイ） | 本 Phase の runbook を deploy 承認直前チェックリストとして引き渡し |
| UT-16（DNS 切替） | DNS 切替自動化の申し送り |

## 多角的チェック観点

- 価値性: runbook が production deploy 直前の split-brain リスクを exhaustive にカバーしているか。
- 実現性: dry-run のみで verify 完結し、実 deploy / 実 secret 注入が本 Phase で発生しないか。
- 整合性: CLAUDE.md「wrangler 直接実行禁止」「`.env` 実値非保持」と矛盾なし。E-7 grep で 0 件。
- 運用性: 旧 Worker 残置（rollback 余地）が default として明記されているか。
- 認可境界: secret 値・OAuth token 値が一切ファイルに残らない。
- Secret hygiene: E-1〜E-7 すべて key 名 / アカウント名 / マスク値のみで構成。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | NON_VISUAL 縮約適用宣言 | 11 | spec_created | 冒頭必須 |
| 2 | screenshot 不要 N/A 理由テーブル | 11 | spec_created | 5 シナリオ |
| 3 | 代替 evidence 一覧（E-1〜E-7） | 11 | spec_created | 7 件 |
| 4 | runbook 通読 | 11 | spec_created | E-6 |
| 5 | 想定オペレーション dry-run | 11 | spec_created | whoami のみ実行 |
| 6 | 出力テンプレ確認 | 11 | spec_created | ヘッダ整合 |
| 7 | 整合性 grep | 11 | spec_created | E-7 |
| 8 | 旧 Worker 処遇判断記録 | 11 | spec_created | E-5 |
| 9 | セキュリティガード遵守確認 | 11 | spec_created | 6 禁止事項 |

## manual evidence（実装後に採取するログの placeholder）【必須】

| 項目 | 取得手段 | 採取先 | 値の取り扱い | 採取済 |
| --- | --- | --- | --- | --- |
| E-1 whoami | `bash scripts/cf.sh whoami` | outputs/phase-11/manual-verification-log.md §1 | アカウント名のみ | TBD |
| E-2 route snapshot | ダッシュボード/API（手動転記） | outputs/phase-11/route-snapshot.md | Zone ID マスク | TBD |
| E-3 secret keys | 想定 key 名（dry-run 不可） | outputs/phase-11/secret-keys-snapshot.md | key 名のみ | TBD |
| E-4 tail sample | deploy 後参考フォーマット | outputs/phase-11/tail-sample.md | PII/Auth マスク | TBD |
| E-5 legacy worker | 判断フロー記述 | outputs/phase-11/legacy-worker-disposition.md | 残置 default | TBD |
| E-6 walkthrough | runbook 通読 chk | outputs/phase-11/runbook-walkthrough.md | 完了 chk のみ | TBD |
| E-7 grep integrity | grep ワンライナー | outputs/phase-11/grep-integrity.md | パス + 行番号のみ | TBD |

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | production deploy は本 Phase で実行しない | 本番反映確証 | UT-06 親タスク（deploy execution） |
| 2 | 実 secret 値の再注入は本 Phase で実行しない | 値整合の実確認 | deploy 承認後の別オペレーション |
| 3 | DNS 切替 / custom domain 新規追加は本タスクスコープ外 | 公開 URL 切替 | UT-16 |
| 4 | tail / observability の実観測は deploy 後でないと取得不可 | log 流入確認 | deploy 直後の別オペレーション（runbook 内に手順は記載済み） |
| 5 | 旧 Worker 削除は安定確認まで実行しない | rollback 余地 | UT-06 親タスク runbook 後続で判断 |
| 6 | NON_VISUAL のため screenshot 不要、CLI ログ + 文書が一次証跡 | 視覚証跡なし | 代替 evidence E-1〜E-7 で補完 |
| 7 | route 自動 inventory スクリプト化は未実装 | 手動転記の手間 | Phase 12 unassigned-task 候補 |
| 8 | Logpush ターゲット差分検証スクリプト化は未実装 | 手動目視 | Phase 12 unassigned-task 候補 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | 検証実施サマリー / N/A 理由 / 代替 evidence 一覧 / 既知制限 |
| ログ | outputs/phase-11/manual-verification-log.md | E-1（whoami）等の実行ログ |
| スナップショット | outputs/phase-11/route-snapshot.md | E-2 旧/新 Worker 対応表 |
| スナップショット | outputs/phase-11/secret-keys-snapshot.md | E-3 想定 key 名一覧 |
| サンプル | outputs/phase-11/tail-sample.md | E-4 マスク済みログサンプル |
| 判断記録 | outputs/phase-11/legacy-worker-disposition.md | E-5 旧 Worker 処遇判断 |
| chk | outputs/phase-11/runbook-walkthrough.md | E-6 runbook 通読チェックリスト |
| grep | outputs/phase-11/grep-integrity.md | E-7 整合性 grep ログ |
| メタ | artifacts.json | Phase 11 状態の更新 |

## 完了条件

- [ ] `outputs/phase-11/main.md` 含む 8 ファイル（main + E-1〜E-7 相当 7 ファイル）が `outputs/phase-11/` 配下に揃っている
- [ ] **NON_VISUAL 縮約適用宣言**が Phase 11 冒頭に記載されている
- [ ] screenshot 不要の N/A 理由テーブル（5 シナリオ）が記述
- [ ] 代替 evidence E-1〜E-7 すべての placeholder が manual evidence テーブルに列挙
- [ ] 検証手順（runbook 通読 / dry-run / 出力テンプレ確認）が 3 ステップで記述
- [ ] セキュリティガード 6 項目が遵守されている（実値転記 0 / `.env` Read 0 / wrangler 直呼び 0）
- [ ] E-7 grep で `wrangler` 直呼び 0 件
- [ ] 旧 Worker 処遇 default が「安定確認まで残置」で明記
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] すべての CLI が `bash scripts/cf.sh` 経由（実行したのは whoami のみ）
- [ ] 既知制限が 6 項目以上列挙され、それぞれ委譲先または補足が記述されている

## タスク100%実行確認【必須】

- 全実行タスク（9 件）が `spec_created`
- 代替 evidence E-1〜E-7 のパス placeholder が `outputs/phase-11/` 配下に配置される設計
- AC1〜AC5 の検証採取手順が定義済み
- production deploy / DNS 切替 / 実 secret 注入が本 Phase スコープ外であることが明記
- scripts/cf.sh 経由必須が明記
- artifacts.json の Phase 11 entry が `spec_created` で、completion 時に `completed` へ更新可能

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - E-1〜E-7 採取で得られた知見を Phase 12 `unassigned-task-detection.md` / `skill-feedback-report.md` に渡す
  - 既知制限 #1（production deploy 委譲）を UT-06 親タスクへ register
  - 既知制限 #3（DNS 切替）を UT-16 へ申し送り
  - 既知制限 #7（route 自動 inventory）/ #8（Logpush 差分検証）を unassigned-task として formalize
  - runbook 完成度（E-6 通読 chk 完了）を Phase 12 implementation-guide へ転記
- ブロック条件:
  - manual evidence 7 項目に未採取 / 未 N/A 化が残っている
  - E-7 grep で `wrangler` 直呼びが検出される
  - secret 値・OAuth token 値が outputs に転記されている
  - `screenshots/` ディレクトリが誤って作成されている
  - 旧 Worker 処遇 default が「即削除」になっている（rollback 余地不在）
