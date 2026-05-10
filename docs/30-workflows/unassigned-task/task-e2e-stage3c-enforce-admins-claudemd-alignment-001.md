# task-e2e-stage3c-enforce-admins-claudemd-alignment-001: branch protection `enforce_admins` 期待値 vs 実値の drift 解消 + governance 文書整合

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-e2e-stage3c-enforce-admins-claudemd-alignment-001 |
| タスク名 | `enforce_admins` の CLAUDE.md governance 文言（期待 `true`）と GitHub branch protection 実値の drift を解消し、両者を一意に整合させる |
| 分類 | governance / 文書整合 / branch protection 期待値正本化 |
| 対象機能 | CLAUDE.md `## ブランチ戦略` / `## Governance / CODEOWNERS` ↔ `gh api repos/.../branches/{dev,main}/protection` の `enforce_admins.enabled` |
| 優先度 | MEDIUM |
| 見積もり規模 | 小〜中規模 |
| ステータス | 未実施 (proposed) |
| 親タスク | e2e-quality-uplift-stage-3-impl |
| サブタスク識別子 | Stage 3 サブタスク 3c の派生（governance alignment レイヤ） |
| taskType | governance-alignment |
| visualEvidence | NON_VISUAL |
| 発見日 | 2026-05-09 |
| 発見元 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/phase-13.md §5 残課題引き継ぎ` / `phase-11.md §3 §6` |
| 関連 historical | `task-e2e-stage3c-branch-protection-contexts-001`（3c 仕様レイヤ）/ `task-e2e-stage3c-runtime-gh-api-put-execution-001`（3c runtime 実行レイヤ） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/phase-13.md §5` に以下の残課題が引き継がれている。

> | 残課題 | 取扱い |
> |--------|--------|
> | `enforce_admins` 乖離（CLAUDE.md 期待 `true` vs 実値） | Phase 12 §2 O-2 採用時は別 issue 起票（タイトル例: `governance: align dev/main enforce_admins=true with CLAUDE.md`） |

CLAUDE.md `## ブランチ戦略` 節は次のように定義している。

> 品質保証は CI（`required_status_checks`）/ 線形履歴（`required_linear_history`）/ 会話解決必須化（`required_conversation_resolution`）/ force-push & 削除禁止 で担保する。
> GitHub 側の branch protection 実値を正本とし、CLAUDE.md は運用参照として扱う。UT-GOV-001 適用時は `gh api repos/{owner}/{repo}/branches/dev/protection` と `gh api repos/{owner}/{repo}/branches/main/protection` を個別に実行し、`grep` で `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` の drift がないことを確認する。

すなわち、CLAUDE.md は **`enforce_admins=true` を期待値として明示**しているが、GitHub branch protection の実値が `enforce_admins.enabled=false`（または historical な経緯で異なる値）になっている可能性が 3c phase-13 で示唆されている。3c runtime（pre snapshot 取得時）で実値が確定する。

### 1.2 問題点・課題

- CLAUDE.md governance 文言と GitHub 実値が乖離していると、UT-GOV-001 系 drift check が「本来 PASS すべき drift を fail と誤認」または「本来 fail すべき drift を見逃す」事態を招く
- solo dev 運用で `enforce_admins=true` を有効化すると、自分自身の hotfix push にも `required_status_checks` 等が課される。緊急対応時に admin escape できなくなる運用リスクと、governance 一貫性の trade-off が存在する
- CLAUDE.md は「**GitHub 側の branch protection 実値を正本とし、CLAUDE.md は運用参照として扱う**」と明示しているため、両者乖離時は原則 CLAUDE.md を実値に合わせる方向が正本ルール
- 一方で「期待値文言として `enforce_admins=true` を維持し、drift 検出 → 実値を期待値に合わせる」方向も成立する。**整合判断**そのものが本タスクの責務

### 1.3 放置した場合の影響

- 3c runtime evidence で `enforce_admins.enabled` が pre/post で `false`（または `true` 以外）と記録されると、CLAUDE.md governance 期待値と恒常的に矛盾する
- 後続 governance タスク（UT-GOV-002 / UT-GOV-003 等）が CLAUDE.md 文言を読み取って drift check を組み立てる際、誤った期待値で gate を組んでしまう
- 親 Phase 13 統合 PR の本文に「governance 期待値乖離あり」のまま merge すると、後日 `governance: align ...` issue を起票しないと長期残置する

---

## 2. 何を達成するか（What）

### 2.1 目的

