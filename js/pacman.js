/**
 * Pac-Man Mini-Game for the Vibe Arcade
 * Classic Pac-Man implementation using HTML5 Canvas and vanilla JavaScript
 */

// Main game class
class PacManGame {
    constructor(containerElement) {
        // Canvas setup
        this.containerElement = containerElement;
        this.canvas = null;
        this.ctx = null;
        this.width = 600;
        this.height = 620;  // Increase from 600 to 640
        this.mazeHeight = 600; // Original maze height
                
        
        // Game grid settings
        this.tileSize = 20; // Size of each maze cell in pixels
        this.gridWidth = 30; // Number of cells horizontally (600/20)
        this.gridHeight = 30; // Number of cells vertically (600/20)
        
 // Game state
this.isRunning = false;
this.gameOver = false;
this.score = 0;
this.totalPellets = 0; // Will be counted when maze is created
this.pelletsEaten = 0;
this.level = 1;
this.gameState = 'ready'; // Add this line - can be 'ready', 'playing', or 'gameover'
this.readyTimer = 0;      // Add this line - for flashing "READY!" text
// In the constructor after other game state variables
this.ghostReleasePelletThresholds = [1, 20, 60, 120]; // Pellet thresholds for each ghost
this.lives = 3; // Start with 3 lives
        
        // Game entities
        this.pacman = null;
        this.ghosts = [];
        this.pellets = [];
        
        // Game timing
        this.lastTime = 0;
        this.animationId = null;
        
        // Input handling
        this.keys = {}; // Track pressed keys
        this.keydownHandler = this.handleKeyDown.bind(this);
        this.keyupHandler = this.handleKeyUp.bind(this);
        
        // Callback for when game ends
        this.onGameOver = null;

        
        
        // Define the maze layout
        // 0 = empty path, 1 = wall, 2 = pellet, 3 = power pellet, 4 = ghost starting area
        this.mazeLayout = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1,2,1],
            [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1,3,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1,2,1],
            [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1,2,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1,1,1],
            [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1,1,1],
            [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,0], // Middle row - used for wrap-around
            [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1,1,1],
            [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1,2,1],
            [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,2,2,3,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1,1,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1,1,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        // Add after other properties
this.visibilityHandler = this.handleVisibilityChange.bind(this);
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
        this.canvas.style.border = '2px solid #FFFF00';
        
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
        
        // Initialize the game
        this.initGame();
        
        // Add keyboard event listeners
        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
        
        document.addEventListener('visibilitychange', this.visibilityHandler);
        
        // Start game loop
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
        
        console.log('Pac-Man game started');
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

        document.removeEventListener('visibilitychange', this.visibilityHandler);

        
        // Remove canvas from container
        if (this.canvas && this.containerElement && this.containerElement.contains(this.canvas)) {
            this.containerElement.removeChild(this.canvas);
        } else if (this.canvas && document.body.contains(this.canvas)) {
            document.body.removeChild(this.canvas);
        }
        
        console.log('Pac-Man game stopped');
    }
    
    /**
     * Initialize game state and entities
     */
    initGame() {
        // Reset game state
        this.gameOver = false;
        this.score = 0;
        this.pelletsEaten = 0;
        
        // Initialize the player (Pac-Man)
        this.initPacMan();
        
        // Initialize pellets based on maze layout
        this.initPellets();
        
        // Initialize ghosts
        this.initGhosts();
    }
    
    /**
     * Initialize Pac-Man
     */
    initPacMan() {
        // Find a suitable starting position for Pac-Man (near the bottom of the maze)
        let startX = 14;
        let startY = 23;
        
        // Convert grid position to pixel position
        const pixelX = startX * this.tileSize + this.tileSize / 2;
        const pixelY = startY * this.tileSize + this.tileSize / 2;
        
        // Create Pac-Man
        this.pacman = new PacMan(pixelX, pixelY, this.tileSize / 2);

            // Set initial direction
    this.pacman.direction = 'right';
    this.pacman.nextDirection = 'right';
    }
    
    /**
     * Initialize pellets based on maze layout
     */
    initPellets() {
        this.pellets = [];
        this.totalPellets = 0;
        
        // Loop through the maze layout and create pellets
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.mazeLayout[y][x] === 2) { // Regular pellet
                    // Convert grid position to pixel position (center of the cell)
                    const pixelX = x * this.tileSize + this.tileSize / 2;
                    const pixelY = y * this.tileSize + this.tileSize / 2;
                    
                    // Create a pellet and add it to the array
                    this.pellets.push(new Pellet(pixelX, pixelY, 3, false)); // 3px radius regular pellet
                    this.totalPellets++;
                    
                } else if (this.mazeLayout[y][x] === 3) { // Power pellet
                    // Convert grid position to pixel position (center of the cell)
                    const pixelX = x * this.tileSize + this.tileSize / 2;
                    const pixelY = y * this.tileSize + this.tileSize / 2;
                    
                    // Create a power pellet and add it to the array
                    this.pellets.push(new Pellet(pixelX, pixelY, 6, true)); // 6px radius power pellet
                    this.totalPellets++;
                }
            }
        }
        
        console.log(`Total pellets: ${this.totalPellets}`);
    }
    
/**
 * Initialize ghosts
 */
