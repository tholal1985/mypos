import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

interface Business {
  id: string
  name: string
  currency: string
  currency_symbol: string
  tax_label: string
  default_tax_rate: number
  logo_url: string | null
  settings: Record<string, unknown>
}

interface AuthState {
  session: Session | null
  user: User | null
  business: Business | null
  businesses: Business[]
  isPlatformAdmin: boolean
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, businessName: string) => Promise<void>
  signOut: () => Promise<void>
  setBusiness: (business: Business) => void
  refreshBusinesses: () => Promise<void>
  refreshPlatformAdmin: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  business: null,
  businesses: [],
  isPlatformAdmin: false,
  loading: true,
  error: null,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      set({ session, user: session.user })
      await get().refreshBusinesses()
      await get().refreshPlatformAdmin()
    }
    set({ loading: false })

    supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        set({ session, user: session?.user ?? null })
        if (session) {
          await get().refreshBusinesses()
          await get().refreshPlatformAdmin()
        } else {
          set({ business: null, businesses: [], isPlatformAdmin: false })
        }
      })()
    })
  },

  refreshBusinesses: async () => {
    const user = get().user
    if (!user) return

    const { data: businessUsers, error } = await supabase
      .from('business_users')
      .select('business_id, is_default, businesses(*)')
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to load businesses', error)
      set({ error: 'We could not load your business information. Please try again.' })
      return
    }

    const businesses: Business[] = (businessUsers || [])
      .map((bu: any) => bu.businesses)
      .filter(Boolean)

    const current = get().business
    const defaultBu = (businessUsers || []).find((bu: any) => bu.is_default)
    const selected = current ?? (defaultBu?.businesses as unknown as Business) ?? businesses[0] ?? null

    set({ businesses, business: selected })
  },

  refreshPlatformAdmin: async () => {
    const user = get().user
    if (!user) {
      set({ isPlatformAdmin: false })
      return
    }
    const { data } = await supabase
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    set({ isPlatformAdmin: !!data })
  },

  signIn: async (email, password) => {
    set({ error: null })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: error.message })
      throw error
    }
  },

  signUp: async (email, password, businessName) => {
    set({ error: null })
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      console.error('Sign up failed', error)
      const generic = 'We could not create your account with those details. Please check them and try again.'
      set({ error: generic })
      throw new Error(generic)
    }

    if (data.user) {
      const { data: business } = await supabase
        .from('businesses')
        .insert({ name: businessName })
        .select()
        .single()

      if (business) {
        await supabase
          .from('business_users')
          .insert({
            business_id: business.id,
            user_id: data.user.id,
            role: 'admin',
            is_default: true,
          })
      }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, business: null, businesses: [], isPlatformAdmin: false })
  },

  setBusiness: (business) => {
    set({ business })
  },
}))
