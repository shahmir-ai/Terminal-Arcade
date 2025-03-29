/**
 * Snake Mini-Game with Full Self-Driving (FSD) Mode for the Vibe Arcade
 * A classic Snake game implementation using HTML5 Canvas and vanilla JavaScript
 */

// Main game class
class SnakeGame {
    constructor(containerElement) {
        // Canvas setup
        this.containerElement = containerElement;
        this.canvas = null;
        this.ctx = null;
        this.width = 600;
        this.height = 600;
        this.gridSize = 20; // Each cell is 20x20 pixels
        
        // Game state
        this.isRunning = false;
        this.score = 0;
        this.gameOver = false;
        
        // Snake properties
        this.snake = []; // Array of segments, each with x,y coordinates
        this.direction = 'right'; // Initial direction
        this.nextDirection = 'right'; // Buffer for next direction change
        
        // Battery (food) properties
        this.battery = null; // Will hold {x, y} coordinates
        
        // FSD mode properties
        this.fsdMode = false;
        this.fsdPopupActive = false;
        this.fsdCrashTimer = 0;
        this.fsdCrashDelay = 1000 + Math.random() * 4000; // Random between 5-10 seconds
        this.fsdLastDecisionTime = 0;
        this.fsdDecisionInterval = 100; // Time between FSD decisions (in ms)
        this.fsdMalfunction = false; // Add this line for tracking malfunction state
        this.fsdSpeedAdjusted = false; // Add this line
this.normalMoveInterval = 0;   // Add this line


        
        // Game timing
        this.lastTime = 0;
        this.animationId = null;
        this.moveInterval = 150; // Snake moves every 150ms initially
        this.moveTimer = 0;
        
        // Input handling
        this.keydownHandler = this.handleKeyDown.bind(this);
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
        this.canvas.style.border = '2px solid #33FF33';
        
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
        
        // Initialize game state
        this.initGame();
        
        // Add keyboard event listener
        window.addEventListener('keydown', this.keydownHandler);
        
        // Start game loop
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
        
        console.log('Snake game started');
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
        
        // Remove canvas from container
        if (this.canvas && this.containerElement && this.containerElement.contains(this.canvas)) {
            this.containerElement.removeChild(this.canvas);
        }
        
        console.log('Snake game stopped');
    }
    
    /**
     * Initialize game state
     */
    initGame() {
        // Create initial snake (3 segments) at center-bottom of screen
        const centerX = Math.floor(this.width / (2 * this.gridSize));
        const bottomY = Math.floor(this.height / this.gridSize) - 5;
        
        this.snake = [
            { x: centerX, y: bottomY },
            { x: centerX - 1, y: bottomY },
            { x: centerX - 2, y: bottomY }
        ];
        
        // Set initial direction
        this.direction = 'right';
        this.nextDirection = 'right';
        
        // Spawn first battery
        this.spawnBattery();
        
        // Reset score
        this.score = 0;
        
        // Reset FSD mode
        this.fsdMode = false;
        this.fsdPopupActive = false;
        this.fsdCrashTimer = 0;
    }
    
