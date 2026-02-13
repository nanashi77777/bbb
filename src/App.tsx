
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { GameState, Player, TileType, NetworkAction } from './types';
import { DEFAULT_MAP, INITIAL_START_BONUS, PLAYER_COLORS, MAX_PROPERTY_LEVEL } from './constants';
import TileComponent from './components/TileComponent';
import PlayerCard from './components/PlayerCard';
import PropertyDetailModal from './components/PropertyDetailModal';
import { calculateRent, handleNextTurn, handleRollDice, handleInteraction, handlePropertyAction, calculateRedemptionCost } from './utils/gameLogic';

const App: React.FC = () => {
  // --- Local State for Connections ---
  const [myId, setMyId] = useState<string>('');
  const [userName, setUserName] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const [connToHost, setConnToHost] = useState<DataConnection | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('正在连接服务器...');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- UI State ---
  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);

  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>({
    roomId: null,
    hostId: null,
    players: [],
    currentPlayerIndex: 0,
    tiles: JSON.parse(JSON.stringify(DEFAULT_MAP)),
    startBonus: INITIAL_START_BONUS,
    status: 'LOBBY',
    logs: [],
    lastDiceRoll: null,
    waitingForDecision: false,
    version: 0,
  });

  // --- Initialization ---
  useEffect(() => {
    // Restore User ID or create new
    let storedId = localStorage.getItem('richman_userid');
    if (!storedId) {
      storedId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('richman_userid', storedId);
    }
    setMyId(storedId);

    // Initialize Peer
    const newPeer = new Peer(storedId, {
      debug: 1,
    });

    newPeer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
      setConnectionStatus('已连接服务器，就绪');
      
      // Attempt to restore host session
      const savedState = localStorage.getItem('richman_host_state');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed.hostId === id && parsed.status === 'PLAYING') {
            setGameState(parsed);
            setIsHost(true);
            setConnectionStatus('已恢复房间会话');
          }
        } catch(e) { console.error(e); }
      }
    });

    newPeer.on('error', (err) => {
      console.error(err);
      setConnectionStatus('连接错误: ' + err.type);
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, []);

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [gameState.logs]);

  // --- Host Logic: Handle Incoming Connections ---
  useEffect(() => {
    if (!peer) return;

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        // Only accept connections if we are hosting
        if (!isHost) {
           conn.close();
           return;
        }

        console.log('Incoming connection from', conn.peer);
        setConnections(prev => [...prev, conn]);

        // Send current state immediately upon connection
        conn.send({ type: 'SYNC', payload: { state: gameState } });

        conn.on('data', (data: any) => {
          handleNetworkMessage(data);
        });

        conn.on('close', () => {
          setConnections((prev: DataConnection[]) => prev.filter(c => c.peer !== conn.peer));
          // Mark player offline
          setGameState(prev => {
            const updatedPlayers = prev.players.map(p => p.id === conn.peer ? { ...p, isOnline: false } : p);
            return { ...prev, players: updatedPlayers };
          });
        });
      });
    });
  }, [peer, isHost, gameState]); // gameState dependency ensures we send latest state on new connection

  // --- Host Logic: Broadcast State ---
  const broadcastState = useCallback((state: GameState) => {
    const action: NetworkAction = { type: 'SYNC', payload: { state } };
    connections.forEach(conn => {
      if (conn.open) conn.send(action);
    });
  }, [connections]);

  // Sync state when it changes (Only Host)
  useEffect(() => {
    if (isHost && gameState.status === 'PLAYING') {
      broadcastState(gameState);
      localStorage.setItem('richman_host_state', JSON.stringify(gameState));
    }
  }, [gameState, isHost, broadcastState]);

  // --- Message Handling ---
  const handleNetworkMessage = (data: NetworkAction) => {
    if (data.type === 'SYNC') {
      // Client receives state
      setGameState(data.payload.state);
      return;
    }

    // Host processes actions
    if (!isHost) return;

    setGameState(current => {
      let newState = { ...current };

      if (data.type === 'JOIN') {
        const newPlayer = data.payload.player;
        const existingIdx = current.players.findIndex(p => p.id === newPlayer.id);
        
        if (existingIdx !== -1) {
           // Reconnection
           const updatedPlayers = [...current.players];
           updatedPlayers[existingIdx] = { ...updatedPlayers[existingIdx], isOnline: true };
           newState = { ...current, players: updatedPlayers, logs: [`${newPlayer.name} 重新连接。`, ...current.logs] };
        } else {
           // New Join
           const color = PLAYER_COLORS[current.players.length % PLAYER_COLORS.length];
           // Initialize Total Assets same as balance for new player
           const playerToAdd = { ...newPlayer, color, isOnline: true, totalAssets: newPlayer.balance };
           newState = { 
             ...current, 
             players: [...current.players, playerToAdd],
             logs: [`${newPlayer.name} 加入了房间。`, ...current.logs]
           };
        }
      }
      else if (data.type === 'ROLL_DICE') {
        newState = handleRollDice(current, data.payload.playerId);
      }
      else if (data.type === 'INTERACT') {
        newState = handleInteraction(current, data.payload.playerId, data.payload.action);
      }
      else if (data.type === 'PROPERTY_ACTION') {
        newState = handlePropertyAction(current, data.payload.playerId, data.payload.tileId, data.payload.action);
      }
      else if (data.type === 'END_TURN') {
        newState = handleNextTurn(current);
      }

      return newState;
    });
  };

  // --- User Actions ---

  const createRoom = () => {
    if (!userName.trim()) return alert("请输入用户名");
    setIsHost(true);
    const me: Player = {
      id: myId,
      name: userName,
      balance: 10000,
      totalAssets: 10000,
      position: 0,
      color: PLAYER_COLORS[0],
      isDefeated: false,
      isOnline: true,
    };
    
    setGameState({
      roomId: myId,
      hostId: myId,
      players: [me],
      currentPlayerIndex: 0,
      tiles: JSON.parse(JSON.stringify(DEFAULT_MAP)),
      startBonus: INITIAL_START_BONUS,
      status: 'PLAYING',
      logs: [`房间创建成功: ${myId}`, `等待其他玩家加入...`],
      lastDiceRoll: null,
      waitingForDecision: false,
      version: 1,
    });
  };

  const joinRoom = () => {
    if (!userName.trim() || !inputRoomId.trim()) return alert("请输入用户名和房间号");
    if (!peer) return;

    setConnectionStatus('正在加入...');
    const conn = peer.connect(inputRoomId);
    
    conn.on('open', () => {
      setConnectionStatus('已连接到房主');
      setConnToHost(conn);
      setIsHost(false);
      
      const me: Player = {
        id: myId,
        name: userName,
        balance: 10000,
        totalAssets: 10000,
        position: 0,
        color: 'gray', // Host will assign
        isDefeated: false,
        isOnline: true,
      };

      conn.send({ type: 'JOIN', payload: { player: me } });
    });

    conn.on('data', (data: any) => {
      handleNetworkMessage(data);
    });

    conn.on('close', () => {
      setConnectionStatus('与房主断开连接');
      setGameState(prev => ({ ...prev, status: 'LOBBY' }));
      setConnToHost(null);
    });
    
    conn.on('error', (err) => {
      console.error(err);
      setConnectionStatus('连接房主失败');
    });
  };

  // Dispatch Action Helper
  const sendAction = (action: NetworkAction) => {
    if (isHost) {
      // Host treats own actions as network messages
      handleNetworkMessage(action);
    } else {
      // Client sends to host
      if (connToHost && connToHost.open) {
        connToHost.send(action);
      } else {
        alert("未连接到房主，无法操作");
      }
    }
  };

  // UI Handlers
  const onRollDice = () => sendAction({ type: 'ROLL_DICE', payload: { playerId: myId } });
  
  const onInteract = (action: 'BUY' | 'UPGRADE' | 'PAY' | 'REDEEM' | 'NOTHING') => 
    sendAction({ type: 'INTERACT', payload: { playerId: myId, action } });
  
  const onMortgage = (tileId: number) => 
    sendAction({ type: 'PROPERTY_ACTION', payload: { playerId: myId, tileId, action: 'MORTGAGE' } });
  
  // onRedeemProperty removed, only accessed via Interact
  // const onRedeemProperty = (tileId: number) => 
  //   sendAction({ type: 'PROPERTY_ACTION', payload: { playerId: myId, tileId, action: 'REDEEM' } });


  // --- Render Helpers ---

  // Calculate Ranks
  const sortedPlayersForRanking = useMemo(() => {
    return [...gameState.players].sort((a, b) => b.totalAssets - a.totalAssets);
  }, [gameState.players]);

  const getRank = (playerId: string) => {
    return sortedPlayersForRanking.findIndex(p => p.id === playerId) + 1;
  };

  const getActions = () => {
    if (gameState.status !== 'PLAYING') return null;
    
    // Check if it's my turn
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const isMyTurn = currentPlayer?.id === myId;
    
    if (!isMyTurn) {
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-xl text-gray-500 font-bold mb-4">等待 {currentPlayer?.name} 操作...</div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        );
    }

    // It is my turn
    if (!gameState.waitingForDecision) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
               <h2 className="text-3xl font-black text-indigo-700 mb-6">轮到你了!</h2>
              <button 
                onClick={onRollDice}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl transform active:scale-95 transition-all text-white font-black py-6 px-12 rounded-2xl text-2xl animate-pulse flex items-center gap-3"
              >
                <span className="text-4xl">🎲</span> 掷骰子
              </button>
           </div>
        );
    }

    // Waiting for decision after move
    const tile = gameState.tiles[currentPlayer.position];
    
    // Action Card
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 w-full max-w-md mx-auto">
        <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
           {tile.type === TileType.EVENT && <span className="text-purple-500">⚡ 触发事件</span>}
           {tile.type === TileType.START && <span className="text-green-500">🏁 起点</span>}
           {tile.type === TileType.REWARD && <span className="text-yellow-500">💎 奖励</span>}
           {tile.type === TileType.EMPTY && <span className="text-gray-500">🏕️ 空地</span>}
           {tile.type === TileType.PROPERTY && <span className="text-blue-500">🏠 {tile.name}</span>}
        </h3>

        {tile.type === TileType.PROPERTY && tile.data ? (
          <div className="space-y-4">
             {tile.ownerId && tile.ownerId !== myId && (
                tile.isMortgaged ? (
                   <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 text-center">
                      <div className="text-gray-500 font-bold">该地产已抵押</div>
                      <div className="text-sm text-gray-400">无需支付过路费</div>
                      <button onClick={() => onInteract('NOTHING')} className="w-full mt-3 bg-gray-500 text-white py-2 rounded-lg font-bold hover:bg-gray-600 transition">确定</button>
                   </div>
                ) : (
                   <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                     <div className="text-red-600 font-bold text-lg mb-1">过路费</div>
                     <div className="text-3xl font-black text-red-700">${calculateRent(tile, gameState.tiles, tile.ownerId)}</div>
                     <button onClick={() => onInteract('PAY')} className="w-full mt-3 bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 transition">支付</button>
                   </div>
                )
             )}
             {!tile.ownerId && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-green-700 font-bold">售价</span>
                    <span className="text-2xl font-black text-green-700">${tile.data.price}</span>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => onInteract('BUY')} 
                      disabled={currentPlayer.balance < tile.data.price}
                      className="flex-1 bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      购买
                    </button>
                    <button onClick={() => onInteract('NOTHING')} className="px-6 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500 transition">跳过</button>
                  </div>
                </div>
             )}
             {tile.ownerId === myId && (
               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                 {/* Logic change: If mortgaged, show REDEEM option */}
                 {tile.isMortgaged ? (
                    <>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-blue-700 font-bold">赎回费用</span>
                        <span className="text-2xl font-black text-blue-700">${calculateRedemptionCost(tile)}</span>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => onInteract('REDEEM')} 
                          disabled={currentPlayer.balance < calculateRedemptionCost(tile)}
                          className="flex-1 bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 disabled:opacity-50 transition"
                        >
                          赎回
                        </button>
                        <button onClick={() => onInteract('NOTHING')} className="px-6 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500 transition">跳过</button>
                      </div>
                    </>
                 ) : (
                    tile.level < MAX_PROPERTY_LEVEL ? (
                        <>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-blue-700 font-bold">升级费用</span>
                            <span className="text-2xl font-black text-blue-700">${tile.data.upgradeCost}</span>
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => onInteract('UPGRADE')} 
                              disabled={currentPlayer.balance < tile.data.upgradeCost}
                              className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50 transition"
                            >
                              升级 (LV{tile.level + 1})
                            </button>
                            <button onClick={() => onInteract('NOTHING')} className="px-6 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500 transition">跳过</button>
                          </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <div className="text-center text-blue-800 font-bold py-2">已达到最高等级</div>
                            <button onClick={() => onInteract('NOTHING')} className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold">确定</button>
                        </div>
                    )
                 )}
               </div>
             )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 mb-6">
              {tile.type === TileType.EMPTY ? "在这里休息一下..." : "点击继续..."}
            </p>
            <button onClick={() => onInteract('NOTHING')} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
              {tile.type === TileType.EMPTY ? "休息" : "确定"}
            </button>
          </div>
        )}
      </div>
    );
  };

  // --- View: Lobby ---
  if (gameState.status === 'LOBBY') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <h1 className="text-4xl font-black text-center mb-2 text-indigo-600">
            RICHMAN
          </h1>
          <p className="text-center text-xs text-gray-400 mb-6 font-mono tracking-wider">{myId}</p>
          
          <div className="space-y-4">
            <input 
              type="text" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="你的昵称"
            />
            
            <button 
              onClick={createRoom}
              disabled={!peer || !peer.open}
              className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:opacity-50"
            >
              创建新游戏
            </button>

            <div className="flex items-center gap-2 my-4">
               <div className="h-px bg-gray-200 flex-1"></div>
               <span className="text-xs text-gray-400">OR</span>
               <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="房间ID"
              />
              <button 
                onClick={joinRoom}
                disabled={!peer || !peer.open}
                className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition disabled:opacity-50"
              >
                加入
              </button>
            </div>
            
            <div className="text-center text-xs text-gray-400 mt-4">
              {connectionStatus}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // --- Hollow Rectangle Map Calculations ---
  // 64 Tiles.
  // We want a rectangle.
  // Let W=20, H=14.
  // Perimeter = 2*20 + 2*14 - 4 = 40 + 28 - 4 = 64. Perfect.
  const GRID_W = 20;
  const GRID_H = 14;
  const TILE_W = 56; // w-14
  const TILE_H = 64; // h-16
  const GAP = 2;

  const boardWidth = GRID_W * (TILE_W + GAP);
  const boardHeight = GRID_H * (TILE_H + GAP);

  const getTilePosition = (i: number) => {
    let x = 0, y = 0;
    // Top Row (0-19)
    if (i < GRID_W) {
       x = i;
       y = 0;
    }
    // Right Col (20-31) - 12 tiles
    else if (i < GRID_W + (GRID_H - 2)) {
       x = GRID_W - 1;
       y = (i - GRID_W) + 1;
    }
    // Bottom Row (32-51) - 20 tiles
    else if (i < GRID_W + (GRID_H - 2) + GRID_W) {
       // i goes from 32 to 51
       // x goes from 19 to 0
       const offset = i - (GRID_W + GRID_H - 2);
       x = (GRID_W - 1) - offset;
       y = GRID_H - 1;
    }
    // Left Col (52-63) - 12 tiles
    else {
       // i goes from 52 to 63
       // y goes from 12 to 1
       const offset = i - (2 * GRID_W + GRID_H - 2);
       x = 0;
       y = (GRID_H - 1) - 1 - offset;
    }

    return { 
      x: x * (TILE_W + GAP), 
      y: y * (TILE_H + GAP) 
    };
  };

  const selectedTile = selectedTileId !== null ? gameState.tiles.find(t => t.id === selectedTileId) : null;
  const selectedTileOwner = selectedTile?.ownerId ? gameState.players.find(p => p.id === selectedTile?.ownerId) : undefined;
  const me = gameState.players.find(p => p.id === myId);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 overflow-hidden p-4">
      {/* Property Detail Modal */}
      {selectedTile && selectedTile.type === TileType.PROPERTY && (
        <PropertyDetailModal 
          tile={selectedTile} 
          owner={selectedTileOwner}
          currentUser={me}
          onClose={() => setSelectedTileId(null)}
          onMortgage={() => onMortgage(selectedTile.id)}
        />
      )}

      {/* Board Container */}
      <div 
        className="relative bg-gray-800 rounded-3xl shadow-2xl border-4 border-gray-700"
        style={{ width: boardWidth + 20, height: boardHeight + 20 }} // padding
      >
          {/* TILES (Perimeter) */}
          {gameState.tiles.map((tile, i) => {
             const playersHere = gameState.players.filter(p => p.position === i);
             const isTarget = currentPlayer?.position === i;
             const owner = tile.ownerId ? gameState.players.find(p => p.id === tile.ownerId) : undefined;
             const pos = getTilePosition(i);
             return (
               <div
                 key={tile.id}
                 className="absolute transition-all duration-500 ease-in-out"
                 style={{
                   left: pos.x + 10, // +padding
                   top: pos.y + 10,
                   zIndex: isTarget ? 50 : 10,
                 }}
               >
                 <TileComponent 
                   tile={tile} 
                   playersOnTile={playersHere}
                   isCurrentTarget={isTarget}
                   owner={owner}
                   onClick={() => setSelectedTileId(tile.id)}
                 />
               </div>
             );
          })}

          {/* CENTER HUB (The Void) */}
          <div 
             className="absolute bg-gray-100 rounded-xl shadow-inner overflow-hidden flex"
             style={{
               left: (TILE_W + GAP) + 10,
               top: (TILE_H + GAP) + 10,
               width: boardWidth - 2 * (TILE_W + GAP),
               height: boardHeight - 2 * (TILE_H + GAP),
             }}
          >
             {/* LEFT: Players & Room Info */}
             <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="font-black text-gray-700 uppercase tracking-wider text-xs mb-2">Room: {gameState.roomId}</h2>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Bonus: ${gameState.startBonus}</span>
                    <span>Host: {isHost ? 'You' : 'Remote'}</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                   {gameState.players.map((p, idx) => (
                     <PlayerCard 
                        key={p.id} 
                        player={p} 
                        isCurrentTurn={idx === gameState.currentPlayerIndex}
                        rank={getRank(p.id)}
                     />
                   ))}
                </div>
                {/* My Stats Highlight */}
                <div className="p-4 bg-indigo-50 border-t border-indigo-100">
                   <div className="flex justify-between items-end mb-1">
                     <div className="text-xs text-indigo-500 font-bold uppercase">My Wallet</div>
                     <div className="text-[10px] text-indigo-400">RANK #{getRank(myId)}</div>
                   </div>
                   <div className="flex justify-between items-end">
                      <div className="text-2xl font-black text-indigo-700">
                        ${gameState.players.find(p => p.id === myId)?.balance.toLocaleString() || 0}
                      </div>
                      <div className="text-xs font-bold text-indigo-500">
                         Assets: ${gameState.players.find(p => p.id === myId)?.totalAssets.toLocaleString() || 0}
                      </div>
                   </div>
                </div>
             </div>

             {/* MIDDLE: Main Action Stage */}
             <div className="flex-1 bg-slate-50 relative flex items-center justify-center p-6">
                 {/* Dice Display (Floating) */}
                 {gameState.lastDiceRoll && (
                    <div className="absolute top-4 right-4 flex flex-col items-center bg-white px-4 py-2 rounded-xl shadow-md border border-gray-200">
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Last Roll</span>
                      <div className="text-3xl font-black text-indigo-600">{gameState.lastDiceRoll}</div>
                    </div>
                 )}
                 
                 {/* Current Turn Indicator */}
                 <div className="absolute top-4 left-4">
                    <span className="text-xs font-bold text-gray-400 uppercase">Current Turn</span>
                    <div className="text-xl font-bold text-gray-800">{currentPlayer?.name}</div>
                 </div>

                 {/* Action Content */}
                 <div className="w-full h-full flex items-center justify-center">
                    {getActions()}
                 </div>
             </div>

             {/* RIGHT: Logs */}
             <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
                <div className="p-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                  Activity Log
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-white">
                  {/* Reversed logs in state usually, but for scrolling we might want standard order. 
                      Actually state.logs is prepended (newest first). 
                      Let's map them directly. */}
                  {gameState.logs.map((log, i) => (
                    <div key={i} className="text-xs text-gray-600 border-l-2 border-indigo-300 pl-2 py-1 bg-gray-50 rounded-r">
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
             </div>
          </div>
      </div>
    </div>
  );
};

export default App;
