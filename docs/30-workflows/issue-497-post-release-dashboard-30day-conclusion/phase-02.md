# Phase 2: 設計（集計手順 / redaction / references 追記構造）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-497 post-release-dashboard 30 日連続実行 conclusion 集計と skill feedback 化 |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計（集計手順 / redaction / references 追記構造） |
| 作成日 | 2026-05-06 |
| 前 Phase | 1（要件定義） |
| 次 Phase | 3（設計レビューゲート） |
| 状態 | spec_created |
| 実装区分 | **ドキュメントのみ（CONST_004 例外条件適用 / コード変更なし）** |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #497（CLOSED 維持） |

## 目的

Phase 1 で固定した「30 日連続 schedule run 安定性の客観 baseline 確定 + failure 比率 trigger による次アクション分岐」を、(1) **集計手順設計**（gh run list クエリ / jq 集計式 / 30 日 window 算出）、(2) **redaction 設計**（log-failed 出力に対する機微情報 grep）、(3) **references 追記構造設計**（deployment-gha.md 章配下 4 サブセクション構成）、(4) **次アクション判定ロジック**（`< 10%` / `>= 10%` 2 分岐）の 4 軸で設計する。Phase 3 が 4 観点 / 4 条件で MAJOR / MINOR / PASS を判定できる粒度の設計入力を作成する。

CONST_005 必須項目（変更対象ファイル / テスト方針 / ローカル実行コマンド / DoD）の骨格を本 Phase で提示し、深掘りは Phase 5 / 6 / 9 に委譲する。関数シグネチャ / 型定義 / コードテストは **N/A（コード変更なし）**。

---

## 設計対象 4 軸

### 軸 1: 集計手順設計（gh run list クエリ / jq 集計式 / 30 日 window 算出）

**1-1. 30 日 window 算出**

```bash
# 着手日（today）から 30 日前の ISO 8601 timestamp を計算
THRESHOLD=$(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ)   # macOS BSD date
# Linux 環境では: date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ

# 最古 run の createdAt が THRESHOLD 以前か（30 日 gate 判定）
OLDEST=$(gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json createdAt --jq '[.[].createdAt] | min')
# OLDEST <= THRESHOLD なら 30 日 gate 成立
```

**1-2. raw JSON 取得（limit=80）**

```bash
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json conclusion,createdAt,databaseId,status,displayTitle,event \
  > outputs/phase-11/post-release-dashboard-30d.json
```

採用根拠（limit=80）: 日次 schedule で 30 日分は 30 件。手動 trigger / re-run 等の混入を吸収するため余裕を持たせて 80 件取得（trade-off 表で詳述）。

**1-3. conclusion 分布集計**

```bash
jq 'group_by(.conclusion) | map({
  conclusion: .[0].conclusion,
  count: length
}) | (. as $arr | $arr + [{conclusion: "TOTAL", count: ([.[].count] | add)}])' \
  outputs/phase-11/post-release-dashboard-30d.json
```

期待出力: `success` / `failure` / `cancelled` / `startup_failure` / `timed_out` / `action_required` / `null`（in_progress）の件数と total。

**1-4. 連続 failure 区間の最大日数算出**

```bash
# createdAt 昇順ソート + conclusion=failure/startup_failure/timed_out の連続区間長を算出
jq -r 'sort_by(.createdAt) | map(.conclusion)
  | reduce .[] as $c ({max:0, cur:0};
      if $c == "failure" then {max: ([.max, .cur+1] | max), cur: .cur+1}
      else {max: .max, cur: 0} end)
  | .max' outputs/phase-11/post-release-dashboard-30d.json
```

**1-5. failure 根本原因抽出（人手分類）**

各 failure run について `gh run view <id> --log-failed` を実行し、redaction grep（軸 2）後に手動で以下 6 カテゴリへ分類:

- token 失効 / GraphQL 5xx / cron schedule drift / schema drift / artifact retention / その他

### 軸 2: redaction 設計（機微情報 grep 必須）

**2-1. redaction 必須前処理**

