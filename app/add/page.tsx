'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Tag = {
  id: number
  tag_name: string
}

export default function AddPage() {
  const router = useRouter()

  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [steamUrl, setSteamUrl] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch('http://localhost:3000/tags')
      .then(res => res.json())
      .then(data => setTags(data))
      .catch(() => setError('ไม่สามารถโหลด Tags ได้ กรุณาตรวจสอบ Server'))
  }, [])

  const handleTagChange = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedTags(prev => [...prev, id])
    } else {
      setSelectedTags(prev => prev.filter(t => t !== id))
    }
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    // Validate
    if (!name.trim()) return setError('กรุณากรอกชื่อเกม')
    if (!price.trim() || isNaN(Number(price))) return setError('กรุณากรอกราคาให้ถูกต้อง')

    setLoading(true)

    try {
      const res = await fetch('http://localhost:3000/add-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          price: parseFloat(price),
          image_url: imageUrl.trim() || null,
          steam_url: steamUrl.trim() || null,
          tags: selectedTags,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData?.message || 'เกิดข้อผิดพลาด')
      }

      setSuccess('✅ เพิ่มเกมสำเร็จแล้ว!')
      // Reset form
      setName('')
      setPrice('')
      setImageUrl('')
      setSteamUrl('')
      setSelectedTags([])

      // กลับหน้าหลักหลัง 1.5 วินาที
      setTimeout(() => router.push('/'), 1500)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'เกิดข้อผิดพลาดในการเพิ่มเกม')
      } else {
        setError('เกิดข้อผิดพลาดในการเพิ่มเกม')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '40px auto',
      padding: '30px',
      background: '#1e1e1e',
      borderRadius: '12px',
      color: 'white',
      fontFamily: '"Lato", sans-serif',
    }}>
      <h2 style={{ marginBottom: '24px', fontSize: '24px' }}>➕ Add New Game</h2>

      {/* Game Name */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', color: '#ccc' }}>
          ชื่อเกม <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="เช่น Elden Ring"
          style={inputStyle}
        />
      </div>

      {/* Price */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', color: '#ccc' }}>
          ราคา (฿) <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="number"
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder="เช่น 599 หรือ 0 ถ้าฟรี"
          min="0"
          step="0.01"
          style={inputStyle}
        />
      </div>

      {/* Image URL */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', color: '#ccc' }}>
          Image URL
        </label>
        <input
          type="text"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          placeholder="https://..."
          style={inputStyle}
        />
        {imageUrl && (
          <img
            src={imageUrl}
            alt="preview"
            style={{ marginTop: '8px', width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        )}
      </div>

      {/* Steam URL */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '6px', color: '#ccc' }}>
          Steam URL
        </label>
        <input
          type="text"
          value={steamUrl}
          onChange={e => setSteamUrl(e.target.value)}
          placeholder="https://store.steampowered.com/app/..."
          style={inputStyle}
        />
      </div>

      {/* Tags */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
          Tags
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {tags.map(tag => {
            const isSelected = selectedTags.includes(tag.id)
            return (
              <label
                key={tag.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  background: isSelected ? '#2196f3' : '#333',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #2196f3' : '1px solid #555',
                  transition: 'all 0.2s',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={e => handleTagChange(tag.id, e.target.checked)}
                  style={{ display: 'none' }}
                />
                {tag.tag_name}
              </label>
            )
          })}
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div style={{ marginBottom: '16px', color: '#ff4d4d', background: '#2a0000', padding: '10px 14px', borderRadius: '8px' }}>
          ❌ {error}
        </div>
      )}
      {success && (
        <div style={{ marginBottom: '16px', color: '#4caf50', background: '#002a00', padding: '10px 14px', borderRadius: '8px' }}>
          {success}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px',
            background: loading ? '#555' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'กำลังเพิ่ม...' : '✅ เพิ่มเกม'}
        </button>

        <button
          onClick={() => router.push('/')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            color: '#aaa',
            border: '1px solid #555',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: '#2a2a2a',
  border: '1px solid #444',
  borderRadius: '8px',
  color: 'white',
  fontSize: '15px',
  boxSizing: 'border-box',
}