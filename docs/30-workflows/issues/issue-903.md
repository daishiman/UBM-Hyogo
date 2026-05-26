# [#903] "[parallel-03-followup-005-member-runtime-evidence] parallel-03 AppShell layouts の member runtime evidence 2 件 (EV-13/EV-16) 完遂"

## メタ情報

```yaml
task_id: parallel-03-followup-005-member-runtime-evidence
task_name: parallel-03 AppShell layouts の member runtime evidence 2 件 (EV-13/EV-16) 完遂
category: 改善 / evidence completion
target_feature: parallel-03 で実装した AppShell 3 系統のうち member shell の runtime evidence
priority: 中
scale: 小規模
status: 未実施
source_phase: Phase 12（parallel-03-followup-002 close-out の未タスク再検出）
created_date: 2026-05-23
dependencies: []
spec_path: docs/30-workflows/completed-tasks/parallel-03-followup-005-member-runtime-evidence.md
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---
## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/`
- 直接の前身 sub-workflow: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-followup-002-admin-runtime-evidence/`（admin 版 EV-12 を `present` に昇格済み。本タスクはその member 版）
- 依存 sub-workflow: `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/`（`(member)` route group 内 child route 整備先。**本タスクのブロッカー**）
- 関連 sub-workflow: `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/`（full chrome 4 screens visual baseline。member 認証 screenshot の最終 baseline 委譲先）
- Phase 11 evidence 状態: 親台帳で EV-13（member DOM scrape）= `pending`、EV-16（member screenshot）= `pending`
- 関連 outputs:
  - `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-11-evidence-inventory.md`
  - `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/`
- 関連実装:
  - `apps/web/app/(member)/layout.tsx`
  - `apps/web/playwright/tests/parallel-03-admin-shell-scrape.spec.ts`（followup-002 の admin scrape spec。本タスクの複製ベース）

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

parallel-03（AppShell layouts）では、UI prototype alignment / MVP recovery の不変条件3「プロトタイプ正本順位」に従い、public / admin / member の 3 系統の AppShell layout を `docs/00-getting-started-manual/claude-design-prototype/` の primitives + OKLch tokens で再構築した。Phase 11 evidence inventory は 3 系統それぞれに **DOM scrape (data-* 契約検証用)** と **screenshot (visual regression baseline)** を取得する設計で、20 件の EV 行を定義している。

元未タスク `parallel-03-followup-002-admin-member-runtime-evidence-completion.md`（issue #833, 2026-05-19 発見）は **admin と member の両方**（EV-12/13/15/16）を 1 サイクルで完遂するスコープだった。しかし実際に実装された `parallel-03-followup-002-admin-runtime-evidence` は、現コードに最適化した縮小スコープとして **admin の EV-12 のみ**を `present` に昇格し、member 側（EV-13/EV-16）と screenshot 系（EV-15）を以下のように委譲して閉じた:

- **EV-13** member DOM scrape: 「`(member)` route group 内に scrape 対象 child route が現状未実装 → serial-05 に委譲」
- **EV-16** member screenshot: 「member route 欠如 + full chrome baseline は serial-07 / UT-DSF-07 (#829) に委譲」

### 1.2 問題点・課題

followup-002 の close-out で member EV を「serial-05 / serial-07 に委譲」と記載したが、委譲先の実体を検証すると **member runtime evidence の取得責務を負うオーナーが実在しない**:

- `serial-05-page-routes-blueprint-binding/phase-11-evidence-inventory.md` には **EV-13 / member DOM scrape / runtime DOM 取得の記載が一切無い**。serial-05 は `(member)` route group の child route を**実装**する責務であって、その runtime DOM scrape evidence を**取得**する責務は持たない。
- `serial-07-regression-evidence/phase-08-dod.md` の screenshot set は `{top, members-list, member-detail, admin-dashboard}` であり、`(member)` route group（profile 等の認証済み member shell）の full chrome screenshot は含まれない。serial-07 が扱うのは public + admin-dashboard の visual baseline。
- OPEN な「member AppShell runtime evidence」followup Issue は存在しない（#833 は admin に縮小されて CLOSED）。

つまり followup-002 が admin で確立した「runtime DOM scrape による data-* 契約の機械検証」パターンの **member 版が、責務の隙間に落ちて宙に浮いている**。これは followup-002 自身が Phase 9 リスク台帳 **R-07「委譲 EV（EV-13/15/16）が『先送り』と誤解され宙に浮く」** として識別していたリスクが顕在化したものである。

### 1.3 放置した場合の影響

- 親 workflow parallel-03 の Phase 11 evidence inventory が EV-13/EV-16 `pending` のまま固定され、member shell の data-* 契約（`data-theme="member"` / `data-shell` / `data-route-group="member"`）が production-equivalent DOM に実際に出力されているか runtime 検証されない。
- member shell の contract regression が起きた際、admin で確立した grep ベースの早期検知が member には効かず、pixel diff のみに依存する。
- 「serial-05 / serial-07 に委譲」という記載が trace として残り続け、誰も着手しない宙吊り状態が固定化する（R-07 の永続化）。

---

## 2. 何を達成するか（What）

### 2.1 目的

followup-002 が admin で確立した runtime DOM scrape パターンを member shell に適用し、親 parallel-03 台帳の EV-13（member DOM scrape）を `pending` → `present` に昇格する。EV-16（member screenshot）は serial-07 / UT-DSF-07 (#829) への委譲が妥当か再評価し、委譲を維持する場合は親台帳に委譲先と理由を明記して trace を確定させる。

### 2.2 最終ゴール

- `parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-member.txt` が存在し、`data-theme=` / `data-shell=` / `data-route-group=` 等の member shell 契約属性を 1 件以上含む
- 親 `phase-11-evidence-inventory.md` の EV-13 Status が `present`（取得手順・grep target 付き）に更新済み
- EV-16 は委譲維持なら委譲先 (serial-07 / #829) と理由が親台帳に明記済み、または本タスクで取得するなら `outputs/phase-11/screenshots/member-shell.png` が存在
- `verify:phase11-evidence` / `verify-phase12-compliance` gate が 0 fail で pass
- production code 無変更（`implementation_mode: verify_existing`。member route 自体は serial-05 が実装済みであることが前提）

### 2.3 スコープ

#### 含むもの

- `(member)` route group 直下に scrape 可能な child route が存在することの確認（serial-05 完了が前提）
- followup-002 の `parallel-03-admin-shell-scrape.spec.ts` を複製した `parallel-03-member-shell-scrape.spec.ts` の新規作成（mock API 経由・Playwright `desktop-chromium` project）
- member shell の runtime DOM scrape → `dom-scrape-member.txt` 出力（trace header 付き）
- 親 `phase-11-evidence-inventory.md` の EV-13（必要なら EV-16）Status 列更新 + 委譲注記
- EV-16 screenshot を本タスクで取得するか serial-07 委譲を維持するかの判断記録

#### 含まないもの

- 新規 API endpoint 追加・D1 schema 変更（不変条件1違反）
- HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` の色指定（不変条件2「OKLch トークン正本化」違反）
- 新規 primitive 追加（不変条件3「プロトタイプ正本順位」違反）
- `apps/web` からの D1 直接 binding 利用（不変条件4違反）
- `(member)` route group の child route 実装そのもの（serial-05 の責務。本タスクは evidence 取得のみ）
- serial-07 が扱う full chrome multi-viewport visual baseline（責務委譲先）

