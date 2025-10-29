import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Recommendation.scss";
import "../Dashboard/Dashboard.scss";
import ModalEdit from "../Modal/Modal";
import Toast from "../ui/Toast";
import RecommendationCard from "./RecommendationCard";
import { TMDB_API_KEY, RAWG_API_KEY } from "../../services/apikeys"; // Asegúrate de agregar tu API key en el archivo apiKeys.ts

type Content = {
  id: string;
  title: string;
  type: "movie" | "book" | "videoGame" | "tvSerie";
  rating?: number;
};

type Recommendation = {
  title: string;
  type: "movie" | "book" | "videoGame" | "tvSerie";
  rating?: number;
  source: string;
  coverUrl?: string;
  recommendedFromTitle?: string;
  recommendedFromRating?: number | null;
  recommendedFromType?: string;
};


const RecommendationEngine = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [topRatedItems, setTopRatedItems] = useState<Content[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  // buffer de recomendaciones adicionales para reponer al descartar
  const [bufferRecs, setBufferRecs] = useState<Recommendation[]>([]);
  const [discarded, setDiscarded] = useState<{ title: string; type: string }[]>([]);
  const [existingTitles, setExistingTitles] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<"movie" | "book" | "videoGame" | "tvSerie">("movie");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" } | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/login");
        return;
      }
      setSession(data.session);
    };
    getSession();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchTopRated();
      fetchDiscarded();
      fetchUserContentTitles();
    }
  }, [session]);

  // Persistir buffer en sessionStorage para no perder candidatos al navegar
  useEffect(() => {
    const key = `rec-buffer-${session?.user?.id}`;
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) setBufferRecs(JSON.parse(stored));
    } catch (e) {}
    return () => {};
  }, [session]);

  useEffect(() => {
    const key = `rec-buffer-${session?.user?.id}`;
    try {
      sessionStorage.setItem(key, JSON.stringify(bufferRecs));
    } catch (e) {}
  }, [bufferRecs, session]);

  // Normaliza strings: minúsculas, sin acentos, sin puntuación
  const normalizeString = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

  // Levenshtein distance
  const levenshtein = (a: string, b: string) => {
    const al = a.length;
    const bl = b.length;
    const dp: number[][] = Array.from({ length: al + 1 }, () => Array(bl + 1).fill(0));
    for (let i = 0; i <= al; i++) dp[i][0] = i;
    for (let j = 0; j <= bl; j++) dp[0][j] = j;
    for (let i = 1; i <= al; i++) {
      for (let j = 1; j <= bl; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[al][bl];
  };

  // Similarity ratio based on Levenshtein
  const isSimilar = (s1: string, s2: string, threshold = 0.75) => {
    const n1 = normalizeString(s1);
    const n2 = normalizeString(s2);
    if (!n1 || !n2) return false;
    if (n1.includes(n2) || n2.includes(n1)) return true;
    const dist = levenshtein(n1, n2);
    const maxLen = Math.max(n1.length, n2.length);
    if (maxLen === 0) return true;
    const ratio = 1 - dist / maxLen;
    return ratio >= threshold;
  };

  const fetchUserContentTitles = async () => {
    try {
      const { data, error } = await supabase
        .from("contents")
        .select("title")
        .eq("user_id", session.user.id);
      if (error) throw error;
      const titles = (data || []).map((r: any) => r.title).filter(Boolean);
      setExistingTitles(titles);
    } catch (err) {
      console.error("Error cargando títulos del usuario:", err);
    }
  };

  const fetchTopRated = async () => {
    const { data, error } = await supabase
      .from("contents")
      .select("*")
      .eq("user_id", session.user.id)
      // take any item that has a rating (not null) so we can use all rated items as seeds
  .gte("rating", 3.5)
      .order("rating", { ascending: false });

    if (error) {
      console.error("Error fetching top-rated items:", error);
    } else {
      console.log("Top-rated items:", data); // Verificar los ítems que estamos obteniendo
      setTopRatedItems(data);
      fetchRecommendations(data);
    }
  };

  // Función para buscar recomendaciones de películas en TMDb
  const fetchMovieRecommendations = async (title: string): Promise<Recommendation[]> => {
    try {
      console.log(`Buscando recomendaciones de película para: ${title}`);
      const searchRes = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
      );
      if (!searchRes.ok) throw new Error(`HTTP error! Status: ${searchRes.status}`);
      
      const searchData = await searchRes.json();
      console.log("Resultado de búsqueda de película:", searchData);

      const movie = searchData.results?.[0];
      if (!movie) return [];

      const recRes = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}/recommendations?api_key=${TMDB_API_KEY}`
      );
      if (!recRes.ok) throw new Error(`HTTP error! Status: ${recRes.status}`);
      
      const recData = await recRes.json();
      console.log("Recomendaciones de película:", recData);

      return recData.results.slice(0, 20).map((item: any) => ({
        title: item.title,
        type: "movie",
        // Map TMDb vote_average (0-10) to a 0-5 scale for our UI
        rating: item.vote_average ? Math.round((item.vote_average / 2) * 10) / 10 : undefined,
        source: "TMDb",
        tmdbId: item.id,
        overview: item.overview,
        releaseDate: item.release_date,
        coverUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
      }));
    } catch (err) {
      console.error("Error buscando recomendaciones en TMDb:", err);
      return [];
    }
  };

  // Función para buscar recomendaciones de videojuegos usando la API de RAWG// Función para buscar recomendaciones de videojuegos usando la API de RAWG
  const fetchVideoGameRecommendations = async (title: string): Promise<Recommendation[]> => {
    try {
      // 1. Buscar el juego por título
      const searchRes = await fetch(
        `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(title)}`
      );
      if (!searchRes.ok) throw new Error(`HTTP error! Status: ${searchRes.status}`);
      
      const searchData = await searchRes.json();
      const game = searchData.results?.[0]; // Tomamos el primer resultado
      if (!game) return [];
  
      // 2. Obtener detalles del juego específico
      const gameDetailsRes = await fetch(`https://api.rawg.io/api/games/${game.id}?key=${RAWG_API_KEY}`);
      if (!gameDetailsRes.ok) throw new Error(`HTTP error al obtener detalles! Status: ${gameDetailsRes.status}`);
      const gameDetails = await gameDetailsRes.json();
  
      // 3. Extraer IDs de tags y géneros
      const tagIds = (gameDetails.tags || []).map((tag: any) => tag.id);
      const genreIds = (gameDetails.genres || []).map((genre: any) => genre.id);
  
      if (tagIds.length === 0 && genreIds.length === 0) {
        console.warn("No se encontraron tags ni géneros para el juego:", title);
        return [];
      }
  
      // 4. Buscar juegos similares usando esos IDs — pedir más resultados para tener reemplazos
      const recRes = await fetch(
        `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page_size=20&${tagIds.length ? `tags=${tagIds.join(",")}` : ""}&${genreIds.length ? `genres=${genreIds.join(",")}` : ""}`
      );
      if (!recRes.ok) throw new Error(`HTTP error! Status: ${recRes.status}`);
      
      const recData = await recRes.json();
  
      // 5. Devolver resultados formateados — limitamos a 10 para evitar saturar la UI
      const mapped = (recData.results || []).slice(0, 20).map((item: any) => ({
        title: item.name,
        type: "videoGame",
        rating: item.rating,
        source: "RAWG",
        rawgId: item.id,
        slug: item.slug,
        playtime: item.playtime,
        metacritic: item.metacritic,
        released: item.released,
        coverUrl: item.background_image,
      }));

      // Filtrar aquí contra descartadas/existentes (cliente) para no devolver basura
      const filtered = mapped.filter((rec: Recommendation) => {
        const isDiscarded = discarded.some((d) => d.title === rec.title && d.type === rec.type);
        if (isDiscarded) return false;
        const exists = existingTitles.some((t) => isSimilar(t, rec.title));
        if (exists) return false;
        return true;
      });

      return filtered;
    } catch (err) {
      console.error("Error buscando recomendaciones en RAWG:", err);
      return [];
    }
  };

  const fetchTvSerieRecommendations = async (title: string): Promise<Recommendation[]> => {
    try {
      console.log(`Buscando recomendaciones de series para: ${title}`);
      
      // 1. Buscar la serie en TMDb
      const searchRes = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
      );
      if (!searchRes.ok) throw new Error(`HTTP error! Status: ${searchRes.status}`);
      
      const searchData = await searchRes.json();
      console.log("Resultado de búsqueda de serie:", searchData);
  
      const serie = searchData.results?.[0];
      if (!serie) return [];
  
      // 2. Obtener recomendaciones basadas en la serie
      const recRes = await fetch(
        `https://api.themoviedb.org/3/tv/${serie.id}/recommendations?api_key=${TMDB_API_KEY}`
      );
      if (!recRes.ok) throw new Error(`HTTP error! Status: ${recRes.status}`);
      
      const recData = await recRes.json();
      console.log("Recomendaciones de series:", recData);
  
      return recData.results.slice(0, 20).map((item: any) => ({
        title: item.name,
        type: "tvSerie",
        rating: item.vote_average ? Math.round((item.vote_average / 2) * 10) / 10 : undefined,
        source: "TMDb",
        tmdbId: item.id,
        overview: item.overview,
        firstAirDate: item.first_air_date,
        coverUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
      }));
    } catch (err) {
      console.error("Error buscando recomendaciones de series en TMDb:", err);
      return [];
    }
  };

  const fetchBookRecommendations = async (title: string): Promise<Recommendation[]> => {
    try {
      console.log(`Buscando recomendaciones de libros para: ${title}`);
  
      // 1. Buscar el libro en OpenLibrary
      const searchRes = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`);
      if (!searchRes.ok) throw new Error(`Error buscando el libro: ${searchRes.status}`);
      const searchData = await searchRes.json();
  
      const book = searchData.docs?.[0];
      if (!book || !book.key) return [];
  
      // 2. Obtener detalles del libro (subjects)
      const workKey = book.key; // e.g. "/works/OL12345W"
      const workRes = await fetch(`https://openlibrary.org${workKey}.json`);
      if (!workRes.ok) throw new Error(`Error al obtener detalles del libro: ${workRes.status}`);
      const workData = await workRes.json();
  
  const subjects: string[] = workData.subjects?.slice(0, 3) || []; // Elegimos hasta 3
      if (subjects.length === 0) return [];
  
      // 3. Construir búsqueda combinada por subject
  const query = subjects.map((s: string) => `subject=${encodeURIComponent(s)}`).join("&");
      const recRes = await fetch(`https://openlibrary.org/search.json?${query}&limit=10`);
      if (!recRes.ok) throw new Error(`Error buscando libros relacionados: ${recRes.status}`);
      const recData = await recRes.json();
  
      // 4. Filtrar y mapear resultados
      return recData.docs
        .filter((item: any) => item.title !== book.title) // Evitar duplicado exacto
        .slice(0, 20) // Limitar — aumentar candidatos
        .map((item: any) => ({
          title: item.title,
          type: "book",
          rating: undefined,
          source: "OpenLibrary",
          workKey: item.key,
          coverUrl: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : undefined,
        }));
    } catch (err) {
      console.error("Error buscando recomendaciones en OpenLibrary:", err);
      return [];
    }
  };
  

  const fetchRecommendations = async (items: Content[]) => {
    console.log("Filtrando ítems por tipo seleccionado:", selectedType);
  
    const filteredItems = items.filter((item) => item.type === selectedType);
    console.log("Ítems filtrados:", filteredItems);
  
    // To diversify recommendations, take multiple seeds and request a small number of candidates per seed
    const perSeed = 4; // number of recs to keep per rated item
    const recommendationPromises = filteredItems.map((item) => {
      const attachOrigin = (recs: Recommendation[]) =>
        recs.slice(0, perSeed).map((r) => ({ ...r, recommendedFromTitle: item.title, recommendedFromRating: item.rating ?? null, recommendedFromType: item.type }));

      if (item.type === "movie") {
        return fetchMovieRecommendations(item.title).then(attachOrigin);
      } else if (item.type === "videoGame") {
        return fetchVideoGameRecommendations(item.title).then(attachOrigin);
      } else if (item.type === "book") {
        return fetchBookRecommendations(item.title).then(attachOrigin);
      } else if (item.type === "tvSerie") {
        return fetchTvSerieRecommendations(item.title).then(attachOrigin);
      } else {
        return Promise.resolve([]); // fallback
      }
    });
  
    try {
        const allRecsNested = await Promise.all(recommendationPromises);

        // allRecsNested is an array of arrays, one per seed. We'll interleave items from each seed
        // to ensure diversity across seeds instead of showing many items from few seeds.
    const seedLists: Recommendation[][] = allRecsNested.map((arr: Recommendation[] | any) => arr || []);

        // Logging counts
        const totalCandidates = seedLists.reduce((s, a) => s + a.length, 0);
        console.log("Total candidate recs (per seed lists):", totalCandidates, "seeds:", seedLists.length);

        const seen = new Set<string>();
        const interleaved: Recommendation[] = [];
        const displayCount = 20;

        // Round-robin across seeds
        let added = 0;
        let round = 0;
        while (added < displayCount) {
          let any = false;
          for (let i = 0; i < seedLists.length && added < displayCount; i++) {
            const list = seedLists[i];
            if (round < list.length) {
              const candidate = list[round];
              if (!candidate) continue;
              const key = `${candidate.title}-${candidate.type}`;
              if (!seen.has(key)) {
                // filter discarded/existing
                const isDiscarded = discarded.some((d) => d.title === candidate.title && d.type === candidate.type);
                const exists = existingTitles.some((t) => isSimilar(t, candidate.title));
                if (!isDiscarded && !exists) {
                  interleaved.push(candidate);
                  seen.add(key);
                  added++;
                }
              }
              any = true;
            }
          }
          if (!any) break; // no more candidates
          round++;
        }

        console.log("Interleaved recommendations selected:", interleaved.length);

        const display = interleaved;
    const buffer: Recommendation[] = []; // for now, no additional buffer beyond display
        setRecommendations(display);
        setBufferRecs(buffer);
    } catch (error) {
      console.error("Error al obtener recomendaciones:", error);
    }
  };

  // Cargar recomendaciones descartadas desde la tabla
  const fetchDiscarded = async () => {
    try {
      const { data, error } = await supabase.from('discarded_recommendations').select('*');
      if (error) throw error;
      setDiscarded(data || []);
    } catch (err) {
      console.error('Error cargando descartadas', err);
    }
  };

  // Agregar recomendación a contenidos (insert minimal record)
  const handleAddRecommendation = async (rec: any) => {
    // Abrir modal prellenado con title, type y posibles ids externos/cover/duration
    const suggestedRating = rec.rating ?? 3.5;
    const modalPayload: any = {
      title: rec.title,
      type: rec.type,
      rating: suggestedRating,
      date: new Date().toISOString().split('T')[0],
    };

    // If recommendation includes external identifiers or metadata, pass them to modal so they can be saved immediately
    if (rec.tmdbId) {
      modalPayload.external_provider = 'tmdb';
      modalPayload.external_id = String(rec.tmdbId);
    }
    if (rec.rawgId) {
      modalPayload.external_provider = 'rawg';
      modalPayload.external_id = String(rec.rawgId);
    }
    if (rec.workKey) {
      modalPayload.external_provider = 'openlibrary';
      modalPayload.external_id = rec.workKey;
    }
    if (rec.coverUrl) modalPayload.cover_url = rec.coverUrl;
    if (rec.playtime) modalPayload.duration_minutes = Math.round(rec.playtime * 60);
    if (rec.metacritic) modalPayload.metacritic = rec.metacritic;

    setModalItem(modalPayload);
    setIsModalOpen(true);
  };

  // Nota: la inserción ahora la hace el Modal; onSave recibe el registro insertado.

  // Marcar como descartada y guardarla en la tabla discarded_recommendations
  const handleDiscardRecommendation = async (rec: { title: string; type: string }) => {
    try {
  const { data: { user } } = await supabase.auth.getUser();
      const payload = { ...rec, user_id: user?.id || session?.user?.id || null };
      const res = await supabase.from('discarded_recommendations').insert([payload]).select().single();
      if (res.error) {
        console.error('Error insertando discarded_recommendations:', res.error, 'payload:', payload);
        throw res.error;
      }
      const data = res.data;
      setDiscarded(prev => [...prev, rec]);
  // quitar solo la coincidencia exacta del estado local
  setRecommendations((prev) => {
    const newList = prev.filter((r) => !(r.title === rec.title && r.type === rec.type));
    // si tenemos items en buffer, rellenamos inmediatamente el hueco
    if (bufferRecs.length > 0) {
      const [next, ...rest] = bufferRecs;
      setBufferRecs(rest);
      // persist buffer
      try { sessionStorage.setItem(`rec-buffer-${session?.user?.id}`, JSON.stringify(rest)); } catch(e){}
      return [...newList, next];
    }
    return newList;
  });
  // si el buffer se quedó vacío tras el reemplazo, pedimos más recomendaciones
  if (bufferRecs.length <= 1) {
    try {
      await fetchRecommendations(topRatedItems);
    } catch (e) {
      console.warn('No se pudo refrescar recomendaciones después de descartar', e);
    }
  }
      setToast({ message: 'Recomendación descartada', type: 'success' });
      console.log('Recomendación descartada:', data);
    } catch (err) {
      console.error('Error descartando recomendación:', err);
      setToast({ message: 'Error descartando recomendación', type: 'error' });
    }
  };
  
  

  useEffect(() => {
    if (topRatedItems.length > 0) {
      fetchRecommendations(topRatedItems);
    }
  }, [selectedType, topRatedItems]);

  return (
    <div className="recommendation-container">

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ModalEdit isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} item={modalItem} onSave={async (newItem) => {
        // Modal ya insertó el registro y nos pasa el objeto insertado (newItem)
        setIsModalOpen(false);
        try {
          const addedTitle = newItem?.title || modalItem?.title;
          if (addedTitle) {
            setExistingTitles((prev) => (prev.includes(addedTitle) ? prev : [...prev, addedTitle]));
            setRecommendations((prev) => prev.filter((r) => !isSimilar(r.title, addedTitle)));
          }
          // Forzar recarga de top-rated y recomendaciones
          try {
            await fetchTopRated();
          } catch (e) {
            // no bloquear por recarga
            console.warn('No se pudo refrescar top-rated after add', e);
          }
          setToast({ message: 'Ítem agregado con éxito', type: 'success' });
        } catch (err) {
          setToast({ message: 'Ítem agregado (sin actualizar local)', type: 'success' });
        }
      }} />

      <div className="filters">
        <div className="type-buttons">
          <button className={selectedType === "movie" ? "active" : ""} onClick={() => setSelectedType("movie")}>Películas</button>
          <button className={selectedType === "videoGame" ? "active" : ""} onClick={() => setSelectedType("videoGame")}>Videojuegos</button>
          <button className={selectedType === "book" ? "active" : ""} onClick={() => setSelectedType("book")}>Libros</button>
          <button className={selectedType === "tvSerie" ? "active" : ""} onClick={() => setSelectedType("tvSerie")}>Series</button>
        </div>
      </div>

      {topRatedItems.length === 0 ? (
        <p className="text-white">Todavía no hay ítems con buena calificación.</p>
      ) : (
        <div className="recommendation-grid">
          {recommendations.length > 0 ? (
                  recommendations.map((rec, index) => (
                    <RecommendationCard key={index} {...rec} onAdd={handleAddRecommendation} onDiscard={handleDiscardRecommendation} />
                  ))
          ) : (
            <p>No hay recomendaciones disponibles para el tipo seleccionado.</p>
          )}
        </div>
      )}
  


    </div>
  );
};

export default RecommendationEngine;
