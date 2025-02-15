import React from 'react';
import { GameBoard } from './components/GameBoard';
import { ScoreBoard } from './components/ScoreBoard';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Word Strands
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GameBoard />
          <ScoreBoard />
        </div>
      </div>
    </div>
  );
}

export default App;