3c runtime で確定した `enforce_admins.enabled` の実値を踏まえ、以下のいずれかを選択して整合させる。

- **方向 A**: 実値を正本として CLAUDE.md `## ブランチ戦略` / `## Governance / CODEOWNERS` の `enforce_admins=true` 文言を実値に合わせる（例: 実値が `false` なら CLAUDE.md を `false` に書換え、判断根拠を併記）
- **方向 B**: CLAUDE.md 期待値を正本として GitHub 実値を `gh api -X PUT` で `enforce_admins=true` に揃える（solo dev 運用上の影響を許容する判断を併せて記録）

判断は **CLAUDE.md「GitHub 側の branch protection 実値を正本とし、CLAUDE.md は運用参照」**という既存ルールに従い、原則 **方向 A**（実値正本化）を第 1 候補とするが、solo dev policy としての governance 強度を引き上げたい場合に方向 B を採る。

### 2.2 最終ゴール（AC）

- **AC-AL-01**: 3c runtime evidence (`outputs/phase-11/branch-protection-{dev,main}-{pre,post}.json`) の `enforce_admins.enabled` 実値が確定し、本タスクの判断ログ（後述 §2.5 成果物）に記録されている
- **AC-AL-02**: 方向 A / B のいずれを採用したかが本タスクの commit message + PR 本文 + governance 整合ログで明示されている
- **AC-AL-03 (方向 A 採用時)**: CLAUDE.md `## ブランチ戦略` / `## Governance / CODEOWNERS` の `enforce_admins=true` 期待値文言が実値と一致する文言に更新されている。判断根拠（solo dev 運用上の trade-off / 既存ルール「実値正本化」）が同一節または注釈に併記されている
- **AC-AL-04 (方向 B 採用時)**: `gh api -X PUT` で `dev` / `main` の `enforce_admins.enabled=true` が実 mutation 実行され、post snapshot で確認されている。CLAUDE.md 文言は変更しない
- **AC-AL-05**: 方向 A / B いずれの場合も、`required_pull_request_reviews=null` / `lock_branch=false` / `required_linear_history=true` 等 5 項目の不変条件は drift していない

### 2.3 検証エビデンス

- 3c runtime の `branch-protection-{dev,main}-pre.json` の `enforce_admins.enabled` 値（pre 実値）
- 本タスクで生成する `outputs/phase-11/governance-alignment-decision.md`（方向 A / B のどちらを採用したかの判断記録）
- 方向 A 採用時: CLAUDE.md の diff（commit hash / 変更行）
- 方向 B 採用時: 別途 `enforce_admins=true` PUT 実行の post snapshot

### 2.4 スコープ

#### 含むもの

- 3c runtime evidence の `enforce_admins.enabled` 実値読み取り
- 方向 A / B の判断ログ作成（`governance-alignment-decision.md`）
- 方向 A 採用時: CLAUDE.md 該当節（`## ブランチ戦略` 引用ブロック / `## Governance / CODEOWNERS` 注釈）の文言更新
- 方向 B 採用時: `gh api -X PUT` で `enforce_admins=true` 適用（dev / main 個別、ユーザー明示承認 gate）
- 不変条件 5 項目（reviews=null / lock=false / required_linear_history=true / allow_force_pushes=false / allow_deletions=false）の drift 検証

#### 含まないもの

- `required_status_checks.contexts` の追加（`task-e2e-stage3c-runtime-gh-api-put-execution-001` の責務）
- 3a / 3b workflow 自体の実装
- merge queue 導入 / ruleset 移行
- レビュアー必須化（`require_code_owner_reviews` 有効化など、CLAUDE.md solo 運用ポリシーで明示的に禁止）

### 2.5 成果物

| path | 種別 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/outputs/phase-11/governance-alignment-decision.md` | 判断ログ | 方向 A / B のいずれを採用したか・判断根拠・実値 / 期待値・参照 evidence |
| 方向 A 採用時: `CLAUDE.md` | governance 正本 | `## ブランチ戦略` / `## Governance` 節の `enforce_admins` 期待値文言更新 + 注釈 |
| 方向 B 採用時: `outputs/phase-11/branch-protection-{dev,main}-enforce-admins-post.json` | evidence | `enforce_admins=true` 適用後 fresh GET |
| 方向 B 採用時: `outputs/phase-11/governance-alignment-put-execution.log` | log | PUT 実行ログ + drift 検証結果 |

---

## 3. どのように実行するか（How）

### 3.1 前提条件（着手ゲート）

