# Phase 12: ドキュメント更新 — 05b-A-auth-mail-env-contract-alignment

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-A-auth-mail-env-contract-alignment |
| phase | 12 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

正本仕様 (10-notification-auth.md / 08-free-database.md)、aiworkflow references (environment-variables.md / deployment-secrets-management.md)、本ワークフローの index.md / artifacts.json を、採用 env 名 (`MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL`) に片寄せ更新するための仕様を確定する。Phase 12 は spec_created どまりの close-out であり、Step 1-A〜1-C を N/A にせず same-wave sync で閉じる。

## Phase 12 outputs/ 必須成果物（7 ファイル strict）

`outputs/phase-12/` 配下に以下 7 ファイルを揃える。1 つでも欠落した場合は `phase12-task-spec-compliance-check.md` の判定を `FAIL` とする。

| # | ファイル | 由来 Task | 欠落時の扱い |
| - | -------- | --------- | ----------- |
| 1 | `main.md` | Phase 12 本体 | FAIL |
| 2 | `implementation-guide.md` | Task 1（Part 1 中学生 + Part 2 技術者） | FAIL |
| 3 | `system-spec-update-summary.md` | Task 2（Step 1-A / 1-B / 1-C / Step 2） | FAIL |
| 4 | `documentation-changelog.md` | Task 3 | FAIL |
| 5 | `unassigned-task-detection.md` | Task 4（0 件でも必須） | FAIL |
| 6 | `skill-feedback-report.md` | Task 5（改善なしでも必須） | FAIL |
| 7 | `phase12-task-spec-compliance-check.md` | Task 6（最終確認 root evidence） | FAIL |

> canonical filename strict: 別名（例: `documentation-update-history.md`）を使用しない。

## Task 1: implementation-guide.md（2 パート構成）

### Part 1: 中学生レベル（日常の例え話・専門用語なし）

**テーマ**: 「メールを送る鍵の名前を、みんな同じ呼び方にそろえる話」

**例え話の骨格**:
- 学校の係活動で「印刷係に渡す紙」を「印刷用紙」と呼ぶか「コピー用紙」と呼ぶか、人によってバラバラだと印刷係が混乱する。
- このタスクは「メールを送る鍵」「差出人のメールアドレス」「メールに書くリンクの行き先」の 3 つを、開発側・仕様書・運用ガイドで **同じ名前**に統一する話。
- 名前を統一すると、新しい人が来ても「ああ、これとこれは同じものね」と一目で分かる。逆にバラバラだと、片方には鍵を渡したけど片方には渡し忘れた、みたいな事故が起きやすい。

**「なぜ」を先に書く章立て**:
1. なぜ名前を統一するの？ → 鍵の渡し忘れ・二重投入を防ぐため
2. 何を統一するの？ → 3 つの名前（鍵 / 差出人 / リンク先）
3. どうやって統一するの？ → 開発側はそのまま、仕様書だけ書き換える
4. 統一しないとどうなるの？ → 本番でメールが送れず、ログイン用リンクが届かない

**専門用語セルフチェック表（5 用語以上必須）**:

| 専門用語の例 | 日常語への言い換え例 |
| --- | --- |
| 環境変数 | 「アプリが起動するときに渡される設定メモ」 |
| Secret（シークレット） | 「金庫にしまう鍵そのもの。人に見せない」 |
| Variable（変数） | 「掲示板に書いていい設定。隠さなくて良い」 |
| Cloudflare Secrets | 「クラウド上の金庫の入れ物」 |
| 1Password Vault | 「自分のパソコンの金庫アプリの引き出し」 |
| Magic Link | 「クリックするだけでログインできる、使い捨ての特別な URL」 |
| fail-closed | 「鍵が無いときは無理に動かさず、エラーを返して止まる動き方」 |
| エイリアス（alias） | 「同じものを指す別の呼び名（例: 太郎 / タロちゃん）」 |

