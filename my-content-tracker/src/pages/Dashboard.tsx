import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import Card from '../components/Card'
import AddItemForm from '../components/AddItem'

type ContentItem = {
  id: string
  title: string
  rating: number
  comment: string
  date: string
  status: string
  type: 'movie' | 'book' | 'videoGame'
  progress?: number
  image_url?: string
}

function Dashboard() {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterType, setFilterType] = useState<'movie' | 'book' | 'videoGame' | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch content from Supabase
  useEffect(() => {
    const fetchContents = async () => {
      setIsLoading(true)
  
      // Obtener el usuario actual
      const { data: userData, error: userError } = await supabase.auth.getUser()
  
      if (userError || !userData) {
        console.error('Error fetching user:', userError)
        setIsLoading(false)
        return
      }
  
      // Verificar si user_id está disponible
      if (!userData.id) {
        console.error('No user_id found')
        setIsLoading(false)
        return
      }
  
      // Realizar la consulta a la base de datos con el user_id
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', userData.id)
  
      if (error) {
        console.error('Error fetching contents:', error)
      } else {
        setContents(data)
      }
  
      setIsLoading(false)
    }
  
    fetchContents()
  }, [])
  

  // Filtrar los elementos según el tipo
  const filteredItems = (type: 'movie' | 'book' | 'videoGame' | null) =>
    type ? contents.filter((item) => item.type === type) : contents

  const renderContent = (type: 'movie' | 'book' | 'videoGame', extraInfo: string) => (
    <div>
      <h2>My {type.charAt(0).toUpperCase() + type.slice(1)}s</h2>
      <button onClick={() => {
        setFilterType(type)
        setShowAddForm(true)
      }}>Add {type.charAt(0).toUpperCase() + type.slice(1)}</button>
      <div className="cards-container">
        {filteredItems(type).map((item) => (
          <Card
            key={item.id}
            title={item.title}
            rating={item.rating}
            comment={item.comment}
            status={item.status}
            extraInfo={extraInfo}
            type={type}
            dateInfo={type === 'videoGame' ? item.progress?.toString() || '' : item.date}
            imageUrl={item.image_url}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div className="dashboard">
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          {renderContent('movie', 'Watched on')}
          {renderContent('book', 'Finished on')}
          {renderContent('videoGame', 'Progress')}

          {/* Formulario de agregar contenido */}
          {showAddForm && filterType && (
            <AddItemForm
              type={filterType}
              onClose={() => setShowAddForm(false)}
              onAdd={(newItem) => setContents((prev) => [...prev, newItem])}
            />
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard
