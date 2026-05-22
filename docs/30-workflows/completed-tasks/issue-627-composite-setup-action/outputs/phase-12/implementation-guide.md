# Implementation Guide

## Part 1: 中学生レベル

同じ準備を何度も書くと、あとで直す場所が増えます。学校の行事で、毎クラスが「机を出す、イスを並べる、名札を置く」と別々に紙へ書いていたら、机の数が変わったとき全クラスの紙を直す必要があります。

今回の composite action は、その準備を「会場準備セット」という 1 つの紙にまとめる作業です。各クラスは「会場準備セットを使う」と書くだけになります。ただし、会場に入る鍵を開ける作業にあたる checkout は、クラスごとに条件が違うため、まとめる箱には入れません。

| 用語 | 言い換え |
| --- | --- |
| GitHub Actions | 自動で作業する係 |
| workflow | 自動作業の手順書 |
| composite action | よく使う手順をまとめた部品 |
| checkout | 作業するために資料を取り出すこと |
| pnpm install | 必要な道具をそろえること |

## Part 2: 技術者レベル

Create `.github/actions/setup-project/action.yml` with `runs.using: composite`.

Inputs:

- `setup-strategy`: `node-setup` or `mise`, default `node-setup`
- `install`: string boolean, default `'true'`
- `node-version`: default `'24.15.0'`
- `pnpm-version`: default `'10.33.2'`
- `working-directory`: default `.`

The action does not run `actions/checkout`. Callers must checkout first so `./.github/actions/setup-project` resolves and workflow-specific checkout settings such as `persist-credentials: false` remain local to each workflow.
