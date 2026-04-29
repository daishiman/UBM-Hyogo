# Phase 4: テスト作成（RED）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| 名称 | テスト作成（RED） |
| タスクID | TASK-SKILL-CODEX-VALIDATION-001 |
| 状態 | spec_created |
| タスク種別 | tooling_implementation / NON_VISUAL |

## 目的

Lane A / B / C それぞれで、現状実装が落ちることを確認する RED テストを設計・追加する。

## テスト方針

- ユニット: skill-creator 配下の vitest を拡張
- 統合: 実 SKILL.md を `quick_validate.js` に通す smoke 検査
- 命名規則: 既存 TC-XXX に準拠（TC-CDX-NNN を本タスク用に新設）

## TC 一覧

### Lane A（既存 SKILL.md 是正）

| TC | 対象 | 期待 | 現状 |
| --- | --- | --- | --- |
| TC-CDX-A01 | `.claude/skills/aiworkflow-requirements/SKILL.md` を `validate-skill-md.js` に通す | description ≤ 1024 PASS | FAIL（26KB）|
| TC-CDX-A02 | `.claude/skills/automation-30/SKILL.md` を YAML parser に通す | parse 成功 | FAIL（line 10 でエラー）|
| TC-CDX-A03 | `.claude/skills/skill-creator/SKILL.md` description 字数 | ≤ 1024 PASS | FAIL |
| TC-CDX-A04 | mirror parity（A-1 only） | `.claude` と `.agents` の SKILL.md が diff 0 | （Phase 5 後に PASS） |

### Lane B（フィクスチャ拡張子変更）

| TC | 対象 | 期待 | 現状 |
| --- | --- | --- | --- |
| TC-CDX-B01 | `find .claude/skills/skill-creator/scripts/__tests__/fixtures -name "SKILL.md"` 件数 | 0 件 | 28 件 |
| TC-CDX-B02 | `find ... -name "SKILL.md.fixture"` 件数 | 28 件以上（追加 boundary を含む場合は 29 件） | 0 件 |
| TC-CDX-B03 | 既存 `quick_validate.test.js` 全件 | Green | （リネーム後に確認） |
| TC-CDX-B04 | テストヘルパー `loadFixture` 関数の存在 | export されている | 未実装 |
| TC-CDX-B05 | `.gitignore` に `fixtures/*/SKILL.md` 追加 | 含まれる | 未追加 |

### Lane C（skill-creator 改修）

| TC | 対象 | 期待 | 現状 |
| --- | --- | --- | --- |
| TC-CDX-C01 | `generate_skill_md.js` で description 1025 字を生成しようとする input | throw（メッセージに退避先記載） | throw しない |
| TC-CDX-C02 | summary に改行 `\n` 含む input | double-quoted scalar として YAML safe（改行は空白に正規化） | 未対応 |
| TC-CDX-C03 | summary に `: ` 含む input | YAML 構文有効 | 未対応 |
| TC-CDX-C04 | Anchors 6 件を渡す | 5 件のみ description、6 件目以降が `references/anchors.md` に出力 | 未対応 |
| TC-CDX-C05 | Trigger keywords 16 語を渡す | 8 語のみ description、超過分が `references/triggers.md` に出力 | 未対応 |
| TC-CDX-C06 | `init_skill.js` の writeFile 直前に invalid SKILL.md を渡す | throw | throw しない |
| TC-CDX-C07 | 共通バリデータ `utils/validate-skill-md.js` の export | exists | 未実装 |
| TC-CDX-C08 | `generate_skill_md.js` のフィクスチャ生成出力先 | `SKILL.md.fixture` | `SKILL.md` |

### 統合 / 回帰

| TC | 対象 | 期待 |
| --- | --- | --- |
| TC-CDX-INT-01 | 全違反 SKILL.md を `validate-skill-md.js` に流す（Lane A 完了後） | すべて PASS |
| TC-CDX-INT-02 | Codex CLI 起動 smoke（手動 / Phase 11 で実施） | warning 0 |
| TC-CDX-REG-01 | 既存 `quick_validate.test.js` 全件（boundary-1024-desc 等のフィクスチャ） | Green 維持 |

## RED 完了条件

- TC-CDX-A01〜A03、B01〜B05、C01〜C08 が**現状で FAIL** することを CI で観測
- TC-CDX-REG-01 が現状 Green

## 受入条件（Phase 4 完了条件）

- [ ] 上記 TC をテストファイルとして追加し、失敗を確認
- [ ] テストファイルパス: `.claude/skills/skill-creator/scripts/__tests__/codex_validation.test.js`（新規）
- [ ] フィクスチャ用に `boundary-1025-desc/SKILL.md.fixture`（境界外側）を新設

## 成果物

- `outputs/phase-4/test-cases.md`（TC 一覧と期待値）
- `outputs/phase-4/red-confirmation.md`（FAIL ログ抜粋）

## 実行タスク

- Lane A/B/C の RED テストケースを追加する。
- 現状実装で FAIL することを red-confirmation に記録する。
- Phase 5 の Green 実装に必要な期待値を固定する。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 2 | `phase-2.md` | 設計と validation matrix |
| Phase 3 | `phase-3.md` | gate 指摘 |

## 統合テスト連携

Phase 4 の RED 結果は Phase 5 の Green 判定と Phase 6 の回帰 guard に再利用する。

## 完了条件

- [ ] RED テストが Lane A/B/C をすべてカバーしている
- [ ] 1024/1025 字境界と 28 件フィクスチャ inventory が検証対象に含まれている
- [ ] R-06 BOM の扱いがテストで明示されている

## タスク100%実行確認【必須】

- [ ] Phase 4 の成果物と artifacts.json の登録が一致している
