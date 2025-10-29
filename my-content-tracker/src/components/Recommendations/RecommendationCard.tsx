// src/pages/RecommendationCard.tsx
import React from "react";
import "./Recommendation.scss";

type RecommendationCardProps = {
  title: string;
  type: "movie" | "book" | "videoGame" | "tvSerie";
  rating?: number;
  source: string;
  coverUrl?: string;
  // allow passing external ids/providers when available
  tmdbId?: number;
  rawgId?: number;
  workKey?: string;
  externalProvider?: string;
  externalId?: string;
  durationMinutes?: number;
  metacritic?: number;
  onAdd?: (rec: any) => void;
  onDiscard?: (rec: { title: string; type: string }) => void;
  recommendedFromTitle?: string;
  recommendedFromRating?: number | null;
  recommendedFromType?: string;
};

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  title,
  type,
  rating,
  source,
  coverUrl,
  tmdbId,
  rawgId,
  workKey,
  externalProvider,
  externalId,
  durationMinutes,
  metacritic,
  onAdd,
  onDiscard,
  recommendedFromTitle,
  recommendedFromRating,
  recommendedFromType,
}) => {
  return (
    <div className="recommendation-card">
      <div className="rec-actions">
        <button
          className="rec-add"
          onClick={() =>
            onAdd &&
            onAdd({
              title,
              type,
              source,
              coverUrl,
              tmdbId,
              rawgId,
              workKey,
              externalProvider,
              externalId,
              durationMinutes,
              metacritic,
            })
          }
        >
          +
        </button>
        <button className="rec-discard" onClick={() => onDiscard && onDiscard({ title, type })}>×</button>
      </div>
      {coverUrl && (
        <div className="image-container">
          <img src={coverUrl} alt={title} />
        </div>
      )}
      <div className="content">
        <h3 className="title">{title}</h3>
        {recommendedFromTitle && (
          <p className="recommended-from">
            Recomendado porque {recommendedFromType === 'videoGame' ? 'jugaste' : recommendedFromType === 'book' ? 'leíste' : 'viste'} <strong>{recommendedFromTitle}</strong>
            {recommendedFromRating != null ? ` y la puntuaste con ${recommendedFromRating}⭐` : ''}.
          </p>
        )}
        <p className="meta">
          <span className="type">{type}</span> | <span className="source">{source}</span>
        </p>
        {rating !== undefined && (
          <p className="rating">⭐ {rating.toFixed(1)}</p>
        )}
      </div>
    </div>
  );
};

export default RecommendationCard;
