# Phase 8: DRY 化

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-419-pages-project-dormant-delete-after-355 |
| phase | 08 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

## 目的

本タスクは小規模 ops（観察期間 + 1 回限りの destructive 削除）であり、大規模な抽象化は不要。
それでも evidence template と CLI 経路の重複については、共通化の採否判断と非採用理由を明記し、
将来の同種 ops（例: D1 instance 削除、KV namespace 削除）が登場した時に再利用可能性を残す。

## 入力（参照ドキュメント）

- Phase 5 [`phase-05.md`](phase-05.md) Step 手順
- 既存 `scripts/cf.sh` passthrough 設計
- 既存 `outputs/phase-11/` ディレクトリ構造（issue-355 親 / issue-399 sibling）

## 変更対象ファイル一覧

| パス | 種別 | 差分方針 |
| --- | --- | --- |
| `outputs/phase-08/main.md` | 新規 | DRY 候補と採否の記録テンプレ |
| evidence skeleton 群 (Phase 5 で作成) | 編集 | 共通ヘッダ「日付 / オペレータ / redaction 状態 / runtime status」を 7 ファイルに統一 |

## 共通化候補と採否

| 候補 | 重複源 | 方針 | 採否 |
| --- | --- | --- | --- |
| evidence skeleton 共通ヘッダ | 7 つの `outputs/phase-11/*.md` で「日付 / オペレータ / redaction 状態 / runtime status」が共通 | Phase 5 で skeleton 作成時に同一見出し構造を採用。テンプレ化スクリプトは作らない（7 ファイルしかなく abstract コスト > 重複コスト） | 採用（手動コピー） |
| `scripts/cf.sh` の `pages` サブコマンド helper | 1 タスクでしか使わない | 既存 `scripts/cf.sh` は wrangler 引数を素通しする設計。`pages project list` / `pages project delete` をそのまま渡せば動作する。helper 関数を追加すると passthrough 哲学を崩す | 不採用 |
| redaction grep 共通化 | issue-399 sibling と本タスクで同種の `rg -i ...` を実行 | 検索パターンが「Cloudflare token / sink」 vs 「admin PII」で異なる。共通化すると検出漏れリスクが上がる | 不採用 |
| dormant 観察期間サンプリング script | 週次で 4xx / 5xx 率と latency を取得 | 取得経路（Cloudflare Analytics / Workers Logs）が未確定。手動運用で 2 週間 ≥ 2 サンプルで十分。自動化は本タスク後に再評価 | 不採用（観察期間後に再評価） |

## 既存資産の再利用

| 既存 | 再利用方針 |
| --- | --- |
| `scripts/cf.sh` | wrangler 直叩き禁止に従い必ず経由（CLAUDE.md 準拠）。新規 helper は追加しない |
| 親仕様 issue-355 phase-11 smoke evidence | AC-1 の rollback readiness 根拠として参照（リンク参照のみ・コピーしない） |
| `outputs/phase-11/` ディレクトリ規約 | 既存 sibling workflow と同じ命名規則 / `PENDING_RUNTIME_EXECUTION` ヘッダを踏襲 |

## 非 DRY 化の判断

| 候補 | 非 DRY 化理由 |
| --- | --- |
| `pages project delete` 用 wrapper | 1 回限りの destructive 操作。wrapper を作ると user 承認 gate を skip する誘惑が生まれる。`scripts/cf.sh` 直接呼び出しを保つほうが安全 |
| evidence template 用 generator script | 7 ファイルの 1 回限り作成。手動で十分、code review 負担も 1 回のみ |

## ローカル実行コマンド

```bash
# 共通ヘッダの統一確認
rg -n '^## runtime status$' docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/phase-11/
```

## 完了条件 (DoD)

- [ ] 共通化候補 4 件全てに採否と理由が記録されている
- [ ] evidence skeleton 7 ファイルに共通ヘッダが入っている
- [ ] 非採用理由がレビュー可能な粒度で残っている

## 実行タスク

- Phase 08 の判断と成果物境界を確定する。

## 参照資料

- [phase-05.md](phase-05.md)
- [phase-06.md](phase-06.md)
- `scripts/cf.sh`

## 成果物

- `outputs/phase-08/main.md`
