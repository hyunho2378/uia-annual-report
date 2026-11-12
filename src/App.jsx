// UIA 2026 Annual Report 책 화면. 미리 구운 쪽 이미지를 page-flip 캔버스로 넘긴다.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PageFlip } from 'page-flip'
import { manifest } from './manifest'

const RATIO = 4 / 3 // 높이 / 너비
const src = (i) => import.meta.env.BASE_URL + 'pages/p-' + String(i).padStart(2, '0') + '.webp'

function UiaMark() {
  return (
    <svg viewBox="0 0 288 132" role="img" aria-label="UIA" fill="none" stroke="currentColor" strokeWidth="30" strokeLinecap="round" style={{ height: '1.5rem', width: 'auto' }}>
      <path d="M45 45 V82 A30 30 0 0 0 75 112" />
      <path d="M75 112 A30 30 0 0 0 105 82 V45" />
      <path d="M150 45 V112" />
      <circle cx="218" cy="82" r="30" />
      <path d="M248 47 V112" />
      <g fill="currentColor" stroke="none">
        <circle cx="45" cy="45" r="15" /><circle cx="105" cy="45" r="15" /><circle cx="75" cy="112" r="15" />
        <circle cx="150" cy="16" r="14" /><circle cx="150" cy="112" r="15" />
        <circle cx="188" cy="82" r="14" /><circle cx="248" cy="47" r="14" /><circle cx="248" cy="112" r="15" />
      </g>
    </svg>
  )
}

