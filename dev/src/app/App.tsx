import { useState, useRef, useEffect } from "react";
import { StickyNote, Note } from "./components/StickyNote";
import { Plus } from "lucide-react";
import LZString from "lz-string";
// const LZString = {
//   decompressFromBase64: () => "",
//   compressToBase64: () => "",
// };
const COLORS = [
  "bg-yellow-600",
  "bg-blue-600",
  "bg-green-600",
  "bg-pink-600",
  "bg-purple-600",
  "bg-orange-600",
];
const DEFAULT_COLOR = "bg-slate-800";
function App() {
  // const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartPos = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [notes, setNotes] = useState<Note[]>([
    {
      id: "0",
      title: "Welcome",
      input: `_This is your first programmable sticky note._

Add more notes with the **+** button in the bottom right.
**Edit**, **copy**, or **delete** any note.

With the editor you can write a small script in a **lisp** that transforms your input into a result.

You can use **markdown**, too!

Here are some numbers:
1 2 3 4 5 6

`,
      code: `; You can write Que Script 
; and compute your note content!
(|> INPUT ; take input
  (String->Vector nl) ; split by new line
  (exclude empty?) ; remove empty lines
  (take/last 1) ; take the last one (the numbers)
  first ; single item in vector 
  ; "1 2 3 4 5 6"
  (String->Vector ' ') ; split  by spaces
  (map String->Integer) ; convert to integers
  sum) ; sum them up`,
      color: DEFAULT_COLOR,
      position: { x: 50, y: 50 },
    },
  ]);

  useEffect(() => {
    const stored: Note[] = [];
    for (const sticky in localStorage) {
      const id = sticky.split("sticky-")[1];
      if (!id) continue;
      const item = localStorage.getItem(sticky);
      if (item) stored.push(JSON.parse(LZString.decompressFromBase64(item)));
    }
    if (stored.length) setNotes(stored);
  }, []);

  // Detect mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSave = (note) =>
    localStorage.setItem(
      `sticky-${note.id}`,
      LZString.compressToBase64(JSON.stringify(note))
    );
  const handleUpdate = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...updates } : note))
    );
  };
  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
    localStorage.removeItem(`sticky-${id}`);
  };

  const handleDuplicate = (id: string) => {
    const noteToDuplicate = notes.find((note) => note.id === id);
    if (noteToDuplicate) {
      const newNote: Note = {
        ...noteToDuplicate,
        id: Date.now().toString(),
        position: {
          x: noteToDuplicate.position.x + 30,
          y: noteToDuplicate.position.y + 30,
        },
      };
      setNotes((prev) => [...prev, newNote]);
      handleSave(newNote);
    }
  };

  const handleDragStart = (id: string) => {
    setNotes((prev) => {
      const noteIndex = prev.findIndex((n) => n.id === id);
      if (noteIndex === -1) return prev;
      const note = prev[noteIndex];
      return [...prev.filter((n) => n.id !== id), note];
    });
  };

  const handleDragEnd = (id: string, position: { x: number; y: number }) => {
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id === id) {
          const updated = { ...note, position };
          handleSave(updated);
          return updated;
        }
        return note;
      })
    );
  };

  const handleCreateNote = () => {
    // const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const randomColor = DEFAULT_COLOR;
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled",
      input: "",
      code: "INPUT",
      color: randomColor,
      position: {
        x: 50 + Math.random() * 300 - pan.x,
        y: 50 + Math.random() * 200 - pan.y,
      },
    };
    setNotes((prev) => [...prev, newNote]);
    handleSave(newNote);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking on the canvas background, not on notes
    if (e.target === canvasRef.current) {
      setIsPanning(true);
      panStartPos.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const newX = e.clientX - panStartPos.current.x;
        const newY = e.clientY - panStartPos.current.y;
        setPan({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    if (isPanning) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 overflow-hidden">
      {/* Share button - Top Left */}
      {/* <button
        onClick={() => {
          // User will implement share logic
        }}
        className="fixed top-8 left-8 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-100 shadow-lg transition-colors z-50"
        title="Share"
      >
        <Share2 className="w-5 h-5" />
      </button> */}

      {/* Notes Board */}
      {isMobile ? (
        // Mobile/Tablet: Vertical scrollable grid
        <div className="min-h-screen overflow-y-auto pb-24">
          <div className="grid grid-cols-1 gap-6 p-6 max-w-7xl mx-auto">
            {notes.map((note) => (
              <StickyNote
                key={note.id}
                note={note}
                onUpdate={handleUpdate}
                onSave={handleSave}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                pan={pan}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      ) : (
        // Desktop: Infinite canvas
        <div className="relative" style={{ minHeight: "100vh" }}>
          <div
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            className="relative"
            style={{
              width: "100%",
              height: "calc(100vh - 160px)",
              cursor: isPanning ? "grabbing" : "grab",
            }}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px))`,
                transformOrigin: "0 0",
                width: "100%",
                height: "100%",
                position: "relative",
              }}
            >
              {notes.map((note) => (
                <StickyNote
                  key={note.id}
                  note={note}
                  onUpdate={handleUpdate}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  pan={pan}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Create Button */}
      <button
        onClick={handleCreateNote}
        className="fixed bottom-8 right-8 p-4 rounded-full bg-indigo-600 hover:bg-indigo-600 text-white shadow-2xl transition-all hover:scale-110 z-50"
        title="Create new note"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}

export default App;
