
import { Tile, TileType } from './types';

export const INITIAL_START_BONUS = 2000;
export const MAX_PROPERTY_LEVEL = 5;

// Player colors
export const PLAYER_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];

// 64-Tile Map Configuration
export const DEFAULT_MAP: Tile[] = [
  // --- Side 1: Top (Left to Right) 0-16 ---
  { id: 0, type: TileType.START, name: '起点', level: 0 },
  { id: 1, type: TileType.PROPERTY, name: '台北', level: 0, data: { color: '#86efac', price: 600, upgradeCost: 200, baseRent: 120, rentIncreasePerLevel: 60 } },
  { id: 2, type: TileType.PROPERTY, name: '高雄', level: 0, data: { color: '#86efac', price: 600, upgradeCost: 200, baseRent: 120, rentIncreasePerLevel: 60 } },
  { id: 3, type: TileType.PROPERTY, name: '香港', level: 0, data: { color: '#86efac', price: 800, upgradeCost: 300, baseRent: 160, rentIncreasePerLevel: 80 } },
  { id: 4, type: TileType.EVENT, name: '命运', level: 0 },
  { id: 5, type: TileType.PROPERTY, name: '澳门', level: 0, data: { color: '#86efac', price: 800, upgradeCost: 300, baseRent: 160, rentIncreasePerLevel: 80 } },
  { id: 6, type: TileType.PROPERTY, name: '深圳', level: 0, data: { color: '#6ee7b7', price: 1000, upgradeCost: 400, baseRent: 200, rentIncreasePerLevel: 100 } },
  { id: 7, type: TileType.PROPERTY, name: '广州', level: 0, data: { color: '#6ee7b7', price: 1000, upgradeCost: 400, baseRent: 200, rentIncreasePerLevel: 100 } },
  { id: 8, type: TileType.REWARD, name: '福利社', level: 0 },
  { id: 9, type: TileType.PROPERTY, name: '珠海', level: 0, data: { color: '#6ee7b7', price: 1100, upgradeCost: 400, baseRent: 220, rentIncreasePerLevel: 110 } },
  { id: 10, type: TileType.PROPERTY, name: '东莞', level: 0, data: { color: '#6ee7b7', price: 1100, upgradeCost: 400, baseRent: 220, rentIncreasePerLevel: 110 } },
  { id: 11, type: TileType.PROPERTY, name: '福州', level: 0, data: { color: '#6ee7b7', price: 1200, upgradeCost: 400, baseRent: 240, rentIncreasePerLevel: 120 } },
  { id: 12, type: TileType.EVENT, name: '机会', level: 0 },
  { id: 13, type: TileType.PROPERTY, name: '厦门', level: 0, data: { color: '#93c5fd', price: 1400, upgradeCost: 500, baseRent: 280, rentIncreasePerLevel: 140 } },
  { id: 14, type: TileType.PROPERTY, name: '杭州', level: 0, data: { color: '#93c5fd', price: 1500, upgradeCost: 500, baseRent: 300, rentIncreasePerLevel: 150 } },
  { id: 15, type: TileType.PROPERTY, name: '宁波', level: 0, data: { color: '#93c5fd', price: 1500, upgradeCost: 500, baseRent: 300, rentIncreasePerLevel: 150 } },
  { id: 16, type: TileType.EMPTY, name: '公园', level: 0 },

  // --- Side 2: Right (Top to Bottom) 17-32 ---
  { id: 17, type: TileType.PROPERTY, name: '上海', level: 0, data: { color: '#93c5fd', price: 1800, upgradeCost: 600, baseRent: 360, rentIncreasePerLevel: 180 } },
  { id: 18, type: TileType.PROPERTY, name: '苏州', level: 0, data: { color: '#93c5fd', price: 1600, upgradeCost: 600, baseRent: 320, rentIncreasePerLevel: 160 } },
  { id: 19, type: TileType.PROPERTY, name: '南京', level: 0, data: { color: '#c4b5fd', price: 1800, upgradeCost: 700, baseRent: 360, rentIncreasePerLevel: 180 } },
  { id: 20, type: TileType.EVENT, name: '命运', level: 0 },
  { id: 21, type: TileType.PROPERTY, name: '合肥', level: 0, data: { color: '#c4b5fd', price: 1800, upgradeCost: 700, baseRent: 360, rentIncreasePerLevel: 180 } },
  { id: 22, type: TileType.PROPERTY, name: '南昌', level: 0, data: { color: '#c4b5fd', price: 1900, upgradeCost: 700, baseRent: 380, rentIncreasePerLevel: 190 } },
  { id: 23, type: TileType.PROPERTY, name: '武汉', level: 0, data: { color: '#c4b5fd', price: 2000, upgradeCost: 800, baseRent: 400, rentIncreasePerLevel: 200 } },
  { id: 24, type: TileType.REWARD, name: '银行', level: 0 },
  { id: 25, type: TileType.PROPERTY, name: '长沙', level: 0, data: { color: '#c4b5fd', price: 2000, upgradeCost: 800, baseRent: 400, rentIncreasePerLevel: 200 } },
  { id: 26, type: TileType.PROPERTY, name: '郑州', level: 0, data: { color: '#f9a8d4', price: 2200, upgradeCost: 900, baseRent: 440, rentIncreasePerLevel: 220 } },
  { id: 27, type: TileType.PROPERTY, name: '济南', level: 0, data: { color: '#f9a8d4', price: 2200, upgradeCost: 900, baseRent: 440, rentIncreasePerLevel: 220 } },
  { id: 28, type: TileType.EVENT, name: '机会', level: 0 },
  { id: 29, type: TileType.PROPERTY, name: '青岛', level: 0, data: { color: '#f9a8d4', price: 2400, upgradeCost: 900, baseRent: 480, rentIncreasePerLevel: 240 } },
  { id: 30, type: TileType.PROPERTY, name: '大连', level: 0, data: { color: '#f9a8d4', price: 2400, upgradeCost: 900, baseRent: 480, rentIncreasePerLevel: 240 } },
  { id: 31, type: TileType.PROPERTY, name: '沈阳', level: 0, data: { color: '#f9a8d4', price: 2500, upgradeCost: 900, baseRent: 500, rentIncreasePerLevel: 250 } },
  { id: 32, type: TileType.EMPTY, name: '机场', level: 0 },

  // --- Side 3: Bottom (Right to Left) 33-48 ---
  { id: 33, type: TileType.PROPERTY, name: '长春', level: 0, data: { color: '#fda4af', price: 2600, upgradeCost: 1000, baseRent: 520, rentIncreasePerLevel: 260 } },
  { id: 34, type: TileType.PROPERTY, name: '哈尔滨', level: 0, data: { color: '#fda4af', price: 2600, upgradeCost: 1000, baseRent: 520, rentIncreasePerLevel: 260 } },
  { id: 35, type: TileType.PROPERTY, name: '呼和浩特', level: 0, data: { color: '#fda4af', price: 2800, upgradeCost: 1000, baseRent: 560, rentIncreasePerLevel: 280 } },
  { id: 36, type: TileType.EVENT, name: '命运', level: 0 },
  { id: 37, type: TileType.PROPERTY, name: '太原', level: 0, data: { color: '#fda4af', price: 2800, upgradeCost: 1000, baseRent: 560, rentIncreasePerLevel: 280 } },
  { id: 38, type: TileType.PROPERTY, name: '石家庄', level: 0, data: { color: '#fda4af', price: 2800, upgradeCost: 1000, baseRent: 560, rentIncreasePerLevel: 280 } },
  { id: 39, type: TileType.PROPERTY, name: '天津', level: 0, data: { color: '#fde047', price: 3000, upgradeCost: 1200, baseRent: 600, rentIncreasePerLevel: 300 } },
  { id: 40, type: TileType.REWARD, name: '赌场', level: 0 },
  { id: 41, type: TileType.PROPERTY, name: '北京', level: 0, data: { color: '#fde047', price: 3500, upgradeCost: 1500, baseRent: 700, rentIncreasePerLevel: 350 } },
  { id: 42, type: TileType.PROPERTY, name: '西安', level: 0, data: { color: '#fde047', price: 3200, upgradeCost: 1200, baseRent: 640, rentIncreasePerLevel: 320 } },
  { id: 43, type: TileType.PROPERTY, name: '兰州', level: 0, data: { color: '#fde047', price: 3000, upgradeCost: 1200, baseRent: 600, rentIncreasePerLevel: 300 } },
  { id: 44, type: TileType.EVENT, name: '机会', level: 0 },
  { id: 45, type: TileType.PROPERTY, name: '西宁', level: 0, data: { color: '#fdba74', price: 3000, upgradeCost: 1100, baseRent: 600, rentIncreasePerLevel: 300 } },
  { id: 46, type: TileType.PROPERTY, name: '银川', level: 0, data: { color: '#fdba74', price: 3000, upgradeCost: 1100, baseRent: 600, rentIncreasePerLevel: 300 } },
  { id: 47, type: TileType.PROPERTY, name: '乌鲁木齐', level: 0, data: { color: '#fdba74', price: 3200, upgradeCost: 1100, baseRent: 640, rentIncreasePerLevel: 320 } },
  { id: 48, type: TileType.EMPTY, name: '监狱', level: 0 },

  // --- Side 4: Left (Bottom to Top) 49-63 ---
  { id: 49, type: TileType.PROPERTY, name: '拉萨', level: 0, data: { color: '#fdba74', price: 3500, upgradeCost: 1200, baseRent: 700, rentIncreasePerLevel: 350 } },
  { id: 50, type: TileType.PROPERTY, name: '成都', level: 0, data: { color: '#fdba74', price: 3500, upgradeCost: 1200, baseRent: 700, rentIncreasePerLevel: 350 } },
  { id: 51, type: TileType.PROPERTY, name: '重庆', level: 0, data: { color: '#fdba74', price: 3500, upgradeCost: 1200, baseRent: 700, rentIncreasePerLevel: 350 } },
  { id: 52, type: TileType.EVENT, name: '命运', level: 0 },
  { id: 53, type: TileType.PROPERTY, name: '贵阳', level: 0, data: { color: '#cbd5e1', price: 3800, upgradeCost: 1300, baseRent: 760, rentIncreasePerLevel: 380 } },
  { id: 54, type: TileType.PROPERTY, name: '昆明', level: 0, data: { color: '#cbd5e1', price: 3800, upgradeCost: 1300, baseRent: 760, rentIncreasePerLevel: 380 } },
  { id: 55, type: TileType.PROPERTY, name: '南宁', level: 0, data: { color: '#cbd5e1', price: 3800, upgradeCost: 1300, baseRent: 760, rentIncreasePerLevel: 380 } },
  { id: 56, type: TileType.REWARD, name: '彩票站', level: 0 },
  { id: 57, type: TileType.PROPERTY, name: '海口', level: 0, data: { color: '#cbd5e1', price: 4000, upgradeCost: 1400, baseRent: 800, rentIncreasePerLevel: 400 } },
  { id: 58, type: TileType.PROPERTY, name: '三亚', level: 0, data: { color: '#cbd5e1', price: 4200, upgradeCost: 1500, baseRent: 840, rentIncreasePerLevel: 420 } },
  { id: 59, type: TileType.PROPERTY, name: '东京', level: 0, data: { color: '#94a3b8', price: 5000, upgradeCost: 2000, baseRent: 1000, rentIncreasePerLevel: 500 } },
  { id: 60, type: TileType.EVENT, name: '机会', level: 0 },
  { id: 61, type: TileType.PROPERTY, name: '巴黎', level: 0, data: { color: '#94a3b8', price: 5500, upgradeCost: 2200, baseRent: 1100, rentIncreasePerLevel: 550 } },
  { id: 62, type: TileType.PROPERTY, name: '伦敦', level: 0, data: { color: '#94a3b8', price: 6000, upgradeCost: 2500, baseRent: 1200, rentIncreasePerLevel: 600 } },
  { id: 63, type: TileType.PROPERTY, name: '纽约', level: 0, data: { color: '#94a3b8', price: 7000, upgradeCost: 3000, baseRent: 1400, rentIncreasePerLevel: 700 } },
];
