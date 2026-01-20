import React from 'react'
import { motion } from 'framer-motion'

const experienceCards = [
  {
    title: 'Mobiler Engineer',
    timeframe: '2025 - Present',
    description:
      'At Frasers Group, I develop and maintain high-quality mobile applications for retail customers on both IOS and Android.',
    image: '/Frasers-Group-logo.png',
  },
  {
    title: 'Software Developer Apprenticeship',
    timeframe: '2025 - Present',
    description:
      'Alongside my role at Frasers Group, I am completing a Level 4 Software Developer Apprenticeship with QA Apprenticeships: this accounts for 20% of my role.',
    image: '/QA_Profile_Logo.png',
  },
  {
    title: 'Python Course',
    timeframe: '2025',
    description:
      'I delivered a bespoke Python course at Tiger Eye Consulting, focusing on API integration. Ensuring core Python concepts were also covered, I enabled attendees to build practical skills in python and apply these within their role.',
    image: '/python-logo.jpg',
  },
  {
    title: 'A-level STEM Tutor',
    timeframe: '2024 - 2025',
    description:
      'Following my A-levels, I tutored both A-level Computer Science and Mathematics at Sir Isaac Newton Sixth Form, mentoring a range of students in their chosen subjects.',
    image: '/SIN-logo.png',
  },

  {
    title: 'Private Tutor',
    timeframe: '2023 - Present',
    description:
      'I have provided private tutoring in Mathematics and Computer Science to a variety of students at all levels, helping them to improve their understanding and achieve their academic goals.',
    image: '/tutor.png',
  },
  {
    title: 'Scout Leader',
    timeframe: '2020 - Present',
    description:
      'Although voluntary, the skills I have developed as a Scout Leader have enabled me in my role today. During my role, I have planned, \
      organized and led a range of activities, empowering many young individuals to develop new skills.',
    image: '/scout-logo.png',
  },
]

export function Experience() {
  return (
    <section
      id="experience"
      className="stack"
      style={{ padding: '4rem 2rem', maxWidth: 800, margin: '0 auto' }}
    >
      <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Experience</h2>
      <div
        className="grid"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}
      >
        {experienceCards.map((card, idx) => (
          <motion.div
            className="card"
            key={idx}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: (idx % 2) * 0.15, duration: 0.6, type: 'spring' }}
            style={{
              flex: '1 1 300px',
              maxWidth: 340,
              background: '#454545ff',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              padding: '1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <h2 style={{ marginTop: 0 }}>{card.title}</h2>
            {card.image && (
              <img
                src={card.image}
                alt={card.title}
                style={{
                  width: '100%',
                  maxWidth: 220,
                  borderRadius: 8,
                  marginBottom: '1rem',
                  objectFit: 'cover',
                }}
              />
            )}
            <h2 className="card-title" style={{ margin: '0.5rem 0' }}>
              {card.timeframe}
            </h2>
            <p className="card-text" style={{ fontSize: '1rem' }}>
              {card.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
