# 実装ガイド — UT-GOV-001 GitHub branch protection apply / rollback payload 正規化

> 2 パート構成。Part 1 = 中学生レベル概念説明（日常の例え話）/ Part 2 = 開発者向け技術詳細（REST API / adapter / rollback 経路）。
> 本ガイドは **タスク仕様書** であり、実 PUT の実走は Phase 13 ユーザー明示承認後に別オペレーションで行う。

---

## Part 1: 中学生レベル概念説明（日常の例え話）

### なぜ必要か

大事な場所に入るルールが曖昧だと、急いでいる時ほど間違った変更が入りやすくなる。GitHub の `dev` と `main` も同じで、テストを通してから入れる、過去を書き換えない、困った時に戻せる、という約束を先に決めておく必要がある。

### 何をするか

今回作った仕様は、GitHub のブランチ保護を安全にかけるための手順書である。いきなり本物の設定を変えず、今の状態を保存し、新しい設定書を作り、差分を見て、戻す練習までしてから適用する。

### 今回作ったもの

| 作ったもの | 役割 |
| --- | --- |
| 実装ガイド | branch protection の考え方と実行手順を説明する |
| snapshot / payload / rollback の分離ルール | 今の状態、新しい設定、戻す設定を混ぜない |
| Phase 11 NON_VISUAL evidence | 画面がないタスクでスクリーンショット不要な理由を残す |
| Phase 13 承認ゲート | 本物の GitHub 設定変更をユーザー承認後だけにする |

### 1-1. branch protection は「大事なノートに勝手に書き込めないようにする鍵」

クラスの連絡帳に誰でも勝手に書けたら、嘘の連絡が混じって大事故になる。GitHub の `main` ブランチ（本番に直結する大事なノート）も同じで、誰でも勝手に書き込めると本番が壊れる。

**branch protection** は「このノートに書き込むには、こういう条件をクリアしないとダメ」と GitHub にお願いする鍵のしくみ。たとえば「テストに合格してから書け」「PR を作ってから書け」「force-push（過去を書き換える）禁止」などの条件を 1 つずつ設定する。

### 1-2. `required_status_checks` は「体育館に入る前の上履きチェック」

体育の授業で上履きを履かずに体育館に入ると床が傷む。だから「上履きチェック係」が入口に立っている。

GitHub では、PR を main に入れる前に **CI（自動テスト）** が走る。CI が green（合格）にならない PR を main に入れると本番が壊れるので、`required_status_checks` という設定で「この CI 結果が green じゃなきゃ入れちゃダメ」と決める。これが「上履きチェック」。

ただし注意点が 1 つ。**「これから作る予定の CI 名」を上履きチェックリストに入れちゃうと、永遠に green にならず、誰も入れなくなる**。だから「実際に存在する CI 名」だけを入れる必要があり、これは別タスク（UT-GOV-004）で同期する。本タスクはそれが終わってから走る。

### 1-3. `enforce_admins=true` は「先生でも例外なく上履きチェック」

普通は先生（GitHub では admin）はスルーできる。でも `enforce_admins=true` にすると **先生も上履きチェックを通らないと体育館に入れない**。安全だけど、先生が緊急で入れないと困ることもある。

solo 開発（一人で全部やる）だと、自分が「先生」役。CI が壊れて green にならなくなった瞬間に、自分でも main に修正を入れられなくなる詰み状態が起きうる。だから「鍵を一時的に外す抜け道」を事前に作っておく：

- 抜け道 A: 「先生のチェック」だけを一時的に消す（`enforce_admins` を DELETE）
- 抜け道 B: 「先生のチェックを false にした設定書」を事前に用意し、必要な時に切り替える

抜け道は **使う前から準備しておく**。慌ててから作ると間違える。

### 1-4. snapshot は「今の鍵の写真」、payload は「新しい鍵の設定書」

GitHub に「今のノートの鍵はどうなってる？」と聞くと、写真をくれる（**snapshot**）。これから「鍵をこうしたい」と渡すのは設定書（**payload**）。

ここに罠がある。**写真と設定書は形が違う**。たとえば写真には「鍵 A: ON、鍵 B: OFF」と書いてあるが、設定書では「ONの鍵リスト: [A]、OFFの鍵リスト: [B]」のように書く。写真をそのまま設定書として渡すと「形が違う」と GitHub に弾かれる（HTTP 422 エラー）。

