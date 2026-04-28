# skill log_usage writer の `LOGS.md` 直書き混入防止 CI guard 追加 - タスク指示書

## メタ情報

```yaml
issue_number: 164
```


## メタ情報

| 項目         | 内容                                                       |
| ------------ | ---------------------------------------------------------- |
| タスクID     | ut-a2-ci-001                                               |
| タスク名     | skill log_usage writer の `LOGS.md` 直書き混入防止 CI guard 追加 |
| 分類         | CI / Governance                                            |
| 対象機能     | `.github/workflows/*.yml`（lint / quality job）            |
| 優先度       | 中                                                         |
| 見積もり規模 | 小規模                                                     |
| ステータス   | 未実施                                                     |
| 発見元       | task-skill-ledger-a2-fragment Phase 12（R-1 / R-2 回帰 guard） |
| 発見日       | 2026-04-28                                                 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

A-2 fragment 化により、すべての skill の `log_usage.js` writer は `LOGS.md` への append から `LOGS/<timestamp>-<branch>-<nonce>.md` fragment 書き込みに切り替え済みである。これにより並列 worktree 実行時の append 競合と AI コンテキスト肥大が解消された。しかし、回帰 guard（writer 経路に `LOGS.md` 直書きが再混入することを CI で検出する仕組み）はスコープ外として切り出され、本タスクで対応する。

### 1.2 問題点・課題

- 現状の CI には writer 経路への `LOGS.md` 直書き再混入を検知する step が存在しない
- 将来の PR で `appendFileSync(LOGS_PATH, ...)` や `const LOGS_PATH = ... LOGS.md` が再導入されても気付けない
- レビュー目視のみでは複数 skill にまたがる writer 改修を漏れなく検査できない

### 1.3 放置した場合の影響

- A-2 fragment 化の不変条件（writer は fragment にしか書かない）が暗黙ルール化し、再混入で並列競合が再発する
- AI コンテキスト肥大を防ぐ前提が崩れ、`LOGS.md` ベースの古い writer が混在する状態に戻る
- 回帰の検出が本番マージ後の事故報告に依存することになる

---

## 2. 何を達成するか（What）

### 2.1 目的

`.github/workflows/*.yml` の lint / quality 系 job に grep step を追加し、`.claude/skills` 配下の `scripts/**` に `LOGS.md` 直書きパターンが含まれていれば CI を fail させる。

### 2.2 最終ゴール

- 既存 lint / quality job に grep step が登録されている
- 検出パターンが `LOGS.md` 直書きおよび `LOGS_PATH` / `logsPath` 定数の再導入を網羅している
- 回帰 PR を意図的に投入したとき CI が fail する（ローカル試験で確認）

### 2.3 スコープ

#### 含むもの

- GitHub Actions workflow への grep step 追加（既存 lint job への追加 or 新規 step）
- 検出パターンの確定: `appendFileSync|writeFileSync\([^\n]*(LOGS\.md|logsPath|LOGS_PATH)|const LOGS_PATH|const logsPath = .*LOGS\.md`
- スコープ: `.claude/skills` 配下の `scripts/**`

#### 含まないもの

- skill 本体の writer 改修（UT-A2-FOLLOW-001 で完了済み）
- CI step 全体の再設計
- `.claude/skills` 以外の repo 全体への適用

### 2.4 成果物

- `.github/workflows/*.yml` の差分（grep step 追加）
- ローカル grep 試験ログ（0 件）
- 違反コード投入時の fail 再現メモ

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- A-2 fragment 化（writer fragment 書き込み切替）が main にマージ済み
- 既存 `.github/workflows/*.yml` の lint / quality job が稼働している

### 3.2 依存タスク

- task-skill-ledger-a2-fragment の Phase 12 完了
- UT-A2-FOLLOW-001（writer 改修）マージ済み

### 3.3 必要な知識

- GitHub Actions workflow の step 構成
- `ripgrep` / POSIX grep の正規表現エスケープ
- skill `log_usage.js` の writer 仕様

### 3.4 推奨アプローチ

既存 lint job に `Check no LOGS.md direct write` step を追加する。`rg` をベースにし、ヒット件数が 0 でないとき `exit 1` する単純構成にする。pattern が肥大化する場合は独立 job（`skill-writer-guard`）として分離する選択肢を残す。

---

## 4. 実行手順

### Phase構成

1. 既存 workflow の棚卸し
2. 検出パターンの確定とローカル試験
3. workflow への step 追加
4. 違反投入による fail 再現確認

### Phase 1: 既存 workflow の棚卸し

#### 目的

grep step を追加すべき lint / quality job を特定する。

#### 手順

1. `.github/workflows/*.yml` を列挙し lint / quality 系 job を特定
2. 既存 step の所要時間と並列構造を確認
3. 追加先 job を確定する

#### 成果物

追加先 job 一覧

#### 完了条件

追加先となる job と step 挿入位置が決まっている

### Phase 2: 検出パターンの確定とローカル試験

#### 目的

regex の false positive / false negative を排除した検出パターンを確定する。

#### 手順

1. `rg -n "appendFileSync|writeFileSync\([^\n]*(LOGS\.md|logsPath|LOGS_PATH)|const LOGS_PATH|const logsPath = .*LOGS\.md" .claude/skills --glob "scripts/**"` をローカルで実行
2. 0 件であることを確認
3. ダミー違反コードを一時投入し regex がヒットすることを確認

#### 成果物

regex 確定版とローカル試験ログ

#### 完了条件

正常状態で 0 件、違反投入で必ずヒットする

### Phase 3: workflow への step 追加

#### 目的

CI 実行時に grep step が発火するよう workflow を更新する。

#### 手順

1. 対象 workflow に step を追加
2. ヒット時 `exit 1` で fail
3. step name を `skill-writer-guard` 等の識別可能な名前にする

