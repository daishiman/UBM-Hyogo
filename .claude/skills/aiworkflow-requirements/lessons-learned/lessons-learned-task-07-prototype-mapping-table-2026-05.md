# Lessons Learned — task-07 Prototype Mapping Table（2026-05-07）

> task: `task-07-prototype-mapping-table`
> 関連 spec: `docs/00-getting-started-manual/specs/09-ui-ux.md`、`docs/00-getting-started-manual/specs/09a-prototype-map.md`
> 関連 source: `scripts/verify-09a-prototype-line-ranges.sh`、`docs/00-getting-started-manual/claude-design-prototype/`（frozen sources: `app.jsx` / `primitives.jsx` / `pages-public.jsx` / `pages-member.jsx` / `pages-admin.jsx` / `icons.jsx` / `data.jsx` / `styles.css`）
> 関連 reference: `references/workflow-task-07-prototype-mapping-table-artifact-inventory.md`、`references/ui-ux-prototype-map.md`、`changelog/20260507-ui-prototype-scope-gate.md`、`LOGS/_legacy.md`

## 教訓一覧

### L-07-001: prototype 行範囲は「逆引き 1 ファイル目次」として独立 spec に切り出し、`09-ui-ux.md` に内包しない

- **背景**: task-07 では `09-ui-ux.md` 本体の肥大化を避けるため、prototype 行範囲（`L<start>-L<end>`）の逆引き目次のみを `09a-prototype-map.md`（360+ 行）として分離した。`09-ui-ux.md` は backlink 1 行のみ追加し、props / state / 設計原則の正本責務を維持した。spec sub-file 命名は `09a-` を採用し、後続 09c-09h との整合性を確保した。
- **教訓**: 「実装時に逆引きするための目次」と「設計原則・props/state 仕様」は責務が異なるため、同一ファイルで管理しない。逆引き目次は (1) 実装者が線形に読まずに探せる行範囲表 / (2) 派生ルール（§5.1-§5.8）/ (3) rejection markers / (4) line range ledger の 4 ブロック構造で固定する。
- **将来アクション**: 同種「prototype → production の逆引きが必要な領域」を新設する際は、本 inventory の Contract セクション（19 routes / 13+ primitives / 5.1-5.8 derivation / `L<start>-L<end>` 形式 / 4 rejection markers）をテンプレとして参照する。

### L-07-002: frozen JSX contract は verifier script で線形保護し、token 値の流入を機械的に拒絶する

- **背景**: prototype JSX ファイル（`pages-public.jsx` 等）は task-07 で frozen 扱いとし、token 値・props 値の `09a-prototype-map.md` への流入を `scripts/verify-09a-prototype-line-ranges.sh` で機械的に拒絶した。verifier は (1) `09a-prototype-map.md` 存在確認 / (2) route 行数 19 完全一致 / (3) derivation §5.1-§5.8 完全一致 / (4) token literal の混入拒絶 / (5) prototype 行数 vs ledger end 整合性 / (6) ledger start 行に期待 symbol 存在 の 6 種を非ゼロ exit で報告する。
- **教訓**: docs-only / NON_VISUAL タスクであっても、契約は「文章レビュー」ではなく「verifier の非ゼロ exit」で守る。特に行範囲 ledger 系の spec は「prototype 側の行ずれ」を検出する必要があるため、ledger end ≤ prototype 行数 と ledger start 行の symbol 一致を最低 2 不変条件として担保する。
- **将来アクション**: 行範囲 ledger を含む新規 spec を追加するときは、spec 本体作成と同 wave で verifier script を作成し、`scripts/verify-<spec-id>-line-ranges.sh` 命名規約と「ledger 行数下限・symbol 一致・token literal 拒絶」の 3 不変条件を最低担保にする。

### L-07-003: 19-route 漏れ防止は「層別カウント（公開 6 / 会員 2 / 管理 8 / 共通 3）」を契約として固定する

- **背景**: UI prototype alignment / MVP recovery のスコープ（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`）で確定済みの 19 routes を `09a-prototype-map.md` に取り込む際、層ごとの内訳（公開 6 / 会員 2 / 管理 8 / 共通 3）を verifier の hardcoded contract として固定した。総数 19 だけでは「公開 5 + 管理 9」のような層内ドリフトを検出できないため、層別カウントを別不変条件として持たせた。
- **教訓**: route 集合の整合性は「総数」ではなく「層別カウント」で固定する。docs-only タスクで route を扱う場合、SCOPE.md の層別定義をコピーし、verifier・spec 本文の双方に同一カウントを書き、spec 修正時に両方の同期が必要な構造にする。
- **将来アクション**: 19 routes を変更する後続タスク（task-19..22 等）が走る際は、`09a-prototype-map.md` の §3 ヘッダ（`公開 6 / 会員 2 / 管理 8 / 共通 3`）と verifier の route 数 hardcode の 2 箇所を同一 wave で更新するルールを inventory に明示する。

### L-07-004: derivation rule（§5.1-§5.8）は「prototype 未掲載画面でも新 primitive を生やさない」契約の正本として固定する

- **背景**: task-07 では prototype 未掲載画面（管理画面群・register・privacy・terms）について、既存 13+ primitive のみで構成し新規 primitive を導入しないルールを §5.1-§5.8 の 8 つの derivation rule として明文化した。CLAUDE.md の「UI prototype alignment / MVP recovery」不変条件 #3 と整合し、後続実装タスク（task-11..17）が「prototype に無いから新 primitive を作ってよい」と判断するパスを閉じた。
- **教訓**: prototype 未掲載画面の取り扱いは、後続タスクの設計判断を分散させず、derivation rule として spec に固定する。rule 数は「ちょうど 8」を verifier 不変条件にすることで、追加・削除が無策に発生することを防ぐ。
- **将来アクション**: 後続 UI 実装タスクが「prototype 未掲載画面」に遭遇したら、`09a-prototype-map.md` §5 を最初に参照し、新 primitive 提案は §5.1-§5.8 のいずれにも該当しない場合のみ unassigned-task として起票する。skill-feedback-report.md の `aiworkflow-requirements / Progressive disclosure` フィードバックも同じ趣旨で、`ui-ux-prototype-map.md` を narrow entry point として優先参照する。