```bash
# failure run の log を一時ファイルへ取得（skill references には書かない）
gh run view <FAILED_RUN_ID> --log-failed > tmp/run-<id>.log

# 機微情報パターン grep（マッチ件数を取得）
HIT=$(rg -i -c -e "token" -e "bearer" -e "secret" -e "Authorization" tmp/run-<id>.log || echo 0)

# マッチがあれば log 内容を skill references に転記しない
# 「（redacted: <pattern> matched, hits=N）」のメタ情報のみ記録する
```

**2-2. redaction 適用方針**

| マッチ件数 | references 追記方針 |
| --- | --- |
| 0 件 | log の root cause 行を抜粋して references に転記可（80 chars 以内・URL は domain のみ） |
| 1 件以上 | log 内容は転記禁止。「（redacted: token/bearer/secret/Authorization のいずれかにマッチ）」のみ記録 |

**2-3. 機微情報パターン網羅性**

base case として `token` / `bearer` / `secret` / `Authorization` の 4 パターンを必須とする。Phase 6（異常系）で追加パターン（`x-api-key` / `client_secret` / `password` / cookie）を補強する余地を残す。

### 軸 3: references 追記構造設計

**3-1. 追記先**

`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` の post-release-dashboard 章配下に、以下構造の新規セクションを追加。

**3-2. セクション構造**

```markdown
### 30 日実測 feedback (since YYYY-MM-DD)

集計対象期間: YYYY-MM-DD 〜 YYYY-MM-DD（30 日）
集計実行日: YYYY-MM-DD
集計対象: `gh run list --workflow=post-release-dashboard.yml --limit=80`（N 件）

#### conclusion 分布

| conclusion | 件数 | 比率 |
| --- | --- | --- |
| success | XX | XX.X% |
| failure | XX | XX.X% |
| cancelled | XX | XX.X% |
| startup_failure | XX | XX.X% |
| timed_out | XX | XX.X% |
| action_required | XX | XX.X% |

#### failure 根本原因分類

| カテゴリ | 件数 | 備考（redaction 適用後） |
| --- | --- | --- |
| token 失効 | XX | （redacted: ...） |
| GraphQL 5xx | XX | ... |
| cron schedule drift | XX | ... |
| schema drift | XX | ... |
| artifact retention | XX | ... |
| その他 | XX | ... |

#### 連続 failure 区間

最長連続 failure: N 日（YYYY-MM-DD 〜 YYYY-MM-DD）
※ 0 日でも明記する

#### 次アクション判断

failure 比率: XX.X%
判定: `< 10%` → 現状維持 / `>= 10%` → retry または alert 追加を別 unassigned task として起票
判断根拠: ...
起票 issue 番号（起票時のみ）: #NNN
```

### 軸 4: 次アクション判定ロジック（`< 10%` / `>= 10%` 2 分岐）

**4-1. 判定式**

```
failure_rate = (failure + startup_failure + timed_out) / TOTAL
```

`cancelled` / `action_required` は人為的 / 外部要因のため failure rate 計算から除外する（trade-off 表で論じる余地あり / base case ではこの定義を採用）。

**4-2. 分岐**

| failure_rate | 次アクション | 起票 |
| --- | --- | --- |
| `< 10%` | 現状維持（schedule 安定性 baseline 確立） | 不要 |
| `>= 10%` | retry または alert 追加を別 unassigned task として起票 | `gh issue create` で別 issue 起票（本タスクスコープ外）|

**4-3. 起票時のテンプレート（参考）**

```bash
gh issue create \
  --title "post-release-dashboard schedule failure 比率 >= 10% / retry/alert 追加検討" \
  --body "issue-497 30 日実測で failure_rate=XX.X% を観測。retry/alert 追加を検討する。Refs #497, Refs #351"
```

---

## trade-off 表

### trade-off A: 取得件数 limit

| 案 | 利点 | 欠点 | base case |
| --- | --- | --- | --- |
| **limit=80（base case）** | 30 件 + 余裕 10 件で manual trigger / re-run 混入を吸収 | gh API rate limit 微増 | ✅ |
| limit=30 | 必要最小限 | re-run 混入で 30 日連続性が崩れる | - |
| limit=100 | 完全余裕 | 30 日 window 外の noise が増え集計コスト増 | - |

