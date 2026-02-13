
import { Tile, TileType, Player, GameState } from '../types';
import { MAX_PROPERTY_LEVEL } from '../constants';

// Helper to calculate mortgage value
export const calculateMortgageValue = (tile: Tile): number => {
  if (tile.type !== TileType.PROPERTY || !tile.data) return 0;
  const totalInvestment = tile.data.price + (tile.level * tile.data.upgradeCost);
  return Math.floor(totalInvestment * 0.5);
};

// Helper to calculate redemption cost
export const calculateRedemptionCost = (tile: Tile): number => {
  const mortgageValue = calculateMortgageValue(tile);
  return Math.floor(mortgageValue * 1.1);
};

// Calculate Rent Logic
export const calculateRent = (targetTile: Tile, allTiles: Tile[], ownerId: string | null | undefined): number => {
  if (targetTile.type !== TileType.PROPERTY || !targetTile.data || !ownerId) return 0;
  
  // Mortgaged properties collect no rent
  if (targetTile.isMortgaged) return 0;

  const { baseRent, rentIncreasePerLevel, color } = targetTile.data;
  const tileRent = baseRent + (rentIncreasePerLevel * targetTile.level);
  
  // Get all tiles of this color
  const sameColorTiles = allTiles.filter(t => t.type === TileType.PROPERTY && t.data?.color === color);
  
  // Rule: Own ALL tiles of color AND none of them are mortgaged
  const activeOwnedTiles = sameColorTiles.filter(t => t.ownerId === ownerId && !t.isMortgaged);

  let currentTileRent = tileRent;
  
  // Double rent if all tiles in group are owned and active (not mortgaged)
  if (activeOwnedTiles.length === sameColorTiles.length && sameColorTiles.length > 0) {
    currentTileRent *= 2;
  }
  
  return currentTileRent;
};

// --- Asset Calculation ---

// Calculate a single player's total assets
// Assets = Cash + Sum of Rent of all NON-MORTGAGED properties
export const calculatePlayerAssets = (player: Player, allTiles: Tile[]): number => {
  if (player.isDefeated) return 0;

  let propertyValue = 0;
  
  allTiles.forEach(tile => {
    if (tile.type === TileType.PROPERTY && tile.ownerId === player.id && !tile.isMortgaged) {
      // Add the rent potential to assets
      propertyValue += calculateRent(tile, allTiles, player.id);
    }
  });

  return player.balance + propertyValue;
};

// Helper to update assets for all players in the state
const updatePlayersAssets = (players: Player[], tiles: Tile[]): Player[] => {
  return players.map(p => ({
    ...p,
    totalAssets: calculatePlayerAssets(p, tiles)
  }));
};

// Event Logic (Simple Random)
export const getRandomEvent = (): { description: string, balanceChange: number, moveSteps: number } => {
  const events = [
    { desc: "捡到钱包！ +200元", money: 200, move: 0 },
    { desc: "超速罚单！ -100元", money: -100, move: 0 },
    { desc: "股市崩盘！ -500元", money: -500, move: 0 },
    { desc: "中彩票了！ +1000元", money: 1000, move: 0 },
    { desc: "喷气背包故障！ 后退3格。", money: 0, move: -3 },
    { desc: "搭顺风车！ 前进2格。", money: 0, move: 2 },
  ];
  const rand = Math.floor(Math.random() * events.length);
  return {
    description: events[rand].desc,
    balanceChange: events[rand].money,
    moveSteps: events[rand].move
  };
};

// --- Pure State Reducers for Host ---

export const handleNextTurn = (state: GameState): GameState => {
  let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  let attempts = 0;
  // Skip defeated players
  while (state.players[nextIndex].isDefeated && attempts < state.players.length) {
    nextIndex = (nextIndex + 1) % state.players.length;
    attempts++;
  }
  return {
    ...state,
    currentPlayerIndex: nextIndex,
    waitingForDecision: false,
    lastDiceRoll: null,
    version: state.version + 1,
  };
};

