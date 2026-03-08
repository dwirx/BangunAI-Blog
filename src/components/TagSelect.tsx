import { ChevronDown } from "lucide-react";

interface TagSelectProps {
  tags: string[];
  selected: string | null;
  onSelect: (tag: string | null) => void;
  placeholder?: string;
}

export default function TagSelect({ tags, selected, onSelect, placeholder = "Tag" }: TagSelectProps) {
  if (tags.length === 0) return null;

  return (
    <div className="relative inline-flex items-center">
      <select
        value={selected ?? ""}
        onChange={(e) => onSelect(e.target.value || null)}
        className={`appearance-none pl-4 pr-8 py-2 text-sm font-medium rounded-full transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 ${
          selected
            ? "bg-primary text-primary-foreground"
            : "glass glass-hover text-muted-foreground hover:text-foreground"
        }`}
      >
        <option value="">{placeholder}</option>
        {tags.map((tag) => (
          <option key={tag} value={tag} className="bg-background text-foreground">
            {tag}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className={`absolute right-2.5 pointer-events-none ${
          selected ? "text-primary-foreground/70" : "text-muted-foreground/50"
        }`}
      />
    </div>
  );
}
