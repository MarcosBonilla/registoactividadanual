// src/pages/RecommendationCard.tsx
import React from "react";
import "./Recommendation.scss";

type RecommendationCardProps = {
  title: string;
  type: "movie" | "book" | "videoGame";
  rating?: number;
  source: string;
  coverUrl?: string;
};

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  title,
  type,
  rating,
  source,
  coverUrl,
}) => {
  return (
    <div className="recommendation-card">
      {coverUrl && (
        <div className="image-container">
          <img src={coverUrl} alt={title} />
        </div>
      )}
      <div className="content">
        <h3 className="title">{title}</h3>
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
