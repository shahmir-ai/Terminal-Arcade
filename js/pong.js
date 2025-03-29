/**
 * Pong Mini-Game for the Vibe Arcade
 * Classic Pong implementation using HTML5 Canvas and vanilla JavaScript
 */

// Main Pong game class
class PongGame {
    constructor(containerElement) {

        // Add these after other properties in the constructor
this.maxBallSpeedX = 0.6;   // Max horizontal speed
this.maxBallSpeedY = 0.6;   // Max vertical speed
this.initialBallSpeed = 0.35; // Initial speed when launching



        // Canvas setup
        this.containerElement = containerElement; // The element where we'll add our canvas
        this.canvas = null;                       // Will hold our canvas element
        this.ctx = null;                          // Will hold the canvas drawing context
        this.width = 600;                         // Canvas width in pixels
        this.height = 400;                        // Canvas height in pixels
        
        // Game state
        this.isRunning = false;      // Flag to track if the game is running
        this.playerScore = 0;        // Player's score
        this.aiScore = 0;            // AI's score
        this.maxScore = 5;           // Game ends when a player reaches this score
        this.gameStarted = false;    // Flag to track if the game has started
        this.ballStuckToPaddle = true; // Flag to track if the ball is stuck to the paddle
        
        // Entities
        this.playerPaddle = null;  // Will hold the player's paddle object
        this.aiPaddle = null;      // Will hold the AI's paddle object
        this.ball = null;          // Will hold the ball object
        
        // Ball images - paths to PNG files
        this.ballImages = [
            "assets/images/head1.png",
            "assets/images/head2.png",
            "assets/images/head3.png",
            "assets/images/head4.png",
            "assets/images/head5.png",
            "assets/images/head6.png",
            "assets/images/head7.png",
            "assets/images/head8.png",
            "assets/images/head9.png"
        ];
        this.ballImage = null;    // Will hold the currently selected ball image
        this.ballImageLoaded = false; // Flag to track if image loaded successfully
        
        // Game loop variables
        this.lastTime = 0;        // Last timestamp for calculating delta time
        this.animationId = null;  // ID for the animation frame (used to cancel it)
        
        // Event handling
        this.keydownHandler = this.handleKeyDown.bind(this);  // Keyboard event handler
        this.keyupHandler = this.handleKeyUp.bind(this);      // Key release handler
        this.onGameOver = null;   // Callback for when the game ends
        
        // Input tracking
        this.keys = {            // Track which keys are currently pressed
            ArrowUp: false,
            ArrowDown: false,
            Space: false
        };
        
        // Debug flag
        this.debug = false;       // Set to true to enable debug logging
    }
    
    /**
     * Initialize and start the game
     * @param {Function} onGameOverCallback - Function to call when game ends
     */
    start(onGameOverCallback) {
        if (this.debug) console.log('Starting Pong game...');
        
        // Store the callback function for later use
        this.onGameOver = onGameOverCallback;
        
        // Create canvas element with the requested dimensions
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvasWidth || this.width;
        this.canvas.height = this.canvasHeight || this.height;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        this.canvas.style.backgroundColor = '#000000';
        this.canvas.style.border = '2px solid #FFFFFF';
        
        // Get the canvas drawing context (2D)
        this.ctx = this.canvas.getContext('2d');
        
        // Apply scaling
        const scaleX = this.canvasWidth / this.width;
        const scaleY = this.canvasHeight / this.height;
        this.ctx.scale(scaleX, scaleY);
        
        // Add canvas to the container
        if (this.containerElement) {
            this.containerElement.appendChild(this.canvas);
            if (this.debug) console.log('Canvas added to container');
        } else {
            console.error('Container element is null or undefined');
            return;
        }
        
        // Initialize game entities (paddles and ball)
        this.initEntities();
        if (this.debug) console.log('Game entities initialized');
        
        // Load a random ball image
        this.loadBallImage();
        
        // Add keyboard event listeners
        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
        if (this.debug) console.log('Event listeners added');
        
        // Start game loop
        this.isRunning = true;
        this.gameStarted = true;
        this.ballStuckToPaddle = true; // Start with ball stuck to paddle
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
        
        // Draw initial instructions
        this.drawStartPrompt();
        
        console.log('Pong game started');
    }
    
