import { useEffect, useState } from 'react'
import { Play, RefreshCw } from 'lucide-react'

const DEFAULT_CODE = `import requests\n\nresponse = requests.get('https://api.example.com/bids')\nif response.ok:\n    print('Loaded', len(response.json()), 'bids')\nelse:\n    print('Failed to fetch bids')\n`

export default function DevToolsPythonDemo() {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [output, setOutput] = useState('Ready. Run the demo to see sample output.')
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => {
      setOutput('✅ Demo executed successfully.\n\nLoaded 12 bids from the mock API.')
      setRunning(false)
    }, 800)
    return () => window.clearTimeout(timer)
  }, [running])

  const handleRun = () => {
    if (running) return
    setRunning(true)
    setOutput('Running demo...')
  }

  const handleReset = () => {
    if (running) return
    setOutput('Ready. Run the demo to see sample output.')
  }

  return (
    <section className="python-demo-panel" aria-label="Python Demo Workspace">
      <header className="demo-header">
        <div>
          <h2>Python Demo Workspace</h2>
          <p>Experiment with Python snippets and get quick feedback.</p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={running}
            aria-disabled={running}
          >
            <Play size={16} /> {running ? 'Running...' : 'Run Demo'}
          </button>
        </div>
      </header>

      <div className="demo-grid" aria-live="polite">
        <div className="demo-editor">
          <div className="editor-title">Python code</div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={16}
            spellCheck={false}
            aria-label="Python code editor"
          />
        </div>

        <div className="demo-output">
          <div className="output-title">Console output</div>
          <pre>{output}</pre>
          <button
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={running}
            aria-disabled={running}
          >
            <RefreshCw size={16} /> Reset
          </button>
        </div>
      </div>
    </section>
  )
}