export const handleRollDice = (state: GameState, playerId: string): GameState => {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return state; // Validate turn
  if (state.waitingForDecision) return state;

  const steps = Math.floor(Math.random() * 24) + 1;
  const oldPos = currentPlayer.position;
  let newPos = oldPos + steps;
  let passedStart = false;
  let currentBalance = currentPlayer.balance;

  if (newPos >= state.tiles.length) {
    newPos = newPos % state.tiles.length;
    passedStart = true;
  }

  if (passedStart) {
    currentBalance += state.startBonus;
  }

  // Deep copy players
  let newPlayers = [...state.players];
  newPlayers[state.currentPlayerIndex] = { ...currentPlayer, position: newPos, balance: currentBalance };
  
  // Recalculate assets (balance changed)
  newPlayers = updatePlayersAssets(newPlayers, state.tiles);
  
  const newLogs = [...state.logs];
  newLogs.unshift(`${currentPlayer.name} 掷出了 ${steps} 点!`);
  if (passedStart) newLogs.unshift(`${currentPlayer.name} 经过起点! 奖励 +${state.startBonus}`);

  return {
    ...state,
    lastDiceRoll: steps,
    players: newPlayers,
    logs: newLogs.slice(0, 50),
    waitingForDecision: true,
    version: state.version + 1
  };
};

// Handle Anytime Property Actions (Mortgage/Redeem via Details)
export const handlePropertyAction = (
  state: GameState,
  playerId: string,
  tileId: number,
  action: 'MORTGAGE' | 'REDEEM'
): GameState => {
  const playerIdx = state.players.findIndex(p => p.id === playerId);
  if (playerIdx === -1) return state;

  const player = state.players[playerIdx];
  const tileIdx = state.tiles.findIndex(t => t.id === tileId);
  if (tileIdx === -1) return state;

  const tile = state.tiles[tileIdx];
  if (tile.ownerId !== playerId) return state; // Must own it

  let newPlayers = [...state.players];
  let newTiles = [...state.tiles];
  let newLogs = [...state.logs];

  if (action === 'MORTGAGE') {
    if (tile.isMortgaged) return state; // Already mortgaged
    const value = calculateMortgageValue(tile);
    newPlayers[playerIdx].balance += value;
    newTiles[tileIdx] = { ...tile, isMortgaged: true };
    newLogs.unshift(`${player.name} 抵押了 ${tile.name}，获得 $${value}。`);
  } 
  else if (action === 'REDEEM') {
    if (!tile.isMortgaged) return state; // Not mortgaged
    const cost = calculateRedemptionCost(tile);
    if (player.balance < cost) return state; 
    
    newPlayers[playerIdx].balance -= cost;
    newTiles[tileIdx] = { ...tile, isMortgaged: false };
    newLogs.unshift(`${player.name} 花费 $${cost} 赎回了 ${tile.name}。`);
  }

  // Recalculate assets for ALL players (mortgaging a property might break a color set for other properties, changing values)
  newPlayers = updatePlayersAssets(newPlayers, newTiles);

  return {
    ...state,
    players: newPlayers,
    tiles: newTiles,
    logs: newLogs.slice(0, 50),
    version: state.version + 1
  };
};

