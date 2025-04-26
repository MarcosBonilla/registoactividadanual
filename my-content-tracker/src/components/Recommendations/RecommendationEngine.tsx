import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Recommendation.scss";
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
};


const RecommendationEngine = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [topRatedItems, setTopRatedItems] = useState<Content[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedType, setSelectedType] = useState<"movie" | "book" | "videoGame" | "tvSerie">("movie");

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
    }
  }, [session]);

  const fetchTopRated = async () => {
    const { data, error } = await supabase
      .from("contents")
      .select("*")
      .eq("user_id", session.user.id)
      .gt("rating", 4)
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

      return recData.results.slice(0, 5).map((item: any) => ({
        title: item.title,
        type: "movie",
        rating: undefined,
        source: "TMDb",
        coverUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
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
  
      // 4. Buscar juegos similares usando esos IDs
      const recRes = await fetch(
        `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page_size=5&${tagIds.length ? `tags=${tagIds.join(",")}` : ""}&${genreIds.length ? `genres=${genreIds.join(",")}` : ""}`
      );
      if (!recRes.ok) throw new Error(`HTTP error! Status: ${recRes.status}`);
      
      const recData = await recRes.json();
  
      // 5. Devolver resultados formateados
      return recData.results.map((item: any) => ({
        title: item.name,
        type: "videoGame",
        rating: item.rating,
        source: "RAWG",
        coverUrl: item.background_image,
      }));
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
  
      return recData.results.slice(0, 5).map((item: any) => ({
        title: item.name,
        type: "tvSerie",
        rating: undefined,
        source: "TMDb",
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
  
      const subjects = workData.subjects?.slice(0, 3) || []; // Elegimos hasta 3
      if (subjects.length === 0) return [];
  
      // 3. Construir búsqueda combinada por subject
      const query = subjects.map(s => `subject=${encodeURIComponent(s)}`).join("&");
      const recRes = await fetch(`https://openlibrary.org/search.json?${query}&limit=10`);
      if (!recRes.ok) throw new Error(`Error buscando libros relacionados: ${recRes.status}`);
      const recData = await recRes.json();
  
      // 4. Filtrar y mapear resultados
      return recData.docs
        .filter((item: any) => item.title !== book.title) // Evitar duplicado exacto
        .slice(0, 5) // Limitar
        .map((item: any) => ({
          title: item.title,
          type: "book",
          rating: undefined,
          source: "OpenLibrary",
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
  
    const recommendationPromises = filteredItems.map((item) => {
      if (item.type === "movie") {
        return fetchMovieRecommendations(item.title);
      } else if (item.type === "videoGame") {
        return fetchVideoGameRecommendations(item.title);
      } else if (item.type === "book") {
        return fetchBookRecommendations(item.title);
      } else if (item.type === "tvSerie") {
        return fetchTvSerieRecommendations(item.title);
      } else {
        return Promise.resolve([]); // fallback
      }
    });
  
    try {
      const allRecsNested = await Promise.all(recommendationPromises);
      const allRecs = allRecsNested.flat();
  
      // Eliminar duplicados por título + tipo
      const seen = new Set();
      const uniqueRecs = allRecs.filter((rec) => {
        const key = `${rec.title}-${rec.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  
      console.log("Recomendaciones únicas:", uniqueRecs);
      setRecommendations(uniqueRecs);
    } catch (error) {
      console.error("Error al obtener recomendaciones:", error);
    }
  };
  
  

  useEffect(() => {
    if (topRatedItems.length > 0) {
      fetchRecommendations(topRatedItems);
    }
  }, [selectedType, topRatedItems]);

  return (
    <div className="recommendation-container">

      <div className="filters">
        <button onClick={() => setSelectedType("movie")}>Películas</button>
        <button onClick={() => setSelectedType("videoGame")}>Videojuegos</button>
        <button onClick={() => setSelectedType("book")}>Libros</button>
        <button onClick={() => setSelectedType("tvSerie")}>Series</button>

      </div>

      {topRatedItems.length === 0 ? (
        <p className="text-white">Todavía no hay ítems con buena calificación.</p>
      ) : (
        <div className="recommendation-grid">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => (
              <RecommendationCard key={index} {...rec} />
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
