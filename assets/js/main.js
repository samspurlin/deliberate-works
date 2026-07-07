/* Deliberate Works — shared behavior */

(function () {
    'use strict';

    /* ---------- Mobile menu ---------- */
    const toggle = document.querySelector('.menu-toggle');
    const links = document.querySelector('.nav-links');

    if (toggle && links) {
        toggle.addEventListener('click', function () {
            const open = links.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.textContent = open ? 'Close' : 'Menu';
        });
        document.addEventListener('click', function (e) {
            if (!links.contains(e.target) && !toggle.contains(e.target) && links.classList.contains('open')) {
                links.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.textContent = 'Menu';
            }
        });
    }

    /* ---------- Contact / inquiry forms (Formspree) ---------- */
    document.querySelectorAll('form[data-formspree]').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const button = form.querySelector('button[type="submit"]');
            const original = button.textContent;
            button.textContent = 'Sending…';
            button.disabled = true;

            fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { Accept: 'application/json' }
            })
                .then(function (res) {
                    if (res.ok) {
                        form.innerHTML =
                            '<p class="form-success">Thanks — your note is in. I read every message myself and will reply within two business days.</p>';
                    } else {
                        throw new Error('Submit failed');
                    }
                })
                .catch(function () {
                    button.textContent = original;
                    button.disabled = false;
                    let err = form.querySelector('.form-error');
                    if (!err) {
                        err = document.createElement('p');
                        err.className = 'form-error mono-note';
                        form.appendChild(err);
                    }
                    err.textContent = 'Something went wrong. Email me directly: sam@deliberateworks.com';
                });
        });
    });

    /* ---------- Murmuration (homepage hero only) ----------
       The single signature motion moment: the swallow mark, multiplied.
       Everything else on the site is intentionally still. */
    const canvas = document.getElementById('murmuration-canvas');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (canvas && !reduceMotion) {
        const ctx = canvas.getContext('2d');
        let width, height, animationId;
        let particles = [];
        let obstacles = [];

        const config = {
            particleCount: 84,
            maxSpeed: 1.7,
            minSpeed: 0.45,
            neighborRadius: 80,
            separationRadius: 26,
            alignmentWeight: 0.05,
            cohesionWeight: 0.03,
            separationWeight: 0.08,
            wanderWeight: 0.02,
            edgeMargin: 60,
            edgeTurnForce: 0.14,
            particleSize: 3.4,
            trailLength: 10
        };

        /* New palette: ember + inks, quiet */
        const colors = [
            'rgba(188, 75, 34, 0.42)',   /* ember */
            'rgba(85, 80, 74, 0.35)',    /* ink-2 */
            'rgba(138, 131, 121, 0.32)', /* ink-3 */
            'rgba(156, 59, 22, 0.30)'    /* ember-2 */
        ];

        function updateObstacles() {
            const canvasRect = canvas.parentElement.getBoundingClientRect();
            const hero = document.querySelector('.hero');
            if (!hero) { obstacles = []; return; }
            obstacles = [];
            hero.querySelectorAll('.eyebrow, h1, .lede, .btn-row').forEach(function (el) {
                const rect = el.getBoundingClientRect();
                obstacles.push({
                    x: rect.left - canvasRect.left - 8,
                    y: rect.top - canvasRect.top - 8,
                    width: rect.width + 16,
                    height: rect.height + 16
                });
            });
        }

        function resize() {
            const rect = canvas.parentElement.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            canvas.width = width * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
        }

        function Particle() {
            this.x = width * 0.45 + Math.random() * width * 0.55;
            this.y = Math.random() * height;
            const angle = Math.PI + (Math.random() - 0.5) * 0.5;
            const speed = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed);
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.size = config.particleSize * (0.5 + Math.random());
            this.history = [];
        }

        Particle.prototype.update = function (all) {
            this.history.push({ x: this.x, y: this.y });
            if (this.history.length > config.trailLength) this.history.shift();

            let avgVx = 0, avgVy = 0, avgX = 0, avgY = 0, sepX = 0, sepY = 0;
            let neighbors = 0, separators = 0;

            for (let i = 0; i < all.length; i++) {
                const other = all[i];
                if (other === this) continue;
                const dx = other.x - this.x;
                const dy = other.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < config.neighborRadius) {
                    avgVx += other.vx; avgVy += other.vy;
                    avgX += other.x; avgY += other.y;
                    neighbors++;
                    if (dist < config.separationRadius && dist > 0) {
                        sepX -= dx / dist;
                        sepY -= dy / dist;
                        separators++;
                    }
                }
            }

            if (neighbors > 0) {
                avgVx /= neighbors; avgVy /= neighbors;
                this.vx += (avgVx - this.vx) * config.alignmentWeight;
                this.vy += (avgVy - this.vy) * config.alignmentWeight;
                avgX /= neighbors; avgY /= neighbors;
                this.vx += (avgX - this.x) * config.cohesionWeight * 0.01;
                this.vy += (avgY - this.y) * config.cohesionWeight * 0.01;
            }
            if (separators > 0) {
                this.vx += sepX * config.separationWeight;
                this.vy += sepY * config.separationWeight;
            }

            this.vx += (Math.random() - 0.5) * config.wanderWeight;
            this.vy += (Math.random() - 0.5) * config.wanderWeight;

            if (this.x < config.edgeMargin) this.vx += config.edgeTurnForce;
            else if (this.x > width - config.edgeMargin) this.vx -= config.edgeTurnForce;
            if (this.y < config.edgeMargin) this.vy += config.edgeTurnForce;
            else if (this.y > height - config.edgeMargin) this.vy -= config.edgeTurnForce;

            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 0.001;
            if (speed > config.maxSpeed) {
                this.vx = (this.vx / speed) * config.maxSpeed;
                this.vy = (this.vy / speed) * config.maxSpeed;
            } else if (speed < config.minSpeed) {
                this.vx = (this.vx / speed) * config.minSpeed;
                this.vy = (this.vy / speed) * config.minSpeed;
            }

            /* Steer around hero copy */
            for (let i = 0; i < obstacles.length; i++) {
                const obs = obstacles[i];
                const cx = Math.max(obs.x, Math.min(this.x, obs.x + obs.width));
                const cy = Math.max(obs.y, Math.min(this.y, obs.y + obs.height));
                const dx = this.x - cx;
                const dy = this.y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 5) {
                    const centerX = obs.x + obs.width / 2;
                    const centerY = obs.y + obs.height / 2;
                    const px = this.x - centerX;
                    const py = this.y - centerY;
                    const pd = Math.sqrt(px * px + py * py) || 1;
                    this.vx = (px / pd) * config.maxSpeed;
                    this.vy = (py / pd) * config.maxSpeed;
                } else if (dist < 30) {
                    const force = 0.4 * (1 - dist / 30);
                    this.vx += (dx / (dist || 1)) * force;
                    this.vy += (dy / (dist || 1)) * force;
                }
            }

            this.x += this.vx;
            this.y += this.vy;

            if (this.x < -50) this.x = width + 50;
            if (this.x > width + 50) this.x = -50;
            if (this.y < -50) this.y = height + 50;
            if (this.y > height + 50) this.y = -50;
        };

        Particle.prototype.draw = function () {
            for (let i = 0; i < this.history.length; i++) {
                const alpha = (i / this.history.length) * 0.25;
                const size = this.size * (i / this.history.length) * 0.5;
                ctx.beginPath();
                ctx.arc(this.history[i].x, this.history[i].y, size, 0, Math.PI * 2);
                ctx.fillStyle = this.color.replace(/[\d.]+\)$/, alpha + ')');
                ctx.fill();
            }

            const angle = Math.atan2(this.vy, this.vx);
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            ctx.beginPath();
            const s = this.size * 2;
            ctx.moveTo(-s, -s * 0.8);
            ctx.lineTo(s * 0.5, 0);
            ctx.lineTo(-s, s * 0.8);
            ctx.quadraticCurveTo(-s * 0.3, 0, -s, -s * 0.8);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        };

        function init() {
            resize();
            updateObstacles();
            particles = [];
            for (let i = 0; i < config.particleCount; i++) particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < particles.length; i++) particles[i].update(particles);
            for (let i = 0; i < particles.length; i++) particles[i].draw();
            animationId = requestAnimationFrame(animate);
        }

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    if (!animationId) animate();
                } else if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            });
        }, { threshold: 0.1 });

        observer.observe(canvas.parentElement);
        window.addEventListener('resize', function () { resize(); updateObstacles(); });
        init();
        animate();
    }
})();
