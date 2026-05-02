# Implementation Guide

## Part 1: 中学生レベル

なぜ必要か: 同じメールアドレスについて、「会員の台帳」と「提出の履歴」でルールが違うからです。

会員の台帳では、同じ人のカードが何枚もあると困ります。そのため `member_identities` では、同じメールアドレスは 1 つだけにします。一方、提出の履歴では、同じ人が何回も提出することがあります。そのため `member_responses` では、同じメールアドレスが何回出てもよい状態にします。

| 用語 | 日常語での言い換え |
| --- | --- |
| UNIQUE | 同じものを 2 つ置けないルール |
| table | 表、台帳 |
| `member_identities` | 会員の台帳 |
| `member_responses` | 提出の履歴 |
| migration | 表の作り方を書いた手順書 |

## Part 2: 技術者レベル

正本 UNIQUE は `member_identities.response_email TEXT NOT NULL UNIQUE` である。`member_responses.response_email` は履歴行の system field であり、UNIQUE を付与しない。

参照先:

- `apps/api/migrations/0001_init.sql`: `member_identities.response_email TEXT NOT NULL UNIQUE` が正本 UNIQUE。`member_responses.response_email` は `TEXT` のみ。
- `apps/api/migrations/0005_response_sync.sql`: 0001 側で正本 UNIQUE が宣言済みで、再宣言・再付与しないことを補助コメントで示す。
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`: 仕様参照者向けに同じ境界を明文化する。

今サイクルで実施した実装:

- `database-schema.md` に UNIQUE 所在を明記した（行 50-51 反映済み）。
- 既適用 migration (`0001_init.sql` / `0005_response_sync.sql`) にコメントを追記した。SQL semantics に影響する行差分は 0 行（`git diff` で確認済み）。
- `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` を実行し PASS を確認した。
- `member_responses(response_email)` への UNIQUE 追加は履歴行性と矛盾するため却下する判断を維持した。

未実施で次サイクルに残るのは Phase 13 (PR 作成) のみ。CONST_002 によりユーザー明示承認後に `gh pr create` を実行する。`scripts/cf.sh d1 migrations list` の production 実行も同タイミングに合わせる。

API / 型シグネチャ変更はない。SQL schema semantics も変更しない。
