'use client';

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ThemeToggle } from './ThemeToggle'
import './layout.css'
import { createClient } from '@/infrastructure/db/supabase-client'

type UserRole = 'admin' | 'member' | 'visitor'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)

  const isActive = (path: string) => pathname === path

  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!isMounted) return
      setUserEmail(user?.email ?? null)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (!isMounted) return
        setRole((profile?.role as UserRole) ?? 'member')
      } else {
        setRole(null)
      }
    }

    void loadUser()
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void loadUser()
    })

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-brand-container">
          <span className="nav-brand">Balela Trunfo</span>
          <span className="nav-sub-brand">SEASON PASS</span>
        </Link>

        <div className="nav-links">
          <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            HOME
          </Link>
          <Link href="/gerador" className={`nav-link ${isActive('/gerador') ? 'active' : ''}`}>
            GERADOR
          </Link>
          <Link href="/galeria" className={`nav-link ${isActive('/galeria') ? 'active' : ''}`}>
            GALERIA
          </Link>
          <Link href="/sobre" className={`nav-link ${isActive('/sobre') ? 'active' : ''}`}>
            SOBRE
          </Link>
          {userEmail && (
            <Link href="/perfil" className={`nav-link ${isActive('/perfil') ? 'active' : ''}`}>
              PERFIL
            </Link>
          )}
          {role === 'admin' && (
            <Link href="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
              DASHBOARD
            </Link>
          )}
        </div>

        <div className="nav-actions">
          <ThemeToggle />
          {userEmail ? (
            <div className="nav-user">
              <div className="nav-user-chip">
                <div className="nav-user-text">
                  <span className="nav-user-label">{userEmail}</span>
                  {role && <span className="nav-user-role">{role}</span>}
                </div>
                <button type="button" className="nav-signout" onClick={handleSignOut} aria-label="Sair">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn-enter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              ENTRAR
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
