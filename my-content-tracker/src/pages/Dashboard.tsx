// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
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

  return (
    <div>
      {loading && <p>Cargando...</p>}
      {error && <p>{error}</p>}
      {/* Pasar los datos de los ítems al componente Dashboard */}
      {!loading && !error && <Dashboard items={items} />}
    </div>
  );
};

export default DashboardPage;