**Part 1 必須要素チェックリスト**（書き終えたら全項目を確認）:

| # | チェック項目 |
| --- | --- |
| 1 | 学校の係活動 / 鍵 / 金庫 などの日常の例え話が 1 つ以上ある |
| 2 | 専門用語セルフチェック表に 5 用語以上、各用語に日常語の言い換え併記 |
| 3 | 中学 2 年生が読んで止まらない語彙（「契約」「永続化」「インターフェース」が裸で出てこない） |
| 4 | 「なぜ統一するか」が「何をするか」より先に書かれている |
| 5 | phase-12.md にドラフトがある場合は逐語コピー寄りに収める |

### Part 2: 技術者レベル

**章立て**:

1. **採用 env 一覧**
   - `MAIL_PROVIDER_KEY`（Secret / Cloudflare Secrets / op://UBM-Hyogo/auth-mail/MAIL_PROVIDER_KEY）
   - `MAIL_FROM_ADDRESS`（Variable / `apps/api/wrangler.toml [env.<env>.vars]`）
   - `AUTH_URL`（Variable / `apps/api/wrangler.toml [env.<env>.vars]`）
2. **旧名 → 正本名 移行手順**
   - spec docs 更新（10-notification-auth.md / 08-free-database.md）
   - aiworkflow references 更新（environment-variables.md / deployment-secrets-management.md）
   - Cloudflare 投入は `bash scripts/cf.sh secret put` 経路（stdin only / `--body` 禁止）
   - 旧名が誤投入されている場合の rollback（`secret delete` → 正本名で再投入）
3. **fail-closed 仕様**
   - production × `MAIL_PROVIDER_KEY` 未設定 → 502 `MAIL_FAILED`
   - request 単位 fail-closed（boot fail 不採用 / `/healthz` / cron 非影響）
   - Env interface (`apps/api/src/index.ts` L62-66) と `resolveMailSender` factory の責務分離
4. **実装委譲先**
   - 本タスク = spec / runbook 整流のみ
   - 実 secret 投入: 09a (staging) / 09c (production)
   - Magic Link 実送信 smoke: 09a
   - callback 経路 / Credentials provider 統合: 05b-B
5. **境界宣言**
   - Phase 11 完了 = evidence template 完了 ≠ production 実測 PASS
   - Phase 12 close-out = spec_created を維持し completed / applied に上げない

## Task 2: system-spec-update-summary.md

### Step 1-A: spec docs 更新計画

