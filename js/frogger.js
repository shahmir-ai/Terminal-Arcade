/**
 * Frogger-style mini-game for the Vibe Arcade
 * Vanilla JS implementation using HTML5 Canvas
 */

// Main game class
class FroggerGame {

    handleVisibilityChange() {
        if (document.hidden) {
            // Tab is hidden, pause the game
            this.isPaused = true;
        } else {
            // Tab is visible again, resume the game
            this.isPaused = false;
            // Reset time tracking to avoid large time jumps
            this.lastTime = performance.now();
            // Reset vehicle positions
            this.resetAllVehicles();
        }
    }
    resetAllVehicles() {
        // Reset all vehicles
        this.vehicles.forEach(vehicle => {
            // Optional: spread them out again based on initial positions
            vehicle.x = vehicle.initialX + (Math.random() * 100 - 50);
        });
        
        // Reset all platforms
        this.platforms.forEach(platform => {
            platform.x = platform.initialX + (Math.random() * 100 - 50);
            platform.reset();
        });
    }    
    constructor(containerElement, width = 600, height = 800) {
        // Canvas setup
        this.containerElement = containerElement;
        this.canvas = null;
        this.ctx = null;
        this.width = width;
        this.height = height;
        
        // Calculate grid size proportionally based on width
        // This is the key to scaling everything properly
        this.gridSize = Math.floor(width / 15);
        
        // Game state
        this.isRunning = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
    
        this.isPaused = false;
        this.visibilityHandler = this.handleVisibilityChange.bind(this);
    
        this.topPadding = this.gridSize * 2; // Scale padding based on grid size

this.gridSize = 40; // Size of one grid cell (1 hop)
this.topPadding = this.gridSize * 2; // 2 grid units of padding at the top


        
        // Entities
        this.player = null;
        this.vehicles = [];
        this.platforms = [];
        this.serverRacks = []; // Home/goal zones
        
        // Game loop variables
        this.lastTime = 0;
        this.animationId = null;
        
        // Event handling
        this.keydownHandler = this.handleKeyDown.bind(this);
        this.onGameOver = null; // Callback for game over
        
        // Colors
        this.colors = {
            background: '#121212',
            road: '#333333',
            water: '#1A3567',
            safeZone: '#222222',
            lanes: '#FFFFFF',
            playerBody: '#33CC33',
            playerEyes: '#FFFFFF',
            redCar: '#E74C3C',
            blueDrone: '#3498DB',
            orangeTruck: '#E67E22',
            brownChip: '#8B4513',
            greenGPU: '#27AE60',
            serverRack: '#7F8C8D',
            serverRackActive: '#2ECC71',
            text: '#FFFFFF',
            gameOver: '#FF0000'
        };

        
    }
    
    start(onGameOverCallback) {
        this.onGameOver = onGameOverCallback;
        
        // Create canvas element with the requested dimensions
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvasWidth || this.width;
        this.canvas.height = this.canvasHeight || this.height;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        this.canvas.style.backgroundColor = this.colors.background;
        this.canvas.style.border = '2px solid #00ff00';
        this.ctx = this.canvas.getContext('2d');
        
        // Calculate and apply the scaling factor
        const scaleX = this.canvasWidth / this.width;
        const scaleY = this.canvasHeight / this.height;
        this.ctx.scale(scaleX, scaleY);
        
        // Add canvas to container
        this.containerElement.appendChild(this.canvas);
    
        
        // Create player
        const playerX = Math.floor(this.width / 2 / this.gridSize) * this.gridSize;
        const playerY = this.height - this.gridSize * 2;
        this.player = new Player(playerX, playerY, this.gridSize);
        
        // Create game entities
        this.createVehicles();
        this.createPlatforms();
        this.createServerRacks();
        
        // Add keyboard event listener
        window.addEventListener('keydown', this.keydownHandler);

        document.addEventListener('visibilitychange', this.visibilityHandler);

        
        // Start game loop
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
        
        console.log('Frogger game started');
    }
    
