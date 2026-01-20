import React from 'react'
import { motion } from 'framer-motion'

const techItems = [
  { name: 'React Native', icon: '📱' },

  { name: 'TypeScript', icon: '📘' },
  { name: 'JavaScript', icon: '💛' },
  { name: 'C#', icon: '🟣' },

  { name: 'Python', icon: '🐍' },
  { name: 'Swift', icon: '🍎' },
  { name: 'Java', icon: '☕' },
  { name: 'Git', icon: '🔧' },
  { name: 'Fastlane', icon: '🚀' },
  { name: 'VS Code', icon: '💻' },
  { name: 'Firebase', icon: '🔥' },
  { name: 'Redux', icon: '🔮' },
  { name: 'REST API', icon: '🌐' },
  { name: 'GraphQL', icon: '📊' },
  { name: 'GitHub Actions', icon: '⚡' },
  { name: 'C++', icon: '⚙️' },
]

export function TechStack() {
  return (
    <section
      id="tech-stack"
      className="stack"
      style={{ padding: '4rem 2rem', maxWidth: 800, margin: '0 auto' }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 0 }}>Tech Stack</h2>

      <div
        className="grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem',
        }}
      >
        {techItems.map((tech, idx) => (
          <motion.div
            key={tech.name}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: (idx % 4) * 0.1, duration: 0.6, type: 'spring' }}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            style={{
              background: '#454545ff',
              borderRadius: 12,
              padding: '1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              minHeight: '120px',
            }}
          >
            <span style={{ fontSize: '2.5rem' }}>{tech.icon}</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{tech.name}</h3>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
