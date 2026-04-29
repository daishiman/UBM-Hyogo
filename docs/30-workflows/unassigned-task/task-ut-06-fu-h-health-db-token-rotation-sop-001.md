# `HEALTH_DB_TOKEN` rotation SOP 正式化 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-ut-06-fu-h-health-db-token-rotation-sop-001                              |
| タスク名     | `HEALTH_DB_TOKEN` rotation SOP formalization (`/health/db`)                   |
| 分類         | governance / operation                                                        |
| 対象機能     | `apps/api` `/health/db` の `X-Health-Token` 認証で使用する secret の運用      |
| 優先度       | 中（priority:medium）                                                         |
| 見積もり規模 | 小規模（scale:small）                                                         |
| ステータス   | 未実施 (proposed) / status:unassigned                                         |
| 親タスク     | UT-06-FU-H (`docs/30-workflows/ut-06-followup-H-health-db-endpoint`)          |
| 発見元       | UT-06-FU-H Phase 12 unassigned-task-detection (FU-H-TOKEN-ROTATION)           |
| 発見日       | 2026-04-29                                                                    |
| Wave         | 2+（UT-06-FU-H 本番投入後の運用整備）                                         |
| visualEvidence | NON_VISUAL                                                                  |
| scope        | governance / secret_operation                                                 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-06-FU-H で `apps/api` に `GET /health/db` endpoint を実装した。認証方針として「Cloudflare WAF + IP allowlist」と「`X-Health-Token` ヘッダ」の二重防御（案 D）を採用し、token は `HEALTH_DB_TOKEN` secret として Cloudflare Workers に注入する設計とした。

実装と単体テスト 8 ケースは UT-06-FU-H 本ワークツリーで完了済みだが、以下の運用面はワークツリー内で完結できない（人間オペレーターによる Cloudflare / 1Password 操作が必須）:

1. `HEALTH_DB_TOKEN` の 32 byte ランダム生成
2. 1Password Vault `UBM-Hyogo/cloudflare-api` への保管
3. `bash scripts/cf.sh secret put` 経由での staging / production への投入
4. 外部監視 SaaS（StatusCake / UptimeRobot 等）probe header の更新
5. **90 日 rotation の実施**
6. **token 漏洩時の即応 SOP（rotation + Workers tail grep + WAF IP block）**

これらは UT-06-FU-H の operator-runbook（`docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-12/operator-runbook.md`）§1〜§7 に手順として記述済みだが、**rotation は反復作業であり、独立した governance / operation task として正式化しないと実施漏れが発生する**ため別タスクに切り出す。

### 1.2 問題点・課題

- rotation 期日（90 日）を管理する仕組みが現状カレンダー登録のみで、抜け落ちリスクが高い
- rotation 中の短時間 mismatch（外部監視が旧 token で叩いて 401）の許容判断が未確定
- 漏洩時即応 SOP が runbook 内に分散しており、独立した手順書（インシデント対応プレイブック）として参照しづらい
- 実施記録（rotation 履歴）の保存場所が未定義
- 2 値受理拡張（`HEALTH_DB_TOKEN` + `HEALTH_DB_TOKEN_NEXT`）の future work 判断が未着手

### 1.3 放置した場合の影響

- token が長期間 rotate されず、漏洩時の影響範囲が拡大する
- 漏洩時に runbook を引き直す時間が発生し、初動が遅れる
- rotation 実施記録が無いため、監査要件（情報セキュリティ / プライバシー）に答えられない
- 外部監視 SaaS が古い token で probe し続け、401 alert が定常的にノイズ化する

---

## 2. 何を達成するか（What）

### 2.1 目的

`HEALTH_DB_TOKEN` の生成・保管・投入・rotation・漏洩時即応を、再現可能な SOP として正式化し、実施漏れと初動遅延を防ぐ。

### 2.2 最終ゴール（想定 AC）

1. **rotation SOP** が独立した markdown として `docs/30-workflows/<本タスク dir>/` 配下に存在し、UT-06-FU-H operator-runbook §6 から正本リンクとして参照される
2. **rotation 期日トラッキング**（カレンダー / GitHub Issue / 1Password アラート 等のいずれか）が決定され記述される
3. **漏洩時即応プレイブック**（rotation + Workers tail grep + WAF IP block + 関係者通知）が独立 section として存在
4. **rotation 実施記録テンプレ**（実施日時 / 実施者 / 旧 token 失効確認 / 監視 401 ノイズ確認）が用意される
5. **2 値受理拡張**の future work 判断（採用 / 採用見送り）が記述される
6. operator-runbook §6 / §7.2 と本タスク成果物が双方向リンクされる
7. priority:medium / type:security / wave:2-plus / scale:small / status:unassigned のラベル付き Issue が起票される

### 2.3 スコープ

#### 含むもの

- rotation SOP の独立文書化（runbook §6 から昇格）
- 漏洩時即応プレイブックの独立 section 化
- rotation 期日トラッキング方式の意思決定と記述
- rotation 実施記録テンプレの作成
- 2 値受理拡張の future work 判断記述
- operator-runbook §6 / §7.2 との相互リンク追加
- 関連する CLAUDE.md「シークレット管理」section との整合確認

#### 含まないもの

- secret 実値の生成 / 投入（人間オペレーター作業 / `bash scripts/cf.sh secret put` 経由）
- Cloudflare WAF rule の追加 / 変更
- 外部監視 SaaS の probe header 更新（運用作業）
- `apps/api/src/index.ts` の 2 値受理対応（採用判断後の別タスク）
- UT-06-FU-H operator-runbook §1〜§5 の改訂

### 2.4 成果物

