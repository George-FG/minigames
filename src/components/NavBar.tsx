import React, { useEffect, useState } from 'react'

export function NavBar() {
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'leaderboard', 'demo']
      const scrollPosition = window.scrollY + window.innerHeight / 3

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId)
            break
          }
        }
      }
    }

    // Call immediately
    handleScroll()

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      const elementPosition = element.offsetTop
      const offsetPosition = targetId == 'home' ? 0 : elementPosition - 20
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
    setActiveSection(targetId)
  }

  return (
    <nav className="nav" aria-label="Main navigation">
      <a
        href="#home"
        className={`nav-link ${activeSection === 'home' ? 'nav-link-active' : ''}`}
        onClick={(e) => handleClick(e, 'home')}
      >
        Home
      </a>
      <a
        href="#leaderboard"
        className={`nav-link ${activeSection === 'leaderboard' ? 'nav-link-active' : ''}`}
        onClick={(e) => handleClick(e, 'leaderboard')}
      >
        Leaderboard
      </a>
      <a
        href="#demo"
        className={`nav-link ${activeSection === 'demo' ? 'nav-link-active' : ''}`}
        onClick={(e) => handleClick(e, 'demo')}
      >
        Minigames
      </a>
    </nav>
  )
}
