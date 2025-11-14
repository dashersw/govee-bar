const scenes = [
  { id: 'morning', name: 'Morning', icon: 'light_mode', active: true },
  { id: 'movie', name: 'Movie', icon: 'theaters', active: false },
  { id: 'focus', name: 'Focus', icon: 'psychology', active: false },
  { id: 'night', name: 'Night', icon: 'dark_mode', active: false }
]

export function Scenes() {
  return (
    <div className="scenes-section">
      <h3 className="section-title">Scenes</h3>
      <div className="scenes-grid">
        {scenes.map((scene) => (
          <div key={scene.id} className="scene-item">
            <div className={`scene-icon ${scene.active ? 'scene-active' : ''}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{scene.icon}</span>
            </div>
            <span className="scene-label">{scene.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