    /**
     * Spawn a battery (food) at a random position not occupied by the snake
     */
    spawnBattery() {
        let validPosition = false;
        let newBatteryX, newBatteryY;
        
        // Keep trying until a valid position is found
        while (!validPosition) {
            // Generate random grid coordinates
            newBatteryX = Math.floor(Math.random() * (this.width / this.gridSize));
            newBatteryY = Math.floor(Math.random() * (this.height / this.gridSize));
            
            validPosition = true;
            
            // Check if position overlaps with snake
            for (const segment of this.snake) {
                if (segment.x === newBatteryX && segment.y === newBatteryY) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        // Set battery position
        this.battery = { x: newBatteryX, y: newBatteryY };
    }
    
    /**
     * Handle keydown events for snake control
     */
    handleKeyDown(event) {
        // Only process inputs when game is running and not in FSD popup
        if (!this.isRunning || this.fsdPopupActive) return;
        
        switch (event.code) {
            case 'ArrowUp':
                // Prevent reversing direction (moving down then immediately up)
                if (this.direction !== 'down') {
                    this.nextDirection = 'up';
                }
                break;
                
            case 'ArrowDown':
                if (this.direction !== 'up') {
                    this.nextDirection = 'down';
                }
                break;
                
            case 'ArrowLeft':
                if (this.direction !== 'right') {
                    this.nextDirection = 'left';
                }
                break;
                
            case 'ArrowRight':
                if (this.direction !== 'left') {
                    this.nextDirection = 'right';
                }
                break;
                
                case 'Space':
                    // Toggle FSD mode if not in malfunction
                    if (!this.fsdMalfunction) {
                        if (this.fsdMode) {
                            // Turn off FSD mode
                            this.deactivateFSDMode();
                        } else {
                            // Turn on FSD mode
                            this.activateFSDMode();
                        }
                    }
                    break;
                
            case 'Escape':
                // Exit the game
                if (this.onGameOver) {
                    this.onGameOver(this.score, 'quit');
                }
                break;
        }
        
        // Prevent default for arrow keys and space to avoid page scrolling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
            event.preventDefault();
        }
    }
    
/**
 * Activate Full Self-Driving (FSD) mode
 */
activateFSDMode() {
    // Show popup
    this.fsdPopupActive = true;
    
    // Generate a new random delay between 10-25 seconds
    this.fsdCrashDelay = 1000 + Math.random() * 4000;
    console.log(`FSD will malfunction after ${Math.floor(this.fsdCrashDelay/1000)} seconds`);
    
    // Automatically hide popup after delay
    setTimeout(() => {
        this.fsdPopupActive = false;
        this.fsdMode = true;
        this.fsdCrashTimer = 0; // Reset the timer when FSD activates
        this.fsdMalfunction = false; // Reset malfunction state
        console.log('FSD Mode activated');
    }, 2500);
}

/**
 * Deactivate Full Self-Driving (FSD) mode
 */
deactivateFSDMode() {
    this.fsdMode = false;
    
    // Restore normal speed
    if (this.fsdSpeedAdjusted) {
        this.moveInterval = this.normalMoveInterval;
        this.fsdSpeedAdjusted = false;
    }
    
    console.log('FSD Mode deactivated');
}
    
    /**
     * Update game state
     * @param {number} deltaTime - Time since last frame in milliseconds
     */
    update(deltaTime) {
        // Don't update game if popup is active
        if (this.fsdPopupActive) {
            return;
        }
        
        // Update move timer
        this.moveTimer += deltaTime;
        
        // Move snake when interval has elapsed
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            
            // Update direction
            this.direction = this.nextDirection;
            
            // If in FSD mode, control snake automatically
            if (this.fsdMode) {
                this.updateFSDMode(deltaTime);
            }
            
            // Move snake
            this.moveSnake();
            
            // Check for collisions
            if (this.checkCollisions()) {
                this.gameOver = true;
                this.handleGameOver();
                return;
            }
            
            // Check if snake ate a battery
            this.checkBatteryCollection();
        }
    }
    
    /**
     * Update FSD mode logic
     * @param {number} deltaTime - Time since last frame in milliseconds
     */
    updateFSDMode(deltaTime) {
        // Update crash timer in FSD mode
        this.fsdCrashTimer += deltaTime;
        
        // Add debug logging - remove this after debugging
        if (this.fsdCrashTimer > 0 && Math.floor(this.fsdCrashTimer/1000) % 5 === 0) {
            console.log(`FSD Timer: ${Math.floor(this.fsdCrashTimer/1000)}s / Target: ${Math.floor(this.fsdCrashDelay/1000)}s`);
        }
        
        // Check if it's time to start malfunction
        if (this.fsdCrashTimer >= this.fsdCrashDelay && !this.fsdMalfunction) {
            console.log(`TRIGGERING MALFUNCTION: Timer ${this.fsdCrashTimer} >= Delay ${this.fsdCrashDelay}`);
            this.startFSDMalfunction();
        }
        
        // Only make decisions if not in malfunction mode
        if (!this.fsdMalfunction) {
            // Check if it's time to make a new decision
            const now = performance.now();
            if (now - this.fsdLastDecisionTime > this.fsdDecisionInterval) {
                this.fsdLastDecisionTime = now;
                
                // Implement automated movement logic
                this.makeFSDDecision();
            }
        }
        
        // Double the effective speed in FSD mode
        if (!this.fsdSpeedAdjusted) {
            this.normalMoveInterval = this.moveInterval; // Store normal speed
            this.moveInterval = this.moveInterval / 2; // Double the speed
            this.fsdSpeedAdjusted = true;
        }
    }
    

