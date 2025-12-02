import './App.css'
import { MultiLineTimeline } from './components/MultiLineTimeline'
import { loadBranchTracks, loadMilestones } from './data/loaders'

const branchTracks = loadBranchTracks()
const milestones = loadMilestones()

function App() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(circle at 10% 10%, rgba(31,182,255,0.12), transparent 35%), radial-gradient(circle at 80% 0%, rgba(255,120,73,0.08), transparent 30%), #f7f8fb',
      }}
    >
      <div className="mx-auto flex flex-col gap-10">
        <section>
          <h2 className="text-xl font-bold text-gray-dark p-4">Onboarding</h2>
          <MultiLineTimeline
            tracks={branchTracks}
            milestones={milestones}
            weeks={26}
            sprintLength={2}
            weekHeight={90}
          />
        </section>
      </div>
    </div>
  )
}

export default App
