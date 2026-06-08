import { useState, useRef, useEffect } from 'react'
import { Code2, X, Maximize2, Minimize2, Terminal, Play, Square,
  Copy, Check, BookOpen, GitBranch, Timer, Layers, FileText,
  Zap, Plus, Trash2, RotateCcw, Sun, Moon, Search } from 'lucide-react'
import { useBidStore } from '../../store/bidStore'

const TOOLS = [
  { id: 'intellij', name: 'IntelliJ IDEA', icon: '🧠', color: '#fe315d', bg: 'rgba(254,49,93,0.1)', border: 'rgba(254,49,93,0.3)', description: 'Java / Spring Boot IDE',
    theme: { bg: '#2b2b2b', sidebar: '#3c3f41', text: '#a9b7c6' },
    files: ['Main.java','BidController.java','UserService.java','pom.xml'],
    code: `package com.bidnova;\n\nimport org.springframework.boot.SpringApplication;\nimport org.springframework.boot.autoconfigure.SpringBootApplication;\n\n@SpringBootApplication\npublic class BidNovaApplication {\n    public static void main(String[] args) {\n        SpringApplication.run(BidNovaApplication.class, args);\n        System.out.println("BidNova started on port 8080");\n    }\n}`,
    buildLogs: ['> Task :compileJava','> Task :processResources','> Task :classes','> Task :bootJar','✅ BUILD SUCCESSFUL in 3s','🚀 Started on port 8080'],
    shortcuts: [['Ctrl+Shift+F','Find in files'],['Alt+Enter','Quick fix'],['Ctrl+Alt+L','Reformat'],['Shift+F10','Run'],['Ctrl+B','Go to declaration']],
    snippets: [
      { title: 'REST Controller', code: '@RestController\n@RequestMapping("/api")\npublic class BidController {\n    @GetMapping("/bids")\n    public List<Bid> getBids() {\n        return bidService.findAll();\n    }\n}' },
      { title: 'MongoDB Repository', code: '@Repository\npublic interface BidRepository\n    extends MongoRepository<Bid, String> {\n    List<Bid> findByAssignedTo(String userId);\n}' },
    ],
  },
  { id: 'vscode', name: 'VS Code', icon: '💙', color: '#007acc', bg: 'rgba(0,122,204,0.1)', border: 'rgba(0,122,204,0.3)', description: 'JavaScript / React IDE',
    theme: { bg: '#1e1e1e', sidebar: '#252526', text: '#d4d4d4' },
    files: ['App.jsx','BidCard.jsx','api/bids.js','package.json'],
    code: `import { useState, useEffect } from 'react'\nimport { bidsAPI } from '../api/bids'\n\nexport default function BidDashboard() {\n  const [bids, setBids] = useState([])\n\n  useEffect(() => {\n    bidsAPI.getMyBids().then(res => setBids(res.data || []))\n  }, [])\n\n  return (\n    <div>\n      <h1>My Bids ({bids.length})</h1>\n      {bids.map(bid => <div key={bid._id}>{bid.title}</div>)}\n    </div>\n  )\n}`,
    buildLogs: ['> npm run build','> vite build','✓ 42 modules transformed','✓ built in 1.24s','✅ Build complete!','📦 dist/ ready'],
    shortcuts: [['Ctrl+P','Quick open'],['Ctrl+Shift+P','Command palette'],['Alt+Z','Word wrap'],['F5','Debug'],['Ctrl+`','Toggle terminal']],
    snippets: [
      { title: 'React useState', code: 'const [data, setData] = useState(null)\n\nuseEffect(() => {\n  fetchData().then(res => setData(res))\n}, [])' },
      { title: 'Axios API Call', code: 'const fetchBids = async () => {\n  try {\n    const res = await api.get("/bids")\n    return res.data\n  } catch (err) {\n    console.error(err)\n  }\n}' },
    ],
  },
  { id: 'android', name: 'Android Studio', icon: '🤖', color: '#3ddc84', bg: 'rgba(61,220,132,0.1)', border: 'rgba(61,220,132,0.3)', description: 'Android / Kotlin IDE',
    theme: { bg: '#2b2b2b', sidebar: '#3c3f41', text: '#a9b7c6' },
    files: ['MainActivity.kt','BidViewModel.kt','BidAdapter.kt','AndroidManifest.xml'],
    code: `package com.bidnova.android\n\nimport androidx.appcompat.app.AppCompatActivity\nimport android.os.Bundle\n\nclass MainActivity : AppCompatActivity() {\n    override fun onCreate(savedInstanceState: Bundle?) {\n        super.onCreate(savedInstanceState)\n        setContentView(R.layout.activity_main)\n    }\n}`,
    buildLogs: ['> Task :app:compileDebugKotlin','> Task :app:mergeDebugResources','> Task :app:packageDebug','✅ BUILD SUCCESSFUL in 8s','📱 APK generated'],
    shortcuts: [['Shift+F10','Run app'],['Ctrl+Shift+A','Find action'],['Alt+Enter','Quick fix'],['Ctrl+D','Duplicate line'],['Ctrl+Alt+O','Optimize imports']],
    snippets: [
      { title: 'ViewModel', code: 'class BidViewModel : ViewModel() {\n    private val _bids = MutableLiveData<List<Bid>>()\n    val bids: LiveData<List<Bid>> = _bids\n\n    fun fetchBids() {\n        viewModelScope.launch {\n            _bids.value = repository.getBids()\n        }\n    }\n}' },
    ],
  },
  { id: 'eclipse', name: 'Eclipse IDE', icon: '🌑', color: '#f7941e', bg: 'rgba(247,148,30,0.1)', border: 'rgba(247,148,30,0.3)', description: 'Java Enterprise IDE',
    theme: { bg: '#1c1c1c', sidebar: '#2d2d2d', text: '#cccccc' },
    files: ['BidService.java','BidRepository.java','BidEntity.java','persistence.xml'],
    code: `package com.bidnova.service;\n\nimport javax.persistence.*;\n\n@Entity\n@Table(name = "bids")\npublic class BidEntity {\n    @Id\n    @GeneratedValue(strategy = GenerationType.IDENTITY)\n    private Long id;\n\n    @Column(nullable = false)\n    private String title;\n\n    @Column\n    private String status = "new";\n}`,
    buildLogs: ['Compiling BidEntity.java...','Compiling BidService.java...','✅ Build complete - 0 errors','📦 Project ready'],
    shortcuts: [['Ctrl+Shift+O','Organize imports'],['F3','Open declaration'],['Ctrl+1','Quick fix'],['Alt+Shift+R','Rename'],['Ctrl+Shift+F','Format']],
    snippets: [
      { title: 'JPA Entity', code: '@Entity\n@Table(name="bids")\npublic class Bid {\n    @Id @GeneratedValue\n    private Long id;\n    private String title;\n    private String status = "new";\n}' },
    ],
  },
  { id: 'pycharm', name: 'PyCharm', icon: '🐍', color: '#21d789', bg: 'rgba(33,215,137,0.1)', border: 'rgba(33,215,137,0.3)', description: 'Python / Django IDE',
    theme: { bg: '#1e1f22', sidebar: '#2b2d30', text: '#bcbec4' },
    files: ['views.py','models.py','serializers.py','urls.py'],
    code: `from django.db import models\nfrom rest_framework import serializers\n\nclass Bid(models.Model):\n    title = models.CharField(max_length=200)\n    client_name = models.CharField(max_length=100)\n    value = models.DecimalField(max_digits=10, decimal_places=2)\n    status = models.CharField(max_length=50, default='new')\n\n    def __str__(self):\n        return self.title`,
    buildLogs: ['Collecting dependencies...','Running migrations...','✅ System check passed','🌐 Django server started at 8000'],
    shortcuts: [['Shift+F10','Run'],['Ctrl+Alt+L','Reformat'],['Ctrl+Shift+F','Find in path'],['Alt+F7','Find usages']],
    snippets: [
      { title: 'Django View', code: 'from rest_framework.views import APIView\nfrom rest_framework.response import Response\n\nclass BidListView(APIView):\n    def get(self, request):\n        bids = Bid.objects.all()\n        return Response(BidSerializer(bids, many=True).data)' },
    ],
  },
  { id: 'xcode', name: 'Xcode', icon: '🍎', color: '#1d77ef', bg: 'rgba(29,119,239,0.1)', border: 'rgba(29,119,239,0.3)', description: 'iOS / Swift IDE',
    theme: { bg: '#1e1e1e', sidebar: '#252526', text: '#d4d4d4' },
    files: ['ContentView.swift','BidViewModel.swift','BidModel.swift','Info.plist'],
    code: `import SwiftUI\n\nstruct ContentView: View {\n    @StateObject var viewModel = BidViewModel()\n\n    var body: some View {\n        NavigationView {\n            List(viewModel.bids) { bid in\n                VStack(alignment: .leading) {\n                    Text(bid.title).font(.headline)\n                    Text(bid.clientName).foregroundColor(.secondary)\n                }\n            }\n            .navigationTitle("My Bids")\n        }\n        .onAppear { viewModel.fetchBids() }\n    }\n}`,
    buildLogs: ['CompileSwift BidViewModel.swift','CompileSwift ContentView.swift','Linking BidNova','✅ BUILD SUCCEEDED','📱 Running on iPhone 15 Pro'],
    shortcuts: [['Cmd+R','Run'],['Cmd+B','Build'],['Cmd+Shift+K','Clean'],['Ctrl+I','Re-indent'],['Cmd+/','Comment']],
    snippets: [
      { title: 'SwiftUI View', code: 'struct BidRow: View {\n    let bid: Bid\n    var body: some View {\n        HStack {\n            Text(bid.title).font(.headline)\n            Spacer()\n            Text("$\\(bid.value)").foregroundColor(.blue)\n        }\n    }\n}' },
    ],
  },
]