    makeFSDDecision() {
        if (this.fsdMalfunction) return;
    
        const head = this.snake[0];
        if (!this.battery) { /* ... existing battery-free logic ... */ }
    
        // 1. Calculate path priorities with obstacle checks
        const dx = this.battery.x - head.x;
        const dy = this.battery.y - head.y;
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);
    
        // 2. Generate candidate directions with safety and anti-loop checks
        const candidates = ['up', 'right', 'down', 'left']
            .filter(dir => 
                dir !== this.getOppositeDirection(this.direction) && 
                this.isDirectionSafe(dir) &&
                !this.willCreateLoop(dir) // New loop detection check
            );
    
        // 3. Prioritize directions that both reduce distance AND avoid enclosures
        if (candidates.length > 0) {
            const scoredDirs = candidates.map(dir => {
                const newHead = this.getNewHeadPosition(dir);
                const dist = Math.abs(this.battery.x - newHead.x) + Math.abs(this.battery.y - newHead.y);
                const freedom = this.calculateMovementFreedom(newHead); // New freedom metric
                return { dir, score: dist * 0.7 + freedom * 0.3 }; // Weighted priority
            });
    
            // Sort by score ascending (lower = better)
            scoredDirs.sort((a, b) => a.score - b.score);
            this.nextDirection = scoredDirs[0].dir;
            return;
        }
    
        // 4. Fallback to original safe logic if no candidates
        const directions = ['right', 'down', 'left', 'up'];
        for (const dir of directions) {
            if (this.isDirectionSafe(dir)) {
                this.nextDirection = dir;
                return;
            }
        }
    }
    // Helper to get position after moving in direction
getNewHeadPosition(dir, fromPos = this.snake[0]) {
    const newHead = { ...fromPos };
    switch (dir) {
        case 'up': newHead.y--; break;
        case 'down': newHead.y++; break;
        case 'left': newHead.x--; break;
        case 'right': newHead.x++; break;
    }
    return newHead;
}

// Check if any position is safe (walls/body collision)
isPositionSafe(pos) {
    return (
        pos.x >= 0 && pos.x < this.gridSize &&
        pos.y >= 0 && pos.y < this.gridSize &&
        !this.snake.some(segment => segment.x === pos.x && segment.y === pos.y)
    );
}
    // NEW: Detect potential loops by checking recent positions
    willCreateLoop(dir) {
        const newHead = this.getNewHeadPosition(dir);
        return this.snake.some((segment, index) => 
            index > 0 && // Skip head-to-head comparison
            segment.x === newHead.x && 
            segment.y === newHead.y
        );
    }
    
    // NEW: Calculate how many future moves are possible from this position
    calculateMovementFreedom(pos) {
        const directions = ['up', 'right', 'down', 'left'];
        return directions.filter(dir => {
            const newPos = this.getNewHeadPosition(dir, pos); // Pass position
            return this.isPositionSafe(newPos);
        }).length;
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
        default: return null;
    }
}

/**
 * Force a more direct approach to the battery after circling too long
 */
forceBatteryApproach() {
    const head = this.snake[0];
    
    // Calculate direction to battery
    const dx = this.battery.x - head.x;
    const dy = this.battery.y - head.y;
    
    // Choose the longest clear path that moves toward the battery
    const directions = [];
    
    if (dx > 0) directions.push('right');
    if (dx < 0) directions.push('left');
    if (dy > 0) directions.push('down');
    if (dy < 0) directions.push('up');
    
    // Filter invalid directions (opposite of current)
    const validDirections = directions.filter(dir => {
        if (dir === 'up' && this.direction === 'down') return false;
        if (dir === 'down' && this.direction === 'up') return false;
        if (dir === 'left' && this.direction === 'right') return false;
        if (dir === 'right' && this.direction === 'left') return false;
        return true;
    });
    
    // Look for a direction that gives us a clear path to the battery
    let bestDir = null;
    let bestDistance = -1;
    
    for (const dir of validDirections) {
        if (this.isDirectionSafe(dir)) {
            const distance = this.calculateSafetyDistance(head.x, head.y, dir);
            if (distance > bestDistance) {
                bestDistance = distance;
                bestDir = dir;
            }
        }
    }
    
    // If we found a good direction, take it
    if (bestDir) {
        this.nextDirection = bestDir;
        // Reset approach counter
        this.batteryApproachCounter = 0;
    } else {
        // Otherwise, try any safe direction
        const safeDirections = this.getAdvancedSafeDirections();
        if (safeDirections.length > 0) {
            this.nextDirection = safeDirections[0];
        }
    }
}

