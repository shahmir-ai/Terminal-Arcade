/**
 * Asteroids Mini-Game for the Vibe Arcade
 * A classic Asteroids implementation using HTML5 Canvas and vanilla JavaScript
 */

// Main game class
class AsteroidsGame {
    constructor(containerElement) {
        // Canvas setup
        this.containerElement = containerElement;
        this.canvas = null;
        this.ctx = null;
        this.width = 600;
        this.height = 600;
        
        // Game state
        this.isRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        
        // Game entities
        this.ship = null;
        this.asteroids = [];
        this.bullets = [];
        this.particles = []; // For explosions/effects
        
        // Game timing
        this.lastTime = 0;
        this.animationId = null;
        
        // Input handling
        this.keys = {}; // Track pressed keys
        this.keydownHandler = this.handleKeyDown.bind(this);
        this.keyupHandler = this.handleKeyUp.bind(this);

        
        
        // Callback for game over
        this.onGameOver = null;
    }
    


    /**
     * Initialize and start the game
     * @param {Function} onGameOverCallback - Function to call when game ends
     */
    start(onGameOverCallback) {
        this.onGameOver = onGameOverCallback;
        
        // Create canvas element with the requested dimensions
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvasWidth || this.width;
        this.canvas.height = this.canvasHeight || this.height;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        this.canvas.style.backgroundColor = '#000000';
        this.canvas.style.border = '2px solid #FFFFFF';
        
        // Get canvas context
        this.ctx = this.canvas.getContext('2d');
        
        // Apply scaling
        const scaleX = this.canvasWidth / this.width;
        const scaleY = this.canvasHeight / this.height;
        this.ctx.scale(scaleX, scaleY);
        
        // Add canvas to container
        if (this.containerElement) {
            this.containerElement.appendChild(this.canvas);
        } else {
            document.body.appendChild(this.canvas);
        }
        
        // Initialize game entities
        this.initGame();
        
        // Add keyboard event listeners
        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
        
        // Start game loop
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
        
        console.log('Asteroids game started');
    }
    
    

    /**
     * Clean up resources when game ends
     */
    stop() {
        this.isRunning = false;
        
        // Cancel animation frame
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Remove event listeners
        window.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('keyup', this.keyupHandler);
        
        // Remove canvas from container
        if (this.canvas && this.containerElement && this.containerElement.contains(this.canvas)) {
            this.containerElement.removeChild(this.canvas);
        } else if (this.canvas && document.body.contains(this.canvas)) {
            document.body.removeChild(this.canvas);
        }
        
        console.log('Asteroids game stopped');
    }
    
    /**
     * Initialize game state and entities
     */
    initGame() {
        // Reset game state
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.gameOver = false;
        
        // Create player ship at center of screen
        this.ship = new Ship(this.width / 2, this.height / 2);
        
        // Clear existing arrays
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        
        // Create initial asteroids based on level
        this.createAsteroids();
    }
    
    /**
     * Create asteroids based on current level
     */
    createAsteroids() {
        const numAsteroids = 2 + this.level; // Increase asteroids with level
        
        for (let i = 0; i < numAsteroids; i++) {
            // Place asteroids away from the player ship
            let x, y;
            do {
                x = Math.random() * this.width;
                y = Math.random() * this.height;
            } while (this.distanceBetween(x, y, this.ship.x, this.ship.y) < 150);
            
            // Create a large asteroid
            this.asteroids.push(new Asteroid(x, y, 'large'));
        }
    }
    
    /**
     * Calculate distance between two points
     */
    distanceBetween(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }
    
