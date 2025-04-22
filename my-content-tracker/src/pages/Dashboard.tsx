import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import Dashboard from "../components/Dashboard/Dashboard";

const DashboardPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("Usuario no autenticado");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("contents")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error al traer los ítems:", error.message);
      } else {
        setItems(data);
      }
      setLoading(false);
    };

    fetchItems();
  }, []);

  if (loading) return <Loader />;

  return <Dashboard items={items} setItems={setItems} />;
};

export default DashboardPage;
