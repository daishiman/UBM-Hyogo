import googleIconUrl from "./google.svg";

export type GoogleBrandIconSize = "sm" | "md" | "lg";

const SIZE_PX: Record<GoogleBrandIconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

export interface GoogleBrandIconProps {
  readonly size?: GoogleBrandIconSize;
  readonly className?: string;
}

export function GoogleBrandIcon({ size = "md", className }: GoogleBrandIconProps) {
  const px = SIZE_PX[size];
  return (
    <img
      src={googleIconUrl}
      width={px}
      height={px}
      alt=""
      className={className}
      data-component="google-brand-icon"
      data-size={size}
      aria-hidden="true"
      draggable={false}
    />
  );
}
