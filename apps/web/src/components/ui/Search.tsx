export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Search({ value, onChange, placeholder }: SearchProps) {
  return (
    <div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button aria-label="クリア" onClick={() => onChange("")}>
          ×
        </button>
      )}
    </div>
  );
}
