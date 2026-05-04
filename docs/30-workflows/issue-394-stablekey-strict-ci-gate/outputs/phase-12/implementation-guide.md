# Implementation Guide

## Part 1: 中学生レベル

学校で提出する書類に、全員が勝手な名前を書いてしまうと、先生は同じ内容かどうかをすぐに判断できません。そこで「決まった名前は決まった場所だけに書く」という約束を作ります。

このタスクは、その約束をコンピューターの確認作業に入れるための準備です。ただし今は、昔から残っている間違った書き方が 148 個あります。この状態で確認作業を厳しくすると、すべての提出が止まってしまいます。先に古い間違いを直して、0 個になったことを確認してから、厳しい確認を本番の流れに入れます。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| stableKey | 決まった名前 |
| CI | 提出前の自動チェック係 |
| strict | 少しの間違いも止める厳しい確認 |
| violation | 約束と違う書き方 |
| gate | 通ってよいか決める入口 |

## Part 2: 技術者レベル

### Current facts

- `package.json` には `lint:stablekey:strict` が存在する。
- `.github/workflows/ci.yml` の required context は既存 `ci` job 名を維持する必要がある。
- 現行 `pnpm lint:stablekey:strict` は 148 violations で exit 1。
- strict step を今追加すると `main` / `dev` PR の required `ci` context が恒久 fail になる。

### Target diff after cleanup

legacy cleanup により `pnpm lint:stablekey:strict` が exit 0 になった後、既存 `ci` job の `Lint` step 直後に以下を追加する。

```yaml
      - name: Lint stableKey strict
        if: steps.ready.outputs.value == 'true'
        run: pnpm lint:stablekey:strict
```

`continue-on-error` は付けない。新 job は作らず、required status context `ci` を維持する。

### Error handling

| 状態 | 判断 |
| --- | --- |
| strict violations > 0 | CI gate 追加禁止。legacy cleanup を先に完了 |
| strict violations = 0 | `ci` job に blocking step 追加可 |
| branch protection contexts に `ci` 不在 | PUT はせず、governance task へ差し戻し |

