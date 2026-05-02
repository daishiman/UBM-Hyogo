# Phase 11: 受入検証（NON_VISUAL evidence）

## NON_VISUAL 縮約適用宣言【冒頭必須】

> **本 Phase は NON_VISUAL 縮約テンプレを適用する。**
>
> 適用根拠:
> - **visualEvidence = NON_VISUAL**（正本仕様 / メタ情報）
> - **taskType = docs-only**（route inventory script の spec 整備のみ・production deploy 非実行）
> - 本タスクの成果物は spec / runbook / API allowlist 設計 / secret-leak 防止設計のみで、UI を一切提供しない
> - production 副作用ゼロ（DNS / route 付け替え / Worker 削除 / deploy / secret put 不実行）— Phase 10 / 11 / 13 で重複明記
> - したがって **screenshot は不要**。CLI 出力サンプル（マスク済み）/ secret-leak grep / mutation-endpoint grep / runbook link チェックリストが一次証跡となる
>
> 参照: `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`

## production 副作用ゼロ再宣言【Phase 10 / 11 / 13 重複明記】

> 本 Phase で実行する CLI は read-only smoke（`bash scripts/cf.sh whoami` 程度）のみ。
> DNS 変更 / route 付け替え / Worker 削除 / deploy / secret put / `wrangler login` は **本 Phase / 本タスクで一切実行しない**。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production Worker route inventory script (UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 受入検証（NON_VISUAL 縮約） |
| 作成日 | 2026-05-01 |
| 前 Phase | 10 (セキュリティレビュー / Design GO 判定) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | docs-only / infrastructure-automation（NON_VISUAL） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| user_approval_required | false（Phase 10 Design GO + Phase 13 commit/PR approval gate） |
| GitHub Issue | #328 |

## 目的

`outputs/phase-05/runbook.md`（route inventory script の利用手順）および `outputs/phase-02/api-allowlist.md` 等の Phase 1〜10 成果物が、production 副作用ゼロ・secret 漏洩ゼロ・mutation endpoint ゼロ・`scripts/cf.sh` 経由統一で実行可能な spec に到達していることを NON_VISUAL 代替 evidence で確認する。

本 Phase の AC-1〜AC-5 については **「設計レベル PASS」** と **「実測 PASS」** を分離して評価する:

- **設計レベル PASS**: 本 PR スコープ。spec / 設計成果物の grep / link / 構造確認で完了。
- **実測 PASS**: 受け側実装タスク（後続 unassigned `UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001`）の完了後に、その成果物を本タスクに handoff し evidence 反映する。**実測 PASS は本 PR スコープ外**。

## screenshot 不要の N/A 理由テーブル

| シナリオ | screenshot 想定ケース | 本タスクでの状態 | N/A 理由 |
| --- | --- | --- | --- |
| UI 画面の視覚回帰 | アプリ画面のレイアウト | 該当なし | UI 変更なし |
| ダッシュボード表示確認 | Cloudflare ダッシュボード Routes 画面 | 代替 evidence で対応 | route inventory は API 出力（マスク済み）で記録、画面 PNG 不要 |
| エラーモーダル | 5xx 画面 | 該当なし | deploy 非実行 |
| ブラウザ動作確認 | tail / log の流れ | 該当なし | 本タスク script は inventory 取得のみ・tail なし |
| 多デバイス確認 | mobile / desktop | 該当なし | UI なし |

> **結論**: 本 Phase は CLI 出力 / 設計文書 / grep ログのみで完結。`outputs/phase-11/screenshots/` ディレクトリは作成しない。

## NON_VISUAL evidence 一覧（必須 3 + 任意補助 1）

| ID | evidence 名 | 取得手段 | 採取先 | 値の取り扱い | 必須/任意 |
| --- | --- | --- | --- | --- | --- |
| E-1 | route inventory 出力サンプル（read-only smoke） | 受け側実装後に `bash scripts/cf.sh` 経由 read-only API 呼び出し → output を mask したサンプル | `outputs/phase-11/route-inventory-output-sample.md` | key 名 / Worker 名 / route pattern のみ。Zone ID / Account ID / API token は **`<MASKED>`** | **必須** |
| E-2 | secret-leak grep ログ | `grep -nE '(Bearer |sk_|token=|secret=|Authorization|ya29\.|CF_API_TOKEN=)' outputs/phase-11/route-inventory-output-sample.md outputs/phase-12/implementation-guide.md` 等 | `outputs/phase-11/secret-leak-grep.md` | 結果 0 件確認のみ記録（実値は転記しない） | **必須** |
| E-3 | mutation-endpoint grep ログ | `grep -nE '"(POST\|PUT\|PATCH\|DELETE)"' <script 想定実装サンプル / spec / API allowlist>` | `outputs/phase-11/mutation-endpoint-grep.md` | パス + 行番号のみ・結果 0 件確認 | **必須** |
| E-4 | runbook link チェックリスト | 親タスク runbook（`completed-tasks/ut-06-fu-a-prod-route-secret-001-.../outputs/phase-05/runbook.md`）から本タスク spec への導線追加が方針として記録されているかチェック | `outputs/phase-11/runbook-link-checklist.md` | 完了 chk のみ | 任意補助 |

## AC × 達成状態（設計レベル PASS / 実測 PASS 分離）

| AC | 内容 | 設計レベル PASS（本 PR） | 実測 PASS（受け側実装後） | 仕様確定先 |
| --- | --- | --- | --- | --- |
| AC-1 | route / custom domain inventory の出力形式が docs に記録されている | PASS（output sample / shape 設計） | TBD（実 API 出力で再確認） | outputs/phase-02/route-inventory-shape.md |
| AC-2 | production mutation を実行しないことが code review と command design で確認 | PASS（mutation-endpoint grep 0 件 / API allowlist `GET` のみ） | TBD（実装 PR で grep 再確認） | outputs/phase-10/security-review.md |
| AC-3 | UT-06-FU-A-PROD-ROUTE-SECRET-001 の runbook から script への導線が追加 | DELEGATED（追記方針記録） | TBD（親 runbook 実書き込み後） | `UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001` 完了条件 |
| AC-4 | secret 値（API token / OAuth / Bearer）が出力 / ログ / commit に含まれない | PASS（secret-leak grep 設計 0 件） | TBD（実 inventory output で grep 再確認） | outputs/phase-11/secret-leak-grep.md |
| AC-5 | `bash scripts/cf.sh` 経由統一（`wrangler` 直呼び 0 件） | PASS（spec grep 0 件） | TBD（実装 script の grep 再確認） | outputs/phase-11/secret-leak-grep.md（同 grep 内） |

## handoff 設計（実測 PASS の引き渡し経路）

| 項目 | 値 |
| --- | --- |
| 受け側タスク ID（後続起票方針） | `UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001` |
| 起票場所 | `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-impl-001.md`（新規 unassigned） |
| 受け側完了後の evidence 反映先 | 本タスク `outputs/phase-11/route-inventory-output-sample.md`（実出力で上書き）/ `secret-leak-grep.md`（実 grep 結果に更新）/ `mutation-endpoint-grep.md`（実装 script に対する grep 結果） |
| 反映トリガ | 受け側 PR merge + 本タスクへの handoff PR（spec 内 evidence 上書き） |
| AC-1〜AC-5 の実測 PASS タイミング | 受け側 PR merge + handoff PR merge 完了時 |

> **本 PR スコープ**: 設計レベル PASS のみ。実測 PASS は受け側実装タスク完了後の別 PR。

## 検証手順

### ステップ 1: spec / 設計成果物の grep

1. `outputs/phase-11/secret-leak-grep.md`（E-2）に以下 grep を実行記録:
   ```
   grep -nE '(Bearer |sk_|token=|secret=|Authorization|ya29\.|CF_API_TOKEN=|^[A-Za-z0-9_-]{40,}$)' \
     docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/
   ```
   期待: 一致 0 件（spec / output sample に実値を含まない）。
2. `outputs/phase-11/mutation-endpoint-grep.md`（E-3）に以下 grep を実行記録:
   ```
   grep -rnE '"(POST|PUT|PATCH|DELETE)"' \
     docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/
   ```
   期待: 一致 0 件（API allowlist が `GET` のみ）。

### ステップ 2: read-only smoke の出力サンプル設計

1. `outputs/phase-11/route-inventory-output-sample.md`（E-1）に **マスク済みサンプル**を記述:
   ```yaml
   # 取得日時: 2026-05-01T00:00:00Z（spec 段階では placeholder）
   # 取得コマンド: bash scripts/cf.sh ... (read-only API 呼び出し / 受け側実装後に確定)
   # account: <MASKED>
   # zone_id: <MASKED>
   routes:
     - pattern: "members.example.com/*"
       worker: "ubm-hyogo-web-production"
       source: "api"
     - pattern: "<legacy-domain>/*"
       worker: "<legacy-worker-name>"
       source: "api"
   custom_hostnames:
     - hostname: "members.example.com"
       worker: "ubm-hyogo-web-production"
   ```
   - すべての ID 系は `<MASKED>`
   - Worker 名 / route pattern のみ実値
2. **本 spec 段階では実 API は呼ばない**。受け側実装後に実出力で上書きする。

### ステップ 3: runbook link チェックリスト（任意補助 E-4）

1. `outputs/phase-11/runbook-link-checklist.md` に以下を記述:
   - 親タスク `completed-tasks/ut-06-fu-a-prod-route-secret-001-.../outputs/phase-05/runbook.md` に本タスク spec への link 追記方針が `outputs/phase-12/system-spec-update-summary.md` で記録されているか
   - 本タスク spec から親タスク runbook への back-link が `index.md` 等で記述されているか
   - aiworkflow-requirements `deployment-cloudflare-opennext-workers.md` 追記方針が `outputs/phase-12/system-spec-update-summary.md` Step 1-A に記録されているか

## セキュリティガード【厳守】

| 禁止事項 | 理由 | 検証方法 |
| --- | --- | --- |
| `.env` の中身を `cat` / `Read` / `grep` 等で表示 | AI コンテキスト混入防止 | grep `Read.*\.env` 0 件 |
| API Token / OAuth Token / Bearer / Cookie / Authorization ヘッダの転記 | 実値漏洩防止 | E-2 secret-leak grep 0 件 |
| `wrangler login` でローカル OAuth token 保持 | `.env` op 参照一本化 | 受け側実装 review で確認 |
| `bash scripts/cf.sh` 以外の `wrangler` 直呼び | CLAUDE.md 違反 | E-2 grep に `wrangler ` パターン追加で 0 件 |
| Zone ID / Account ID / database_id 実値転記 | 識別子経由の被害拡大防止 | E-1 で `<MASKED>` 統一 |
| mutation endpoint（`POST` / `PUT` / `PATCH` / `DELETE`）の使用 | production 副作用ゼロ違反 | E-3 grep 0 件 |
| CI 自動実行 | rate limit + 副作用混入防止 | 受け側実装 review で `.github/workflows/` への混入確認 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | Design GO 判定の対策結果を E-1〜E-3 で確認 |
| Phase 12 | 受け側実装タスクの起票（`UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001`）方針を unassigned-task-detection に記録 |
| Phase 13 | E-1〜E-3 のパスを PR description Test plan に転記 |
| 親 UT-06-FU-A-PROD-ROUTE-SECRET-001 | runbook 双方向 link |
| 受け側実装タスク（後続） | 実測 PASS 反映 handoff |

## 多角的チェック観点

- 価値性: 設計レベル PASS で spec の妥当性が確定
- 実現性: 受け側実装タスクへの handoff 経路が明確
- 整合性: CLAUDE.md / 親タスク完了状態と矛盾なし
- 運用性: 実測 PASS は受け側実装後で本 PR を blocking しない
- 認可境界: secret-leak / mutation-endpoint grep で機械的に保証
- Secret hygiene: E-1 mask / E-2 grep 0 件

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | NON_VISUAL 縮約適用宣言 | spec_created | 冒頭必須 |
| 2 | production 副作用ゼロ再宣言 | spec_created | Phase 10/11/13 重複 |
| 3 | screenshot N/A 理由テーブル | spec_created | 5 シナリオ |
| 4 | E-1 route-inventory-output-sample 設計 | spec_created | mask 済み |
| 5 | E-2 secret-leak-grep 設計 | spec_created | 0 件 |
| 6 | E-3 mutation-endpoint-grep 設計 | spec_created | 0 件 |
| 7 | E-4 runbook-link-checklist（任意） | spec_created | 補助 |
| 8 | AC-1〜AC-5 設計レベル/実測 PASS 分離表 | spec_created | 5 件 |
| 9 | handoff 設計（受け側実装タスク） | spec_created | UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001 |
| 10 | セキュリティガード遵守 | spec_created | 7 禁止事項 |

## manual evidence（実装後に採取するログの placeholder）【必須】

| 項目 | 取得手段 | 採取先 | 値の取り扱い | 採取済 |
| --- | --- | --- | --- | --- |
| E-1 output sample | 受け側実装後 read-only API smoke | outputs/phase-11/route-inventory-output-sample.md | ID 系 mask | TBD（実測 PASS） |
| E-2 secret-leak grep | grep one-liner | outputs/phase-11/secret-leak-grep.md | パス + 行番号のみ・0 件 | spec 段階で実行可 |
| E-3 mutation grep | grep one-liner | outputs/phase-11/mutation-endpoint-grep.md | パス + 行番号のみ・0 件 | spec 段階で実行可 |
| E-4 runbook link | 目視 chk | outputs/phase-11/runbook-link-checklist.md | chk のみ | spec 段階で実行可 |

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | AC-1〜AC-5 の実測 PASS は本 PR スコープ外 | 機械検証の実証跡 | 受け側実装タスク（UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001）完了後に handoff |
| 2 | NON_VISUAL のため screenshot 不要 | 視覚証跡なし | E-1〜E-4 で代替 |
| 3 | API token scope の実値確認は手動 | scope 妥当性の自動検証なし | 受け側実装 review 時に手動確認 |
| 4 | rate limit の実測値計測は本 Phase で行わない | API 呼び出し負荷の実証 | 受け側実装後 1 セッション/日の手動運用 |
| 5 | CI 自動実行禁止のため drift 検出は手動 | route 変動の自動通知なし | 親タスク runbook の deploy 直前チェックで対応 |
| 6 | 受け側実装言語（Node / shell）は本 spec で確定しない | 実装方針の選択肢 | 受け側実装タスクで決定 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| サンプル | outputs/phase-11/route-inventory-output-sample.md | E-1 マスク済み出力サンプル |
| grep | outputs/phase-11/secret-leak-grep.md | E-2 secret 漏洩 0 件確認 |
| grep | outputs/phase-11/mutation-endpoint-grep.md | E-3 mutation endpoint 0 件確認 |
| chk | outputs/phase-11/runbook-link-checklist.md | E-4 任意補助 |
| ドキュメント | outputs/phase-11/main.md | Phase 11 サマリー / N/A 理由 / AC 設計レベル PASS / handoff |
| メタ | artifacts.json | Phase 11 状態の更新 |

## 完了条件

- [ ] NON_VISUAL 縮約適用宣言が冒頭記載
- [ ] production 副作用ゼロ再宣言が記載
- [ ] screenshot N/A 理由テーブル（5 シナリオ）
- [ ] E-1〜E-3（必須）/ E-4（任意）のパスが配置設計済み
- [ ] AC-1〜AC-5 の設計レベル PASS / 実測 PASS 分離表
- [ ] handoff 設計に受け側実装タスク ID（`UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001`）明記
- [ ] secret-leak grep 設計（0 件期待）
- [ ] mutation-endpoint grep 設計（0 件期待）
- [ ] `screenshots/` 未作成（NON_VISUAL 整合）
- [ ] 既知制限が 6 項目以上列挙

## タスク100%実行確認【必須】

- 全実行サブタスク（10 件）が `spec_created`
- E-1〜E-4 の placeholder が `outputs/phase-11/` 配下に配置設計
- AC 設計レベル PASS と実測 PASS の分離が表で明示
- 受け側実装タスクへの handoff 経路が記述
- artifacts.json の `phases[10].status = spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - E-1〜E-4 設計内容を Phase 12 implementation-guide / system-spec-update に転記
  - 受け側実装タスク（`UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001`）を Phase 12 unassigned-task-detection で formalize
  - AC 実測 PASS は受け側実装後 handoff PR で反映する旨を documentation-update-history に記録
- ブロック条件:
  - secret-leak grep に 1 件以上検出
  - mutation-endpoint grep に 1 件以上検出
  - `screenshots/` 誤作成
  - `wrangler` 直呼びサンプル残存