    /**
     * Stop the game and clean up resources
     */
    stop() {
        // Set running flag to false to stop the game loop
        this.isRunning = false;
        
        // Cancel the animation frame to stop the loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Remove event listeners to prevent memory leaks
        window.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('keyup', this.keyupHandler);
        
        // Remove canvas from container
        if (this.canvas && this.containerElement && this.containerElement.contains(this.canvas)) {
            this.containerElement.removeChild(this.canvas);
        }
        
        console.log('Pong game stopped');
    }
    
    /**
     * Initialize game entities (paddles and ball)
     */
    initEntities() {
        // Create player paddle (left side)
        this.playerPaddle = {
            x: 50,                       // X position (left side of screen)
            y: this.height / 2 - 40,     // Y position (centered vertically)
            width: 10,                   // Width of paddle
            height: 80,                  // Height of paddle
            speed: 0.4,                  // Speed in pixels per millisecond
            color: '#FFFFFF'             // White color
        };
        
      // Create AI paddle (right side)
this.aiPaddle = {
    x: this.width - 60,          // X position (right side of screen)
    y: this.height / 2 - 40,     // Y position (centered vertically)
    width: 10,                   // Width of paddle
    height: 80,                  // Height of paddle
    speed: 0.2,                  // CHANGE THIS VALUE FROM 0.3 TO 0.2
    color: '#FFFFFF'             // White color
};
        
        // Create ball with larger radius (3x original size)
        this.ball = {
            x: this.width / 2,           // X position (center of screen)
            y: this.height / 2,          // Y position (center of screen)
            radius: 30,                  // Radius of ball in pixels (3x larger)
            speedX: 0.3,                 // Initial X speed (will be set on launch)
            speedY: 0.1,                 // Initial Y speed (will be set on launch)
            color: '#FFFFFF'             // White color (fallback if image fails)
        };
    }
    
    /**
     * Load a random ball image
     */
   /**
 * Load a random ball image
 */
loadBallImage() {
    try {
        // Reset the image loaded flag
        this.ballImageLoaded = false;
        
        // Get all available images except the current one (if any)
        let availableImages = [...this.ballImages];
        
        // If we already have an image, try to avoid repeating it
        if (this.ballImage && this.ballImage.src) {
            const currentPath = this.ballImage.src.split('/').pop(); // Get just the filename
            availableImages = availableImages.filter(path => !path.includes(currentPath));
            
            // If we filtered out all images, restore the full list
            if (availableImages.length === 0) {
                availableImages = [...this.ballImages];
            }
        }
        
        // Choose a random ball image from the available options
        const randomIndex = Math.floor(Math.random() * availableImages.length);
        const imagePath = availableImages[randomIndex];
        
        console.log(`Loading ball image: ${imagePath}`);
        
        // Create and load the image
        this.ballImage = new Image();
        
        // Set up event handlers
        this.ballImage.onload = () => {
            console.log(`Ball image loaded successfully: ${imagePath}`);
            this.ballImageLoaded = true;
        };
        
        this.ballImage.onerror = (err) => {
            console.warn(`Failed to load ball image: ${imagePath}`, err);
            
            // Try the first image as a fallback
            if (imagePath !== this.ballImages[0]) {
                console.log(`Falling back to first image: ${this.ballImages[0]}`);
                this.ballImage.src = this.ballImages[0];
            } else {
                // If even the first image fails, try the second
                if (this.ballImages.length > 1) {
                    console.log(`Trying second image: ${this.ballImages[1]}`);
                    this.ballImage.src = this.ballImages[1];
                }
            }
        };
        
        // Start loading the image
        this.ballImage.src = imagePath;
    } catch (error) {
        console.error('Error in loadBallImage:', error);
        this.tryNextImage(0);
    }
}
    
