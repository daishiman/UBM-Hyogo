# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-29 |
| 上流 | Phase 11（手動 smoke / 自己適用検証） |
| 下流 | Phase 13（PR 作成） |
| 状態 | pending |
| user_approval_required | false |
| タスク種別 | docs-only / NON_VISUAL |
| 縮約テンプレ適用 | **自己適用第一例（drink-your-own-champagne）** |

## 目的

6 必須成果物（implementation-guide / system-spec-update-summary / documentation-changelog /
unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を
作成し、**Phase 12 Part 2 必須 5 項目（C12P2-1〜C12P2-5）** を本タスク自身で完全充足する。
TECH-M-02 / TECH-M-03 / TECH-M-04 を解決し、TECH-M-01 は Phase 8 解決済を最終確認する。
state ownership 分離（workflow root = `spec_created` / Phase 1〜3 = `completed`）を本 Phase で誤書換えしない運用を徹底する。

本 Phase は縮約テンプレ自己適用の **Part 2 側適用第一例** として後続タスクの参照元になる。

## 入力

- `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md`（NON_VISUAL 代替証跡 3 点）
- `outputs/phase-10/go-no-go.md`
- `outputs/phase-03/main.md`（MINOR 追跡テーブル TECH-M-01〜04）
- `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`（C12P2-1〜5 正本）
- `.claude/skills/task-specification-creator/references/phase-template-phase12.md`（追記済縮約テンプレ）

## 必須タスク（6 ファイル）

### Task 12-1: implementation-guide.md（Part 1 / Part 2）

| Part | 内容 |
| --- | --- |
| Part 1（中学生レベルアナロジー） | 「skill 縮約テンプレは、写真が要らない宿題（読書感想文）と要る宿題（観察日記）でフォーマットを分けるのと同じ。`visualEvidence` の値が分岐スイッチで、NON_VISUAL なら写真欄を消す」 |
| Part 2（実装詳細） | SKILL.md タスクタイプ判定フロー使用例 / `phase-template-phase11.md` 縮約テンプレ呼出方法 / 6 ファイル追記の reference 一覧 / mirror 同期手順（`diff -qr`）/ 解除条件は無し（永続ルール）|

#### Phase 12 Part 2 必須 5 項目（C12P2-1〜C12P2-5）一対一対応

| ID | 項目 | 本タスクでの記載 |
| --- | --- | --- |
| C12P2-1 | TypeScript 型定義 | **該当なし**（docs-only / コード変更なし）と明示宣言。空欄ではなく「該当なし」理由を 1 行で説明 |
| C12P2-2 | API シグネチャ | **該当なし**（docs-only / API 追加・変更なし）と明示宣言 |
| C12P2-3 | 使用例 | SKILL.md タスクタイプ判定フロー使用例（`artifacts.json.metadata.visualEvidence=NON_VISUAL` を入力にして縮約テンプレが発火する流れを step-by-step 例示）|
| C12P2-4 | エラー処理 | `visualEvidence` メタ未設定時の警告挙動仕様（Phase 1 で必須入力化されているため、未設定なら Phase 1 で fail-fast。Phase 11 到達前に検出）|
| C12P2-5 | 設定可能パラメータ・定数 | 縮約テンプレで列挙する canonical 3 点（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）と判定キー（`visualEvidence` / `taskType` / `scope`）|

### Task 12-2: system-spec-update-summary.md

- aiworkflow-requirements への影響: **なし**（本タスクは task-specification-creator skill 内部の改修のみ。aiworkflow-requirements の references / indexes / SKILL.md は触らない）
- Step 1: 仕様書差分（aiworkflow-requirements には差分なし。task-specification-creator 6 ファイル追記のみ）
- Step 2A: 計画記録（CI gate 化（mirror parity）は TECH-M-02 として別タスク化、Phase 12 unassigned-task-detection に転記）
- Step 2B: 実更新なし（aiworkflow-requirements に対する更新なし宣言を明記）
- 完了前 計画系 wording 残存確認:

```bash
rg -n "仕様策定のみ|実行対象|保留として記録" \
  docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "計画系 wording なし"
```

### Task 12-3: documentation-changelog.md

