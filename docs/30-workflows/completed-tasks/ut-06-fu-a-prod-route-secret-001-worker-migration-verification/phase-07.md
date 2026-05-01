# Phase 7: テストカバレッジ確認（runbook 網羅性検証）

> **本タスクは docs-only / infrastructure-verification である。** runbook（手順書）と checklist のみを成果物とし、実装コード・テストコードを生成しない。よって本 Phase の "テストカバレッジ" は **コードカバレッジではなく、runbook が AC を網羅しているかのカバレッジ（doc-coverage）** に読み替える。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web production Worker 名分離に伴う route / secret / observability 移行確認 (UT-06-FU-A-PROD-ROUTE-SECRET-001) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | テストカバレッジ確認（runbook 網羅性検証） |
| 作成日 | 2026-04-30 |
| 前 Phase | 6 (異常系検証 / failure case) |
| 次 Phase | 8 (リファクタリング / runbook 整理) |
| 状態 | spec_created |
| タスク分類 | infrastructure-verification（doc-coverage / traceability） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-06-FU-A (`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/`) |

## 目的

正本仕様 `docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md` §2.2 で定義された **AC1〜AC5** を唯一の AC registry とし、Phase 4（検証スイート＝検証ケース TC-01〜TC-12）/ Phase 5（runbook 本文）/ Phase 6（failure case）の成果物を縦串で結ぶ doc-coverage 検証を行う。本タスクはコード生成を伴わないため line/branch coverage は適用せず、代替指標として **AC カバレッジ充足率 / runbook 節カバー率 / 検証ケース実行可能性** の 3 軸で網羅性を評価する。AC が runbook の節と TC の双方で参照されない場合は Phase 5/6 へ差し戻す。

## 実行タスク

1. AC × 4 列（AC 内容 / カバーする runbook 節 / カバーする TC# / 関連 failure case）の **5 行マトリクス** を完成する（完了条件: 空セル無し / AC1〜AC5 全行）。
2. doc-coverage 代替指標（AC 充足率 100% / runbook 節カバー率 100% / TC 実行可能性 100%）の計測方法を確定する（完了条件: 計測コマンド・出力先・期待値が記述）。
3. 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）を Phase 4〜6 成果物を踏まえて更新する（完了条件: 各条件に Phase 4/5/6 の根拠ファイルが引用される）。
4. NON_VISUAL evidence（マトリクス markdown と secret key 名スナップショット骨格）の存在確認方法を定義する（完了条件: 期待ファイルパスと grep コマンドが固定）。
5. カバレッジ未達時の差し戻しゲートを定義する（完了条件: AC 未カバー時の戻り先 Phase が明示）。
6. Worker 名・config パス・env 名が想定通り（`ubm-hyogo-web-production` / `apps/web/wrangler.toml` / `--env production`）であることを再確認する（完了条件: 3 値が表として固定）。
7. Phase 9 への引き継ぎ項目（実測値・gap 分析項目）を予約する（完了条件: 引き継ぎ箇条書きが整列）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md | 正本仕様（AC1〜AC5 の唯一の registry） |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-04.md | 検証ケース TC-01〜TC-12 |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-05.md | runbook 本文（節構造） |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-06.md | failure case 一覧 |
| 必須 | docs/30-workflows/ut-06-followup-A-opennext-workers-migration/ | 親 runbook（追記対象） |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `bash scripts/cf.sh` 経由実行強制 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare 運用規約 |

## Worker 名・config・env 固定値（前提）

| 項目 | 値 | 出典 |
| --- | --- | --- |
| 新 Worker 名 | `ubm-hyogo-web-production` | 正本仕様 §1.1 / `apps/web/wrangler.toml [env.production].name` |
| 旧 Worker 名 | inventory で動的に確定（rename 前 entity） | Phase 1 inventory |
| config path | `apps/web/wrangler.toml` | 正本仕様 §3.3 |
| 環境フラグ | `--env production` | CLAUDE.md / `scripts/cf.sh` |
| ラッパー | `bash scripts/cf.sh`（`wrangler` 直接実行禁止） | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 |

## AC × runbook × TC カバレッジマトリクス

> 縦軸: 正本仕様 §2.2 の AC1〜AC5。横軸: runbook 節 / 検証ケース TC-01〜TC-12 / 関連 failure case。