initGhosts() {
    this.ghosts = [];
    
    // Ghost starting positions (in ghost house or nearby)
    const ghostPositions = [
        {x: 14, y: 13, color: '#FF0000'}, // Red ghost (Blinky)
        {x: 16, y: 13, color: '#FFB8FF'}, // Pink ghost (Pinky)
        {x: 14, y: 15, color: '#00FFFF'}, // Blue ghost (Inky)
        {x: 16, y: 15, color: '#FFB852'}  // Orange ghost (Clyde)
    ];
    
    // Create ghosts
    ghostPositions.forEach((pos, index) => {
        // Convert grid position to pixel position
        const pixelX = pos.x * this.tileSize + this.tileSize / 2;
        const pixelY = pos.y * this.tileSize + this.tileSize / 2;
        
        // Create ghost with different personalities based on index
        const ghost = new Ghost(
            pixelX, 
            pixelY, 
            this.tileSize / 2,
            pos.color,
            index // Different behavior based on index
        );
        
        // All ghosts start in house
        ghost.isInHouse = true;
        
        // Set pellet threshold for release
        ghost.pelletThreshold = this.ghostReleasePelletThresholds[index] || 999;
        
        this.ghosts.push(ghost);
    });
}
    
  /**
 * Handle keydown events
 */
handleKeyDown(event) {
    // Only process inputs when game is running
    if (!this.isRunning) return;
    
    // IMPORTANT: Stop propagation to prevent overlapping controls
    event.stopPropagation();
    
    // Store key state
    this.keys[event.code] = true;
    
    // Process arrow keys for Pac-Man control
    switch (event.code) {
        case 'ArrowUp':
            this.pacman.changeDirection('up');
            
            // Start the game if in ready state
            if (this.gameState === 'ready') {
                this.gameState = 'playing';
            }
            
            event.preventDefault();
            break;
            
        case 'ArrowDown':
            this.pacman.changeDirection('down');
            
            // Start the game if in ready state
            if (this.gameState === 'ready') {
                this.gameState = 'playing';
            }
            
            event.preventDefault();
            break;
            
        case 'ArrowLeft':
            this.pacman.changeDirection('left');
            
            // Start the game if in ready state
            if (this.gameState === 'ready') {
                this.gameState = 'playing';
            }
            
            event.preventDefault();
            break;
            
        case 'ArrowRight':
            this.pacman.changeDirection('right');
            
            // Start the game if in ready state
            if (this.gameState === 'ready') {
                this.gameState = 'playing';
            }
            
            event.preventDefault();
            break;
            
        case 'Escape':
            // Exit the game
            if (this.onGameOver) {
                this.onGameOver(this.score);
            }
            event.preventDefault();
            break;
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
    // Skip update if game is over
    if (this.gameOver) return;
    
    // Update ready timer for flashing text
    if (this.gameState === 'ready') {
        this.readyTimer += deltaTime;
        
        // Update Pac-Man's mouth animation even when stationary
        this.pacman.updateAnimation(deltaTime);
        return; // Don't update movement in ready state
    }
    
    // Only update movement if in playing state
    if (this.gameState === 'playing') {
        // Update Pac-Man
        this.updatePacMan(deltaTime);
        
        // Update ghosts
        this.updateGhosts(deltaTime);
        
        // Check for pellet collisions
        this.checkPelletCollisions();
        
        // Check for ghost collisions
        this.checkGhostCollisions();
        
        // Check if all pellets are eaten
        if (this.pelletsEaten >= this.totalPellets) {
            this.levelComplete();
        }
    }
}
/**
 * Draw the "READY!" text
 */
drawReadyText() {
    // Make the text flash by toggling visibility every 500ms
    const isVisible = Math.floor(this.readyTimer / 500) % 2 === 0;
    
    if (isVisible) {
        this.ctx.fillStyle = '#FFFF00'; // Yellow text
        this.ctx.font = '20px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        
        // Position the text near Pac-Man's starting position
        const textY = 23 * this.tileSize - 30; // Above Pac-Man's start position
        
        this.ctx.fillText('READY!', this.width / 2, textY);
        this.ctx.textAlign = 'left'; // Reset alignment
    }
}
    
/**
 * Update Pac-Man movement and animation
 */
updatePacMan(deltaTime) {
    // Get current grid position of Pac-Man
    const gridX = Math.floor(this.pacman.x / this.tileSize);
    const gridY = Math.floor(this.pacman.y / this.tileSize);
    
    // Update Pac-Man's animation
    this.pacman.updateAnimation(deltaTime);
    
    // Check if Pac-Man can change to the requested direction
    if (this.pacman.nextDirection !== this.pacman.direction) {
        // Calculate test position for the next direction
        let testX = gridX;
        let testY = gridY;
        
        switch (this.pacman.nextDirection) {
            case 'up': testY--; break;
            case 'down': testY++; break;
            case 'left': testX--; break;
            case 'right': testX++; break;
        }
        
        // Check if the new direction is valid (not a wall)
        if (!this.checkWallCollision(testX, testY)) {
            // It's valid, change direction
            this.pacman.direction = this.pacman.nextDirection;
            
            // Align with grid for cleaner turns
            const cellCenterX = gridX * this.tileSize + this.tileSize / 2;
            const cellCenterY = gridY * this.tileSize + this.tileSize / 2;
            
            // Only align in the direction perpendicular to movement
            if (this.pacman.direction === 'up' || this.pacman.direction === 'down') {
                this.pacman.x = cellCenterX; // Align horizontally for vertical movement
            } else {
                this.pacman.y = cellCenterY; // Align vertically for horizontal movement
            }
        }
    }
    
    // Store previous position
    const prevX = this.pacman.x;
    const prevY = this.pacman.y;
    
    // Move Pac-Man based on current direction
    this.pacman.move(deltaTime);
    
    // Get new grid position after moving
    const newGridX = Math.floor(this.pacman.x / this.tileSize);
    const newGridY = Math.floor(this.pacman.y / this.tileSize);
    
    // Check if Pac-Man is hitting a wall
    if (this.checkWallCollision(newGridX, newGridY)) {
        // Revert to previous position
        this.pacman.x = prevX;
        this.pacman.y = prevY;
    }
    
    // Check for wrap-around on the tunnel edges
    this.checkWrapAround();
}
    
    /**
     * Check for collisions with maze walls
     */
    checkWallCollision(gridX, gridY) {
        // Bounds check
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            return false; // Allow out of bounds for wrap-around tunnels
        }
        
        // Check if the grid cell contains a wall
        return this.mazeLayout[gridY][gridX] === 1;
    }
    
    /**
     * Align Pac-Man with the grid for smoother turns
     */

    
    /**
     * Check for wrap-around when Pac-Man moves through tunnels
     */
    checkWrapAround() {
        // Left tunnel wrap-around
        if (this.pacman.x < 0) {
            this.pacman.x = this.width;
        }
        
        // Right tunnel wrap-around
        if (this.pacman.x > this.width) {
            this.pacman.x = 0;
        }
        
        // Prevent vertical wrap-around (not standard in Pac-Man)
        if (this.pacman.y < 0) {
            this.pacman.y = 0;
        }
        
        if (this.pacman.y > this.height) {
            this.pacman.y = this.height;
        }
    }
    