そこで **「形を整える係（adapter）」** を間に置く。写真を adapter に通すと、ちゃんとした設定書に変換してくれる。本タスクではこの adapter を jq というツールで作る。

### 1-5. dev と main は別々の鍵

`dev`（試し打ちの場所）と `main`（本番）は別のブランチなので、鍵も別々にかける。**1 つのスクリプトで両方一気にやろうとすると、片方の設定ミスで両方詰む**。だから設定書ファイル・写真ファイル・実行コマンドを **branch ごとに 1 セットずつ** 用意する（`{branch}` サフィックスで分離する）。

### 1-6. dry-run は「鍵をかける前に『こう変わるよ』を見せるリハーサル」

いきなり鍵をかけて間違ってたら困るので、まず **写真（snapshot）** と **新しい設定書（payload）** を並べて差分を見る。「ここが OFF から ON に変わる、ここが追加される、ここが削除される」を確認してから本番。これが **dry-run**。

### 1-7. rollback は「鍵を元に戻す」

新しい鍵をかけたあとで「やっぱり前の方がよかった」と思ったら、**写真を adapter に通して『元に戻す設定書（rollback payload）』** を作っておけば、それを渡すだけで元に戻せる。これも **使う前から準備** しておく。

### Part 1 専門用語セルフチェック

| 専門用語 | 日常語 |
| --- | --- |
| branch protection | 大事なノートに勝手に書き込めないようにする鍵 |
| required_status_checks | 体育館に入る前の上履きチェック |
| enforce_admins | 先生でも例外なくチェック |
| snapshot | 今の鍵の写真（GET 形 / そのまま PUT すると弾かれる） |
| payload | 新しい鍵の設定書（PUT 形） |
| adapter | 写真を設定書に変換する形整え係 |
| dry-run | 鍵をかける前のリハーサル |
| rollback | 鍵を元に戻す |
| HTTP 422 | 「形が違う」と GitHub に弾かれるエラー |
| solo 運用 | 一人で全部やる（先生役と生徒役を兼ねる） |

---

## Part 2: 開発者技術詳細（REST API / adapter / rollback 経路）

### 2-1. GitHub REST API schema

エンドポイント:

```
PUT /repos/{owner}/{repo}/branches/{branch}/protection
GET /repos/{owner}/{repo}/branches/{branch}/protection
```

scope: `administration:write`（既存 `gh auth login` の OAuth トークン流用）

#### field マッピング表（Phase 2 §4.1 を再掲）

| field | GET 形 | PUT 形 | 備考 |
| --- | --- | --- | --- |
| `required_status_checks` | `{strict, contexts[]}` | `{strict, contexts[]}` | UT-GOV-004 積集合のみ。未完了時は `[]` |
| `enforce_admins` | `{enabled, url}` | `bool` | `.enabled` 抽出 |
| `required_pull_request_reviews` | object/absent | `null` | solo 運用固定（CLAUDE.md 整合） |
| `restrictions` | `{users:[{login}], teams:[{slug}], apps:[{slug}]}` or `null` | `{users:[login...], teams:[slug...], apps:[slug...]}` or `null` | login/slug 配列に flatten |
| `required_linear_history` | `{enabled}` | `bool`（true 固定） | |
| `allow_force_pushes` | `{enabled}` | `bool`（false 固定） | |
| `allow_deletions` | `{enabled}` | `bool`（false 固定） | |
| `required_conversation_resolution` | `{enabled}` | `bool`（true 固定） | |
| `lock_branch` | `{enabled}` | `bool`（**false 固定**、§8.3） | |
| `allow_fork_syncing` | `{enabled}` | `bool` | |
| `block_creations` | `{enabled}` | `bool`（任意） | |

### 2-2. adapter 擬似コード（jq）

```bash
# snapshot（GET 形）→ rollback payload（PUT 形）変換
jq '{
  required_status_checks: (.required_status_checks // null),
  enforce_admins: (.enforce_admins.enabled // false),
  required_pull_request_reviews: null,
  restrictions: (
    if .restrictions == null then null
    else {
      users: [.restrictions.users[].login],
      teams: [.restrictions.teams[].slug],
      apps:  [.restrictions.apps[].slug]
    } end),
  required_linear_history: (.required_linear_history.enabled // true),
  allow_force_pushes: (.allow_force_pushes.enabled // false),
  allow_deletions: (.allow_deletions.enabled // false),
  required_conversation_resolution: (.required_conversation_resolution.enabled // true),
  lock_branch: false,
  allow_fork_syncing: (.allow_fork_syncing.enabled // false)
}' snapshot-{branch}.json > rollback-{branch}.json
```