/**
 * Check if a move would lead to a recently visited position
 */
wasRecentlyVisited(head, direction) {
    let newX = head.x;
    let newY = head.y;
    
    switch (direction) {
        case 'up': newY--; break;
        case 'down': newY++; break;
        case 'left': newX--; break;
        case 'right': newX++; break;
    }
    
    const posKey = `${newX},${newY}`;
    return this.visitedPositions.has(posKey);
}

/**
 * Start FSD malfunction process
 */
/**
 * Start FSD malfunction process
 */
startFSDMalfunction() {
    // Set malfunction flag
    this.fsdMalfunction = true;
    
    // Add a console log with more detailed information
    console.log('FSD MALFUNCTION ACTIVATED!');
    
    // Force UI update by adding this line
    this.draw(); // Redraw immediately to show malfunction status
}
    
    /**
     * Execute intentional crash in FSD mode
     */
    executeFSDCrash() {
        // Find a direction that will cause a crash
        const head = this.snake[0];
        
        // Try to crash into a wall
        if (head.x === 0) {
            this.nextDirection = 'left'; // Crash into left wall
        } else if (head.x === this.width / this.gridSize - 1) {
            this.nextDirection = 'right'; // Crash into right wall
        } else if (head.y === 0) {
            this.nextDirection = 'up'; // Crash into top wall
        } else if (head.y === this.height / this.gridSize - 1) {
            this.nextDirection = 'down'; // Crash into bottom wall
        } else {
            // Not near a wall, try to crash into self
            // Move in a circle
            if (this.direction === 'up') {
                this.nextDirection = 'right';
            } else if (this.direction === 'right') {
                this.nextDirection = 'down';
            } else if (this.direction === 'down') {
                this.nextDirection = 'left';
            } else if (this.direction === 'left') {
                this.nextDirection = 'up';
            }
        }
    }
    
    /**
     * Move the snake in the current direction
     */
    moveSnake() {
        // Get snake head
        const head = this.snake[0];
        
        // Calculate new head position based on direction
        let newHead = { x: head.x, y: head.y };
        
        switch (this.direction) {
            case 'up':
                newHead.y--;
                break;
            case 'down':
                newHead.y++;
                break;
            case 'left':
                newHead.x--;
                break;
            case 'right':
                newHead.x++;
                break;
        }
        
        // Add new head to beginning of snake
        this.snake.unshift(newHead);
        
        // If not eating a battery, remove the tail
        // The battery collection will handle keeping the tail if battery is eaten
        if (!this.isBatteryCollected()) {
            this.snake.pop();
        }
    }
    
    /**
     * Check if the snake has collected a battery
     * @returns {boolean} - True if battery is collected
     */
    isBatteryCollected() {
        if (!this.battery) return false;
        
        const head = this.snake[0];
        return head.x === this.battery.x && head.y === this.battery.y;
    }
    
    /**
     * Handle battery collection
     */
    checkBatteryCollection() {
        if (this.isBatteryCollected()) {
            // Increase score
            this.score += 10;
            
            // Speed up the snake slightly (up to a limit)
            this.moveInterval = Math.max(80, this.moveInterval - 5);
            
            // Spawn new battery
            this.spawnBattery();
            
            // The snake grows by not removing the tail in moveSnake()
        }
    }
    
    /**
     * Check for collisions with walls or self
     * @returns {boolean} - True if collision detected
     */
    checkCollisions() {
        const head = this.snake[0];
        
        // Check wall collisions
        if (head.x < 0 || head.x >= this.width / this.gridSize ||
            head.y < 0 || head.y >= this.height / this.gridSize) {
            return true;
        }
        
        // Check self collisions (skip head)
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }

    /**
 * Check if a direction is safe to move (no collision)
 */