| 条件 | 理由 |
| --- | --- |
| `task-e2e-stage3c-runtime-gh-api-put-execution-001` が完了済み | pre snapshot で `enforce_admins.enabled` 実値が確定している必要 |
| 3c runtime evidence (`branch-protection-{dev,main}-pre.json` / `-post.json`) が canonical path にコミット済み | 判断材料として参照 |
| 方向 B 採用時のみ: ユーザー明示承認 | `gh api -X PUT` の実 mutation を伴うため UT-GOV-001 / Issue #554 と同一 user-gated 扱い |
| `gh auth status` で repo admin scope（方向 B 採用時のみ） | `enforce_admins` 変更は admin 権限要 |

### 3.2 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| depends-on | `task-e2e-stage3c-runtime-gh-api-put-execution-001` | pre/post snapshot から `enforce_admins.enabled` 実値を読み取る |
| 関連 | `task-e2e-stage3c-branch-protection-contexts-001` | 3c 仕様レイヤ（不変条件根拠） |
| 関連 | UT-GOV-001 系 | drift check 期待値の正本表 |
| blocks | 親 Phase 13 統合 PR の close（最終的な governance 一貫性） | — |

### 3.3 推奨アプローチ

```
1. 3c runtime evidence (pre/post JSON) を取得・読み取り
2. jq で .enforce_admins.enabled の dev / main 実値を抽出
3. CLAUDE.md 期待値（true）と比較
   ├── 一致 → 本タスクは noop で close（判断ログだけ記録）
   ├── 乖離（実値 false） → 方向 A / B を判断
   │     ├── 方向 A: CLAUDE.md を実値に合わせて文言更新（判断根拠併記）
   │     └── 方向 B: gh api -X PUT で実値を true に揃える（ユーザー明示承認後）
4. governance-alignment-decision.md 生成（判断・根拠・evidence 参照）
5. 方向 A 採用時: CLAUDE.md commit
6. 方向 B 採用時: PUT 実行 + post snapshot 取得 + drift 検証 + commit
7. 親 Phase 13 統合 PR の本文に判断結果を反映
```

### 3.4 実値読み取りコマンド例

```bash
SPEC_DIR=docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts
EV=$SPEC_DIR/outputs/phase-11

# 実値抽出
DEV_EA=$(jq -r '.enforce_admins.enabled' $EV/branch-protection-dev-pre.json)
MAIN_EA=$(jq -r '.enforce_admins.enabled' $EV/branch-protection-main-pre.json)
echo "dev.enforce_admins.enabled  = $DEV_EA"
echo "main.enforce_admins.enabled = $MAIN_EA"

# CLAUDE.md 期待値
echo "CLAUDE.md expected         = true"
```

### 3.5 方向 A（実値正本化）の CLAUDE.md 編集箇所

CLAUDE.md `## ブランチ戦略` 節の以下文言が対象:

> UT-GOV-001 適用時は `gh api repos/{owner}/{repo}/branches/dev/protection` と `gh api repos/{owner}/{repo}/branches/main/protection` を個別に実行し、`grep` で `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` の drift がないことを確認する。

実値が `enforce_admins=false` の場合、`enforce_admins=false` に書換え、注釈として「solo dev 運用での緊急 hotfix push 経路確保のため admin escape を許容」「CLAUDE.md 既存ルール『実値正本化』に従う」を併記する。

### 3.6 方向 B（実値を期待値に合わせる）の PUT コマンド例

```bash
# 【ユーザー明示承認後のみ】
SPEC_DIR=docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts
EV=$SPEC_DIR/outputs/phase-11

# pre 値継承で enforce_admins だけ true に書換える PUT body 組み立て
jq '{
  required_status_checks: .required_status_checks,
  enforce_admins: true,
  required_pull_request_reviews: null,
  restrictions: null,
  required_linear_history: .required_linear_history.enabled,
  allow_force_pushes: .allow_force_pushes.enabled,
  allow_deletions: .allow_deletions.enabled,
  block_creations: .block_creations.enabled,
  required_conversation_resolution: .required_conversation_resolution.enabled,
  lock_branch: .lock_branch.enabled,
  allow_fork_syncing: .allow_fork_syncing.enabled
}' $EV/branch-protection-dev-pre.json > /tmp/dev-enforce-admins-put.json

gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --input /tmp/dev-enforce-admins-put.json

gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > $EV/branch-protection-dev-enforce-admins-post.json

# main も同様
```