    /**
     * Try loading the next image in the array
     * @param {number} index - Current index to try
     */
    tryNextImage(index) {
        if (index >= this.ballImages.length) {
            console.error("All images failed to load");
            return;
        }
        
        this.ballImage = new Image();
        this.ballImage.onload = () => {
            this.ballImageLoaded = true;
        };
        this.ballImage.onerror = () => {
            this.tryNextImage(index + 1);
        };
        this.ballImage.src = this.ballImages[index];
    }
    
    /**
     * Launch the ball from the paddle
     */
    launchBall() {
        // Generate a random angle between -45 and 45 degrees
        const angle = (Math.random() * 90 - 45) * Math.PI / 180;
        
        // Set the ball's velocity based on the angle
        this.ball.speedX = this.initialBallSpeed * Math.cos(angle);
        this.ball.speedY = this.initialBallSpeed * Math.sin(angle);
        
        // Ensure the ball always moves to the right initially
        if (this.ball.speedX < 0) {
            this.ball.speedX = -this.ball.speedX;
        }
        
        // No longer stuck to paddle
        this.ballStuckToPaddle = false;
    }
    
    /**
     * Handle keydown events for paddle movement and ball launch
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown(event) {
        // Only process keydown if game is running
        if (!this.isRunning) return;
        
        // Stop propagation to prevent background controls from activating
        event.stopPropagation();
        
        // Handle game controls
        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
            this.keys[event.code] = true;
            event.preventDefault(); // Prevent page scrolling
        } else if (event.code === 'Space') {
            this.keys.Space = true;
            
            // Launch the ball if it's stuck to the paddle
            if (this.ballStuckToPaddle) {
                this.launchBall();
            }
            
            event.preventDefault();
        } else if (event.code === 'Escape') {
            // Exit the game when ESC is pressed
            if (this.onGameOver) {
                this.onGameOver(Math.max(this.playerScore, this.aiScore));
            }
        }
    }
    
    /**
     * Handle keyup events to stop paddle movement
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyUp(event) {
        // Only process keyup if game is running
        if (!this.isRunning) return;
        
        // Stop propagation
        event.stopPropagation();
        
        // Handle game controls
        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
            this.keys[event.code] = false;
            event.preventDefault();
        } else if (event.code === 'Space') {
            this.keys.Space = false;
            event.preventDefault();
        }
    }
    
    /**
     * Update game state
     * @param {number} deltaTime - Time since last frame in milliseconds
     */
    update(deltaTime) {
        // Update player paddle based on keyboard input
        this.updatePlayerPaddle(deltaTime);
        
        if (this.ballStuckToPaddle) {
            // Keep ball at player paddle if stuck
            this.stickBallToPaddle();
        } else {
            // Update AI paddle to follow the ball
            this.updateAIPaddle(deltaTime);
            
            // Update ball position and handle collisions
            this.updateBall(deltaTime);
            
            // Check for scoring
            this.checkScoring();
        }
        
        // Check if game is over
        this.checkGameOver();
    }
    
    /**
     * Keep the ball stuck to the player's paddle
     */
    stickBallToPaddle() {
        // Position the ball just to the right of the player's paddle
        this.ball.x = this.playerPaddle.x + this.playerPaddle.width + this.ball.radius;
        
        // Center the ball vertically on the paddle
        this.ball.y = this.playerPaddle.y + this.playerPaddle.height / 2;
    }
    
