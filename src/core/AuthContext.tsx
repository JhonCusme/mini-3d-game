import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { GameState } from './GameState';

export interface GameUser {
    id: string;
    email?: string;
    name?: string;
    isGuest: boolean;
}

interface AuthContextType {
    user: GameUser | null;
    isLoading: boolean;
    isConfigured: boolean;
    isRecoveryMode: boolean;
    setIsRecoveryMode: (val: boolean) => void;
    login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
    signup: (email: string, pass: string, name?: string) => Promise<{ success: boolean; error?: string }>;
    resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
    verifyRecoveryOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
    updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
    playAsGuest: () => void;
    logout: () => Promise<void>;
    saveToCloud: (state: GameState) => Promise<boolean>;
    loadFromCloud: () => Promise<GameState | null>;
}

const GUEST_STORAGE_KEY = 'mini_kingdom_guest_mode';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<GameUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function initAuth() {
            try {
                // Check if user landed from a password recovery link
                if (typeof window !== 'undefined') {
                    const hash = window.location.hash || '';
                    const search = window.location.search || '';
                    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
                        setIsRecoveryMode(true);
                    }
                }

                if (supabase && isSupabaseConfigured) {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user && mounted) {
                        setUser({
                            id: session.user.id,
                            email: session.user.email,
                            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
                            isGuest: false,
                        });
                        setIsLoading(false);
                        return;
                    }
                }

                // Check guest mode flag
                const isGuest = localStorage.getItem(GUEST_STORAGE_KEY) === 'true';
                if (isGuest && mounted) {
                    setUser({
                        id: 'guest_' + (localStorage.getItem('mini_kingdom_guest_id') || Math.random().toString(36).substring(2, 9)),
                        name: 'Comandante Invitado',
                        isGuest: true,
                    });
                }
            } catch (err) {
                console.warn('Auth initialization error:', err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        }

        initAuth();

        if (supabase) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (!mounted) return;
                if (event === 'PASSWORD_RECOVERY') {
                    setIsRecoveryMode(true);
                }
                if (session?.user) {
                    localStorage.removeItem(GUEST_STORAGE_KEY);
                    setUser({
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
                        isGuest: false,
                    });
                } else if (!localStorage.getItem(GUEST_STORAGE_KEY)) {
                    setUser(null);
                }
            });

            return () => {
                mounted = false;
                subscription.unsubscribe();
            };
        }

        return () => {
            mounted = false;
        };
    }, []);

    const resetPasswordForEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
        if (!supabase) {
            return { success: false, error: 'Servidor no configurado en este entorno.' };
        }
        try {
            const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo,
            });
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (err: unknown) {
            return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
        }
    };

    const verifyRecoveryOtp = async (email: string, token: string): Promise<{ success: boolean; error?: string }> => {
        if (!supabase) {
            return { success: false, error: 'Servidor no configurado en este entorno.' };
        }
        try {
            const cleanToken = token.trim();
            const { data, error } = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: cleanToken,
                type: 'recovery',
            });
            if (error) {
                return { success: false, error: error.message };
            }
            if (data.session && data.user) {
                setIsRecoveryMode(true);
                setUser({
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
                    isGuest: false,
                });
                return { success: true };
            }
            return { success: false, error: 'Código de verificación no válido o caducado.' };
        } catch (err: unknown) {
            return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
        }
    };

    const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
        if (!supabase) {
            return { success: false, error: 'Servidor no configurado en este entorno.' };
        }
        try {
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (error) {
                return { success: false, error: error.message };
            }
            if (data.user) {
                setIsRecoveryMode(false);
                setUser({
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
                    isGuest: false,
                });
                if (typeof window !== 'undefined' && window.history?.replaceState) {
                    window.history.replaceState(null, '', window.location.pathname);
                }
                return { success: true };
            }
            return { success: false, error: 'No se pudo actualizar la contraseña.' };
        } catch (err: unknown) {
            return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
        }
    };

    const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
        if (!supabase) {
            return { success: false, error: 'Servidor no configurado en este entorno.' };
        }
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: pass,
            });
            if (error) {
                return { success: false, error: error.message };
            }
            if (data.user) {
                localStorage.removeItem(GUEST_STORAGE_KEY);
                setUser({
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
                    isGuest: false,
                });
                return { success: true };
            }
            return { success: false, error: 'No se pudo iniciar sesión.' };
        } catch (err: unknown) {
            return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
        }
    };

    const signup = async (email: string, pass: string, name?: string): Promise<{ success: boolean; error?: string }> => {
        if (!supabase) {
            return { success: false, error: 'Servidor no configurado en este entorno.' };
        }
        try {
            const cleanEmail = email.trim().toLowerCase();
            const { data, error } = await supabase.auth.signUp({
                email: cleanEmail,
                password: pass,
                options: {
                    data: { name: name?.trim() || 'Comandante' }
                }
            });
            if (error) {
                return { success: false, error: error.message };
            }
            // Supabase returns an empty identities array if an account with this email already exists
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                return { success: false, error: 'Ya existe una cuenta registrada con este correo electrónico. Por favor inicia sesión.' };
            }
            if (data.user) {
                localStorage.removeItem(GUEST_STORAGE_KEY);
                setUser({
                    id: data.user.id,
                    email: data.user.email,
                    name: name?.trim() || data.user.email?.split('@')[0],
                    isGuest: false,
                });
                return { success: true };
            }
            return { success: false, error: 'Error al registrar la cuenta.' };
        } catch (err: unknown) {
            return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
        }
    };

    const playAsGuest = () => {
        localStorage.setItem(GUEST_STORAGE_KEY, 'true');
        let guestId = localStorage.getItem('mini_kingdom_guest_id');
        if (!guestId) {
            guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('mini_kingdom_guest_id', guestId);
        }
        setUser({
            id: guestId,
            name: 'Comandante Invitado',
            isGuest: true,
        });
    };

    const logout = async () => {
        if (supabase) {
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.warn('Error signing out:', e);
            }
        }
        localStorage.removeItem(GUEST_STORAGE_KEY);
        setUser(null);
    };

    const saveToCloud = async (state: GameState): Promise<boolean> => {
        if (!supabase || !user || user.isGuest) return false;
        try {
            const { error } = await supabase
                .from('player_saves')
                .upsert({
                    user_id: user.id,
                    player_id: state.playerId,
                    game_state: state,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (error) {
                // Table might not exist yet if schema wasn't run
                console.warn('Could not save to cloud:', error.message);
                return false;
            }
            return true;
        } catch (e) {
            console.warn('Cloud save failed:', e);
            return false;
        }
    };

    const loadFromCloud = async (): Promise<GameState | null> => {
        if (!supabase || !user || user.isGuest) return null;
        try {
            const { data, error } = await supabase
                .from('player_saves')
                .select('game_state')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error || !data) return null;
            return data.game_state as GameState;
        } catch (e) {
            console.warn('Cloud load failed:', e);
            return null;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isConfigured: isSupabaseConfigured,
            isRecoveryMode,
            setIsRecoveryMode,
            login,
            signup,
            resetPasswordForEmail,
            verifyRecoveryOtp,
            updatePassword,
            playAsGuest,
            logout,
            saveToCloud,
            loadFromCloud,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
