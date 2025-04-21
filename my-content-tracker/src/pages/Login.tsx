// src/components/AddItemForm.tsx
import { useState } from 'react'
import { supabase } from '../services/supabaseClient'

type AddItemFormProps = {
  itemType: 'movie' | 'book' | 'videoGame'
  setShowAddForm: (show: boolean) => void
}

const AddItemForm = ({ itemType, setShowAddForm }: AddItemFormProps) => {
  const [title, setTitle] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('not-watched')
  const [dateInfo, setDateInfo] = useState('')
  const [progress, setProgress] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newItem = {
      title,
      rating,
      comment,
      status,
      user_id: supabase.auth.user()?.id,
    }

    if (itemType === 'movie') {
      newItem['watched_on'] = dateInfo
      await supabase.from('Movies').insert([newItem])
    } else if (itemType === 'book') {
      newItem['finished_on'] = dateInfo
      await supabase.from('Books').insert([newItem])
    } else if (itemType === 'videoGame') {
      newItem['progress'] = progress
      await supabase.from('VideoGames').insert([newItem])
    }

    // Resetear el formulario
    setTitle('')
    setRating(0)
    setComment('')
    setStatus('not-watched')
    setDateInfo('')
    setProgress(0)
    
    // Ocultar el formulario después de agregar el item
    setShowAddForm(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input type="number" min="0" max="5" value={rating} onChange={(e) => setRating(Number(e.target.value))} required />
      <textarea placeholder="Comment" value={comment} onChange={(e) => setComment(e.target.value)} />
      <select value={status} onChange={(e) => setStatus(e.target.value)} required>
        <option value="not-watched">Not Watched</option>
        <option value="watching">Watching</option>
        <option value="watched">Watched</option>
      </select>
      {itemType !== 'videoGame' ? (
        <input type="date" value={dateInfo} onChange={(e) => setDateInfo(e.target.value)} required />
      ) : (
        <input type="number" value={progress} onChange={(e) => setProgress(Number(e.target.value))} placeholder="Progress" required />
      )}
      <button type="submit">Add {itemType}</button>
    </form>
  )
}

export default AddItemForm