### 3.7 rollback 手順（方向 B 採用時のみ）

1. pre JSON を入力に再 PUT で `enforce_admins` を pre 値（false）に戻す
2. fresh GET で `enforce_admins.enabled` が pre と一致することを確認
3. `governance-alignment-decision.md` に rollback 実施時刻と原因を記録

---

## 4. 苦戦箇所【記入必須】

### 4.1 solo dev 運用での `enforce_admins=true` の運用リスク

`enforce_admins=true` を有効化すると、自分自身の hotfix push にも `required_status_checks` 5 件 / `required_conversation_resolution=true` / `required_linear_history=true` が課される。CI 障害時や緊急パッチで全 gate が green にならない状況で push が一切通らなくなり、結果として `enforce_admins=false` への一時 disable → push → re-enable という二重 PUT が必要になる。solo dev で運用できる現実的な強度かを判断材料に含める。

### 4.2 CLAUDE.md「実値正本」ルールと governance 強度の trade-off

CLAUDE.md は明示的に「**GitHub 側の branch protection 実値を正本とし、CLAUDE.md は運用参照**」と定めており、このルールに厳密に従えば方向 A（CLAUDE.md を実値に合わせる）が標準。しかし `enforce_admins=true` という governance 強度の期待値そのものが「solo dev であっても admin escape を許さない」という意思表示として CLAUDE.md に書かれているため、これを `false` に書換える行為は governance 強度の格下げを意味する。判断は単純な「実値合わせ」では済まず、**運用ニーズ vs governance 一貫性**の trade-off。判断ログ `governance-alignment-decision.md` に意思決定根拠を必ず併記する。

### 4.3 `gh api repos/.../branches/.../protection` の `enforce_admins` 表現差

REST API のレスポンス側は `enforce_admins.enabled: true/false` の nested オブジェクト形式だが、PUT body 側では `enforce_admins: true/false` の直接 boolean 表現を取る。jq テンプレで body 組み立てる際に `.enforce_admins.enabled` を取り出して直接 boolean として渡す必要があり、レスポンス構造をそのまま流用すると 422 で fail する。3c phase-5.md / phase-11.md の heredoc を必ず参照する。

### 4.4 dev / main の片側適用と段階適用

方向 B 採用時、dev のみ先行で `enforce_admins=true` 化し、自分の運用への影響を 1-2 営業日観察した上で main へ展開する段階適用が推奨。両ブランチ同時適用は影響半径が倍。

### 4.5 親 Phase 13 統合 PR との分離

3c phase-13.md §5 が「Phase 12 §2 O-2 採用時は **別 issue 起票**」と明記しており、本タスクは親 Phase 13 統合 PR とは別 commit / 別 PR で扱うのが原則。親 Phase 13 統合 PR は 3a / 3b / 3c contexts 5 件化までを 1 単位とし、本タスクはその後段で別 PR 化する。

### 4.6 判断ログのコミット位置

`governance-alignment-decision.md` の canonical path は 3c spec の `outputs/phase-11/` 配下。親 `e2e-quality-uplift-stage-3` 側ではないことに注意（`-impl` サフィックスの違い）。

### 4.7 既存 UT-GOV-001 系 drift check との整合

本タスクで CLAUDE.md `enforce_admins` 期待値文言を変更すると、既存の UT-GOV-001 drift check スクリプト（`grep` で `enforce_admins=true` を期待）が即座に false negative になる。drift check ドキュメントが追加 grep を持っているなら同時に更新し、両者の同期を 1 PR に閉じる。

### 4.8 noop（実値 == 期待値）の場合の扱い

3c runtime で実値が `enforce_admins.enabled=true` と既に揃っている場合、本タスクは「判断ログだけ記録して close」する noop 完了とする。判断ログには「現状期待値と実値が一致しているため alignment 不要」と明記し、後日再 drift 時に参照可能にする。

---

## 5. 影響範囲

| パス | 変更内容 |
| --- | --- |
| `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/outputs/phase-11/governance-alignment-decision.md` | 新規（判断ログ） |
| 方向 A 採用時: `CLAUDE.md` `## ブランチ戦略` / `## Governance / CODEOWNERS` 節 | 期待値文言更新 + 注釈 |
| 方向 A 採用時: 関連 governance ドキュメント（UT-GOV-001 drift check 等） | 期待値同期 |
| 方向 B 採用時: GitHub repo settings の `dev` / `main` `enforce_admins.enabled` | `false` → `true` |
| 方向 B 採用時: `outputs/phase-11/branch-protection-{dev,main}-enforce-admins-post.json` | 新規 evidence |
| 親 Phase 13 統合 PR の本文（後段の独立 PR / Issue で参照） | 判断結果反映 |

