import { useState, useEffect, useRef } from "react";
import { Pencil, Copy, Trash2, Check, X, Share2 } from "lucide-react";
import CodeEditor from "./CodeEditor";
import LZString from "lz-string";
import MarkDown from "react-markdown";

export interface Note {
  id: string;
  input: string;
  code: string;
  color: string;
  position: { x: number; y: number };
}

interface StickyNoteProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onSave: (note: Note) => void;
  onDuplicate: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string, position: { x: number; y: number }) => void;
  pan: { x: number; y: number };
}

export function StickyNote({
  note,
  onUpdate,
  onSave,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragEnd,
  pan,
}: StickyNoteProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [localInput, setLocalInput] = useState(note.input);
  const [localCode, setLocalCode] = useState(note.code);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartMousePos = useRef({ x: 0, y: 0 });
  const dragStartNotePos = useRef({ x: 0, y: 0 });

  const handleEditClick = () => {
    setLocalInput(note.input);
    setLocalCode(note.code);
    setIsEditMode(true);
  };
  const handleShareClick = () => {
    window.open(
      `https://at-290690.github.io/rust-lisp/playground/?r=t&l=${encodeURIComponent(
        LZString.compressToBase64(`(let INPUT "${note.input}") ${note.code}`)
      )}`
    );
  };
  const handleSave = () => {
    onUpdate(note.id, {
      input: localInput,
      code: localCode,
    });
    onSave({ ...note, input: localInput, code: localCode });
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setLocalInput(note.input);
    setLocalCode(note.code);
    setIsEditMode(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditMode) return;
    if ((e.target as HTMLElement).closest("button")) return;

    setIsDragging(true);
    dragStartMousePos.current = { x: e.clientX, y: e.clientY };
    dragStartNotePos.current = {
      x: note.position.x,
      y: note.position.y,
    };
    onDragStart(note.id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Calculate mouse delta in screen space
        const deltaX = e.clientX - dragStartMousePos.current.x;
        const deltaY = e.clientY - dragStartMousePos.current.y;

        // Apply delta to original note position
        const newX = dragStartNotePos.current.x + deltaX;
        const newY = dragStartNotePos.current.y + deltaY;

        onDragEnd(note.id, { x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, note.id, onDragEnd]);

  return (
    <div
      style={{
        position: "absolute",
        left: note.position.x,
        top: note.position.y,
        cursor: isEditMode ? "default" : isDragging ? "grabbing" : "grab",
        zIndex: isDragging ? 1000 : isEditMode ? 999 : 1,
      }}
      onMouseDown={handleMouseDown}
      className="touch-none"
    >
      {!isEditMode ? (
        <div className={`${note.color} shadow-lg p-6 w-72 relative`}>
          {/* Input area - non-editable in view mode */}
          <div className="mb-4">
            <div
              className="w-full whitespace-pre-wrap select-none"
              style={{ fontSize: "15px", lineHeight: "1.5" }}
            >
              <MarkDown>{note.input || ""}</MarkDown>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/20 mb-4"></div>

          {/* Output preview */}
          <div className="mb-8">
            {/* <div
              className="font-medium whitespace-pre-wrap select-none"
              style={{ fontSize: "15px", lineHeight: "1.5" }}
            >
              {<span>No output yet</span>}
            </div> */}
          </div>

          {/* Action buttons */}
          <div
            className={`absolute bottom-4 right-4 flex gap-2 transition-opacity`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick();
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 shadow-sm transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(note.id);
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 shadow-sm transition-colors"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShareClick();
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 shadow-sm transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 shadow-sm transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className={`${note.color} shadow-2xl p-6 w-100 relative`}>
          {/* Action buttons */}
          <div className="mb-4 flex gap-2 justify-start">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-medium transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-medium transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
          {/* Input section */}

          <div className="mb-4">
            <label className="block text-xs font-medium mb-2 uppercase tracking-wide">
              Input
            </label>
            <textarea
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              className="w-full bg-white/10 rounded-lg border border-white/20 p-3 outline-none resize-none focus:border-white/40"
              placeholder="Enter your data..."
              rows={3}
              style={{ fontSize: "14px" }}
            />
          </div>

          {/* Code editor */}
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2 uppercase tracking-wide">
              Code
            </label>

            <CodeEditor
              initial={localCode}
              input={localInput}
              setCode={(code) => setLocalCode(code)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