/**
 * Update ghost movement
 */
updateGhosts(deltaTime) {
   // Skip ghost updates in ready state
   if (this.gameState !== 'playing') return;
    
   this.ghosts.forEach(ghost => {
       // Update ghost animation
       ghost.updateAnimation(deltaTime);
       
       // If ghost is in house, check if it's time to release based on pellets eaten
       if (ghost.isInHouse) {
           // Release ghost when pellet threshold is reached
           if (this.pelletsEaten >= ghost.pelletThreshold) {
               console.log(`Ghost ${ghost.personality} starting exit sequence`);
               ghost.isInHouse = false;
               ghost.isExiting = true; // Start exit sequence
               ghost.exitStep = 0;
           }
           
           // Skip movement update if still in house
           return;
       }
       
       // Handle ghost exit sequence
       if (ghost.isExiting) {
           this.handleGhostExit(ghost, deltaTime);
           return;
       }
        
        // Normal ghost movement (after exiting)
        
        // Store previous position
        const prevX = ghost.x;
        const prevY = ghost.y;
        
        // Move ghost
        ghost.update(deltaTime, this.pacman, this.ghosts, this);
        
        // Get current grid position
        const gridX = Math.floor(ghost.x / this.tileSize);
        const gridY = Math.floor(ghost.y / this.tileSize);
        
        // Check if ghost is hitting a wall
        if (this.checkWallCollision(gridX, gridY)) {
            // Revert to previous position
            ghost.x = prevX;
            ghost.y = prevY;
            
            // Choose a new direction
            ghost.chooseNewDirection(this);
        }
        
        // Check for wrap-around on the tunnel edges
        if (ghost.x < 0) {
            ghost.x = this.width;
        }
        
        if (ghost.x > this.width) {
            ghost.x = 0;
        }
    });
}

/**
 * Handle ghost exit sequence
 */
/**
 * Handle ghost exit sequence
 */
