# Phase 12 Documentation

## 12-0. なぜ legacy CF token revocation が必要か（中学生レベル概念説明）

### 例え話で理解する
Cloudflare API token は、デプロイ用の「家の鍵」だと考えてください。新しい仕組み（OIDC token）に切り替えたのに、古い鍵をそのまま机の引き出しに置きっぱなしにしていたら、その鍵を拾った人が勝手にドアを開けて家の中（本番環境）に入れてしまいます。だから、新しい鍵に切り替えたあとは、古い鍵を物理的にハサミで切って捨てる必要があります。今回の作業は、その「古い鍵を捨てる」作業です。

### 用語をやさしく言い換える
- **Cloudflare API Token**: Cloudflare（サーバーを貸してくれている会社）に「これは本人の操作です」と証明する合言葉のようなもの。
- **GitHub Secrets**: GitHub Actions（自動デプロイの仕組み）が使う合言葉の保管庫。
- **1Password**: 個人の合言葉を保管する金庫アプリ。実値はここだけにある。
- **Gate C（user approval gate）**: 「本当に古い鍵を捨てていいですか？」とユーザーに最終確認するチェックポイント。承認なしには物理 revoke しない。
- **legacy token**: 古いやり方で発行した、直接 Cloudflare に渡す合言葉。
- **OIDC token**: 新しいやり方で、必要なときだけ自動発行される使い捨ての合言葉。

### なぜ今やるのか
OIDC への移行はすでに完了していて、本番デプロイは新しい仕組みで動いています。古い token は誰も使っていない状態ですが、「存在しているだけ」で漏洩リスクがあります。だから今、Cloudflare 側・GitHub Secrets 側・1Password 側の 3 か所を同時にきれいにする（reconcile する）段階に来ています。

### 何を壊さないか
- 現行 deploy 経路（OIDC 経由）は止めない。
- D1 binding（データベース接続）は変更しない。
- audit-only token（読み取り専用 token）は残す。
- 将来発行する OIDC token の発行フローも壊さない。
古いものだけを、ピンポイントで安全に消すのがゴールです。

## Strict Outputs

The strict 7 outputs are present under `outputs/phase-12/`.

## Same-Wave Sync

- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md`

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 12 |
| status | completed |

## 目的

Phase 12 strict outputs と正本同期を完了する。

## 実行タスク

- Strict 7 outputs を生成する。
- aiworkflow references / indexes を同期する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`

## 成果物

- `phase-12-documentation.md`

## 完了条件

- Phase 12 strict 7 がすべて存在する。
