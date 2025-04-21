// types.ts
export type ContentItem = {
    id: string;
    title: string;
    type: "movie" | "book" | "videogame"; // adaptalo a tus valores reales
    date: string;
    user_id: string;
  };