| 変更ファイル | 種別 | 変更内容 |
| --- | --- | --- |
| `.claude/skills/task-specification-creator/SKILL.md` | 更新 | タスクタイプ判定フロー（NON_VISUAL → 縮約発火）追記 |
| `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | 更新 | 縮約テンプレ追加（3 点固定 / screenshot 不要明文化） |
| `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | 更新 | Part 2 必須 5 項目チェック項目化 |
| `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` | 更新 | C12P2-1〜5 一対一対応追加 + docs-only ブランチ追加 |
| `.claude/skills/task-specification-creator/references/phase-template-phase1.md` | 更新 | `visualEvidence` Phase 1 必須入力ルール追記 |
| `.claude/skills/task-specification-creator/references/phase-template-core.md` | 更新 | state ownership 分離（spec_created vs completed）追記 |
| `.agents/skills/task-specification-creator/`（mirror）| 同期 | 上記 6 ファイル mirror（差分 0）|
| `outputs/phase-01〜13/*` | 新規 | task workflow 一式 |

加えて、TECH-M-01〜04 の解決ステータスを記録:

| MINOR ID | 解決状況 | 解決 Phase |
| --- | --- | --- |
| TECH-M-01（重複セクション統合）| RESOLVED | Phase 8 |
| TECH-M-02（mirror parity CI gate 化）| DEFERRED → 別タスク化（Task 12-4 内 U-7）| 本タスクスコープ外 |
| TECH-M-03（UT-GOV-001〜007 遡及適用方針）| RESOLVED（本 changelog 内で明文化）| Phase 12 |
| TECH-M-04（skill-fixture-runner 縮約テンプレ検証）| DEFERRED → 別タスク化（Task 12-4 内 U-8）| 本タスクスコープ外 |

#### TECH-M-03 遡及適用方針（明文化）

- **新規タスク**: Phase 1 から本縮約テンプレを適用する（`artifacts.json.metadata.visualEvidence=NON_VISUAL` を Phase 1 で必ず入力）
- **進行中タスク**: 進行中 docs-only タスクには **遡及適用しない**。Phase 11 着手時点で再判定し、未着手なら適用、着手済なら従来テンプレで完走させる
- **完了済タスク**: 遡及適用しない（再生成しない）

### Task 12-4: unassigned-task-detection.md

U-5 が clear された後の next U-N 検出（SF-03 4 パターン照合 + 本タスク特有検出）:

| ID | 候補タスク | 根拠 | 優先度 |
| --- | --- | --- | --- |
| U-6 | UT-GOV-001〜007 系の遡及適用判定タスク | TECH-M-03 で「進行中タスクは Phase 11 着手時に再判定」と明文化したため、判定実施タスクが必要 | LOW |
| U-7 | mirror parity CI gate 強制タスク（pre-commit / GitHub Actions） | TECH-M-02 で別タスク化決定。`.claude` ⇄ `.agents` mirror diff 0 を CI gate で機械強制する | MEDIUM |
| U-8 | skill-fixture-runner への縮約テンプレ検証追加タスク | TECH-M-04 で別タスク化決定。SKILL.md 縮約テンプレ追記後の構造健全性を fixture テストで検証する | LOW |

SF-03 4 パターン照合:

| パターン | 結果 |
| --- | --- |
| 型定義→実装 | 該当なし（docs-only） |
| 契約→テスト | 該当なし（API 変更なし）|
| UI 仕様→コンポーネント | 該当なし（UI 変更なし）|
| 仕様書間差異→設計決定 | TECH-M-03（遡及適用方針）を本 Phase で解決済 |

検出件数 3 件（U-6 / U-7 / U-8）と明記。各 U-N は別 issue 化候補として Phase 13 post-merge で起票する。

### Task 12-5: skill-feedback-report.md

task-specification-creator 自身へのドッグフーディング所感:

- **良かった点**: 縮約テンプレ自己適用（Phase 11）が成立したことで、テンプレが理論ではなく運用実体として機能することが実証された
- **改善観察事項**:
  - SKILL.md タスクタイプ判定フローが追記後 500 行を超えると Progressive Disclosure 限界に近づく → 将来的な分割候補
  - Part 2 必須 5 項目で「該当なし」明示宣言ルールが docs-only タスクで多用される → 「該当なし」用テンプレ snippet を将来追加すると DRY 化進む
  - mirror parity 検証が 6 ファイル個別チェックではなく `diff -qr` 一発で済む点が運用上有利