    /**
     * Stop the game and clean up
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener('keydown', this.keydownHandler);

        document.removeEventListener('visibilitychange', this.visibilityHandler);

        
        // Remove canvas from container
        if (this.canvas && this.containerElement.contains(this.canvas)) {
            this.containerElement.removeChild(this.canvas);
        }
        
        console.log('Frogger game stopped');
    }
    
    /**
     * Handle keyboard input - with stopPropagation to prevent background movement
     */
    handleKeyDown(event) {
        if (!this.isRunning) return;
        
        // Skip if game is paused
        if (this.isPaused) return;
        
        // Handle Arrow keys for movement
        switch(event.code) {
            case 'ArrowUp':
                if (this.player.y > this.gridSize) {
                    this.player.move('up');
                    if (this.player.y < this.height / 2) {
                        this.score += 10; // Points for moving upward
                    }
                }
                break;
            case 'ArrowDown':
                if (this.player.y < this.height - this.gridSize) {
                    this.player.move('down');
                }
                break;
            case 'ArrowLeft':
                if (this.player.x > 0) {
                    this.player.move('left');
                }
                break;
            case 'ArrowRight':
                if (this.player.x < this.width - this.gridSize) {
                    this.player.move('right');
                }
                break;
        }
        
        // Prevent default behavior for arrow keys (scrolling)
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
            event.preventDefault();
        }
        
