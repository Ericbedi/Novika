-- ==============================================================================
-- NOVIKA COD — MIGRATION : MODE PRIVÉ, INVITATIONS D'ÉQUIPE & SÉCURITÉ (PROMPT 18)
-- PostgreSQL / Supabase
-- ==============================================================================

-- 1. TABLE DES INVITATIONS D'ÉQUIPE (Valable 7 jours, token unique, usage unique)
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'closer', -- 'admin', 'manager', 'closer', 'rider', 'agency'
    store_ids TEXT[] DEFAULT '{}',
    country VARCHAR(2), -- 'TG', 'CI', 'SN', 'BJ'
    invited_by TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'canceled', 'expired'
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ
);

-- 2. TABLE DE SÉCURITÉ UTILISATEUR & DOUBLE AUTHENTIFICATION (2FA)
CREATE TABLE IF NOT EXISTS public.user_security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL UNIQUE,
    is_owner BOOLEAN NOT NULL DEFAULT false,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_secret TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended'
    suspended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLE DES SESSIONS ACTIVES (Déconnexion multi-appareils & révocation immédiate)
CREATE TABLE IF NOT EXISTS public.auth_sessions (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    is_valid BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. JOURNAL D'AUDIT DE SÉCURITÉ APPEND-ONLY
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event TEXT NOT NULL,
    user_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. POLITIQUES RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "owner_manage_invitations" ON public.team_invitations;
    CREATE POLICY "owner_manage_invitations" ON public.team_invitations
        FOR ALL TO authenticated
        USING (auth.jwt() ->> 'email' = (SELECT user_email FROM public.user_security_settings WHERE is_owner = true LIMIT 1))
        WITH CHECK (auth.jwt() ->> 'email' = (SELECT user_email FROM public.user_security_settings WHERE is_owner = true LIMIT 1));

    DROP POLICY IF EXISTS "security_settings_owner_read" ON public.user_security_settings;
    CREATE POLICY "security_settings_owner_read" ON public.user_security_settings
        FOR SELECT TO authenticated
        USING (auth.jwt() ->> 'email' = user_email OR (SELECT is_owner FROM public.user_security_settings WHERE user_email = auth.jwt() ->> 'email') = true);

    DROP POLICY IF EXISTS "sessions_user_view_own" ON public.auth_sessions;
    CREATE POLICY "sessions_user_view_own" ON public.auth_sessions
        FOR SELECT TO authenticated
        USING (auth.jwt() ->> 'email' = user_email);

    DROP POLICY IF EXISTS "audit_owner_view" ON public.auth_audit_log;
    CREATE POLICY "audit_owner_view" ON public.auth_audit_log
        FOR SELECT TO authenticated
        USING ((SELECT is_owner FROM public.user_security_settings WHERE user_email = auth.jwt() ->> 'email') = true);
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;
