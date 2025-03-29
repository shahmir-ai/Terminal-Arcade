/**
 * Space Invaders Mini-Game for the Vibe Arcade
 * Classic Space Invaders implementation using HTML5 Canvas and vanilla JavaScript
 * 
 * Note: This file uses "SpacePlayer" instead of "Player" to avoid naming conflicts
 * with other games in the arcade.
 */

// Main game class
class SpaceInvadersGame {
    constructor(containerElement) {
        // Canvas setup
        this.containerElement = containerElement;
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;

            // Add image properties - ADD THESE LINES
    this.enemyImages = {
        'squid': null,
        'crab': null
    };
    this.imagesLoaded = false;

    // Load images - ADD THIS LINE
    this.loadImages();

        
        // Game state
        this.isRunning = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // Game entities
        this.player = null;
        this.playerBullets = [];
        this.enemies = [];
        this.enemyBombs = [];
        this.bunkers = [];
        this.ufo = null;
        this.explosions = [];

        
        // Game timing
        this.lastTime = 0;
        this.animationId = null;
        this.enemyMoveTimer = 0;
        this.enemyMoveInterval = 1000; // Move every 1 second initially
        this.enemyDirection = 1; // 1 for right, -1 for left
        this.enemyRowDescendAmount = 20; // How much enemies move down when hitting an edge
        
        // Input handling
        this.keys = {};
        this.keydownHandler = this.handleKeyDown.bind(this);
        this.keyupHandler = this.handleKeyUp.bind(this);
        this.onGameOver = null; // Callback for when game ends
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
            console.error('Container element is null or undefined');
            return;
        }
        
        // Initialize game entities
        this.initEntities();
        
        // Add keyboard event listeners
        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
        
        // Start game loop
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
        
        console.log('Space Invaders game started');
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
        }
        
        console.log('Space Invaders game stopped');
    }
    
    /**
     * Initialize game entities
     */
    initEntities() {
        // Create player
        this.player = new SpacePlayer(this.width / 2, this.height - 50);
        
        // Create enemies
        this.createEnemies();
        
        // Create bunkers
        this.createBunkers();
    }
    
/**
 * Load enemy images
 */
loadImages() {
    const squidImage = new Image();
    squidImage.src = 'assets/images/invader1.png';
    squidImage.onload = () => {
        this.enemyImages.squid = squidImage;
        this.checkImagesLoaded();
    };
    
    const crabImage = new Image();
    crabImage.src = 'assets/images/invader2.png';
    crabImage.onload = () => {
        this.enemyImages.crab = crabImage;
        this.checkImagesLoaded();
    };
}

/**
 * Check if all images are loaded
 */