handleGhostExit(ghost, deltaTime) {
    // Define exit path waypoints - carefully chosen to avoid walls
    const exitPath = [
        { x: ghost.startX, y: ghost.startY }, // Start at current position
        { x: 14 * this.tileSize + this.tileSize / 2, y: 14 * this.tileSize }, // Center of ghost house
        { x: 14 * this.tileSize + this.tileSize / 2, y: 11.5 * this.tileSize }   // In main corridor
    ];
    
    // Get current target waypoint
    const target = exitPath[ghost.exitStep];
    if (!target) {
        // Safety check - if no target, end exit sequence
        ghost.isExiting = false;
        ghost.direction = 'left';
        return;
    }
    
    // Calculate distance to target
    const dx = target.x - ghost.x;
    const dy = target.y - ghost.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If we're close to target, move to next step
    if (distance < 2) {
        ghost.exitStep++;
        
        // If finished path, switch to normal movement
        if (ghost.exitStep >= exitPath.length) {
            ghost.isExiting = false;
            ghost.direction = 'left'; // Start moving left when leaving
            console.log("Ghost exit complete, now in regular movement");
            return;
        }
    }
    
    // Move toward target
    const moveSpeed = 0.1 * deltaTime; // Use fixed slower speed during exit
    const ratio = moveSpeed / Math.max(distance, 0.1); // Avoid division by zero
    
    // Update position
    const newX = ghost.x + dx * ratio;
    const newY = ghost.y + dy * ratio;
    
    // We'll override normal collision detection during exit
    ghost.x = newX;
    ghost.y = newY;
    
    // Update direction based on movement (for animation)
    if (Math.abs(dx) > Math.abs(dy)) {
        ghost.direction = dx > 0 ? 'right' : 'left';
    } else {
        ghost.direction = dy > 0 ? 'down' : 'up';
    }
}
    
    /**
     * Check for pellet collisions with Pac-Man
     */
    checkPelletCollisions() {
        // Loop through all pellets
        for (let i = this.pellets.length - 1; i >= 0; i--) {
            const pellet = this.pellets[i];
            
            // Calculate distance between Pac-Man and pellet
            const distance = Math.hypot(
                this.pacman.x - pellet.x,
                this.pacman.y - pellet.y
            );
            
            // If distance is less than Pac-Man's radius + pellet's radius, it's a collision
            if (distance < this.pacman.radius + pellet.radius) {
                // Remove the pellet
                this.pellets.splice(i, 1);
                
                // Increment score
                if (pellet.isPowerPellet) {
                    this.score += 50; // Power pellets worth more
                } else {
                    this.score += 10; // Regular pellets
                }
                
                // Increment pellets eaten counter
                this.pelletsEaten++;
                
                // TODO: If it's a power pellet, put ghosts in frightened mode
                if (pellet.isPowerPellet) {
                    this.activatePowerMode();
                }
            }
        }
    }
    
    /**
     * Activate power mode when Pac-Man eats a power pellet
     */
    activatePowerMode() {
        // Set all ghosts to frightened mode
        this.ghosts.forEach(ghost => {
            ghost.setFrightened(true);
        });
        
        // After a delay, end frightened mode
        setTimeout(() => {
            this.ghosts.forEach(ghost => {
                ghost.setFrightened(false);
            });
        }, 5000); // 5 seconds of frightened mode
    }
    
/**
 * Check for collisions between Pac-Man and ghosts
 */
checkGhostCollisions() {
    for (const ghost of this.ghosts) {
        // Calculate distance between Pac-Man and ghost
        const distance = Math.hypot(
            this.pacman.x - ghost.x,
            this.pacman.y - ghost.y
        );
        
        // If distance is less than Pac-Man's radius + ghost's radius, it's a collision
        if (distance < this.pacman.radius + ghost.radius) {
            if (ghost.isFrightened) {
                // Pac-Man eats the ghost
                ghost.reset(); // Reset ghost position
                this.score += 200; // Extra points for eating a ghost
            } else {
                // Ghost catches Pac-Man - lose a life
                this.lives--;
                
                if (this.lives <= 0) {
                    // Game over if no lives left
                    this.handleGameOver();
                } else {
                    // Respawn if lives remain
                    this.respawnAfterDeath();
                }
                return;
            }
        }
    }
}

/**
 * Handle visibility change (tab/window switch)
 */
handleVisibilityChange() {
    if (document.hidden) {
        // Tab is hidden, pause the game
        this.isRunning = false;
    } else {
        // Tab is visible again, resume the game
        // Reset positions to avoid issues
        this.isRunning = true;
        
        // Don't reset positions during game over
        if (!this.gameOver) {
            // Reset Pac-Man and ghosts to valid positions
            this.initPacMan();
            
            // Reset ghosts to ghost house
            this.ghosts.forEach(ghost => {
                ghost.reset();
                ghost.isInHouse = true;
            });
            
            // Switch back to ready state
            this.gameState = 'ready';
            this.readyTimer = 0;
            
            // Reset timing to avoid large time jumps
            this.lastTime = performance.now();
            
            // Restart game loop
            this.gameLoop(this.lastTime);
        }
    }
}


/**
 * Respawn after death
 */
respawnAfterDeath() {
    // Reset Pac-Man to starting position
    this.initPacMan();
    
    // Reset ghosts to ghost house
    this.ghosts.forEach(ghost => {
        ghost.reset();
        ghost.isInHouse = true;
    });
    
    // Switch back to ready state
    this.gameState = 'ready';
    this.readyTimer = 0;
}
    
    /**
     * Handle level completion (all pellets eaten)
     */
    levelComplete() {
        console.log('Level complete!');
        
        // Increment level
        this.level++;
        
        // Reset pellets and other necessary game elements
        this.initPellets();
        this.pelletsEaten = 0;
        
        // Reset Pac-Man and ghosts positions (but keep score)
        this.initPacMan();
        this.initGhosts();
    }
    
    /**
     * Handle game over state
     */
    handleGameOver() {
        this.gameOver = true;
        console.log('Game Over! Final score:', this.score);
        
        // Call callback after delay
        setTimeout(() => {
            if (this.onGameOver) {
                this.onGameOver(this.score, 'lost');
            }
        }, 2000);
    }
    
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
        
        // Draw maze
        this.drawMaze();
        
        // Draw blue border at bottom for UI
        this.drawBottomBorder();
        
        // Draw pellets
        this.drawPellets();
        
        // Draw Pac-Man
        this.pacman.draw(this.ctx);
        
        // Draw ghosts
        this.ghosts.forEach(ghost => ghost.draw(this.ctx));
        
        // Draw score and level
        this.drawUI();
        
        // Draw "READY!" text if in ready state
        if (this.gameState === 'ready') {
            this.drawReadyText();
        }
        
        // Draw game over screen if game is over
        if (this.gameOver) {
            this.drawGameOverScreen();
        }
    }
    
    /**
     * Draw the maze
     */
    drawMaze() {
        // Loop through the maze layout
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                // Only draw walls
                if (this.mazeLayout[y][x] === 1) {
                    // Calculate pixel position
                    const pixelX = x * this.tileSize;
                    const pixelY = y * this.tileSize;
                    
                    // Draw wall tile
                    this.ctx.fillStyle = '#0000FF'; // Blue walls
                    this.ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
                }
            }
        }
    }

    /**
 * Draw blue border at bottom for UI
 */
