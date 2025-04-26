import React from 'react';
import { useNavigate } from 'react-router-dom';
import RecommendationEngine from '../components/Recommendations/RecommendationEngine';


const Recommendations = () => {
  return (
    <div className="recommendations-page">
      <RecommendationEngine />
    </div>
  );
};

export default Recommendations;
