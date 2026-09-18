import { Sparkles } from "lucide-react";

interface GhostButtonProps {
  onClick(): void;
}

export function GhostButton({ onClick }: GhostButtonProps) {
  return (
    <button className="ghost-button" onClick={onClick} title="Generate variations">
      <Sparkles size={18} />
      <span>GHOST</span>
    </button>
  );
}