- **苦戦箇所**: 自己適用循環（Phase 5 → Phase 11 順序ゲート）の意識化が必要。テンプレ未コミット状態で Phase 11 を始めると失敗する
- **後続タスクへの引き継ぎ**: 縮約テンプレ第一適用例として本 Phase 11 / 12 outputs を参照リンク化することで、UT-GOV-001〜007 系 Wave で再現性を担保

### Task 12-6: phase12-task-spec-compliance-check.md

本タスク自身が縮約テンプレに準拠しているかの自己 compliance check:

| チェック項目 | 期待 | 実測 |
| --- | --- | --- |
| Phase 11 outputs = 3 点固定 | main / manual-smoke-log / link-checklist のみ | 3 点（`ls` で確認） |
| screenshot 不存在 | 0 ファイル | 0 ファイル |
| C12P2-1 TS 型定義 | 「該当なし」明示宣言 | 該当なし宣言済 |
| C12P2-2 API シグネチャ | 「該当なし」明示宣言 | 該当なし宣言済 |
| C12P2-3 使用例 | SKILL.md 判定フロー使用例 | 記載済 |
| C12P2-4 エラー処理 | visualEvidence 未設定時の警告仕様 | 記載済 |
| C12P2-5 設定可能パラメータ | canonical 3 点 + 判定キー | 記載済 |
| state ownership | workflow root = `spec_created` 維持 | `index.md` 状態欄維持 |
| mirror parity | `diff -qr` 差分 0 | Phase 11 S-1 で確定済 |
| 自己適用 | 本 Phase 12 自身が Part 2 第一適用例 | drink-your-own-champagne 宣言記載 |

## 実行タスク

1. Task 12-1〜12-6 を順次作成（Part 2 必須 5 項目を C12P2-1〜5 一対一で記述）
2. TECH-M-03 遡及適用方針を Task 12-3 changelog で明文化
3. TECH-M-02 / TECH-M-04 を Task 12-4 unassigned-task-detection の U-7 / U-8 として転記
4. 計画系 wording 残存確認スクリプト実行（`仕様策定のみ` 等の残存 0 確認）
5. Task 12-6 compliance-check で全項目 PASS 確認
6. **state ownership 維持確認**: `index.md` の workflow root 状態が `spec_created` のまま / Phase 1〜3 が `completed` のままであること
7. 6 ファイル命名一致確認（`unassigned-task-detection.md` 等のタイポなし）

## 参照資料

### システム仕様（task-specification-creator skill）

