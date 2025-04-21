// src/Dashboard.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import Card from '../components/Card' // Importamos el componente Card
import AddItemForm from '../components/AddItem' // Importamos el formulario de agregar

type Movie = {
  id: string
  title: string
  rating: number
  comment: string
  watched_on: string
  status: string
}

type Book = {
  id: string
  title: string
  rating: number
  comment: string
  finished_on: string
  status: string
}

type VideoGame = {
  id: string
  title: string
  rating: number
  comment: string
  finished_on: string
  progress: number
  status: string
}

function Dashboard() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [videoGames, setVideoGames] = useState<VideoGame[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [itemType, setItemType] = useState<'movie' | 'book' | 'videoGame'>('movie')

  // Obtener datos de Movies
  useEffect(() => {
    const fetchMovies = async () => {
      const { data, error } = await supabase
        .from('Movies')
        .select('*')
        .eq('user_id', supabase.auth.user()?.id)

      if (error) {
        console.log('Error fetching movies:', error)
      } else {
        setMovies(data)
      }
    }

    fetchMovies()
  }, [])

  // Obtener datos de Books
  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from('Books')
        .select('*')
        .eq('user_id', supabase.auth.user()?.id)

      if (error) {
        console.log('Error fetching books:', error)
      } else {
        setBooks(data)
      }
    }

    fetchBooks()
  }, [])

  // Obtener datos de Video Games
  useEffect(() => {
    const fetchVideoGames = async () => {
      const { data, error } = await supabase
        .from('VideoGames')
        .select('*')
        .eq('user_id', supabase.auth.user()?.id)

      if (error) {
        console.log('Error fetching video games:', error)
      } else {
        setVideoGames(data)
      }
    }

    fetchVideoGames()
  }, [])

  // Función para cambiar el tipo de item
  const handleItemTypeChange = (type: 'movie' | 'book' | 'videoGame') => {
    setItemType(type)
    setShowAddForm(true) // Mostrar el formulario cuando se elige un tipo
  }

  return (
    <div className="dashboard">
      <h2>My Movies</h2>
      <button onClick={() => handleItemTypeChange('movie')}>Add Movie</button>
      <div className="cards-container">
        {movies.map((movie) => (
          <Card
            key={movie.id}
            title={movie.title}
            rating={movie.rating}
            comment={movie.comment}
            status={movie.status}
            extraInfo="Watched on"
            type="movie"
            dateInfo={movie.watched_on}
          />
        ))}
      </div>

      <h2>My Books</h2>
      <button onClick={() => handleItemTypeChange('book')}>Add Book</button>
      <div className="cards-container">
        {books.map((book) => (
          <Card
            key={book.id}
            title={book.title}
            rating={book.rating}
            comment={book.comment}
            status={book.status}
            extraInfo="Finished on"
            type="book"
            dateInfo={book.finished_on}
          />
        ))}
      </div>

      <h2>My Video Games</h2>
      <button onClick={() => handleItemTypeChange('videoGame')}>Add Video Game</button>
      <div className="cards-container">
        {videoGames.map((game) => (
          <Card
            key={game.id}
            title={game.title}
            rating={game.rating}
            comment={game.comment}
            status={game.status}
            extraInfo="Progress"
            type="videoGame"
            dateInfo={game.progress}
          />
        ))}
      </div>

      {/* Mostrar el formulario de agregar item si showAddForm es true */}
      {showAddForm && <AddItemForm />}
    </div>
  )
}

export default Dashboard
