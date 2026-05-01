# Skill Feedback Report

## task-specification-creator

- VISUAL manual smoke task では、evidence 数を screenshot / DevTools txt / diff に分けて表現すると誤記を防げる。今回の canonical inventory は 10 files = 6 screenshots + 3 DevTools txt + 1 diff。
- `outputs/artifacts.json` parity は仕様作成直後に生成する gate が必要。
- Phase 12 compliance は「Phase 12 file exists」と「captured evidence completed」を分離する。`spec_created` / all phases pending の場合は PASS ではなく reasoned planned / partial status を使う。
- Secret hygiene grep は bare `grep` ではなく、matchありを FAIL、matchなしを PASS として明示する command 形式にする。

## aiworkflow-requirements

- `/profile` logged-in visual evidence の正本反映は、実 screenshot 取得後の Phase 12 で行う。
- legacy follow-up 単票が full workflow に昇格した場合、旧単票は canonical status stub にし、quick-reference / resource-map は workflow root を指す。
- 大規模な workflow 削除が同一 branch に混在する場合、対象 Phase 12 では削除理由・legacy register・artifact inventory への反映有無を別 finding として扱い、無関係なら本タスクで巻き戻さない。