#### 成果物

workflow 差分

#### 完了条件

PR 上で step が CI ログに表示される

### Phase 4: 違反投入による fail 再現確認

#### 目的

guard が機能することを CI 実行ログで保証する。

#### 手順

1. 違反コードを含む試験ブランチを準備（マージはしない）
2. CI が fail することを確認
3. 違反コードを撤去し緑に戻ることを確認

#### 成果物

CI fail / pass の双方ログ

#### 完了条件

違反投入で fail、撤去で pass

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `.github/workflows/*.yml` に grep step が追加されている
- [ ] 通常状態で CI が緑である
- [ ] 違反コード投入で CI が fail することを確認した
- [ ] 検出スコープが `.claude/skills` 配下の `scripts/**` に限定されている

### 品質要件

- [ ] regex のローカル試験ログが残っている
- [ ] step 名が他 step と区別可能
- [ ] CI 全体の所要時間が顕著に増えていない

### ドキュメント要件

- [ ] task-skill-ledger-a2-fragment Phase 12 の unassigned-task-detection 記録と本タスクの紐付けが残っている
- [ ] 検出パターンを workflow コメントとして明記している

---

## 苦戦箇所

> task-skill-ledger-a2-fragment Phase 1〜12 outputs（implementation-guide.md / runbook.md / fragment-runbook.md / skill-feedback-report.md）から想定される苦戦箇所を記録する。

- writer 経路の `LOGS.md` 直書き再混入を CI で検出する仕組みが A-2 本体スコープから外れていたため、Phase 12 unassigned-task-detection で「writer 不変条件は CI guard 必須」原則を明文化するまで R-1 / R-2 リスクが暗黙化していた。
- grep 検出パターンの確定が難所で、`appendFileSync` / `writeFileSync` / `LOGS_PATH` / `logsPath` の各種別名と false positive（テストフィクスチャ・コメント文字列）の切り分けに時間を要する想定。
- `ripgrep` 未導入 runner / POSIX `grep -RE` fallback の二経路を許容する設計のため、実装時には両系統で同じ regex が同等に発火するかの検証が必要になる。
- 単一 lint job への step 追加か `skill-writer-guard` 独立 job 化かの判断は所要時間と肥大化リスクのトレードオフであり、Phase 4（fail 再現確認）の所要時間が膨らんだ場合は独立化の判断材料を残す必要がある。

---

## 6. 検証方法

### テストケース

- `.claude/skills/<any>/scripts/log_usage.js` に `appendFileSync(LOGS_PATH, ...)` を入れて fail
- `const LOGS_PATH = path.join(..., 'LOGS.md')` を入れて fail
- fragment writer のままなら pass

### 検証手順

```bash
rg -n "appendFileSync|writeFileSync\([^\n]*(LOGS\.md|logsPath|LOGS_PATH)|const LOGS_PATH|const logsPath = .*LOGS\.md" .claude/skills --glob "scripts/**"
```

CI 上では追加 step がローカル同等のコマンドを実行し、ヒット件数 0 を要求する。

---

## 7. リスクと対策

| リスク                                                    | 影響度 | 発生確率 | 対策                                                                 |
| --------------------------------------------------------- | ------ | -------- | -------------------------------------------------------------------- |
| regex のエスケープ不足で false negative                   | 高     | 中       | ローカルで違反コードを意図投入し必ずヒットすることを確認            |
| pattern 肥大化で他 step を圧迫                            | 中     | 低       | 独立 job (`skill-writer-guard`) に分離する選択肢を残す              |
| 検出スコープ外（skill 外）の writer に同パターンが混入    | 中     | 低       | スコープを `.claude/skills/**/scripts/**` に限定し誤検知を抑制     |
| `rg` が runner 未導入                                     | 中     | 低       | `grep -RE` への置換 fallback を用意                                  |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-skill-ledger-a2-fragment/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/task-skill-ledger-a2-fragment/outputs/phase-12/implementation-guide.md`
- `.claude/skills/*/scripts/log_usage.js`
- `.github/workflows/*.yml`

### 参考資料

- A-2 fragment 化の不変条件（writer は fragment にしか書かない）
- `LOGS/` fragment 命名規約 `<timestamp>-<branch>-<nonce>.md`

---

## 9. 備考

### 苦戦箇所【記入必須】

> task-skill-ledger-a2-fragment 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | A-2 fragment 化で writer は全 skill 切り替え済みなのに、再混入を検知する CI guard が無く、レビュー目視に依存する状態が残った                                                       |
| 原因     | task-skill-ledger-a2-fragment のスコープが writer 改修中心で、CI workflow への回帰 guard 追加までは含まれていなかった（R-1 / R-2 リスク項目として認識されたが対応は分離）        |
| 対応     | 本タスクとして切り出し、`.github/workflows/*.yml` への grep step 追加で writer 経路再混入を機械検出する方針に確定                                                                  |
| 再発防止 | 「writer 系の不変条件は CI guard 必須」という運用原則を Phase 12 unassigned-task-detection に明記し、今後 fragment 化系の改修では guard 追加を併発タスクとして識別するルールにする |

### レビュー指摘の原文（該当する場合）

```
task-skill-ledger-a2-fragment Phase 12 unassigned-task-detection.md にて、writer の LOGS.md 直書き再混入を検知する CI guard を別タスク（UT-A2-CI-001）として切り出すと識別
```

### 補足事項

本タスク単独でのスコープは workflow への grep step 追加のみで完結する。pattern が将来肥大化したときは独立 job 化を選択することで lint job の所要時間を保つ。検出スコープを `.claude/skills/**/scripts/**` に限定することで、本タスクの責務が writer 経路の回帰検出に閉じることを保証する。
