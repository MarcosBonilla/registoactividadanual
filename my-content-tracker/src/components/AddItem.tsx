import { useState } from 'react'
import { supabase } from '../services/supabaseClient'

type AddItemFormProps = {
  type: 'movie' | 'book' | 'videoGame'
  onClose: () => void
  onAdd: (item: any) => void
}

const AddItemForm = ({ type, onClose, onAdd }: AddItemFormProps) => {
  const [title, setTitle] = useState('')
  const [rating, setRating] = useState(0)
  const [status, setStatus] = useState('not-watched')
  const [comment, setComment] = useState('')
  const [progress, setProgress] = useState(0)

  const fetchImage = async (title: string) => {
    try {
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(title)}&format=json&no_redirect=1`)
      const data = await response.json()
      return data.Image || null
    } catch (err) {
      console.error('Error fetching image:', err)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const { data, error } = await supabase
      .from('contents') // Asegúrate de usar 'contents' en lugar de 'items'
      .insert([
        {
          title,
          type, // Esto debe ser 'movie', 'book' o 'videoGame'
          rating,
          status,
          user_id: supabase.auth.user()?.id, // Asumiendo que esta columna existe
          date: new Date().toISOString(), // Usa la fecha actual
        },
      ]);
  
    if (error) {
      console.error('Error inserting item:', error);
    } else {
      console.log('Item added:', data);
      // Reset the form
      setTitle('');
      setType('movie');
      setRating(0);
      setStatus('not-watched');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-item-form">
      <h3>Add a new {type}</h3>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Rating (0-5)"
        min="0"
        max="5"
        value={rating}
        onChange={(e) => setRating(parseInt(e.target.value))}
        required
      />
      <textarea
        placeholder="Comments"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)} required>
        <option value="not-watched">Not Watched</option>
        <option value="watching">Watching</option>
        <option value="watched">Watched</option>
      </select>
      {type === 'videoGame' && (
        <input
          type="number"
          placeholder="Progress (%)"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(parseInt(e.target.value))}
        />
      )}
      <button type="submit">Add</button>
      <button type="button" onClick={onClose}>Cancel</button>
    </form>
  )
}

export default AddItemForm