export default function App() {
  const stageRef = useRef(null)
  const bookRef = useRef(null)
  const flipRef = useRef(null)
  const [cur, setCur] = useState(0)
  const [ready, setReady] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)
  const [full, setFull] = useState(false)
  const [loaded, setLoaded] = useState(0)
  const total = manifest.count

  const measure = useCallback(() => {
    const el = stageRef.current
    if (!el) return null
    const w = el.clientWidth
    const h = el.clientHeight
    const single = w < 720
    const pad = single ? 8 : 24
    let pw = single ? w - pad * 2 : (w - pad * 2) / 2
    let ph = pw * RATIO
    if (ph > h - pad * 2) {
      ph = h - pad * 2
      pw = ph / RATIO
    }
    return { pw: Math.floor(pw), ph: Math.floor(ph), single }
  }, [])

  const [dims, setDims] = useState(null)
  const curRef = useRef(0)
  curRef.current = cur

  useEffect(() => {
    setDims(measure())
    let t
    const on = () => {
      clearTimeout(t)
      t = setTimeout(() => {
        const m = measure()
        setDims((d) => (d && m && d.pw === m.pw && d.ph === m.ph ? d : m))
      }, 200)
    }
    window.addEventListener('resize', on)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', on)
    }
  }, [measure])

  // 앞쪽부터 여섯 줄로 미리 받아 넘김이 끊기지 않게 한다
  useEffect(() => {
    let alive = true
    let done = 0
    const load = (i) => {
      if (!alive || i >= total) return
      const im = new Image()
      im.decoding = 'async'
      im.onload = im.onerror = () => {
        done += 1
        setLoaded(done)
        load(i + 6)
      }
      im.src = src(i)
    }
    for (let k = 0; k < 6; k += 1) load(k)
    return () => { alive = false }
  }, [total])

  useEffect(() => {
    if (!dims || !bookRef.current) return undefined
    const host = bookRef.current
    // 캔버스는 CSS 픽셀 해상도라 레티나에서 흐려진다. 배율(k)만큼 크게 그리고 CSS로 줄여 선명하게 한다.
    const k = Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1)))
    const sw = stageRef.current.clientWidth
    const sh = stageRef.current.clientHeight
    const node = document.createElement('div')
    node.style.cssText = 'width:' + sw * k + 'px;height:' + sh * k + 'px;transform:scale(' + 1 / k + ');transform-origin:0 0;position:absolute;left:0;top:0'
    host.appendChild(node)
    const flip = new PageFlip(node, {
      width: dims.pw * k,
      height: dims.ph * k,
      size: 'fixed',
      minWidth: 120,
      maxShadowOpacity: 0.45,
      showCover: true,
      usePortrait: true,
      mobileScrollSupport: false,
      drawShadow: true,
      flippingTime: 820,
      swipeDistance: 24 * k,
      clickEventForward: false,
      autoSize: false,
      startPage: curRef.current,
    })
    flipRef.current = flip
    flip.loadFromImages(Array.from({ length: total }, (_, i) => src(i)))
    try {
      flip.render.clear = function clearTransparent() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      }
      flip.ui.getMousePos = (x, y) => {
        const r = node.getBoundingClientRect()
        return { x: (x - r.left) * k, y: (y - r.top) * k }
      }
    } catch {
      /* 내부 구조가 바뀐 경우 기본 동작을 유지한다 */
    }
    flip.on('flip', (e) => setCur(e.data))
    setReady(true)
    return () => {
      try { flip.destroy() } catch { /* 이미 해제됨 */ }
      flipRef.current = null
      node.remove()
    }
  }, [dims, total])

  const go = useCallback((i) => {
    const f = flipRef.current
    if (!f) return
    f.flip(Math.max(0, Math.min(total - 1, i)))
  }, [total])
  const prev = useCallback(() => flipRef.current?.flipPrev('bottom'), [])
  const next = useCallback(() => flipRef.current?.flipNext('bottom'), [])

  useEffect(() => {
    const on = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') next()
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') prev()
      else if (e.key === 'Home') go(0)
      else if (e.key === 'End') go(total - 1)
      else if (e.key === 'Escape') setTocOpen(false)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [next, prev, go, total])

  useEffect(() => {
    const on = () => setFull(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const chapter = useMemo(() => {
    let c = null
    manifest.chapters.forEach((x) => { if (cur >= x.page) c = x })
    return c
  }, [cur])

  const label = cur === 0 ? 'Cover' : cur >= total - 1 ? 'Back cover' : cur + ' / ' + (total - 2)
  const pct = Math.round(((cur + 1) / total) * 100)

  return (
    <div className="ar-root" data-full={full || undefined}>
      <header className="ar-bar">
        <a className="ar-brand" href="https://www.uia-impact.org" aria-label="UIA">
          <UiaMark />
          <b>Annual Report 2026</b>
        </a>
        <div className="ar-right">
          <span className="ar-chap">{chapter ? chapter.en : ''}</span>
          <button type="button" className="ar-btn" onClick={() => setTocOpen((v) => !v)} aria-expanded={tocOpen}>
            Contents <small>목차</small>
          </button>
          <button type="button" className="ar-btn" onClick={toggleFull} aria-pressed={full}>
            {full ? 'Exit full screen' : 'Full screen'} <small>{full ? '전체 화면 끄기' : '전체 화면'}</small>
          </button>
        </div>
      </header>

      <main className="ar-stage" ref={stageRef}>
        <div className="ar-book" ref={bookRef} />
        {!ready && <p className="ar-loading">Loading 불러오는 중</p>}
        <button type="button" className="ar-arrow ar-arrow-l" onClick={prev} aria-label="Previous page" disabled={cur === 0}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <button type="button" className="ar-arrow ar-arrow-r" onClick={next} aria-label="Next page" disabled={cur >= total - 1}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </main>

      <footer className="ar-foot">
        <span className="ar-label">{label}</span>
        <input className="ar-range" type="range" min={0} max={total - 1} value={cur} onChange={(e) => go(Number(e.target.value))} aria-label="Go to page" style={{ '--p': pct + '%' }} />
        <span className="ar-hint">{loaded < total ? 'Images ' + loaded + ' / ' + total : 'Use the arrow keys 방향키로 넘기기'}</span>
      </footer>

      {tocOpen && (
        <div className="ar-toc" role="dialog" aria-label="Contents">
          <button type="button" className="ar-scrim" onClick={() => setTocOpen(false)} aria-label="Close contents" />
          <nav className="ar-panel">
            <h2>Contents</h2>
            <p className="ar-sub">목차</p>
            <ol>
              {manifest.chapters.map((c) => (
                <li key={c.id} data-on={chapter?.id === c.id || undefined}>
                  <button type="button" onClick={() => { go(c.page); setTocOpen(false) }}>
                    <span className="ar-t"><b>{c.en}</b><i>{c.ko}</i></span>
                    <em>{c.page}</em>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}
    </div>
  )
}