export const handleInteraction = (
  state: GameState, 
  playerId: string, 
  interactionType: 'BUY' | 'UPGRADE' | 'PAY' | 'REDEEM' | 'NOTHING'
): GameState => {
  const playerIdx = state.currentPlayerIndex;
  const player = state.players[playerIdx];
  
  if (player.id !== playerId) return state;

  const tile = state.tiles[player.position];
  let newPlayers = [...state.players];
  let newTiles = [...state.tiles];
  let newLogs = [...state.logs];
  let newStartBonus = state.startBonus;

  if (tile.type === TileType.START) {
    if (interactionType === 'NOTHING') newLogs.unshift(`在起点休息。`);
  } 
  else if (tile.type === TileType.REWARD) {
    newStartBonus += 100;
    newLogs.unshift(`到达奖励格！ 起点奖金提升至 ${newStartBonus}。`);
  }
  else if (tile.type === TileType.EVENT) {
    const evt = getRandomEvent();
    newLogs.unshift(`随机事件: ${evt.description}`);
    newPlayers[playerIdx].balance += evt.balanceChange;
    
    if (evt.moveSteps !== 0) {
       let pos = newPlayers[playerIdx].position + evt.moveSteps;
       if (pos < 0) pos = newTiles.length + pos;
       if (pos >= newTiles.length) pos = pos % newTiles.length;
       newPlayers[playerIdx].position = pos;
    }
  }
  else if (tile.type === TileType.PROPERTY) {
    if (interactionType === 'PAY') {
       if (tile.ownerId && tile.ownerId !== player.id && !tile.isMortgaged) {
         const rent = calculateRent(tile, state.tiles, tile.ownerId);
         newPlayers[playerIdx].balance -= rent;
         
         const ownerIdx = newPlayers.findIndex(p => p.id === tile.ownerId);
         if (ownerIdx > -1) {
           newPlayers[ownerIdx].balance += rent;
         }
         newLogs.unshift(`${player.name} 支付了 ${rent} 过路费给 ${newPlayers[ownerIdx].name}。`);
       }
    } else if (interactionType === 'BUY') {
      if (!tile.ownerId && tile.data) {
         if (player.balance >= tile.data.price) {
           newPlayers[playerIdx].balance -= tile.data.price;
           newTiles[player.position] = { ...tile, ownerId: player.id, level: 0, isMortgaged: false };
           newLogs.unshift(`${player.name} 花费 ${tile.data.price} 购买了 ${tile.name}。`);
         } else {
           newLogs.unshift(`${player.name} 资金不足，无法购买 ${tile.name}。`);
         }
      }
    } else if (interactionType === 'UPGRADE') {
      if (tile.ownerId === player.id && tile.data && tile.level < MAX_PROPERTY_LEVEL && !tile.isMortgaged) {
         if (player.balance >= tile.data.upgradeCost) {
           newPlayers[playerIdx].balance -= tile.data.upgradeCost;
           newTiles[player.position] = { ...tile, level: tile.level + 1 };
           newLogs.unshift(`${player.name} 将 ${tile.name} 升级到了 LV${tile.level + 1}。`);
         } else {
            newLogs.unshift(`${player.name} 资金不足，无法升级。`);
         }
      }
    } else if (interactionType === 'REDEEM') {
      if (tile.ownerId === player.id && tile.isMortgaged) {
         const cost = calculateRedemptionCost(tile);
         if (player.balance >= cost) {
           newPlayers[playerIdx].balance -= cost;
           newTiles[player.position] = { ...tile, isMortgaged: false };
           newLogs.unshift(`${player.name} 花费 ${cost} 赎回了 ${tile.name}。`);
         } else {
           newLogs.unshift(`${player.name} 资金不足，无法赎回。`);
         }
      }
    } else if (interactionType === 'NOTHING') {
        newLogs.unshift(`${player.name} 什么也没做。`);
    }
  } else if (tile.type === TileType.EMPTY) {
      newLogs.unshift(`${player.name} 路过了一片空地。`);
  }

  // Bankruptcy Check
  if (newPlayers[playerIdx].balance < 0) {
    newPlayers[playerIdx].isDefeated = true;
    newLogs.unshift(`${player.name} 破产了!`);
    newTiles = newTiles.map(t => t.ownerId === player.id ? { ...t, ownerId: null, level: 0, isMortgaged: false } : t);
  }

  // Final Asset Calculation for everyone
  newPlayers = updatePlayersAssets(newPlayers, newTiles);

  const stateAfterInteraction: GameState = {
    ...state,
    players: newPlayers,
    tiles: newTiles,
    logs: newLogs.slice(0, 50),
    startBonus: newStartBonus,
    waitingForDecision: false,
    version: state.version + 1
  };

  // Automatically advance turn after interaction
  return handleNextTurn(stateAfterInteraction);
};
