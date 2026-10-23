<script lang="ts">
	import { onMount } from 'svelte';

	let canvas = $state<HTMLCanvasElement | null>(null);

	const COLORS = ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#ffffff', '#f78c6b', '#a78bfa'];
	const DURATION_MS = 9000;

	type Particle = {
		x: number;
		y: number;
		vx: number;
		vy: number;
		life: number;
		color: string;
		size: number;
		kind: 'spark' | 'confetti' | 'rocket';
		rot: number;
		vr: number;
		targetY?: number;
	};

	onMount(() => {
		if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const cv = canvas;
		const ctx = cv.getContext('2d');
		if (!ctx) return;

		let w = 0;
		let h = 0;
		const resize = () => {
			const dpr = window.devicePixelRatio || 1;
			w = window.innerWidth;
			h = window.innerHeight;
			cv.width = w * dpr;
			cv.height = h * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		resize();
		window.addEventListener('resize', resize);

		const rand = (a: number, b: number) => a + Math.random() * (b - a);
		const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)];
		let particles: Particle[] = [];

		function launchRocket() {
			particles.push({
				x: rand(w * 0.15, w * 0.85),
				y: h,
				vx: rand(-0.6, 0.6),
				vy: rand(-11, -8) * (h / 800 + 0.4),
				life: 1,
				color: pick(),
				size: 2.5,
				kind: 'rocket',
				rot: 0,
				vr: 0,
				targetY: rand(h * 0.15, h * 0.45)
			});
		}

		function explode(x: number, y: number, color: string) {
			for (let i = 0; i < 70; i++) {
				const a = (Math.PI * 2 * i) / 70;
				const speed = rand(1.5, 6);
				particles.push({
					x,
					y,
					vx: Math.cos(a) * speed,
					vy: Math.sin(a) * speed,
					life: 1,
					color: Math.random() < 0.3 ? '#ffffff' : color,
					size: rand(1.5, 3),
					kind: 'spark',
					rot: 0,
					vr: 0
				});
			}
		}

		function dropConfetti(count: number) {
			for (let i = 0; i < count; i++) {
				particles.push({
					x: rand(0, w),
					y: rand(-40, -5),
					vx: rand(-1.2, 1.2),
					vy: rand(1.5, 4),
					life: 1,
					color: pick(),
					size: rand(6, 11),
					kind: 'confetti',
					rot: rand(0, Math.PI * 2),
					vr: rand(-0.2, 0.2)
				});
			}
		}

		dropConfetti(150);
		for (let i = 0; i < 3; i++) setTimeout(launchRocket, i * 250);

		const start = performance.now();
		let last = start;
		let nextRocket = 0;
		let raf = 0;

		function frame(now: number) {
			const dt = Math.min((now - last) / 16.67, 3);
			last = now;
			const elapsed = now - start;
			const spawning = elapsed < DURATION_MS;

			if (spawning && elapsed > nextRocket) {
				launchRocket();
				nextRocket = elapsed + rand(250, 600);
			}
			if (spawning && Math.random() < 0.25 * dt) dropConfetti(2);

			ctx!.clearRect(0, 0, w, h);
			const next: Particle[] = [];
			for (const p of particles) {
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				if (p.kind === 'rocket') {
					if (p.y <= (p.targetY ?? 0)) {
						explode(p.x, p.y, p.color);
						continue;
					}
					ctx!.fillStyle = p.color;
					ctx!.fillRect(p.x, p.y, p.size, p.size * 3);
					next.push(p);
				} else if (p.kind === 'spark') {
					p.vy += 0.07 * dt;
					p.vx *= 0.985;
					p.life -= 0.012 * dt;
					if (p.life <= 0) continue;
					ctx!.globalAlpha = p.life;
					ctx!.fillStyle = p.color;
					ctx!.beginPath();
					ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
					ctx!.fill();
					ctx!.globalAlpha = 1;
					next.push(p);
				} else {
					p.vy = Math.min(p.vy + 0.02 * dt, 5);
					p.rot += p.vr * dt;
					p.x += Math.sin(p.rot * 2) * 0.6 * dt;
					if (p.y > h + 20) continue;
					ctx!.save();
					ctx!.translate(p.x, p.y);
					ctx!.rotate(p.rot);
					ctx!.fillStyle = p.color;
					ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
					ctx!.restore();
					next.push(p);
				}
			}
			particles = next;
			if (spawning || particles.length > 0) raf = requestAnimationFrame(frame);
		}
		raf = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="pointer-events-none fixed inset-0 z-50 h-full w-full"
	aria-hidden="true"
></canvas>
