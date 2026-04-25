'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Game {
  id: number
  name: string
  price: string
  image_url: string
  steam_url: string
}

export default function DeletePage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchGames = () => {
    setLoading(true)
    fetch('http://localhost:3000/games')
      .then(res => res.json())
      .then(data => {
        setGames(data)
        setLoading(false)
      })
      .catch(() => {
        showToast('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบ Server', 'error')
        setLoading(false)
      })
  }

  useEffect(() => { fetchGames() }, [])

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const res = await fetch(`http://localhost:3000/delete-game/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      setGames(prev => prev.filter(g => g.id !== id))
      showToast('ลบเกมสำเร็จแล้ว!', 'success')
    } catch {
      showToast('เกิดข้อผิดพลาดในการลบเกม', 'error')
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  const filtered = games.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f1216', color: '#eee', fontFamily: '"Lato", sans-serif', padding: '30px 20px' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'success' ? '#1a3a1a' : '#3a1a1a',
          color: toast.type === 'success' ? '#4caf50' : '#ff4d4d',
          border: `1px solid ${toast.type === 'success' ? '#4caf50' : '#ff4d4d'}`,
          padding: '14px 20px', borderRadius: '10px',
          fontSize: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.3s ease',
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <button onClick={() => router.push('/')} style={backBtnStyle}>← Back</button>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700 }}>🗑️ Delete Game</h1>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="🔍 ค้นหาชื่อเกม..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', maxWidth: '420px', padding: '10px 16px',
          background: '#1e1e1e', border: '1px solid #444', borderRadius: '8px',
          color: 'white', fontSize: '15px', marginBottom: '24px', boxSizing: 'border-box',
        }}
      />

      {/* Game Count */}
      <p style={{ color: '#888', marginBottom: '16px', fontSize: '14px' }}>
        แสดง {filtered.length} จาก {games.length} เกม
      </p>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>กำลังโหลด...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
          {filtered.map(game => (
            <div key={game.id} style={{
              background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden',
              border: confirmId === game.id ? '2px solid #ff4d4d' : '1px solid #2a2a3e',
              transition: 'border 0.2s, transform 0.2s',
              transform: confirmId === game.id ? 'scale(1.02)' : 'scale(1)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}>
              {/* Game Image */}
              <div style={{ position: 'relative', height: '150px', background: '#111' }}>
                {game.image_url ? (
                  <img src={game.image_url} alt={game.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontSize: '40px' }}>🎮</div>
                )}
                {/* ID badge */}
                <span style={{
                  position: 'absolute', top: '8px', left: '8px',
                  background: 'rgba(0,0,0,0.7)', color: '#aaa',
                  padding: '2px 8px', borderRadius: '6px', fontSize: '12px',
                }}>#{game.id}</span>
              </div>

              {/* Info */}
              <div style={{ padding: '14px' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>{game.name}</h3>
                <p style={{
                  margin: '0 0 14px',
                  color: parseFloat(game.price) === 0 ? '#4caf50' : '#f39c12',
                  fontWeight: 700, fontSize: '16px',
                }}>
                  {parseFloat(game.price) === 0 ? 'FREE' : `฿${parseFloat(game.price).toLocaleString()}`}
                </p>

                {/* Confirm UI */}
                {confirmId === game.id ? (
                  <div>
                    <p style={{ color: '#ff4d4d', fontSize: '13px', marginBottom: '10px', textAlign: 'center' }}>
                      ⚠️ ยืนยันการลบ "{game.name}" ?
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleDelete(game.id)}
                        disabled={deletingId === game.id}
                        style={{ ...confirmBtnStyle, background: '#c0392b' }}
                      >
                        {deletingId === game.id ? 'กำลังลบ...' : '🗑️ ยืนยันลบ'}
                      </button>
                      <button onClick={() => setConfirmId(null)} style={{ ...confirmBtnStyle, background: '#444' }}>
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(game.id)}
                    style={{
                      width: '100%', padding: '9px', background: '#2d1a1a',
                      color: '#ff4d4d', border: '1px solid #ff4d4d',
                      borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                      fontWeight: 600, transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#c0392b')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#2d1a1a')}
                  >
                    🗑️ ลบเกมนี้
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎮</div>
          <p>ไม่พบเกมที่ค้นหา</p>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}

const backBtnStyle: React.CSSProperties = {
  padding: '8px 16px', background: 'transparent', color: '#aaa',
  border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
}

const confirmBtnStyle: React.CSSProperties = {
  flex: 1, padding: '8px', color: 'white', border: 'none',
  borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
}