**判定**: limit=80 を base case 採用。Phase 11 で 30 日 window 内の rows のみ jq filter で抽出する。

### trade-off B: raw JSON 保存先

| 案 | 利点 | 欠点 | base case |
| --- | --- | --- | --- |
| **outputs/phase-11/post-release-dashboard-30d.json（base case）** | Phase 11 成果物として再現性担保 / artifacts.json と整合 | リポジトリにコミット（小サイズなので問題なし） | ✅ |
| tmp/post-release-dashboard-30d.json | gitignore 対象で軽量 | 後続再現性が失われる / AC-7 不適合 | - |

**判定**: outputs/phase-11/ を base case 採用。AC-7（raw JSON 保存）と直接整合。

### trade-off C: changelog vs workflow-local close-out どちらに反映行を書くか

| 案 | 利点 | 欠点 | base case |
| --- | --- | --- | --- |
| **`changelog/20260506-issue497-30day-feedback.md` 1 行（base case）** | aiworkflow-requirements skill の changelog 正本に追記 | workflow-local close-out と二重管理になる場合のみ注意 | ✅ |
| `workflow-local close-out` 1 行 | プロジェクト横断 LOGS と一貫 | skill 単位の change history が追跡しにくい | fallback |
| 両方に追記 | 二重防御 | 重複・drift リスク | - |

**判定**: `changelog/20260506-issue497-30day-feedback.md` を base case 採用。`workflow-local close-out` は skill changelog が存在しない場合の fallback。AC-6 の「または」表現と整合。

### trade-off D: failure_rate に cancelled / action_required を含めるか

| 案 | 含める | 含めない | base case |
| --- | --- | --- | --- |
| **含めない（base case）** | 機械障害ではない人為的 / 外部要因を除外 | - | ✅ |
| 含める | 全 non-success を failure 扱い | retry で解決しない事象まで retry 起票 trigger になる | - |

**判定**: 含めない。`failure` / `startup_failure` / `timed_out` のみを failure_rate 分母の対象障害として扱う。

---

## 出力契約（後続 Phase の入力）

| 成果物 | パス | Phase | 用途 |
| --- | --- | --- | --- |
| raw JSON | `outputs/phase-11/post-release-dashboard-30d.json` | Phase 11 で生成 / Phase 12 で参照 | AC-7 / 集計再現性 |
| 集計表 markdown 草稿 | `outputs/phase-11/conclusion-distribution.md` | Phase 11 で生成 / Phase 12 で references へ転記 | AC-2 / AC-3 / AC-4 |
| 追記差分 | `outputs/phase-12/skill-references-diff.md` | Phase 12 で生成 | references diff の記録（実 references 追記との照合） |
| changelog 行 | `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` | Phase 12 で追記 | AC-6 |
| 起票 issue（条件付き） | `gh issue create` 出力 | failure_rate >= 10% の場合のみ Phase 12 で実行 | AC-5 |

---

## 変更対象ファイル（最終）

| パス | 変更種別 | Phase |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | markdown 追記（30 日実測 feedback 章 / 4 サブセクション） | 12 |
| `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` | 1 行追記 | 12 |
| `outputs/phase-11/post-release-dashboard-30d.json` | 新規 | 11 |
| `outputs/phase-11/conclusion-distribution.md` | 新規 | 11 |
| `outputs/phase-12/skill-references-diff.md` | 新規 | 12 |

関数シグネチャ / 型定義 / コードテスト: **N/A（コード変更なし）**

---

## ローカル実行コマンド（base case 確定版）

