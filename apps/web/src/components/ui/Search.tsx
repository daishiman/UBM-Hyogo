export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function Search({
  value,
  onChange,
  placeholder,
  id,
  name,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: SearchProps) {
  return (
    <div>
      <input
        type="search"
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
      {value && (
        <button type="button" aria-label="クリア" onClick={() => onChange("")}>
          ×
        </button>
      )}
    </div>
  );
}