    /**
     * Update player paddle position based on input
     * @param {number} deltaTime - Time since last frame
     */
    updatePlayerPaddle(deltaTime) {
        // Move up if up arrow is pressed and not at top edge
        if (this.keys['ArrowUp'] && this.playerPaddle.y > 0) {
            this.playerPaddle.y -= this.playerPaddle.speed * deltaTime;
        }
        
        // Move down if down arrow is pressed and not at bottom edge
        if (this.keys['ArrowDown'] && this.playerPaddle.y + this.playerPaddle.height < this.height) {
            this.playerPaddle.y += this.playerPaddle.speed * deltaTime;
        }
        
        // Ensure paddle stays within bounds
        this.playerPaddle.y = Math.max(0, Math.min(this.height - this.playerPaddle.height, this.playerPaddle.y));
    }
    
    /**
     * Update AI paddle position to follow the ball
     * @param {number} deltaTime - Time since last frame
     */
    updateAIPaddle(deltaTime) {
        // Calculate the center of the AI paddle
        const paddleCenter = this.aiPaddle.y + this.aiPaddle.height / 2;
        
        // Target position is the ball's Y position
        let targetY = this.ball.y;
        
        // Add some prediction based on ball direction and distance
        if (this.ball.speedX > 0) { // Ball is moving toward AI
            // Calculate how far the ball is from the AI paddle
            const distanceX = this.aiPaddle.x - this.ball.x;
            
            // Add prediction based on ball's trajectory - LESS ACCURATE PREDICTION
            // Only predict correctly 70% of the time
            if (Math.random() > 0.3) {
                targetY += this.ball.speedY * (distanceX / this.ball.speedX) * 0.85; // 85% accurate prediction
            } else {
                // Intentionally predict wrong sometimes
                targetY += this.ball.speedY * (distanceX / this.ball.speedX) * (Math.random() > 0.5 ? 1.5 : 0.5);
            }
        }
        
        // Add more randomness to make the AI less perfect - INCREASE RANDOMNESS
        targetY += (Math.random() - 0.5) * 40; // Increased from 20 to 40
        
        // Add some reaction delay - INCREASE REACTION THRESHOLD
        // Only move if ball is more than 25px away (increased from 10px)
        if (paddleCenter < targetY - 25) {
            // Move down
            this.aiPaddle.y += this.aiPaddle.speed * deltaTime;
        } else if (paddleCenter > targetY + 25) {
            // Move up
            this.aiPaddle.y -= this.aiPaddle.speed * deltaTime;
        }
        
        // ADD OCCASOINAL MISTAKES - NEW CODE
        // Randomly pause AI movement to simulate human error (5% chance per frame)
        if (Math.random() < 0.05) {
            // Don't move for this frame
            return;
        }
        
        // Ensure paddle stays within bounds
        this.aiPaddle.y = Math.max(0, Math.min(this.height - this.aiPaddle.height, this.aiPaddle.y));
    }
    
    /**
     * Update ball position and handle collisions
     * @param {number} deltaTime - Time since last frame
     */
    updateBall(deltaTime) {
        // Update ball position based on its speed
        this.ball.x += this.ball.speedX * deltaTime;
        this.ball.y += this.ball.speedY * deltaTime;
        
        // Handle top and bottom collisions (bounce)
        if (this.ball.y - this.ball.radius < 0) {
            // Hit top wall - bounce down
            this.ball.y = this.ball.radius; // Prevent sticking to the wall
            this.ball.speedY = Math.abs(this.ball.speedY); // Ensure speed is positive (downward)
        } else if (this.ball.y + this.ball.radius > this.height) {
            // Hit bottom wall - bounce up
            this.ball.y = this.height - this.ball.radius; // Prevent sticking to the wall
            this.ball.speedY = -Math.abs(this.ball.speedY); // Ensure speed is negative (upward)
        }
        
        // Prevent horizontal stalemate by adding small vertical component if needed
        this.preventHorizontalStalemate();
        
        // Handle paddle collisions
        this.handlePaddleCollisions();

            // ADD THIS LINE: Enforce speed limits
    this.enforceBallSpeedLimits();

        
    }
    
    /**
     * Prevent horizontal stalemate by adding vertical component if needed
     */
    preventHorizontalStalemate() {
        // If ball is moving almost perfectly horizontally
        if (Math.abs(this.ball.speedY) < 0.05) {
            // Add a small random vertical component
            this.ball.speedY += (Math.random() - 0.5) * 0.1;
        }
        
        // Cap the maximum reflection angle to avoid extremely vertical bounces
        const maxSpeedRatio = 1.2; // REDUCE FROM 2.0 TO 1.2
        if (Math.abs(this.ball.speedY) > Math.abs(this.ball.speedX) * maxSpeedRatio) {
            this.ball.speedY = Math.sign(this.ball.speedY) * Math.abs(this.ball.speedX) * maxSpeedRatio;
        }
    }
    
    /**
 * Enforce speed limits on the ball
 */
enforceBallSpeedLimits() {
    // Hard cap on X speed
    if (Math.abs(this.ball.speedX) > this.maxBallSpeedX) {
        this.ball.speedX = Math.sign(this.ball.speedX) * this.maxBallSpeedX;
    }
    
    // Hard cap on Y speed
    if (Math.abs(this.ball.speedY) > this.maxBallSpeedY) {
        this.ball.speedY = Math.sign(this.ball.speedY) * this.maxBallSpeedY;
    }
}
    /**
     * Handle collisions between the ball and paddles
     */
    handlePaddleCollisions() {
        // Player paddle collision (left side)
        if (
            this.ball.x - this.ball.radius < this.playerPaddle.x + this.playerPaddle.width &&
            this.ball.x + this.ball.radius > this.playerPaddle.x &&
            this.ball.y + this.ball.radius > this.playerPaddle.y &&
            this.ball.y - this.ball.radius < this.playerPaddle.y + this.playerPaddle.height
        ) {
            // Ball hit player paddle
            this.ball.x = this.playerPaddle.x + this.playerPaddle.width + this.ball.radius; // Prevent sticking
            this.ball.speedX = Math.abs(this.ball.speedX); // Ensure ball moves right
            
            // Add some variation based on where the ball hit the paddle
            const hitPosition = (this.ball.y - this.playerPaddle.y) / this.playerPaddle.height;
            
            // Calculate new Y speed based on hit position (more extreme at edges)
            this.ball.speedY = (hitPosition - 0.5) * 1.5 * Math.abs(this.ball.speedX); // Reduced multiplier from 2 to 1.5
            
            // Add slight speed increase to make game progressively harder
            const speedFactor = 1.05;
            this.ball.speedX *= speedFactor;
            this.ball.speedY *= speedFactor;

             // CAP BALL SPEED - ADD THIS CODE
        // Cap the ball's speed to prevent it from getting too fast
        const currentSpeedMagnitude = Math.sqrt(this.ball.speedX * this.ball.speedX + this.ball.speedY * this.ball.speedY);
        if (currentSpeedMagnitude > this.maxBallSpeed) {
            // Scale down both speeds proportionally
            const scaleFactor = this.maxBallSpeed / currentSpeedMagnitude;
            this.ball.speedX *= scaleFactor;
            this.ball.speedY *= scaleFactor;
        }
        }
        
        // AI paddle collision (right side)
        if (
            this.ball.x + this.ball.radius > this.aiPaddle.x &&
            this.ball.x - this.ball.radius < this.aiPaddle.x + this.aiPaddle.width &&
            this.ball.y + this.ball.radius > this.aiPaddle.y &&
            this.ball.y - this.ball.radius < this.aiPaddle.y + this.aiPaddle.height
        ) {
            // Ball hit AI paddle
            this.ball.x = this.aiPaddle.x - this.ball.radius; // Prevent sticking
            this.ball.speedX = -Math.abs(this.ball.speedX); // Ensure ball moves left
            
            // Add some variation based on where the ball hit the paddle
            const hitPosition = (this.ball.y - this.aiPaddle.y) / this.aiPaddle.height;
            
            // Add more randomness to AI bounce to avoid predictable patterns
            const randomFactor = (Math.random() * 0.4) - 0.2; // Random value between -0.2 and 0.2
            this.ball.speedY = ((hitPosition - 0.5) * 1.5 * Math.abs(this.ball.speedX)) + randomFactor;
            
            // Add slight speed increase
            const speedFactor = 1.05;
            this.ball.speedX *= speedFactor;
            this.ball.speedY *= speedFactor;
        }
    }
    