---

## 6. 推奨タスクタイプ

- taskType: **governance-alignment**（コード変更ではなく governance 文書 / 期待値 / 実値の整合判断と書換え）
- visualEvidence: **NON_VISUAL**（UI 変更なし）
- coverageTier: **standard**（親 workflow 継承）

---

## 7. 不変条件

| 項目 | 値 |
| --- | --- |
| `required_pull_request_reviews` | `null` を維持（solo 運用ポリシー） |
| `lock_branch.enabled` | `false` を維持 |
| `required_linear_history.enabled` | `true` を維持 |
| `allow_force_pushes.enabled` | `false` を維持 |
| `allow_deletions.enabled` | `false` を維持 |
| `required_conversation_resolution.enabled` | `true` を維持 |
| `required_status_checks.strict` | `false` を維持 |
| `required_status_checks.contexts` | 5 件構成を維持（本タスクで変更しない） |
| 正本ソース | GitHub branch protection 実値が正本。CLAUDE.md は運用参照（CLAUDE.md 既存ルール） |
| 整合判断記録 | `governance-alignment-decision.md` に方向 A / B いずれを採ったかと判断根拠を必ず明記 |
| 方向 B 採用時の PUT 実行 | ユーザー明示承認後のみ。read-only GET / 判断ログ作成は事前可 |

---

## 8. 完了条件チェックリスト

- [ ] 3c runtime evidence (`pre/post JSON`) が canonical path にコミット済み
- [ ] `enforce_admins.enabled` の dev / main 実値を抽出（`jq -r '.enforce_admins.enabled'`）
- [ ] CLAUDE.md 期待値（`true`）と実値の一致 / 乖離を判定
- [ ] 判定が「一致」: 判断ログに noop として記録し close
- [ ] 判定が「乖離」: 方向 A / B を選択し、判断根拠を `governance-alignment-decision.md` に記録
- [ ] 方向 A 採用時: CLAUDE.md `## ブランチ戦略` / `## Governance` 節の文言更新 + 注釈追加
- [ ] 方向 A 採用時: 関連 governance ドキュメント（UT-GOV-001 drift check 等）の期待値同期
- [ ] 方向 B 採用時: ユーザー明示承認取得済み
- [ ] 方向 B 採用時: `gh api -X PUT` 成功 + post snapshot で `enforce_admins.enabled=true` 確認
- [ ] 不変条件 5 項目（reviews=null / lock=false / required_linear_history=true / allow_force_pushes=false / allow_deletions=false）の drift = 0
- [ ] 判断結果が親 Phase 13 統合 PR の本文 / 後段独立 PR の本文に反映
- [ ] commit message に方向 A / B の選択結果を明記

---

## 9. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 仕様根拠 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/phase-13.md §5` | 残課題引き継ぎ（issue 起票示唆） |
| 仕様根拠 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/phase-11.md §3 §6` | evidence.md テンプレ §6 残課題欄・突合方針 |
| 仕様根拠 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/phase-11.md §5` | Phase 12 突合の引き継ぎ方針 |
| governance 正本 | `CLAUDE.md` `## ブランチ戦略` / `## Governance / CODEOWNERS` | 期待値文言・「実値正本」ルール |
| 関連 historical | `task-e2e-stage3c-branch-protection-contexts-001` | 3c 仕様レイヤ |
| 依存 | `task-e2e-stage3c-runtime-gh-api-put-execution-001` | 実値確定の前提 |
| 関連運用 | UT-GOV-001 系 drift check | 期待値同期対象 |
| 補助 | `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection` | 実値読み取り |

---

## 10. 備考

- 本タスクは「governance 一貫性」という抽象目的を扱うため、コード変更タスクとは異なり **判断記録の質**が成果物の中心になる。`governance-alignment-decision.md` は将来の re-alignment 時に意思決定の追跡可能性を提供する。
- 方向 A / B の選択は solo dev 運用フェーズの状況依存。MVP 期は方向 A（運用優先）、運用安定後は方向 B（governance 強度引き上げ）に切替える 2 段階移行も合理的。
- スコープに `required_status_checks.contexts` を含めない（runtime タスクの責務）。`enforce_admins` 以外の項目で同型乖離が発生した場合、本タスクをテンプレとして派生タスクを起こす。
