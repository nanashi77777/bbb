
import React from 'react';
import { Tile, TileType, Player } from '../types';

interface TileProps {
  tile: Tile;
  playersOnTile: Player[];
  isCurrentTarget: boolean;
  owner?: Player; // Add owner prop
  onClick?: () => void;
}

const TileComponent: React.FC<TileProps> = ({ tile, playersOnTile, isCurrentTarget, owner, onClick }) => {
  const isProperty = tile.type === TileType.PROPERTY;
  
  // Use owner from props instead of deriving from playersOnTile
  const ownerColor = owner ? owner.color : undefined;
  
  const borderColor = isProperty && tile.data ? tile.data.color : '#e5e7eb';
  const bgColor = ownerColor ? ownerColor : 'white';
  const textColor = ownerColor ? 'text-white' : 'text-gray-800';

  return (
    <div 
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-between
        w-14 h-16 m-0.5 p-0.5 rounded-[4px] shadow-sm transition-all duration-300
        ${isCurrentTarget ? 'ring-2 ring-yellow-400 scale-125 z-50' : 'scale-100 cursor-pointer hover:scale-110 hover:z-20'}
      `}
      style={{
        backgroundColor: tile.isMortgaged ? '#9ca3af' : bgColor, // Grey if mortgaged
        borderWidth: '1px',
        borderColor: borderColor,
        borderTopWidth: isProperty ? '4px' : '1px',
      }}
    >
      {isProperty && tile.data && (
        <div 
          className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full border border-white shadow-sm"
          style={{ backgroundColor: tile.data.color }}
        />
      )}
      
      {tile.isMortgaged && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-[4px] pointer-events-none">
            <span className="text-red-500 font-bold text-lg -rotate-45 border-2 border-red-500 px-1 rounded bg-white/80">抵押</span>
         </div>
      )}

      <div className={`mt-0.5 text-center text-[7px] font-bold leading-tight ${textColor} break-words w-full px-0.5 overflow-hidden h-5 flex items-center justify-center`}>
        {tile.name}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Stars for Level */}
        {isProperty && tile.level > 0 && (
          <div className="flex flex-wrap justify-center gap-0.5 mb-0.5">
            {Array.from({ length: tile.level }).map((_, i) => (
              <span key={i} className="text-yellow-400 text-[5px] shadow-sm filter drop-shadow-sm">⭐</span>
            ))}
          </div>
        )}

        {tile.type === TileType.START && <span className="text-sm">🏁</span>}
        {tile.type === TileType.EVENT && <span className="text-sm">❓</span>}
        {tile.type === TileType.REWARD && <span className="text-sm">💎</span>}
        {tile.type === TileType.PROPERTY && !tile.ownerId && (
          <div className="text-[6px] text-gray-500 bg-white/80 px-1 rounded shadow-sm scale-90">
            ${tile.data?.price}
          </div>
        )}
         {tile.type === TileType.PROPERTY && tile.ownerId && (
          <div className={`text-[6px] ${textColor} font-semibold opacity-90`}>
             {tile.level === 0 ? '空地' : `LV${tile.level}`}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-0.5 w-full mb-0.5 min-h-[10px]">
        {playersOnTile.map((p) => (
          <div 
            key={p.id}
            className={`w-2.5 h-2.5 rounded-full border border-white shadow-sm flex items-center justify-center text-[5px] font-bold text-white ${!p.isOnline ? 'opacity-50' : ''}`}
            style={{ backgroundColor: p.color }}
            title={`${p.name} ${!p.isOnline ? '(离线)' : ''}`}
          >
            {p.name.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TileComponent;
