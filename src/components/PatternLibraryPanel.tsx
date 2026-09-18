import { Copy, FilePlus, Save, Trash2 } from "lucide-react";
import { useGhostStore } from "../app/store";

export function PatternLibraryPanel() {
  const {
    library,
    activePattern,
    isDirty,
    setActivePattern,
    createPattern,
    duplicateActivePattern,
    renameActivePattern,
    deleteActivePattern,
    saveActivePattern,
  } = useGhostStore();
  const dirty = isDirty();

  const rename = () => {
    const nextName = window.prompt("Pattern name", activePattern.name);
    if (nextName !== null) {
      renameActivePattern(nextName);
    }
  };

  const remove = () => {
    const confirmed = window.confirm(`Delete "${activePattern.name}"?`);
    if (confirmed) {
      deleteActivePattern();
    }
  };

  return (
    <section className="library-panel">
      <div className="library-heading">
        <h2>Patterns</h2>
        <span className={dirty ? "dirty" : ""}>{dirty ? "Unsaved" : "Saved"}</span>
      </div>
      <select
        value={activePattern.id}
        onChange={(event) => setActivePattern(event.target.value)}
        title="Pattern library"
      >
        {library.patterns.map((pattern) => (
          <option key={pattern.id} value={pattern.id}>
            {pattern.name}
          </option>
        ))}
      </select>
      <div className="library-actions">
        <button className={dirty ? "save-dirty" : ""} onClick={saveActivePattern} title="Save pattern">
          <Save size={15} />
        </button>
        <button onClick={createPattern} title="New pattern">
          <FilePlus size={15} />
        </button>
        <button onClick={duplicateActivePattern} title="Duplicate pattern">
          <Copy size={15} />
        </button>
        <button onClick={rename} title="Rename pattern">
          Rename
        </button>
        <button onClick={remove} title="Delete pattern">
          <Trash2 size={15} />
        </button>
      </div>
    </section>
  );
}