### 2.4 成果物

- `apps/web/playwright/tests/parallel-03-member-shell-scrape.spec.ts`（新規）
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-member.txt`（新規）
- `phase-11-evidence-inventory.md` の EV-13（/EV-16）Status 列更新差分
- （EV-16 を取得する場合）`outputs/phase-11/screenshots/member-shell.png`

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- **serial-05-page-routes-blueprint-binding が `(member)` route group 直下に scrape 対象 child route を 1 件以上 land 済みであること**（本タスクの最大ブロッカー）
- mock API（fixture port）で member 認証相当のレスポンスが返り、SSR で member shell が描画されること
- followup-002 の admin scrape spec（`parallel-03-admin-shell-scrape.spec.ts`）が動作する Playwright 実行環境

### 3.2 依存タスク

| 依存先 | 関係 | ブロッカー判定 |
| --- | --- | --- |
| `serial-05-page-routes-blueprint-binding` | `(member)` route group の child route 実装 | **強ブロッカー**（route が無いと scrape 対象が存在しない） |
| `parallel-03-followup-002-admin-runtime-evidence` | admin scrape spec / 親台帳更新パターンの前身 | 完了済み（複製ベース） |
| `serial-07-regression-evidence` / UT-DSF-07 (#829) | member full chrome screenshot baseline | EV-16 を委譲維持する場合の受け皿 |

### 3.3 必要な知識

- Playwright（`desktop-chromium` project、mock API fixture、`waitForSelector` による attach 待ち）
- Next.js App Router の route group `(member)` と layout (`apps/web/app/(member)/layout.tsx`) の data-* 契約属性
- AppShell 契約属性の grep 検証（`data-theme` / `data-shell` / `data-route-group`）
- Phase 11 evidence inventory の status 語彙（`present` / `pending` / `n/a` のみ。`captured` は validator invalid）

### 3.4 推奨アプローチ

followup-002 で確立した admin scrape の構造をそのまま member に写像する。`parallel-03-admin-shell-scrape.spec.ts` を複製し、対象 route を `(admin)` の dashboard から `(member)` の child route（serial-05 が land したもの。例: `/profile`）に差し替え、grep target を `data-route-group="member"` 等の member 契約属性に合わせる。出力先は親 parallel-03 の `outputs/phase-11/dom-scrape-member.txt`。

---

## 3.5 実装課題と解決策（親タスク followup-002 からの教訓）

| 課題 | 発見経緯 | 解決策 | 教訓 |
| ---- | -------- | ------ | ---- |
| mock API のレスポンスが SSR を抑止し shell が空 scrape になる | followup-002 R-01 | `waitForSelector('[data-testid="member-shell"]')` で attach 待ち + `lines.length > 0` を assert し、空なら fail させ evidence 化を防ぐ | 空 evidence を `present` 扱いしない |
| status 語彙に `captured` 等 invalid を書いて gate fail | followup-002 R-03 / 原 #833 の指示語 | 親台帳 status は `present` / `pending` / `n/a` のみ。member EV-13 取得後は `present` | validator 語彙を Phase 5 着手前に固定 |
| 委譲 EV が「先送り」と誤解され宙に浮く | followup-002 R-07（**本タスク自体がその顕在化**） | 委譲を残す EV（EV-16 等）は委譲先 ID と理由を親台帳・dependency 表の両方に明記 | 「委譲」は必ず実在オーナーへの参照で裏付ける |
| Playwright command が stale な `--project=chromium` | followup-002 automation-30 review | `--project=desktop-chromium` を使用。`PLAYWRIGHT_SKIP_WEB_SERVER=1` を documented command から除く | webServer を起動する正規コマンドを記載 |
| scrape 出力に trace header が無く再現性が落ちる | followup-002 automation-30 review | `dom-scrape-member.txt` 先頭に取得 route / コマンド / 日時の trace header を書き込む | scrape 出力は dump ではなく機械検証 evidence |

> 関連参照: followup-002 `phase-09-risks.md`（R-01〜R-07）/ `outputs/phase-12/skill-feedback-report.md`（automation-30 review feedback）

---

## 4. 実行手順

### Phase構成

小規模（1-2 Phase 相当）。verify_existing として、Phase 4 = member scrape spec 設計、Phase 5 = scrape 実行 + 親台帳更新を主作業とする。

### Phase A: 前提確認 + member scrape spec 作成

#### 目的

serial-05 の member route 実在を確認し、member scrape spec を用意する。

#### 手順

1. serial-05 完了確認: `ls apps/web/app/\(member\)/` で child route（`page.tsx`）の実在を確認。無ければ本タスクは **blocked** とし serial-05 完了まで着手しない。
2. `parallel-03-admin-shell-scrape.spec.ts` を `parallel-03-member-shell-scrape.spec.ts` に複製。
3. 対象 route を member child route に差し替え、grep target を member 契約属性（`data-theme="member"` / `data-shell` / `data-route-group="member"`）に調整。
4. `waitForSelector('[data-testid="member-shell"]')` で attach 待ちを設定。

#### 成果物

`apps/web/playwright/tests/parallel-03-member-shell-scrape.spec.ts`

#### 完了条件

spec が member route を対象に DOM を取得し、空でない行を `dom-scrape-member.txt` に書き出せる。

### Phase B: scrape 実行 + 親台帳更新 + gate

#### 目的

EV-13 を `present` に昇格し、EV-16 の委譲/取得を確定する。

#### 手順

1. scrape 実行（webServer 起動込み・`desktop-chromium` project）:
   ```bash
   PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11 \
     mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
     playwright/tests/parallel-03-member-shell-scrape.spec.ts \
     --project=desktop-chromium --reporter=line
   ```
2. `dom-scrape-member.txt` が `data-route-group="member"` 等を 1 件以上含むことを grep 確認。
3. 親 `phase-11-evidence-inventory.md` の EV-13 Status を `present` に更新（取得コマンド + grep target を併記）。
4. EV-16: serial-07 / #829 委譲を維持する場合は委譲先と理由を明記。本タスクで 1280x800 1 枚を取得する場合は `outputs/phase-11/screenshots/member-shell.png` を保存。
5. gate 実行: `bash scripts/verify-pr-ready.sh`

#### 成果物

`dom-scrape-member.txt`、`phase-11-evidence-inventory.md` 更新差分

#### 完了条件

EV-13 = `present`、gate 0 fail。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `(member)` route group child route が serial-05 により land 済み
- [ ] `parallel-03-member-shell-scrape.spec.ts` が member route の DOM を scrape できる
- [ ] `dom-scrape-member.txt` が member 契約属性を 1 件以上含む（non-empty）

### 品質要件

- [ ] 親台帳 EV-13 Status = `present`（取得手順・grep target 付き）
- [ ] EV-16 の委譲先 or 取得結果が親台帳に明記
- [ ] status 語彙が `present` / `pending` / `n/a` のみ
- [ ] `verify:phase11-evidence` / `verify-phase12-compliance` gate が 0 fail
- [ ] 4 不変条件（既存 API のみ / OKLch / プロトタイプ正本 / D1 直接禁止）遵守

### ドキュメント要件

- [ ] 親 parallel-03 台帳の EV-13/EV-16 行が current facts に更新済み
- [ ] 本タスクの close-out で followup-002 と同型の Phase 12 成果物（必要な場合）を揃える

---

## 6. 検証方法

### テストケース

- TC-1: `dom-scrape-member.txt` が `data-theme="member"` を 1 件以上含む
- TC-2: 抽出行に `#[0-9a-fA-F]{3,6}` の HEX 直書きが無い（OKLch 不変条件）
- TC-3: member shell が空 DOM の場合 spec が fail する（空 evidence の `present` 化を防ぐ）
- TC-4: `verify:phase11-evidence` validator が EV-13 path 存在を検知し pass