| ファイル | 更新内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/10-notification-auth.md` § 環境変数 | `RESEND_API_KEY` → `MAIL_PROVIDER_KEY`、`RESEND_FROM_EMAIL` → `MAIL_FROM_ADDRESS`、`SITE_URL` → `AUTH_URL`。Variable / Secret 種別列を追加。production 502 `MAIL_FAILED` 脚注を追記 |
| `docs/00-getting-started-manual/specs/08-free-database.md` § シークレット配置 | `RESEND_API_KEY` 行を `MAIL_PROVIDER_KEY` に置換、`MAIL_FROM_ADDRESS` / `AUTH_URL` を Variable として追記 |

### Step 1-B: aiworkflow references 更新計画

| ファイル | 更新内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | 既に正本表記。spec docs への cross-reference 行を追加 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | UT-25 / UT-27 と同様の投入運用ルールに `MAIL_PROVIDER_KEY` を追記 |

### Step 1-C: 実装側ドキュメント / 関連タスクテーブル更新

| 対象 | 更新内容 |
| --- | --- |
| 本ワークフロー `index.md` の status 行 | `spec_created` を維持 |
| aiworkflow-requirements `LOGS.md` / `topic-map.md` | same-wave で append（実体ある場合は直接、generator がある場合はコマンドを compliance-check に記録） |
| 関連タスクテーブル | 05b-B / 09a / 09c の依存解消条件を current facts へ反映 |

### Step 2: 新規インターフェース追加判定

**判定: N/A**

理由:

- 本タスクは env 名整流の docs-only であり、TypeScript インターフェース / API endpoint / IPC 契約 / shared package 型の **新規追加なし**。
- `Env interface` (`apps/api/src/index.ts` L62-66) と `AuthRouteEnv` (`routes/auth/index.ts` L34-62) は既に正本 env 名で定義済み。
- 派生作業（実 secret 投入 / Magic Link 実送信 smoke / production deploy）は別タスク（05b-B / 09a / 09c）でスコープ化済み。本 Phase 12 ではスコープ外。

### Step 2 stale contract withdrawal の有無

旧 env 名 (`RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL`) は spec docs にのみ存在し、実装側には参照ゼロ（Phase 1 真因表で確認済）。stale references の撤回は Step 1-A の置換で完了し、別途 contract withdrawal 文書は不要。

### root / outputs artifacts.json parity

`outputs/artifacts.json` は本ワークフローでは作成されておらず、root `artifacts.json` が唯一正本である。parity check は root のみで実施し PASS とする。

## Task 3: documentation-changelog.md

`scripts/generate-documentation-changelog.js` 相当のフォーマットで以下を記録:

- 更新対象ファイル（spec 2 + aiworkflow 2 + 本ワークフロー index）
- 更新方針（旧名 → 正本名 置換 / Variable・Secret 種別列追加 / fail-closed 脚注追加）
- 同期 wave: 05b-fu
- 実 commit / push は Phase 13 user 承認後

## Task 4: unassigned-task-detection.md（0 件でも出力必須）

### 検出された後続タスク候補

| # | タスク候補 | 種別 | 申し送り先 | 採否 |
| --- | --- | --- | --- | --- |
| 1 | staging Cloudflare Secrets / Variables への実 secret 投入 | implementation | 09a-A or 新規 unassigned-task | **下流委譲済**（既存 09a に内包） |
| 2 | production Cloudflare Secrets / Variables への実 secret 投入 | implementation | 09c-A | **下流委譲済**（既存 09c に内包） |
| 3 | staging Magic Link 実送信 smoke（200 + 受信トレイ到達） | smoke | 09a-A | **下流委譲済** |
| 4 | production fail-closed 検証（未投入時 502 `MAIL_FAILED`） | smoke | 09c-A | **下流委譲済** |
| 5 | API 環境変数 binding を `resolveMailSender` 経由に統一する helper 化 | refactoring | 新規 unassigned-task 候補 | **要評価**（実装側は既に `resolveMailSender` factory を持つため必要性低。skill-feedback で再評価） |
| 6 | 旧名 (`RESEND_API_KEY` 等) が Cloudflare に既投入されている場合のクリーンアップ | cleanup | 09a 着手時に検出ベースで判定 | **条件付き**（Phase 11 secret-list-check.md で旧名 0 件確認なら不要） |
| 7 | 1Password Vault item 実値登録 (`op://UBM-Hyogo/auth-mail/MAIL_PROVIDER_KEY`) | provisioning | user 承認後に user 自身が実施 | **user 操作領域**（仕様書外） |

### 必須セクション（4 種）

各候補タスク登録時には以下 4 種を必ず含める:

1. **苦戦箇所【記入必須】**: 例: secret 値の op read 出力を shell history に残してしまう事故
2. **リスクと対策**: 例: 旧名が混在投入されると Magic Link が間欠失敗。対策 = secret-list-check.md で name 集合を毎回確認
3. **検証方法**: 例: `bash scripts/cf.sh secret list` の name 集合と仕様 expected 集合の一致
4. **スコープ（含む / 含まない）**: 例: 含む = staging / production への投入手順、含まない = 値の生成 / rotation 周期

### 0 件判定の場合のテンプレ

> 本タスクで新規 unassigned-task は formalize しない。下流 09a / 09c で内包される #1〜#4、user 操作領域の #7、条件付き #6、評価保留の #5 のみ。すべて既存タスク or user 領域に申し送られているため、新規ファイル `docs/30-workflows/unassigned-task/task-*.md` の作成は不要。

