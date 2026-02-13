
import React from 'react';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  isCurrentTurn: boolean;
  rank: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, isCurrentTurn, rank }) => {
  // Rank colors
  const getRankStyle = (r: number) => {
    if (r === 1) return "text-yellow-500 bg-yellow-100 border-yellow-200";
    if (r === 2) return "text-gray-500 bg-gray-200 border-gray-300";
    if (r === 3) return "text-amber-700 bg-orange-100 border-orange-200";
    return "text-gray-400 bg-gray-100";
  };

  return (
    <div 
      className={`
        flex items-center p-3 mb-3 rounded-lg shadow-sm border-l-4 transition-all relative
        ${isCurrentTurn ? 'bg-white scale-105 shadow-md z-10' : 'bg-gray-50 opacity-95'}
        ${!player.isOnline ? 'grayscale opacity-60' : ''}
      `}
      style={{ borderLeftColor: player.color }}
    >
      {/* Rank Badge */}
      <div className={`
        absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center 
        text-xs font-black border shadow-sm z-20 ${getRankStyle(rank)}
      `}>
        {rank}
      </div>

      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner mr-3 relative shrink-0"
        style={{ backgroundColor: player.color }}
      >
        {player.name.charAt(0).toUpperCase()}
        {!player.isOnline && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-500 rounded-full border-2 border-white"></div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-gray-800 truncate text-sm flex items-center gap-2">
            {player.name}
            {player.isDefeated && <span className="text-[10px] text-red-600 bg-red-100 px-1 rounded">破产</span>}
          </span>
          {isCurrentTurn && player.isOnline && <span className="text-[10px] text-blue-500 font-semibold animate-pulse">思考中...</span>}
        </div>
        
        <div className="flex justify-between items-end">
           <div>
             <div className="text-[10px] text-gray-400 uppercase leading-none">Cash</div>
             <div className="text-green-600 font-mono font-bold text-sm leading-tight">
               ${player.balance.toLocaleString()}
             </div>
           </div>
           <div className="text-right">
             <div className="text-[10px] text-gray-400 uppercase leading-none">Assets</div>
             <div className="text-indigo-600 font-mono font-bold text-sm leading-tight">
               ${player.totalAssets.toLocaleString()}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
