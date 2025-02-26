import { create } from "zustand";
import { GameState, Letter, Theme } from "../types";

interface AIResponse {
  theme: Theme;
  grid: string[][];
}

const refreshThemeAndLetters = async (set: any) => {
  try {
    const { theme, grid } = await fetchThemeAndLetters();
    const letterGrid = grid.map((row, rowIndex) =>
      row.map((char, colIndex) => ({
        id: `${rowIndex}-${colIndex}`,
        char,
        isSelected: false,
        selectionOrder: null,
        position: { row: rowIndex, col: colIndex },
      }))
    );
    set({
      theme,
      letters: letterGrid,
    });
  } catch (error) {
    console.error("Error refreshing theme and letters:", error);
  }
};

const fetchThemeAndLetters = async (): Promise<AIResponse> => {
  console.log("Fetching theme and letters from AI...");
  console.log("OpenAI API key:", import.meta.env.VITE_OPENAI_API_KEY);
  const prompt = `
Generate a JSON object with two keys:
1. "theme": an object with fields "id", "name", "words" (an array of at least 4 valid color/noun words in uppercase), "spangram", and "hint".
2. "grid": a double array (2D array) of uppercase letters arranged as a grid, such that at least 10 valid English words can be formed.
Return only valid JSON.
  `;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });
  const data = await response.json();
  const jsonString = data.choices[0].message.content;
  try {
    const parsed: AIResponse = JSON.parse(jsonString);
    console.log("Parsed JSON from AI response:", parsed);
    return parsed;
  } catch (e) {
    console.error("Error parsing JSON from AI response:", e);
    throw e;
  }
};
const sampleTheme: Theme = {
  id: "colors",
  name: "Colors",
  words: ["RED", "BLUE", "GREEN", "YELLOW"],
  spangram: "RAINBOW",
  hint: "Look for things that brighten our world",
};

const createInitialLetters = (): Letter[][] => {
  const grid = [
    ["R", "A", "I", "N"],
    ["B", "L", "U", "E"],
    ["O", "W", "G", "D"],
    ["Y", "E", "R", "N"],
  ];

  return grid.map((row, rowIndex) =>
    row.map((char, colIndex) => ({
      id: `${rowIndex}-${colIndex}`,
      char,
      isSelected: false,
      selectionOrder: null,
      position: { row: rowIndex, col: colIndex },
    }))
  );
};

const isAdjacent = (
  pos1: { row: number; col: number },
  pos2: { row: number; col: number }
): boolean => {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
};

const areLettersConnected = (letters: Letter[]): boolean => {
  if (letters.length <= 1) return true;

  const isConnected = (index: number, visited: Set<string>): boolean => {
    if (index === letters.length) return true;

    const current = letters[index];
    visited.add(current.id);

    for (let i = 0; i < letters.length; i++) {
      const next = letters[i];
      if (
        !visited.has(next.id) &&
        isAdjacent(current.position, next.position)
      ) {
        if (isConnected(i, visited)) return true;
      }
    }

    visited.delete(current.id);
    return false;
  };

  return isConnected(0, new Set<string>());
};

interface GameStore extends GameState {
  selectLetter: (row: number, col: number) => void;
  submitWord: () => void;
  useHint: () => void;
  resetGame: () => void;
  clearSelection: () => void;
  refreshThemeAndLetters: () => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  letters: createInitialLetters(),
  theme: sampleTheme,
  foundWords: [],
  score: 0,
  hints: 3,
  isGameOver: false,

  selectLetter: (row: number, col: number) =>
    set((state) => {
      const newLetters = [...state.letters.map((row) => [...row])];
      const letter = newLetters[row][col];

      // If letter is already selected, remove it and all subsequent selections
      if (letter.isSelected) {
        const currentOrder = letter.selectionOrder;
        newLetters.forEach((row) =>
          row.forEach((l) => {
            if (
              l.selectionOrder !== null &&
              l.selectionOrder >= currentOrder!
            ) {
              l.isSelected = false;
              l.selectionOrder = null;
            }
          })
        );
        return { letters: newLetters };
      }

      // Get currently selected letters
      const selectedLetters = newLetters
        .flat()
        .filter((l) => l.isSelected)
        .sort((a, b) => (a.selectionOrder ?? 0) - (b.selectionOrder ?? 0));

      // If no letters are selected or the new letter is adjacent to the last selected letter
      if (
        selectedLetters.length === 0 ||
        (selectedLetters.length > 0 &&
          isAdjacent(selectedLetters[selectedLetters.length - 1].position, {
            row,
            col,
          }))
      ) {
        letter.isSelected = true;
        letter.selectionOrder = selectedLetters.length;
        return { letters: newLetters };
      }

      return state;
    }),

  refreshThemeAndLetters: async () => {
    await refreshThemeAndLetters(set);
  },

  submitWord: () =>
    set((state) => {
      const selectedLetters = state.letters
        .flat()
        .filter((l) => l.isSelected)
        .sort((a, b) => (a.selectionOrder ?? 0) - (b.selectionOrder ?? 0));

      if (selectedLetters.length === 0) {
        return state;
      }

      const word = selectedLetters.map((l) => l.char).join("");

      // Clear selection regardless of validity
      const newLetters = state.letters.map((row) =>
        row.map((letter) => ({
          ...letter,
          isSelected: false,
          selectionOrder: null,
        }))
      );

      // Check if word is valid and not already found
      if (
        (state.theme.words.includes(word) || word === state.theme.spangram) &&
        !state.foundWords.includes(word)
      ) {
        const scoreIncrease =
          word === state.theme.spangram ? 50 : word.length * 10;

        return {
          letters: newLetters,
          foundWords: [...state.foundWords, word],
          score: state.score + scoreIncrease,
        };
      }

      return {
        ...state,
        letters: newLetters,
      };
    }),

  clearSelection: () =>
    set((state) => ({
      letters: state.letters.map((row) =>
        row.map((letter) => ({
          ...letter,
          isSelected: false,
          selectionOrder: null,
        }))
      ),
    })),

  useHint: () =>
    set((state) => ({
      hints: state.hints - 1,
    })),

  resetGame: () =>
    set({
      letters: createInitialLetters(),
      foundWords: [],
      score: 0,
      hints: 3,
      isGameOver: false,
    }),
}));