| AC# | AC 内容（正本 §2.2） | カバーする runbook 節（Phase 5） | カバーする TC（Phase 4） | 関連 failure case（Phase 6） |
| --- | --- | --- | --- | --- |
| AC1 | production deploy 前チェックリスト（route / custom domain / secrets / observability）が workflow-local runbook に作成され、親 runbook から link 可能 | §1 前提 / §2 inventory / §6 判断記録 | TC-01（認証前提）/ TC-02（route snapshot） | TC-07（orphan route） / TC-11（DNS out-of-scope） |
| AC2 | `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production` の出力スナップショットが取得され、想定 secret 一覧と差分 0 が確認される | §3 secret snapshot / §4 secret 再注入 | TC-03（secret list 取得）/ TC-04（想定一覧との差分計算）/ TC-05（不足分の `secret put` 計画） | F-03（key 名スナップショット欠落） / F-04（値の混入＝禁止違反） |
| AC3 | route / custom domain が新 Worker (`ubm-hyogo-web-production`) を指していることがダッシュボード or API で確認される | §2 inventory / §3 route 突合 | TC-06（route 一覧取得）/ TC-07（新 Worker 紐付き確認）/ TC-08（旧 Worker 残存検出） | F-05（split brain 未検出） / F-06（旧 Worker 早期削除） |
| AC4 | `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` が新 Worker を tail できることが deploy 直後に確認される | §5 observability / §6 deploy 直後検証 | TC-09（tail 起動）/ TC-10（1 リクエスト分のログ取得） | F-07（旧 Worker tail で zero log） |
| AC5 | 旧 Worker が残っている場合、無効化 / 削除 / route 切り戻しのいずれかの判断が記録される | §6 判断記録 / §7 旧 Worker 処遇 | TC-06（legacy Worker decision）/ TC-10（rollback plan） | TC-10（rollback plan） / TC-12（rotation boundary） |

> **空セル禁止**: 各 AC は runbook 節 / TC / failure case の 3 列で 1 つ以上の参照を持つこと。

## doc-coverage 代替指標

| 指標 | 目標値 | 計測方法 |
| --- | --- | --- |
| AC 充足率 | 100%（5/5） | 上表で各 AC の 3 列が 1 つ以上参照されていることを確認 |
| runbook 節カバー率 | 100% | runbook 全節（前提 / inventory / 突合 / 再注入 / 観測 / 判断記録）が AC1〜AC5 のいずれかを担うこと |
| TC 実行可能性 | 100%（12/12） | TC-01〜TC-12 が `bash scripts/cf.sh` 経由のみで再現できること（`wrangler` 直接実行が含まれない） |

### 計測対象 allowlist（変更ファイル限定）

```
docs/30-workflows/ut-06-followup-A-opennext-workers-migration/<runbook 本文>.md
docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-07/ac-matrix.md
docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-07/secret-keys-snapshot.md
```

### 禁止パターン（広域指定）

```
apps/web/**          # コード変更は本タスクのスコープ外
apps/api/**          # 本タスクは web Worker のみ
.claude/**           # skill 資源は本タスクで更新しない
```

## NON_VISUAL evidence の存在確認

| evidence | 期待パス | 検証コマンド |
| --- | --- | --- |
| AC マトリクス | `outputs/phase-07/ac-matrix.md` | `test -f` で存在確認 + AC1〜AC5 の 5 行 grep |
| secret key 名スナップショット骨格 | `outputs/phase-07/secret-keys-snapshot.md` | key 名のみ列挙、値が含まれていないことを `grep -E '=|:[[:space:]]'` で 0 件確認 |
| Worker 名固定値 | 本仕様書本文 | `grep -c 'ubm-hyogo-web-production'` ≥ 3 |

> **重要**: secret key 名スナップショットは **値を一切含めない**。1Password 経由参照の原則と CLAUDE.md「禁止事項」に従う。

## 計測の証跡記録

```bash
# AC 充足率
grep -E '^\| AC[0-9]' outputs/phase-07/ac-matrix.md | wc -l   # 期待: 5

# runbook 節カバー率（runbook 本文に対して）
grep -nE '^## ' docs/30-workflows/ut-06-followup-A-opennext-workers-migration/<runbook>.md
# 期待: 6 節（前提 / inventory / 突合 / 再注入 / 観測 / 判断記録）

# TC 実行可能性 — wrangler 直接実行が含まれないこと
grep -n 'wrangler ' docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-04.md
# 期待: 0 件（`bash scripts/cf.sh` ラッパー経由のみ許容）

# 出力先
# outputs/phase-07/ac-matrix.md           — マトリクス
# outputs/phase-07/secret-keys-snapshot.md — key 名のみ
# outputs/phase-09/coverage-actual.md     — Phase 9 で実測値転記
```

## 4 条件評価（更新）

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS（高） | AC1〜AC5 が runbook 6 節 + TC-01〜TC-12 + failure case でトレース完結。production deploy split brain の事前検出体制が確立 |
| 実現性 | PASS | `bash scripts/cf.sh whoami` / `secret list` / `tail` が op 経由で成立（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）。`wrangler` 直接実行ゼロを Phase 9 で機械検証 |
| 整合性 | PASS（要 Phase 11 staging 確認） | 親 runbook（UT-06-FU-A）と本タスク runbook の追記境界が DRY（Phase 8 で重複統合）。`apps/web/wrangler.toml [env.production].name` と spec の固定値が一致 |
| 運用性 | PASS | runbook が staging deploy 後 / production deploy 承認直前 / deploy 直後 の 3 タイムラインで章構成。旧 Worker 残置の rollback 余地確保が AC5 として明文化 |