```bash
# 1. 30 日 gate 判定
THRESHOLD=$(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ)
OLDEST=$(gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json createdAt --jq '[.[].createdAt] | min')
echo "THRESHOLD=$THRESHOLD OLDEST=$OLDEST"

# 2. raw JSON 取得
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json conclusion,createdAt,databaseId,status,displayTitle,event \
  > outputs/phase-11/post-release-dashboard-30d.json

# 3. conclusion 分布集計
jq 'group_by(.conclusion) | map({conclusion: .[0].conclusion, count: length})' \
  outputs/phase-11/post-release-dashboard-30d.json

# 4. 連続 failure 最長区間
jq -r 'sort_by(.createdAt) | map(.conclusion)
  | reduce .[] as $c ({max:0, cur:0};
      if $c == "failure" then {max: ([.max, .cur+1] | max), cur: .cur+1}
      else {max: .max, cur: 0} end)
  | .max' outputs/phase-11/post-release-dashboard-30d.json

# 5. failure run 一覧
jq -r '.[] | select(.conclusion == "failure" or .conclusion == "startup_failure" or .conclusion == "timed_out") | .databaseId' \
  outputs/phase-11/post-release-dashboard-30d.json

# 6. 各 failure run の redaction grep
for id in $(jq -r '.[] | select(.conclusion == "failure" or .conclusion == "startup_failure" or .conclusion == "timed_out") | .databaseId' \
              outputs/phase-11/post-release-dashboard-30d.json); do
  gh run view $id --log-failed > tmp/run-$id.log
  rg -i -c -e "token" -e "bearer" -e "secret" -e "Authorization" tmp/run-$id.log \
    || echo "0 (clean)"
done
```

---

## 不変条件への影響

すべて影響なし（コード変更なし / D1 アクセスなし / フォーム関連変更なし）。Phase 1 と同様。

---

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 4 軸設計（集計 / redaction / references / 判定）が AC-1〜AC-11 を網羅し、機械的に再現可能 |
| 実現性 | PASS | gh / jq / rg のみで完結。コード変更ゼロ。30 日 gate / failure_rate 計算が定量化済 |
| 整合性 | PASS | 不変条件 1〜7 影響なし。aiworkflow-requirements references 構造と整合 |
| 運用性 | PASS | redaction 必須前処理 / 90 日 retention 失効回避 ASAP 着手 / failure_rate 2 分岐がすべて機械判定可能 |

---

## DoD（Definition of Done / Phase 2）

- [ ] 4 軸（集計手順 / redaction / references 追記構造 / 次アクション判定）が設計確定
- [ ] trade-off 表 4 件（limit / 保存先 / changelog 先 / failure_rate 定義）が base case 確定
- [ ] 出力契約（後続 Phase 入力）が 5 成果物で確定
- [ ] redaction grep の機微情報パターン 4 種が必須前処理として固定
- [ ] failure_rate 2 分岐（`< 10%` / `>= 10%`）の判定式と起票テンプレが確定
- [ ] 4 条件評価が全 PASS で根拠付き
- [ ] 不変条件 1〜7 影響なしを再確認

---

## 次 Phase への引き渡し

- 次 Phase: 3（設計レビューゲート）
- 引き継ぎ事項:
  - 4 軸設計の base case 確定状態
  - trade-off 4 件の判定根拠
  - 出力契約 5 成果物（raw JSON / 集計表 / diff / changelog / 起票）
  - redaction 4 パターン必須・追加余地は Phase 6
  - failure_rate 計算式（cancelled / action_required は除外）
- ブロック条件:
  - 4 観点（責務 / redaction 網羅性 / 30 日 window 算出 / 起票しきい値根拠）のいずれかで MAJOR
  - AC-1〜AC-11 が `index.md` と乖離
  - Issue #497 が再 OPEN されている

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/index.md` | AC / scope 正本 |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 1-13 / Phase 12 strict 7 files 準拠 |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | skill references 同期準拠 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| Phase spec | 本ファイル | 本 Phase の実行可能仕様 |
| outputs | `outputs/phase-XX/` | 実行時に生成する Phase evidence / summary |

## 完了条件

- [ ] 本 Phase の目的、実行タスク、成果物、次 Phase への引き渡しが矛盾なく記録されている
- [ ] docs-only / NON_VISUAL / Issue #497 CLOSED 維持の境界が崩れていない
- [ ] 必要な参照資料と evidence path が実在パスで記録されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として `gh run list` raw JSON の `jq empty`、redaction grep、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
