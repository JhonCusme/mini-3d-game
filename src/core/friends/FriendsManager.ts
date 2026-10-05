import type { AvatarType, KingdomType } from '../GameState';
import type { VillageSnapshot } from '../pvp/PvpTypes';
import { pvpService } from '../pvp/PvpService';

export interface FriendInfo {
    id: string;
    name: string;
    avatar: AvatarType;
    kingdom: KingdomType;
    level: number;
    trophies: number;
    onlineUntil?: number;
    updatedAt: number;
    snapshot?: VillageSnapshot;
}

export interface FriendRequest {
    id: string;
    fromId: string;
    fromName: string;
    fromAvatar: AvatarType;
    fromKingdom: KingdomType;
    fromLevel: number;
    fromTrophies: number;
    createdAt: number;
}

export class FriendsManager {
    private static getFriendsKey(playerId: string): string {
        return `mini_friends_${playerId}`;
    }

    private static getRequestsKey(playerId: string): string {
        return `mini_friend_requests_${playerId}`;
    }

    private static getSentKey(playerId: string): string {
        return `mini_sent_requests_${playerId}`;
    }

    static getLocalFriends(playerId: string): FriendInfo[] {
        try {
            const raw = localStorage.getItem(this.getFriendsKey(playerId));
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    static setLocalFriends(playerId: string, friends: FriendInfo[]) {
        try {
            localStorage.setItem(this.getFriendsKey(playerId), JSON.stringify(friends));
        } catch { /* ignore */ }
    }

    static getLocalRequests(playerId: string): FriendRequest[] {
        try {
            const raw = localStorage.getItem(this.getRequestsKey(playerId));
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    static setLocalRequests(playerId: string, reqs: FriendRequest[]) {
        try {
            localStorage.setItem(this.getRequestsKey(playerId), JSON.stringify(reqs));
        } catch { /* ignore */ }
    }

    static getSentRequestIds(playerId: string): string[] {
        try {
            const raw = localStorage.getItem(this.getSentKey(playerId));
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    static addSentRequestId(myPlayerId: string, targetId: string) {
        try {
            const list = this.getSentRequestIds(myPlayerId).filter(id => id !== targetId);
            list.push(targetId);
            localStorage.setItem(this.getSentKey(myPlayerId), JSON.stringify(list));
        } catch { /* ignore */ }
    }

    /**
     * Loads friends with up-to-date stats from Supabase (or cached local fallback).
     */
    static async loadFriends(myPlayerId: string): Promise<FriendInfo[]> {
        const local = this.getLocalFriends(myPlayerId);
        if (!pvpService.fetchVillage) return local;

        // Refresh stats for each friend from Supabase
        const updated: FriendInfo[] = [];
        for (const f of local) {
            try {
                const snap = await pvpService.fetchVillage(f.id);
                if (snap) {
                    updated.push({
                        id: snap.playerId,
                        name: snap.name,
                        avatar: snap.avatar,
                        kingdom: snap.kingdom,
                        level: snap.level,
                        trophies: snap.trophies,
                        onlineUntil: snap.onlineUntil,
                        updatedAt: snap.updatedAt,
                        snapshot: snap,
                    });
                } else {
                    updated.push(f);
                }
            } catch {
                updated.push(f);
            }
        }
        this.setLocalFriends(myPlayerId, updated);
        return updated;
    }

    /**
     * Loads incoming requests sent by other players.
     */
    static async loadIncomingRequests(myPlayerId: string): Promise<FriendRequest[]> {
        const local = this.getLocalRequests(myPlayerId);
        if (!pvpService.fetchVillage) return local;

        try {
            const mySnap = await pvpService.fetchVillage(myPlayerId);
            if (mySnap && mySnap.pendingFriendRequests) {
                const combined = [...mySnap.pendingFriendRequests];
                // Deduplicate with local
                const map = new Map<string, FriendRequest>();
                for (const r of [...local, ...combined]) {
                    map.set(r.id || r.fromId, r);
                }
                const merged = Array.from(map.values());
                this.setLocalRequests(myPlayerId, merged);
                return merged;
            }
        } catch (e) {
            console.warn('Friends: could not load online requests', e);
        }
        return local;
    }

    /**
     * Sends a friend request to a target player.
     */
    static async sendFriendRequest(targetPlayerId: string, me: VillageSnapshot): Promise<{ success: boolean; message: string }> {
        if (!targetPlayerId || targetPlayerId === me.playerId) {
            return { success: false, message: 'No puedes enviarte solicitud a ti mismo' };
        }

        const friends = this.getLocalFriends(me.playerId);
        if (friends.some(f => f.id === targetPlayerId)) {
            return { success: false, message: 'Ya eres amigo de este jugador' };
        }

        const sent = this.getSentRequestIds(me.playerId);
        if (sent.includes(targetPlayerId)) {
            return { success: false, message: 'Ya enviaste una solicitud a este jugador' };
        }

        this.addSentRequestId(me.playerId, targetPlayerId);

        if (pvpService.fetchVillage && pvpService.updateVillageSnapshot) {
            try {
                const targetSnap = await pvpService.fetchVillage(targetPlayerId);
                if (!targetSnap) {
                    return { success: false, message: 'No se encontró la aldea del jugador' };
                }

                const existingReqs = targetSnap.pendingFriendRequests || [];
                if (!existingReqs.some(r => r.fromId === me.playerId)) {
                    const newReq: FriendRequest = {
                        id: `req_${me.playerId}_${Date.now()}`,
                        fromId: me.playerId,
                        fromName: me.name,
                        fromAvatar: me.avatar,
                        fromKingdom: me.kingdom,
                        fromLevel: me.level,
                        fromTrophies: me.trophies,
                        createdAt: Date.now(),
                    };
                    await pvpService.updateVillageSnapshot(targetPlayerId, {
                        pendingFriendRequests: [...existingReqs, newReq],
                    });
                }
                return { success: true, message: `¡Solicitud enviada a ${targetSnap.name}!` };
            } catch (e) {
                console.warn('Friends: failed to send request online', e);
            }
        }

        return { success: true, message: '¡Solicitud registrada con éxito!' };
    }

    /**
     * Accepts an incoming friend request.
     */
    static async acceptFriendRequest(req: FriendRequest, me: VillageSnapshot): Promise<boolean> {
        // 1. Add to local friends
        const currentFriends = this.getLocalFriends(me.playerId);
        if (!currentFriends.some(f => f.id === req.fromId)) {
            currentFriends.push({
                id: req.fromId,
                name: req.fromName,
                avatar: req.fromAvatar,
                kingdom: req.fromKingdom,
                level: req.fromLevel,
                trophies: req.fromTrophies,
                updatedAt: Date.now(),
            });
            this.setLocalFriends(me.playerId, currentFriends);
        }

        // 2. Remove from local requests
        const currentReqs = this.getLocalRequests(me.playerId).filter(r => r.fromId !== req.fromId && r.id !== req.id);
        this.setLocalRequests(me.playerId, currentReqs);

        // 3. Sync to Supabase
        if (pvpService.updateVillageSnapshot) {
            try {
                // Update my village snapshot
                await pvpService.updateVillageSnapshot(me.playerId, {
                    pendingFriendRequests: currentReqs,
                    friends: currentFriends.map(f => f.id),
                });

                // Also update the sender's village so they see me in their friends list
                if (pvpService.fetchVillage) {
                    const senderSnap = await pvpService.fetchVillage(req.fromId);
                    if (senderSnap) {
                        const senderFriends = senderSnap.friends || [];
                        if (!senderFriends.includes(me.playerId)) {
                            await pvpService.updateVillageSnapshot(req.fromId, {
                                friends: [...senderFriends, me.playerId],
                            });
                        }
                    }
                }
            } catch (e) {
                console.warn('Friends: failed to sync accept online', e);
            }
        }

        return true;
    }

    /**
     * Rejects an incoming friend request.
     */
    static async rejectFriendRequest(requestId: string, mePlayerId: string): Promise<boolean> {
        const currentReqs = this.getLocalRequests(mePlayerId).filter(r => r.id !== requestId && r.fromId !== requestId);
        this.setLocalRequests(mePlayerId, currentReqs);

        if (pvpService.updateVillageSnapshot) {
            try {
                await pvpService.updateVillageSnapshot(mePlayerId, {
                    pendingFriendRequests: currentReqs,
                });
            } catch (e) {
                console.warn('Friends: failed to sync reject online', e);
            }
        }
        return true;
    }

    /**
     * Removes an existing friend.
     */
    static async removeFriend(friendId: string, mePlayerId: string): Promise<boolean> {
        const filtered = this.getLocalFriends(mePlayerId).filter(f => f.id !== friendId);
        this.setLocalFriends(mePlayerId, filtered);

        if (pvpService.updateVillageSnapshot) {
            try {
                await pvpService.updateVillageSnapshot(mePlayerId, {
                    friends: filtered.map(f => f.id),
                });
            } catch (e) {
                console.warn('Friends: failed to sync remove online', e);
            }
        }
        return true;
    }

    /**
     * Searches for registered players by name or ID.
     */
    static async searchPlayers(query: string, mePlayerId: string): Promise<FriendInfo[]> {
        if (!pvpService.searchPlayers) return [];
        const snaps = await pvpService.searchPlayers(query, mePlayerId);
        return snaps.map(s => ({
            id: s.playerId,
            name: s.name,
            avatar: s.avatar,
            kingdom: s.kingdom,
            level: s.level,
            trophies: s.trophies,
            onlineUntil: s.onlineUntil,
            updatedAt: s.updatedAt,
            snapshot: s,
        }));
    }

    /**
     * Gets suggested active real players to easily add them with 1 tap.
     */
    static async getSuggestedPlayers(mePlayerId: string): Promise<FriendInfo[]> {
        if (!pvpService.getRecentRealPlayers) return [];
        const snaps = await pvpService.getRecentRealPlayers(mePlayerId, 12);
        const myFriends = this.getLocalFriends(mePlayerId);
        const friendIds = new Set(myFriends.map(f => f.id));

        return snaps
            .filter(s => !friendIds.has(s.playerId) && s.playerId !== mePlayerId)
            .map(s => ({
                id: s.playerId,
                name: s.name,
                avatar: s.avatar,
                kingdom: s.kingdom,
                level: s.level,
                trophies: s.trophies,
                onlineUntil: s.onlineUntil,
                updatedAt: s.updatedAt,
                snapshot: s,
            }));
    }

    /**
     * Fetches a friend's full village snapshot to challenge them to a friendly battle.
     */
    static async getFriendVillage(friendId: string): Promise<VillageSnapshot | null> {
        if (!pvpService.fetchVillage) return null;
        return pvpService.fetchVillage(friendId);
    }
}