const GIT_COMMANDS = [
  { cmd: 'git init', desc: 'Initialize repository' },
  { cmd: 'git clone <url>', desc: 'Clone a repository' },
  { cmd: 'git add .', desc: 'Stage all changes' },
  { cmd: 'git commit -m "msg"', desc: 'Commit changes' },
  { cmd: 'git push origin main', desc: 'Push to remote' },
  { cmd: 'git pull', desc: 'Pull latest changes' },
  { cmd: 'git branch <name>', desc: 'Create branch' },
  { cmd: 'git checkout <branch>', desc: 'Switch branch' },
  { cmd: 'git merge <branch>', desc: 'Merge branch' },
  { cmd: 'git status', desc: 'Check status' },
  { cmd: 'git log --oneline', desc: 'View history' },
  { cmd: 'git stash', desc: 'Stash changes' },
]

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      style={{ background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 4, cursor: 'pointer', color: copied ? '#34d399' : '#9ca3af', padding: '2px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
      {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
    </button>
  )
}

function IDEWindow({ tool, onClose }) {
  const [activeFile, setActiveFile] = useState(tool.files[0])
  const [code, setCode] = useState(tool.code)
  const [tab, setTab] = useState('code')
  const [termOpen, setTermOpen] = useState(true)
  const [logs, setLogs] = useState([`$ ${tool.name} ready`])
  const [running, setRunning] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [saved, setSaved] = useState(true)
  const [files, setFiles] = useState(tool.files)
  const [newFile, setNewFile] = useState('')
  const [progress, setProgress] = useState(0)
  const termRef = useRef(null)
  const bg = theme === 'dark' ? tool.theme.bg : '#f8f8f8'
  const sbg = theme === 'dark' ? tool.theme.sidebar : '#e8e8e8'
  const tc = theme === 'dark' ? tool.theme.text : '#333'

  const run = () => {
    setRunning(true); setTermOpen(true); setProgress(0)
    setLogs(['$ Building project...'])
    tool.buildLogs.forEach((line, i) => {
      setTimeout(() => {
        setLogs(p => [...p, line])
        setProgress(Math.round(((i + 1) / tool.buildLogs.length) * 100))
        if (i === tool.buildLogs.length - 1) setRunning(false)
        if (termRef.current) termRef.current.scrollTop = 9999
      }, (i + 1) * 450)
    })
  }

  const save = () => { setSaved(true); setLogs(p => [...p, `💾 ${activeFile} saved`]) }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: maximized ? 0 : 12 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: maximized ? '100%' : '94%', maxWidth: maximized ? '100%' : 1200, height: maximized ? '100vh' : '90vh', background: bg, borderRadius: maximized ? 0 : 10, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 100px rgba(0,0,0,0.9)', border: `1px solid ${tool.border}` }}>

        {/* Title bar */}
        <div style={{ background: sbg, padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid rgba(255,255,255,0.07)`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div onClick={onClose} style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', cursor: 'pointer' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
              <div onClick={() => setMaximized(!maximized)} style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', cursor: 'pointer' }} />
            </div>
            <span style={{ fontSize: 13, color: tc, fontWeight: 600, marginLeft: 6 }}>
              {tool.icon} {tool.name} — BidNova Project
              {!saved && <span style={{ color: '#f59e0b', marginLeft: 6, fontSize: 11 }}>●</span>}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {running && <div style={{ width: 70, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: tool.color, transition: 'width 0.3s' }} />
            </div>}
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tc, padding: 4 }}>
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button onClick={save} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: saved ? '#34d399' : '#f59e0b', padding: '3px 8px', borderRadius: 4, fontSize: 11 }}>
              {saved ? '✓ Saved' : '💾 Save'}
            </button>
            <button onClick={run} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: running ? '#555' : tool.color, color: 'white' }}>
              {running ? <><Square size={11} /> Building...</> : <><Play size={11} /> Run</>}
            </button>
            <button onClick={() => setMaximized(!maximized)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tc, padding: 4 }}>
              {maximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tc, padding: 4 }}><X size={13} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: sbg, display: 'flex', borderBottom: `1px solid rgba(255,255,255,0.07)`, flexShrink: 0 }}>
          {[['code','📝 Editor'],['snippets','⚡ Snippets'],['shortcuts','⌨️ Shortcuts']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding: '6px 14px', background: tab === id ? bg : 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: tab === id ? tool.color : tc, borderTop: tab === id ? `2px solid ${tool.color}` : '2px solid transparent' }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Sidebar */}
          <div style={{ width: 185, background: sbg, borderRight: `1px solid rgba(255,255,255,0.06)`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '8px 10px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(128,128,128,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Explorer</span>
              <button onClick={() => { const n = prompt('New file name:'); if (n) { setFiles(p => [...p, n]); setActiveFile(n); setCode(`// ${n}\n`) } }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tool.color, padding: 0 }} title="New file"><Plus size={13} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
              <p style={{ fontSize: 11, color: 'rgba(128,128,128,0.5)', padding: '0 10px 4px', fontWeight: 600 }}>📁 bidnova-project</p>
              {files.map(f => (
                <div key={f} onClick={() => setActiveFile(f)} style={{ padding: '5px 14px', fontSize: 12, cursor: 'pointer', color: activeFile === f ? 'white' : tc, background: activeFile === f ? `${tool.color}25` : 'transparent', borderLeft: activeFile === f ? `2px solid ${tool.color}` : '2px solid transparent', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 10 }}>{f.endsWith('.java') || f.endsWith('.kt') ? '☕' : f.endsWith('.py') ? '🐍' : f.endsWith('.swift') ? '🍎' : f.endsWith('.jsx') || f.endsWith('.js') ? '⚛️' : '📄'}</span>
                  {f}
                </div>
              ))}
            </div>
            <div style={{ padding: '4px 10px', borderTop: `1px solid rgba(255,255,255,0.06)`, fontSize: 10, color: 'rgba(128,128,128,0.5)' }}>
              {files.length} files · {code.split('\n').length} lines
            </div>
          </div>

          {/* Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {tab === 'code' && (
              <>
                <div style={{ background: sbg, borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', flexShrink: 0 }}>
                  <div style={{ padding: '6px 14px', fontSize: 12, color: 'white', background: bg, borderTop: `2px solid ${tool.color}`, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {activeFile}{!saved && <span style={{ color: '#f59e0b', fontSize: 10 }}>●</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'rgba(128,128,128,0.4)' }}>Ln {code.split('\n').length} · UTF-8</span>
                    <CopyBtn text={code} />
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto', display: 'flex', fontFamily: 'Consolas, monospace', fontSize: 13, lineHeight: 1.7 }}>
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '14px 8px', color: 'rgba(128,128,128,0.35)', userSelect: 'none', textAlign: 'right', minWidth: 38, fontSize: 12, lineHeight: 1.7, flexShrink: 0 }}>
                    {code.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
                  </div>
                  <textarea value={code} onChange={e => { setCode(e.target.value); setSaved(false) }}
                    onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save() } }}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: tc, fontFamily: 'Consolas, monospace', fontSize: 13, lineHeight: 1.7, padding: '14px 16px', resize: 'none', whiteSpace: 'pre', overflowWrap: 'normal' }}
                    spellCheck={false} />
                </div>
              </>
            )}

            {tab === 'snippets' && (
              <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
                {(tool.snippets || []).map((s, i) => (
                  <div key={i} style={{ marginBottom: 14, background: theme === 'dark' ? '#1a1a1a' : '#f0f0f0', borderRadius: 8, overflow: 'hidden', border: `1px solid ${tool.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: sbg }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: tool.color }}>{s.title}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setCode(prev => prev + '\n\n' + s.code); setTab('code'); setSaved(false) }}
                          style={{ background: `${tool.color}20`, border: `1px solid ${tool.color}40`, borderRadius: 4, cursor: 'pointer', color: tool.color, padding: '2px 8px', fontSize: 11 }}>Insert</button>
                        <CopyBtn text={s.code} />
                      </div>
                    </div>
                    <pre style={{ margin: 0, padding: '10px 14px', fontFamily: 'Consolas, monospace', fontSize: 12, color: tc, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{s.code}</pre>
                  </div>
                ))}
              </div>
            )}

            {tab === 'shortcuts' && (
              <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(tool.shortcuts || []).map(([key, desc], i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: theme === 'dark' ? '#1a1a1a' : '#f0f0f0', borderRadius: 7, border: `1px solid ${tool.border}` }}>
                      <kbd style={{ background: tool.color, color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{key}</kbd>
                      <span style={{ fontSize: 12, color: tc }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terminal */}
            {termOpen ? (
              <div style={{ height: 140, background: '#0d0d0d', borderTop: `1px solid rgba(255,255,255,0.08)`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                  <Terminal size={11} color={tool.color} />
                  <span style={{ fontSize: 11, color: tool.color, fontWeight: 600 }}>Terminal</span>
                  {running && <span style={{ fontSize: 10, color: '#f59e0b' }}>● running</span>}
                  <button onClick={() => setLogs([])} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Clear</button>
                  <button onClick={() => setTermOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0 }}><X size={11} /></button>
                </div>
                <div ref={termRef} style={{ flex: 1, overflow: 'auto', padding: '6px 14px' }}>
                  {logs.map((line, i) => (
                    <div key={i} style={{ fontFamily: 'Consolas, monospace', fontSize: 12, lineHeight: 1.6, color: line.startsWith('✅') ? '#00ff88' : line.startsWith('$') ? '#60a5fa' : line.startsWith('📦') || line.startsWith('🚀') || line.startsWith('📱') ? '#fbbf24' : '#cccccc' }}>
                      {line}
                    </div>
                  ))}
                  {running && <div style={{ color: '#f59e0b', fontSize: 12, fontFamily: 'monospace' }}>▋</div>}
                </div>
              </div>
            ) : (
              <button onClick={() => setTermOpen(true)} style={{ background: '#111', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', color: 'rgba(128,128,128,0.5)', padding: '4px 14px', fontSize: 11, textAlign: 'left', flexShrink: 0 }}>
                <Terminal size={10} style={{ display: 'inline', marginRight: 5 }} /> Terminal
              </button>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div style={{ background: tool.color, padding: '2px 14px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: 'white', fontWeight: 600 }}>{tool.icon} {tool.name}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>📄 {activeFile}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Ln {code.split('\n').length}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginLeft: 'auto' }}>{saved ? '✓ Saved' : '● Modified'}</span>
        </div>
      </div>
    </div>
  )
}

function PomodoroTimer() {
  const [secs, setSecs] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState('work')
  const [sessions, setSessions] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSecs(s => {
        if (s <= 1) {
          clearInterval(ref.current); setRunning(false)
          if (mode === 'work') { setSessions(n => n + 1); setMode('break'); setSecs(5 * 60) }
          else { setMode('work'); setSecs(25 * 60) }
          return 0
        }
        return s - 1
      }), 1000)
    }
    return () => clearInterval(ref.current)
  }, [running, mode])
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  const pct = mode === 'work' ? ((25 * 60 - secs) / (25 * 60)) * 100 : ((5 * 60 - secs) / (5 * 60)) * 100
  return (
    <div className="card" style={{ textAlign: 'center', maxWidth: 280 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
        <Timer size={14} color="#f59e0b" /> Pomodoro Timer
      </h3>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
        {['work', 'break'].map(m => (
          <button key={m} onClick={() => { setMode(m); setRunning(false); setSecs(m === 'work' ? 25 * 60 : 5 * 60) }}
            style={{ padding: '4px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: mode === m ? (m === 'work' ? '#3b82f6' : '#10b981') : 'var(--color-surface2)', color: mode === m ? 'white' : 'var(--color-muted)' }}>
            {m === 'work' ? '🎯 Work' : '☕ Break'}
          </button>
        ))}
      </div>
      <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 14px' }}>
        <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-surface2)" strokeWidth="8" />
          <circle cx="50" cy="50" r="44" fill="none" stroke={mode === 'work' ? '#3b82f6' : '#10b981'} strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 44}`} strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: mode === 'work' ? '#60a5fa' : '#34d399' }}>{mm}:{ss}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
        <button onClick={() => setRunning(!running)} className="btn btn-primary" style={{ fontSize: 12, height: 32, padding: '0 16px' }}>
          {running ? '⏸ Pause' : '▶ Start'}
        </button>
        <button onClick={() => { setRunning(false); setSecs(mode === 'work' ? 25 * 60 : 5 * 60) }} className="btn btn-secondary" style={{ fontSize: 12, height: 32, padding: '0 12px' }}>
          <RotateCcw size={12} />
        </button>
      </div>
      <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>Sessions: <strong style={{ color: '#f59e0b' }}>{sessions}</strong></p>
    </div>
  )
}

function TaskBoard() {
  const COLS = ['todo', 'inprogress', 'done']
  const LABELS = { todo: '📋 To Do', inprogress: '⚙️ In Progress', done: '✅ Done' }
  const COLORS = { todo: '#6b7280', inprogress: '#f59e0b', done: '#10b981' }
  const [tasks, setTasks] = useState(() => { try { return JSON.parse(localStorage.getItem('devtools-tasks') || '[]') } catch { return [] } })
  const [newTask, setNewTask] = useState('')
  const [drag, setDrag] = useState(null)
  const save = t => { setTasks(t); localStorage.setItem('devtools-tasks', JSON.stringify(t)) }
  return (
    <div className="card">
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Layers size={14} color="#8b5cf6" /> Task Board
      </h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input className="input" placeholder="Add task..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newTask.trim()) { save([...tasks, { id: Date.now(), text: newTask.trim(), col: 'todo' }]); setNewTask('') } }} style={{ flex: 1, height: 34, fontSize: 13 }} />
        <button onClick={() => { if (newTask.trim()) { save([...tasks, { id: Date.now(), text: newTask.trim(), col: 'todo' }]); setNewTask('') } }} className="btn btn-primary" style={{ height: 34 }}><Plus size={13} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {COLS.map(col => (
          <div key={col} style={{ background: 'var(--color-surface2)', borderRadius: 8, padding: 8, minHeight: 80 }}
            onDragOver={e => e.preventDefault()} onDrop={() => drag && save(tasks.map(t => t.id === drag ? { ...t, col } : t))}>
            <p style={{ fontSize: 11, fontWeight: 700, color: COLORS[col], marginBottom: 6 }}>{LABELS[col]}</p>
            {tasks.filter(t => t.col === col).map(t => (
              <div key={t.id} draggable onDragStart={() => setDrag(t.id)} onDragEnd={() => setDrag(null)}
                style={{ background: 'var(--color-surface)', borderRadius: 6, padding: '6px 8px', marginBottom: 5, fontSize: 12, cursor: 'grab', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--color-border)' }}>
                <span>{t.text}</span>
                <button onClick={() => save(tasks.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0 }}><X size={11} /></button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DevTools() {
  const { bids } = useBidStore()
  const [activeTool, setActiveTool] = useState(null)
  const [section, setSection] = useState('tools')
  const SECTIONS = [
    { id: 'tools', label: '🛠️ IDE Tools' },
    { id: 'tasks', label: '📋 Task Board' },
    { id: 'timer', label: '⏱️ Pomodoro' },
    { id: 'git', label: '🌿 Git Ref' },
    { id: 'notes', label: '📝 Scratch Pad' },
  ]
  const [notes, setNotes] = useState(() => localStorage.getItem('devtools-notes') || '// Write your notes here...\n')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code2 size={20} color="#3b82f6" /> Developer Workspace
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 2 }}>IDE tools, task board, timer, and references</p>
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: section === s.id ? '#60a5fa' : 'var(--color-muted)', borderBottom: section === s.id ? '2px solid #3b82f6' : '2px solid transparent' }}>{s.label}</button>
        ))}
      </div>

      {section === 'tools' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
          {TOOLS.map(tool => (
            <div key={tool.id} onClick={() => setActiveTool(tool)} className="card"
              style={{ cursor: 'pointer', transition: 'all 0.2s', border: `1px solid ${tool.border}`, background: tool.bg }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${tool.bg}` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 30 }}>{tool.icon}</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: tool.color }}>{tool.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{tool.description}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {tool.files.slice(0, 3).map(f => <span key={f} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>{f}</span>)}
              </div>
              <button style={{ width: '100%', padding: '7px', borderRadius: 7, border: `1px solid ${tool.border}`, background: tool.bg, color: tool.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Play size={12} /> Open {tool.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {section === 'tasks' && <TaskBoard />}
      {section === 'timer' && <div style={{ maxWidth: 300 }}><PomodoroTimer /></div>}
      {section === 'git' && (
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><GitBranch size={14} color="#10b981" /> Git Commands Reference</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {GIT_COMMANDS.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-surface2)', borderRadius: 7, gap: 8 }}>
                <div>
                  <code style={{ fontSize: 12, color: '#34d399', fontFamily: 'Consolas, monospace' }}>{g.cmd}</code>
                  <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{g.desc}</p>
                </div>
                <CopyBtn text={g.cmd} />
              </div>
            ))}
          </div>
        </div>
      )}
      {section === 'notes' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14} color="#60a5fa" /> Code Scratch Pad</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <CopyBtn text={notes} />
              <button onClick={() => { setNotes(''); localStorage.setItem('devtools-notes', '') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 11 }}>Clear</button>
            </div>
          </div>
          <textarea value={notes} onChange={e => { setNotes(e.target.value); localStorage.setItem('devtools-notes', e.target.value) }}
            style={{ width: '100%', height: 200, background: '#0d0d0d', color: '#00ff88', border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, fontFamily: 'Consolas, monospace', fontSize: 12, lineHeight: 1.6, resize: 'vertical', outline: 'none' }} />
        </div>
      )}

      {activeTool && <IDEWindow tool={activeTool} onClose={() => setActiveTool(null)} />}
    </div>
  )
}
