'use client'

import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core'
import { useState, useEffect } from 'react'
import "./page.css";


//  17 TAG
const tags = [
  "action","rpg","openworld","multiplayer","singleplayer",
  "horror","strategy","relaxing","adventure","fps",
  "simulation","puzzle","survival","sandbox",
  "racing","sports","fighting"
]

//  TAG ลากได้
function DraggableTag({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id })

  const style = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    padding: '10px 16px',
    background: transform ? '#2196f3' : '#333',
    color: 'white',
    margin: '5px',
    borderRadius: '4px',
    cursor: 'grab',
    border: '1px solid #555',
    fontFamily: '"Lato", sans-serif',
    fontSize: '14px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    transition: 'background 0.2s ease',
    boxShadow: transform ? '0 5px 15px rgba(0,0,0,0.3)' : 'none',
    zIndex: transform ? 999 : 1
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {id}
    </div>
  )
}

interface DropBoxProps {
  items: string[];
  removeTag: (tag: string) => void;
  clearTags: () => void;
}

//  กล่อง Selected + ปุ่ม
function DropBox({ items, removeTag, clearTags }: DropBoxProps) {
  const { setNodeRef } = useDroppable({ id: "selected" })

  return (
    <div
      ref={setNodeRef}
      style={{
        width: '600px',
        minHeight: '150px',
        border: '2px dashed gray',
        padding: '15px',
        margin: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        gap: '10px'
      }}
    >
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <b className="lato-light">Selected Tags</b>

        {items.length > 0 && (
          <button
            onClick={clearTags}
            style={{
              background: 'transparent',
              color: '#ff4d4d',
              border: '1px solid #ff4d4d',
              padding: '2px 10px',
              borderRadius: '15px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: '"Lato", sans-serif'
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {items.map(tag => (
        <div
          key={tag}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#666',
            padding: '5px 12px',
            borderRadius: '6px',
            fontFamily: '"Lato", sans-serif',
          }}
        >
          <span style={{ marginRight: '10px', color: 'white' }}>{tag}</span>
          <button
            onClick={() => removeTag(tag)}
            style={{
              background: 'red',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
              padding: '0 5px'
            }}
          >
            X
          </button>
        </div>
      ))}
    </div>
  )
}

interface Game {
  id: string | number;
  name: string;
  image_url: string;
  price: string;
  steam_url: string;
  match_count?: number;
  match_percent?: number;
}

export default function Page() {
  // ป้องกัน Hydration Error — render DnD เฉพาะฝั่ง Client เท่านั้น
  const [mounted, setMounted] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [games, setGames] = useState<Game[]>([])

  useEffect(() => { setMounted(true) }, [])

  const clearTags = () => { setSelected([]) }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    if (over.id === "selected") {
      const activeId = active.id as string
      if (!selected.includes(activeId)) {
        setSelected((prev) => [...prev, activeId])
      }
    }
  }

  const removeTag = (tag: string) => {
    setSelected(prev => prev.filter(t => t !== tag))
  }

  useEffect(() => {
    if (selected.length === 0) {
      setGames([])
      return
    }
    const query = selected.join(",")
    fetch(`http://localhost:3000/recommend?tags=${query}`)
      .then(res => res.json())
      .then(data => setGames(data))
  }, [selected])

  // ยังไม่ mount — แสดง skeleton เพื่อป้องกัน Hydration Error
  if (!mounted) {
    return (
      <div>
        <h1 className="sekuya-regular mega-title" style={{ textAlign: 'center' }}>Game Popular Recommand</h1>
        <h2 className="lato-light mega-title2">⭐Drag Tag System⭐</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {tags.map(tag => (
            <div key={tag} style={{
              padding: '10px 16px', background: '#333', color: 'white',
              margin: '5px', borderRadius: '4px', border: '1px solid #555',
              fontFamily: '"Lato", sans-serif', fontSize: '14px',
              textTransform: 'uppercase', letterSpacing: '1px'
            }}>
              {tag}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <h1 className="sekuya-regular mega-title" style={{ textAlign: 'center' }}>Game Popular Recommand</h1>
      <h2 className="lato-light mega-title2">⭐Drag Tag System⭐</h2>

      {/* TAG LIST */}
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {tags.map(tag => (
          <DraggableTag key={tag} id={tag} />
        ))}
      </div>

      <hr />

      {/* SELECTED */}
      <DropBox items={selected} removeTag={removeTag} clearTags={clearTags} />

      <hr />

      {/* RESULT */}
      <h2 className="lato-light" style={{ paddingLeft: '20px' }}>🎮Recommended Games🎮</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        padding: '20px'
      }}>
        <div className='Btngroup'>
          <button className='add' data-label="ADD"><a href='/add'>➕</a></button>
          <button className='del' data-label="DELETE"><a href='/delete'>🗑️</a></button>
          <button className='edit' data-label="EDIT"><a href='/edit'>✏️</a></button>
        </div>

        {games.map((g) => (
          <div key={g.id} style={{
            border: '1px solid #ddd',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ position: 'relative' }}>
              <img
                src={g.image_url}
                alt={g.name}
                style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
              />
              {g.match_percent !== undefined && (
                <span style={{
                  position: 'absolute', top: '8px', right: '8px',
                  background: g.match_percent === 100 ? '#27ae60' : g.match_percent >= 75 ? '#2196f3' : '#e67e22',
                  color: 'white', padding: '3px 9px', borderRadius: '12px',
                  fontSize: '12px', fontWeight: 700,
                }}>
                  {g.match_percent}% match
                </span>
              )}
            </div>
            <div style={{ padding: '15px', flexGrow: 1 }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>
                {g.name}
              </h3>
              <p style={{
                color: g.price === "0.00" ? '#27ae60' : '#e67e22',
                fontWeight: 'bold',
                fontSize: '18px',
                marginBottom: '15px'
              }}>
                {g.price === "0.00" ? "FREE" : `฿${parseFloat(g.price).toLocaleString()}`}
              </p>
              <a
                href={g.steam_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  backgroundColor: '#1b2838',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                View on Steam
              </a>
            </div>
          </div>
        ))}
      </div>

      {selected.length > 0 && games.length === 0 && (
        <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
          No games found for these tags. Try adding more!
        </p>
      )}
    </DndContext>
  )
}