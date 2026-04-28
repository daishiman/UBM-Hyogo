# Phase 5 ロールバック戦略

## 目的

A-3（SKILL.md の Progressive Disclosure 分割）の各 PR を、独立に `git revert` できる粒度で構成し、運用中に問題が発覚した場合に最小影響で巻き戻せるようにする。

## 設計原則

- **1 PR = 1 skill 分割 = 1 マージコミット**: revert 単位を skill 単位に揃える
- **canonical + mirror を同コミットに同梱**: revert 時に `.claude` と `.agents` の差分 0 が自動維持される
- **Anchor 追記は別 PR**: A-3 本体を revert しても Anchor 追記は残せる（逆も成立）
- **意味的書き換え混入の禁止**: revert によって機能差分が発生しないよう、cut & paste のみで分割する

---

## ロールバック手順（skill 単位）

### 1. 該当 PR のマージコミット特定

```bash
git log --oneline --grep "split <skill-name> into progressive disclosure"
```

### 2. revert 実行

```bash
git switch -c skill-ledger/revert-<skill-name> origin/dev
git revert <merge-sha> -m 1
```

`-m 1` は merge commit を revert する際の親番号指定（dev 側を保持）。

### 3. 整合性検証

```bash
# 行数検査（200 行未満化が解除されたことを確認）
wc -l .claude/skills/<skill-name>/SKILL.md

# canonical / mirror diff = 0 確認
diff -r .claude/skills/<skill-name> .agents/skills/<skill-name>

# Phase 4 検証カテゴリ V1〜V4 再実行
bash docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-04/scripts/line-count.sh
bash docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-04/scripts/link-integrity.sh
bash docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-04/scripts/orphan-references.sh
bash docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-04/scripts/mirror-diff.sh
```

### 4. PR 作成

- タイトル: `revert: roll back progressive disclosure split for <skill-name>`
- 本文: revert 理由 / 影響範囲 / V1〜V4 evidence

---

## 影響範囲表

| 対象 | revert 後の状態 | 備考 |
| --- | --- | --- |
| `.claude/skills/<skill>/SKILL.md` | 分割前（200 行超）に戻る | |
| `.claude/skills/<skill>/references/<topic>.md` | 削除される | 該当 PR で新規追加した分のみ |
| `.agents/skills/<skill>/...` | canonical に追従 | 同コミットに同梱されているため自動 |
| 他 skill | 影響なし | 1 PR = 1 skill 原則 |
| Anchor 追記 PR | 影響なし | 別 PR のため独立 revert 可能 |

---

## ロールバック判断基準

以下のいずれかが発生した場合は revert を検討:

- references 切り出し後にリンク切れが多発し、即時修正が困難
- skill loader が entry の 10 要素欠落で起動失敗
- canonical / mirror 同期漏れが PR レビュー後に判明
- 意味的書き換えが混入したことが事後検知される

---

## ロールバック後の再着手

1. 原因を Phase 6（異常系検証）の failure-cases に追記
2. Phase 5 runbook を改訂してから再 PR
3. 再 PR は同じブランチ命名規約 `skill-ledger/a3-<skill-name>` を用い、PR 本文で「reverted PR #N の再実装」を明記