checkImagesLoaded() {
    if (this.enemyImages.squid && this.enemyImages.crab) {
        this.imagesLoaded = true;
    }
}

    /**
     * Create enemy grid
     */
    createEnemies() {
        this.enemies = [];
        
        // Create 5 rows of enemies
        for (let row = 0; row < 5; row++) {
            // Create 11 enemies per row
            for (let col = 0; col < 11; col++) {
                // Determine enemy type based on row
                let type = 'squid';
                if (row >= 3) {
                    type = 'crab';
                }
                
                // Calculate position
                const x = 80 + col * 50;
                const y = 80 + row * 40;
                
                // Create enemy and add to array
                this.enemies.push(new Enemy(x, y, type));
            }
        }
    }
    
    /**
     * Create defensive bunkers
     */
    createBunkers() {
        this.bunkers = [];
        
        // Create 4 bunkers evenly spaced
        for (let i = 0; i < 4; i++) {
            const x = 150 + i * (this.width - 300) / 3;
            const y = this.height - 150;
            
            this.bunkers.push(new Bunker(x, y));
        }
    }
    
    /**
     * Handle keydown events
     */
    handleKeyDown(event) {
        this.keys[event.code] = true;
        
        // Space bar to fire
        if (event.code === 'Space' && this.isRunning) {
            this.player.fire(this.playerBullets);
            event.preventDefault();
        }
        
        // Escape to exit
        if (event.code === 'Escape' && this.isRunning) {
            if (this.onGameOver) {
                this.onGameOver(this.score);
            }
        }
        
        // Prevent default for arrow keys
        if (['ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
            event.preventDefault();
        }
    }
    
    /**
     * Handle keyup events
     */
    handleKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    /**
     * Update game state
     * @param {number} deltaTime - Time since last frame in milliseconds
     */
    update(deltaTime) {
        // Update player
        this.player.update(deltaTime, this.keys, this.width);
        
        // Update player bullets
        this.updateBullets(deltaTime);
        
        // Update enemies
        this.updateEnemies(deltaTime);
        
        // Update enemy bombs
        this.updateBombs(deltaTime);
        
         // Update explosions - ADD THIS LINE
        this.updateExplosions();

        // Check if UFO should appear
        this.updateUFO(deltaTime);
        
        // Check for game over conditions
        this.checkGameOver();
    }
    
    /**
     * Update player bullets
     */
    updateBullets(deltaTime) {
        // Move bullets
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            bullet.update(deltaTime);
            
            // Remove bullets that go off screen
            if (bullet.y < 0) {
                this.playerBullets.splice(i, 1);
                continue;
            }
            
            // Check for collisions with enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (this.checkCollision(bullet, enemy)) {
                    // Add points based on enemy type
                    this.score += enemy.type === 'squid' ? 10 : 20;
                    
                    // Remove enemy and bullet
                    this.enemies.splice(j, 1);
                    this.playerBullets.splice(i, 1);

                    // Create explosion effect - ADD THIS LINE
                    this.explosions.push(new Explosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 20));

                    
                    // Speed up enemies as they get fewer
                    this.adjustEnemySpeed();
                    
                    break;
                }
            }
            
            // Check for collision with UFO
            if (this.ufo && this.checkCollision(bullet, this.ufo)) {
                // Add bonus points
                this.score += 50;
                
                // Remove UFO and bullet
                this.ufo = null;
                this.playerBullets.splice(i, 1);
                continue;
            }
            
            // Check for collision with bunkers
            for (let j = 0; j < this.bunkers.length; j++) {
                const bunker = this.bunkers[j];
                
                if (bunker.checkBulletCollision(bullet)) {
                    // Remove bullet and damage bunker
                    this.playerBullets.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    /**
     * Update enemy movement and bombs
     */
    updateEnemies(deltaTime) {
        // Update enemy move timer
        this.enemyMoveTimer += deltaTime;
        
        // Move enemies periodically
        if (this.enemyMoveTimer >= this.enemyMoveInterval) {
            this.enemyMoveTimer = 0;
            
            let needToDescend = false;
            let reachedBottom = false;
            
            // Check if enemies reached the edges
            for (let enemy of this.enemies) {
                if ((this.enemyDirection > 0 && enemy.x + enemy.width >= this.width - 20) || 
                    (this.enemyDirection < 0 && enemy.x <= 20)) {
                    needToDescend = true;
                    break;
                }
                
                // Check if enemies reached the bottom (game over condition)
                if (enemy.y + enemy.height >= this.height - 80) {
                    reachedBottom = true;
                }
            }
            
            // Move enemies horizontally or descend
            for (let enemy of this.enemies) {
                if (needToDescend) {
                    enemy.y += this.enemyRowDescendAmount;
                } else {
                    enemy.x += this.enemyDirection * 10;
                }
            }
            
            // Reverse direction if needed
            if (needToDescend) {
                this.enemyDirection *= -1;
            }
            
            // End game if enemies reached bottom
            if (reachedBottom) {
                this.gameOver('lost');
            }
            
            // Enemies randomly drop bombs
            this.dropEnemyBombs();
        }
    }
    
    /**
     * Adjust enemy speed based on number remaining
     */
    adjustEnemySpeed() {
        // Speed up as fewer enemies remain
        const enemyPercentRemaining = this.enemies.length / 55; // 55 is starting count (5 rows × 11 columns)
        
        // Maximum interval is 1000ms (initial), minimum is 100ms (super fast)
        this.enemyMoveInterval = Math.max(100, 1000 * enemyPercentRemaining);
    }
    
    /**
     * Have enemies randomly drop bombs
     */
    dropEnemyBombs() {
        // Only the bottom enemies in each column can drop bombs
        const bottomEnemies = [];
        const columnsWithEnemies = {};
        
        // Find bottom-most enemy in each column
        for (const enemy of this.enemies) {
            const col = Math.floor(enemy.x / 50);
            
            if (!columnsWithEnemies[col] || enemy.y > columnsWithEnemies[col].y) {
                columnsWithEnemies[col] = enemy;
            }
        }
        
        // Get array of bottom enemies
        for (const col in columnsWithEnemies) {
            bottomEnemies.push(columnsWithEnemies[col]);
        }
        
        // Randomly choose if bombs will be dropped this cycle
        if (bottomEnemies.length > 0 && Math.random() < 0.3) {
            // Choose a random bottom enemy to drop a bomb
            const randomEnemy = bottomEnemies[Math.floor(Math.random() * bottomEnemies.length)];
            
            // Create and add the bomb
            this.enemyBombs.push(new Bomb(randomEnemy.x + randomEnemy.width / 2, randomEnemy.y + randomEnemy.height));
        }
    }
    
    /**
     * Update enemy bombs
     */
    updateBombs(deltaTime) {
        for (let i = this.enemyBombs.length - 1; i >= 0; i--) {
            const bomb = this.enemyBombs[i];
            bomb.update(deltaTime);
            
            // Remove bombs that go off screen
            if (bomb.y > this.height) {
                this.enemyBombs.splice(i, 1);
                continue;
            }
            
            // Check for collision with player
            if (this.checkCollision(bomb, this.player)) {
                // Player hit by bomb
                this.lives--;
                this.enemyBombs.splice(i, 1);
                
                // Create explosion effect - ADD THIS LINE
this.explosions.push(new Explosion(this.player.x + this.player.width/2, this.player.y, 30));


                // Reset player position
                this.player.reset(this.width / 2, this.height - 50);
                
                // Check for game over
                if (this.lives <= 0) {
                    this.gameOver('lost');
                }
                
                continue;
            }
            
            // Check for collision with bunkers
            for (let j = 0; j < this.bunkers.length; j++) {
                const bunker = this.bunkers[j];
                
                if (bunker.checkBombCollision(bomb)) {
                    // Remove bomb and damage bunker
                    this.enemyBombs.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    /**
     * Update UFO behavior
     */
    updateUFO(deltaTime) {
        // If no UFO, randomly create one
        if (!this.ufo && Math.random() < 0.001) { // 0.1% chance per frame
            // Start UFO on random side of screen
            const startX = Math.random() < 0.5 ? -50 : this.width + 50;
            const direction = startX < 0 ? 1 : -1;
            
            this.ufo = new UFO(startX, 40, direction);
        }
        
        // Update UFO if it exists
        if (this.ufo) {
            this.ufo.update(deltaTime);
            
            // Remove UFO if it goes off screen
            if ((this.ufo.direction > 0 && this.ufo.x > this.width + 50) || 
                (this.ufo.direction < 0 && this.ufo.x < -50)) {
                this.ufo = null;
            }
        }
    }
    /**
 * Update explosions
 */
updateExplosions() {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
        // Remove explosion if it's done
        if (!this.explosions[i].update()) {
            this.explosions.splice(i, 1);
        }
    }
}
    /**
     * Check if game is over
     */
    checkGameOver() {
        // Game over if no more enemies (win)
        if (this.enemies.length === 0) {
            this.gameOver('won');
        }
    }
    
    /**
     * Handle game over state
     */
/**
 * Handle game over state
 */
gameOver(result) {
    this.isRunning = false;
    
    // Clear any active animations
    if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
    }
    
    // Draw game over or victory screen
    if (result === 'won') {
        // Start the win animation loop
        this.drawWinScreen();
    } else {
        this.drawGameOverScreen();
    }
    
    // Call the callback after a delay
    setTimeout(() => {
        if (this.onGameOver) {
            this.onGameOver(this.score, result);
        }
    }, 2000); // Show the screen for 2 seconds
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
        
        // Give context access to game for images
        this.ctx.game = this;
        
        // Fill with black background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw player
        this.player.draw(this.ctx);
        
        // Draw player bullets
        for (const bullet of this.playerBullets) {
            bullet.draw(this.ctx);
        }
        
        // Draw enemies
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }
        
        // Draw enemy bombs
        for (const bomb of this.enemyBombs) {
            bomb.draw(this.ctx);
        }
        
        // Draw bunkers
        for (const bunker of this.bunkers) {
            bunker.draw(this.ctx);
        }
        
        // Draw UFO if it exists
        if (this.ufo) {
            this.ufo.draw(this.ctx);
        }
        
        // Draw explosions
        for (const explosion of this.explosions) {
            explosion.draw(this.ctx);
        }
        
        // Draw UI (score and lives)
        this.drawUI();
    }
    
    /**
     * Draw user interface (score and lives)
     */
    drawUI() {
        // Draw score
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px "Press Start 2P", monospace';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        
        // Draw lives
        this.ctx.fillText(`Lives: ${this.lives}`, this.width - 200, 30);
        
        // Draw player icons for lives
        for (let i = 0; i < this.lives; i++) {
            // Draw mini cannon icons for remaining lives
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillRect(this.width - 190 + (i * 30), 40, 20, 10);
        }
    }
    
    /**
     * Draw game over screen
     */
    drawGameOverScreen() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Game over text
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = '40px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 40);
        
        // Score text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px "Press Start 2P", monospace';
        this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
        this.ctx.fillText('Press ESC to exit', this.width / 2, this.height / 2 + 60);
        
        this.ctx.textAlign = 'left';
    }
    
    /**
     * Draw win screen
     */
/**
 * Draw win screen
 */
drawWinScreen() {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Victory text
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = '40px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('YOU WIN!', this.width / 2, this.height / 2 - 80);
    
    // Score text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '24px "Press Start 2P", monospace';
    this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 - 20);
    
    // Add animated dots for "returning" text
    const dots = '.'.repeat(Math.floor((performance.now() / 300) % 4));
    
    // Return to arcade message
    this.ctx.font = '18px "Press Start 2P", monospace';
    this.ctx.fillText(`Returning to arcade${dots}`, this.width / 2, this.height / 2 + 60);
    
    // Request animation to keep updating the dots
    if (this.isRunning === false) {
        requestAnimationFrame(() => this.drawWinScreen());
    }
    
    this.ctx.textAlign = 'left';
}
    
    /**
     * Simple collision detection between two objects with x, y, width, height
     */
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
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
 * SpacePlayer class (cannon)
 */
class SpacePlayer {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 20;
        this.speed = 0.5; // Pixels per millisecond
        this.color = '#00FF00';
        this.bulletCooldown = 500; // Milliseconds between shots
        this.lastShotTime = 0;
    }
    
    /**
     * Update player position based on input
     */
    update(deltaTime, keys, canvasWidth) {
        // Move left
        if (keys['ArrowLeft'] && this.x > 10) {
            this.x -= this.speed * deltaTime;
        }
        
        // Move right
        if (keys['ArrowRight'] && this.x + this.width < canvasWidth - 10) {
            this.x += this.speed * deltaTime;
        }
    }
    
    /**
     * Fire a bullet if cooldown has elapsed
     */
    fire(bullets) {
        const now = performance.now();
        
        // Check cooldown
        if (now - this.lastShotTime >= this.bulletCooldown) {
            // Create bullet at center-top of player
            const bulletX = this.x + this.width / 2 - 2;
            const bulletY = this.y - 10;
            
            bullets.push(new Bullet(bulletX, bulletY));
            this.lastShotTime = now;
        }
    }
    
    /**
     * Draw the player
     */
    draw(ctx) {
        ctx.fillStyle = this.color;
        
        // Draw cannon base (rectangle)
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw cannon barrel (smaller rectangle on top)
        ctx.fillRect(this.x + this.width / 2 - 3, this.y - 10, 6, 10);
    }
    
    /**
     * Reset player position
     */
    reset(x, y) {
        this.x = x;
        this.y = y;
    }
}