> 草案 → payload は adapter ではなく `design.md §2`（親タスク `task-github-governance-branch-protection`）を写経した上で UT-GOV-004 同期済 contexts を埋め込む。

### 2-2-1. TypeScript 型定義（実装時の契約）

```ts
type BranchName = "dev" | "main";

interface BranchProtectionSnapshot {
  required_status_checks?: {
    strict: boolean;
    contexts: string[];
  } | null;
  enforce_admins?: {
    enabled: boolean;
  } | null;
  required_pull_request_reviews?: unknown | null;
  restrictions?: {
    users?: Array<{ login: string }>;
    teams?: Array<{ slug: string }>;
    apps?: Array<{ slug: string }>;
  } | null;
  required_linear_history?: { enabled: boolean } | null;
  allow_force_pushes?: { enabled: boolean } | null;
  allow_deletions?: { enabled: boolean } | null;
  required_conversation_resolution?: { enabled: boolean } | null;
  lock_branch?: { enabled: boolean } | null;
  allow_fork_syncing?: { enabled: boolean } | null;
}

interface BranchProtectionPutPayload {
  required_status_checks: {
    strict: boolean;
    contexts: string[];
  } | null;
  enforce_admins: boolean;
  required_pull_request_reviews: null;
  restrictions: {
    users: string[];
    teams: string[];
    apps: string[];
  } | null;
  required_linear_history: boolean;
  allow_force_pushes: boolean;
  allow_deletions: boolean;
  required_conversation_resolution: boolean;
  lock_branch: false;
  allow_fork_syncing: boolean;
}
```

### APIシグネチャ

```ts
function normalizeSnapshotForPut(
  branch: BranchName,
  snapshot: BranchProtectionSnapshot,
  contexts: string[]
): BranchProtectionPutPayload;

function buildApplyCommand(branch: BranchName, payloadPath: string): string;
```

### 使用例

```ts
const payload = normalizeSnapshotForPut("main", snapshot, syncedContexts);
assert(payload.required_pull_request_reviews === null);
assert(payload.lock_branch === false);
```

実運用では TypeScript 実装ではなく `jq` と `gh api` を MVP 経路にする。上記の型と関数名は、将来 Octokit / IaC 化へ移行する際の契約として扱う。

### エラーハンドリング

| ケース | 検出 | 対応 |
| --- | --- | --- |
| GitHub API 422 | PUT 応答 status / body | GET 形を直接 PUT していないか確認し、adapter 出力を再生成 |
| `restrictions.users` 等が欠損 | jq 変換時 | `(.restrictions.users // [])[]` のように空配列へ倒す |
| UT-GOV-004 未完了 | contexts 実在確認で未同期 | `contexts=[]` の 2 段階適用に切替し、後追い再 PUT は未タスク化済み |
| 権限不足 | `gh auth status` / 403 | `administration:write` scope を持つ認証へ切替 |
| eventual consistency | PUT 後 GET 差分 | retry / sleep を apply-runbook に記録し、再 GET で確認 |
| `enforce_admins=true` で詰む | CI failure + admin bypass 不可 | `enforce_admins` DELETE または `enforce_admins=false` rollback payload を実行 |

### エッジケース

| ケース | 扱い |
| --- | --- |
| `contexts=[]` 2 段階適用 | 初回適用は Phase 13 内、UT-GOV-004 完了後の再 PUT は未タスクで追跡 |
| dev PUT 成功 / main PUT 失敗 | bulk 化しないため main のみ rollback / retry する |
| GitHub API schema drift | Phase 2 の field 表と GET keys を突合し、未知 field は PUT へ流さない |
| rollback rehearsal 後の再適用失敗 | snapshot 由来 rollback payload を正本に戻し、applied JSON を保存しない |

### 設定項目と定数一覧

