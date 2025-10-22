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
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate('/');
        } else {
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
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (error) throw error;
        setItems(data || []);
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
      {}
  {!loading && !error && <Dashboard items={items} />}
    </div>
  );
};

export default DashboardPage;