    /**
     * Check if a point has been scored
     */
    checkScoring() {
        // Check if ball went past player paddle (AI scores)
        if (this.ball.x < 0) {
            this.aiScore++;
            this.resetAfterPoint(-1); // Ball will go towards player (right)
        }
        
        // Check if ball went past AI paddle (player scores)
        if (this.ball.x > this.width) {
            this.playerScore++;
            this.resetAfterPoint(1); // Ball will go towards AI (left)
        }
    }
    
/**
 * Reset after a point is scored
 * @param {number} direction - Which player scored (-1 for AI, 1 for player)
 */
resetAfterPoint(direction) {
    // Reset the ball position to center
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    
    // Stick the ball to the player's paddle
    this.ballStuckToPaddle = true;
    
    // Load a new random ball image
    this.loadBallImage();
}
    

/**
 * Check if the game is over (a player reached max score)
 */
/**
 * Check if the game is over (a player reached max score)
 */
checkGameOver() {
    if (this.playerScore >= this.maxScore || this.aiScore >= this.maxScore) {
        // Determine winner
        const isPlayerWin = this.playerScore > this.aiScore;
        
        // Draw game over screen
        this.drawGameOver(isPlayerWin);
        
        // Stop the game
        this.isRunning = false;
        
        // Force one more draw to ensure game over screen is displayed
        requestAnimationFrame(() => this.drawGameOver(isPlayerWin));
        
        // Call the game over callback after a delay
        setTimeout(() => {
            if (this.onGameOver) {
                // Pass 'won' or 'lost' based on who won
                this.onGameOver(Math.max(this.playerScore, this.aiScore), isPlayerWin ? 'won' : 'lost');
            }
        }, 5000); // 5 seconds
    }
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
        
        // Draw center line
        this.drawCenterLine();
        
        // Draw score
        this.drawScore();
        
        // Draw paddles
        this.drawPaddle(this.playerPaddle);
        this.drawPaddle(this.aiPaddle);
        
        // Draw ball
        this.drawBall();
        
        // Draw "Press SPACE to start" if ball is stuck
        if (this.ballStuckToPaddle) {
            this.drawStartPrompt();
        }
        
        // Draw debug info if enabled
        if (this.debug) {
            this.drawDebugInfo();
        }
    }
    
    /**
     * Draw "Press SPACE to start" prompt
     */
    drawStartPrompt() {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press SPACE/JUMP to start', this.width / 2, this.height - 50);
    }
    
    /**
     * Draw debug information
     */
    drawDebugInfo() {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(`Ball: ${Math.round(this.ball.x)},${Math.round(this.ball.y)} Speed: ${this.ball.speedX.toFixed(2)},${this.ball.speedY.toFixed(2)}`, 10, this.height - 10);
        this.ctx.fillText(`Image Loaded: ${this.ballImageLoaded}`, 10, this.height - 25);
        this.ctx.fillText(`Ball Stuck: ${this.ballStuckToPaddle}`, 10, this.height - 40);
    }
    
    /**
     * Draw the center line
     */
    drawCenterLine() {
        if (!this.ctx) return;
        
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.setLineDash([10, 10]); // Dashed line
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset to solid line
    }
    
    /**
     * Draw the score
     */
    drawScore() {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '48px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        
        // Player score (left side)
        this.ctx.fillText(this.playerScore.toString(), this.width / 4, 50);
        
        // AI score (right side)
        this.ctx.fillText(this.aiScore.toString(), (this.width / 4) * 3, 50);
    }
    