| 名前 | 値 | 用途 |
| --- | --- | --- |
| `TARGET_BRANCHES` | `["dev", "main"]` | bulk PUT 禁止。branch ごとに独立実行 |
| `LOCK_BRANCH` | `false` | freeze runbook 未整備のため固定 |
| `REQUIRED_PULL_REQUEST_REVIEWS` | `null` | solo 運用のため固定 |
| `ENFORCE_ADMINS` | `true` | admin も保護対象。rollback 経路を事前準備 |
| `STATUS_CONTEXT_SOURCE` | UT-GOV-004 output | 実在 job/check-run context のみ採用 |
| `SNAPSHOT_PATTERN` | `branch-protection-snapshot-{branch}.json` | GET 応答保存 |
| `PAYLOAD_PATTERN` | `branch-protection-payload-{branch}.json` | PUT 入力 |
| `ROLLBACK_PATTERN` | `branch-protection-rollback-{branch}.json` | rollback PUT 入力 |
| `APPLIED_PATTERN` | `branch-protection-applied-{branch}.json` | PUT 応答保存 |

### テスト構成

| レイヤ | 内容 |
| --- | --- |
| static docs validation | `validate-phase-output.js` と `validate-phase12-implementation-guide.js` で Phase 12 成果物を検証 |
| dry-run | snapshot と payload の intended diff を確認 |
| apply smoke | dev / main 独立 PUT の HTTP 200 と applied JSON 保存を確認 |
| rollback rehearsal | rollback payload で戻してから payload で再適用 |
| drift check | `gh api` GET と CLAUDE.md grep で GitHub 実値とのずれを確認 |

### 2-3. 4 ステップ手動 smoke 手順（Phase 11 manual-smoke-log.md と同一）

```bash
# === STEP 0: 前提確認 ===
# UT-GOV-004 completed / 親タスク Phase 13 承認 / gh auth status (administration:write)

# === STEP 1: dry-run プレビュー ===
gh api repos/{owner}/{repo}/branches/dev/protection  > outputs/phase-13/branch-protection-snapshot-dev.json
gh api repos/{owner}/{repo}/branches/main/protection > outputs/phase-13/branch-protection-snapshot-main.json
# adapter で payload / rollback payload 生成
diff <(jq -S . outputs/phase-13/branch-protection-snapshot-dev.json) \
     <(jq -S . outputs/phase-13/branch-protection-payload-dev.json)
diff <(jq -S . outputs/phase-13/branch-protection-snapshot-main.json) \
     <(jq -S . outputs/phase-13/branch-protection-payload-main.json)

# === STEP 2: 実適用（dev / main 独立 PUT、bulk 化禁止）===
gh api repos/{owner}/{repo}/branches/dev/protection  -X PUT \
  --input outputs/phase-13/branch-protection-payload-dev.json \
  > outputs/phase-13/branch-protection-applied-dev.json
gh api repos/{owner}/{repo}/branches/main/protection -X PUT \
  --input outputs/phase-13/branch-protection-payload-main.json \
  > outputs/phase-13/branch-protection-applied-main.json

# === STEP 3: gh api GET で実値確認 ===
gh api repos/{owner}/{repo}/branches/main/protection | jq '.required_pull_request_reviews'  # 期待: null
gh api repos/{owner}/{repo}/branches/main/protection | jq '.required_status_checks.contexts'
gh api repos/{owner}/{repo}/branches/main/protection | jq '.enforce_admins.enabled'           # 期待: true
gh api repos/{owner}/{repo}/branches/main/protection | jq '.lock_branch.enabled'              # 期待: false

# === STEP 4: CLAUDE.md と grep 一致確認 ===
grep -nE "required_pull_request_reviews\s*[:=]?\s*null" CLAUDE.md
grep -nE "required_linear_history|allow_force_pushes|allow_deletions|required_conversation_resolution" CLAUDE.md
```

### 2-4. rollback 3 経路

#### 経路 1: 通常 rollback（事前生成済 rollback payload を PUT）

```bash
gh api repos/{owner}/{repo}/branches/dev/protection  -X PUT --input outputs/phase-13/branch-protection-rollback-dev.json
gh api repos/{owner}/{repo}/branches/main/protection -X PUT --input outputs/phase-13/branch-protection-rollback-main.json
```

#### 経路 2: 緊急 rollback（`enforce_admins=true` で admin 自身 block 詰み、§8.4）

```bash
# 経路 2-A: enforce_admins サブリソースの DELETE
gh api repos/{owner}/{repo}/branches/main/protection/enforce_admins -X DELETE

# 経路 2-B: rollback payload の enforce_admins=false 版を PUT
gh api repos/{owner}/{repo}/branches/main/protection -X PUT --input outputs/phase-13/branch-protection-rollback-main.json
```