## カバレッジ未達時の差し戻し条件

| 未達状況 | 差し戻し先 |
| --- | --- |
| AC1〜AC5 のいずれかが runbook 節列で空 | Phase 5（runbook 節を追加） |
| AC1〜AC5 のいずれかが TC 列で空 | Phase 4（TC を追加） |
| failure case が AC2 / AC3 / AC4 / AC5 のいずれかで空 | Phase 6（failure case を追加） |
| TC に `wrangler` 直接実行が含まれる | Phase 5/4（`bash scripts/cf.sh` 経由へ修正） |
| Worker 名・config・env の 3 固定値に齟齬 | Phase 1（inventory を再取得） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 親 runbook と本タスク runbook の重複検出時、AC マトリクスの行が崩れないことを確認 |
| Phase 9 | 代替指標 3 種（AC 充足率 / runbook 節カバー率 / TC 実行可能性）の実測値取得 + `wrangler` 直接実行ゼロの機械検証 |
| Phase 10 | go-no-go の根拠として AC マトリクスの空セル無しと 4 条件 PASS を参照 |
| Phase 11 | AC4（tail）を staging で予行演習し、production deploy 承認直前の最終確認に転用 |
| 親 UT-06-FU-A | 本タスクの runbook 追記がマージされたことを Phase 12 で確認 |

## 多角的チェック観点

- 価値性: AC1〜AC5 がチェックリスト・スナップショット・観測の 3 形式に過不足なくマッピングされているか。
- 実現性: 代替指標が docs-only タスクの性質（コード生成なし）に適合し、line/branch coverage 誤用を避けているか。
- 整合性: TC 番号 / runbook 節 / failure case 番号が Phase 4/5/6 と差分ゼロ。
- 運用性: 計測コマンドが `bash scripts/cf.sh` 経由で PR レビュー時に再現可能か。
- 認可境界: production deploy 実行が本タスク **スコープ外**（正本 §10）であり、AC4 の検証はユーザー承認後の deploy 後に行う前提が明示されているか。
- セキュリティ: secret 値が evidence に混入する経路がゼロであることが Phase 9 で再確認される。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC マトリクス 5 行 × 4 列 | spec_created |
| 2 | doc-coverage 代替指標 3 種確定 | spec_created |
| 3 | NON_VISUAL evidence 存在確認手順 | spec_created |
| 4 | 4 条件評価更新 | spec_created |
| 5 | カバレッジ未達時の差し戻し条件確定 | spec_created |
| 6 | Worker 名・config・env 固定値再確認 | spec_created |
| 7 | Phase 9 引き継ぎ項目予約 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × runbook 節 × TC × failure case の 5 行マトリクス + 代替指標 + 4 条件評価 |
| ドキュメント | outputs/phase-07/secret-keys-snapshot.md | secret key 名のみのスナップショット骨格（値は含めない） |
| メタ | artifacts.json | Phase 7 状態更新 |

## 完了条件

- [ ] AC マトリクス 5 行 × 4 列に空セル無し
- [ ] 代替指標 3 種が目標値・計測方法付きで定義
- [ ] 広域指定の禁止パターンが例示
- [ ] 計測コマンドが `bash scripts/cf.sh` 経由で記述
- [ ] 4 条件評価が根拠ファイル引用付きで PASS 判定
- [ ] Worker 名 / config / env の 3 固定値が一致
- [ ] secret 値が evidence に含まれない仕組みが定義
- [ ] Phase 9 への引き継ぎ項目が箇条書き

## タスク100%実行確認【必須】

- 実行タスク 7 件が `spec_created`
- 成果物が `outputs/phase-07/ac-matrix.md` と `outputs/phase-07/secret-keys-snapshot.md` に配置予定
- AC1〜AC5 の 5 行が全て埋まる
- 関連 failure case 列が Phase 6 の TC-07〜TC-12 を 1 つ以上参照
- coverage allowlist が広域指定でない
- `wrangler` 直叩きが本ドキュメント内にゼロ件（`bash scripts/cf.sh` 経由のみ）

## 次 Phase への引き渡し

- 次 Phase: 8 (リファクタリング / runbook 整理)
- 引き継ぎ事項:
  - AC マトリクス → Phase 10 go-no-go の根拠として再利用
  - 代替指標 3 種 → Phase 9 で実測値取得
  - 4 条件評価 → Phase 10 最終判定の入力
  - 広域指定禁止ルール → Phase 8 / Phase 9 で逸脱を防ぐ
  - Worker 名・config・env 3 固定値 → 全 Phase で同一値を維持
- ブロック条件:
  - AC マトリクス空セル残存
  - allowlist が広域指定に変質
  - 4 条件のいずれかが FAIL のまま
  - secret 値の evidence 混入経路が残る
