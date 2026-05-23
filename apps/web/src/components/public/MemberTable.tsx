// task-11: density=list 時の table 表現。Server Component。

import { STABLE_KEY } from "@ubm-hyogo/shared";

import type { PublicMemberListItem } from "./MemberCard";

export interface MemberTableProps {
  items: PublicMemberListItem[];
}

export function MemberTable({ items }: MemberTableProps) {
  return (
    <table data-component="member-table">
      <caption className="sr-only">メンバー一覧（リスト表示）</caption>
      <thead>
        <tr>
          <th scope="col">名前</th>
          <th scope="col">ニックネーム</th>
          <th scope="col">所在地</th>
          <th scope="col">ゾーン</th>
          <th scope="col">種別</th>
        </tr>
      </thead>
      <tbody>
        {items.map((m) => (
          <tr key={m.memberId}>
            <th scope="row">
              <a href={`/members/${m.memberId}`}>{m.fullName}</a>
            </th>
            <td>{m.nickname ?? ""}</td>
            <td data-role={STABLE_KEY.location}>{m.location}</td>
            <td data-role="zone">{m.ubmZone ?? ""}</td>
            <td data-role="status">{m.ubmMembershipType ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
