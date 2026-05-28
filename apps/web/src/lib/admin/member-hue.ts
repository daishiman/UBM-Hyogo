// followup-003 Lane B: pure util — memberId hash → 0..7 hue bucket
export type MemberHue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function memberHue(memberId: string): MemberHue {
  let sum = 0;
  for (let i = 0; i < memberId.length; i++) {
    sum = (sum + memberId.charCodeAt(i)) % 1024;
  }
  return (sum % 8) as MemberHue;
}