担当者: solo 運用のため実行者本人。連絡経路（手元 ssh + GitHub UI 二重）を `apply-runbook.md` に明記。

#### 経路 3: 再適用（rollback リハーサル後に元の payload に戻す）

```bash
gh api repos/{owner}/{repo}/branches/dev/protection  -X PUT --input outputs/phase-13/branch-protection-payload-dev.json
gh api repos/{owner}/{repo}/branches/main/protection -X PUT --input outputs/phase-13/branch-protection-payload-main.json
```

### 2-5. dev / main 別ファイル戦略（bulk 化禁止）

| ファイル | branch | writer | 用途 |
| --- | --- | --- | --- |
| `branch-protection-snapshot-dev.json` | dev | lane 1（GET） | 監査・差分計算（**PUT 不可**） |
| `branch-protection-snapshot-main.json` | main | lane 1（GET） | 同上 |
| `branch-protection-payload-dev.json` | dev | lane 2（adapter） | 本適用 PUT |
| `branch-protection-payload-main.json` | main | lane 2（adapter） | 同上 |
| `branch-protection-rollback-dev.json` | dev | lane 2（adapter） | 緊急時 rollback PUT |
| `branch-protection-rollback-main.json` | main | lane 2（adapter） | 同上 |
| `branch-protection-applied-dev.json` | dev | lane 4（PUT 応答） | 適用結果証跡 |
| `branch-protection-applied-main.json` | main | lane 4（PUT 応答） | 同上 |

PUT も dev / main それぞれ独立 1 回ずつ実行。bulk script で一括化しない。片側の PUT 失敗時、もう片側は影響を受けない。

### 2-6. `lock_branch=false` 固定理由

`lock_branch=true` は全 push を完全停止する強力フラグ。解除手順 / 権限者 / トリガが未定義の状態で有効化すると incident 時に詰む（§8.3）。本タスクでは **`lock_branch=false` を明示固定**。有効化が必要になった場合は freeze runbook と一緒に別タスクで導入する。

### 2-7. UT-GOV-004 完了前提（5 重明記の 5 箇所目）

`required_status_checks.contexts` には UT-GOV-004 で実在 job 名同期済みのもののみを含める。UT-GOV-004 未完了時のフォールバックは以下：

- `contexts=[]` で先行 PUT
- UT-GOV-004 完了後に再 PUT（`contexts` を実在 job 名で埋める）

この 2 段階適用が NO-GO ゲート（Phase 3）と整合する。

### 2-8. ロールバック payload 事前生成

**「使う前から準備しておく」が鉄則**。Phase 13 で snapshot を adapter 通過後、rollback payload を事前生成し `outputs/phase-13/branch-protection-rollback-{dev,main}.json` に保存する。`enforce_admins=false` 最小 patch も同時に用意しておく（緊急 rollback 経路 2-B のため）。

### 2-9. 本ガイドで扱わない事項

- `1Password secret URI` 形式の op シークレット注入（本タスクは Cloudflare Secret 非関与）
- `scripts/cf.sh`（Cloudflare CLI ラッパー）の使用（本タスクは GitHub Token を `gh auth login` 既存流用）
- Terraform / Octokit script への移行（将来 IaC 化フェーズで再評価）
- bulk 化スクリプト（dev / main 独立 PUT 規約に違反するため）

### 2-10. 検証コマンド

```bash
# Part 1 / Part 2 構造確認
rg -n "^## Part [12]" docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/implementation-guide.md

# 1Password secret URI 混入チェック（0 件期待）
rg -n "1Password secret URI" docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/implementation-guide.md \
  || echo "1Password secret URI 混入なし"
```

## 関連

- Phase 2 設計: [../phase-02/main.md](../phase-02/main.md)
- Phase 11 4 ステップ smoke: [../phase-11/manual-smoke-log.md](../phase-11/manual-smoke-log.md)
- Phase 13 実 PUT 手順: [../phase-13/main.md](../phase-13/main.md)（Phase 13 で生成）
- 親仕様: [../../../completed-tasks/UT-GOV-001-github-branch-protection-apply.md](../../../completed-tasks/UT-GOV-001-github-branch-protection-apply.md)
- 草案 design.md: [../../../completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md](../../../completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md)
