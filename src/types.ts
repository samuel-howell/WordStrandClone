export interface Letter {
  id: string;
  char: string;
  isSelected: boolean;
  selectionOrder: number | null;
  position: {
    row: number;
    col: number;
  };
}

export interface Theme {
  id: string;
  name: string;
  words: string[];
  spangram: string;
  hint: string;
}

export interface GameState {
  letters: Letter[][];
  theme: Theme;
  foundWords: string[];
  score: number;
  hints: number;
  isGameOver: boolean;
}