isDirectionSafe(direction) {
    const head = this.snake[0];
    
    // Calculate new position based on direction
    let newX = head.x;
    let newY = head.y;
    
    switch (direction) {
        case 'up': newY--; break;
        case 'down': newY++; break;
        case 'left': newX--; break;
        case 'right': newX++; break;
    }
    
    // Check wall collisions
    if (newX < 0 || newX >= this.width / this.gridSize ||
        newY < 0 || newY >= this.height / this.gridSize) {
        return false;
    }
    
    // Check self collisions
    for (let i = 1; i < this.snake.length; i++) {
        if (this.snake[i].x === newX && this.snake[i].y === newY) {
            return false;
        }
    }
    
    return true;
}

/**
 * Get all safe directions to move
 */
getSafeDirections() {
    const directions = ['up', 'down', 'left', 'right'];
    const invalidDirection = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left'
    };
    
    // Filter out the opposite of current direction
    const validDirections = directions.filter(dir => 
        dir !== invalidDirection[this.direction]
    );
    
    // Filter out unsafe directions
    return validDirections.filter(dir => this.isDirectionSafe(dir));
}

/**
 * Get advanced safe directions with lookahead to avoid dead ends
 */
getAdvancedSafeDirections() {
    const head = this.snake[0];
    const directions = ['up', 'down', 'left', 'right'];
    const invalidDirection = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left'
    };
    
    // Directions that don't immediately crash
    const immediateSafe = directions.filter(dir => {
        // Skip opposite of current direction
        if (dir === invalidDirection[this.direction]) {
            return false;
        }
        
        // Calculate new position
        let newX = head.x;
        let newY = head.y;
        
        switch (dir) {
            case 'up': newY--; break;
            case 'down': newY++; break;
            case 'left': newX--; break;
            case 'right': newX++; break;
        }
        
        // Skip if would collide
        if (this.wouldCollide(newX, newY)) {
            return false;
        }
        
        return true;
    });
    
    // Score directions based on how much room they give us
    const scoredDirections = immediateSafe.map(dir => {
        let newX = head.x;
        let newY = head.y;
        
        switch (dir) {
            case 'up': newY--; break;
            case 'down': newY++; break;
            case 'left': newX--; break;
            case 'right': newX++; break;
        }
        
        // Calculate how much space this direction offers
        const safety = this.calculateSafetyDistance(newX, newY, dir);
        
        // Bonus for continuing same direction
        const continuityBonus = (dir === this.direction) ? 2 : 0;
        
        return { dir, score: safety + continuityBonus };
    });
    
    // Sort by safety score (highest first)
    scoredDirections.sort((a, b) => b.score - a.score);
    
    // Return directions in order of safety
    return scoredDirections.map(item => item.dir);
}

/**
 * Calculate safety distance (how many steps until a collision)
 */
calculateSafetyDistance(startX, startY, direction) {
    let x = startX;
    let y = startY;
    let distance = 0;
    const MAX_DISTANCE = 10; // Don't look more than 10 steps ahead
    
    while (distance < MAX_DISTANCE) {
        // Move one step in the direction
        switch (direction) {
            case 'up': y--; break;
            case 'down': y++; break;
            case 'left': x--; break;
            case 'right': x++; break;
        }
        
        // Check if this position would cause a collision
        if (this.wouldCollide(x, y)) {
            break;
        }
        
        distance++;
    }
    
    return distance;
}

/**
 * Check if a position would cause a collision with wall or self
 */
