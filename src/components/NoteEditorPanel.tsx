import { SlidersHorizontal, Trash2 } from "lucide-react";
import { useGhostStore } from "../app/store";

export function NoteEditorPanel() {
  const { activePattern, selectedNote, updateSelectedNote, deleteSelectedNote } = useGhostStore();
  const track = selectedNote
    ? activePattern.tracks.find((candidate) => candidate.id === selectedNote.trackId)
    : undefined;
  const note = track?.notes.find((candidate) => candidate.id === selectedNote?.noteId);

  return (
    <section className="note-panel">
      <h2>
        <SlidersHorizontal size={16} />
        Note
      </h2>
      {!track || !note ? (
        <p>Select a step to edit velocity, probability, pitch, and length.</p>
      ) : (
        <>
          <div className="note-target">
            <strong>{track.name}</strong>
            <span>Step {note.step + 1}</span>
          </div>
          <label>
            Velocity {Math.round(note.velocity * 127)}
            <input
              type="range"
              min="1"
              max="127"
              value={Math.round(note.velocity * 127)}
              onChange={(event) =>
                updateSelectedNote({ velocity: Number(event.target.value) / 127 })
              }
            />
          </label>
          <label>
            Probability {Math.round(note.probability * 100)}%
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(note.probability * 100)}
              onChange={(event) =>
                updateSelectedNote({ probability: Number(event.target.value) / 100 })
              }
            />
          </label>
          <div className="note-number-grid">
            <label>
              Pitch
              <input
                type="number"
                min="0"
                max="127"
                value={note.pitch}
                onChange={(event) => updateSelectedNote({ pitch: Number(event.target.value) })}
              />
            </label>
            <label>
              Length
              <input
                type="number"
                min="1"
                max={activePattern.length}
                value={note.duration}
                onChange={(event) => updateSelectedNote({ duration: Number(event.target.value) })}
              />
            </label>
          </div>
          <label>
            Timing {Math.round((note.microTiming ?? 0) * 100)}
            <input
              type="range"
              min="-45"
              max="45"
              value={Math.round((note.microTiming ?? 0) * 100)}
              onChange={(event) =>
                updateSelectedNote({ microTiming: Number(event.target.value) / 100 })
              }
            />
          </label>
          <button className="delete-note" onClick={deleteSelectedNote}>
            <Trash2 size={15} />
            Delete
          </button>
        </>
      )}
    </section>
  );
}
