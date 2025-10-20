// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import Dashboard from '../components/Dashboard/Dashboard';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Verificar si el usuario está autenticado
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate('/');
        } else {
          // Si está autenticado, obtener los datos
          await fetchItems(user.id);
        }
      } catch (error) {
        setError('Error al verificar la autenticación');
        console.error(error);
      }
    };

    const fetchItems = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('contents')
          .select('*')
          .eq('user_id', userId) // Asegúrate de usar userId aquí
          .order('date', { ascending: false });

        if (error) throw error;
        console.log(data); // Mostrar datos para depuración
        setItems(data || []); // Guardar los ítems en el estado
      } catch (error) {
        setError('Error al obtener los contenidos');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  // Manejadores para pasar al componente Dashboard
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('contents').update({ status: 3 }).eq('id', id);
      if (error) throw error;
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (err) {
      console.error('Error eliminando ítem', err);
      setError('Error eliminando ítem');
    }
  };

  const handleEdit = async (id: string, newData: any) => {
    try {
      const { error } = await supabase.from('contents').update(newData).eq('id', id);
      if (error) throw error;
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...newData } : it)));
    } catch (err) {
      console.error('Error editando ítem', err);
      setError('Error editando ítem');
    }
  };

  return (
    <div>
      <Dashboard items={items} loading={loading} error={error} onDelete={handleDelete} onEdit={handleEdit} />
    </div>
  );
};

export default DashboardPage;
