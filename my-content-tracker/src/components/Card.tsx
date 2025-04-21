// src/components/Card.tsx
import React from 'react'

type CardProps = {
  title: string
  rating: number
  comment: string
  status: string
  extraInfo: string
  type: 'movie' | 'book' | 'videoGame'
  dateInfo: string | number
}

const Card = ({ title, rating, comment, status, extraInfo, type, dateInfo }: CardProps) => (
  <div className="card">
    <h3>{title}</h3>
    <p>Rating: {rating}</p>
    <p>{comment}</p>
    <p>Status: {status}</p>
    <p>{extraInfo}: {dateInfo}</p>
  </div>
)

export default Card