## Task 5: skill-feedback-report.md（改善なしでも出力必須）

### 改善候補

| 観点 | 記録内容 | promotion / defer / reject |
| --- | --- | --- |
| テンプレート改善 | NON_VISUAL × env contract alignment 系の代替 evidence テンプレ（env-name-grep / secret-list-check / readiness）が `phase-11-non-visual-alternative-evidence.md` に未収録 | **promotion** 候補。promotion target: `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` に「env contract alignment（key 名整流）」テンプレ節を追加 |
| ワークフロー改善 | spec_created docs-only タスクで Phase 9 の typecheck / lint / test 対象外を明示する標準文言が欲しい | **promotion** 候補。promotion target: `phase-09-spec.md`（あれば） / `phase-template-phase09.md` の docs-only 分岐 |
| ドキュメント改善 | secret 実値混入検出の高エントロピー grep パターン (`re_[A-Za-z0-9]{16,}` 等)を共通化 | **defer**。`docs/30-workflows/unassigned-task/` に formalize 候補（緊急度低）|

### 0 件の場合のテンプレ

> 改善点なし。本タスクで適用したテンプレは既存 references で網羅されている。

### routing 必須フィールド

各 feedback エントリには (a) promotion target / no-op reason / (b) evidence path / (c) 採否判定（Promote / Defer / Reject）を明記する。

## Task 6: phase12-task-spec-compliance-check.md（root evidence）

### 監査軸

| 軸 | 確認内容 | PASS 条件 |
| --- | --- | --- |
| 7 ファイル実体 | outputs/phase-12/ に 7 ファイル存在 | `ls outputs/phase-12/*.md \| wc -l` == 7 |
| canonical filename | 別名 (例: documentation-update-history.md) 不在 | grep で別名検出 0 |
| artifacts.json parity | root 単独正本（outputs 不在は本ワークフロー仕様）| 上記文言を逐語記載 |
| Phase status | 全 Phase が `spec_created` 維持 | completed / applied 主張なし |
| same-wave sync | LOGS / topic-map / index への append 計画 | system-spec-update-summary.md Step 1-A / 1-C で記録 |
| skill feedback promotion gate | 全 feedback に promotion / defer / reject の判定 | skill-feedback-report.md でルーティング済 |
| unassigned-task 0 件判定根拠 | 0 件の場合は下流委譲先 / user 領域 / 条件付きの分類を明記 | unassigned-task-detection.md でテンプレ準拠 |

### 必須逐語文言

> `outputs/artifacts.json` は本ワークフローでは作成されておらず、root `artifacts.json` が唯一正本である。parity check は root のみで実施し PASS とする。

> Phase 11 completed = evidence template 完了であり、production 実測 PASS ではない。

### PASS 判定の前提

`PASS` は (a) 7 outputs の実体 + (b) validator 実測値（`ls` / `rg` の終了コードと結果）+ (c) same-wave sync 証跡が揃った後にのみ許可する。存在しない監査スクリプト名を根拠にしない。

## 実行タスク

1. 7 ファイル strict の構成を確定する。完了条件: ファイル名と由来 Task が 1:1 に対応する。
2. Task 1 (implementation-guide.md) の Part 1 / Part 2 構成を定義する。完了条件: Part 1 必須要素チェックリスト 5 項目と専門用語表 5 用語以上が記載される。
3. Task 2 (system-spec-update-summary.md) の Step 1-A / 1-B / 1-C / Step 2 を定義する。完了条件: Step 2 N/A 判定の 3 項目根拠が記載される。
4. Task 3 (documentation-changelog.md) のフォーマットを定義する。完了条件: 更新対象 / 方針 / wave が記載される。
5. Task 4 (unassigned-task-detection.md) で後続タスク候補を列挙する。完了条件: 0 件でもテンプレ準拠で記録される。
6. Task 5 (skill-feedback-report.md) で改善候補と routing を定義する。完了条件: promotion / defer / reject 判定が全 feedback に紐付く。
7. Task 6 (phase12-task-spec-compliance-check.md) で監査軸と必須逐語文言を定義する。完了条件: 7 軸すべてに PASS 条件が記載される。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-12-spec.md
- .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md
- .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md
- Phase 1〜3 の決定事項（採用 env 名 / fail-closed 仕様 / alias 不採用）
- Phase 11 NON_VISUAL 代替 evidence テンプレ
- docs/00-getting-started-manual/specs/10-notification-auth.md
- docs/00-getting-started-manual/specs/08-free-database.md
- .claude/skills/aiworkflow-requirements/references/environment-variables.md
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md

