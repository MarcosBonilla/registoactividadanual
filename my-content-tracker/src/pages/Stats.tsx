import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import './Stats.scss'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
import ModalEdit from "../components/Modal/Modal";

type Content = {
  id: string;
  title: string;
  type: "movie" | "book" | "videoGame" | "tvSerie";
  rating?: number | null;
  date?: string | null;
  coverUrl?: string | null;
};

const StatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<Content[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        const { data, error } = await supabase
          .from('contents')
          .select('*')
          .eq('user_id', session.user.id);

        if (error) throw error;
        setContents(data || []);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  // Metrics
  const totalItems = contents.length;

  const countsByType = contents.reduce((acc: Record<string, number>, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  const categoryLabel = (k: string) => {
    switch (k) {
      case 'videoGame': return 'Videojuegos';
      case 'book': return 'Libro';
      case 'movie': return 'Película';
      case 'tvSerie': return 'Serie';
      default: return k;
    }
  }

  const formatMonthLabel = (m: string) => {
    // m is YYYY-MM
    try {
      const [y,mm] = m.split('-');
      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      const idx = parseInt(mm,10) - 1;
      return `${months[idx] || mm} ${y}`;
    } catch (e) { return m }
  }

  const ratingByType = contents.reduce((acc: Record<string, { sum: number; count: number }>, item) => {
    if (item.rating != null) {
      if (!acc[item.type]) acc[item.type] = { sum: 0, count: 0 };
      acc[item.type].sum += item.rating;
      acc[item.type].count += 1;
    }
    return acc;
  }, {});

  const avgRatingByType: Record<string, number> = {};
  for (const k of Object.keys(ratingByType)) {
    const v = ratingByType[k];
    avgRatingByType[k] = v.count > 0 ? +(v.sum / v.count).toFixed(2) : 0;
  }

  const topByRating = contents
    .filter((c) => c.rating != null)
    .sort((a, b) => (b.rating! - a.rating!))
    .slice(0, 10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<any>(null);

  // Monthly counts from date field (assumes date in ISO yyyy-mm-dd)
  const monthlyCounts = contents.reduce((acc: Record<string, number>, item) => {
    if (!item.date) return acc;
    const month = item.date.slice(0, 7); // YYYY-MM
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const months = Object.keys(monthlyCounts).sort();

  return (
    <div className="stats-page">
      <h1>Estadísticas</h1>
      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
                <h3>Total content</h3>
                <p className="big">{totalItems}</p>
              </div>

            <div className="stat-card">
              <h3>Por categoría</h3>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {Object.entries(countsByType).map(([k, v]) => (
                  <li key={k}>{categoryLabel(k)}: {v}</li>
                ))}
              </ul>
            </div>

            <div className="stat-card">
              <h3>Promedio rating por categoría</h3>
              {Object.keys(avgRatingByType).length === 0 ? (
                <p>No hay ratings</p>
              ) : (
                <div className="mini-chart">
                  <Bar
                    data={{
                      labels: Object.keys(avgRatingByType).map(k => categoryLabel(k)),
                      datasets: [
                        {
                          label: 'Promedio',
                          data: Object.keys(avgRatingByType).map(k => Number(avgRatingByType[k] || 0)),
                          backgroundColor: (ctx: any) => {
                            const chart = ctx.chart;
                            const { ctx: c, chartArea } = chart;
                            if (!chartArea) return '#60a5fa';
                            const grad = c.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                            grad.addColorStop(0, 'rgba(96,165,250,0.95)');
                            grad.addColorStop(1, 'rgba(96,165,250,0.5)');
                            return grad;
                          },
                          borderRadius: 6,
                          maxBarThickness: 28,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          enabled: true,
                          callbacks: {
                            label: (ctx: any) => `${ctx.dataset.label || ''}: ${typeof ctx.parsed.y === 'number' ? ctx.parsed.y.toFixed(2) : ctx.parsed}`,
                          },
                        },
                      },
                      scales: {
                        x: { ticks: { color: '#cbd5e1' }, grid: { display: false } },
                        y: { ticks: { color: '#cbd5e1' }, beginAtZero: true, suggestedMax: 5, grid: { color: 'rgba(255,255,255,0.03)' } },
                      },
                      layout: { padding: { top: 6, bottom: 6 } },
                      elements: { bar: { borderRadius: 6 } },
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <ModalEdit isOpen={isModalOpen} item={modalItem} onClose={() => setIsModalOpen(false)} onSave={(newItem) => {
            // refrescar localmente: reemplazar o añadir
            setContents(prev => {
              const exists = prev.find(p => p.id === newItem.id);
              if (exists) return prev.map(p => p.id === newItem.id ? newItem : p);
              return [...prev, newItem];
            });
            setIsModalOpen(false);
          }} />

          <div className="tops-row">
            <h2>Top items por rating</h2>
              {topByRating.length === 0 ? <p>No hay items con rating.</p> : (
              <div>
                {topByRating.map((t) => (
                  <div key={t.id} className="top-card" onClick={() => { setModalItem(t); setIsModalOpen(true); }} style={{ cursor: 'pointer' }}>
                    <div className="top-cover">{t.coverUrl ? <img src={t.coverUrl} alt={t.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} /> : 'No cover'}</div>
                    <div className="top-info">
                      <div className="top-title">{t.title}</div>
                      <div className="top-meta">{categoryLabel(t.type)}</div>
                    </div>
                    <div className="top-rating">{t.rating}⭐</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="consumption">
            <div className="block">
              <h2>Consumo por mes</h2>
              {months.length === 0 ? <p>No hay datos de fecha.</p> : (
                <div className="chart-wrapper">
                  <Bar
                    data={{
                      labels: months.map(m => formatMonthLabel(m)),
                      datasets: [
                        {
                          label: 'Ítems',
                          data: months.map(m => monthlyCounts[m]),
                          // gradient is scriptable so it renders once chart area exists
                          backgroundColor: (context: any) => {
                            const chart = context.chart;
                            const { ctx, chartArea } = chart;
                            if (!chartArea) return '#5c6bc0';
                            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                            gradient.addColorStop(0, 'rgba(92,107,192,0.95)');
                            gradient.addColorStop(1, 'rgba(92,107,192,0.5)');
                            return gradient;
                          },
                          borderRadius: 8,
                          maxBarThickness: 36,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Ítems añadidos por mes', color: '#e6eef8', font: { size: 16 } },
                        tooltip: {
                          enabled: true,
                          callbacks: {
                            label: (ctx: any) => `${ctx.dataset.label || ''}: ${ctx.parsed.y ?? ctx.parsed}`,
                          },
                        },
                      },
                      scales: {
                        x: { ticks: { color: '#cbd5e1' }, grid: { display: false } },
                        y: { ticks: { color: '#cbd5e1' }, beginAtZero: true, grid: { color: 'rgba(255,255,255,0.03)' } },
                      },
                      layout: { padding: { top: 8, bottom: 6 } },
                      elements: { bar: { borderRadius: 6 } },
                    }}
                  />
                </div>
              )}
            </div>

            <div className="block">
              <h2>Consumo por año</h2>
              {Object.keys(monthlyCounts).length === 0 ? <p>No hay datos de fecha.</p> : (
                (() => {
                  const yearly: Record<string, number> = {};
                  Object.keys(monthlyCounts).forEach(m => {
                    const y = m.slice(0,4);
                    yearly[y] = (yearly[y] || 0) + monthlyCounts[m];
                  });
                  const years = Object.keys(yearly).sort();
                  return (
                    <div className="chart-wrapper">
                      <Bar
                        data={{
                          labels: years,
                          datasets: [
                            {
                              label: 'Ítems',
                              data: years.map(y => yearly[y]),
                              backgroundColor: (context: any) => {
                                const chart = context.chart;
                                const { ctx, chartArea } = chart;
                                if (!chartArea) return '#ffd166';
                                const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                                gradient.addColorStop(0, 'rgba(255,209,102,0.95)');
                                gradient.addColorStop(1, 'rgba(255,209,102,0.5)');
                                return gradient;
                              },
                              borderRadius: 8,
                              maxBarThickness: 44,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            title: { display: true, text: 'Ítems añadidos por año', color: '#e6eef8', font: { size: 16 } },
                            tooltip: {
                              enabled: true,
                              callbacks: {
                                label: (ctx: any) => `${ctx.dataset.label || ''}: ${ctx.parsed.y ?? ctx.parsed}`,
                              },
                            },
                          },
                          scales: {
                            x: { ticks: { color: '#cbd5e1' }, grid: { display: false } },
                            y: { ticks: { color: '#cbd5e1' }, beginAtZero: true, grid: { color: 'rgba(255,255,255,0.03)' } },
                          },
                          layout: { padding: { top: 8, bottom: 6 } },
                          elements: { bar: { borderRadius: 6 } },
                        }}
                      />
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsPage;
