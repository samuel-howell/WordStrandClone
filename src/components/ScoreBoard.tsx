import React from 'react';
import { Trophy, Lightbulb } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

export const ScoreBoard: React.FC = () => {
  const { score, hints, foundWords, theme } = useGameStore();

  return (
    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <span className="text-2xl font-bold text-white">{score}</span>
        </div>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-400" />
          <span className="text-xl font-medium text-white">{hints}</span>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-white/80">Found Words:</h3>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {foundWords.map((word) => (
              <motion.span
                key={word}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`px-3 py-1 rounded-full text-white ${
                  word === theme.spangram 
                    ? 'bg-gradient-to-r from-purple-500/50 to-pink-500/50 font-bold' 
                    : 'bg-purple-500/20'
                }`}
              >
                {word}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};