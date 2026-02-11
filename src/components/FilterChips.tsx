interface FilterChipsProps {
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  allLabel?: string;
}

export default function FilterChips({ options, selected, onSelect, allLabel = "Semua" }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
          selected === null
            ? "bg-primary text-primary-foreground"
            : "glass glass-hover text-muted-foreground hover:text-foreground"
        }`}
      >
        {allLabel}
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt === selected ? null : opt)}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
            opt === selected
              ? "bg-primary text-primary-foreground"
              : "glass glass-hover text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