    /**
     * Draw a paddle
     * @param {Object} paddle - The paddle object to draw
     */
    drawPaddle(paddle) {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = paddle.color;
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    }
    
    /**
     * Draw the ball
     */
    drawBall() {
        if (!this.ctx) return;
        
        // Try to draw the image if it's loaded
        if (this.ballImage && this.ballImageLoaded) {
            try {
                // Draw the image 3x larger than before
                this.ctx.drawImage(
                    this.ballImage,
                    this.ball.x - this.ball.radius,
                    this.ball.y - this.ball.radius,
                    this.ball.radius * 2, // Width
                    this.ball.radius * 2  // Height
                );
            } catch (error) {
                console.error('Error drawing ball image:', error);
                // Fall back to circle on error
                this.drawFallbackBall();
            }
        } else {
            // Draw a simple circle if image not loaded
            this.drawFallbackBall();
            
            // If we somehow got here without a loaded image, try again
            if (!this.ballImageLoaded) {
                this.loadBallImage();
            }
        }
    }
    
    /**
     * Draw a fallback circle for the ball
     */
    drawFallbackBall() {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = this.ball.color;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
 * Draw game over screen
 * @param {boolean} isPlayerWin - Whether the player won
 */
drawGameOver(isPlayerWin) {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Game over text
    this.ctx.fillStyle = '#FF0000';
    this.ctx.font = '36px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 40);
    
    // Winner text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '24px "Press Start 2P", monospace';
    this.ctx.fillText(
        isPlayerWin ? 'YOU WIN!' : 'YOU LOSE!',
        this.width / 2,
        this.height / 2 + 20
    );
    
    // Final score
    this.ctx.font = '18px "Press Start 2P", monospace';
    this.ctx.fillText(
        `${this.playerScore} - ${this.aiScore}`,
        this.width / 2,
        this.height / 2 + 60
    );
    
    // Add returning to arcade message
    this.ctx.font = '16px "Press Start 2P", monospace';
    this.ctx.fillText(
        'Returning to arcade...',
        this.width / 2,
        this.height / 2 + 100
    );
}

    /**
 * Draw win screen
 */
drawWinScreen() {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Victory text
    this.ctx.fillStyle = '#00FF00'; // Green for winning
    this.ctx.font = '40px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('YOU WIN!', this.width/2, this.height/2 - 40);
    
    // Score text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '20px "Press Start 2P", monospace';
    this.ctx.fillText(`Final Score: ${this.score}`, this.width/2, this.height/2 + 20);
    this.ctx.fillText('Press ESC to exit', this.width/2, this.height/2 + 60);
    
    this.ctx.textAlign = 'left'; // Reset alignment
}
    
    /**
     * Main game loop
     * @param {number} timestamp - Current timestamp
     */
    gameLoop(timestamp) {
        // Don't continue if game is stopped
        if (!this.isRunning) return;
        
        try {
            // Calculate time since last frame
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;
            
            // Update game state
            this.update(deltaTime);
            
            // Draw the game
            this.draw();
            
            // Request next frame
            this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
        } catch (error) {
            console.error('Error in game loop:', error);
            this.isRunning = false;
        }
    }
}

/**
 * Integration with ArcadeApp
 * Call this function from the launchMiniGame method
 * @param {HTMLElement} containerElement - The DOM element to insert the game into
 * @param {Function} onGameOverCallback - Callback when game ends
 * @returns {PongGame} - Instance of the game
 */
function startPongGame(containerElement, onGameOverCallback, canvasWidth = 600, canvasHeight = 400) {
    console.log('Starting Pong game with container:', containerElement);
    const game = new PongGame(containerElement);
    game.canvasWidth = canvasWidth;
    game.canvasHeight = canvasHeight;
    game.start(onGameOverCallback);
    return game;
}
// Export the start function
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { startPongGame };
} else {
    // If not using modules, add to window
    window.startPongGame = startPongGame;
}