wouldCollide(x, y) {
    // Check wall collisions
    if (x < 0 || x >= this.width / this.gridSize ||
        y < 0 || y >= this.height / this.gridSize) {
        return true;
    }
    
    // Check self collisions
    for (let i = 0; i < this.snake.length; i++) {
        if (this.snake[i].x === x && this.snake[i].y === y) {
            return true;
        }
    }
    
    return false;
}
    
    /**
     * Handle game over
     */
    handleGameOver() {
        this.isRunning = false;
        
           // Reset speed if in FSD mode
    if (this.fsdMode && this.fsdSpeedAdjusted) {
        this.moveInterval = this.normalMoveInterval;
        this.fsdSpeedAdjusted = false;
    }

        // Draw game over screen
        this.drawGameOverScreen();
        
        // Call the callback after a delay
        setTimeout(() => {
            if (this.onGameOver) {
                // Pass 'lost' result if in FSD mode, since it crashes intentionally
                this.onGameOver(this.score, this.fsdMode ? 'lost' : 'lost');
            }
        }, 2000);
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
        
        // Draw snake
        this.drawSnake();
        
        // Draw battery
        this.drawBattery();
        
        // Draw UI (score)
        this.drawUI();
        
        // Draw FSD popup if active
        if (this.fsdPopupActive) {
            this.drawFSDPopup();
        }
    }
    
    /**
     * Draw the snake
     */
    drawSnake() {
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            
            // Calculate pixel coordinates
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            // Draw snake segment
            this.ctx.fillStyle = i === 0 ? '#33FF33' : '#00DD00'; // Head slightly brighter
            this.ctx.fillRect(x, y, this.gridSize, this.gridSize);
            
            // Draw segment border
            this.ctx.strokeStyle = '#004400';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, this.gridSize, this.gridSize);
            
            // Draw eyes on head segment
            if (i === 0) {
                this.ctx.fillStyle = '#000000';
                
                // Position eyes based on direction
                switch (this.direction) {
                    case 'up':
                        this.ctx.fillRect(x + 4, y + 4, 4, 4);
                        this.ctx.fillRect(x + 12, y + 4, 4, 4);
                        break;
                    case 'down':
                        this.ctx.fillRect(x + 4, y + 12, 4, 4);
                        this.ctx.fillRect(x + 12, y + 12, 4, 4);
                        break;
                    case 'left':
                        this.ctx.fillRect(x + 4, y + 4, 4, 4);
                        this.ctx.fillRect(x + 4, y + 12, 4, 4);
                        break;
                    case 'right':
                        this.ctx.fillRect(x + 12, y + 4, 4, 4);
                        this.ctx.fillRect(x + 12, y + 12, 4, 4);
                        break;
                }
            }
        }
    }
    
    /**
     * Draw the battery (food)
     */
 /**
 * Draw the battery (food)
 */
drawBattery() {
    if (!this.battery) return;
    
    // Calculate pixel coordinates
    const x = this.battery.x * this.gridSize;
    const y = this.battery.y * this.gridSize;
    
    // Draw battery body (horizontal)
    this.ctx.fillStyle = '#FFCC00'; // Battery yellow
    
    // Main battery body (horizontal rectangle)
    this.ctx.fillRect(x + 2, y + 5, this.gridSize - 7, this.gridSize - 10);
    
    // Battery terminal (small rectangle on right)
    this.ctx.fillRect(x + this.gridSize - 5, y + 7, 3, this.gridSize - 14);
    
    // Battery outline
    this.ctx.strokeStyle = '#AA8800';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x + 2, y + 5, this.gridSize - 7, this.gridSize - 10);
    
    // Draw lightning bolt in the middle
    this.ctx.fillStyle = '#FFFFFF';
    
    // Draw lightning bolt
    this.ctx.beginPath();
    this.ctx.moveTo(x + 8, y + 7); // Top left
    this.ctx.lineTo(x + 12, y + 7); // Top right
    this.ctx.lineTo(x + 9, y + 12); // Middle right
    this.ctx.lineTo(x + 13, y + 12); // Middle left
    this.ctx.lineTo(x + 9, y + 18); // Bottom left 
    this.ctx.lineTo(x + 8, y + 12); // Bottom middle
    this.ctx.lineTo(x + 5, y + 12); // Bottom right
    this.ctx.closePath();
    this.ctx.fill();
}
    
    /**
     * Draw user interface (score)
     */
    drawUI() {
        // Draw score
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px "Press Start 2P", monospace';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        
       // Draw FSD mode indicator if active
if (this.fsdMode) {
    if (this.fsdMalfunction) {
        // Display malfunction text in red with larger font
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = '20px "Press Start 2P", monospace'; // Make it bigger
        this.ctx.fillText('FSD MODE MALFUNCTION', 20, 60);
        
        // Add blinking effect for emphasis
        if (Math.floor(performance.now() / 500) % 2 === 0) {
            this.ctx.fillRect(10, 45, 10, 10); // Add warning indicator
        }
    } else {
        // Display normal FSD mode text
        this.ctx.fillStyle = '#FFA500'; // Orange
        this.ctx.font = '16px "Press Start 2P", monospace';
        this.ctx.fillText('FSD MODE ACTIVE', 20, 60);
    }
} else {
    // Draw FSD mode instruction
    this.ctx.fillStyle = '#999999';
    this.ctx.font = '12px "Press Start 2P", monospace';
    this.ctx.fillText('Press SPACE/JUMP for FSD Mode', 20, 60);
}
    }
    
    /**
     * Draw FSD mode popup
     */
    /**
 * Draw FSD mode popup
 */
