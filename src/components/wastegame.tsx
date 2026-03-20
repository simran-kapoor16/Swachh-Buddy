import React, { useState, useRef, useEffect } from "react";

const words = [
  "GLASS", "PLASTIC", "COMPOST", "MANURE", "BIN",
  "PAPER", "EWASTE", "RECYCLING", "ORGANIC", "SEGREGATE",
];

const gridSize = 15;

const generateEmptyGrid = (): string[][] =>
  Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    )
  );

const placeWord = (grid: string[][], word: string) => {
  const direction = Math.random() > 0.5 ? "H" : "V";
  if (direction === "H") {
    const row = Math.floor(Math.random() * gridSize);
    const col = Math.floor(Math.random() * (gridSize - word.length));
    for (let i = 0; i < word.length; i++) grid[row][col + i] = word[i];
  } else {
    const row = Math.floor(Math.random() * (gridSize - word.length));
    const col = Math.floor(Math.random() * gridSize);
    for (let i = 0; i < word.length; i++) grid[row + i][col] = word[i];
  }
};

interface Position { row: number; col: number; }

const WordSearch: React.FC = () => {
  const [grid] = useState(() => {
    const g = generateEmptyGrid();
    words.forEach((w) => placeWord(g, w.toUpperCase()));
    return g;
  });

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selection, setSelection] = useState<Position[]>([]);
  const isSelecting = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // ✅ Responsive cell size — fits any screen
  const [cellSize, setCellSize] = useState(35);

  useEffect(() => {
    const updateCellSize = () => {
      const screenW = window.innerWidth;
      // padding: 32px each side = 64px, border gaps = ~20px
      const available = Math.min(screenW - 48, 520);
      const size = Math.floor(available / gridSize);
      setCellSize(Math.max(18, Math.min(35, size)));
    };
    updateCellSize();
    window.addEventListener("resize", updateCellSize);
    return () => window.removeEventListener("resize", updateCellSize);
  }, []);

  // Get row/col from touch position
  const getTouchCell = (touch: React.Touch): Position | null => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      return { row, col };
    }
    return null;
  };

  const startSelection = (row: number, col: number) => {
    isSelecting.current = true;
    setSelection([{ row, col }]);
  };

  const extendSelection = (row: number, col: number) => {
    if (!isSelecting.current) return;
    setSelection((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.row !== row || last.col !== col) {
        return [...prev, { row, col }];
      }
      return prev;
    });
  };

  const endSelection = () => {
    if (selection.length >= 2) {
      const selectedWord = selection.map((pos) => grid[pos.row][pos.col]).join("");
      const reversedWord = selectedWord.split("").reverse().join("");
      if (words.includes(selectedWord) && !foundWords.includes(selectedWord)) {
        setFoundWords((prev) => [...prev, selectedWord]);
      } else if (words.includes(reversedWord) && !foundWords.includes(reversedWord)) {
        setFoundWords((prev) => [...prev, reversedWord]);
      }
    }
    setSelection([]);
    isSelecting.current = false;
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const cell = getTouchCell(e.touches[0]);
    if (cell) startSelection(cell.row, cell.col);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const cell = getTouchCell(e.touches[0]);
    if (cell) extendSelection(cell.row, cell.col);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    endSelection();
  };

  const isSelected = (row: number, col: number) =>
    selection.some((pos) => pos.row === row && pos.col === col);

  const isFound = (row: number, col: number) => {
    for (const word of foundWords) {
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (grid[r][c] === word[0]) {
            if (
              c + word.length <= gridSize &&
              word === grid[r].slice(c, c + word.length).join("")
            )
              if (row === r && col >= c && col < c + word.length) return true;
            if (
              r + word.length <= gridSize &&
              word === Array.from({ length: word.length }, (_, i) => grid[r + i][c]).join("")
            )
              if (col === c && row >= r && row < r + word.length) return true;
          }
        }
      }
    }
    return false;
  };

  const fontSize = Math.max(10, cellSize - 14);

  return (
    <div className="flex flex-col items-center w-full p-4 md:p-6 bg-green-50 dark:bg-green-950 rounded-xl select-none">
      <h2 className="text-lg md:text-2xl font-bold text-green-800 dark:text-green-200 mb-1 text-center">
        🌱 Waste Segregation Word Search 🌱
      </h2>
      <p className="text-xs md:text-sm text-green-600 dark:text-green-400 mb-4 text-center">
        📱 Drag to select words • Find all {words.length} words!
      </p>

      {/* Progress */}
      <div className="mb-3 text-sm font-semibold text-green-700 dark:text-green-300">
        {foundWords.length}/{words.length} words found
        {foundWords.length === words.length && (
          <span className="ml-2 text-green-500">🎉 You found them all!</span>
        )}
      </div>

      {/* Grid — touch + mouse support */}
      <div
        ref={gridRef}
        className="inline-block cursor-pointer touch-none"
        style={{ boxShadow: "0 0 20px rgba(0,128,0,0.2)", borderRadius: 8, overflow: "hidden" }}
        onMouseLeave={() => { setSelection([]); isSelecting.current = false; }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {grid.map((rowArr, rowIdx) => (
          <div key={rowIdx} style={{ display: "flex" }}>
            {rowArr.map((letter, colIdx) => (
              <div
                key={colIdx}
                style={{
                  width: cellSize,
                  height: cellSize,
                  border: "1px solid #4caf50",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: fontSize,
                  cursor: "pointer",
                  transition: "background 0.15s",
                  backgroundColor: isFound(rowIdx, colIdx)
                    ? "#4caf50"
                    : isSelected(rowIdx, colIdx)
                    ? "#a5d6a7"
                    : "#f0fff0",
                  color: isFound(rowIdx, colIdx) ? "white" : "#1a1a1a",
                  userSelect: "none",
                }}
                onMouseDown={() => startSelection(rowIdx, colIdx)}
                onMouseEnter={() => extendSelection(rowIdx, colIdx)}
                onMouseUp={endSelection}
              >
                {letter}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Word list — 2 columns on mobile */}
      <div className="mt-5 w-full max-w-sm">
        <h3 className="font-bold text-green-800 dark:text-green-200 mb-2 text-sm md:text-base text-center">
          Find these words:
        </h3>
        <div className="grid grid-cols-2 gap-1">
          {words.map((word) => (
            <div
              key={word}
              className={`text-sm md:text-base font-bold px-2 py-1 rounded text-center transition-all ${
                foundWords.includes(word)
                  ? "line-through text-green-500 bg-green-100 dark:bg-green-900"
                  : "text-green-800 dark:text-green-300 bg-white/50 dark:bg-white/10"
              }`}
            >
              {foundWords.includes(word) ? "✅ " : ""}{word}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WordSearch;
