import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'

// Node category styles
const CATEGORY_STYLES = {
  input:     { bg: '#0f4c2a', border: '#22c55e', text: '#86efac', icon: '▶' },
  reactor:   { bg: '#1a1a4e', border: '#818cf8', text: '#a5b4fc', icon: '⚛' },
  separator: { bg: '#2d1b4e', border: '#c084fc', text: '#d8b4fe', icon: '⬡' },
  heat:      { bg: '#4a1e1e', border: '#f87171', text: '#fca5a5', icon: '♨' },
  storage:   { bg: '#1a2c40', border: '#38bdf8', text: '#7dd3fc', icon: '◉' },
  output:    { bg: '#0d3320', border: '#4ade80', text: '#86efac', icon: '✓' },
  waste:     { bg: '#3a1f0d', border: '#fb923c', text: '#fdba74', icon: '⚠' },
  utility:   { bg: '#1e1e1e', border: '#9ca3af', text: '#d1d5db', icon: '⚙' },
}

function getNodeStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.utility
}

// Custom node component
function ProcessNode({ data }) {
  const style = getNodeStyle(data.category)

  return (
    <div
      style={{
        background: style.bg,
        border: `1.5px solid ${style.border}`,
        borderRadius: '12px',
        padding: '10px 14px',
        minWidth: '120px',
        maxWidth: '160px',
      }}
      title={data.description}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: style.border, fontSize: '10px' }}>{style.icon}</span>
        <span
          style={{ color: style.text, fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em' }}
        >
          {data.label}
        </span>
      </div>
      {data.details && (
        <p style={{ color: style.text + '80', fontSize: '9px', lineHeight: 1.4, marginTop: '2px' }}>
          {data.details}
        </p>
      )}
    </div>
  )
}

const nodeTypes = { process: ProcessNode }

// Auto-layout using dagre
function layoutGraph(nodes, edges) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', ranksep: 80, nodesep: 40, edgesep: 20 })

  nodes.forEach(n => g.setNode(n.id, { width: 160, height: 70 }))
  edges.forEach(e => g.setEdge(e.source, e.target))

  dagre.layout(g)

  return nodes.map(n => {
    const pos = g.node(n.id)
    return {
      ...n,
      position: { x: pos.x - 80, y: pos.y - 35 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }
  })
}

function buildReactFlowData(pfd) {
  if (!pfd?.nodes?.length) return { nodes: [], edges: [] }

  const rfNodes = pfd.nodes.map(n => ({
    id: n.id,
    type: 'process',
    data: {
      label: n.label,
      category: n.category || 'utility',
      description: n.description || '',
      details: n.details || '',
    },
    position: { x: 0, y: 0 },
  }))

  const rfEdges = (pfd.edges || []).map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label || '',
    labelStyle: { fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'Inter' },
    labelBgStyle: { fill: 'transparent' },
    style: { stroke: 'rgba(6,182,212,0.45)', strokeWidth: 1.5 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'rgba(6,182,212,0.55)',
      width: 16,
      height: 16,
    },
    animated: false,
  }))

  const layoutedNodes = layoutGraph(rfNodes, rfEdges)
  return { nodes: layoutedNodes, edges: rfEdges }
}

export default function PFDDiagram({ pfd }) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildReactFlowData(pfd),
    [pfd]
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const onInit = useCallback(reactFlowInstance => {
    setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 100)
  }, [])

  if (!pfd?.nodes?.length) {
    return (
      <div className="flex items-center justify-center h-64 text-white/30 text-sm">
        No PFD data available
      </div>
    )
  }

  return (
    <div className="w-full h-[420px] rounded-xl overflow-hidden border border-white/[0.06]
                    bg-surface-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <Background color="rgba(255,255,255,0.03)" gap={24} size={1} />
        <Controls
          style={{
            button: { background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }
          }}
        />
        <MiniMap
          style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)' }}
          nodeColor={n => {
            const style = getNodeStyle(n.data?.category)
            return style.border
          }}
          maskColor="rgba(0,0,0,0.4)"
        />
      </ReactFlow>
    </div>
  )
}