    /**
     * Handle keydown events
     */
    handleKeyDown(event) {
        // Only process inputs when game is running
        if (!this.isRunning) return;
        
        // Store key state
        this.keys[event.code] = true;
        
        // Spacebar to fire
        if (event.code === 'Space' && !this.gameOver) {
            this.ship.fireBullet(this.bullets);
            event.preventDefault();
        }
        
        // R key to restart after game over
        if (event.code === 'KeyR' && this.gameOver) {
            this.initGame();
            event.preventDefault();
        }
        
        // Escape key to exit the game
        if (event.code === 'Escape') {
            if (this.onGameOver) {
                this.onGameOver(this.score);
            }
            event.preventDefault();
        }
        
        // Prevent default for arrow keys and space
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
            event.preventDefault();
        }
    }
    
    /**
     * Handle keyup events
     */
    handleKeyUp(event) {
        // Clear key state
        this.keys[event.code] = false;
    }
    
    /**
     * Update game state
     * @param {number} deltaTime - Time since last frame in milliseconds
     */
    update(deltaTime) {
        // Don't update if game is over
        if (this.gameOver) return;
        
        // Update ship based on key inputs
        this.updateShip(deltaTime);
        
        // Update bullets
        this.updateBullets(deltaTime);
        
        // Update asteroids
        this.updateAsteroids(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Check for collisions
        this.checkCollisions();
        
        // Check if level is complete (all asteroids destroyed)
        if (this.asteroids.length === 0) {
            this.levelUp();
        }
    }
    
    /**
     * Update ship position and rotation
     */
    updateShip(deltaTime) {
        if (!this.ship.isExploding) {
            // Rotate ship with left/right arrow keys
            if (this.keys['ArrowLeft']) {
                this.ship.rotate(-0.1);
            }
            if (this.keys['ArrowRight']) {
                this.ship.rotate(0.1);
            }
            
            // Apply thrust with up arrow key
            if (this.keys['ArrowUp']) {
                this.ship.thrust(deltaTime);
                
                // Create thruster particles
                if (Math.random() < 0.3) {
                    this.createThrusterParticle();
                }
            } else {
                this.ship.thrusterOn = false;
            }
            
            // Update ship position
            this.ship.update(deltaTime, this.width, this.height);
        } else {
            // Update explosion if ship is exploding
            this.ship.updateExplosion(deltaTime);
            
            // Respawn ship after explosion if there are lives left
            if (this.ship.explosionTime > 2000) { // 2 seconds
                if (this.lives > 0) {
                    this.respawnShip();
                } else {
                    this.gameOver = true;
                    this.handleGameOver();
                }
            }
        }
    }
    
    /**
     * Update all bullets
     */
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(deltaTime, this.width, this.height);
            
            // Remove bullets that have lived too long
            if (bullet.lifetime > bullet.maxLifetime) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    /**
     * Update all asteroids
     */
    updateAsteroids(deltaTime) {
        for (const asteroid of this.asteroids) {
            asteroid.update(deltaTime, this.width, this.height);
        }
    }
    
    /**
     * Update all particles
     */
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            // Remove particles that have faded out
            if (particle.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * Check for collisions between game entities
     */
    checkCollisions() {
        // Check bullet-asteroid collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                const asteroid = this.asteroids[j];
                
                // Check if bullet hits asteroid
                if (this.distanceBetween(bullet.x, bullet.y, asteroid.x, asteroid.y) < asteroid.radius) {
                    // Remove the bullet
                    this.bullets.splice(i, 1);
                    
                    // Split the asteroid
                    this.splitAsteroid(asteroid, j);
                    
                    // No need to check other asteroids for this bullet
                    break;
                }
            }
        }
        
        // Check ship-asteroid collisions (only if ship isn't already exploding)
        if (!this.ship.isExploding) {
            for (const asteroid of this.asteroids) {
                if (this.distanceBetween(this.ship.x, this.ship.y, asteroid.x, asteroid.y) < this.ship.radius + asteroid.radius) {
                    this.shipHit();
                    break;
                }
            }
        }
    }
    
    /**
     * Handle ship being hit by asteroid
     */
    shipHit() {
        // Start ship explosion animation
        this.ship.explode();
        
        // Create explosion particles
        this.createShipExplosion();
        
        // Decrement lives
        this.lives--;
        
        console.log('Ship hit! Lives remaining:', this.lives);
    }
    
    /**
     * Respawn the ship after destruction
     */
    respawnShip() {
        // Respawn in center
        this.ship = new Ship(this.width / 2, this.height / 2);
        
        // Add temporary invulnerability period (could be implemented here)
    }
    
    /**
     * Create explosion particles when ship is destroyed
     */
    createShipExplosion() {
        // Create a burst of particles at ship's location
        for (let i = 0; i < 20; i++) {
            const speed = 0.1 + Math.random() * 0.2;
            const angle = Math.random() * Math.PI * 2;
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            
            this.particles.push(new Particle(
                this.ship.x,
                this.ship.y,
                velocity,
                '#FFFFFF',
                1000 + Math.random() * 1000
            ));
        }
    }
    
    /**
     * Create thruster particles behind ship
     */
    createThrusterParticle() {
        // Only create particles if thruster is on
        if (!this.keys['ArrowUp']) return;
        
        // Calculate position behind ship
        const angle = this.ship.angle + Math.PI; // Opposite direction
        const distance = this.ship.radius;
        const x = this.ship.x + Math.cos(angle) * distance;
        const y = this.ship.y + Math.sin(angle) * distance;
        
        // Create particle with randomness
        const speed = 0.05 + Math.random() * 0.05;
        const spreadAngle = angle + (Math.random() * 0.5 - 0.25); // Add some spread
        const velocity = {
            x: Math.cos(spreadAngle) * speed,
            y: Math.sin(spreadAngle) * speed
        };
        
        // Thruster colors (yellow/orange)
        const colors = ['#FFFF00', '#FFA500', '#FF4500'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        this.particles.push(new Particle(x, y, velocity, color, 300 + Math.random() * 200));
    }
    
    /**
     * Split an asteroid when hit by bullet
     */
    splitAsteroid(asteroid, index) {
        // Remove the hit asteroid
        this.asteroids.splice(index, 1);
        
        // Create explosion particles
        this.createAsteroidExplosion(asteroid);
        
        // Add score based on asteroid size
        switch (asteroid.size) {
            case 'large':
                this.score += 20;
                break;
            case 'medium':
                this.score += 50;
                break;
            case 'small':
                this.score += 100;
                break;
        }
        
        // Split into smaller asteroids if not already the smallest size
        if (asteroid.size !== 'small') {
            const newSize = asteroid.size === 'large' ? 'medium' : 'small';
            
            // Create two smaller asteroids
            for (let i = 0; i < 2; i++) {
                // Give the new asteroids some velocity variance
                const speed = asteroid.speed * 1.3; // Slightly faster
                const angle = Math.random() * Math.PI * 2;
                const velocityX = Math.cos(angle) * speed;
                const velocityY = Math.sin(angle) * speed;
                
                this.asteroids.push(new Asteroid(
                    asteroid.x,
                    asteroid.y,
                    newSize,
                    velocityX,
                    velocityY
                ));
            }
        }
    }
    
    /**
     * Create particles for asteroid explosion
     */
    createAsteroidExplosion(asteroid) {
        // Number of particles based on asteroid size
        let numParticles;
        let particleLifetime;
        
        switch (asteroid.size) {
            case 'large':
                numParticles = 15;
                particleLifetime = 800;
                break;
            case 'medium':
                numParticles = 10;
                particleLifetime = 600;
                break;
            case 'small':
                numParticles = 5;
                particleLifetime = 400;
                break;
        }
        
        // Create particles
        for (let i = 0; i < numParticles; i++) {
            const speed = 0.05 + Math.random() * 0.1;
            const angle = Math.random() * Math.PI * 2;
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            
            // Gray/white colors for asteroid debris
            const colors = ['#FFFFFF', '#CCCCCC', '#AAAAAA'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.particles.push(new Particle(
                asteroid.x,
                asteroid.y,
                velocity,
                color,
                particleLifetime + Math.random() * 200
            ));
        }
    }
    
    /**
     * Progress to the next level
     */
    levelUp() {
        this.level++;
        console.log('Level up:', this.level);
        
        // Create new asteroids for the next level
        this.createAsteroids();
    }
    
    /**
    /**
 * Handle game over
 */
handleGameOver() {
    console.log('Game over! Final score:', this.score);
    
    // Call callback after longer delay (5 seconds instead of 2)
    setTimeout(() => {
        if (this.onGameOver) {
            this.onGameOver(this.score, 'lost');
        }
    }, 5000); // Increased from 2000 to 5000 ms
}
    
    /**
     * Draw all game elements
     */
    draw() {
        if (!this.ctx) {
            console.error('Canvas context is null');
            return;
        }
        
        // Clear canvas with proper transformation reset
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        // Fill with black background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stars in the background
        this.drawStars();
        
        // Draw particles (behind other entities)
        this.drawParticles();
        
        // Draw ship
        if (this.ship) {
            this.ship.draw(this.ctx);
        }
        
        // Draw bullets
        for (const bullet of this.bullets) {
            bullet.draw(this.ctx);
        }
        
        // Draw asteroids
        for (const asteroid of this.asteroids) {
            asteroid.draw(this.ctx);
        }
        
        // Draw UI (score, level, lives)
        this.drawUI();
        
        // Draw game over screen if game is over
        if (this.gameOver) {
            this.drawGameOverScreen();
        }
    }
    
    /**
     * Draw stars in the background
     */
    drawStars() {
        // Use a deterministic approach for stars so they don't flicker
        const numStars = 100;
        this.ctx.fillStyle = '#FFFFFF';
        
        // Set a seed for consistent randomness
        const seed = this.level * 1000;
        
        for (let i = 0; i < numStars; i++) {
            // Use a deterministic "random" based on i and seed
            const x = ((i * 17 + seed) % this.width);
            const y = ((i * 23 + seed) % this.height);
            const size = ((i * 7 + seed) % 3) + 1;
            
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    /**
     * Draw all particles
     */
    drawParticles() {
        for (const particle of this.particles) {
            particle.draw(this.ctx);
        }
    }
    
    /**
 * Draw user interface (score, level, lives)
 */
drawUI() {
    // Draw score (keep at top left)
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '20px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.score}`, 20, 30);
    
    // Draw level (move to top right)
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Level: ${this.level}`, this.width - 20, 30);
    
    // Draw lives (move to bottom right)
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Lives: ${this.lives}`, this.width - 20, this.height - 20);
}
    
   /**
 * Draw game over screen
 */
drawGameOverScreen() {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Game over text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '36px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 40);
    
    // Final score - made larger and more prominent
    this.ctx.font = '28px "Press Start 2P", monospace';
    this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 30);
    
    // Simple closing message
    this.ctx.font = '18px "Press Start 2P", monospace';
    this.ctx.fillText('Returning to arcade...', this.width / 2, this.height / 2 + 80);
}
    
    /**
     * Main game loop
     */
    gameLoop(timestamp) {
        if (!this.isRunning) return;
        
        // Calculate time since last frame
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Update game state
        this.update(deltaTime);
        
        // Draw the game
        this.draw();
        
        // Schedule next frame
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
}

/**
 * Ship class - represents the player's spaceship
 */
class Ship {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = -Math.PI / 2; // Start facing upward
        this.radius = 15; // Collision radius
        this.velocity = { x: 0, y: 0 };
        this.rotationSpeed = 0.1;
        this.thrustPower = 0.0004;
        this.friction = 0.99; // Slows the ship down over time
        this.thrusterOn = false;
        this.shootCooldown = 0;
        this.shootDelay = 250; // Minimum time between shots in ms
        
        // For explosion animation
        this.isExploding = false;
        this.explosionTime = 0;
    }
    
    /**
     * Rotate the ship
     * @param {number} angle - Amount to rotate in radians
     */
    rotate(angle) {
        this.angle += angle;
    }
    
    /**
     * Apply thrust in the direction the ship is facing
     */
    thrust(deltaTime) {
        // Calculate thrust vector based on ship angle
        const thrustX = Math.cos(this.angle) * this.thrustPower * deltaTime;
        const thrustY = Math.sin(this.angle) * this.thrustPower * deltaTime;
        
        // Apply thrust to velocity
        this.velocity.x += thrustX;
        this.velocity.y += thrustY;
        
        // Set thruster visual flag
        this.thrusterOn = true;
    }
    
    /**
     * Update ship position
     */
    update(deltaTime, canvasWidth, canvasHeight) {
        // Update position based on velocity
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        
        // Apply friction to slow down
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        
        // Handle wrapping around the screen edges
        this.wrapAroundScreen(canvasWidth, canvasHeight);
        
        // Update shoot cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
    }
    
    /**
     * Wrap the ship around when it goes off-screen
     */
    wrapAroundScreen(canvasWidth, canvasHeight) {
        // Wrap horizontally
        if (this.x < 0) {
            this.x = canvasWidth;
        } else if (this.x > canvasWidth) {
            this.x = 0;
        }
        
        // Wrap vertically
        if (this.y < 0) {
            this.y = canvasHeight;
        } else if (this.y > canvasHeight) {
            this.y = 0;
        }
    }
    
    /**
     * Fire a bullet from the ship
     */
    fireBullet(bullets) {
        // Check if cooldown has elapsed
        if (this.shootCooldown <= 0) {
            // Reset cooldown
            this.shootCooldown = this.shootDelay;
            
            // Calculate bullet's starting position (at ship's nose)
            const bulletSpeed = 0.5; // Pixels per millisecond
            const bulletX = this.x + Math.cos(this.angle) * this.radius;
            const bulletY = this.y + Math.sin(this.angle) * this.radius;
            
            // Create a new bullet moving in the direction the ship is facing
            bullets.push(new AsteroidsBullet(
                bulletX,
                bulletY,
                this.angle,
                bulletSpeed
            ));
        }
    }
    
    /**
     * Start explosion animation when ship is destroyed
     */
    explode() {
        this.isExploding = true;
        this.explosionTime = 0;
    }
    
    /**
     * Update explosion animation
     */
    updateExplosion(deltaTime) {
        if (this.isExploding) {
            this.explosionTime += deltaTime;
        }
    }
    
    /**
     * Draw the ship
     */
    draw(ctx) {
        // Don't draw if exploding
        if (this.isExploding) return;
        
        ctx.save();
        
        // Move to ship's position
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw the ship as a triangle
        ctx.beginPath();
        ctx.moveTo(this.radius, 0); // Nose
        ctx.lineTo(-this.radius, -this.radius / 2); // Bottom-right
        ctx.lineTo(-this.radius / 2, 0); // Back-middle
        ctx.lineTo(-this.radius, this.radius / 2); // Bottom-left
        ctx.closePath();
        
        // Fill ship with white color
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        
        // Draw thruster flame if engine is on
        if (this.thrusterOn) {
            ctx.beginPath();
            ctx.moveTo(-this.radius / 2, 0); // Back middle
            ctx.lineTo(-this.radius - 5, -this.radius / 4); // Extended flame left
            ctx.lineTo(-this.radius - 10, 0); // Flame tip
            ctx.lineTo(-this.radius - 5, this.radius / 4); // Extended flame right
            ctx.closePath();
            
            // Flame color (orange/yellow)
            ctx.fillStyle = '#FFA500';
            ctx.fill();
        }
        
        ctx.restore();
    }
}

/**
 * Bullet class - projectiles fired by the player
 */
class AsteroidsBullet {
    constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.radius = 2;
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        this.lifetime = 0;
        this.maxLifetime = 1500; // 1.5 seconds in milliseconds
    }
    
    /**
     * Update bullet position
     */
    update(deltaTime, canvasWidth, canvasHeight) {
        // Update position
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        
        // Wrap around screen edges
        this.wrapAroundScreen(canvasWidth, canvasHeight);
        
        // Update lifetime
        this.lifetime += deltaTime;
    }
    
    /**
     * Wrap the bullet around when it goes off-screen
     */
    wrapAroundScreen(canvasWidth, canvasHeight) {
        // Wrap horizontally
        if (this.x < 0) {
            this.x = canvasWidth;
        } else if (this.x > canvasWidth) {
            this.x = 0;
        }
        
        // Wrap vertically
        if (this.y < 0) {
            this.y = canvasHeight;
        } else if (this.y > canvasHeight) {
            this.y = 0;
        }
    }
    
    /**
     * Draw the bullet
     */
    draw(ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Asteroid class - obstacles that the player must avoid and destroy
 */
class Asteroid {
    constructor(x, y, size, velocityX, velocityY) {
        this.x = x;
        this.y = y;
        this.size = size || 'large';
        
        // Set radius based on size
        switch (this.size) {
            case 'large':
                this.radius = 40;
                break;
            case 'medium':
                this.radius = 20;
                break;
            case 'small':
                this.radius = 10;
                break;
            default:
                this.radius = 40;
                break;
        }
        
        // Set random velocity if not provided
        this.speed = 0.05 + Math.random() * 0.05;
        const angle = Math.random() * Math.PI * 2;
        this.velocity = {
            x: velocityX !== undefined ? velocityX : Math.cos(angle) * this.speed,
            y: velocityY !== undefined ? velocityY : Math.sin(angle) * this.speed
        };
        
        // Create polygon shape with some randomness
        this.vertices = this.generateShape();
        
        // Add rotation
        this.rotationSpeed = (Math.random() - 0.5) * 0.001;
        this.rotation = 0;
    }
    
    /**
     * Generate random polygon shape for asteroid
     */
    generateShape() {
        const numVertices = 10;
        const vertices = [];
        
        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const radiusVariation = this.radius * (0.8 + Math.random() * 0.4);
            
            vertices.push({
                x: Math.cos(angle) * radiusVariation,
                y: Math.sin(angle) * radiusVariation
            });
        }
        
        return vertices;
    }
    
    /**
     * Update asteroid position
     */
    update(deltaTime, canvasWidth, canvasHeight) {
        // Update position
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        
        // Update rotation
        this.rotation += this.rotationSpeed * deltaTime;
        
        // Wrap around screen edges
        this.wrapAroundScreen(canvasWidth, canvasHeight);
    }
    
    /**
     * Wrap the asteroid around when it goes off-screen
     */
    wrapAroundScreen(canvasWidth, canvasHeight) {
        // Wrap horizontally
        if (this.x < -this.radius) {
            this.x = canvasWidth + this.radius;
        } else if (this.x > canvasWidth + this.radius) {
            this.x = -this.radius;
        }
        
        // Wrap vertically
        if (this.y < -this.radius) {
            this.y = canvasHeight + this.radius;
        } else if (this.y > canvasHeight + this.radius) {
            this.y = -this.radius;
        }
    }
    
    /**
     * Draw the asteroid
     */
    draw(ctx) {
        ctx.save();
        
        // Move to asteroid's position and apply rotation
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw the asteroid shape
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        
        ctx.closePath();
        
        // Stroke with white color
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.restore();
    }
}

/**
 * Particle class - for visual effects like explosions
 */
class Particle {
    constructor(x, y, velocity, color, lifetime) {
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.color = color || '#FFFFFF';
        this.alpha = 1.0; // Starting opacity
        this.lifetime = lifetime || 1000; // Default 1 second
        this.maxLifetime = lifetime || 1000;
        this.fadeRate = 1 / this.lifetime; // Calculate fade rate based on lifetime
    }
    
    /**
     * Update particle position and opacity
     */
    update(deltaTime) {
        // Update position
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        
        // Update opacity
        this.alpha -= this.fadeRate * deltaTime;
        
        // Ensure alpha doesn't go below 0
        if (this.alpha < 0) {
            this.alpha = 0;
        }
    }
    
    /**
     * Draw the particle
     */
    draw(ctx) {
        // Set color with alpha
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        
        // Draw as a small rectangle
        ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
    }
}

/**
 * Integration with ArcadeApp
 * Call this function from the launchMiniGame method
 * @param {HTMLElement} containerElement - The DOM element to insert the game into
 * @param {Function} onGameOverCallback - Callback when game ends
 * @returns {AsteroidsGame} - Instance of the game
 */
function startAsteroidsGame(containerElement, onGameOverCallback, canvasWidth = 600, canvasHeight = 600) {
    console.log('Starting Asteroids game with container:', containerElement);
    const game = new AsteroidsGame(containerElement);
    game.canvasWidth = canvasWidth;
    game.canvasHeight = canvasHeight;
    game.start(onGameOverCallback);
    return game;
}

// Export the start function
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { startAsteroidsGame };
} else {
    // If not using modules, add to window
    window.startAsteroidsGame = startAsteroidsGame;
}