## 実行手順

- 対象 directory: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない
- 実 spec docs 更新（10-notification-auth.md / 08-free-database.md の本文書き換え）は user 承認後・Phase 13 PR payload に含める
- secret 実値・provider response body・op read 出力を outputs に転記しない

## 統合テスト連携

- 上流: 05b Magic Link provider, 10-notification-auth.md, environment-variables.md, deployment-secrets-management.md
- 下流: 05b-B-magic-link-callback-credentials-provider, 09a-A-staging-deploy-smoke-execution, 09c-A-production-deploy-execution

## 多角的チェック観点

- #16 secret values never documented: implementation-guide.md / system-spec-update-summary.md の双方で値・hash 記録禁止を明記
- #15 Auth session boundary: `AUTH_SECRET` 据え置きを system-spec-update-summary.md に記録
- #14 Cloudflare free-tier: 新規 binding ゼロを compliance-check で確認
- 未実装/未実測を PASS と扱わない: spec_created close-out の境界を明文化
- プロトタイプと仕様書の採用/不採用を混同しない: GAS prototype の `RESEND_*` を更新対象に含めない

## サブタスク管理

- [ ] 7 ファイル strict 構成を定義した
- [ ] implementation-guide.md Part 1 / Part 2 構成を定義した
- [ ] system-spec-update-summary.md Step 1-A〜1-C / Step 2 を定義した
- [ ] documentation-changelog.md フォーマットを定義した
- [ ] unassigned-task-detection.md 後続候補を列挙した
- [ ] skill-feedback-report.md 改善候補と routing を定義した
- [ ] phase12-task-spec-compliance-check.md 監査軸と必須逐語文言を定義した
- [ ] outputs/phase-12/main.md を作成する

## 成果物

- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## 完了条件

- 7 ファイル strict（canonical filename）の構成が outputs/phase-12/ に揃う前提仕様が確定している
- implementation-guide.md Part 1 が中学生レベル必須要素 5 項目 + 専門用語表 5 用語以上を満たす設計になっている
- implementation-guide.md Part 2 が採用 env 一覧 / 移行手順 / fail-closed 仕様 / 実装委譲先を含む
- system-spec-update-summary.md が Step 1-A / 1-B / 1-C / Step 2 (N/A 根拠 3 項目) を含む
- documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md が 0 件でも出力必須のルールに従う
- phase12-task-spec-compliance-check.md が 7 軸 PASS 条件と必須逐語文言を含む
- root artifacts.json 単独正本の文言が逐語記載されている
- canonical filename strict（別名禁止）が明記されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] secret 実値を記録していない（env 名と op:// 参照のみ）

## 次 Phase への引き渡し

Phase 13（PR 作成）へ次を渡す:

- 7 ファイル strict の outputs 構成
- spec docs / aiworkflow references / 本ワークフロー index への更新計画（実適用は user 承認後）
- 「Phase 11 evidence template 完了 ≠ production 実測 PASS」の境界文言
- unassigned-task は 0 件 formalize（下流 09a / 09c に内包・user 領域に分離）
- skill feedback の promotion target（phase-11-non-visual-alternative-evidence.md への env contract alignment テンプレ追加候補）