> 実装前に必ず以下を確認し、Part 2 5 項目チェックと state ownership 分離ルールを整合させること。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 12 completion checklist | `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` | C12P2-1〜5 正本 |
| Phase 12 縮約テンプレ | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | Part 2 5 項目チェック追記済 |
| Phase 12 detail | `.claude/skills/task-specification-creator/references/phase-template-phase12-detail.md` | Phase 12 詳細運用 |
| Phase 12 documentation guide | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | 6 ファイル構成正本 |

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-11/` 配下 3 点 |
| 必須 | `outputs/phase-10/go-no-go.md` |
| 必須 | `outputs/phase-03/main.md`（MINOR 追跡テーブル）|
| 参考 | `docs/30-workflows/skill-ledger-b1-gitattributes/phase-12.md`（NON_VISUAL 先行先例）|

## 依存Phase明示

- Phase 1 成果物（visualEvidence メタ / state ownership）を参照する。
- Phase 2 成果物（mirror 同期手順）を参照する。
- Phase 3 成果物（MINOR 追跡テーブル）を参照する。
- Phase 5 成果物（skill 6 ファイル追記実体）を参照する。
- Phase 7 成果物（AC マトリクス）を参照する。
- Phase 8 成果物（DRY 化結果 / TECH-M-01 解決）を参照する。
- Phase 9 成果物（mirror diff 0）を参照する。
- Phase 10 成果物（Go 判定）を参照する。
- Phase 11 成果物（自己適用 evidence 3 点）を参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-12/implementation-guide.md` | Part 1 アナロジー / Part 2 5 項目（C12P2-1〜5 一対一） |
| `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements 影響なし宣言 / Step 1 / 2A / 2B |
| `outputs/phase-12/documentation-changelog.md` | 変更ファイル / TECH-M-01〜04 解決状況 / TECH-M-03 遡及適用方針明文化 |
| `outputs/phase-12/unassigned-task-detection.md` | U-6 / U-7 / U-8 検出 / SF-03 4 パターン照合 |
| `outputs/phase-12/skill-feedback-report.md` | task-specification-creator ドッグフーディング所感 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 本タスク自身の縮約テンプレ準拠自己 compliance check |

## 完了条件 (DoD)

- [ ] 6 必須ファイル作成済（命名タイポなし）
- [ ] C12P2-1〜C12P2-5 が implementation-guide.md Part 2 で一対一充足
- [ ] TECH-M-01 RESOLVED 確認 / TECH-M-02・M-04 → U-7・U-8 転記 / TECH-M-03 RESOLVED
- [ ] U-6 / U-7 / U-8 が unassigned-task-detection.md に記載
- [ ] 計画系 wording 残存 0 件
- [ ] aiworkflow-requirements 影響なし宣言が system-spec-update-summary.md に明記
- [ ] state ownership 維持確認（workflow root = `spec_created` / Phase 1〜3 = `completed`）
- [ ] phase12-task-spec-compliance-check.md 全項目 PASS
- [ ] 6 ファイル命名一致

## 苦戦箇所・注意

- **state ownership 誤書換え**: workflow root の状態を Phase 12 close-out で誤って `completed` に書き換える事故が頻発（原典 §8 苦戦箇所 3）。本タスクでは workflow root は `spec_created` のまま、Phase 1〜3 のみ `completed`。Phase 12 着手時に `index.md` の状態欄を絶対に書き換えない
- **Part 2 「該当なし」の空欄化**: docs-only で C12P2-1 / C12P2-2 を空欄にすると compliance-check が機械的に FAIL する。「該当なし」と理由を 1 行で明示宣言すること
- **計画系 wording 残存**: 「実行対象」「保留として記録」を Task 12-2 に書いて忘れがち。完了前 grep を必ず実行
- **TECH-M-03 遡及適用方針の曖昧化**: 「新規タスクからのみ / 進行中は Phase 11 着手時再判定 / 完了済は再生成しない」の 3 段階を明文化。曖昧な「ケースバイケース」記述は禁止
- **6 ファイル名のタイポ**: `phase12-task-spec-compliance-check.md`（ハイフン位置注意）等の類似名を作らない
- **Part 1 アナロジーの過度な抽象化**: 「縮約テンプレ判定」と書いただけでは中学生に届かない。「写真が要らない宿題と要る宿題でフォーマットを分ける」のような具体物に喩える
- **NON_VISUAL の証跡分散**: Phase 11 代替証跡（3 点）と Phase 12 outputs の両方を直列で参照可能にすること（implementation-guide / changelog から Phase 11 へのリンクを張る）
- **mirror diff 再確認漏れ**: Phase 9 / Phase 11 で確定したが、Phase 12 で skill 側を再修正していないか念のため `diff -qr` を再実行（Task 12-6 compliance-check 内）

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs（6 件）が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。
- [ ] **workflow root の状態欄を書き換えていないことを確認する**（`spec_created` のまま）。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の skill 改善であり、アプリケーション統合テストは追加しない。
- 統合検証は `diff -qr` mirror parity / 計画系 wording grep / 6 ファイル命名 `ls` 検査 / state ownership 目視確認で代替する。
- 後続タスク（U-6 / U-7 / U-8）が起票された時点で、本 Phase 12 outputs を Part 2 第一適用例として参照リンク化する。

## 次 Phase

- 次: Phase 13（PR 作成）
- 引き継ぎ: 6 必須成果物 / TECH-M-01〜04 解決済 / U-6 / U-7 / U-8 別 issue 化候補 / state ownership 維持確認
