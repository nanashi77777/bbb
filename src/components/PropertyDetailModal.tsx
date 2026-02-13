
import React from 'react';
import { Tile, Player, TileType } from '../types';
import { calculateMortgageValue, calculateRedemptionCost } from '../utils/gameLogic';

interface PropertyDetailModalProps {
  tile: Tile;
  owner?: Player;
  currentUser: Player | undefined; // To check if viewer is owner
  onClose: () => void;
  onMortgage: () => void;
}

const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ 
  tile, 
  owner, 
  currentUser, 
  onClose,
  onMortgage
}) => {
  if (tile.type !== TileType.PROPERTY || !tile.data) return null;

  const isOwner = currentUser?.id === tile.ownerId;
  const mortgageValue = calculateMortgageValue(tile);
  const redeemCost = calculateRedemptionCost(tile);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border-4" style={{ borderColor: tile.data.color }}>
        {/* Header */}
        <div className="p-4 text-white text-center font-bold text-2xl relative" style={{ backgroundColor: tile.data.color }}>
          {tile.name}
          <button 
             onClick={onClose}
             className="absolute right-3 top-3 bg-black/20 hover:bg-black/30 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Status Badge */}
          <div className="flex justify-center">
             {tile.isMortgaged ? (
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold text-sm">已抵押</span>
             ) : (
                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full font-bold text-sm">正常运营中</span>
             )}
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
             <div className="bg-gray-50 p-2 rounded-lg">
               <div className="text-xs text-gray-500">购买价格</div>
               <div className="font-bold text-gray-800">${tile.data.price}</div>
             </div>
             <div className="bg-gray-50 p-2 rounded-lg">
               <div className="text-xs text-gray-500">升级费用</div>
               <div className="font-bold text-gray-800">${tile.data.upgradeCost}</div>
             </div>
          </div>

          {/* Rent Table */}
          <div className="border rounded-lg overflow-hidden text-sm">
             <div className="bg-gray-100 px-3 py-2 font-bold text-center border-b">过路费表</div>
             <div className="divide-y">
                <div className={`flex justify-between px-4 py-1.5 ${tile.level === 0 ? 'bg-indigo-50 font-bold text-indigo-700' : 'hover:bg-gray-50'}`}>
                  <span>空地 {tile.level === 0 && '(当前)'}</span>
                  <span>${tile.data.baseRent}</span>
                </div>
                {[1,2,3,4,5].map(lvl => (
                  <div key={lvl} className={`flex justify-between px-4 py-1.5 ${tile.level === lvl ? 'bg-indigo-50 font-bold text-indigo-700' : 'hover:bg-gray-50'}`}>
                    <span>LV{lvl} {lvl === tile.level && '(当前)'}</span>
                    <span>${tile.data!.baseRent + tile.data!.rentIncreasePerLevel * lvl}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div className="pt-2 border-t mt-2">
               {tile.isMortgaged ? (
                 <div className="space-y-2">
                   <p className="text-xs text-center text-gray-500">赎回将花费: <span className="font-bold text-gray-800">${redeemCost}</span></p>
                   <div className="w-full bg-gray-100 text-gray-500 font-bold py-2 rounded-lg text-center text-xs">
                     只有踩中该地块时才能赎回
                   </div>
                 </div>
               ) : (
                 <div className="space-y-2">
                   <p className="text-xs text-center text-gray-500">抵押可获得: <span className="font-bold text-gray-800">${mortgageValue}</span></p>
                   <button 
                     onClick={onMortgage}
                     className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg shadow-md transition"
                   >
                     抵押地产
                   </button>
                 </div>
               )}
            </div>
          )}
          
          {!isOwner && tile.ownerId && (
             <div className="text-center text-sm text-gray-500">
                拥有者: <span className="font-bold" style={{ color: owner?.color }}>{owner?.name}</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailModal;