### 検証手順

`bash scripts/verify-pr-ready.sh` が `verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift を 0 fail で通過すること。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| serial-05 の member route が未 land でブロッカー解消しない | 高 | 中 | Phase A 手順1 で実在確認し、無ければ blocked のまま起票し serial-05 完了を待つ。最小 placeholder route の一時投入は serial-05 完了時に削除する transient artifact として最終手段 |
| mock API が member 認証相当を返さず shell が空 scrape | 中 | 中 | followup-002 R-01 と同じく `waitForSelector` + `lines.length > 0` assert（→ 3.5 参照） |
| EV-16 が再び宙に浮く（R-07 再発） | 中 | 中 | EV-16 の委譲/取得を本タスクで必ず確定し、委譲なら実在オーナー (serial-07/#829) への参照で裏付ける |
| status 語彙 invalid で gate fail | 中 | 低 | `present`/`pending`/`n/a` 限定を Phase 着手前に固定（→ 3.5 参照） |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-11-evidence-inventory.md`（EV-13/EV-16 行）
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-followup-002-admin-runtime-evidence/`（admin 版の前身。Phase 1-13 全文がテンプレート）
- `docs/30-workflows/unassigned-task/parallel-03-followup-002-admin-member-runtime-evidence-completion.md`（原 #833 未タスク。admin+member 原スコープ）
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/`（member route 実装先）
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/`（member screenshot baseline 委譲先）
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション（4 不変条件）

### 参考資料

- followup-002 `phase-09-risks.md` R-07（委譲 EV の宙吊りリスク）
- followup-002 `outputs/phase-12/skill-feedback-report.md`（automation-30 review feedback: project 名 / webServer / trace header）
- MEMORY.md「UBM-Hyogo テストアカウント」（member: `manju.manju.03.28@gmail.com`）

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | followup-002 close-out の `unassigned-task-detection.md` が「member EV は serial-05 / serial-07 に委譲済み」として新規未タスク 0 件と結論していたが、委譲先の実 evidence 台帳と照合すると member runtime evidence のオーナーが実在しなかった。 |
| 原因 | 「委譲」を委譲先 sub-workflow の**存在**だけで裏付け、委譲先が実際にその EV を**取得責務として持つか**まで検証していなかった。serial-05 は route 実装、serial-07 は public+admin screenshot が責務で、member runtime DOM scrape は誰の責務でもなかった（followup-002 R-07 の顕在化）。source evidence: `serial-05-page-routes-blueprint-binding/phase-11-evidence-inventory.md`（EV-13 記載なし）、`serial-07-regression-evidence/phase-08-dod.md`（screenshot set に member shell なし）。 |
| 対応 | 委譲先の phase-11-evidence-inventory.md / phase-08-dod.md を grep し、EV-ID または対象 route が実際に列挙されているかを確認。列挙が無いものは「委譲」ではなく「オーナー不在の residual」と再分類し、本未タスクとして formalize した。 |
| 再発防止 | unassigned-task-detection で「委譲」と判定する場合は、委譲先の evidence 台帳 / DoD に当該 EV-ID（または対象 route）が**明示列挙**されていることを grep で確認してから委譲扱いにする。委譲先の存在だけでは委譲の裏付けにならない。followup の Phase 9 リスク台帳に「委譲 EV の宙吊り」(R-07型) を立てた場合は、close-out 時にそのリスクが顕在化していないかを必ず再点検する。 |

### レビュー指摘の原文（該当する場合）

```
（該当なし。followup-002 の unassigned-task-detection.md「No new unassigned task is created in this cycle」を 2 回検証した結果、委譲先実体の不在を確認して再分類した。）
```

### 補足事項

本タスクは serial-05 の `(member)` route group child route 完了が強ブロッカー。serial-05 完了前に着手すると scrape 対象 route が存在せず空振りする。Issue 化時は `status:unassigned` + `priority:medium` + `area:web` + `area:testing` + `type:followup` を付与し、serial-05 完了に blocked 依存を明記する。
</content>
</invoke>
