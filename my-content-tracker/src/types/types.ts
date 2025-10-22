export type ContentItem = {
    id: string;
    title: string;
    type: "movie" | "book" | "videogame"; 
    date: string;
    user_id: string;
  };