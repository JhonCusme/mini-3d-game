import React, { useEffect, useState } from 'react';
import { useGame } from '../../core/GameContext';
import { FriendsManager, type FriendInfo, type FriendRequest } from '../../core/friends/FriendsManager';
import { PvpManager } from '../../core/pvp/PvpManager';
import { useAuth } from '../../core/AuthContext';
import { AVATAR_IMAGES } from '../troopIcons';
import { getKingdomConfig } from '../../config/KingdomsConfig';
import { leagueFor } from '../../core/pvp/PvpRules';
import type { VillageSnapshot } from '../../core/pvp/PvpTypes';

interface FriendsModalProps {
    onClose: () => void;
    onStartFriendlyBattle: (opp: VillageSnapshot) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({ onClose, onStartFriendlyBattle }) => {
    const { state } = useGame();
    const { user } = useAuth();
    const [tab, setTab] = useState<'friends' | 'requests' | 'search'>('friends');
    const [friends, setFriends] = useState<FriendInfo[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FriendInfo[]>([]);
    const [suggestedPlayers, setSuggestedPlayers] = useState<FriendInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    const [sentIds, setSentIds] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);

    const meSnapshot = PvpManager.buildSnapshot(state, user?.id);

    const isSelf = (p: { id: string; name?: string; snapshot?: VillageSnapshot }) => {
        if (!p) return true;
        if (p.id === state.playerId) return true;
        if (user?.id && p.snapshot?.userId && p.snapshot.userId === user.id) return true;
        const myName = (state.playerName || '').trim().toLowerCase();
        const pName = (p.name || '').trim().toLowerCase();
        if (myName && pName && myName === pName) return true;
        return false;
    };

    const showMsg = (msg: string) => {
        setStatusMsg(msg);
        setTimeout(() => setStatusMsg(null), 3000);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [fList, rList] = await Promise.all([
                FriendsManager.loadFriends(state.playerId),
                FriendsManager.loadIncomingRequests(state.playerId),
            ]);
            setFriends(fList);
            setRequests(rList);
            setSentIds(FriendsManager.getSentRequestIds(state.playerId));

            // Load suggestions in background, strictly excluding self
            FriendsManager.getSuggestedPlayers(meSnapshot).then(sug => {
                setSuggestedPlayers(sug.filter(p => !isSelf(p)));
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.playerId]);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        setSearching(true);
        try {
            const res = await FriendsManager.searchPlayers(q, meSnapshot);
            const filtered = res.filter(p => !isSelf(p));
            setSearchResults(filtered);
            if (filtered.length === 0) {
                showMsg('No se encontraron otros jugadores con ese nombre o ID');
            }
        } finally {
            setSearching(false);
        }
    };

    const handleSendRequest = async (targetId: string) => {
        const res = await FriendsManager.sendFriendRequest(targetId, meSnapshot);
        showMsg(res.message);
        if (res.success) {
            setSentIds(prev => [...prev, targetId]);
        }
    };

    const handleAcceptRequest = async (req: FriendRequest) => {
        await FriendsManager.acceptFriendRequest(req, meSnapshot);
        showMsg(`¡Ahora eres amigo de ${req.fromName}!`);
        await loadData();
    };

    const handleRejectRequest = async (reqId: string) => {
        await FriendsManager.rejectFriendRequest(reqId, state.playerId);
        showMsg('Solicitud rechazada');
        setRequests(prev => prev.filter(r => r.id !== reqId));
    };

    const handleRemoveFriend = async (friendId: string, friendName: string) => {
        if (!window.confirm(`¿Eliminar a ${friendName} de tu lista de amigos?`)) return;
        await FriendsManager.removeFriend(friendId, state.playerId);
        showMsg(`Has eliminado a ${friendName}`);
        setFriends(prev => prev.filter(f => f.id !== friendId));
    };

    const handleSelfPractice = () => {
        // Build snapshot of own base for friendly defense testing
        const ownSnapshot = PvpManager.buildSnapshot(state, user?.id);
        onStartFriendlyBattle(ownSnapshot);
        onClose();
    };

    const handleChallengeFriend = async (friend: FriendInfo) => {
        let snap = friend.snapshot;
        if (!snap) {
            setLoading(true);
            snap = await FriendsManager.getFriendVillage(friend.id) || undefined;
            setLoading(false);
        }
        if (!snap) {
            showMsg('No se pudo cargar la aldea de tu amigo');
            return;
        }
        onStartFriendlyBattle(snap);
        onClose();
    };

    const handleCopyMyId = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(state.playerId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex-col gap-3" style={{ color: '#fff', minHeight: '340px' }}>
            {statusMsg && (
                <div style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(46, 213, 115, 0.25), rgba(39, 174, 96, 0.35))',
                    border: '1.5px solid #2ed573',
                    color: '#7bed9f',
                    fontSize: '13px',
                    fontWeight: 700,
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(46, 213, 115, 0.2)',
                }}>
                    {statusMsg}
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex-row gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '8px' }}>
                <button
                    className={`btn-subtab ${tab === 'friends' ? 'active' : ''}`}
                    onClick={() => setTab('friends')}
                    style={{
                        flex: 1,
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: tab === 'friends' ? '2px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.15)',
                        background: tab === 'friends' ? 'rgba(255, 215, 0, 0.18)' : 'rgba(0,0,0,0.3)',
                        color: tab === 'friends' ? 'var(--accent-gold)' : '#ddd',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                    }}
                >
                    👥 Amigos ({friends.length})
                </button>
                <button
                    className={`btn-subtab ${tab === 'requests' ? 'active' : ''}`}
                    onClick={() => setTab('requests')}
                    style={{
                        flex: 1,
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: tab === 'requests' ? '2px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.15)',
                        background: tab === 'requests' ? 'rgba(255, 215, 0, 0.18)' : 'rgba(0,0,0,0.3)',
                        color: tab === 'requests' ? 'var(--accent-gold)' : '#ddd',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        position: 'relative',
                    }}
                >
                    📬 Solicitudes
                    {requests.length > 0 && (
                        <span style={{
                            background: '#ff4757',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 900,
                            padding: '1px 6px',
                            borderRadius: '10px',
                        }}>
                            {requests.length}
                        </span>
                    )}
                </button>
                <button
                    className={`btn-subtab ${tab === 'search' ? 'active' : ''}`}
                    onClick={() => setTab('search')}
                    style={{
                        flex: 1,
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: tab === 'search' ? '2px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.15)',
                        background: tab === 'search' ? 'rgba(255, 215, 0, 0.18)' : 'rgba(0,0,0,0.3)',
                        color: tab === 'search' ? 'var(--accent-gold)' : '#ddd',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                    }}
                >
                    🔍 Buscar / Añadir
                </button>
            </div>

            {/* TAB 1: FRIENDS LIST */}
            {tab === 'friends' && (
                <div className="flex-col gap-3">
                    {/* Self practice banner */}
                    <div style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(9, 132, 227, 0.25), rgba(41, 128, 185, 0.4))',
                        border: '2px solid #0984e3',
                        boxShadow: '0 4px 16px rgba(9, 132, 227, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                    }}>
                        <div className="flex-col" style={{ gap: '3px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#74b9ff', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                🛡️ Probar mi Propia Aldea
                            </div>
                            <div style={{ fontSize: '12px', color: '#e0e0e0', lineHeight: 1.3 }}>
                                Ataca tus defensas con tu ejército para verificar zonas ciegas. <b>Sin gastar tropas ni trofeos.</b>
                            </div>
                        </div>
                        <button
                            className="btn-upgrade"
                            onClick={handleSelfPractice}
                            style={{
                                padding: '10px 16px',
                                fontSize: '13px',
                                whiteSpace: 'nowrap',
                                background: '#0984e3',
                                border: '1.5px solid #74b9ff',
                            }}
                        >
                            ⚔️ Practicar
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#aaa' }}>Cargando amigos…</div>
                    ) : friends.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '36px 20px',
                            background: 'rgba(0,0,0,0.25)',
                            borderRadius: '14px',
                            border: '1px dashed rgba(255,255,255,0.15)',
                        }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤝</div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Aún no tienes amigos agregados</div>
                            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px', maxWidth: '320px', margin: '4px auto 14px' }}>
                                Ve a la pestaña <b>Buscar / Añadir</b> para invitar a los otros jugadores y realizar batallas amistosas.
                            </div>
                            <button
                                className="btn-upgrade"
                                onClick={() => setTab('search')}
                                style={{ padding: '8px 20px', fontSize: '13px' }}
                            >
                                🔍 Buscar Jugadores
                            </button>
                        </div>
                    ) : (
                        <div className="flex-col gap-2">
                            {friends.map(f => {
                                const kConfig = getKingdomConfig(f.kingdom);
                                const isOnline = (f.onlineUntil && f.onlineUntil > Date.now()) || (Date.now() - f.updatedAt < 180_000);

                                return (
                                    <div
                                        key={f.id}
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: '14px',
                                            background: 'linear-gradient(135deg, rgba(30, 25, 45, 0.85), rgba(20, 15, 30, 0.92))',
                                            border: '1.5px solid rgba(255, 215, 0, 0.25)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '12px',
                                        }}
                                    >
                                        <div className="flex-row gap-3" style={{ alignItems: 'center' }}>
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={AVATAR_IMAGES[f.avatar] || AVATAR_IMAGES.warrior}
                                                    alt=""
                                                    style={{ width: '46px', height: '46px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.3)' }}
                                                />
                                                <span
                                                    title={isOnline ? 'En línea' : 'Desconectado'}
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '-2px',
                                                        right: '-2px',
                                                        width: '12px',
                                                        height: '12px',
                                                        borderRadius: '50%',
                                                        background: isOnline ? '#2ed573' : '#a4b0be',
                                                        border: '2px solid #1a1a2e',
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-col" style={{ gap: '2px' }}>
                                                <div className="flex-row gap-2" style={{ alignItems: 'center' }}>
                                                    <b style={{ fontSize: '15px', color: '#fff' }}>{f.name}</b>
                                                    <span style={{ fontSize: '11px', color: isOnline ? '#2ed573' : '#a4b0be', fontWeight: 600 }}>
                                                        {isOnline ? '🟢 En línea' : '⚪ Desconectado'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                                    {kConfig.icon} Ayunt. Nv.{f.level} · {leagueFor(f.trophies).icon} {f.trophies} 🏆
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-row gap-2" style={{ alignItems: 'center' }}>
                                            <button
                                                className="btn-upgrade"
                                                onClick={() => handleChallengeFriend(f)}
                                                style={{
                                                    padding: '8px 14px',
                                                    fontSize: '13px',
                                                    background: 'linear-gradient(135deg, #0984e3, #2980b9)',
                                                    border: '1px solid #74b9ff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                }}
                                            >
                                                ⚔️ Batalla Amistosa
                                            </button>
                                            <button
                                                onClick={() => handleRemoveFriend(f.id, f.name)}
                                                title="Eliminar amigo"
                                                style={{
                                                    background: 'rgba(255, 71, 87, 0.15)',
                                                    border: '1px solid #ff4757',
                                                    color: '#ff6b81',
                                                    borderRadius: '8px',
                                                    padding: '8px 10px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: INCOMING REQUESTS */}
            {tab === 'requests' && (
                <div className="flex-col gap-2">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#aaa' }}>Cargando solicitudes…</div>
                    ) : requests.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '36px 20px',
                            background: 'rgba(0,0,0,0.25)',
                            borderRadius: '14px',
                            border: '1px dashed rgba(255,255,255,0.15)',
                        }}>
                            <div style={{ fontSize: '30px', marginBottom: '8px' }}>📬</div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>No tienes solicitudes pendientes</div>
                            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                                Cuando otros jugadores te envíen una solicitud de amistad, aparecerán aquí.
                            </div>
                        </div>
                    ) : (
                        requests.map(r => {
                            const kConfig = getKingdomConfig(r.fromKingdom);
                            return (
                                <div
                                    key={r.id}
                                    style={{
                                        padding: '12px 14px',
                                        borderRadius: '14px',
                                        background: 'linear-gradient(135deg, rgba(30, 25, 45, 0.85), rgba(20, 15, 30, 0.92))',
                                        border: '1.5px solid rgba(46, 213, 115, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                    }}
                                >
                                    <div className="flex-row gap-3" style={{ alignItems: 'center' }}>
                                        <img
                                            src={AVATAR_IMAGES[r.fromAvatar] || AVATAR_IMAGES.warrior}
                                            alt=""
                                            style={{ width: '44px', height: '44px', borderRadius: '12px', border: '1.5px solid #2ed573' }}
                                        />
                                        <div className="flex-col" style={{ gap: '2px' }}>
                                            <b style={{ fontSize: '15px', color: '#fff' }}>{r.fromName}</b>
                                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                                {kConfig.icon} Ayunt. Nv.{r.fromLevel} · {leagueFor(r.fromTrophies).icon} {r.fromTrophies} 🏆
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-row gap-2">
                                        <button
                                            className="btn-upgrade"
                                            onClick={() => handleAcceptRequest(r)}
                                            style={{
                                                padding: '8px 14px',
                                                fontSize: '12px',
                                                background: '#2ed573',
                                                border: '1px solid #7bed9f',
                                            }}
                                        >
                                            ✅ Aceptar
                                        </button>
                                        <button
                                            onClick={() => handleRejectRequest(r.id)}
                                            style={{
                                                background: 'rgba(255,255,255,0.1)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                color: '#ddd',
                                                borderRadius: '8px',
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                            }}
                                        >
                                            ❌ Rechazar
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* TAB 3: SEARCH & ADD PLAYERS */}
            {tab === 'search' && (
                <div className="flex-col gap-3">
                    {/* Share My Player ID */}
                    <div style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'rgba(255, 215, 0, 0.1)',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                    }}>
                        <div className="flex-col" style={{ gap: '1px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--accent-gold)', textTransform: 'uppercase', fontWeight: 800 }}>
                                Tu Identificador de Jugador:
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', userSelect: 'all' }}>
                                {state.playerName} <span style={{ color: '#aaa', fontSize: '11px' }}>({state.playerId})</span>
                            </span>
                        </div>
                        <button
                            onClick={handleCopyMyId}
                            style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                borderRadius: '8px',
                                background: copied ? '#2ed573' : 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: '#fff',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            {copied ? '✓ ¡Copiado!' : '📋 Copiar ID'}
                        </button>
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex-row gap-2" style={{ width: '100%' }}>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o ID de jugador…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: '1.5px solid rgba(255,255,255,0.2)',
                                background: 'rgba(0,0,0,0.4)',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none',
                            }}
                        />
                        <button
                            type="submit"
                            disabled={searching || !searchQuery.trim()}
                            className="btn-upgrade"
                            style={{ padding: '10px 18px', fontSize: '13px', whiteSpace: 'nowrap' }}
                        >
                            {searching ? 'Buscando…' : 'Buscar'}
                        </button>
                    </form>

                    {/* Search Results */}
                    {searchResults.filter(p => !isSelf(p)).length > 0 && (
                        <div className="flex-col gap-2">
                            <span style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: 800, textTransform: 'uppercase' }}>
                                Resultados de Búsqueda:
                            </span>
                            {searchResults.filter(p => !isSelf(p)).map(p => {
                                const isFriend = friends.some(f => f.id === p.id);
                                const isSent = sentIds.includes(p.id);
                                const kConfig = getKingdomConfig(p.kingdom);

                                return (
                                    <div
                                        key={p.id}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <div className="flex-row gap-3" style={{ alignItems: 'center' }}>
                                            <img
                                                src={AVATAR_IMAGES[p.avatar] || AVATAR_IMAGES.warrior}
                                                alt=""
                                                style={{ width: '40px', height: '40px', borderRadius: '10px' }}
                                            />
                                            <div className="flex-col" style={{ gap: '1px' }}>
                                                <b style={{ fontSize: '14px', color: '#fff' }}>{p.name}</b>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                                                    {kConfig.icon} Ayunt. Nv.{p.level} · {leagueFor(p.trophies).icon} {p.trophies} 🏆
                                                </div>
                                            </div>
                                        </div>

                                        {isFriend ? (
                                            <span style={{ fontSize: '12px', color: '#7bed9f', fontWeight: 700 }}>✓ Amigos</span>
                                        ) : isSent ? (
                                            <span style={{ fontSize: '12px', color: '#ffd700', fontWeight: 700 }}>⏳ Enviada</span>
                                        ) : (
                                            <button
                                                className="btn-upgrade"
                                                onClick={() => handleSendRequest(p.id)}
                                                style={{ padding: '6px 14px', fontSize: '12px' }}
                                            >
                                                ➕ Añadir
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Suggested Real Players (registered in Supabase database) */}
                    {suggestedPlayers.filter(p => !isSelf(p)).length > 0 && (
                        <div className="flex-col gap-2" style={{ marginTop: '8px' }}>
                            <div className="flex-row gap-1" style={{ alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#74b9ff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                    ✨ Jugadores Registrados Recientes:
                                </span>
                            </div>
                            <div className="flex-col gap-2">
                                {suggestedPlayers.filter(p => !isSelf(p)).map(p => {
                                    const isFriend = friends.some(f => f.id === p.id);
                                    const isSent = sentIds.includes(p.id);
                                    const kConfig = getKingdomConfig(p.kingdom);

                                    return (
                                        <div
                                            key={p.id}
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.7), rgba(15, 12, 25, 0.8))',
                                                border: '1px solid rgba(255,255,255,0.12)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <div className="flex-row gap-3" style={{ alignItems: 'center' }}>
                                                <img
                                                    src={AVATAR_IMAGES[p.avatar] || AVATAR_IMAGES.warrior}
                                                    alt=""
                                                    style={{ width: '40px', height: '40px', borderRadius: '10px' }}
                                                />
                                                <div className="flex-col" style={{ gap: '1px' }}>
                                                    <b style={{ fontSize: '14px', color: '#fff' }}>{p.name}</b>
                                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                                                        {kConfig.icon} Ayunt. Nv.{p.level} · {leagueFor(p.trophies).icon} {p.trophies} 🏆
                                                    </div>
                                                </div>
                                            </div>

                                            {isFriend ? (
                                                <span style={{ fontSize: '12px', color: '#7bed9f', fontWeight: 700 }}>✓ Amigos</span>
                                            ) : isSent ? (
                                                <span style={{ fontSize: '12px', color: '#ffd700', fontWeight: 700 }}>⏳ Enviada</span>
                                            ) : (
                                                <button
                                                    className="btn-upgrade"
                                                    onClick={() => handleSendRequest(p.id)}
                                                    style={{ padding: '6px 14px', fontSize: '12px' }}
                                                >
                                                    ➕ Enviar Solicitud
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
