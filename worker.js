let particles = [];
let width = 0;
let height = 0;
let mouseX = -1000;
let mouseY = -1000;

function initParticles(w, h, count) {
    width = w;
    height = h;
    particles = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            radius: Math.random() * 2 + 1
        });
    }
}

function updateParticles() {
    // We will pack data into a Float32Array for fast transfer to main thread
    const data = new Float32Array(particles.length * 3);
    
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        
        // Move
        p.x += p.vx;
        p.y += p.vy;
        
        // Bounce off edges
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        
        // Mouse interaction (repel)
        let dx = p.x - mouseX;
        let dy = p.y - mouseY;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
            let force = (150 - dist) / 150;
            p.x += (dx / dist) * force * 2;
            p.y += (dy / dist) * force * 2;
        }
        
        data[i * 3 + 0] = p.x;
        data[i * 3 + 1] = p.y;
        data[i * 3 + 2] = p.radius;
    }
    
    // Transfer data array to main thread
    self.postMessage({ type: 'TICK_DATA', payload: data.buffer }, [data.buffer]);
}

self.onmessage = function(e) {
    const msg = e.data;
    
    if (msg.type === 'INIT') {
        initParticles(msg.width, msg.height, msg.count);
    } else if (msg.type === 'RESIZE') {
        width = msg.width;
        height = msg.height;
    } else if (msg.type === 'MOUSE') {
        mouseX = msg.mouseX;
        mouseY = msg.mouseY;
    } else if (msg.type === 'TICK') {
        updateParticles();
    }
};
