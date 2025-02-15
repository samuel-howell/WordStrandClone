import React, { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import useSound from 'use-sound';

export const GameBoard: React.FC = () => {
  const { letters, selectLetter, submitWord, clearSelection, theme, foundWords } = useGameStore();
  const [playSelect] = useSound('/sounds/select.mp3', { volume: 0.5 });
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.5 });
  const [playError] = useSound('/sounds/error.mp3', { volume: 0.3 });

  const handleLetterClick = (row: number, col: number) => {
    selectLetter(row, col);
    playSelect();
  };

  const isValidEnglishWord = async (word: string): Promise<boolean> => {
    try {
      console.log(`Validating word: ${word}`);
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (response.ok) {
        // The word exists if we get a valid JSON response.
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error validating word:', error);
      return false;
    }
  };

  const handleSubmit = useCallback(async () => {
    // Get the current word
    const selectedLetters = letters
      .flat()
      .filter(l => l.isSelected)
      .sort((a, b) => a.selectionOrder! - b.selectionOrder!);
    const currentWord = selectedLetters.map(l => l.char).join('');
    
    if (await isValidEnglishWord(currentWord)) {
      submitWord();
    } else {
      // Handle invalid word (e.g., show an error message)
      console.error(`The word "${currentWord}" is not a valid English word.`);
    }
  }, [letters, submitWord]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      clearSelection();
    }
  }, [handleSubmit, clearSelection]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const selectedLetters = letters
    .flat()
    .filter(l => l.isSelected)
    .sort((a, b) => a.selectionOrder! - b.selectionOrder!);
    
  const currentWord = selectedLetters.map(l => l.char).join('');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2 p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg backdrop-blur-sm">
        {letters.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((letter, colIndex) => (
              <motion.button
                key={letter.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold 
                  ${
                    letter.isSelected
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }
                  transition-colors duration-200 ease-in-out relative`}
                onClick={() => handleLetterClick(rowIndex, colIndex)}
              >
                {letter.char}
                {letter.isSelected && (
                  <span className="absolute top-1 right-1 text-xs bg-white/20 rounded-full w-5 h-5 flex items-center justify-center">
                    {letter.selectionOrder! + 1}
                  </span>
                )}
              </motion.button>
            ))}
          </React.Fragment>
        ))}
      </div>
      
      <AnimatePresence>
        {currentWord && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex justify-between items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm"
          >
            <span className="text-2xl font-bold text-white">{currentWord}</span>
            <div className="space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearSelection}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg transition-colors"
              >
                Clear
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-white rounded-lg transition-colors"
              >
                Submit
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};