drawFSDPopup() {
    // Semi-transparent background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Popup box - make it larger
    const boxWidth = 500;
    const boxHeight = 250; // Increased height
    const boxX = (this.width - boxWidth) / 2;
    const boxY = (this.height - boxHeight) / 2;
    
    // Draw box
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    
    // Draw warning stripes at top and bottom
    const stripeHeight = 30;
    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(boxX, boxY, boxWidth, stripeHeight);
    this.ctx.fillRect(boxX, boxY + boxHeight - stripeHeight, boxWidth, stripeHeight);
    
    // Draw warning text on stripes
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '16px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('WARNING', this.width / 2, boxY + 20);
    this.ctx.fillText('BETA FEATURE', this.width / 2, boxY + boxHeight - 10);
    
    // Draw warning symbol
    this.ctx.fillStyle = '#FFA500'; // Orange
    this.ctx.beginPath();
    this.ctx.moveTo(boxX + 50, boxY + 80);
    this.ctx.lineTo(boxX + 90, boxY + 150);
    this.ctx.lineTo(boxX + 10, boxY + 150);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Draw exclamation mark
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(boxX + 45, boxY + 95, 10, 35);
    this.ctx.fillRect(boxX + 45, boxY + 135, 10, 10);
    
    // Draw main text - smaller font and shorter lines
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '14px "Press Start 2P", monospace';
    this.ctx.fillText('Keep your fingers on', this.width / 2, boxY + 100);
    this.ctx.fillText('the keyboard and remain', this.width / 2, boxY + 130);
    this.ctx.fillText('attentive at all times', this.width / 2, boxY + 160);
    
    // Reset text alignment
    this.ctx.textAlign = 'left';
}
    
    /**
     * Draw game over screen
     */
    drawGameOverScreen() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // FSD mode failure messaging
        if (this.fsdMode) {
            // Draw text
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '30px "Press Start 2P", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('FSD CRASH', this.width / 2, this.height / 2 - 40);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '14px "Press Start 2P", monospace';
            this.ctx.fillText('Your snake experienced a technical issue.', this.width / 2, this.height / 2 + 20);
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 60);
        } else {
            // Standard game over text
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '30px "Press Start 2P", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 40);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '20px "Press Start 2P", monospace';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
        }
        
        this.ctx.fillText('Press ESC to exit', this.width / 2, this.height / 2 + 80);
        
        // Reset text alignment
        this.ctx.textAlign = 'left';
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
 * Integration with ArcadeApp
 * Call this function from the launchMiniGame method
 * @param {HTMLElement} containerElement - The DOM element to insert the game into
 * @param {Function} onGameOverCallback - Callback when game ends
 * @returns {SnakeGame} - Instance of the game
 */
function startSnakeGame(containerElement, onGameOverCallback, canvasWidth = 600, canvasHeight = 600) {
    console.log('Starting Snake game with container:', containerElement);
    const game = new SnakeGame(containerElement);
    game.canvasWidth = canvasWidth;
    game.canvasHeight = canvasHeight;
    game.start(onGameOverCallback);
    return game;
}
// Export the start function
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { startSnakeGame };
} else {
    // If not using modules, add to window
    window.startSnakeGame = startSnakeGame;
}