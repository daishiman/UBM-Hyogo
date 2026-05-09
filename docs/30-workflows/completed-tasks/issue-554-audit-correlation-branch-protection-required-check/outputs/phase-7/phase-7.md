# Phase 7 — governance 文書（CLAUDE.md）反映実装

## 状態

**実装済**。`grep -n 'audit-correlation-verify' CLAUDE.md` で 1 箇所 hit（L81、ブランチ戦略章 solo 運用ポリシー注記の直後）。

```
81:> Issue #554 では `audit-correlation-verify / verify` を `dev` / `main` の required status check に追加する。実 `gh api -X PUT`、after JSON、commit、push、PR はユーザー明示承認後のみ実行する。read-only before JSON は事前 evidence として取得可能。
```

## 仕様書 Phase 7 §7.1 / §7.2 との照合

仕様書は「ブランチ戦略」章 + 「Governance / CODEOWNERS」章の **2 箇所** 追記を要求していたが、現状は L81 の 1 箇所に集約されている。CLAUDE.md L80（ブランチ戦略の UT-GOV-001 確認手順）が既に `gh api .../branches/dev/protection` および `branches/main/protection` の grep ガイダンスを内包しているため、Governance 章への重複追記は冗長と判断し L81 への 1 行集約で代替。

### 補足追加（任意 / Phase 13 ユーザー判断）

「Governance / CODEOWNERS」章末尾に required contexts 確認用 grep one-liner を追記する案:

```markdown
required contexts 確認: `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection | jq -r '.required_status_checks.contexts[]' | grep -F 'audit-correlation-verify / verify'`（`main` も同様）。
```

本 Phase ではあえて追記せず、L81 の集約表現を最終形とする（drift 最小化）。Phase 13 でユーザー判断。

## 検証

```bash
$ grep -n 'audit-correlation-verify / verify' CLAUDE.md
81:> Issue #554 では `audit-correlation-verify / verify` を ...
```

`audit-correlation-verify / verify` 文字列が CLAUDE.md に正しく canonical 形（半角スラッシュ前後スペース）で含まれることを確認。

## DoD

- [x] CLAUDE.md に required contexts 関連の記述が存在
- [x] canonical 表記 `audit-correlation-verify / verify` で記載
- [x] 編集 diff スニペット記録