        // Don't stop propagation as it might interfere with other handlers
    }
    
    /**
     * Create vehicle entities (5 lanes, alternating directions)
     */
    createVehicles() {
        // Calculate road zone position
        const roadY = this.topPadding + this.gridSize * 3 + this.gridSize * 6 + this.gridSize;
        
        // Lane 1: Tesla cars (red, fast, 2 units long) - moving left to right
        const lane1Y = roadY + this.gridSize * 0 + this.gridSize * 0.1; // First lane in road
        for (let i = 0; i < 3; i++) {
            const x = i * this.gridSize * 6 - this.gridSize * 3;
            this.vehicles.push(new Vehicle(
                x, 
                lane1Y, 
                this.gridSize * 2, 
                this.gridSize * 0.8, 
                0.12, // Speed in pixels per millisecond
                this.colors.redCar
            ));
        }
        
        // Lane 2: Delivery drones (blue, medium, 1 unit) - moving right to left
        const lane2Y = roadY + this.gridSize * 1 + this.gridSize * 0.1; // Second lane in road
        for (let i = 0; i < 4; i++) {
            const x = i * this.gridSize * 4;
            this.vehicles.push(new Vehicle(
                x, 
                lane2Y, 
                this.gridSize, 
                this.gridSize * 0.8, 
                -0.08, // Negative for opposite direction
                this.colors.blueDrone
            ));
        }
        
        // Lane 3: More Tesla cars - moving left to right
        const lane3Y = roadY + this.gridSize * 2 + this.gridSize * 0.1; // Third lane in road
        for (let i = 0; i < 2; i++) {
            const x = i * this.gridSize * 7;
            this.vehicles.push(new Vehicle(
                x, 
                lane3Y, 
                this.gridSize * 2, 
                this.gridSize * 0.8, 
                0.14, // Faster than lane 1
                this.colors.redCar
            ));
        }
        
        // Lane 4: More drones - moving right to left
        const lane4Y = roadY + this.gridSize * 3 + this.gridSize * 0.1; // Fourth lane in road
        for (let i = 0; i < 3; i++) {
            const x = i * this.gridSize * 5;
            this.vehicles.push(new Vehicle(
                x, 
                lane4Y, 
                this.gridSize, 
                this.gridSize * 0.8, 
                -0.1, // Slightly faster than lane 2
                this.colors.blueDrone
            ));
        }
        
        // Lane 5: Mining trucks (orange, slow, 3 units) - moving left to right
        const lane5Y = roadY + this.gridSize * 4 + this.gridSize * 0.1; // Fifth lane in road
        for (let i = 0; i < 2; i++) {
            const x = i * this.gridSize * 8 - this.gridSize * 4;
            this.vehicles.push(new Vehicle(
                x, 
                lane5Y, 
                this.gridSize * 3, 
                this.gridSize * 0.8, 
                0.05, // Slow speed
                this.colors.orangeTruck
            ));
        }
    }
    
    /**
     * Create platform entities for the river section
     */
    createPlatforms() {
        // Calculate water zone position
        const waterY = this.topPadding + this.gridSize * 3;
        
        // Lane 1: AI Chips (brown, move left to right)
        const row1Y = waterY + this.gridSize * 0 + this.gridSize * 0.1; // First row in water
        for (let i = 0; i < 3; i++) {
            const x = i * this.gridSize * 5 - this.gridSize * 3;
            this.platforms.push(new Platform(
                x,
                row1Y,
                this.gridSize * 2,
                this.gridSize * 0.8,
                0.07,
                this.colors.brownChip,
                false
            ));
        }
        
        // Lane 2: Obsolete GPUs (green, sink after 2 seconds) - moving right to left
        const row2Y = waterY + this.gridSize * 1 + this.gridSize * 0.1; // Second row in water
        for (let i = 0; i < 4; i++) {
            const x = i * this.gridSize * 4;
            this.platforms.push(new Platform(
                x,
                row2Y,
                this.gridSize * 1.5,
                this.gridSize * 0.8,
                -0.06,
                this.colors.greenGPU,
                true,
                2000 // Sink after 2 seconds
            ));
        }
        
        // Lane 3: More AI Chips - moving left to right but faster
        const row3Y = waterY + this.gridSize * 2 + this.gridSize * 0.1; // Third row in water
        for (let i = 0; i < 3; i++) {
            const x = i * this.gridSize * 6;
            this.platforms.push(new Platform(
                x,
                row3Y,
                this.gridSize * 3, // Longer platforms
                this.gridSize * 0.8,
                0.08,
                this.colors.brownChip,
                false
            ));
        }
        
        // Lane 4: More GPUs - moving right to left
        const row4Y = waterY + this.gridSize * 3 + this.gridSize * 0.1; // Fourth row in water
        for (let i = 0; i < 4; i++) {
            const x = i * this.gridSize * 5 - this.gridSize * 2;
            this.platforms.push(new Platform(
                x,
                row4Y,
                this.gridSize * 1.5,
                this.gridSize * 0.8,
                -0.09,
                this.colors.greenGPU,
                false
            ));
        }
        
        // Lane 5: More AI Chips - moving left to right
        const row5Y = waterY + this.gridSize * 4 + this.gridSize * 0.1; // Fifth row in water
        for (let i = 0; i < 3; i++) {
            const x = i * this.gridSize * 7 - this.gridSize * 4;
            this.platforms.push(new Platform(
                x,
                row5Y,
                this.gridSize * 2.5,
                this.gridSize * 0.8,
                0.05,
                this.colors.brownChip,
                false
            ));
        }
        
        // Lane 6: Last row of platforms - moving right to left
        const row6Y = waterY + this.gridSize * 5 + this.gridSize * 0.1; // Sixth row in water
        for (let i = 0; i < 4; i++) {
            const x = i * this.gridSize * 4.5;
            this.platforms.push(new Platform(
                x,
                row6Y,
                this.gridSize * 1.5,
                this.gridSize * 0.8,
                -0.07,
                this.colors.greenGPU,
                false
            ));
        }
    }
    /**
     * Create server racks (goal zones)
     */
    createServerRacks() {
        // Position server racks within the top safe zone (after padding)
        const serverY = this.topPadding + this.gridSize * 1.5; // Center within top safe zone
        const serverWidth = this.gridSize * 1.2;
        const gap = (this.width - (serverWidth * 5)) / 6;
        
        for (let i = 0; i < 5; i++) {
            const x = gap + i * (serverWidth + gap);
            this.serverRacks.push({
                x: x,
                y: serverY,
                width: serverWidth,
                height: this.gridSize * 1.5,
                reached: false
            });
        }
    }
    /**
     * Update game state
     * @param {number} deltaTime - Time since last frame in milliseconds
     */
    update(deltaTime) {
        // Update player
        this.player.update(deltaTime);
        
        // Update vehicles
        this.vehicles.forEach(vehicle => {
            vehicle.update(deltaTime, this.width);
        });
        
        // Update platforms
        this.platforms.forEach(platform => {
            platform.update(deltaTime, this.width);
            
            // Reset platform player tracking
            platform.hasPlayerOn = false;
        });
        
        // Reset player platform status
        this.player.isOnPlatform = false;
        
        // Check collisions
        this.checkCollisions();
        
        // Check if player is in water
        this.checkWater();
        
        // Check if player reached a server rack
        this.checkServerRacks();
        
        // Check if player is off screen
        if (this.player.x < 0 || this.player.x > this.width - this.gridSize) {
            this.playerDie();
        }
    }
    
    /**
     * Check for collisions between player and vehicles
     */
    checkCollisions() {
        // Check vehicle collisions with AABB collision detection
        this.vehicles.forEach(vehicle => {
            if (this.checkAABBCollision(
                this.player.x, this.player.y, this.player.size, this.player.size,
                vehicle.x, vehicle.y, vehicle.width, vehicle.height
            )) {
                this.playerDie();
            }
        });
    }
    
    /**
     * Check if player is in water and handle platform interactions
     */
    checkWater() {
        // Calculate water zone boundaries
        const waterY = this.topPadding + this.gridSize * 3;
        const waterHeight = this.gridSize * 6;
        
        // Only check for water death if the player is in the water zone
        if (this.player.y >= waterY && this.player.y < waterY + waterHeight) {
            let onPlatform = false;
            
            // Check if player is on any platform
            this.platforms.forEach(platform => {
                if (!platform.isSunk && this.checkAABBCollision(
                    this.player.x, this.player.y, this.player.size, this.player.size,
                    platform.x, platform.y, platform.width, platform.height
                )) {
                    onPlatform = true;
                    platform.hasPlayerOn = true;
                    this.player.isOnPlatform = true;
                    this.player.platformSpeed = platform.speed;
                }
            });
            
            // If not on a platform in water, die
            if (!onPlatform) {
                this.playerDie();
            }
        }
    }
    
    /**
     * Check if player has reached a server rack
     */
    checkServerRacks() {
        this.serverRacks.forEach(rack => {
            if (!rack.reached && this.checkAABBCollision(
                this.player.x, this.player.y, this.player.size, this.player.size,
                rack.x, rack.y, rack.width, rack.height
            )) {
                rack.reached = true;
                this.score += 50; // Points for reaching a server
                this.resetPlayer();
                
                // Check if all racks are reached
                if (this.serverRacks.every(r => r.reached)) {
                    // Level complete!
                    this.resetLevel();
                    this.level++;
                    this.score += 100; // Bonus for completing level
                }
            }
        });
    }
    
    /**
     * Handle player death
     */
    playerDie() {
        this.lives--;
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetPlayer();
        }
    }
    
    /**
     * Reset player to starting position
     */
    resetPlayer() {
        const playerX = Math.floor(this.width / 2 / this.gridSize) * this.gridSize;
        
        // Calculate start zone position - second grid from the bottom
        const startY = this.height - this.gridSize * 2;
        
        this.player.reset(playerX, startY);
    }
 /**
 * Reset level when all server racks are reached
 */
