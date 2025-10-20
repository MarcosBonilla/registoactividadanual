import React from "react";
import Card from "../Card/Card";

interface DashboardProps {
  items: any[];
  loading: boolean;
  error: string | null;
  onDelete: (id: string) => void;
  onEdit: (id: string, newData: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ items, loading, error, onDelete, onEdit }) => {
  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="card-container">
        {loading ? (
          <p>Cargando...</p>
        ) : error ? (
          <p>{error}</p>
        ) : items && items.length > 0 ? (
          items.map((item) => (
            <Card
              key={item.id}
              {...item}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))
        ) : (
          <p>No tienes ítems registrados.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
