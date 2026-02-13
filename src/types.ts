
export enum TileType {
  START = 'START',
  EMPTY = 'EMPTY',
  PROPERTY = 'PROPERTY',
  REWARD = 'REWARD',
  EVENT = 'EVENT',
}

export interface PropertyDetails {
  color: string; // Hex code for the property group
  price: number;
  upgradeCost: number;
  baseRent: number;
  rentIncreasePerLevel: number;
}

export interface Tile {
  id: number;
  type: TileType;
  name: string;
  description?: string;
  data?: PropertyDetails;
  ownerId?: string | null;
  level: number; // 0-5
  isMortgaged?: boolean; // New field
}

export interface Player {
  id: string;
  name: string;
  balance: number;
  totalAssets: number; // New field: Balance + Rent Potential
  position: number; // Index in the map array
  color: string; // Player's visual token color
  isDefeated: boolean;
  isOnline: boolean; // Track connection status
}

export interface GameState {
  roomId: string | null;
  hostId: string | null; // ID of the host player
  players: Player[];
  currentPlayerIndex: number;
  tiles: Tile[];
  startBonus: number; // Default 2000
  status: 'LOBBY' | 'PLAYING' | 'GAME_OVER';
  logs: string[];
  lastDiceRoll: number | null;
  waitingForDecision: boolean; // If true, player needs to click Buy/Upgrade/Pay
  version: number; // For sync checks
}

// Network Payload Types
export type NetworkAction = 
  | { type: 'JOIN'; payload: { player: Player } }
  | { type: 'SYNC'; payload: { state: GameState } }
  | { type: 'ROLL_DICE'; payload: { playerId: string } }
  | { type: 'INTERACT'; payload: { playerId: string; action: 'BUY' | 'UPGRADE' | 'PAY' | 'REDEEM' | 'NOTHING' } }
  | { type: 'PROPERTY_ACTION'; payload: { playerId: string; tileId: number; action: 'MORTGAGE' | 'REDEEM' } }
  | { type: 'END_TURN'; payload: { playerId: string } };