resetLevel() {
    // Check if this is the final level (e.g., level 3 completed)
    const isFinalLevel = this.level >= 3; // Win after 3 levels
    
    if (isFinalLevel) {
        // Player won the game!
        this.isRunning = false;
        this.drawWinScreen();
        
        // Call the game over callback after a delay with 'won' parameter
        setTimeout(() => {
            if (this.onGameOver) {
                this.onGameOver(this.score, 'won');
            }
        }, 2000);
        return;
    }
    
    // Reset server racks
    this.serverRacks.forEach(rack => {
        rack.reached = false;
    });
    
    // Reset player
    this.resetPlayer();
    
    // Reset sinking platforms
    this.platforms.forEach(platform => {
        if (platform.isSinking) {
            platform.reset();
        }
    });
    
    // Increase vehicle speeds slightly
    this.vehicles.forEach(vehicle => {
        vehicle.speed *= 1.2; // 20% faster each level
    });
}
    
    /**
     * Handle game over state
     */
    gameOver() {
        this.isRunning = false;
        this.drawGameOver();
        
        // Call the game over callback after a delay with 'lost' parameter
        setTimeout(() => {
            if (this.onGameOver) {
                this.onGameOver(this.score, 'lost');
            }
        }, 2000); // Show game over for 2 seconds then exit
    }
    
    /**
     * Draw all game elements
     */
    draw() {
        // Clear the entire canvas at its actual size
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        // Background now fills the internal logical size, not the canvas size
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw background sections
        this.drawBackground();
        
        // Draw server racks
        this.drawServerRacks();
        
        // Draw platforms
        this.platforms.forEach(platform => {
            platform.draw(this.ctx);
        });
        
        // Draw vehicles
        this.vehicles.forEach(vehicle => {
            vehicle.draw(this.ctx);
        });
        
        // Draw player
        this.player.draw(this.ctx, this.colors);
        
        // Draw UI
        this.drawUI();
    }
    
    /**
     * Draw background with road and water sections
     */
    drawBackground() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Add padding at the top (2 grid units)
        // This just extends the existing background and doesn't create a special zone
    
        // Draw the game zones in order from top to bottom
        
        // 1. Top safe zone (server racks) - starts after padding
        this.ctx.fillStyle = this.colors.safeZone;
        this.ctx.fillRect(0, this.topPadding, this.width, this.gridSize * 3);
        
        // 2. Water zone 
        const waterY = this.topPadding + this.gridSize * 3;
        this.ctx.fillStyle = this.colors.water;
        this.ctx.fillRect(0, waterY, this.width, this.gridSize * 6);
        
        // 3. Middle safe zone between water and road
        const midSafeY = waterY + this.gridSize * 6;
        this.ctx.fillStyle = this.colors.safeZone;
        this.ctx.fillRect(0, midSafeY, this.width, this.gridSize);
        
        // 4. Road zone
        const roadY = midSafeY + this.gridSize;
        this.ctx.fillStyle = this.colors.road;
        this.ctx.fillRect(0, roadY, this.width, this.gridSize * 5);
        
        // 5. Bottom safe zone (start area) - EXACTLY 3 GRID UNITS
        const startY = roadY + this.gridSize * 5;
        this.ctx.fillStyle = this.colors.safeZone; 
        this.ctx.fillRect(0, startY, this.width, this.gridSize * 3); // 3 grid units
        
        // Draw lane markings on the road
        this.ctx.strokeStyle = this.colors.lanes;
        this.ctx.setLineDash([this.gridSize/2, this.gridSize/2]);
        this.ctx.beginPath();
        
        // Draw 4 dashed lines between the 5 road lanes
        for (let i = 1; i < 5; i++) {
            const y = roadY + i * this.gridSize;
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
        }
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    /**
     * Draw server racks (goal zones)
     */
    drawServerRacks() {
        this.serverRacks.forEach(rack => {
            // Draw server rack body
            this.ctx.fillStyle = rack.reached ? this.colors.serverRackActive : this.colors.serverRack;
            this.ctx.fillRect(rack.x, rack.y, rack.width, rack.height);
            
            // Draw rack details
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(rack.x + 4, rack.y + 4, rack.width - 8, rack.height - 8);
            
            // Draw LED lights
            for (let i = 0; i < 3; i++) {
                this.ctx.fillStyle = rack.reached ? '#00FF00' : '#990000';
                this.ctx.fillRect(rack.x + 8 + i * 10, rack.y + 6, 4, 4);
            }
        });
    }
    
    drawUI() {
        // Calculate font size based on grid size
        const fontSize = Math.max(12, Math.floor(this.gridSize / 2));
        
        // Draw level and score
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `${fontSize}px "Press Start 2P", monospace`;
        this.ctx.fillText(`Level: ${this.level}`, 10, fontSize + 10);
        this.ctx.fillText(`Score: ${this.score}`, 10, fontSize * 2 + 10);
        
        // Draw lives (fixed position)
        this.ctx.fillText('Lives:', this.width - fontSize * 7, fontSize + 10);
        
        // Scale life icons
        const lifeSize = Math.max(10, Math.floor(this.gridSize / 2));
        
        for (let i = 0; i < this.lives; i++) {
            // Draw mini frog icons for lives
            this.ctx.fillStyle = this.colors.playerBody;
            this.ctx.fillRect(
                this.width - fontSize * 7 + i * (lifeSize + 5),
                fontSize + 15,
                lifeSize,
                lifeSize
            );
        }
    }
    
    /**
     * Draw game over screen
     */
    drawGameOver() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Calculate font sizes based on canvas width
        const largeFontSize = Math.max(20, Math.floor(this.width / 15));
        const smallFontSize = Math.max(12, Math.floor(this.width / 30));
        
        // Game over text
        this.ctx.fillStyle = this.colors.gameOver;
        this.ctx.font = `${largeFontSize}px "Press Start 2P", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width/2, this.height/2 - largeFontSize);
        
        // Score text
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `${smallFontSize}px "Press Start 2P", monospace`;
        this.ctx.fillText(`Final Score: ${this.score}`, this.width/2, this.height/2 + smallFontSize);
        this.ctx.fillText('Press ESC to exit', this.width/2, this.height/2 + smallFontSize*3);
        
        this.ctx.textAlign = 'left'; // Reset alignment
    }
    
    /**
     * Check for AABB (Axis-Aligned Bounding Box) collision
     */
    checkAABBCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 &&
               x1 + w1 > x2 &&
               y1 < y2 + h2 &&
               y1 + h1 > y2;
    }
    
    /**
     * Main game loop
     */
    gameLoop(timestamp) {
        if (!this.isRunning) return;
        
        if (!this.isPaused) {
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;
            
            this.update(deltaTime);
            this.draw();
        }
        
        this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }
}

/**
 * Player class representing the frog
 */
class Player {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.direction = 'up'; // For animation
        this.isOnPlatform = false;
        this.platformSpeed = 0;
    }
    
    /**
     * Move the player in a specific direction
     * @param {string} direction - Direction to move ('up', 'down', 'left', 'right')
     */
    move(direction) {
        this.direction = direction;
        
        switch(direction) {
            case 'up':
                this.y -= this.size;
                break;
            case 'down':
                this.y += this.size;
                break;
            case 'left':
                this.x -= this.size;
                break;
            case 'right':
                this.x += this.size;
                break;
        }
    }
    
    /**
     * Update player state
     * @param {number} deltaTime - Time since last frame in milliseconds
     */
    update(deltaTime) {
        // If on a platform, move with it
        if (this.isOnPlatform) {
            this.x += this.platformSpeed * deltaTime;
        }
    }
    
    /**
     * Draw the player
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} colors - Color palette
     */
    draw(ctx, colors) {
        // Base frog body color
        ctx.fillStyle = colors.playerBody;
        
        // Draw body based on direction
        switch(this.direction) {
            case 'up':
                // Body
                ctx.fillRect(this.x + this.size * 0.25, this.y + this.size * 0.25, this.size * 0.5, this.size * 0.5);
                
                // Legs
                ctx.fillRect(this.x + this.size * 0.1, this.y + this.size * 0.1, this.size * 0.2, this.size * 0.2);
                ctx.fillRect(this.x + this.size * 0.7, this.y + this.size * 0.1, this.size * 0.2, this.size * 0.2);
                ctx.fillRect(this.x + this.size * 0.1, this.y + this.size * 0.7, this.size * 0.2, this.size * 0.2);
                ctx.fillRect(this.x + this.size * 0.7, this.y + this.size * 0.7, this.size * 0.2, this.size * 0.2);
                
                // Eyes
                ctx.fillStyle = colors.playerEyes;
                ctx.fillRect(this.x + this.size * 0.3, this.y + this.size * 0.15, this.size * 0.1, this.size * 0.1);
                ctx.fillRect(this.x + this.size * 0.6, this.y + this.size * 0.15, this.size * 0.1, this.size * 0.1);
                break;
                
            case 'down':
                // Body
                ctx.fillRect(this.x + this.size * 0.25, this.y + this.size * 0.25, this.size * 0.5, this.size * 0.5);
                
                // Legs
                ctx.fillRect(this.x + this.size * 0.1, this.y + this.size * 0.1, this.size * 0.2, this.size * 0.2);
                ctx.fillRect(this.x + this.size * 0.7, this.y + this.size * 0.1, this.size * 0.2, this.size * 0.2);
                ctx.fillRect(this.x + this.size * 0.1, this.y + this.size * 0.7, this.size * 0.2, this.size * 0.2);
                ctx.fillRect(this.x + this.size * 0.7, this.y + this.size * 0.7, this.size * 0.2, this.size * 0.2);
                
                // Eyes
                ctx.fillStyle = colors.playerEyes;
                ctx.fillRect(this.x + this.size * 0.3, this.y + this.size * 0.75, this.size * 0.1, this.size * 0.1);
                ctx.fillRect(this.x + this.size * 0.6, this.y + this.size * 0.75, this.size * 0.1, this.size * 0.1);
                break;
                
            case 'left':
                // Body
                ctx.fillRect(this.x + this.size * 0.25, this.y + this.size * 0.25, this.size * 0.5, this.size * 0.5);
                
                // Legs
                ctx.fillRect(this.x + this.size * 0.1, this.y + this.size * 0.1, this.size * 0.2, this.size * 0.2);
                ctx.fillRect(this.x + this.size * 0.1, this.y + this.size * 0.7, this.size * 0.2, this.size * 0.2);
                ctx.fillRect(this.x + this.size * 0.7, this.y + this.size * 0.1, this.size * 0.2, this.size * 0.2);
                ctx.fillRect(this.x + this.size * 0.7, this.y + this.size * 0.7, this.size * 0.2, this.size * 0.2);
                
                // Eyes
                ctx.fillStyle = colors.playerEyes;
                ctx.fillRect(this.x + this.size * 0.15, this.y + this.size * 0.3, this.size * 0.1, this.size * 0.1);
                ctx.fillRect(this.x + this.size * 0.15, this.y + this.size * 0.6, this.size * 0.1, this.size * 0.1);
                break;
                
            case 'right':
                // Body
                ctx.fillRect(this.x + this.size * 0.25, this.y + this.size * 0.25, this.size * 0.5, this.size * 0.5);
                
                // Legs
                ctx.fillRect(this.x + this.size * 0.1, this.y + this.size * 0.1, this.size * 0.2, this.size * 0.2);
                ctx.fillRect(this.x + this.size * 0.1, this.y + this.size * 0.7, this.size * 0.2, this.size * 0.2);
                ctx.fillRect(this.x + this.size * 0.7, this.y + this.size * 0.1, this.size * 0.2, this.size * 0.2);
                ctx.fillRect(this.x + this.size * 0.7, this.y + this.size * 0.7, this.size * 0.2, this.size * 0.2);
                
                // Eyes
                ctx.fillStyle = colors.playerEyes;
                ctx.fillRect(this.x + this.size * 0.75, this.y + this.size * 0.3, this.size * 0.1, this.size * 0.1);
                ctx.fillRect(this.x + this.size * 0.75, this.y + this.size * 0.6, this.size * 0.1, this.size * 0.1);
                break;
        }
    }
    
    /**
     * Reset player to a specific position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 'up';
        this.isOnPlatform = false;
        this.platformSpeed = 0;
    }
}

/**
 * Vehicle class for obstacles
 */
class Vehicle {
    constructor(x, y, width, height, speed, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed; // Pixels per millisecond
        this.color = color;
        this.initialX = x; // Store initial position for respawning
    }
    
    /**
     * Update vehicle position
     * @param {number} deltaTime - Time since last frame in milliseconds
     * @param {number} canvasWidth - Width of the canvas for wrapping
     */
    update(deltaTime, canvasWidth) {
        this.x += this.speed * deltaTime;
        
        // Loop around if off-screen
        if (this.speed > 0 && this.x > canvasWidth) {
            this.x = -this.width;
        } else if (this.speed < 0 && this.x + this.width < 0) {
            this.x = canvasWidth;
        }
    }
    
    /**
     * Draw the vehicle
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        ctx.fillStyle = this.color;
        
        // Draw vehicle body
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw vehicle details based on color (vehicle type)
        if (this.color === '#E74C3C') { // Tesla car (red)
            // Draw windows
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x + this.width * 0.2, this.y, this.width * 0.3, this.height);
            
            // Draw lights
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(this.x, this.y + this.height * 0.2, 5, 5);
            ctx.fillRect(this.x + this.width - 5, this.y + this.height * 0.2, 5, 5);
        } 
        else if (this.color === '#3498DB') { // Delivery drone (blue)
            // Draw propellers
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x + 5, this.y - 2, 5, 2);
            ctx.fillRect(this.x + this.width - 10, this.y - 2, 5, 2);
            
            // Draw package
            ctx.fillStyle = '#D35400';
            ctx.fillRect(this.x + this.width/2 - 5, this.y + this.height/2, 10, 5);
        } 
        else if (this.color === '#E67E22') { // Mining truck (orange)
            // Draw cabin
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x, this.y, this.width * 0.2, this.height);
            
            // Draw wheels
            ctx.fillStyle = '#555555';
            const wheelSize = 5;
            const wheelY = this.y + this.height - wheelSize;
            ctx.fillRect(this.x + 10, wheelY, wheelSize, wheelSize);
            ctx.fillRect(this.x + this.width - 15, wheelY, wheelSize, wheelSize);
            ctx.fillRect(this.x + this.width/2, wheelY, wheelSize, wheelSize);
        }
    }
}

/**
 * Platform class for river objects
 */
class Platform {
    constructor(x, y, width, height, speed, color, isSinking = false, sinkTime = 0) {
        this.x = x;
        this.y = y;
        this.initialX = x; // Store initial position
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.color = color;
        this.isSinking = isSinking;
        this.sinkTime = sinkTime; // Time before platform sinks (ms)
        this.sinkTimer = 0;
        this.isSunk = false;
        this.hasPlayerOn = false;
    }
    
    /**
     * Update platform position and sink state
     * @param {number} deltaTime - Time since last frame in milliseconds
     * @param {number} canvasWidth - Width of the canvas for wrapping
     */
    update(deltaTime, canvasWidth) {
        this.x += this.speed * deltaTime;
        
        // Loop around if off-screen
        if (this.speed > 0 && this.x > canvasWidth) {
            this.x = -this.width;
        } else if (this.speed < 0 && this.x + this.width < 0) {
            this.x = canvasWidth;
        }
        
        // Handle sinking platforms
        if (this.isSinking && this.hasPlayerOn && !this.isSunk) {
            this.sinkTimer += deltaTime;
            if (this.sinkTimer >= this.sinkTime) {
                this.isSunk = true;
            }
        }
    }
    
    /**
     * Draw the platform
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        // If sunk, don't draw
        if (this.isSunk) return;
        
        // Change color when about to sink
        let drawColor = this.color;
        if (this.isSinking && this.hasPlayerOn && this.sinkTimer > this.sinkTime * 0.7) {
            drawColor = '#FF0000'; // Red when about to sink
        }
        
        ctx.fillStyle = drawColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add platform details
        if (this.color === '#8B4513') { // AI Chip (brown)
            // Draw circuit patterns
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, 2);
            ctx.fillRect(this.x + this.width/2, this.y + 5, 2, this.height - 10);
        } 
        else if (this.color === '#27AE60') { // GPU (green)
            // Draw heatsink pattern
            ctx.fillStyle = '#000000';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(this.x + 10 + i * 10, this.y + 3, 2, this.height - 6);
            }
        }
    }
    
    /**
     * Reset platform state
     */
    reset() {
        if (this.isSinking) {
            this.sinkTimer = 0;
            this.isSunk = false;
            this.hasPlayerOn = false;
        }
    }
}

/**
 * Integration with ArcadeApp
 * Call this function from your launchMiniGame method
 * @param {HTMLElement} containerElement - The DOM element to insert the game into
 * @param {Function} onGameOverCallback - Callback when game ends
 * @param {number} width - Canvas width (for responsive sizing)
 * @param {number} height - Canvas height (for responsive sizing)
 * @returns {FroggerGame} - Instance of the game
 */
function startFroggerGame(containerElement, onGameOverCallback, canvasWidth = 600, canvasHeight = 800) {
    // Create a game instance with FIXED internal logic size
    const game = new FroggerGame(containerElement);
    
    // Store the requested canvas dimensions for scaling
    game.canvasWidth = canvasWidth;
    game.canvasHeight = canvasHeight;
    
    game.start(onGameOverCallback);
    return game;
}

// Export the start function
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { startFroggerGame };
} else {
    // If not using modules, add to window
    window.startFroggerGame = startFroggerGame;
}