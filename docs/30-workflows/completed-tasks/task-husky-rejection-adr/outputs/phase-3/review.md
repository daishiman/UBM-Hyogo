# Phase 3: review.md

日付: 2026-04-28

## 1. AC カバレッジ表

| AC | 設計でのカバー箇所 | 判定 |
| --- | --- | --- |
| AC-1（ADR 集約先確定 + 命名規約） | design.md §1 | PASS |
| AC-2（ADR-0001 必須セクション 5 + Status） | design.md §2 各セクション記載方針 | PASS |
| AC-3（husky / pre-commit / native の不採用理由） | design.md §2 Alternatives Considered + §3 引用範囲 | PASS |
| AC-4（Phase 2 design / Phase 3 review からの backlink） | design.md §4 backlink 追加位置と相対パス | PASS |
| AC-5（ADR 単独可読性） | design.md §5 ADR 単独可読性の担保 | PASS |
| AC-6（既存 lefthook 構成と非矛盾） | design.md §6 非矛盾チェック表 | PASS |

## 2. ADR 集約先選定の妥当性（再評価）

| 候補 | 採用 | 理由 |
| --- | --- | --- |
| `doc/decisions/`（新設） | 採用 | (a) 正本ツリー配下 (b) 中立的命名で他ドメインの ADR も格納可 (c) 命名規約 `NNNN-<slug>.md` は業界標準 |
| `doc/00-getting-started-manual/decisions/` | 不採用 | getting-started 領域は新規参加者向けで、ADR の長期履歴格納には semantics が合わない |
| `docs/decisions/`（タスク管理ツリー側） | 不採用 | `docs/30-workflows/` は workflow outputs 系で、設計判断の正本ではない |

将来の他 ADR 追加（D1 採用 / Auth.js 採用 / Hono 採用 等）を見越しても `doc/decisions/` の semantics で破綻しない。

## 3. Alternatives Considered の一次資料追跡

| 候補 | 不採用理由の一次資料 |
| --- | --- |
| husky | `phase-3/review.md` 第5節「husky の方が広く使われている」への応答行 + Node ランタイム必須は一般知識 |
| pre-commit | Python 依存は本リポジトリの mise/pnpm 構成と不整合（CLAUDE.md「スタック」表 + `.mise.toml` から導出可能） |
| native git hooks | `phase-2/design.md` 第4節「既存 worktree への再インストール手順」が手動配布の限界を示す |

3 候補とも一次資料からの追跡が可能であることを確認した。

## 4. backlink 設計の機械適用可能性

| 対象 | 追記位置の特定可能性 | 既存記述書き換え | 判定 |
| --- | --- | --- | --- |
| `phase-2/design.md` 第8節 ADR ライト表末尾 | 表末尾の最終行 `ADR-04` の直後で一意特定可能 | なし（追記のみ） | PASS |
| `phase-3/review.md` 第5節末尾（`## 6. 結論` 直前） | 第5節末尾と「## 6. 結論」見出しの境界で一意特定可能 | なし（追記のみ） | PASS |

機械的（Edit ツール）でも安全に適用可能。

## 5. ADR 単独可読性チェックリスト初版（Phase 11 docs walkthrough 入力）

- [ ] ADR-0001 を単体で読み、Context で「なぜ Git hook ツールが必要だったか」が分かる
- [ ] Decision で採用方針 5 項目が一意に分かる
- [ ] Decision の lane 表で `lefthook.yml` を読まなくても適用境界が分かる
- [ ] Consequences で Positive と Negative/Trade-off が分離されている
- [ ] Alternatives Considered の 3 候補各々で「不採用理由」が独立節として分かる
- [ ] References 内のリンクが全て解決する（リポジトリルートからの相対パスとして妥当）
- [ ] 派生元 outputs を未読でも判断履歴が辿れる（重要表が ADR にインライン転記されている）

## 6. 結論

設計は GO。差し戻し指摘なし。Phase 4 テスト設計に進む。
