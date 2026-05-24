# serial-06 followup-004 — adapter schema extension pipeline 整備

## メタ情報

```yaml
issue_number: TBD
```

| 項目         | 内容                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| タスクID     | serial-06-followup-004-adapter-schema-extension-pipeline                          |
| タスク名     | `PublicMemberProfileZ` schema 拡張時の adapter 拡張パイプライン文書化            |
| 分類         | 設計（拡張性）                                                                    |
| 対象機能     | `apps/web/src/lib/adapters/member-detail.ts` / `packages/shared/src/zod/`        |
| 優先度       | 低                                                                                |
| 見積もり規模 | 小規模                                                                            |
| ステータス   | 未実施                                                                            |
| 発見元       | serial-06 Phase 9 R-02「既存 API shape と UI 期待の乖離」/ Phase 12 implementation-guide §「NormalizedField の sanitize」 |
| 発見日       | 2026-05-23                                                                        |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

serial-06 adapter は現時点の `PublicMemberProfileZ` を前提に書かれている。Google Form / API 側で新しい項目（例: `socialLinks` / 新 `FieldKind`）が追加された際に「adapter のどこを直すか / spec をどう更新するか / spec ↔ adapter ↔ primitive のどれを最初に拡張するか」が文書化されていない。

Phase 9 §2 で「schema 拡張時は adapter も拡張」とは書かれているが、**手順** ではなく **方針** に留まっている。

### 1.2 問題点・課題

- 将来 API schema 追加時に「visibility filter の二重防御を維持しつつ field を反映する」手順が暗黙知になる
- adapter の `toLegacySections` で `visibility: "public" / source: "forms"` を literal 復元している箇所と、`PublicMemberProfileZ` 拡張後の field 追加方法の対応関係が、コードを読まないと分からない
- adapter spec のケースが「現 8 ケース構造」に最適化されており、新規 kind 追加時の test 追加箇所が明確でない

### 1.3 放置した場合の影響

- schema 拡張対応が「serial-06 を書いた人の頭の中」にしか無く、引き継ぎコスト高
- 拡張時に既存 8 ケースの test 構造を壊しやすい
- `MemberDetail` primitive と adapter の責務境界が時間とともに曖昧化する

---

## 2. 何を達成するか（What）

### 2.1 目的

adapter schema extension の手順を、コード変更が必要な「順序」と「責務」を明示した形で文書化する。同時に extension 時の最小 test 雛形（spec template）を提供する。

### 2.2 最終ゴール

- `apps/web/src/lib/adapters/README.md`（新規）に「schema 拡張時のチェックリスト」が記述される
- adapter spec に「new kind 追加 template」section が存在し、コピペで増やせる
- `PublicMemberProfileZ` 拡張時に踏むべき順序が `packages/shared/src/zod/CHANGELOG.md` 等で明示される（既存ファイルが無ければ adapter README に集約）

### 2.3 スコープ

#### 含むもの

- adapter README の新規作成
- spec template の追加（コメントブロックだけでも可）
- 既存 8 ケースの責務 mapping 表

#### 含まないもの

- 実際の schema 拡張（仮の `socialLinks` 等を追加するのは別タスク）
- primitive 拡張
- API 側 use case 変更

### 2.4 成果物

- `apps/web/src/lib/adapters/README.md`
- adapter spec 内の template comment block
- 責務 mapping 表（README 内）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- serial-06 merge 済み
- `PublicMemberProfileZ` の現状 shape が安定

### 3.2 依存タスク

- serial-06-form-response-binding（merge 必須）

### 3.3 必要な知識

- zod schema 拡張 idiom（`.extend()` / `discriminatedUnion`）
- adapter の sanitize 設計（visibility / source 除去）
- `MemberDetail` composing primitive の橋渡し（`toLegacySections`）

### 3.4 推奨アプローチ

README に以下 5 ステップを明記:

1. `packages/shared/src/zod/viewmodel.ts` で `PublicMemberProfileZ` を拡張
2. `apps/web/src/fixtures/public-member-profile.ts` に新 field を含む fixture を追加
3. `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` に「new kind 追加 template」を貼り付けて 1 ケース追加
4. `apps/web/src/lib/adapters/member-detail.ts` の `normalizeField` / sanitize 箇所を最小差分で拡張
5. `MemberDetail` primitive で新 field の描画が必要なら別 PR として primitive 拡張を分割

責務 mapping 表は「fixture / zod / adapter / primitive / spec」の 5 列でケース横断的に提示する。

---

## 4. 実行手順

### Phase構成

1. adapter README 初稿
2. spec template 埋め込み
3. mapping 表整備
4. レビュー（serial-07 関係者と読み合わせ）

### Phase 1: README 初稿

- `apps/web/src/lib/adapters/README.md` を新規作成（採用範囲は `member-detail.ts` のみ。将来 adapter が増えたら拡張）
- 5 ステップを箇条書きで提示

### Phase 2: spec template

- 既存 spec ファイル末尾に `// === EXTENSION TEMPLATE ===` コメントで貼り付け可能な雛形を残す

### Phase 3: mapping 表

- 8 ケース × 5 列の表で「どこを触ると何が落ちるか」を可視化

### Phase 4: 読み合わせ

- serial-07-regression-evidence 担当（同 worktree）と概念整合確認

---

## 5. 苦戦箇所メモ

- **sanitize literal 復元の落とし穴**: adapter は output から `visibility` / `source` を除外（Phase 8 DoD-13）するが、既存 `MemberDetailSections` primitive は strict zod Section（`visibility` / `source` 必須）を要求する。`MemberDetail` 内の `toLegacySections` で literal 復元（`visibility: "public" / source: "forms"`）して橋渡しした。新 field 追加時にこの literal 復元を忘れると strict zod parse で fail するため、README ステップ 4 で必ず触れる。
- **fixture の `PublicMemberProfileZ.parse` self-validation**: spec ケース 1 で fixture 自体を schema parse することで「fixture が schema drift していない」ことを保証している。新 field を fixture に足したら、schema 側も同期しないとケース 1 が即落ちる。これは安全網として優秀だが、初見だと「なぜケース 1 が落ちるか」分かりにくいので README に書く。

---

## 6. 完了条件

- [ ] `apps/web/src/lib/adapters/README.md` 新規作成
- [ ] 5 ステップ checklist が記述されている
- [ ] spec ファイルに extension template コメント追加
- [ ] 責務 mapping 表が README 内に存在
- [ ] serial-06 spec への back link 整備