/**
 * Bullet class
 */
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = 0.7; // Pixels per millisecond
        this.color = '#00FF00';
    }
    
    /**
     * Update bullet position
     */
    update(deltaTime) {
        this.y -= this.speed * deltaTime;
    }
    
    /**
     * Draw the bullet
     */
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

/**
 * Enemy bomb class
 */
class Bomb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = 0.4; // Pixels per millisecond
        this.color = '#FFFFFF';
    }
    
    /**
     * Update bomb position
     */
    update(deltaTime) {
        this.y += this.speed * deltaTime;
    }
    
    /**
     * Draw the bomb
     */
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add zigzag tail to distinguish from bullets
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x - 3, this.y - 5);
        ctx.lineTo(this.x + this.width + 3, this.y - 10);
        ctx.strokeStyle = this.color;
        ctx.stroke();
    }
}

/**
 * Enemy class
 */
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'squid' or 'crab'
        this.width = 30;
        this.height = 30;
        this.color = this.type === 'squid' ? '#FFFFFF' : '#FF0000';
        this.animationFrame = 0;
        this.animationTimer = 0;
    }
    
    /**
    /**
 * Draw the enemy
 */
draw(ctx) {
    // Use image if available, otherwise fallback to drawn shapes
    if (ctx.game && ctx.game.imagesLoaded && ctx.game.enemyImages[this.type]) {
        ctx.drawImage(
            ctx.game.enemyImages[this.type],
            this.x,
            this.y,
            this.width,
            this.height
        );
    } else {
        // Fallback to original drawing code
        ctx.fillStyle = this.color;
        
        if (this.type === 'squid') {
            this.drawSquid(ctx);
        } else {
            this.drawCrab(ctx);
        }
    }
}
    
    /**
     * Draw squid-type enemy
     */
    drawSquid(ctx) {
        // Draw main body
        ctx.fillRect(this.x + 10, this.y, 10, 20);
        
        // Draw tentacles
        ctx.fillRect(this.x, this.y + 10, 10, 10);
        ctx.fillRect(this.x + 20, this.y + 10, 10, 10);
        
        // Draw eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 12, this.y + 5, 3, 3);
        ctx.fillRect(this.x + 18, this.y + 5, 3, 3);
    }
    
    /**
     * Draw crab-type enemy
     */
    drawCrab(ctx) {
        // Draw main body
        ctx.fillRect(this.x + 5, this.y + 5, 20, 15);
        
        // Draw claws
        ctx.fillRect(this.x, this.y + 10, 5, 10);
        ctx.fillRect(this.x + 25, this.y + 10, 5, 10);
        
        // Draw eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 8, this.y + 8, 4, 4);
        ctx.fillRect(this.x + 18, this.y + 8, 4, 4);
    }
}

