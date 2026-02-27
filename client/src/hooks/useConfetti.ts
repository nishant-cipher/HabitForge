/**
 * Zero-dependency canvas confetti hook.
 * Particles fall from the top across the entire screen width.
 */

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    color: string
    rotation: number
    rotationSpeed: number
    opacity: number
    shape: "rect" | "circle" | "star"
    delay: number   // ms before this particle becomes active
}

const COLORS = [
    "#13ec6a", "#22c55e",
    "#f59e0b", "#fbbf24",
    "#8b5cf6", "#a78bfa",
    "#3b82f6", "#60a5fa",
    "#ec4899", "#f472b6",
    "#ef4444", "#ffffff",
]

function randomBetween(a: number, b: number) {
    return a + Math.random() * (b - a)
}

function createParticle(canvasWidth: number): Particle {
    return {
        x: randomBetween(0, canvasWidth),
        y: randomBetween(-60, -10),           // start just above the top edge
        vx: randomBetween(-2.5, 2.5),         // gentle sideways drift
        vy: randomBetween(1.5, 4.5),          // slow downward speed
        size: randomBetween(7, 16),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: randomBetween(-0.06, 0.06),
        opacity: 1,
        shape: Math.random() > 0.6 ? "rect" : "circle",
        delay: randomBetween(0, 1800),        // stagger launch over 1.8s
    }
}

export function useConfetti() {
    const confetti = () => {
        const canvas = document.createElement("canvas")
        canvas.style.cssText = [
            "position:fixed", "inset:0", "width:100%", "height:100%",
            "pointer-events:none", "z-index:99999",
        ].join(";")
        document.body.appendChild(canvas)

        const ctx = canvas.getContext("2d")!
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const PARTICLE_COUNT = 160
        const DURATION = 5500       // ms
        const GRAVITY = 0.12
        const DRAG = 0.995          // very little drag so they float

        const particles: Particle[] = Array.from(
            { length: PARTICLE_COUNT },
            () => createParticle(canvas.width)
        )

        let startTime: number | null = null
        let frame: number

        function draw(ts: number) {
            if (!startTime) startTime = ts
            const elapsed = ts - startTime

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            let anyVisible = false

            for (const p of particles) {
                if (elapsed < p.delay) continue   // not spawned yet

                p.vy += GRAVITY
                p.vx *= DRAG
                p.x += p.vx
                p.y += p.vy
                p.rotation += p.rotationSpeed

                // Fade out in the last 1.5s
                const fadeStart = DURATION - 1500
                if (elapsed > fadeStart) {
                    p.opacity = Math.max(0, 1 - (elapsed - fadeStart) / 1500)
                }

                if (p.y < canvas.height + 20) anyVisible = true

                ctx.save()
                ctx.globalAlpha = p.opacity
                ctx.translate(p.x, p.y)
                ctx.rotate(p.rotation)
                ctx.fillStyle = p.color

                if (p.shape === "circle") {
                    ctx.beginPath()
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
                    ctx.fill()
                } else {
                    // Thin ribbon / streamer
                    ctx.fillRect(-p.size / 2, -p.size / 5, p.size, p.size / 2.5)
                }
                ctx.restore()
            }

            if (elapsed < DURATION || anyVisible) {
                frame = requestAnimationFrame(draw)
            } else {
                canvas.remove()
            }
        }

        frame = requestAnimationFrame(draw)

        // Absolute safety cleanup
        setTimeout(() => {
            cancelAnimationFrame(frame)
            canvas.remove()
        }, DURATION + 500)
    }

    return { confetti }
}