drawBottomBorder() {
    this.ctx.fillStyle = '#0000FF'; // Blue border
    this.ctx.fillRect(0, this.mazeHeight, this.width, this.height - this.mazeHeight);
}
    
    /**
     * Draw all pellets
     */
    drawPellets() {
        this.pellets.forEach(pellet => {
            pellet.draw(this.ctx);
        });
    }
    
 /**
 * Draw user interface (score and level)
 */
drawUI() {
    // Draw score
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '20px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.score}`, 10, 25);
    
    // Draw level
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Level: ${this.level}`, this.width - 10, 25);
    
    // Draw lives at bottom of screen
    this.drawLives();
}

/**
 * Draw lives display
 */
/**
 * Draw lives display
 */
drawLives() {
    // Draw "Lives:" text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '16px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Lives:', 10, this.height - 10); // Position in blue border
    
    // Draw Pac-Man icons for each life
    for (let i = 0; i < this.lives; i++) {
        const x = 120 + (i * 30);
        const y = this.height - 20; // Position in blue border
        
        // Draw a small Pac-Man for each life
        this.ctx.fillStyle = '#FFFF00'; // Yellow
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10, 0.2 * Math.PI, 1.8 * Math.PI);
        this.ctx.lineTo(x, y);
        this.ctx.fill();
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
        
        // Final score
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px "Press Start 2P", monospace';
        this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
        
        // Returning to arcade text
        this.ctx.font = '16px "Press Start 2P", monospace';
        this.ctx.fillText('Returning to arcade...', this.width / 2, this.height / 2 + 60);
    }
    
/**
 * Check if a position is valid for movement
 */
isValidPosition(x, y) {
    // Convert pixel position to grid position
    const gridX = Math.floor(x / this.tileSize);
    const gridY = Math.floor(y / this.tileSize);
    
    // Check if the position is within the grid
    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
        return false;
    }
    
    // Check if trying to enter ghost house (prevent re-entry)
    if (gridY >= 13 && gridY <= 15 && gridX >= 13 && gridX <= 16) {
        return false;
    }
    
    // Check if the position is a wall
    return this.mazeLayout[gridY][gridX] !== 1;
}
    
    /**
     * Get valid directions from a position
     * Used by ghosts to determine possible movement directions
     */
    getValidDirections(x, y) {
        const directions = [];
        const moveDistance = this.tileSize; // Distance to check
        
        // Check up
        if (this.isValidPosition(x, y - moveDistance)) {
            directions.push('up');
        }
        
        // Check down
        if (this.isValidPosition(x, y + moveDistance)) {
            directions.push('down');
        }
        
        // Check left
        if (this.isValidPosition(x - moveDistance, y)) {
            directions.push('left');
        }
        
        // Check right
        if (this.isValidPosition(x + moveDistance, y)) {
            directions.push('right');
        }
        
        return directions;
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
 * PacMan class - represents the player character
 */
class PacMan {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.direction = 'right'; // Initial direction
        this.nextDirection = 'right'; // Direction to change to when possible
        this.speed = 0.15; // Movement speed (pixels per millisecond)
        
        // Animation properties
        this.angle = 0; // Mouth angle (0 = fully closed, PI = fully open)
        this.mouthOpenRate = 0.015; // Rate at which mouth opens/closes
        this.mouthDirection = 1; // 1 = opening, -1 = closing
    }
    
    /**
     * Change Pac-Man's direction
     * @param {string} direction - 'up', 'down', 'left', or 'right'
     */
    changeDirection(direction) {
        // Just set next direction (actual direction change happens when it's valid)
        this.nextDirection = direction;
    }
    
    
    /**
     * Update Pac-Man's animation (mouth opening/closing)
     */
    updateAnimation(deltaTime) {
        // Update mouth angle
        this.angle += this.mouthOpenRate * this.mouthDirection * deltaTime;
        
        // Reverse direction when fully open or closed
        if (this.angle >= Math.PI / 4) {
            this.angle = Math.PI / 4;
            this.mouthDirection = -1;
        } else if (this.angle <= 0) {
            this.angle = 0;
            this.mouthDirection = 1;
        }
    }
    
    /**
     * Move Pac-Man based on current direction
     */
    move(deltaTime) {
        // Store the current position
        const prevX = this.x;
        const prevY = this.y;
        
        // Apply movement based on current direction
        switch (this.direction) {
            case 'up':
                this.y -= this.speed * deltaTime;
                break;
            case 'down':
                this.y += this.speed * deltaTime;
                break;
            case 'left':
                this.x -= this.speed * deltaTime;
                break;
            case 'right':
                this.x += this.speed * deltaTime;
                break;
        }
    }
    
    /**
     * Draw Pac-Man
     */
    draw(ctx) {
        ctx.save();
        
        // Move to Pac-Man's position
        ctx.translate(this.x, this.y);
        
        // Rotate based on direction
        let rotation = 0;
        switch (this.direction) {
            case 'up':
                rotation = -Math.PI / 2;
                break;
            case 'down':
                rotation = Math.PI / 2;
                break;
            case 'left':
                rotation = Math.PI;
                break;
            case 'right':
                rotation = 0;
                break;
        }
        ctx.rotate(rotation);
        
        // Draw Pac-Man's body
        ctx.fillStyle = '#FFFF00'; // Yellow
        ctx.beginPath();
        
        // Draw arc with mouth opening
        // startAngle and endAngle control the mouth opening
        ctx.arc(0, 0, this.radius, this.angle, 2 * Math.PI - this.angle);
        ctx.lineTo(0, 0);
        ctx.fill();
        
        ctx.restore();
    }
}

/**
 * Ghost class - represents the enemy ghosts
 */
class Ghost {
    constructor(x, y, radius, color, personality) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.direction = 'left'; // Initial direction
        this.speed = 0.12; // Base movement speed (pixels per millisecond)
        this.personality = personality; // 0, 1, 2, or 3 representing different ghost behaviors
        
        // Ghost house properties
        this.isInHouse = true;      // Add this line
        this.releaseDelay = 0;      // Add this line
        this.releaseTimer = 0;      // Add this line
        
        // Frightened mode (when Pac-Man eats a power pellet)
        this.isFrightened = false;
        this.frightTimer = 0;
        
        // Animation properties
        this.animationFrame = 0;
        this.animationTimer = 0;
        
        // Original position for reset
        this.startX = x;
        this.startY = y;

        // In the Ghost constructor
this.isInHouse = true;
this.pelletThreshold = 999; // Default high value, will be set in initGhosts
// In Ghost constructor
this.isExiting = false; // Whether ghost is in exit sequence
this.exitStep = 0;      // Current step in exit sequence    

}

    
    
    /**
     * Update ghost position and animation
     */
    update(deltaTime, pacman, ghosts, game) {
        // Update animation
        this.animationTimer += deltaTime;
        if (this.animationTimer >= 200) { // Change frame every 200ms
            this.animationTimer = 0;
            this.animationFrame = 1 - this.animationFrame; // Toggle between 0 and 1
        }
        
        // Check if at a grid center for direction changes
        this.checkDirectionChange(game, pacman);
        
        // Move ghost based on current direction
        this.move(deltaTime);
    }
    
    /**
     * Update ghost animation
     */
    updateAnimation(deltaTime) {
        // Update animation timer
        this.animationTimer += deltaTime;
        if (this.animationTimer >= 200) { // Change frame every 200ms
            this.animationTimer = 0;
            this.animationFrame = 1 - this.animationFrame; // Toggle between 0 and 1
        }
    }
    
    /**
     * Move ghost based on current direction
     */
    move(deltaTime) {
        // Apply movement based on current direction
        // Apply speed based on mode (slower if frightened)
        const currentSpeed = this.isFrightened ? this.speed * 0.5 : this.speed;
        
        switch (this.direction) {
            case 'up':
                this.y -= currentSpeed * deltaTime;
                break;
            case 'down':
                this.y += currentSpeed * deltaTime;
                break;
            case 'left':
                this.x -= currentSpeed * deltaTime;
                break;
            case 'right':
                this.x += currentSpeed * deltaTime;
                break;
        }
    }
    
    /**
     * Check if ghost should change direction (at grid centers)
     */
    checkDirectionChange(game, pacman) {
        // Check if ghost is at a grid center (within a small threshold)
        const gridX = Math.floor(this.x / game.tileSize);
        const gridY = Math.floor(this.y / game.tileSize);
        const cellCenterX = gridX * game.tileSize + game.tileSize / 2;
        const cellCenterY = gridY * game.tileSize + game.tileSize / 2;
        
        const distanceToCenter = Math.hypot(
            this.x - cellCenterX,
            this.y - cellCenterY
        );
        
        // Only allow direction changes at grid centers
        if (distanceToCenter < 2) {
            // At a grid center, decide next direction
            if (this.isFrightened) {
                // In frightened mode, choose a random valid direction
                this.chooseRandomDirection(game);
            } else {
                // Normal mode, choose direction based on personality
                this.chooseDirectionByPersonality(game, pacman);
            }
            
            // Adjust position to grid center for clean turns
            this.x = cellCenterX;
            this.y = cellCenterY;
        }
    }
    
    /**
     * Choose a new direction when hitting a wall
     */
    chooseNewDirection(game) {
        // Get valid directions from current position
        const validDirections = game.getValidDirections(this.x, this.y);
        
        // Filter out the opposite of current direction (no U-turns)
        const oppositeDirection = this.getOppositeDirection(this.direction);
        const filteredDirections = validDirections.filter(dir => dir !== oppositeDirection);
        
        // If there are valid directions, choose one
        if (filteredDirections.length > 0) {
            // In frightened mode, choose random direction
            if (this.isFrightened) {
                this.direction = filteredDirections[Math.floor(Math.random() * filteredDirections.length)];
            } else {
                // Otherwise, choose based on personality
                this.direction = this.chooseBestDirection(game, filteredDirections);
            }
        } else if (validDirections.length > 0) {
            // If only the opposite direction is valid, go that way
            this.direction = validDirections[0];
        }
    }
    
    /**
     * Choose a random valid direction
     */
    chooseRandomDirection(game) {
        // Get valid directions from current position
        const validDirections = game.getValidDirections(this.x, this.y);
        
        // Filter out the opposite of current direction (no U-turns)
        const oppositeDirection = this.getOppositeDirection(this.direction);
        const filteredDirections = validDirections.filter(dir => dir !== oppositeDirection);
        
        // Choose a random direction from the filtered list
        if (filteredDirections.length > 0) {
            this.direction = filteredDirections[Math.floor(Math.random() * filteredDirections.length)];
        } else if (validDirections.length > 0) {
            // If only the opposite direction is available, use it
            this.direction = validDirections[0];
        }
    }
    
    /**
     * Choose direction based on ghost personality
     */
    chooseDirectionByPersonality(game, pacman) {
        // Get valid directions from current position
        const validDirections = game.getValidDirections(this.x, this.y);
        
        // Filter out the opposite of current direction (no U-turns)
        const oppositeDirection = this.getOppositeDirection(this.direction);
        const filteredDirections = validDirections.filter(dir => dir !== oppositeDirection);
        
        // If there are no valid directions, keep current direction
        if (filteredDirections.length === 0) {
            return;
        }
        
        // Different personalities have different targeting strategies
        switch (this.personality) {
            case 0: // Red ghost (Blinky) - directly chases Pac-Man
                this.direction = this.getDirectionTowardsTarget(filteredDirections, pacman.x, pacman.y);
                break;
                
            case 1: // Pink ghost (Pinky) - tries to get ahead of Pac-Man
                let targetX = pacman.x;
                let targetY = pacman.y;
                
                // Target 4 tiles ahead of Pac-Man's direction
                switch (pacman.direction) {
                    case 'up':
                        targetY -= 4 * game.tileSize;
                        break;
                    case 'down':
                        targetY += 4 * game.tileSize;
                        break;
                    case 'left':
                        targetX -= 4 * game.tileSize;
                        break;
                    case 'right':
                        targetX += 4 * game.tileSize;
                        break;
                }
                
                this.direction = this.getDirectionTowardsTarget(filteredDirections, targetX, targetY);
                break;
                
            case 2: // Blue ghost (Inky) - combination of Blinky and Pinky behavior
                // Moves semi-randomly with tendency to corner Pac-Man
                if (Math.random() < 0.7) {
                    this.direction = this.getDirectionTowardsTarget(filteredDirections, pacman.x, pacman.y);
                } else {
                    this.direction = filteredDirections[Math.floor(Math.random() * filteredDirections.length)];
                }
                break;
                
            case 3: // Orange ghost (Clyde) - moves randomly
                this.direction = filteredDirections[Math.floor(Math.random() * filteredDirections.length)];
                break;
                
            default:
                // Default behavior - move randomly
                this.direction = filteredDirections[Math.floor(Math.random() * filteredDirections.length)];
        }
    }
    
    /**
     * Get the opposite direction
     */
    getOppositeDirection(direction) {
        switch (direction) {
            case 'up': return 'down';
            case 'down': return 'up';
            case 'left': return 'right';
            case 'right': return 'left';
            default: return direction;
        }
    }

    /**
 * Choose the best direction based on valid options
 */
chooseBestDirection(game, validDirections) {
    // Default behavior - move towards Pac-Man
    const pacman = game.pacman;
    
    // Calculate distances for each direction
    let bestDirection = validDirections[0];
    let bestDistance = Infinity;
    
    // Calculate distances for each direction
    for (const direction of validDirections) {
        let newX = this.x;
        let newY = this.y;
        
        // Calculate new position based on direction
        switch (direction) {
            case 'up': newY -= 20; break;
            case 'down': newY += 20; break;
            case 'left': newX -= 20; break;
            case 'right': newX += 20; break;
        }
        
        // Calculate Manhattan distance to Pac-Man
        const distance = Math.abs(newX - pacman.x) + Math.abs(newY - pacman.y);
        
        // If this direction gives a shorter distance, update best direction
        if (distance < bestDistance) {
            bestDistance = distance;
            bestDirection = direction;
        }
    }
    
    return bestDirection;
}
    
    /**
     * Choose the best direction to reach a target
     */
    getDirectionTowardsTarget(validDirections, targetX, targetY) {
        let bestDirection = validDirections[0];
        let bestDistance = Infinity;
        
        // Calculate distances for each direction
        for (const direction of validDirections) {
            let newX = this.x;
            let newY = this.y;
            
            // Calculate new position based on direction
            switch (direction) {
                case 'up': newY -= 20; break;
                case 'down': newY += 20; break;
                case 'left': newX -= 20; break;
                case 'right': newX += 20; break;
            }
            
            // Calculate Manhattan distance to target
            const distance = Math.abs(newX - targetX) + Math.abs(newY - targetY);
            
            // If this direction gives a shorter distance, update best direction
            if (distance < bestDistance) {
                bestDistance = distance;
                bestDirection = direction;
            }
        }
        
        return bestDirection;
    }
    
    /**
     * Set ghost to frightened mode
     */
    setFrightened(frightened) {
        this.isFrightened = frightened;
    }
    
/**
 * Reset ghost position
 */
reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.direction = 'left';
    this.isFrightened = false;
    this.isInHouse = true;
    this.isExiting = false; // Reset exit flag
    this.exitStep = 0;      // Reset exit step
}
    
    /**
     * Draw the ghost
     */
    draw(ctx) {
        ctx.save();
        
        // Determine ghost color based on mode
        let fillColor = this.color;
        if (this.isFrightened) {
            // Blue in frightened mode
            fillColor = '#0000FF';
        }
        
        // Draw ghost body
        ctx.fillStyle = fillColor;
        
        // Main body (circle + rectangle)
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, Math.PI, 0); // Semi-circle for top
        
        // Bottom with waves
        const baseY = this.y;
        ctx.lineTo(this.x + this.radius, baseY);
        
        // Number of waves at the bottom
        const waveCount = 3;
        const waveWidth = 2 * this.radius / waveCount;
        const waveHeight = this.radius * 0.5;
        
        // Draw waves based on animation frame
        // Alternate between two wave patterns for "wiggling" effect
        if (this.animationFrame === 0) {
            for (let i = 0; i < waveCount; i++) {
                const waveX = this.x + this.radius - (i * waveWidth);
                ctx.lineTo(waveX - waveWidth/2, baseY + waveHeight);
                ctx.lineTo(waveX - waveWidth, baseY);
            }
        } else {
            for (let i = 0; i < waveCount; i++) {
                const waveX = this.x + this.radius - (i * waveWidth);
                ctx.lineTo(waveX - waveWidth/2, baseY - waveHeight/2);
                ctx.lineTo(waveX - waveWidth, baseY);
            }
        }
        
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = '#FFFFFF';
        
        // Eye size is relative to ghost radius
        const eyeRadius = this.radius * 0.3;
        const eyeOffsetX = this.radius * 0.35;
        const eyeOffsetY = -this.radius * 0.2;
        
        // Left eye
        ctx.beginPath();
        ctx.arc(this.x - eyeOffsetX, this.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(this.x + eyeOffsetX, this.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw pupils based on direction
        ctx.fillStyle = '#000000';
        const pupilRadius = eyeRadius * 0.5;
        let pupilOffsetX = 0;
        let pupilOffsetY = 0;
        
        // Adjust pupil position based on ghost direction
        switch (this.direction) {
            case 'up':
                pupilOffsetY = -pupilRadius * 0.8;
                break;
            case 'down':
                pupilOffsetY = pupilRadius * 0.8;
                break;
            case 'left':
                pupilOffsetX = -pupilRadius * 0.8;
                break;
            case 'right':
                pupilOffsetX = pupilRadius * 0.8;
                break;
        }
        
        // Left pupil
        ctx.beginPath();
        ctx.arc(
            this.x - eyeOffsetX + pupilOffsetX, 
            this.y + eyeOffsetY + pupilOffsetY, 
            pupilRadius, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Right pupil
        ctx.beginPath();
        ctx.arc(
            this.x + eyeOffsetX + pupilOffsetX, 
            this.y + eyeOffsetY + pupilOffsetY, 
            pupilRadius, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        ctx.restore();
    }
}

/**
 * Pellet class - represents dots that Pac-Man eats
 */
class Pellet {
    constructor(x, y, radius, isPowerPellet) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.isPowerPellet = isPowerPellet;
        
        // Animation for power pellets
        this.animationTimer = 0;
        this.visible = true;
    }
    
    /**
     * Draw the pellet
     */
    draw(ctx) {
        // Update animation for power pellets
        if (this.isPowerPellet) {
            this.animationTimer++;
            if (this.animationTimer > 30) {
                this.visible = !this.visible;
                this.animationTimer = 0;
            }
            
            // Don't draw if not visible
            if (!this.visible) return;
        }
        
        // Draw pellet
        ctx.fillStyle = '#FFFFFF'; // White pellets
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Integration with ArcadeApp
 * Call this function from the launchMiniGame method
 * @param {HTMLElement} containerElement - The DOM element to insert the game into
 * @param {Function} onGameOverCallback - Callback when game ends
 * @returns {PacManGame} - Instance of the game
 */
function startPacManGame(containerElement, onGameOverCallback, canvasWidth = 600, canvasHeight = 620) {
    console.log('Starting Pac-Man game with container:', containerElement);
    const game = new PacManGame(containerElement);
    game.canvasWidth = canvasWidth;
    game.canvasHeight = canvasHeight;
    game.start(onGameOverCallback);
    return game;
}

// Export the start function
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { startPacManGame };
} else {
    // If not using modules, add to window
    window.startPacManGame = startPacManGame;
}