/**
 * UFO class for bonus points
 */
class UFO {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 20;
        this.speed = 0.2; // Pixels per millisecond
        this.direction = direction; // 1 for right, -1 for left
        this.color = '#FF00FF'; // Purple
    }
    
    /**
     * Update UFO position
     */
    update(deltaTime) {
        this.x += this.direction * this.speed * deltaTime;
    }
    
    /**
     * Draw the UFO
     */
    draw(ctx) {
        ctx.fillStyle = this.color;
        
        // Draw UFO saucer shape
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + 10, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw cockpit
        ctx.fillStyle = '#77FFFF';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + 5, this.width / 4, this.height / 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Bunker class for defensive structures
 */
class Bunker {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 40;
        this.color = '#808080';
        this.health = 4; // Bunker can take 4 hits before completely destroyed
        
        // Define bunker shape as a grid of blocks
        this.blocks = [];
        this.initBlocks();
    }
    
    /**
     * Initialize blocks that form the bunker
     */
   /**
 * Initialize blocks that form the bunker
 */
initBlocks() {
    const blockSize = 10;
    
    // Create bunker shape (fortress with cutout)
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 6; col++) {
            // Skip center bottom blocks to create entrance
            if (row === 3 && (col === 2 || col === 3)) {
                continue;
            }
            
            // Create a new block
            const block = {
                x: this.x + col * blockSize,
                y: this.y + row * blockSize,
                width: blockSize,
                height: blockSize,
                isAlive: true
            };
            
            this.blocks.push(block);
        }
    }
}
    
    /**
     * Check collision with player bullet
     */
    checkBulletCollision(bullet) {
        // Only check live blocks
        for (let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i];
            
            if (block.isAlive && this.checkBlockCollision(bullet, block)) {
                // Destroy this block
                block.isAlive = false;
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check collision with enemy bomb
     */
    checkBombCollision(bomb) {
        // Only check live blocks
        for (let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i];
            
            if (block.isAlive && this.checkBlockCollision(bomb, block)) {
                // Destroy this block
                block.isAlive = false;
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check collision between projectile and block
     */
    checkBlockCollision(projectile, block) {
        return projectile.x < block.x + block.width &&
               projectile.x + projectile.width > block.x &&
               projectile.y < block.y + block.height &&
               projectile.y + projectile.height > block.y;
    }
    
    /**
     * Draw the bunker
     */
    draw(ctx) {
        ctx.fillStyle = this.color;
        
        // Draw only live blocks
        for (const block of this.blocks) {
            if (block.isAlive) {
                ctx.fillRect(block.x, block.y, block.width, block.height);
            }
        }
    }
}
/**
 * Explosion class for visual effects
 */
class Explosion {
    constructor(x, y, size = 30) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.life = 1.0; // 100% life to start
        this.decreaseRate = 0.05; // How quickly it fades out
    }
    
    /**
     * Update explosion state
     */
    update() {
        this.life -= this.decreaseRate;
        return this.life > 0;
    }
    
    /**
     * Draw the explosion
     */
    draw(ctx) {
        // Only draw if still alive
        if (this.life <= 0) return;
        
        const alpha = this.life;
        ctx.globalAlpha = alpha;
        
        // Draw colored particles radiating outward
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.size * (1 - this.life);
            const x = this.x + Math.cos(angle) * distance;
            const y = this.y + Math.sin(angle) * distance;
            
            // Choose color based on size (enemies vs player)
            ctx.fillStyle = this.size > 20 ? '#00FF00' : '#FFFF00';
            
            // Draw particle
            const particleSize = Math.max(1, 4 * this.life);
            ctx.fillRect(x - particleSize/2, y - particleSize/2, particleSize, particleSize);
        }
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
    }
}

/**
 * Integration with ArcadeApp
 * Call this function from the launchMiniGame method
 * @param {HTMLElement} containerElement - The DOM element to insert the game into
 * @param {Function} onGameOverCallback - Callback when game ends
 * @returns {SpaceInvadersGame} - Instance of the game
 */
function startSpaceInvadersGame(containerElement, onGameOverCallback, canvasWidth = 800, canvasHeight = 600) {
    console.log('Starting Space Invaders game with container:', containerElement);
    const game = new SpaceInvadersGame(containerElement);
    game.canvasWidth = canvasWidth;
    game.canvasHeight = canvasHeight;
    game.start(onGameOverCallback);
    return game;
}

// Export the start function
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { startSpaceInvadersGame };
} else {
    // If not using modules, add to window
    window.startSpaceInvadersGame = startSpaceInvadersGame;
}