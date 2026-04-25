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

interface Tag {
  id: number
  tag_name: string
}

export default function EditPage() {
  const router = useRouter()

  // Step: 'list' | 'form'
  const [step, setStep] = useState<'list' | 'form'>('list')

  const [games, setGames] = useState<Game[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [search, setSearch] = useState('')
  const [loadingGames, setLoadingGames] = useState(true)

  // Form state
  const [editGame, setEditGame] = useState<Game | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [steamUrl, setSteamUrl] = useState('')
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    // Load games
    fetch('http://localhost:3000/games')
      .then(res => res.json())
      .then(data => { setGames(data); setLoadingGames(false) })
      .catch(() => { showToast('ไม่สามารถโหลดข้อมูลได้', 'error'); setLoadingGames(false) })

    // Load tags
    fetch('http://localhost:3000/tags')
      .then(res => res.json())
      .then(data => setAllTags(data))
  }, [])

  const openEditForm = async (game: Game) => {
    setEditGame(game)
    setName(game.name)
    setPrice(String(parseFloat(game.price)))
    setImageUrl(game.image_url || '')
    setSteamUrl(game.steam_url || '')

    // Load tags for this game
    try {
      const res = await fetch(`http://localhost:3000/game-tags/${game.id}`)
      const data: Tag[] = await res.json()
      setSelectedTags(data.map(t => t.id))
    } catch {
      setSelectedTags([])
    }

    setStep('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleTagToggle = (id: number) => {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (!editGame) return
    if (!name.trim()) return showToast('กรุณากรอกชื่อเกม', 'error')
    if (!price || isNaN(Number(price))) return showToast('กรุณากรอกราคาให้ถูกต้อง', 'error')

    setSaving(true)
    try {
      const res = await fetch(`http://localhost:3000/edit-game/${editGame.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          price: parseFloat(price),
          image_url: imageUrl.trim() || null,
          steam_url: steamUrl.trim() || null,
          tags: selectedTags,
        }),
      })
      if (!res.ok) throw new Error()

      // Update local list
      setGames(prev => prev.map(g =>
        g.id === editGame.id
          ? { ...g, name: name.trim(), price: String(parseFloat(price)), image_url: imageUrl.trim(), steam_url: steamUrl.trim() }
          : g
      ))

      showToast('บันทึกการแก้ไขสำเร็จ!', 'success')
      setTimeout(() => { setStep('list') }, 1200)
    } catch {
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error')
    } finally {
      setSaving(false)
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
          padding: '14px 20px', borderRadius: '10px', fontSize: '15px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.3s ease',
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* ===== STEP: LIST ===== */}
      {step === 'list' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
            <button onClick={() => router.push('/')} style={backBtnStyle}>← Back</button>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700 }}>✏️ Edit Game</h1>
          </div>

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

          <p style={{ color: '#888', marginBottom: '16px', fontSize: '14px' }}>
            แสดง {filtered.length} จาก {games.length} เกม — คลิกที่เกมเพื่อแก้ไข
          </p>

          {loadingGames ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>กำลังโหลด...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
              {filtered.map(game => (
                <div
                  key={game.id}
                  onClick={() => openEditForm(game)}
                  style={{
                    background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden',
                    border: '1px solid #2a2a3e', cursor: 'pointer',
                    transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.borderColor = '#3498db'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(52,152,219,0.2)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = '#2a2a3e'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'
                  }}
                >
                  <div style={{ position: 'relative', height: '150px', background: '#111' }}>
                    {game.image_url ? (
                      <img src={game.image_url} alt={game.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontSize: '40px' }}>🎮</div>
                    )}
                    <span style={{
                      position: 'absolute', top: '8px', left: '8px',
                      background: 'rgba(0,0,0,0.7)', color: '#aaa',
                      padding: '2px 8px', borderRadius: '6px', fontSize: '12px',
                    }}>#{game.id}</span>
                    <span style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: '#3498db', color: 'white',
                      padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    }}>✏️ แก้ไข</span>
                  </div>
                  <div style={{ padding: '14px' }}>
                    <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>{game.name}</h3>
                    <p style={{
                      margin: 0,
                      color: parseFloat(game.price) === 0 ? '#4caf50' : '#f39c12',
                      fontWeight: 700, fontSize: '15px',
                    }}>
                      {parseFloat(game.price) === 0 ? 'FREE' : `฿${parseFloat(game.price).toLocaleString()}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingGames && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎮</div>
              <p>ไม่พบเกมที่ค้นหา</p>
            </div>
          )}
        </>
      )}

      {/* ===== STEP: FORM ===== */}
      {step === 'form' && editGame && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
            <button onClick={() => setStep('list')} style={backBtnStyle}>← รายการเกม</button>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>✏️ แก้ไข: {editGame.name}</h1>
          </div>

          {/* Name */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>ชื่อเกม <span style={{ color: 'red' }}>*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อเกม" style={inputStyle} />
          </div>

          {/* Price */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>ราคา (฿) <span style={{ color: 'red' }}>*</span></label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" min="0" step="0.01" style={inputStyle} />
          </div>

          {/* Image URL */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Image URL</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
            {imageUrl && (
              <img src={imageUrl} alt="preview"
                style={{ marginTop: '8px', width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }}
                onError={e => (e.currentTarget.style.display = 'none')}
                onLoad={e => (e.currentTarget.style.display = 'block')}
              />
            )}
          </div>

          {/* Steam URL */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Steam URL</label>
            <input value={steamUrl} onChange={e => setSteamUrl(e.target.value)} placeholder="https://store.steampowered.com/app/..." style={inputStyle} />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>
              Tags{' '}
              <span style={{ color: '#888', fontWeight: 400, fontSize: '13px' }}>
                ({selectedTags.length} เลือกอยู่)
              </span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {allTags.map(tag => {
                const selected = selectedTags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    style={{
                      padding: '6px 14px',
                      background: selected ? '#2196f3' : '#2a2a3e',
                      color: selected ? '#fff' : '#aaa',
                      border: selected ? '1px solid #2196f3' : '1px solid #3a3a5e',
                      borderRadius: '20px', cursor: 'pointer',
                      fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tag.tag_name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, padding: '13px',
                background: saving ? '#555' : '#2196f3',
                color: 'white', border: 'none', borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '16px', fontWeight: 700,
              }}
            >
              {saving ? 'กำลังบันทึก...' : '💾 บันทึกการแก้ไข'}
            </button>
            <button onClick={() => setStep('list')} style={{ ...backBtnStyle, padding: '13px 20px', fontSize: '15px' }}>
              ยกเลิก
            </button>
          </div>
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

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '7px', color: '#ccc', fontSize: '14px', fontWeight: 600,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: '#1e1e1e', border: '1px solid #444', borderRadius: '8px',
  color: 'white', fontSize: '15px', boxSizing: 'border-box',
}