- `docs/30-workflows/<本タスク dir>/outputs/.../rotation-sop.md`（独立 SOP 正本）
- `docs/30-workflows/<本タスク dir>/outputs/.../incident-playbook.md`（漏洩時即応）
- `docs/30-workflows/<本タスク dir>/outputs/.../rotation-record-template.md`（実施記録テンプレ）
- operator-runbook §6 / §7.2 の双方向リンク追記差分
- GitHub Issue（priority:medium / type:security / wave:2-plus / scale:small / status:unassigned）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- UT-06-FU-H の PR がマージ済み（`/health/db` endpoint と operator-runbook が main に存在）
- `HEALTH_DB_TOKEN` の初回投入が完了し、production smoke が PASS している
- 1Password Vault `UBM-Hyogo` に `cloudflare-api` item が存在

### 3.2 依存タスク

- **上流（必須）**: UT-06-FU-H 本体（コード実装 / runbook / 初回投入 smoke）
- **関連**: UT-25 (`UT-25-cloudflare-secrets-sa-json-deploy`)、UT-GOV-002-OBS (`UT-GOV-002-OBS-secrets-inventory-automation`)、UT-34 (`UT-34-kv-secret-leak-precommit-guard`)

### 3.3 推奨アプローチ

1. UT-06-FU-H operator-runbook §6 / §7.2 を起点に独立 SOP を切り出す
2. rotation 期日トラッキング方式は「GitHub Issue を毎 90 日に reminder bot で起票」を第一案、「1Password アラート」を代替案として比較検討
3. 2 値受理拡張は実装コスト（`timingSafeEqual` を 2 値で評価）と運用利得（rotation 中 401 ノイズの完全排除）を比較し、現状は「採用見送り、再評価条件として『rotation 中の 401 が監視 alert 閾値を超えた場合』を明文化」を第一推奨

### 3.4 task-specification-creator skill 適用方針

本タスクが採用されたら `task-specification-creator` skill で Phase 1〜13 の正規仕様書を `docs/30-workflows/<本タスク dir>/` に展開する。`visualEvidence: NON_VISUAL` / `scope: governance` で Phase 11 evidence は markdown / コマンド出力のみで成立する。

---

## 4. 影響範囲

- `docs/30-workflows/<本タスク dir>/` 新規
- `docs/30-workflows/completed-tasks/ut-06-followup-H-health-db-endpoint/outputs/phase-12/operator-runbook.md`（§6 / §7.2 の双方向リンク追記）
- `CLAUDE.md`「シークレット管理」section（必要に応じて参照リンク追加）
- 1Password Vault `UBM-Hyogo/cloudflare-api`（運用ルール記載のみ、構造変更なし）

---

## 5. 推奨タスクタイプ

governance / operation / security

---

## 6. 苦戦箇所（Lessons Learned from UT-06-FU-H）

UT-06-FU-H 実装時に以下の判断に時間を要した。本タスクで再発防止する:

1. **token 比較のタイミング攻撃耐性**: Cloudflare Workers では Node の `crypto.timingSafeEqual` が使えないため、`TextEncoder` で UTF-8 byte 列に変換 → 期待 token 長を基準に全 byte XOR + 長さ差分も mismatch に畳み込む実装を採用した。rotation 中の 2 値受理を将来導入する際も同じ性質を保つ必要があるため、本 SOP に **timing-safe 制約** を明示する。
2. **fail-closed 設計**: `HEALTH_DB_TOKEN` 未設定時に「認証バイパスで 200 を返す」のではなく「**503 + `Retry-After: 30`**」を返す方針を採用した。rotation 中に secret 削除→再投入の順で操作すると一時的に 503 になることを SOP で明示し、外部監視 alert 閾値（90 秒で連続 3 回）と整合させる。
3. **error 文字列の最小化**: `err.message` ではなく `err.name` のみ返す方針。rotation 関連の SOP 例示でも `err.message` を含めない（情報漏洩予防）。
4. **rotation 中の短時間 mismatch**: 外部監視 SaaS が旧 token で叩く期間（最大数十秒）の 401 を許容するか、2 値受理で完全排除するかの判断が未着手。本タスクの AC-5 で意思決定する。
5. **`scripts/cf.sh secret put` の標準入力**: `wrangler secret put` は標準入力から値を受け取るが、`scripts/cf.sh` ラッパー経由でも同じ挙動になることを runbook §2 で確立済み。SOP でこの呼び出し規約を改めて固定する。
6. **不変条件 #5 の遵守**: D1 への直接アクセスは `apps/api` に閉じる。`/health/db` は `apps/api/src/index.ts` に閉包しており、本 SOP も `apps/web` 側の secret には触れない。

---

## 7. 参照情報

- 検出ログ: `docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-12/unassigned-task-detection.md` の FU-H-TOKEN-ROTATION
- 起源 runbook: `docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-12/operator-runbook.md` §1 / §2 / §6 / §7.2
- API 仕様: `docs/00-getting-started-manual/specs/01-api-schema.md` `/health/db` section
- aiworkflow-requirements: `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`、`.../environment-variables.md`
- 関連タスク: UT-06 (production deploy execution), UT-25 (cloudflare secrets), UT-GOV-002-OBS (secrets inventory automation), UT-34 (KV secret leak guard)

---

## 8. 備考

- 本タスクは UT-06-FU-H の Phase 12 unassigned-task-detection で「**Formalized Follow-Up: 大きな運用課題のため後続 governance / operation task として formalize 必須**」と明記された 1 件である
- UT-06-FU-H 本体 PR と本タスク Issue を同時に上げると issue 同期コストが発生するため、UT-06-FU-H マージ後に着手することを推奨
- secret 実値の操作は本タスク仕様書には一切含めず、すべて 1Password / Cloudflare CLI ラッパー経由とする（CLAUDE.md「ローカル `.env` の運用ルール」に準拠）
