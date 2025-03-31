// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    const app = new ArcadeApp();
    app.init();
});

/**
 * Main application class for the Vibe Arcade game
 */
class ArcadeApp {
    constructor() {
        // Set up class properties
        this.container = document.getElementById('game-container');
        this.loadingScreen = document.getElementById('loading-screen');
        
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Arcade environment
        this.arcadeRoom = {
            floor: null,
            walls: []
        };
        
        // Game state
        this.isLoading = true;
        
        // Bind methods to this context
        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        

        // Movement properties
this.moveSpeed = 0.2; // Adjustable movement speed
// Add these properties in the constructor after the moveSpeed
this.verticalAngle = 0; // Current vertical angle
this.maxLookUp = Math.PI / 9; // ~30 degrees up
this.maxLookDown = Math.PI / 9; // ~30 degrees down
this.lookReturnSpeed = 0.02; // Auto-return speed
this.lookSpeed = 0.02; // Look speed


this.verticalRotation = 0; // Current vertical rotation
this.maxVerticalRotation = Math.PI / 9; // Limit how far up (30 degrees)
this.minVerticalRotation = -Math.PI / 9; // Limit how far down (-30 degrees)
this.verticalReturnSpeed = 0.05; // How fast it returns to neutral
this.verticalRotationSpeed = 0.03; // How fast it rotates up/down
this.keyStates = {}; // Track which keys are currently pressed
this.username = ''; // Store the player's username
this.onKeyDown = this.onKeyDown.bind(this); // Bind keyboard handler
this.onKeyUp = this.onKeyUp.bind(this); // Bind keyboard release handler

// Jump properties
this.jumpHeight = 1.5;     // Maximum jump height 
this.jumpVelocity = 0;     // Current vertical velocity
this.gravity = 0.011;      // Gravity force applied each frame
this.isJumping = false;    // Tracks jump state
this.groundLevel = 4;      // Your default camera height (matches your init position)

// Audio properties
this.audioLoaded = false;
this.sounds = {};
this.backgroundMusic = null;
this.musicVolume = 0.12; // Default music volume (12%)
this.soundVolume = 0.45; // Default sound effects volume (45%)
this.lastFootstepTime = 0;     // Tracks when the last footstep sound played
this.footstepInterval = 400;   // Milliseconds between footstep sounds
this.audioInitialized = false;
 
// Font for neon sign
this.neonFont = null;


    }
    init() {
        console.log('Initializing Vibe Arcade...');
        
        // Check if user is coming from a portal
        this.portalParams = this.parsePortalParams();
        
        // Create the scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x121212);
        
        // Create camera and renderer first
        const aspectRatio = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(70, aspectRatio, 0.1, 1000);
        this.camera.position.set(0, 4, 15);
        this.camera.lookAt(0, 4, -17);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // Set up orbit controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        }
    
        // Load audio
        this.loadAudio();
        // Load font for neon sign
        this.loadNeonFont();
    
        // Create the room and lighting in the correct order
        this.createArcadeRoom();
        this.addBalancedLighting();     
        this.createCeilingLights();     
        this.applyRoomTextures();       
        this.fixWalls();                
        
        // Create and place arcade machines
        this.placeArcadeMachines();
    
        // Add decorative elements
        this.createBarrelWithPlant();
        this.createWallDecorations();
        
        // Create hallway and door
        this.createHallway();
        this.createDoor();
    
        // Set up common event listeners for both portal and normal entry
        window.addEventListener('resize', this.onWindowResize, false);
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    
        // Handle portal entry if coming from another game
        if (this.portalParams.fromPortal) {
            // Skip username modal and use provided username
            this.username = this.portalParams.username;
            
            // Create user display
            this.createUsernameDisplay();
            this.createFpsCounter();
            
            // Position player near entrance
            this.camera.position.set(2, 4, 12); // Near entrance of arcade
            this.camera.lookAt(0, 4, -17);
            
            // Create return portal
            this.createReturnPortal();
            
            // Enable controls directly
            this.enableControls();

            
            
            // Start background music
            this.playBackgroundMusic();
            
            // Show welcome message for portal entrants
            this.showInteractionFeedback(`Welcome, ${this.username}!`);

              // Create a temporary invisible button that we'll auto-click to start audio


            } else {
            // Normal game start with username modal
            // No need to set up event listeners again - they're now set up above
            
            // Show username modal
            this.disableControls();
            this.showUsernameModal();
        }
        
        // Start animation loop
        this.animate();

        // Add this line:
this.setupMobileControls(); // Set up mobile touch controls if on a mobile device

    }



/**
 * Load and set up all audio for the game
 */
loadAudio() {
    console.log('Loading audio files...');
    
    // Create an Audio Listener and add it to the camera
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);
    
    // Function to load a sound
    const loadSound = (name, path, loop = false, volume = this.soundVolume) => {
        // Create audio object
        const sound = new THREE.Audio(this.listener);
        
        // Load audio file
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(
            path,
            (buffer) => {
                sound.setBuffer(buffer);
                sound.setLoop(loop);
                sound.setVolume(volume);
                this.sounds[name] = sound;
                console.log(`Loaded sound: ${name}`);
                
                // If this is the last sound, mark audio as loaded
                if (name === 'gameOver') {
                    this.audioLoaded = true;
                    console.log('All audio loaded successfully!');
                }
            },
            (xhr) => {
                // Loading progress
                console.log(`${name} ${(xhr.loaded / xhr.total * 100).toFixed(0)}% loaded`);
            },
            (error) => {
                console.error(`Error loading sound ${name}:`, error);
            }
        );
        return sound;
    };
    
    // Load background music (looping)
    this.backgroundMusic = loadSound('backgroundMusic', 'assets/sounds/arcade_ambient.mp3', true, this.musicVolume);
    
    // Load sound effects
    loadSound('interaction', 'assets/sounds/button_press.mp3');
    loadSound('jump', 'assets/sounds/jump.mp3');
    loadSound('elevator', 'assets/sounds/elevator.mp3');
    loadSound('gameOver', 'assets/sounds/game_over.mp3');
    loadSound('footstep', 'assets/sounds/footstep.mp3');

}

/**
 * Load the font required for the neon sign
 */
loadNeonFont() {
    console.log('Loading neon font...');
    const loader = new THREE.FontLoader();
    loader.load(
        'assets/fonts/neon.typeface.json', // Path to the NEW font file
        // onLoad callback
        (font) => {
            console.log('Neon font loaded successfully.');
            this.neonFont = font;
            // Now that the font is loaded, create the sign
            this.createNeonSign();
        },
        // onProgress callback (optional)
        (xhr) => {
            console.log(`Neon font ${(xhr.loaded / xhr.total * 100).toFixed(0)}% loaded`);
        },
        // onError callback
        (error) => {
            console.error('Error loading neon font:', error);
        }
    );
}

/**
 * Create the 3D neon sign geometry and add it to the scene
 */
createNeonSign() {
    // Guard clause: Don't proceed if the font hasn't loaded
    if (!this.neonFont) {
        console.error('Cannot create neon sign: Font not loaded yet.');
        return;
    }
    
    console.log('Creating neon sign...');

    // 1. Define Material (Simple bright green)
    const neonMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    // 2. Create Text Geometry ("VIBEVERSE PORTAL")
    const textGeometry = new THREE.TextGeometry('VIBEVERSE PORTAL', {
        font: this.neonFont,
        size: 0.3,   // <<< EDIT THIS: Controls text size
        height: 0.05, // <<< EDIT THIS: Controls text depth/thickness
        curveSegments: 12,
        bevelEnabled: false
    });
    // Center the text geometry origin for easier positioning
    textGeometry.computeBoundingBox();
    const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
    textGeometry.translate(-textWidth / 2, 0, 0);

    const textMesh = new THREE.Mesh(textGeometry, neonMaterial);

    // 3. Create Arrow Geometry ("-->") using TubeGeometry
    const arrowPath = new THREE.CurvePath();
    // Define points for the arrow shape (adjust as needed)
    const arrowStartX = textWidth / 2 - 1.15; // <<< EDIT THIS: Arrow horizontal start position relative to text end
    const arrowY = -0.5; // <<< EDIT THIS: Arrow vertical position relative to text baseline
    const arrowLength = 1.0; // <<< EDIT THIS: Length of the arrow shaft
    const arrowheadSize = 0.3; // <<< EDIT THIS: Size of the arrowhead lines

    // Curved Shaft using Quadratic Bezier Curve
    const startPoint = new THREE.Vector3(arrowStartX, arrowY, 0);
    const endPoint = new THREE.Vector3(arrowStartX + arrowLength, arrowY, 0);
    // Control point - offset vertically from the midpoint for a curve
    const controlPoint = new THREE.Vector3(
        arrowStartX + arrowLength / 2,
        arrowY - 0.2, // <<< EDIT THIS: Y-offset of curve control point (changes curve amount/direction)
        0
    );
    arrowPath.add(new THREE.QuadraticBezierCurve3(startPoint, controlPoint, endPoint));

    // Arrowhead lines - adjust start position to match the end of the curve
    arrowPath.add(new THREE.LineCurve3(
        endPoint, // Start from the curve's end point
        new THREE.Vector3(endPoint.x - arrowheadSize, endPoint.y + arrowheadSize, 0)
    ));
     arrowPath.add(new THREE.LineCurve3(
        endPoint, // Start from the curve's end point
        new THREE.Vector3(endPoint.x - arrowheadSize, endPoint.y - arrowheadSize, 0)
    ));

    const tubeGeometry = new THREE.TubeGeometry(
        arrowPath,
        20,    // tubularSegments (smoothness)
        0.02,  // <<< EDIT THIS: radius (thickness of the tube)
        8,     // radialSegments (roundness)
        false  // closed
    );
    const arrowMesh = new THREE.Mesh(tubeGeometry, neonMaterial);
    // No need to position arrowMesh separately if path coordinates are relative to text center

    // 4. Grouping
    const signGroup = new THREE.Group();
    signGroup.add(textMesh);
    signGroup.add(arrowMesh); // Add the combined arrow mesh

    // 5. Positioning the entire sign group
    // Position: Top-left on the North wall (z = -17.5)
    // <<< EDIT THESE (X, Y, Z): Overall position of the sign group
    signGroup.position.set(-3, 6.5, -17.4); // x=Left/Right, y=Up/Down, z=Forward/Backward
    // Optional: Rotate slightly if needed
    // signGroup.rotation.y = Math.PI / 12; // Example slight rotation

    // 6. Add Group to Scene
    this.scene.add(signGroup);

    console.log('Neon sign added to scene.');
}

    /**
     * Create the arcade room with floor and walls
     */
/**
 * Create a corridor-style arcade room with floor and walls
 */
createArcadeRoom() {
    // 1. Create the floor - now 12x35 for a corridor layout (narrower and shorter)
    const floorGeometry = new THREE.PlaneGeometry(12, 35); // 12 units wide, 35 units long
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333, // Dark gray
        roughness: 1, // Slightly rough surface
        metalness: 0 // Slightly metallic
    });
    
    // Create the floor mesh and add it to the scene
    this.arcadeRoom.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    // Rotate the floor to be horizontal (by default it's vertical)
    this.arcadeRoom.floor.rotation.x = -Math.PI / 2; // Rotate 90 degrees
    // Add the floor to the scene
    this.scene.add(this.arcadeRoom.floor);
    
    console.log('Added corridor floor (12x35) to scene');
    
    // 2. Create the walls - sized to match the 12x35 floor
    // North and South walls (short ends of corridor)
    const shortWallGeometry = new THREE.BoxGeometry(12, 8, 0.2); // width, height, thickness
    // East and West walls (long sides of corridor)
    const longWallGeometry = new THREE.BoxGeometry(35, 8, 0.2); // width, height, thickness
    
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222, // Darker gray for walls
        roughness: 1,
        metalness: 0
    });
    
    // Create four walls and position them around the floor
    
    // North wall (back)
    const northWall = new THREE.Mesh(shortWallGeometry, wallMaterial);
    northWall.position.set(0, 4, -17.5); // Center x, half height, -z edge of floor
    this.arcadeRoom.walls.push(northWall);
    this.scene.add(northWall);
    
    // COMPLETELY REBUILD SOUTH WALL WITH PROPER DOORWAY
    // South wall (front) with doorway
    const doorWidth = 2.6;  // Wider door (1.3x original)
    const doorHeight = 6.0; // Taller door (1.5x original)
    const wallWidth = 12;   // Total wall width
    const wallHeight = 8;   // Total wall height
    const doorPositionX = -wallWidth/4; // Door position (left of center)
    
    // Calculate door boundaries
    const doorLeft = doorPositionX - doorWidth/2;
    const doorRight = doorPositionX + doorWidth/2;
    
    console.log(`Creating doorway: width=${doorWidth}, height=${doorHeight}, position=${doorPositionX}`);
    
    // Create left section of wall
    if (doorLeft > -6) { // Only if there's space to the left of the door
        const leftWidth = doorLeft + 6; // From left edge to left side of door
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(leftWidth, wallHeight, 0.2),
            wallMaterial
        );
        leftWall.position.set(-6 + leftWidth/2, wallHeight/2, 17.5);
        this.arcadeRoom.walls.push(leftWall);
        this.scene.add(leftWall);
        console.log(`Created left wall section: width=${leftWidth}`);
    }
    
    // Create right section of wall
    if (doorRight < 6) { // Only if there's space to the right of the door
        const rightWidth = 6 - doorRight; // From right side of door to right edge
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(rightWidth, wallHeight, 0.2),
            wallMaterial
        );
        rightWall.position.set(doorRight + rightWidth/2, wallHeight/2, 17.5);
        this.arcadeRoom.walls.push(rightWall);
        this.scene.add(rightWall);
        console.log(`Created right wall section: width=${rightWidth}`);
    }
    
    // Create top section of wall (if door doesn't reach ceiling)
    if (doorHeight < wallHeight) {
        const topWall = new THREE.Mesh(
            new THREE.BoxGeometry(doorWidth, wallHeight - doorHeight, 0.2),
            wallMaterial
        );
        // Position at the top of the doorway
        topWall.position.set(doorPositionX, doorHeight + (wallHeight - doorHeight)/2, 17.5);
        this.arcadeRoom.walls.push(topWall);
        this.scene.add(topWall);
        console.log(`Created top wall section: width=${doorWidth}, height=${wallHeight - doorHeight}`);
    }
    
    // Debug message
    console.log(`Created doorway at x=${doorPositionX}, width=${doorWidth}, height=${doorHeight}`);
    
    // East wall (right)
    const eastWall = new THREE.Mesh(longWallGeometry, wallMaterial);
    eastWall.position.set(6, 4, 0); // +x edge, half height, center z
    eastWall.rotation.y = Math.PI / 2; // Rotate 90 degrees
    this.arcadeRoom.walls.push(eastWall);
    this.scene.add(eastWall);
    
    // West wall (left)
    const westWall = new THREE.Mesh(longWallGeometry, wallMaterial);
    westWall.position.set(-6, 4, 0); // -x edge, half height, center z
    westWall.rotation.y = -Math.PI / 2; // Rotate -90 degrees
    this.arcadeRoom.walls.push(westWall);
    this.scene.add(westWall);
    
    console.log('Added 4 walls to create corridor-style arcade room');
}


/**
 * Create a single arcade machine with customizable colors, side art, and animated screen
 * @param {number} cabinetColor - Color of the cabinet (default dark gray)
 * @param {number} screenColor - Color of the screen (default blue)
 * @param {number} marqueeColor - Color of the marquee light (default red)
 * @param {string} gameName - Name of the game (used for texture loading)
 * @returns {THREE.Group} - Group containing all parts of the arcade machine
 */
createArcadeMachine(cabinetColor = 0x444444, screenColor = 0x0000FF, marqueeColor = 0xFF0000, gameName = '') {

    // Create a group to hold all parts of the arcade machine
    const machineGroup = new THREE.Group();

    

    // 1. Create the cabinet body - main structure
    // Increased depth from 1 to 2 units to make the cabinet thicker for side art
    const cabinetGeometry = new THREE.BoxGeometry(2, 5, 2);
    
  // Create materials array for the cabinet (one for each face)
const cabinetMaterials = [
    // Right side (+X) - Will hold side art
    new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,  // WHITE COLOR so texture shows properly
        roughness: 0.7, 
        metalness: 0.3
    }),
    // Left side (-X) - Will hold side art
    new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,  // WHITE COLOR so texture shows properly
        roughness: 0.7, 
        metalness: 0.3
    }),
    // Top (+Y)
    new THREE.MeshStandardMaterial({ 
        color: cabinetColor,
        roughness: 0.7, 
        metalness: 0.3
    }),
    // Bottom (-Y)
    new THREE.MeshStandardMaterial({ 
        color: cabinetColor,
        roughness: 0.7, 
        metalness: 0.3
    }),
    // Front (+Z) - Main cabinet face
    new THREE.MeshStandardMaterial({ 
        color: cabinetColor,
        roughness: 0.7, 
        metalness: 0.3
    }),
    // Back (-Z)
    new THREE.MeshStandardMaterial({ 
        color: cabinetColor,
        roughness: 0.7, 
        metalness: 0.3
    })
];
// If a game name is provided, load and apply side art textures
if (gameName) {
    // Load texture for both sides of the cabinet
    const textureLoader = new THREE.TextureLoader();
    
    // Use the same texture for both sides
    const sideTexturePath = `assets/images/side_art_${gameName}.jpg`;
    textureLoader.load(
        sideTexturePath, 
        // onLoad callback
        function(texture) {
            texture.encoding = THREE.sRGBEncoding;
            
            // Apply to right side (+X face)
            cabinetMaterials[0].map = texture;
            cabinetMaterials[0].color.set(0xFFFFFF);
            cabinetMaterials[0].needsUpdate = true;
            
            // Apply to left side (-X face)
            cabinetMaterials[1].map = texture;
            cabinetMaterials[1].color.set(0xFFFFFF);
            cabinetMaterials[1].needsUpdate = true;
        },
        // onProgress callback (optional)
        undefined,
        // onError callback
        function(err) {
            console.error(`Failed to load side texture for ${gameName}:`, err);
        }
    );
}

    // Create the cabinet with the materials array
    const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterials);
    cabinet.position.y = 2.5; // Position at half its height

// 2. Create a simpler, better-proportioned marquee top
// Make it longer and narrower to avoid obstructing side art
const marqueeGeometry = new THREE.BoxGeometry(1.9, 0.8, 2.8); // Narrower width, longer depth
const marqueeMaterial = new THREE.MeshStandardMaterial({
    color: marqueeColor,
    emissive: marqueeColor,
    emissiveIntensity: 0.4, // Slightly glowing
    roughness: 1,
    metalness: 0
});

const marquee = new THREE.Mesh(marqueeGeometry, marqueeMaterial);
marquee.position.y = 5.1; // Position properly on top of the cabinet
marquee.position.z = 0; // Center it on the cabinet
marquee.rotation.x = -Math.PI / 12; // Slight slant backward (15 degrees)

    // 3. Create the screen bezel (frame around the screen)
    const bezelGeometry = new THREE.BoxGeometry(1.9, 1.9, 0.15);
    const bezelMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222, // Dark gray/black
        roughness: 0.5,
        metalness: 0.5
    });
    const bezel = new THREE.Mesh(bezelGeometry, bezelMaterial);
    bezel.position.set(0, 3.5, 1.07); // Position adjusted for thicker cabinet

 // 4. Create the screen (display area inside the bezel)
const screenGeometry = new THREE.BoxGeometry(1.7, 1.7, 0.05);
let screenMaterial;

if (gameName) {
    // For screens with textures - create a bright, vibrant material
    screenMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF  // Pure white - MeshBasicMaterial ignores lighting and is always bright
    });
} else {
    // No textures - use glowing material with solid color
    screenMaterial = new THREE.MeshStandardMaterial({
        color: screenColor,
        emissive: screenColor,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8
    });
}

// Create the screen mesh
const screen = new THREE.Mesh(screenGeometry, screenMaterial);
screen.position.set(0, 3.5, 1.15); // Position adjusted for thicker cabinet

// Set up animated GIF for the screen if a game name is provided
if (gameName) {
    // Store the screen material reference for animation updates
    screen.userData.screenMaterial = screenMaterial;
    screen.userData.gameName = gameName;
    
    // Initialize the animation system for this screen
    this.setupScreenAnimation(screen, gameName);
}


// 5. Create the control panel (angled surface for controls)
const controlPanelShape = new THREE.Shape();
controlPanelShape.moveTo(-0.9, 0);    // Was -0.95 (narrower)
controlPanelShape.lineTo(0.9, 0);     // Was 0.95 (narrower)
controlPanelShape.lineTo(0.8, 1.8);   // Was 0.85 (narrower)
controlPanelShape.lineTo(-0.8, 1.8);  // Was -0.85 (narrower)
controlPanelShape.lineTo(-0.9, 0);    // Was -0.95 (narrower)

// Extrude the shape to create a 3D control panel
const controlPanelExtrudeSettings = {
    steps: 1,
    depth: 0.6,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 3
};

const controlPanelGeometry = new THREE.ExtrudeGeometry(
    controlPanelShape, 
    controlPanelExtrudeSettings
);

const controlPanelMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333, // Dark gray
    roughness: 0.8,
    metalness: 0.2
});

    
 
    
    const controlPanel = new THREE.Mesh(controlPanelGeometry, controlPanelMaterial);
    controlPanel.position.set(0, 1.1, -0.2);
    controlPanel.rotation.x = 45 * Math.PI / 180; // Angle upward (30 degrees)

    // 6. Create buttons for the control panel
    const buttonColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF];
    const buttonGroup = new THREE.Group();
    const panelAngle = Math.PI / 6; // Same as control panel angle
    
    for (let i = 0; i < 6; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const buttonGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 8);
        const buttonMaterial = new THREE.MeshStandardMaterial({
            color: buttonColors[i],
            emissive: buttonColors[i],
            emissiveIntensity: 0.2, // Subtle glow
            roughness: 0.3,
            metalness: 0.7
        });
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.rotation.x = 45 * Math.PI / 180; // Rotate to align with control panel
        
        const buttonOffsetY = 0.05; // Height above the panel surface
        const offsetZ = 0.2 * row; // Front-to-back spacing
        const offsetX = 0.5 * (col - 1); // Left-to-right spacing
        
        // Position buttons on the angled panel with adjusted Z for thicker cabinet
        button.position.set(
            offsetX + 0.07 , // X position (centered, with spacing)
            1.9 + Math.cos(panelAngle) * (0.4 + buttonOffsetY) - Math.sin(panelAngle) * offsetZ, // Y adjusted for panel angle
            1.02 + Math.sin(panelAngle) * (0.4 + buttonOffsetY) + Math.cos(panelAngle) * offsetZ // Z adjusted for thicker cabinet
        );
        buttonGroup.add(button);
    }

    // 7. Create a joystick on the left side of the control panel
    // Joystick base (the round base the stick sits in)
    const joystickBaseGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8);
    const joystickBaseMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222, // Black
        roughness: 0.5,
        metalness: 0.5
    });
    const joystickBase = new THREE.Mesh(joystickBaseGeometry, joystickBaseMaterial);
    joystickBase.rotation.x = 45 * Math.PI / 180; // Align with control panel
    
    // Calculate position to sit properly on the angled panel with adjusted Z for thicker cabinet
    joystickBase.position.set(
        -0.7, // Left side
        1.93 + Math.cos(panelAngle) * 0.41, // Height adjusted for panel angle
        1.02 + Math.sin(panelAngle) * 0.41 // Depth adjusted for thicker cabinet
    );

    // Joystick stick (the vertical shaft)
    const joystickStickGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8);
    const joystickStickMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222, // Black
        roughness: 0.5,
        metalness: 0.5
    });
    const joystickStick = new THREE.Mesh(joystickStickGeometry, joystickStickMaterial);
    
    // The stick is slightly angled for visual interest
    joystickStick.rotation.x = Math.PI / 2 - panelAngle + Math.PI / 24; // Add slight angle
    
    // Position the stick above the base with adjusted Z for thicker cabinet
    joystickStick.position.set(
        -0.7, // Same X as base
        1.94 + Math.cos(panelAngle) * 0.41 + Math.cos(Math.PI/2 - panelAngle) * 0.125, // Above base
        1.03 + Math.sin(panelAngle) * 0.41 + Math.sin(Math.PI/2 - panelAngle) * 0.125 // Depth adjusted for thicker cabinet
    );

    // Joystick knob (the ball on top of the stick)
    const joystickKnobGeometry = new THREE.SphereGeometry(0.06, 8, 8); // Low poly for performance
    const joystickKnobMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000, // Red
        roughness: 0.3,
        metalness: 0.7
    });
    const joystickKnob = new THREE.Mesh(joystickKnobGeometry, joystickKnobMaterial);
    
    // Position the knob at the top of the stick with adjusted Z for thicker cabinet
    joystickKnob.position.set(
        -0.7, // Same X as stick
        1.94 + Math.cos(panelAngle) * 0.41 + Math.cos(Math.PI/2 - panelAngle) * 0.25, // Top of stick
        1.03 + Math.sin(panelAngle) * 0.41 + Math.sin(Math.PI/2 - panelAngle) * 0.25 // Depth adjusted for thicker cabinet
    );

    // 8. Create a base/stand for the machine (increased depth to match thicker cabinet)
    const baseGeometry = new THREE.BoxGeometry(2.1, 0.2, 2.1); 
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222, // Dark
        roughness: 0.7,
        metalness: 0.3
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.1; // Just above the ground

    // Add all parts to the machine group
    machineGroup.add(cabinet);
    machineGroup.add(marquee);
    machineGroup.add(bezel);
    machineGroup.add(screen);
    machineGroup.add(controlPanel);
    machineGroup.add(buttonGroup);
    machineGroup.add(joystickBase);
    machineGroup.add(joystickStick);
    machineGroup.add(joystickKnob);
    machineGroup.add(base);

    // Add metadata (same as original function)
    machineGroup.userData.isArcadeMachine = true;
    machineGroup.userData.gameTitle = gameName || `Arcade Game ${Math.floor(Math.random() * 1000)}`;
    machineGroup.userData.gameDescription = 'An exciting retro-style arcade game!';
    machineGroup.userData.machineName = gameName || `Arcade ${Math.floor(Math.random() * 1000)}`;


    
    return machineGroup;
}

/**
 * Create a decorative barrel with a plant on top
 */
createBarrelWithPlant() {
    console.log('Creating decorative barrel with plant...');
    
    // Create a group to hold all parts
    const decorGroup = new THREE.Group();
    
    // === BARREL CREATION ===
    const barrelGroup = new THREE.Group();
    
    // Main barrel body (narrower at top and bottom)
    const barrelBody = new THREE.CylinderGeometry(0.7, 0.7, 1.6, 16, 3, false);
    
    // Scale the middle vertices outward to create barrel shape
    const barrelPositions = barrelBody.attributes.position;
    const barrelVertices = barrelPositions.count;
    
    for (let i = 0; i < barrelVertices; i++) {
        const y = barrelPositions.getY(i);
        
        // Only modify middle vertices, not top or bottom
        if (y > -0.7 && y < 0.7) {
            // Scale out more in the middle, less toward top/bottom
            const scaleFactor = 1.2 - Math.abs(y) * 0.5;
            
            const x = barrelPositions.getX(i);
            const z = barrelPositions.getZ(i);
            
            // Normalize the x,z position and scale it
            const length = Math.sqrt(x*x + z*z);
            const normalizedX = x / length;
            const normalizedZ = z / length;
            
            // Apply the scaled position
            barrelPositions.setX(i, normalizedX * 0.8 * scaleFactor);
            barrelPositions.setZ(i, normalizedZ * 0.8 * scaleFactor);
        }
    }
    
    barrelPositions.needsUpdate = true;
    barrelBody.computeVertexNormals();
    
    // Create barrel material
    const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,  // Saddle brown
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide
    });
    
    
    const barrel = new THREE.Mesh(barrelBody, barrelMaterial);
    
    // Create metal bands around barrel
    const createBarrelBand = (yPos) => {
        const bandGeometry = new THREE.TorusGeometry(0.82, 0.05, 8, 24);
        const bandMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,  // Dark gray
            roughness: 0.6,
            metalness: 0.8
        });
        const band = new THREE.Mesh(bandGeometry, bandMaterial);
        band.position.y = yPos;
        band.rotation.x = Math.PI / 2;  // Rotate to be horizontal
        return band;
    };
    
    // Add bands at top, middle and bottom
    barrelGroup.add(createBarrelBand(0.6));
    barrelGroup.add(createBarrelBand(0));
    barrelGroup.add(createBarrelBand(-0.6));
    
    // Add main barrel to group
    barrelGroup.add(barrel);
    
    // Add flat wooden top
    const topGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 16);
    const topMaterial = new THREE.MeshStandardMaterial({
        color: 0xA0522D,  // Sienna (lighter brown)
        roughness: 0.9,
        metalness: 0.1
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 0.825;  // Half barrel height + half top height
    barrelGroup.add(top);
    
    // Position barrel at floor level
    barrelGroup.position.y = 0.8;  // Half barrel height
    
    // Add barrel to decoration group
    decorGroup.add(barrelGroup);
    
    // === PLANT POT CREATION ===
    
    // Create pot
    const potGeometry = new THREE.CylinderGeometry(0.3, 0.2, 0.3, 16);
    const potMaterial = new THREE.MeshStandardMaterial({
        color: 0xA52A2A,  // Terra cotta color
        roughness: 1.0,
        metalness: 0.0
    });
    const pot = new THREE.Mesh(potGeometry, potMaterial);
    
    // Position pot on top of barrel
    pot.position.y = 1.65;  // Barrel height + top + half pot height
    decorGroup.add(pot);
    
    // Add soil in pot
    const soilGeometry = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 16);
    const soilMaterial = new THREE.MeshStandardMaterial({
        color: 0x3B2F2F,  // Dark soil color
        roughness: 1.0,
        metalness: 0.0
    });
    const soil = new THREE.Mesh(soilGeometry, soilMaterial);
    soil.position.y = 1.8;  // Top of pot
    decorGroup.add(soil);
    
    // === PLANT CREATION ===
    
// Create plant main stem
const stemGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8); // Even thicker and taller
const stemMaterial = new THREE.MeshStandardMaterial({
    color: 0x32CD32,  // Lime green (much brighter)
    roughness: 0.9,
    metalness: 0.0,
    emissive: 0x32CD32, // Add self-illumination to fight purple lighting
    emissiveIntensity: 0.2 // Subtle glow
});
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 2.4;  // Above soil
    decorGroup.add(stem);
    
    // Create plant leaves function
    const createLeaf = (size, angle, height, bend) => {
        const leafGeometry = new THREE.SphereGeometry(size, 8, 8, 0, Math.PI, 0, Math.PI/2);
        const leafMaterial = new THREE.MeshStandardMaterial({
            color: 0x7CFC00,  // Lawn green (much brighter)
            emissive: 0x7CFC00, // Add glow to fight purple lighting
            emissiveIntensity: 0.2,            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.scale.set(1, 0.2, 1);  // Flatten to make leaf-like
        leaf.position.y = height;
        
        // Rotate and bend leaf
        leaf.rotation.x = Math.PI / 2;  // Make it horizontal
        leaf.rotation.y = angle;        // Rotate around stem
        leaf.rotation.z = bend;         // Bend downward
        
        
        return leaf;
    };
    
/// Bottom layer of large leaves
decorGroup.add(createLeaf(0.4, 0, 2.2, -0.5));
decorGroup.add(createLeaf(0.38, Math.PI/2, 2.15, -0.5));
decorGroup.add(createLeaf(0.42, Math.PI, 2.18, -0.5));
decorGroup.add(createLeaf(0.39, Math.PI*3/2, 2.22, -0.5));

// Middle layer (offset angles)
decorGroup.add(createLeaf(0.36, Math.PI/4, 2.3, -0.4));
decorGroup.add(createLeaf(0.37, Math.PI*3/4, 2.32, -0.4));
decorGroup.add(createLeaf(0.35, Math.PI*5/4, 2.34, -0.4));
decorGroup.add(createLeaf(0.38, Math.PI*7/4, 2.36, -0.4));

// Additional middle leaves
decorGroup.add(createLeaf(0.34, Math.PI/6, 2.4, -0.3));
decorGroup.add(createLeaf(0.33, Math.PI*5/6, 2.42, -0.3));
decorGroup.add(createLeaf(0.35, Math.PI*7/6, 2.44, -0.3));
decorGroup.add(createLeaf(0.32, Math.PI*11/6, 2.46, -0.3));

// Upper layer
decorGroup.add(createLeaf(0.28, Math.PI/8, 2.55, -0.2));
decorGroup.add(createLeaf(0.29, Math.PI*5/8, 2.57, -0.2));
decorGroup.add(createLeaf(0.27, Math.PI*9/8, 2.59, -0.2));
decorGroup.add(createLeaf(0.30, Math.PI*13/8, 2.61, -0.2));

// Top leaves
decorGroup.add(createLeaf(0.25, Math.PI/3, 2.7, -0.1));
decorGroup.add(createLeaf(0.24, Math.PI, 2.72, -0.1));
decorGroup.add(createLeaf(0.23, Math.PI*5/3, 2.74, -0.1));

// Long hanging leaves (make it bushy)
decorGroup.add(createLeaf(0.45, Math.PI/5, 2.25, -1.0)); // Very droopy
decorGroup.add(createLeaf(0.43, Math.PI*9/5, 2.2, -1.0)); // Very droopy


    // Position the entire decoration group
    decorGroup.position.set(-4.8, 0, 3);  // Next to Pac-Man machine (adjust as needed)
    
    // Add to scene
    this.scene.add(decorGroup);
    console.log('Barrel with plant added to scene');
    
    // Store a reference and add metadata for collision detection
decorGroup.userData.isDecoration = true;
decorGroup.userData.collisionRadius = 0.8; // Collision radius for the barrel
this.barrelDecor = decorGroup; // Store reference in the class

    return decorGroup;


}


/**
 * Set up screen animation for an arcade machine
 * @param {THREE.Mesh} screen - The screen mesh object
 * @param {string} gameName - Name of the game (used for texture loading)
 */
setupScreenAnimation(screen, gameName) {
    // Create a unique identifier for this animation
    const animationId = `screen_${gameName}_${Math.floor(Math.random() * 10000)}`;
    
    // Initialize screenAnimations object if it doesn't exist
    if (!this.screenAnimations) {
        this.screenAnimations = {};
    }
    
    // Define the animation properties
    this.screenAnimations[animationId] = {
        screen: screen,
        gameName: gameName,
        currentFrame: 0,
        totalFrames: 0,
        frameTextures: [],
        frameRate: 12, // Default 12 FPS, can be adjusted
        isLoaded: false,
        lastUpdateTime: Date.now()
    };
    
    // Attempt to load the frame count info from a metadata file
    const metadataPath = `assets/images/screen_${gameName}_metadata.json`;
    fetch(metadataPath)
        .then(response => response.json())
        .then(metadata => {
            // Store frame count and frame rate from metadata
            this.screenAnimations[animationId].totalFrames = metadata.frameCount || 1;
            this.screenAnimations[animationId].frameRate = metadata.frameRate || 12;
            
            // Start loading the frames
            this.loadAnimationFrames(animationId);
        })
        .catch(error => {
            console.error(`Failed to load animation metadata for ${gameName}:`, error);
            // Default to a static image if metadata loading fails
            this.loadStaticScreenImage(screen, gameName);
        });
}

/**
 * Load animation frames for an arcade machine screen
 * @param {string} animationId - The unique identifier for this animation
 */
loadAnimationFrames(animationId) {
    const animation = this.screenAnimations[animationId];
    const gameName = animation.gameName;
    const totalFrames = animation.totalFrames;
    const textureLoader = new THREE.TextureLoader();
    
    console.log(`Loading ${totalFrames} frames for ${gameName} animation...`);
    
    // Counter for loaded frames
    let loadedFrames = 0;
    
    // Load each frame
    for (let i = 0; i < totalFrames; i++) {
        // Frame filename format: screen_gameName_frame_001.png (zero-padded frame number)
        const frameNumber = String(i + 1).padStart(3, '0');
        const framePath = `assets/images/screen_${gameName}_frame_${frameNumber}.png`;
        
        textureLoader.load(
            framePath,
            // onLoad callback
            (texture) => {
                texture.encoding = THREE.sRGBEncoding;
                animation.frameTextures[i] = texture;
                loadedFrames++;
                
                // If all frames are loaded, mark animation as ready
                if (loadedFrames === totalFrames) {
                    animation.isLoaded = true;
                    console.log(`All ${totalFrames} frames loaded for ${gameName} animation`);
                    
                    // Apply the first frame immediately
                    this.updateScreenFrame(animationId);
                }
            },
            // onProgress callback (optional)
            undefined,
            // onError callback
            (error) => {
                console.error(`Failed to load frame ${i+1} for ${gameName}:`, error);
            }
        );
    }
}

/**
 * Load a static image for an arcade machine screen (fallback if animation fails)
 * @param {THREE.Mesh} screen - The screen mesh object
 * @param {string} gameName - Name of the game (used for texture loading)
 */
loadStaticScreenImage(screen, gameName) {
    const textureLoader = new THREE.TextureLoader();
    const staticImagePath = `assets/images/screen_${gameName}_static.jpg`;
    
    textureLoader.load(
        staticImagePath,
        // onLoad callback
        (texture) => {
            texture.encoding = THREE.sRGBEncoding;
            screen.userData.screenMaterial.map = texture;
            screen.userData.screenMaterial.needsUpdate = true;
            console.log(`Loaded static image for ${gameName} screen`);
        },
        // onProgress callback (optional)
        undefined,
        // onError callback
        (error) => {
            console.error(`Failed to load static image for ${gameName}:`, error);
        }
    );
}

/**
 * Update the frame displayed on an animated screen
 * @param {string} animationId - The unique identifier for this animation
 */
updateScreenFrame(animationId) {
    const animation = this.screenAnimations[animationId];
    
    // Skip if animation isn't fully loaded
    if (!animation || !animation.isLoaded) {
        return;
    }
    
    // Get the current frame texture
    const texture = animation.frameTextures[animation.currentFrame];
    
    // Apply the texture to the screen material
    animation.screen.userData.screenMaterial.map = texture;
    
    // For MeshBasicMaterial, just need to set needsUpdate
    animation.screen.userData.screenMaterial.needsUpdate = true;
    
    // Update the current frame index
    animation.currentFrame = (animation.currentFrame + 1) % animation.totalFrames;
    animation.lastUpdateTime = Date.now();
}



/**
 * Play background music
 */
playBackgroundMusic() {
    if (this.audioLoaded && this.backgroundMusic && !this.backgroundMusic.isPlaying) {
        // Ensure AudioContext is running (needed for browser autoplay policy)
        if (this.listener.context.state !== 'running') {
            console.log('Resuming AudioContext...');
            this.listener.context.resume().then(() => {
                console.log('AudioContext resumed successfully');
                this.backgroundMusic.play();
                console.log('Background music started');
            }).catch(error => {
                console.error('Failed to resume AudioContext:', error);
            });
        } else {
            this.backgroundMusic.play();
            console.log('Background music started');
        }
    } else if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
        console.log('Background music is already playing');
    } else if (!this.audioLoaded) {
        console.log('Audio not yet loaded, cannot play background music');
    } else {
        console.log('Background music not available');
    }
}

/**
 * Play a sound effect
 * @param {string} name - Name of the sound to play
 */
playSound(name) {
    if (this.audioLoaded && this.sounds[name]) {
        // Ensure AudioContext is running
        if (this.listener.context.state !== 'running') {
            this.listener.context.resume().then(() => {
                // If sound is already playing, stop it first
                if (this.sounds[name].isPlaying) {
                    this.sounds[name].stop();
                }
                this.sounds[name].play();
                console.log(`Playing sound: ${name}`);
            });
        } else {
            // If sound is already playing, stop it first
            if (this.sounds[name].isPlaying) {
                this.sounds[name].stop();
            }
            this.sounds[name].play();
            console.log(`Playing sound: ${name}`);
        }
    } else if (!this.audioLoaded) {
        console.log(`Cannot play ${name} - audio not loaded yet`);
    } else {
        console.log(`Sound ${name} not found`);
    }
}



/**
 * Toggle mute state for all audio
 */
toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
        // Mute all sounds
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.backgroundMusic.pause();
        }
        console.log('Audio muted');
    } else {
        // Unmute and resume background music
        this.playBackgroundMusic();
        console.log('Audio unmuted');
    }
    
    // Show feedback to user
    this.showInteractionFeedback(this.isMuted ? 'Sound: OFF' : 'Sound: ON');
}

/**
 * Update all animated screens in the scene
 * Call this from the animation loop
 */
updateAnimatedScreens() {
    if (!this.screenAnimations) {
        return;
    }
    
    const now = Date.now();
    
    // Update each animation if enough time has passed since last update
    for (const animationId in this.screenAnimations) {
        const animation = this.screenAnimations[animationId];
        
        // Skip if not loaded
        if (!animation.isLoaded) {
            continue;
        }
        
        // Calculate time since last frame update
        const elapsed = now - animation.lastUpdateTime;
        const frameDuration = 1000 / animation.frameRate; // ms per frame
        
        // Update the frame if enough time has elapsed
        if (elapsed >= frameDuration) {
            this.updateScreenFrame(animationId);
        }
    }
}

/**
 * Create a broken arcade machine with an "OUT OF ORDER" sign
 * @param {number} brokenIndex - Index to identify which broken machine (1 or 2)
 * @returns {THREE.Group} - Group containing the broken machine
 */
createBrokenMachine(brokenIndex = 1) {
    // Define different colors for each broken machine
    let cabinetColor, screenColor, marqueeColor;
    
    if (brokenIndex === 1) {
        // First broken machine colors
        cabinetColor = 0xE31C2D;  // Darker gray
        screenColor = 0x222222;   // Very dark gray screen
        marqueeColor = 0x444444;  // Orange-red marquee
    } else {
        // Second broken machine colors
        cabinetColor = 0xC4AF55;  // Dark gray
        screenColor = 0x111111;   // Almost black screen
        marqueeColor = 0x444444;  // Dark red marquee
    }
    
    // Use a specific game name for each broken machine
    const brokenId = brokenIndex === 1 ? 'broken1' : 'broken2';
    
    // Create a basic arcade machine with custom colors
    const brokenMachine = this.createArcadeMachine(
        cabinetColor, 
        screenColor, 
        marqueeColor, 
        brokenId
    );
    
    // Add the "broken" metadata
    brokenMachine.userData.isBroken = true;
    brokenMachine.userData.machineName = `Broken Machine ${brokenIndex}`;
    
    return brokenMachine;
}

/**
 * Create and place arcade machines around the corridor-style room
 */
placeArcadeMachines() {
    console.log('Placing arcade machines in corridor-style room...');

    // ======== LEFT WALL MACHINES (4 working machines) ========
    
    // 1. Frogger Parody - Left wall, far end
    // Pass 'frogger' as the game name to load the game-specific textures
    const froggerMachine = this.createArcadeMachine(0x000000, 0x00AAFF, 0xA7C746, 'frogger');
    froggerMachine.position.set(-5, 0, -14);
    froggerMachine.rotation.y = -Math.PI * 1.5; // Facing right (into corridor)
    froggerMachine.userData.gameTitle = "Frogger Parody";
    froggerMachine.userData.gameDescription = "Navigate through traffic and data streams to reach the server racks!";
    froggerMachine.userData.machineName = "Tech Frogger Cabinet";
    this.scene.add(froggerMachine);
    console.log('Created Frogger Parody machine on left wall');

    // 2. Space Invaders - Left wall, 2nd position
    const spaceInvadersMachine = this.createArcadeMachine(0x3752A3, 0xFFFFFF, 0x3752A3, 'space_invaders');
    spaceInvadersMachine.position.set(-5, 0, -9);
    spaceInvadersMachine.rotation.y = -Math.PI * 1.5; // Facing right
    spaceInvadersMachine.userData.gameTitle = "Space Invaders";
    spaceInvadersMachine.userData.gameDescription = "Defend Earth from the alien invasion!";
    spaceInvadersMachine.userData.machineName = "Space Invaders";
    this.scene.add(spaceInvadersMachine);
    console.log('Created Space Invaders machine on left wall');

    // 3. Snake Game - Left wall, 3rd position
    const snakeMachine = this.createArcadeMachine(0x00AA00, 0x33FF33, 0x00AA00, 'snake');
    snakeMachine.position.set(-5, 0, -4);
    snakeMachine.rotation.y = -Math.PI * 1.5; // Facing right
    snakeMachine.userData.gameTitle = "Snake FSD";
    snakeMachine.userData.gameDescription = "Classic snake with Full Self-Driving mode!";
    snakeMachine.userData.machineName = "Snake FSD";
    this.scene.add(snakeMachine);
    console.log('Created Snake Game machine on left wall');

    // 4. Pac-Man - Left wall, 4th position
    const pacmanMachine = this.createArcadeMachine(0xfbde39, 0x000000, 0xfbde39, 'pacman');
    pacmanMachine.position.set(-5, 0, 1);
    pacmanMachine.rotation.y = -Math.PI * 1.5; // Facing right
    pacmanMachine.userData.gameTitle = "Pac-Man";
    pacmanMachine.userData.gameDescription = "Classic maze chase game - eat all pellets while avoiding ghosts!";
    pacmanMachine.userData.machineName = "Pac-Man Cabinet";
    this.scene.add(pacmanMachine);
    console.log('Created Pac-Man game machine on left wall');

    // ======== RIGHT WALL MACHINES (2 working, 2 broken) ========
    
    // 5. Pong - Right wall, 1st position
    const pongMachine = this.createArcadeMachine(0xDDD580, 0xFFFFFF, 0xDDD580, 'pong');
    pongMachine.position.set(5, 0, -14);
    pongMachine.rotation.y = Math.PI * 1.5; // Facing left
    pongMachine.userData.gameTitle = "Pong";
    pongMachine.userData.gameDescription = "The classic paddle game! Beat the AI to win!";
    pongMachine.userData.machineName = "Classic Pong";
    this.scene.add(pongMachine);
    console.log('Created Pong machine on right wall');

// 6. Broken Machine - Right wall, 2nd position
const brokenMachine1 = this.createBrokenMachine(1);  // First broken machine with orange-red marquee
brokenMachine1.position.set(5, 0, -9);
brokenMachine1.rotation.y = Math.PI * 1.5; // Facing left
this.scene.add(brokenMachine1);
console.log('Created broken machine 1 on right wall (position 2)');

    // 7. Asteroids - Right wall, 3rd position
    const asteroidsMachine = this.createArcadeMachine(0x222222, 0xFFFFFF, 0xF1120D, 'asteroids');
    asteroidsMachine.position.set(5, 0, -4);
    asteroidsMachine.rotation.y = Math.PI * 1.5; // Facing left
    asteroidsMachine.userData.gameTitle = "Asteroids";
    asteroidsMachine.userData.gameDescription = "Classic space shooter - destroy asteroids and survive!";
    asteroidsMachine.userData.machineName = "Asteroids Cabinet";
    this.scene.add(asteroidsMachine);
    console.log('Created Asteroids game machine on right wall');

// 8. Broken Machine - Right wall, 4th position
const brokenMachine2 = this.createBrokenMachine(2);  // Second broken machine with dark red marquee
brokenMachine2.position.set(5, 0, 1);
brokenMachine2.rotation.y = Math.PI * 1.5; // Facing left
this.scene.add(brokenMachine2);
console.log('Created broken machine 2 on right wall (position 4)');

    // ======== FAR END MACHINE (Portal) ========
    // Portal machine at the far end of the corridor
    const portalMachine = this.createArcadeMachine(0x00FF00, 0x00FF88, 0x00FF00, 'portal');
    portalMachine.position.set(0, 0, -16.5);
    portalMachine.rotation.y = 0; // Facing toward entrance
    portalMachine.userData.isPortal = true;
    portalMachine.userData.machineName = "Portal Machine";
    this.scene.add(portalMachine);
    console.log('Created portal machine at far end of corridor');
}



/**
 * Create and show the username input modal with improved styling
 */
showUsernameModal() {
    // Create the modal container
    const modal = document.createElement('div');
    modal.id = 'username-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = '#000000'; // Fully opaque background
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '3000';
    modal.style.fontFamily = "'Press Start 2P', monospace";
    
    // Create the form container with cleaner styling
    const formContainer = document.createElement('form');
    formContainer.style.backgroundColor = '#1a1a1a'; // Slightly lighter than pure black
    formContainer.style.padding = '40px';
    formContainer.style.borderRadius = '15px';
    formContainer.style.border = '2px solid #00ff00'; // Solid border instead of glow
    formContainer.style.width = '80%';
    formContainer.style.maxWidth = '500px';
    formContainer.style.textAlign = 'center';
    formContainer.style.position = 'relative'; // For proper containment of effects
    
    // Add special glow effect div that won't leak outside container
    const glowEffect = document.createElement('div');
    glowEffect.style.position = 'absolute';
    glowEffect.style.top = '0';
    glowEffect.style.left = '0';
    glowEffect.style.right = '0';
    glowEffect.style.bottom = '0';
    glowEffect.style.borderRadius = '15px';
    glowEffect.style.boxShadow = '0 0 20px 2px rgba(0, 255, 0, 0.4)';
    glowEffect.style.pointerEvents = 'none'; // Make sure it doesn't block interaction
    glowEffect.style.zIndex = '-1'; // Position behind content
    
    // Add form submission handler
    formContainer.addEventListener('submit', (event) => {
        event.preventDefault();
        this.submitUsername();
    });
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = 'ENTER USERNAME';
    title.style.color = '#0F0';
    title.style.marginBottom = '30px';
    title.style.fontSize = '24px';
    title.style.textShadow = '0 0 10px rgba(0, 255, 0, 0.7)'; // Text glow
    
    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'username-input';
    input.placeholder = 'vibe coded by @shahmirio';
    input.maxLength = '15'; // Reasonable username length limit
    input.style.width = '100%';
    input.style.padding = '15px';
    input.style.marginBottom = '25px';
    input.style.backgroundColor = '#111';
    input.style.border = '2px solid #0F0';
    input.style.color = '#0F0';
    input.style.fontSize = '14px';
    input.style.outline = 'none';
    input.style.fontFamily = "'Press Start 2P', monospace";
    input.style.boxSizing = 'border-box'; // Prevent sizing issues
    
    // Create submit button
    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'START GAME';
    button.style.backgroundColor = '#0F0';
    button.style.color = '#000';
    button.style.border = 'none';
    button.style.padding = '15px 28px';
    button.style.fontSize = '18px';
    button.style.cursor = 'pointer';
    button.style.fontFamily = "'Press Start 2P', monospace";
    button.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.7)'; // Button glow
    button.style.marginTop = '5px';
    
    // Add glow effect to container first so it's behind other elements
    formContainer.appendChild(glowEffect);
    
    // Add elements to form container
    formContainer.appendChild(title);
    formContainer.appendChild(input);
    formContainer.appendChild(button);
    
    // Add form container to modal
    modal.appendChild(formContainer);
    
    // Add modal to document body
    document.body.appendChild(modal);
    
    // Auto-focus the input field
    setTimeout(() => input.focus(), 100);
}

submitUsername() {
    const input = document.getElementById('username-input');
    let username = input.value.trim();
    
    // If username is empty, use a default
    if (username === '') {
        username = 'Player' + Math.floor(Math.random() * 1000);
    }
    
    // Replace spaces with underscores
    username = username.replace(/\s+/g, '_');
    
    // Store the username
    this.username = username;
    console.log('Username set:', this.username);
    
    // Remove the modal
    const modal = document.getElementById('username-modal');
    document.body.removeChild(modal);
    
    // Create the username display
    this.createUsernameDisplay();
    this.createFpsCounter();
    
    // Set audio initialization flag for regular users too
    this.audioInitialized = true;

    // Explicitly unlock audio context as part of the user gesture
    if (this.listener && this.listener.context.state !== 'running') {
        this.listener.context.resume().then(() => {
            console.log('AudioContext unlocked by user gesture');
            // Start background music after AudioContext is unlocked
            this.playBackgroundMusic();
        });
    } else {
        // Start background music directly if AudioContext is already running
        this.playBackgroundMusic();
    }
    
    // Enable controls (they were disabled while modal was showing)
    this.enableControls();
}





/**
 * Set up mobile touch controls using NippleJS
 * Only appears on mobile devices
 */
setupMobileControls() {
    // 1. Detect if the device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
        console.log('Not a mobile device, skipping mobile controls setup');
        return;
    }
    
    console.log('Setting up mobile controls...');
    
    // 2. Create container for mobile controls
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'mobile-controls';
    controlsContainer.style.position = 'fixed';
    controlsContainer.style.top = '0';
    controlsContainer.style.left = '0';
    controlsContainer.style.width = '100%';
    controlsContainer.style.height = '100%';
    controlsContainer.style.pointerEvents = 'none'; // Allow click-through by default
    controlsContainer.style.zIndex = '1000'; // Above game, below modals
    document.body.appendChild(controlsContainer);
    
    // 3. Create joystick zones
    const leftZone = document.createElement('div');
    leftZone.id = 'left-joystick';
    leftZone.style.position = 'absolute';
    leftZone.style.bottom = '20px';
    leftZone.style.left = '20px';
    leftZone.style.width = '120px';
    leftZone.style.height = '120px';
    leftZone.style.borderRadius = '60px';
    leftZone.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    leftZone.style.pointerEvents = 'auto'; // Make joystick clickable
    controlsContainer.appendChild(leftZone);
    
    const arrowContainer = document.createElement('div');
    arrowContainer.id = 'arrow-controls';
    arrowContainer.style.position = 'absolute';
    arrowContainer.style.bottom = '50px';
    arrowContainer.style.right = '20px';
    arrowContainer.style.width = '150px';
    arrowContainer.style.height = '150px';
    arrowContainer.style.pointerEvents = 'none'; // Container itself doesn't receive clicks
    controlsContainer.appendChild(arrowContainer);

    // Create a helper function for arrow buttons
const createArrowButton = (direction, symbol, top, left) => {
    const button = document.createElement('div');
    button.id = `arrow-${direction}`;
    button.textContent = symbol;
    button.style.position = 'absolute';
    button.style.top = top;
    button.style.left = left;
    button.style.width = '50px';
    button.style.height = '50px';
    button.style.borderRadius = '25px'; // Make circular (half of width/height)
    button.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'; // Change to white
    button.style.color = 'white';
    button.style.fontFamily = "monospace";
    button.style.fontSize = '28px';
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.style.pointerEvents = 'auto'; // Make button clickable
    button.style.userSelect = 'none'; // Prevent text selection
    button.style.cursor = 'pointer';
    arrowContainer.appendChild(button);
    return button;
};

// Create the four arrow buttons in a cross layout
const upArrow = createArrowButton('up', '▲', '0px', '50px');
const leftArrow = createArrowButton('left', '◀', '50px', '0px');
const downArrow = createArrowButton('down', '▼', '100px', '50px');
const rightArrow = createArrowButton('right', '▶', '50px', '100px');
    
    
    // 4. Create control buttons
    const createButton = (id, text, top, right, color = 'rgba(255, 255, 255, 0.3)') => {
        const button = document.createElement('div');
        button.id = id;
        button.textContent = text;
        button.style.position = 'absolute';
        button.style.top = top;
        button.style.right = right;
        button.style.width = '50px';
        button.style.height = '50px';
        button.style.borderRadius = '25px';
        button.style.backgroundColor = color;
        button.style.color = 'white';
        button.style.fontFamily = "'Press Start 2P', monospace";
        button.style.fontSize = '14px';
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';
        button.style.pointerEvents = 'auto'; // Make button clickable
        button.style.userSelect = 'none'; // Prevent text selection
        button.style.cursor = 'pointer';
        controlsContainer.appendChild(button);
        

        return button;
    };
    
    // Create interact button (E) - positioned above right joystick
const interactButton = createButton('interact-button', 'E', 'auto', '20px', 'rgba(0, 255, 0, 0.3)');
interactButton.style.top = 'auto';
interactButton.style.bottom = '220px'; // 30px above right joystick

// Create jump button (Space) - positioned above right joystick
const jumpButton = createButton('jump-button', 'JUMP', 'auto', '90px', 'rgba(255, 255, 0, 0.3)');
jumpButton.style.top = 'auto';
jumpButton.style.bottom = '220px'; // 30px above right joystick
    
// Create escape button (ESC) - positioned in top-right corner
const escButton = createButton('esc-button', 'ESC', '20px', '20px', 'rgba(255, 0, 0, 0.3)');
    escButton.style.display = 'none'; // Initially hidden

   


// Create duplicate jump button (Space) - positioned above left joystick
const leftJumpButton = createButton('left-jump-button', 'JUMP', 'auto', 'auto', 'rgba(255, 255, 0, 0.3)');
leftJumpButton.style.left = '40px'; // Position above left joystick
leftJumpButton.style.bottom = '160px'; // 30px above left joystick
controlsContainer.appendChild(leftJumpButton);
    
  // 5. Initialize the left joystick with NippleJS (keep only the left one)
const leftJoystick = nipplejs.create({
    zone: leftZone,
    mode: 'static',
    position: { left: '50%', top: '50%' },
    color: 'rgba(255, 255, 255, 0.5)', // Change to white
    size: 100
});
    
    // 6. Set up event handlers for joysticks and buttons
    
    // Left joystick (WASD movement)
    leftJoystick.on('move', (evt, data) => {
        // Reset all movement keys
        this.keyStates['KeyW'] = false;
        this.keyStates['KeyA'] = false;
        this.keyStates['KeyS'] = false;
        this.keyStates['KeyD'] = false;
        
        // Set keys based on joystick direction
        if (data.direction) {
            // Get the angle in radians
            const angle = data.angle.radian;
            
            // Determine which keys to press based on direction
            // Front = W, Back = S, Left = A, Right = D
            // Use 8 directions for better control
            if (angle >= 0 && angle < Math.PI/4 || angle >= 7*Math.PI/4) {
                this.keyStates['KeyD'] = true; // Right
            } else if (angle >= Math.PI/4 && angle < 3*Math.PI/4) {
                this.keyStates['KeyW'] = true; // Up
            } else if (angle >= 3*Math.PI/4 && angle < 5*Math.PI/4) {
                this.keyStates['KeyA'] = true; // Left
            } else if (angle >= 5*Math.PI/4 && angle < 7*Math.PI/4) {
                this.keyStates['KeyS'] = true; // Down
            }
            
            // For diagonal movement, set both keys
            if (angle >= Math.PI/8 && angle < 3*Math.PI/8) {
                this.keyStates['KeyW'] = true;
                this.keyStates['KeyD'] = true;
            } else if (angle >= 3*Math.PI/8 && angle < 5*Math.PI/8) {
                this.keyStates['KeyW'] = true;
                this.keyStates['KeyA'] = true;
            } else if (angle >= 5*Math.PI/8 && angle < 7*Math.PI/8) {
                this.keyStates['KeyS'] = true;
                this.keyStates['KeyA'] = true;
            } else if (angle >= 7*Math.PI/8 && angle < Math.PI/8) {
                this.keyStates['KeyS'] = true;
                this.keyStates['KeyD'] = true;
            }
        }
    });
    
    // Reset movement keys when joystick is released
    leftJoystick.on('end', () => {
        this.keyStates['KeyW'] = false;
        this.keyStates['KeyA'] = false;
        this.keyStates['KeyS'] = false;
        this.keyStates['KeyD'] = false;
    });
    
   // Set up event handlers for arrow buttons
const handleArrowTouch = (direction) => {
    // Reset all arrow keys first
    this.keyStates['ArrowUp'] = false;
    this.keyStates['ArrowDown'] = false;
    this.keyStates['ArrowLeft'] = false;
    this.keyStates['ArrowRight'] = false;
    
    // Set only the pressed direction
    this.keyStates[`Arrow${direction}`] = true;
};

// Add touch event listeners for each arrow
upArrow.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleArrowTouch('Up');
    upArrow.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // Highlight when pressed
});

downArrow.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleArrowTouch('Down');
    downArrow.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
});

leftArrow.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleArrowTouch('Left');
    leftArrow.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
});

rightArrow.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleArrowTouch('Right');
    rightArrow.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
});

// THE KEY FIX: Add touchend event listeners to RESET the key states
upArrow.addEventListener('touchend', (e) => {
    e.preventDefault();
    this.keyStates['ArrowUp'] = false;
    upArrow.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'; // Restore original color
});

downArrow.addEventListener('touchend', (e) => {
    e.preventDefault();
    this.keyStates['ArrowDown'] = false;
    downArrow.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
});

leftArrow.addEventListener('touchend', (e) => {
    e.preventDefault();
    this.keyStates['ArrowLeft'] = false;
    leftArrow.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
});

rightArrow.addEventListener('touchend', (e) => {
    e.preventDefault();
    this.keyStates['ArrowRight'] = false;
    rightArrow.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
});
    
    // Button event handlers
    
    // Interact button (E key)
interactButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    // Only send E events to the appropriate context
    if (this.currentMiniGame) {
        // In mini-game: Send to mini-game
        this.keyStates['KeyE'] = true;
    } else {
        // Outside mini-game: Trigger interaction
        const eKeyEvent = new KeyboardEvent('keydown', { code: 'KeyE' });
        this.onKeyDown(eKeyEvent);
    }
});

interactButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    this.keyStates['KeyE'] = false;
});
    
   // Jump button (Space key)
jumpButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    // Only send Space events to the appropriate context
    if (this.currentMiniGame) {
        // In mini-game: Send to mini-game
        this.keyStates['Space'] = true;
    } else {
        // Outside mini-game: Trigger jump
        const spaceKeyEvent = new KeyboardEvent('keydown', { code: 'Space' });
        this.onKeyDown(spaceKeyEvent);
    }
});

jumpButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    this.keyStates['Space'] = false;
});
    

// Add event listeners for the left jump button
leftJumpButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    // Only send Space events to the appropriate context
    if (this.currentMiniGame) {
        // In mini-game: Send to mini-game
        this.keyStates['Space'] = true;
    } else {
        // Outside mini-game: Trigger jump
        const spaceKeyEvent = new KeyboardEvent('keydown', { code: 'Space' });
        this.onKeyDown(spaceKeyEvent);
    }
});

leftJumpButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    this.keyStates['Space'] = false;
});

    // Escape button (Esc key) - for exiting mini-games
    escButton.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent default touch behavior
        
        // Create and dispatch an Escape keydown event
        const escKeyEvent = new KeyboardEvent('keydown', { code: 'Escape' });
        
        // If we have a mini-game active with a keyboard handler
        if (this.miniGameKeyHandler) {
            this.miniGameKeyHandler(escKeyEvent);
        } else {
            // Otherwise send to general key handler
            this.onKeyDown(escKeyEvent);
        }
    });
    
    // 7. Make ESC button appear/disappear during mini-games
    
    // Store original methods to modify
    const originalLaunchMiniGame = this.launchMiniGame;
    const originalCloseMiniGame = this.closeMiniGame;
    
    // Override launchMiniGame to show ESC button
    this.launchMiniGame = function(arcadeMachine) {
        // Show the escape button when a mini-game is launched
        if (escButton) escButton.style.display = 'flex';
        
        // Call the original method
        originalLaunchMiniGame.call(this, arcadeMachine);
    };
    
    // Override closeMiniGame to hide ESC button
    this.closeMiniGame = function() {
        // Hide the escape button when a mini-game is closed
        if (escButton) escButton.style.display = 'none';
        
        // Call the original method
        originalCloseMiniGame.call(this);
    };
    
    console.log('Mobile controls setup complete');
}

/**
 * Create the username display in the top-left corner
 */
createUsernameDisplay() {
    // Create the display container
    const display = document.createElement('div');
    display.id = 'username-display';
    display.style.position = 'fixed';
    display.style.top = '20px';
    display.style.left = '20px';
    display.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    display.style.color = '#0F0';
    display.style.padding = '10px 15px';
    display.style.borderRadius = '5px';
    display.style.fontFamily = "'Press Start 2P', monospace";
    display.style.fontSize = '14px';
    display.style.zIndex = '1000';
    display.style.pointerEvents = 'none'; // Make it non-interactive
    
    // Set the content
    display.textContent = `Username: ${this.username}`;
    
    // Add to document
    document.body.appendChild(display);
}

/**
 * Disable controls while modal is shown
 */
disableControls() {
    // Disable orbit controls
    if (this.controls) {
        this.controls.enabled = false;
    }
    
    // Store the state that key handlers need to be restored
    this.keyHandlersActive = true;
    
    // Remove our main keyboard handlers completely while modal is active
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    
    // We don't need any additional event handlers - simply removing the game's
    // keyboard listeners is enough to prevent game interaction while keeping
    // normal text input functionality
}

/**
 * Re-enable controls after modal is closed
 */
enableControls() {
    // Re-enable orbit controls
    if (this.controls) {
        this.controls.enabled = true;
    }
    
    // Restore original key handlers
    if (this.keyHandlersActive) {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        this.keyHandlersActive = false;
    }
    
    // Clear key states in case any keys were "stuck" down
    this.keyStates = {};
}





/**
 * Apply textures to the arcade room surfaces with appropriate material properties
 */
applyRoomTextures() {
    console.log('Applying textures to arcade room surfaces...');
    
    // Create texture loader
    const textureLoader = new THREE.TextureLoader();
    
    // ===== FLOOR TEXTURE (CARPET) =====
    textureLoader.load('assets/textures/floor_checker.jpg', (floorTexture) => {
        // Configure texture wrapping and repetition
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(8, 16);
        
        // Create a new material with carpet-like properties
        const floorMaterial = new THREE.MeshStandardMaterial({
            map: floorTexture,
            roughness: 1.0,     // Maximum roughness for carpet (was 0.8)
            metalness: 0.0,     // No metallic properties for carpet (was 0.2)
            side: THREE.FrontSide
        });
        
        // Apply the material to the floor
        if (this.arcadeRoom.floor) {
            this.arcadeRoom.floor.material = floorMaterial;
            console.log('Applied carpet-like texture to floor');
        }
    });
    
    // ===== CEILING TEXTURE (PLASTER/TILES) =====
    textureLoader.load('assets/textures/ceiling_tiles.jpg', (ceilingTexture) => {
        // Configure texture wrapping and repetition
        ceilingTexture.wrapS = THREE.RepeatWrapping;
        ceilingTexture.wrapT = THREE.RepeatWrapping;
        ceilingTexture.repeat.set(1, 3);
        
        // Create a new material with ceiling tile properties
        const ceilingMaterial = new THREE.MeshStandardMaterial({
            map: ceilingTexture,
            roughness: 0.9,        // Very rough for ceiling tiles (was 0.6)
            metalness: 0.0,        // Not metallic at all (was 0.3)
            emissive: 0x222222,    // Keep subtle emissive property
            emissiveIntensity: 0.1  // Reduce emissive intensity for less shine (was 0.2)
        });
        
        // Create or update ceiling
        if (!this.arcadeRoom.ceiling) {
            const ceilingGeometry = new THREE.PlaneGeometry(12, 35);
            this.arcadeRoom.ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
            this.arcadeRoom.ceiling.position.set(0, 8, 0);
            this.arcadeRoom.ceiling.rotation.x = Math.PI / 2;
            this.scene.add(this.arcadeRoom.ceiling);
            console.log('Created ceiling with matte tile texture');
        } else {
            this.arcadeRoom.ceiling.material = ceilingMaterial;
            console.log('Applied matte tile texture to ceiling');
        }
    });
    
    // The wall textures are handled in the fixWalls method
}

/**
 * Create wall material with appropriate plaster-like finish
 * @param {THREE.Texture} texture - The wall texture to use
 * @param {number} repeatX - Horizontal repetition
 * @param {number} repeatY - Vertical repetition
 * @returns {THREE.MeshStandardMaterial} The configured wall material
 */
createWallMaterial(texture, repeatX, repeatY) {
    // Clone the texture to prevent shared settings
    const wallTexture = texture.clone();
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(repeatX, repeatY);
    wallTexture.needsUpdate = true;
    
    // Create a standard material with matte plaster-like properties
    const material = new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 1,   // Very rough for plaster (was 0.7)
        metalness: -1,    // Not metallic at all (was 0.1)
        side: THREE.DoubleSide,
        transparent: false,
        opacity: 1.0
    });
    
    return material;
}

/**
 * Update texture tiling for a specific wall
 * @param {string} wallName - The wall to update ('northWall', 'southWallLeft', 'southWallRight', 'southWallTop', 'eastWall', 'westWall', etc.)
 * @param {number} repeatX - New horizontal repetition value
 * @param {number} repeatY - New vertical repetition value
 */
updateWallTextureTiling(wallName, repeatX, repeatY) {
    // Check if the wall name is valid
    if (!this.wallTextureSettings || !this.wallTextureSettings[wallName]) {
        console.error(`Invalid wall name: ${wallName}. Valid options are: northWall, southWallLeft, southWallRight, southWallTop, eastWall, westWall, hallwayLeft, hallwayRight, hallwayEnd`);
        return;
    }
    
    // Update the texture tiling settings
    this.wallTextureSettings[wallName].repeatX = repeatX;
    this.wallTextureSettings[wallName].repeatY = repeatY;
    
    console.log(`Updated ${wallName} texture tiling to repeatX=${repeatX}, repeatY=${repeatY}`);
    
    // Re-apply the textures with the new settings
    this.fixWalls();
}

/**
 * Update texture tiling for all south wall sections at once
 * @param {number} repeatX - New horizontal repetition value
 * @param {number} repeatY - New vertical repetition value
 */
updateAllSouthWallTextureTiling(repeatX, repeatY) {
    // Update all south wall sections
    this.wallTextureSettings.southWallLeft.repeatX = repeatX;
    this.wallTextureSettings.southWallLeft.repeatY = repeatY;
    
    this.wallTextureSettings.southWallRight.repeatX = repeatX;
    this.wallTextureSettings.southWallRight.repeatY = repeatY;
    
    this.wallTextureSettings.southWallTop.repeatX = repeatX;
    this.wallTextureSettings.southWallTop.repeatY = repeatY;
    
    console.log(`Updated ALL South wall sections texture tiling to repeatX=${repeatX}, repeatY=${repeatY}`);
    
    // Re-apply the textures with the new settings
    this.fixWalls();
}

/**
 * Create a return portal near the entrance when player comes from another game
 */
createReturnPortal() {
    // Only create return portal if we have a ref URL to return to
    if (!this.portalParams.ref) {
        console.log('No ref URL provided, not creating return portal');
        return;
    }
    
    console.log('Creating return portal to:', this.portalParams.ref);
    
    // Create a group to hold all portal elements
    const portalGroup = new THREE.Group();
    
    // Create the outer ring (bright green)
    const ringGeometry = new THREE.TorusGeometry(1.5, 0.2, 16, 32);
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0x00FF44,
        emissive: 0x00FF44,
        emissiveIntensity: 0.7,
        roughness: 0.3,
        metalness: 0.8
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        // Make it oval by scaling the x-axis

    
    // Create the portal center (translucent green)
    const centerGeometry = new THREE.CircleGeometry(1.3, 32);
    const centerMaterial = new THREE.MeshBasicMaterial({
        color: 0x88FF99,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);

    
    // Add a subtle particle effect (small floating dots)
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 40;
    const positions = new Float32Array(particleCount * 3);
    
    // Create random positions for particles within the portal
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 1.3;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.05,
        transparent: true,
        opacity: 0.8
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);

    
    // Add everything to the portal group
    portalGroup.add(ring);
    portalGroup.add(center);
    portalGroup.add(particles);
    
    // Position the portal - behind the entrance, facing the player
    portalGroup.position.set(3, 4, 17); // Directly behind spawn point
    portalGroup.rotation.y = Math.PI; // Face toward the arcade
    
    // Create an animation for the portal
    this.portalRotationSpeed = 0.005;
    this.portalParticles = particles;
    this.portalRing = ring;
    
    // Add custom userData for interaction
    portalGroup.userData.isReturnPortal = true;
    portalGroup.userData.returnUrl = this.portalParams.ref;
    portalGroup.userData.portalParams = this.portalParams;
    portalGroup.userData.machineName = "Return Portal";
    portalGroup.userData.gameTitle = "Return Portal";
    
    // Add to scene
    this.scene.add(portalGroup);
    
    // Add a special green glow light
    const portalLight = new THREE.PointLight(0x00FF44, 1, 8);
    portalLight.position.set(2.5, 4, 16);
    this.scene.add(portalLight);
    
    // Store reference to animate the portal
    this.returnPortal = portalGroup;
    
    console.log('Return portal created');
}
/**
 * Fix walls texture and lighting consistency issues
 */
fixWalls() {
    console.log('Fixing wall brightness and texture consistency...');
    
    // Create texture loader
    const textureLoader = new THREE.TextureLoader();
    
    // Check if we have walls to fix
    if (!this.arcadeRoom.walls || this.arcadeRoom.walls.length === 0) {
        console.error('No walls found to fix!');
        return;
    }
    
    // Store texture tiling settings for easy adjustment
    // These can be modified to change the texture tiling
    this.wallTextureSettings = {
        northWall: { repeatX: 5, repeatY: 2 },    // North wall (far end)
        southWallLeft: { repeatX: .5, repeatY: 2 },  // Left section of south wall (left of doorway)
        southWallRight: { repeatX: 3, repeatY: 2 }, // Right section of south wall (right of doorway)
        southWallTop: { repeatX: 0.6, repeatY: 0.5 },   // Top section of south wall (above doorway)
        eastWall: { repeatX: 15, repeatY: 2 },    // East wall (right side)
        westWall: { repeatX: 15, repeatY: 2 },    // West wall (left side)
        hallwayLeft: { repeatX: 15, repeatY: 2 }, // Hallway left wall
        hallwayRight: { repeatX: 15, repeatY: 2 },// Hallway right wall
        hallwayEnd: { repeatX: 5, repeatY: 2 }    // Hallway end wall
    };
    
    console.log('Wall texture tiling settings:', this.wallTextureSettings);
    
    // Load the wall texture once
    textureLoader.load('assets/textures/wall_arcade.jpg', (texture) => {
        // Create materials for each wall with appropriate repetition
        const northWallMaterial = this.createWallMaterial(
            texture,
            this.wallTextureSettings.northWall.repeatX,
            this.wallTextureSettings.northWall.repeatY
        );
        
        // Create separate materials for each section of the south wall
        const southWallLeftMaterial = this.createWallMaterial(
            texture,
            this.wallTextureSettings.southWallLeft.repeatX,
            this.wallTextureSettings.southWallLeft.repeatY
        );
        
        const southWallRightMaterial = this.createWallMaterial(
            texture,
            this.wallTextureSettings.southWallRight.repeatX,
            this.wallTextureSettings.southWallRight.repeatY
        );
        
        const southWallTopMaterial = this.createWallMaterial(
            texture,
            this.wallTextureSettings.southWallTop.repeatX,
            this.wallTextureSettings.southWallTop.repeatY
        );
        
        const eastWallMaterial = this.createWallMaterial(
            texture,
            this.wallTextureSettings.eastWall.repeatX,
            this.wallTextureSettings.eastWall.repeatY
        );
        
        const westWallMaterial = this.createWallMaterial(
            texture,
            this.wallTextureSettings.westWall.repeatX,
            this.wallTextureSettings.westWall.repeatY
        );
        
        // Create materials for hallway walls
        const hallwayLeftMaterial = this.createWallMaterial(
            texture,
            this.wallTextureSettings.hallwayLeft.repeatX,
            this.wallTextureSettings.hallwayLeft.repeatY
        );
        
        const hallwayRightMaterial = this.createWallMaterial(
            texture,
            this.wallTextureSettings.hallwayRight.repeatX,
            this.wallTextureSettings.hallwayRight.repeatY
        );
        
        const hallwayEndMaterial = this.createWallMaterial(
            texture,
            this.wallTextureSettings.hallwayEnd.repeatX,
            this.wallTextureSettings.hallwayEnd.repeatY
        );

        // Apply materials to walls based on their position and orientation
        this.arcadeRoom.walls.forEach((wall, index) => {
            // Determine which wall this is based on its position and rotation
            const position = wall.position;
            const rotation = wall.rotation;
            
            // North wall (back) at z = -17.5
            if (Math.abs(position.z + 17.5) < 0.1 && Math.abs(rotation.y) < 0.1) {
                wall.material = northWallMaterial;
                console.log(`Wall ${index} identified as North wall, applied texture with repeatX=${this.wallTextureSettings.northWall.repeatX}, repeatY=${this.wallTextureSettings.northWall.repeatY}`);
            }
            // South wall sections (front with doorway) at z = 17.5
            else if (Math.abs(position.z - 17.5) < 0.1 && Math.abs(rotation.y) < 0.1) {
                // Identify which section of the south wall this is based on position
                
                // Left section of south wall (left of doorway)
                if (position.x < -3) {
                    wall.material = southWallLeftMaterial;
                    console.log(`Wall ${index} identified as South wall LEFT section, applied texture with repeatX=${this.wallTextureSettings.southWallLeft.repeatX}, repeatY=${this.wallTextureSettings.southWallLeft.repeatY}`);
                }
                // Right section of south wall (right of doorway)
                else if (position.x > 0) {
                    wall.material = southWallRightMaterial;
                    console.log(`Wall ${index} identified as South wall RIGHT section, applied texture with repeatX=${this.wallTextureSettings.southWallRight.repeatX}, repeatY=${this.wallTextureSettings.southWallRight.repeatY}`);
                }
                // Top section of south wall (above doorway)
                else {
                    wall.material = southWallTopMaterial;
                    console.log(`Wall ${index} identified as South wall TOP section, applied texture with repeatX=${this.wallTextureSettings.southWallTop.repeatX}, repeatY=${this.wallTextureSettings.southWallTop.repeatY}`);
                }
            }
            // East wall (right) at x = 6, rotated 90 degrees
            else if (Math.abs(position.x - 6) < 0.1 && Math.abs(rotation.y - Math.PI/2) < 0.1) {
                wall.material = eastWallMaterial;
                console.log(`Wall ${index} identified as East wall, applied texture with repeatX=${this.wallTextureSettings.eastWall.repeatX}, repeatY=${this.wallTextureSettings.eastWall.repeatY}`);
            }
            // West wall (left) at x = -6, rotated -90 degrees
            else if (Math.abs(position.x + 6) < 0.1 && Math.abs(rotation.y + Math.PI/2) < 0.1) {
                wall.material = westWallMaterial;
                console.log(`Wall ${index} identified as West wall, applied texture with repeatX=${this.wallTextureSettings.westWall.repeatX}, repeatY=${this.wallTextureSettings.westWall.repeatY}`);
            }
            else {
                console.log(`Wall ${index} at position (${position.x}, ${position.y}, ${position.z}) with rotation (${rotation.x}, ${rotation.y}, ${rotation.z}) not identified, using default material`);
                // Use south wall left material as default for any unidentified wall sections
                wall.material = southWallLeftMaterial;
            }
            
            // Force geometry normals recalculation
            wall.geometry.computeVertexNormals();
            wall.material.needsUpdate = true;
        });
        
        console.log('Walls fixed with consistent materials and lighting');
        console.log('To adjust texture tiling, modify this.wallTextureSettings and call this.fixWalls() again');
    });
}

/**
 * Add atmospheric purple arcade lighting to the scene
 */
addBalancedLighting() {
    console.log('Adding atmospheric purple arcade lighting...');
    
    // Remove any existing lights
    this.scene.children.forEach(child => {
        if (child.isLight) {
            console.log(`Removing existing ${child.type}`);
            this.scene.remove(child);
        }
    });
    
    // Add dimmer ambient light for baseline illumination
    // This ensures things aren't completely black in unlit areas
    const ambientLight = new THREE.AmbientLight(0x222233, 0.3); // Dark blue-purple, dim
    this.scene.add(ambientLight);
    console.log('Added dim ambient light for baseline illumination');
}


/**
 * Create visible ceiling light fixtures with purple lighting in a 3×2 grid
 */
createCeilingLights() {
    console.log('Creating visible ceiling light fixtures with purple lighting...');
    
    // Purple light color for arcade atmosphere
    const purpleColor = 0xB340FF;
    
    // Create a group to hold all fixture objects
    this.ceilingFixtures = new THREE.Group();
    
    // Position fixtures in a 3×2 grid (3 along length, 2 across width)
    const fixturePositions = [
        // Back row (near portal end)
        { x: -4, z: -10 },  // Back left
        { x: 4, z: -10 },   // Back right
        
        // Middle row (new)
        { x: -4, z: 0 },    // Middle left
        { x: 4, z: 0 },     // Middle right
        
        // Front row (near entrance)
        { x: -4, z: 10 },   // Front left
        { x: 4, z: 10 }     // Front right
    ];
    
    fixturePositions.forEach((pos, index) => {
        // Create fixture housing (outer ring)
        const housingGeometry = new THREE.TorusGeometry(0.8, 0.2, 8, 24);
        const housingMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,     // Dark gray
            roughness: 0.9,
            metalness: 0.2
        });
        const housing = new THREE.Mesh(housingGeometry, housingMaterial);
        housing.rotation.x = Math.PI / 2; // Orient flat against ceiling
        
        // Create light panel (inner disk)
        const panelGeometry = new THREE.CircleGeometry(0.75, 24);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,      // White base
            roughness: 0.3,
            metalness: 0.0,
            emissive: purpleColor, // Purple emission
            emissiveIntensity: 0.8 // Strong glow
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.rotation.x = Math.PI / 2; // Orient flat against ceiling
        panel.position.y = -0.05; // Slightly below the housing
        
        // Create a group for this fixture
        const fixtureGroup = new THREE.Group();
        fixtureGroup.add(housing);
        fixtureGroup.add(panel);
        
        // Position the fixture at the ceiling
        fixtureGroup.position.set(pos.x, 7.95, pos.z); // Very close to ceiling (y=8)
        
        // Create point light that will emit from this fixture
        // Slightly stronger intensity for better coverage with 6 lights
        const pointLight = new THREE.PointLight(purpleColor, 1, 14); 
        pointLight.position.set(pos.x, 7.5, pos.z); // Slightly below the fixture
        
        // Add to the fixtures group
        this.ceilingFixtures.add(fixtureGroup);
        this.ceilingFixtures.add(pointLight);
        
        console.log(`Created ceiling fixture ${index+1} with point light at (${pos.x}, 7.95, ${pos.z})`);
    });
    
    // Increase ambient light slightly for better overall visibility
    const ambientBoost = new THREE.AmbientLight(0x332244, 0.15); // Subtle purple ambient boost
    this.ceilingFixtures.add(ambientBoost);
    
    // Add a bit of extra glow to the portal machine at the far end
    const portalLight = new THREE.PointLight(0x00FF88, 0.8, 10); // Green-blue portal light
    portalLight.position.set(0, 5, -16); // At the portal machine
    this.ceilingFixtures.add(portalLight);
    
    // Add all fixtures to the scene
    this.scene.add(this.ceilingFixtures);
    console.log('All ceiling fixtures and lights created in 3×2 grid pattern');
}

/**
 * Check if a position would result in a collision with walls or machines
 * @param {THREE.Vector3} position - The position to check
 * @param {number} playerRadius - The radius around the player to check for collisions
 * @returns {THREE.Vector3} - Adjusted position that avoids collisions
 */
checkCollision(position, playerRadius = 0.6) { // Reduced from 1.0 to 0.6 for smoother movement
    // Clone the position so we can adjust it if needed
    const adjustedPosition = position.clone();
    
    // Room boundaries - using smaller buffer to allow closer approach to walls
    const buffer = 0.05; // Reduced from 0.1 for closer wall approach
    const boundaryMinX = -6 + playerRadius + buffer;
    const boundaryMaxX = 6 - playerRadius - buffer;
    const boundaryMinZ = -17.5 + playerRadius + buffer;
    const boundaryMaxZ = 17.5 - playerRadius - buffer;
    
    // Handle wall collisions individually to allow sliding
    let collision = false;
    
    // Check X boundaries (left/right walls)
    if (position.x < boundaryMinX) {
        adjustedPosition.x = boundaryMinX;
        collision = true;
    } else if (position.x > boundaryMaxX) {
        adjustedPosition.x = boundaryMaxX;
        collision = true;
    }
    
    // Get hallway parameters for checking if player is in hallway
    const doorWidth = 2.6;
    const doorPositionX = -12/4; // Same as in createDoor()
    const doorLeft = doorPositionX - doorWidth/2;
    const doorRight = doorPositionX + doorWidth/2;
    const hallwayMinZ = boundaryMaxZ; // Start of hallway is at the end of the arcade room
    
    // Determine if player is already in the hallway (beyond the south wall)
    const isAlreadyInHallway = position.z > hallwayMinZ;
    
    // Check if player can enter or is already in the hallway
    const canEnterHallway = this.door && this.door.userData.isOpen;
    
    // Determine if player is within doorway width
    const isWithinDoorwayWidth = position.x >= doorLeft && position.x <= doorRight;
    
    // Player is considered in hallway if:
    // 1. They're already beyond the south wall AND the door is open
    // 2. OR they're passing through the doorway (within doorway width, beyond south wall, door open)
    const isInHallway = (isAlreadyInHallway && canEnterHallway) &&
                        // If they're just crossing the threshold, they must be within doorway width
                        (position.z <= hallwayMinZ + 0.5 ? isWithinDoorwayWidth : true);
    
    // If player is in the hallway, use hallway collision detection
    if (isInHallway) {
        console.log(`Player in hallway, using hallway collision detection. Position: x=${position.x.toFixed(2)}, z=${position.z.toFixed(2)}, doorLeft=${doorLeft.toFixed(2)}, doorRight=${doorRight.toFixed(2)}`);
        this.checkHallwayCollision(position, adjustedPosition, playerRadius);
    } else {
        // Normal arcade room collision detection
        // Check Z boundaries (front/back walls)
        if (position.z < boundaryMinZ) {
            adjustedPosition.z = boundaryMinZ;
            collision = true;
        } else if (position.z > boundaryMaxZ) {
            // Special case for doorway in south wall
            
            // If player is within the doorway width, allow them to pass through
            if (isWithinDoorwayWidth && canEnterHallway) {
                // Allow passage through doorway into hallway
                console.log("Player passing through doorway");
            } else {
                // Normal wall collision - player is outside doorway or door is closed
                adjustedPosition.z = boundaryMaxZ;
                collision = true;
                console.log("South wall collision - outside doorway or door closed");
            }
        }
    }
    
    // Check arcade machines with improved collision handling
    for (const object of this.scene.children) {
        // Only check objects that are arcade machines
        if (object.userData && (object.userData.isArcadeMachine || object.userData.isBroken || object.userData.isPortal)) {
            // Get the machine's position
            const machinePos = object.position.clone();
            
            // Define the machine's bounding box dimensions
            const machineWidth = 2;
            const machineDepth = 2;
            
            // Calculate boundaries for this machine based on its rotation
            let minX, maxX, minZ, maxZ;
            
            // Check the rotation of the machine to determine its orientation
            if (Math.abs(Math.sin(object.rotation.y)) > 0.5) {
                // Machine is facing along X axis
                minX = machinePos.x - machineDepth/2;
                maxX = machinePos.x + machineDepth/2;
                minZ = machinePos.z - machineWidth/2;
                maxZ = machinePos.z + machineWidth/2;
            } else {
                // Machine is facing along Z axis
                minX = machinePos.x - machineWidth/2;
                maxX = machinePos.x + machineWidth/2;
                minZ = machinePos.z - machineDepth/2;
                maxZ = machinePos.z + machineDepth/2;
            }
            
            // Expand machine boundaries by player radius
            const collMinX = minX - playerRadius;
            const collMaxX = maxX + playerRadius;
            const collMinZ = minZ - playerRadius;
            const collMaxZ = maxZ + playerRadius;
            
            // Check if position intersects with the expanded machine boundaries
            if (adjustedPosition.x >= collMinX && adjustedPosition.x <= collMaxX &&
                adjustedPosition.z >= collMinZ && adjustedPosition.z <= collMaxZ) {
                
                // Calculate distances to each boundary to determine closest exit point
                const dLeft = Math.abs(adjustedPosition.x - collMinX);
                const dRight = Math.abs(adjustedPosition.x - collMaxX);
                const dBottom = Math.abs(adjustedPosition.z - collMinZ);
                const dTop = Math.abs(adjustedPosition.z - collMaxZ);
                
                // Find minimum distance to determine which way to push out
                const minDist = Math.min(dLeft, dRight, dBottom, dTop);
                
                // Push out in direction of minimum distance
                if (minDist === dLeft) {
                    adjustedPosition.x = collMinX;
                } else if (minDist === dRight) {
                    adjustedPosition.x = collMaxX;
                } else if (minDist === dBottom) {
                    adjustedPosition.z = collMinZ;
                } else {
                    adjustedPosition.z = collMaxZ;
                }
                
                
                collision = true;
            }
        }
    }
    
    // Check for collision with barrel decoration
if (this.barrelDecor) {
    // Get the barrel's position
    const barrelPos = this.barrelDecor.position.clone();
    
    // Calculate horizontal distance to barrel center (ignoring y axis)
    const dx = adjustedPosition.x - barrelPos.x;
    const dz = adjustedPosition.z - barrelPos.z;
    const distanceSquared = dx * dx + dz * dz;
    
    // Get collision radius from userData or use default
    const barrelRadius = this.barrelDecor.userData.collisionRadius || 0.8;
    
    // Check if position intersects with the barrel (plus player radius)
    const collisionRadiusSquared = Math.pow(barrelRadius + playerRadius, 2);
    if (distanceSquared < collisionRadiusSquared) {
        // Handle collision by pushing the player away from the barrel center
        const angle = Math.atan2(dz, dx);
        const pushDistance = Math.sqrt(collisionRadiusSquared) - Math.sqrt(distanceSquared);
        
        // Calculate push vector
        adjustedPosition.x += Math.cos(angle) * pushDistance;
        adjustedPosition.z += Math.sin(angle) * pushDistance;
    }
}

    // Check door collision if door exists and is closed
    if (this.door && !this.door.userData.isOpen) {
        // Get the door's world position
        const doorWorldPosition = new THREE.Vector3();
        this.door.getWorldPosition(doorWorldPosition);
        
        // Door dimensions
        const doorWidth = 2.6; // Updated to match the wider door
        const doorHeight = 6.0; // Updated to match the taller door
        const doorThickness = 0.1;
        
        // Calculate door boundaries
        const doorMinX = doorWorldPosition.x - doorWidth/2 - playerRadius;
        const doorMaxX = doorWorldPosition.x + doorWidth/2 + playerRadius;
        const doorMinZ = doorWorldPosition.z - doorThickness/2 - playerRadius;
        const doorMaxZ = doorWorldPosition.z + doorThickness/2 + playerRadius;
        
        // Check if position intersects with the door boundaries
        if (adjustedPosition.x >= doorMinX && adjustedPosition.x <= doorMaxX &&
            adjustedPosition.z >= doorMinZ && adjustedPosition.z <= doorMaxZ) {
            
            // Calculate distances to each boundary
            const dLeft = Math.abs(adjustedPosition.x - doorMinX);
            const dRight = Math.abs(adjustedPosition.x - doorMaxX);
            const dFront = Math.abs(adjustedPosition.z - doorMinZ);
            const dBack = Math.abs(adjustedPosition.z - doorMaxZ);
            
            // Find minimum distance
            const minDist = Math.min(dLeft, dRight, dFront, dBack);
            
            // Push out in direction of minimum distance
            if (minDist === dLeft) {
                adjustedPosition.x = doorMinX;
            } else if (minDist === dRight) {
                adjustedPosition.x = doorMaxX;
            } else if (minDist === dFront) {
                adjustedPosition.z = doorMinZ;
            } else {
                adjustedPosition.z = doorMaxZ;
            }
            
            collision = true;
        }
    }

    // Return the adjusted position
    return adjustedPosition;
}



/**
 * Create wall decorations (paintings and vent)
 */
createWallDecorations() {
    console.log('Adding wall decorations (paintings and vent)...');
    
    const textureLoader = new THREE.TextureLoader();
    
    // Create a function to make a flat rectangle with texture support
   // In the createWallDecorations() method, change the createWallDecor function:

const createWallDecor = (name, width, height, position, rotation) => {
    // Create slightly raised geometry (thin box)
    const geometry = new THREE.BoxGeometry(width, height, 0.05);
    
    // Create material that will show textures - different for vent vs paintings
    let material;
    
    if (name === 'vent') {
        // For vent: Use MeshStandardMaterial which respects scene lighting
        material = new THREE.MeshStandardMaterial({
            color: 0x777777, // Gray default
            roughness: 0.8,
            metalness: 0.6,
            side: THREE.FrontSide
        });
    } else {
        // For paintings: Keep using MeshBasicMaterial which ignores lighting
        material = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF, // White base (shows textures properly)
            side: THREE.FrontSide
        });
    }

        // Create the mesh
        const decor = new THREE.Mesh(geometry, material);
        decor.position.copy(position);
        decor.rotation.copy(rotation);
        
        // Add metadata
        decor.name = name;
        
        // Load texture if available
        const texturePath = `assets/textures/${name}.jpg`;
        textureLoader.load(
            texturePath,
            // Texture loaded successfully
            (texture) => {
                material.map = texture;
                material.needsUpdate = true;
                console.log(`Loaded texture for ${name}`);
            },
            // Progress callback
            undefined,
            // Error callback
            (error) => {
                console.warn(`Couldn't load texture for ${name}: ${error.message}`);
                // Set a default color if texture fails to load
                material.color.set(name.includes('vent') ? 0x777777 : 0xF5F5DC);
            }
        );
        
        // Add to scene
        this.scene.add(decor);
        console.log(`Added ${name} to scene`);
        
        return decor;
    };
    
    // ===== PAINTINGS =====
    
    // Left wall paintings (between entrance and first machine)
    // Painting 1 - Left wall, closer to entrance
    createWallDecor(
        'paint1',
        3.5, // Width
        3.0, // Height
        new THREE.Vector3(-5.9, 5.0, 13.0), // Position
        new THREE.Euler(0, Math.PI/2, 0) // Rotation (facing into corridor)
    );
    
    // Painting 2 - Left wall, closer to machines
    createWallDecor(
        'paint2',
        3.5, // Width
        3.0, // Height
        new THREE.Vector3(-5.9, 5.0, 7.0), // Position
        new THREE.Euler(0, Math.PI/2, 0) // Rotation (facing into corridor)
    );
    
    // Right wall paintings (between entrance and first machine)
    // Painting 3 - Right wall, closer to entrance
    createWallDecor(
        'paint3',
        3.5, // Width
        3.0, // Height
        new THREE.Vector3(5.9, 5.0, 13.0), // Position
        new THREE.Euler(0, -Math.PI/2, 0) // Rotation (facing into corridor)
    );
    
    // Painting 4 - Right wall, closer to machines
    createWallDecor(
        'paint4',
        3.5, // Width
        3.0, // Height
        new THREE.Vector3(5.9, 5.0, 7.0), // Position
        new THREE.Euler(0, -Math.PI/2, 0) // Rotation (facing into corridor)
    );
    
    // ===== VENT =====
    // Vent - Far wall (north wall), top right
    createWallDecor(
        'vent',
        3, // Width
        2, // Height
        new THREE.Vector3(4.0, 6.5, -17.4), // Position (top right with padding)
        new THREE.Euler(0, 0, 0) // Rotation (facing into corridor)
    );
    
    console.log('Wall decorations added');
}

/**
 * Create a hallway extending from the doorway on the south wall
 */
createHallway() {
    console.log('Creating hallway...');
    
    // Hallway dimensions
    const hallwayWidth = 3.6; // Slightly wider than the door (which is now 2.6)
    const hallwayLength = 30.0; // Increased from 10.0 to 30.0 (3x longer)
    const hallwayHeight = 8.0; // Same as main room
    
    // Hallway position (aligned with door)
    const doorPositionX = -12/4; // Same as in createDoor()
    const doorPositionZ = 17.5; // South wall position
    
    // Create hallway group
    this.hallway = new THREE.Group();
    
    // Store hallway properties for later use with lighting
    this.hallwayProps = {
        width: hallwayWidth,
        length: hallwayLength,
        height: hallwayHeight,
        doorPositionX: doorPositionX,
        doorPositionZ: doorPositionZ,
        pointLights: [] // Will store references to point lights
    };
    
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(hallwayWidth, hallwayLength);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333, // Same as main room floor
        roughness: 1,
        metalness: 0
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    floor.position.set(doorPositionX, 0, doorPositionZ + hallwayLength/2);
    this.hallway.add(floor);
    
    // Create ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(hallwayWidth, hallwayLength);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222, // Same as main room ceiling
        roughness: 1,
        metalness: 0
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2; // Rotate to be horizontal
    ceiling.position.set(doorPositionX, hallwayHeight, doorPositionZ + hallwayLength/2);
    this.hallway.add(ceiling);
    
    // Create walls
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222, // Same as main room walls
        roughness: 1,
        metalness: 0
    });
    
    // Store hallway walls for texture application
    this.hallwayWalls = [];
    
    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(0.2, hallwayHeight, hallwayLength);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(doorPositionX - hallwayWidth/2, hallwayHeight/2, doorPositionZ + hallwayLength/2);
    leftWall.userData.isHallwayWall = true;
    leftWall.userData.wallType = 'hallwayLeft';
    this.hallway.add(leftWall);
    this.hallwayWalls.push(leftWall);
    
    // Right wall
    const rightWallGeometry = new THREE.BoxGeometry(0.2, hallwayHeight, hallwayLength);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(doorPositionX + hallwayWidth/2, hallwayHeight/2, doorPositionZ + hallwayLength/2);
    rightWall.userData.isHallwayWall = true;
    rightWall.userData.wallType = 'hallwayRight';
    this.hallway.add(rightWall);
    this.hallwayWalls.push(rightWall);
    
    // End wall (with elevator door placeholder)
    const endWallGeometry = new THREE.BoxGeometry(hallwayWidth, hallwayHeight, 0.2);
    const endWall = new THREE.Mesh(endWallGeometry, wallMaterial);
    endWall.position.set(doorPositionX, hallwayHeight/2, doorPositionZ + hallwayLength);
    endWall.userData.isHallwayWall = true;
    endWall.userData.wallType = 'hallwayEnd';
    this.hallway.add(endWall);
    this.hallwayWalls.push(endWall);
    
    // Create enhanced elevator door
    console.log('Creating enhanced elevator door...');
    
    // Elevator dimensions - match entrance door height and make it wider
    const elevatorWidth = 2.8;  // Wider than entrance door (2.6)
    const elevatorHeight = 5.5; // Same as entrance door
    const elevatorDepth = 0.1;  // Depth of the elevator door
    const frameThickness = 0.15; // Thickness of the frame
    const frameDepth = 0.2;     // How far the frame protrudes
    
    // Create elevator door group
    const elevatorGroup = new THREE.Group();
    elevatorGroup.position.set(doorPositionX, elevatorHeight/2, doorPositionZ + hallwayLength - 0.1);
    
    // Create matte material for the elevator doors (less reflective)
    const elevatorMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,      // Light gray
        roughness: 0.7,       // More rough/matte
        metalness: 0.3,       // Less metallic
        envMapIntensity: 0.3  // Less reflective
    });
    
    // Create frame material (slightly darker than doors)
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,      // Darker gray
        roughness: 0.6,       // More rough/matte
        metalness: 0.4,       // Less metallic
        envMapIntensity: 0.4  // Less reflective
    });
    
    // Create left door panel
    const leftDoorGeometry = new THREE.BoxGeometry(elevatorWidth/2 - 0.02, elevatorHeight, elevatorDepth);
    const leftDoor = new THREE.Mesh(leftDoorGeometry, elevatorMaterial);
    leftDoor.position.set(-elevatorWidth/4 - 0.01, 0, 0);
    elevatorGroup.add(leftDoor);
    
    // Create right door panel
    const rightDoorGeometry = new THREE.BoxGeometry(elevatorWidth/2 - 0.02, elevatorHeight, elevatorDepth);
    const rightDoor = new THREE.Mesh(rightDoorGeometry, elevatorMaterial);
    rightDoor.position.set(elevatorWidth/4 + 0.01, 0, 0);
    elevatorGroup.add(rightDoor);
    
    // Create door frame (top, left, right)
    // Top frame
    const topFrameGeometry = new THREE.BoxGeometry(elevatorWidth + frameThickness*2, frameThickness, frameDepth);
    const topFrame = new THREE.Mesh(topFrameGeometry, frameMaterial);
    topFrame.position.set(0, elevatorHeight/2 + frameThickness/2, frameDepth/2 - 0.05);
    elevatorGroup.add(topFrame);
    
    // Left frame
    const leftFrameGeometry = new THREE.BoxGeometry(frameThickness, elevatorHeight, frameDepth);
    const leftFrame = new THREE.Mesh(leftFrameGeometry, frameMaterial);
    leftFrame.position.set(-elevatorWidth/2 - frameThickness/2, 0, frameDepth/2 - 0.05);
    elevatorGroup.add(leftFrame);
    
    // Right frame
    const rightFrameGeometry = new THREE.BoxGeometry(frameThickness, elevatorHeight, frameDepth);
    const rightFrame = new THREE.Mesh(rightFrameGeometry, frameMaterial);
    rightFrame.position.set(elevatorWidth/2 + frameThickness/2, 0, frameDepth/2 - 0.05);
    elevatorGroup.add(rightFrame);
    
    // Add user data for interaction
    elevatorGroup.userData = {
        isElevator: true,
        name: 'Elevator'
    };
    
    // Add elevator group to hallway
    this.hallway.add(elevatorGroup);
    
    // Create new triangle indicator above elevator
    console.log('Creating triangle indicator...');
    
    // Create extruded triangle geometry for 3D effect - half the size
    const triangleShape = new THREE.Shape();
    triangleShape.moveTo(0, 0);
    triangleShape.lineTo(0.4, 0); // Half width (was 0.8)
    triangleShape.lineTo(0.2, 0.35); // Half height (was 0.7) and positive to point up
    triangleShape.lineTo(0, 0);
    
    const extrudeSettings = {
        steps: 1,
        depth: 0.1, // Slightly thinner (was 0.2)
        bevelEnabled: true,
        bevelThickness: 0.03, // Smaller bevel (was 0.05)
        bevelSize: 0.03, // Smaller bevel (was 0.05)
        bevelSegments: 3
    };
    
    const triangleGeometry = new THREE.ExtrudeGeometry(triangleShape, extrudeSettings);
    
    // Create bright red emissive material
    const triangleMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 1.0,
        roughness: 0.3,
        metalness: 0.5
    });
    
    // Create the triangle mesh and add it to a group for easier manipulation
    const triangle = new THREE.Mesh(triangleGeometry, triangleMaterial);
    
    // Create a group to hold the triangle for easier positioning
    this.triangleIndicator = new THREE.Group();
    this.triangleIndicator.add(triangle);
    
    // Position and rotate the triangle group
    // These are the values you can adjust to reposition the triangle:
    // X position: doorPositionX (left/right)
    // Y position: elevatorHeight + frameThickness + 0.3 (up/down)
    // Z position: doorPositionZ + hallwayLength - 0.2 (forward/backward)
    this.triangleIndicator.position.set(
        doorPositionX + 0.2, // X position (left/right) - change this to move horizontally
        elevatorHeight + frameThickness + 0.8, // Y position (up/down) - change this to move vertically
        doorPositionZ + hallwayLength - 0.2 // Z position (forward/backward) - change this to move closer/further from wall
    );
    
    // Rotate to face forward and flip upside down (point down)
    this.triangleIndicator.rotation.x = Math.PI / 9; // Rotate to face forward
    this.triangleIndicator.rotation.z = Math.PI; // Rotate 180 degrees to flip upside down
    
    // Add the triangle group to the hallway
    this.hallway.add(this.triangleIndicator);
    
    console.log('Triangle indicator created. To reposition it, adjust:');
    console.log('- X position (left/right): this.triangleIndicator.position.x');
    console.log('- Y position (up/down): this.triangleIndicator.position.y');
    console.log('- Z position (forward/backward): this.triangleIndicator.position.z');
    
    // Add an extra bright light above the elevator
    const elevatorLight = new THREE.PointLight(0xFFFFFF, 1.5, 8); // Brighter light with longer range
    elevatorLight.position.set(doorPositionX, hallwayHeight - 0.2, doorPositionZ + hallwayLength - 2);
    this.hallway.add(elevatorLight);
    
    // Add some ceiling lights
    const lightGeometry = new THREE.BoxGeometry(0.5, 0.1, 1.0);
    const lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: 0xFFFFFF,
        emissiveIntensity: 1.0
    });
    
    // Add 9 ceiling lights along the hallway (3x more for the longer hallway)
    for (let i = 0; i < 9; i++) {
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(doorPositionX, hallwayHeight - 0.1, doorPositionZ + 2 + i * 3);
        this.hallway.add(light);
        
        // Add point light at each ceiling light
        const pointLight = new THREE.PointLight(0xFFFFFF, 0.8, 5);
        pointLight.position.set(doorPositionX, hallwayHeight - 0.2, doorPositionZ + 2 + i * 3);
        this.hallway.add(pointLight);
        
        // Store reference to point light for later manipulation
        this.hallwayProps.pointLights.push(pointLight);
    }
    
    // Add to scene
    this.scene.add(this.hallway);
    
    console.log('Hallway created');
}



/**
 * Check collision with hallway walls
 * @param {THREE.Vector3} position - The player's position
 * @param {THREE.Vector3} adjustedPosition - The adjusted position after collision
 * @param {number} playerRadius - The player's collision radius
 */
checkHallwayCollision(position, adjustedPosition, playerRadius) {
    // Get hallway dimensions and position
    const hallwayWidth = 3.6;
    const hallwayLength = 30.0;
    const doorPositionX = -12/4;
    const doorPositionZ = 17.5;
    
    // Calculate hallway boundaries
    const buffer = 0.05;
    const hallwayMinX = doorPositionX - hallwayWidth/2 + playerRadius + buffer;
    const hallwayMaxX = doorPositionX + hallwayWidth/2 - playerRadius - buffer;
    const hallwayMinZ = doorPositionZ + buffer; // Entrance to hallway
    const hallwayMaxZ = doorPositionZ + hallwayLength - playerRadius - buffer;
    
    // Check if the player is actually in the hallway (Z position beyond the arcade room)
    const isInHallway = position.z > hallwayMinZ;
    
    // Only apply hallway collision if the player is actually in the hallway
    if (isInHallway) {
        console.log(`Player in hallway, applying hallway collision. Position: x=${position.x.toFixed(2)}, z=${position.z.toFixed(2)}`);
        
        // Check X boundaries (left/right walls of hallway)
        if (position.x < hallwayMinX) {
            adjustedPosition.x = hallwayMinX;
            console.log("Hallway left wall collision");
        } else if (position.x > hallwayMaxX) {
            adjustedPosition.x = hallwayMaxX;
            console.log("Hallway right wall collision");
        }
        
        // Check Z boundary (end wall of hallway)
        if (position.z > hallwayMaxZ) {
            adjustedPosition.z = hallwayMaxZ;
            console.log("Hallway end wall collision");
        }
    } else {
        // Player is not in the hallway, don't apply hallway collision
        console.log("Player not in hallway, skipping hallway collision");
    }
}

/**
 * Create a door on the left side of the south wall (behind spawn point) that can be opened
 */
createDoor() {
    console.log('Creating door...');
    
    // Create a group to hold all door components
    const doorGroup = new THREE.Group();
    
    // Door dimensions
    const doorWidth = 2.6; // Increased from 2.0 to 2.6 (1.3x wider)
    const doorHeight = 6.0; // Increased from 4.0 to 6.0 (1.5x taller)
    const doorThickness = 0.1;
    
    // Door frame dimensions
    const frameWidth = 0.2;
    
    // Create door panel with texture
    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness);
    const textureLoader = new THREE.TextureLoader();
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF, // White base color to show texture properly
        roughness: 0.7,
        metalness: 0.3,
        side: THREE.DoubleSide // Make texture visible from both sides
    });
    
    // Load and apply the door texture
    textureLoader.load(
        'assets/textures/hallwaydoor.jpg',
        (texture) => {
            doorMaterial.map = texture;
            doorMaterial.needsUpdate = true;
        },
        undefined,
        (error) => {
            console.error('Error loading door texture:', error);
        }
    );
    
    const doorPanel = new THREE.Mesh(doorGeometry, doorMaterial);
    
    // Position door panel relative to its hinge
    doorPanel.position.set(doorWidth/2, 0, 0);
    
    // Create door frame
    // Top frame
    const topFrameGeometry = new THREE.BoxGeometry(doorWidth + frameWidth*2, frameWidth, doorThickness + frameWidth*2);
    const frameTopMesh = new THREE.Mesh(topFrameGeometry, doorMaterial);
    frameTopMesh.position.set(0, doorHeight/2 + frameWidth/2, 0);
    
    // Bottom frame
    const bottomFrameGeometry = new THREE.BoxGeometry(doorWidth + frameWidth*2, frameWidth, doorThickness + frameWidth*2);
    const frameBottomMesh = new THREE.Mesh(bottomFrameGeometry, doorMaterial);
    frameBottomMesh.position.set(0, -doorHeight/2 - frameWidth/2, 0);
    
    // Left frame - adjusted to not extend below the door
    const leftFrameGeometry = new THREE.BoxGeometry(frameWidth, doorHeight + frameWidth, doorThickness + frameWidth*2);
    const frameLeftMesh = new THREE.Mesh(leftFrameGeometry, doorMaterial);
    frameLeftMesh.position.set(-doorWidth/2 - frameWidth/2, frameWidth/2, 0);
    
    // Right frame - adjusted to not extend below the door
    const rightFrameGeometry = new THREE.BoxGeometry(frameWidth, doorHeight + frameWidth, doorThickness + frameWidth*2);
    const frameRightMesh = new THREE.Mesh(rightFrameGeometry, doorMaterial);
    frameRightMesh.position.set(doorWidth/2 + frameWidth/2, frameWidth/2, 0);
    
    // Create a pivot point for the door (hinge)
    const hingePivot = new THREE.Group();
    hingePivot.position.set(-doorWidth/2, 0, 0);
    hingePivot.add(doorPanel);
    
    // Add all components to the door group
    doorGroup.add(hingePivot);
    doorGroup.add(frameTopMesh);
    // Removed bottom frame as requested (was glitching with floor)
    doorGroup.add(frameLeftMesh);
    doorGroup.add(frameRightMesh);
    
    // Position the door on the left side of the south wall (behind spawn point)
    // South wall is at z = 17.5
    const wallWidth = 12; // From createArcadeRoom()
    const doorPositionX = -wallWidth/4; // Center of left half of wall
    const doorPositionY = doorHeight/2; // Half the door height for proper positioning
    const doorPositionZ = 17.5 - doorThickness/2; // Just in front of south wall
    
    doorGroup.position.set(doorPositionX, doorPositionY, doorPositionZ);
    
    // Rotate the door to face the correct direction (inward)
    doorGroup.rotation.y = Math.PI; // Rotate 180 degrees
    
    // Add custom userData for interaction
    doorGroup.userData.isDoor = true;
    doorGroup.userData.isOpen = false;
    
    // Store reference to the door and hinge
    this.door = doorGroup;
    this.doorHinge = hingePivot;
    
    // Add to scene
    this.scene.add(doorGroup);
    
    console.log('Door created on south wall (behind spawn point)');
}

/**
 * Open the door with an animation
 */
openDoor() {
    // Check if door is already open
    if (this.door.userData.isOpen) {
        console.log('Door is already open');
        return;
    }
    
    console.log('Opening door...');
    
    // Play door opening sound
    this.playSound('interaction'); // Using existing interaction sound for now
    
    // Show feedback
    this.showInteractionFeedback('Door opening...');
    
    // Stop background music if it's playing
    if (this.sounds.backgroundMusic && this.sounds.backgroundMusic.isPlaying) {
        this.sounds.backgroundMusic.stop();
        console.log('Background music stopped');
    }
    
    // Animation duration
    const duration = 1000; // 1 second
    
    // Starting rotation
    const startRotation = this.doorHinge.rotation.y;
    
    // Target rotation (90 degrees in radians)
    const targetRotation = Math.PI / 2;
    
    // Animation start time
    const startTime = performance.now();
    
    // Animation function
    const animateDoor = (currentTime) => {
        // Calculate elapsed time
        const elapsedTime = currentTime - startTime;
        
        // Calculate progress (0 to 1)
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Calculate current rotation using easing
        const currentRotation = startRotation + (targetRotation - startRotation) * this.easeOutQuad(progress);
        
        // Apply rotation
        this.doorHinge.rotation.y = currentRotation;
        
        // Continue animation if not complete
        if (progress < 1) {
            requestAnimationFrame(animateDoor);
        } else {
            // Animation complete
            this.door.userData.isOpen = true;
            console.log('Door opened');
        }
    };
    
    // Start animation
    requestAnimationFrame(animateDoor);
}

/**
 * Easing function for smoother animation
 * @param {number} t - Progress value between 0 and 1
 * @returns {number} - Eased value
 */
easeOutQuad(t) {
    return t * (2 - t);
}
  /**
 * Animation loop
 */
animate() {
    
    const now = performance.now();

    requestAnimationFrame(this.animate);
    
    this.handleMovement();
    
    // Update animated screens (add this line)
    this.updateAnimatedScreens();
    
    // Update FPS counter
    this.updateFpsCounter(now); // ADD THIS LINE to update the FPS counter


    // Update controls if they exist
    if (this.controls) {
        this.controls.update();
    }

    // Animate portal if it exists
if (this.returnPortal) {
    // Rotate the ring slowly
    if (this.portalRing) {
        this.portalRing.rotation.z += this.portalRotationSpeed;
    }
    
    // Animate particles
    if (this.portalParticles) {
        const positions = this.portalParticles.geometry.attributes.position.array;
        const particleCount = positions.length / 3;
        
        for (let i = 0; i < particleCount; i++) {
            // Move particles in a gentle floating pattern
            positions[i * 3 + 2] = Math.sin((now / 1000) + i * 0.1) * 0.1;
            
            // Occasionally move particles inward/outward
            if (Math.random() < 0.01) {
                const angle = Math.atan2(positions[i * 3 + 1], positions[i * 3]);
                const radius = Math.random() * 1.3;
                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 1] = Math.sin(angle) * radius;
            }
        }
        
        this.portalParticles.geometry.attributes.position.needsUpdate = true;
    }
}

    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
}

    
    /**
     * Handle window resize
     */
    onWindowResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

/**
 * Handle keydown events for player movement and interaction
 * @param {KeyboardEvent} event - The keyboard event
 */
onKeyDown(event) {
    // Store the state of this key as pressed
    this.keyStates[event.code] = true;

        // Start audio on first key press for portal users
        if (this.portalParams && this.portalParams.fromPortal && !this.audioInitialized) {
            this.audioInitialized = true;
            
            if (this.listener && this.listener.context.state !== 'running') {
                this.listener.context.resume().then(() => {
                    console.log('Audio context started on first key press');
                    this.playBackgroundMusic();
                });
            } else {
                this.playBackgroundMusic();
            }
        }
        
    
    if (event.code === 'Space' && !this.isJumping) {
        // Prevent default behavior (scrolling)
        event.preventDefault();
        
        // Start jump if we're on the ground
        if (Math.abs(this.camera.position.y - this.groundLevel) < 0.1) {
            this.isJumping = true;
            this.jumpVelocity = 0.2; // Initial upward velocity
                        // Play jump sound
                        this.playSound('jump');

            console.log('Jump initiated');
        }
    }

    // Handle interaction with "E" key
    if (event.code === 'KeyE') {
        console.log('E key pressed - checking for interaction');
                // Play interaction sound
                this.playSound('interaction');

        
        // Skip interaction if a mini-game is already active
        if (this.currentMiniGame) {
            console.log('Mini-game is active, ignoring interaction');
            return;
        }
        
        // Create a raycaster from the camera
        const raycaster = new THREE.Raycaster();
        
        // Set the raycaster to start at camera position and go in the direction
        // the camera is facing (this simulates a ray from the center of the screen)
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        // Set raycaster's starting point and direction
        raycaster.set(this.camera.position, direction);
        
        // Maximum distance to check for interactions (adjust based on your game scale)
        const maxDistance = 5;
        
        // Find all intersections in the scene (recursive true to check child objects)
        const intersects = raycaster.intersectObjects(this.scene.children, true);
        
        // Check if we hit anything within range
        if (intersects.length > 0 && intersects[0].distance < maxDistance) {
            // Get the first (closest) intersected object
            const intersectedObject = intersects[0].object;
            
            // Start checking parent objects to find one with userData
            let currentObject = intersectedObject;
            let foundInteractive = false;
            
            // Traverse up the parent chain to find interactive objects
            // (This is needed because often the mesh we hit is a child of the main object)
            while (currentObject && !foundInteractive) {
                // Check if this is the door
                if (currentObject.userData && currentObject.userData.isDoor) {
                    console.log('Door activated!');
                    this.openDoor();
                    foundInteractive = true;
                }
                // See if this is the special portal machine
                else if (currentObject.userData && currentObject.userData.isPortal) {
    console.log('Portal machine activated!');
    
    // Add visual feedback before redirecting
    this.showInteractionFeedback('Opening portal...');
    
    // Build portal URL with query parameters
    const portalBaseUrl = 'http://portal.pieter.com';
    const queryParams = new URLSearchParams({
        username: this.username || 'Player',
        color: 'purple',        // Default color matching arcade theme
        speed: '5',             // Default walking speed
        ref: window.location.href  // Current game URL
    });
    
    const portalUrl = `${portalBaseUrl}/?${queryParams.toString()}`;
    console.log('Redirecting to portal:', portalUrl);
    
    // Redirect to the portal URL after a small delay
    setTimeout(() => {
        window.location.href = portalUrl;
    }, 1000);
    
    foundInteractive = true;
}

// Inside your onKeyDown method, after the check for isPortal but before the check for isBroken:

// Check if this is the return portal
else if (currentObject.userData && currentObject.userData.isReturnPortal) {
    console.log('Return portal activated!');
    
    // Add visual feedback before redirecting
    this.showInteractionFeedback('Returning to previous game...');
    
    // Get the return URL and portal parameters
    let returnUrl = currentObject.userData.returnUrl;
    const params = currentObject.userData.portalParams;
    
    // Make sure the return URL has a proper protocol
    if (!returnUrl.startsWith('http://') && !returnUrl.startsWith('https://')) {
        returnUrl = 'https://' + returnUrl;
    }
    
    console.log('Returning to:', returnUrl);
    
    // Build query parameters
    const queryParams = new URLSearchParams({
        username: this.username,
        color: params.color || 'purple',
        speed: params.speed || '5',
        portal: 'true'
    });
    
    // Add our URL as the reference
    // Check if window.location.href is a complete URL, otherwise use a fallback
    let refUrl = window.location.href;
    if (window.location.href.includes('localhost') || window.location.href.includes('127.0.0.1')) {
        // For local testing, use a placeholder production URL
        refUrl = 'https://vibearcade.example.com';
    }
    queryParams.set('ref', refUrl);
    
    // Add optional parameters if they exist
    if (params.avatarUrl) queryParams.set('avatar_url', params.avatarUrl);
    if (params.team) queryParams.set('team', params.team);
    
    // Construct final URL
    const finalUrl = returnUrl.includes('?') ? 
        `${returnUrl}&${queryParams.toString()}` : 
        `${returnUrl}?${queryParams.toString()}`;
    
    console.log('Final return URL:', finalUrl);
    
    // Redirect after a small delay
    setTimeout(() => {
        window.location.href = finalUrl;
    }, 1000);
    
    foundInteractive = true;
}

                // Check if this is the elevator
                else if (currentObject.userData && currentObject.userData.isElevator) {
                    console.log('Elevator activated!');
                    
                    // Add visual feedback
                    this.showInteractionFeedback('Taking the elevator...');
                    
                    // Play elevator sound
                    this.playSound('elevator');
                    
                    // Log the elevator interaction
                    console.log('Elevator sound played');
                    
                    foundInteractive = true;
                }
                
                // Check if this is a broken machine
                else if (currentObject.userData && currentObject.userData.isBroken) {
                    console.log('This machine is broken!');
                    this.showInteractionFeedback('OUT OF ORDER');
                    foundInteractive = true;
                }
                // Check if this is a regular arcade machine that's operational
                else if (currentObject.userData && currentObject.userData.isArcadeMachine) {
                    const machineName = currentObject.userData.machineName || 'Unnamed Machine';
                    console.log(`Arcade machine "${machineName}" activated!`);
                    
                    // Launch the mini-game overlay for this machine
                    this.launchMiniGame(currentObject);
                    
                    foundInteractive = true;
                }
                
                // Move up to the parent object if we haven't found an interactive object yet
                currentObject = currentObject.parent;
            }
            
            // If we didn't find any interactive object with userData
            if (!foundInteractive) {
                console.log('Interacted with:', intersectedObject.name || 'unnamed object');
                // Optionally show some feedback that nothing interesting was found
                this.showInteractionFeedback('Nothing interesting here');
            }
        } else {
            console.log('Nothing to interact with');
            // Optionally show some feedback that nothing was in range
            this.showInteractionFeedback('Nothing in range');
        }
    }

    // Prevent default behavior for arrow keys (scrolling)
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown' || 
        event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        event.preventDefault();
    }
}

/**
 * Parse URL query parameters and extract portal data
 * @returns {Object} Portal parameters or null if not from a portal
 */
parsePortalParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if user is coming from a portal
    if (urlParams.get('portal') === 'true') {
        return {
            fromPortal: true,
            username: urlParams.get('username') || 'Visitor',
            color: urlParams.get('color') || 'purple',
            speed: parseFloat(urlParams.get('speed')) || 5,
            ref: urlParams.get('ref') || null,
            avatarUrl: urlParams.get('avatar_url') || null,
            team: urlParams.get('team') || null
        };
    }
    
    return { fromPortal: false };
}





/**
     * Display visual feedback for interactions
     * @param {string} message - The message to display
     */
/**
 * Display visual feedback for interactions
 * @param {string} message - The message to display
 * @param {boolean} isGameOver - Whether this is a game over message
 */
showInteractionFeedback(message, isGameOver = false) {
    // Check if a feedback element already exists
    let feedbackElement = document.getElementById('interaction-feedback');

    
    
    // If not, create one
    if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.id = 'interaction-feedback';
        feedbackElement.style.position = 'fixed';
        feedbackElement.style.bottom = '20%';
        feedbackElement.style.left = '50%';
        feedbackElement.style.transform = 'translateX(-50%)';
        feedbackElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        feedbackElement.style.padding = '10px 20px';
        feedbackElement.style.borderRadius = '5px';
        feedbackElement.style.fontFamily = "'Press Start 2P', monospace";
        feedbackElement.style.fontSize = '16px';
        feedbackElement.style.zIndex = '1000';
        feedbackElement.style.textAlign = 'center';
        document.body.appendChild(feedbackElement);
    }
    

    
    // Set text color based on the message
    if (message === 'YOU WIN!') {
        feedbackElement.style.color = '#00FF00'; // Green for winning
    } else if (isGameOver) {
        feedbackElement.style.color = '#FF0000'; // Red for game over
    } else {
        feedbackElement.style.color = '#00FF00'; // Green for normal messages
    }
    
    // Update the message
    feedbackElement.textContent = message;
    feedbackElement.style.display = 'block';
    
    // Hide the message after a few seconds
    clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = setTimeout(() => {
        feedbackElement.style.display = 'none';
    }, 3000);

        // Play game over sound if this is a game over message
        if (isGameOver) {
            this.playSound('gameOver');
        }
    
}
/**
 * Launch a mini-game overlay for an arcade machine
 * 
 * ADD THIS METHOD to your ArcadeApp class, after the showInteractionFeedback method
 * 
 * @param {Object} arcadeMachine - The arcade machine object that was interacted with
 */
/**
 * Launch a mini-game overlay for an arcade machine
 * @param {Object} arcadeMachine - The arcade machine object that was interacted with
 */
/**
 * Launch a mini-game overlay for an arcade machine
 * @param {Object} arcadeMachine - The arcade machine object that was interacted with
 */
launchMiniGame(arcadeMachine) {
    console.log('Checking mini-game for:', arcadeMachine);
    
    // Check if this machine has a specific game title assigned
    if (!arcadeMachine.userData.gameTitle) {
        // If the machine doesn't have a game title, inform the user and exit
        console.log('No mini-game assigned to this machine');
        this.showInteractionFeedback('No game installed on this machine');
        return; // Exit the function early
    }
    
    // Get the game title from userData
    const gameTitle = arcadeMachine.userData.gameTitle;
    
    // Check which game to launch based on the title
    if (gameTitle === "Frogger Parody") {
        this.launchFroggerGame(arcadeMachine);
    } 
    else if (gameTitle === "Pong") {
        this.launchPongGame(arcadeMachine);
    }
    else if (gameTitle === "Space Invaders") {
        this.launchSpaceInvadersGame(arcadeMachine);
    }

else if (gameTitle === "Snake FSD") {
    this.launchSnakeGame(arcadeMachine);
}

else if (gameTitle === "Asteroids") {
    this.launchAsteroidsGame(arcadeMachine);
}

else if (gameTitle === "Pac-Man") {
    this.launchPacManGame(arcadeMachine);
}



    else {
        // If it's another title that we don't have a game for yet
        console.log('Game not implemented:', gameTitle);
        this.showInteractionFeedback('Game coming soon!');
    }
}

/**
 * Launch the Frogger mini-game
 * @param {Object} arcadeMachine - The arcade machine object
 */
launchFroggerGame(arcadeMachine) {
    // Create the fullscreen overlay
    const overlay = document.createElement('div');
    overlay.id = 'mini-game-overlay';
    
    // Style the overlay - make it truly fullscreen
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = '#000000';
    overlay.style.display = 'flex';
    overlay.style.zIndex = '2000'; // Make sure it's above everything else
    
    // Create a three-column layout
    overlay.style.flexDirection = 'row'; // Horizontal layout
    overlay.style.justifyContent = 'space-between';

    
    
    // Left panel - Instructions
    const leftPanel = document.createElement('div');
    leftPanel.style.width = '20%';
    leftPanel.style.height = '100%';
    leftPanel.style.padding = '20px';
    leftPanel.style.paddingTop = '50px';
    leftPanel.style.backgroundColor = '#111111';
    leftPanel.style.display = 'flex';
    leftPanel.style.flexDirection = 'column';
    leftPanel.style.color = '#FFFFFF';
    leftPanel.style.fontFamily = "'Press Start 2P', monospace";
    

    
    // Title and game name
    const gameTitle = document.createElement('h2');
    gameTitle.textContent = 'Frogger';
    gameTitle.style.color = '#00FF00';
    gameTitle.style.marginBottom = '30px';
    gameTitle.style.fontSize = '24px';


    
    
    // Instructions section
    const instructions = document.createElement('div');
    instructions.innerHTML = `
        <h3 style="color: #00AAFF; margin-bottom: 20px;">How To Play</h3>
        <p style="margin-bottom: 15px;">Use the <span style="color: #FFFF00;">arrow keys</span> to move the frog.</p>
        <p style="margin-bottom: 15px;">Reach the <span style="color: #00FF00;">server racks</span> at the top.</p>
        <p style="margin-bottom: 15px;">Avoid <span style="color: #FF4444;">vehicles</span> on the road.</p>
        <p style="margin-bottom: 15px;">Use <span style="color: #FFAA00;">platforms</span> to cross the data stream.</p>
        <p style="margin-bottom: 15px;">Watch out for sinking platforms!</p>
        <p style="margin-bottom: 15px;">Press <span style="color: #FFFF00;">ESC</span> to exit the game.</p>
    `;
    instructions.style.lineHeight = '1.5';
    instructions.style.fontSize = '14px';

    
    
    // Add elements to left panel
    leftPanel.appendChild(gameTitle);
    leftPanel.appendChild(instructions);
    
    // Center panel - Game container
    const centerPanel = document.createElement('div');
    centerPanel.style.flexGrow = '1';
    centerPanel.style.height = '100%';
    centerPanel.style.display = 'flex';
    centerPanel.style.justifyContent = 'center';
    centerPanel.style.alignItems = 'center';
    centerPanel.style.backgroundColor = '#000000';
    centerPanel.style.overflow = 'hidden'; // Prevent scrollbars
    
    // Game container with responsive sizing
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.style.position = 'relative';
    
    // Calculate optimal game size based on device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let gameWidth = 600;
    let gameHeight = 800;

    // Add mobile-specific styling to left panel text
if (isMobile) {
    // Make game title smaller on mobile
    gameTitle.style.fontSize = '16px';
    gameTitle.style.marginBottom = '15px';
    
    // Make instructions text smaller
    const howToPlayHeading = instructions.querySelector('h3');
    if (howToPlayHeading) {
        howToPlayHeading.style.fontSize = '12px';
        howToPlayHeading.style.marginBottom = '10px';
    }
    
    // Make all paragraphs smaller
    const paragraphs = instructions.querySelectorAll('p');
    paragraphs.forEach(p => {
        p.style.fontSize = '10px';
        p.style.marginBottom = '8px';
        p.style.lineHeight = '1.2';
    });
    
    // Adjust the left panel width to give more space to the game
    leftPanel.style.width = '15%';
    leftPanel.style.padding = '10px';
    leftPanel.style.paddingTop = '30px';
}
    
    if (isMobile) {
    // For mobile, calculate a size that fits the available space
    const availableWidth = window.innerWidth * 0.6; // Center panel is ~60% of screen width
    const availableHeight = window.innerHeight * 0.9; // Use 90% of screen height
        
    // Maintain the aspect ratio (600:800 = 3:4)
    const aspectRatio = 600/800;
    if (availableWidth / aspectRatio > availableHeight) {
        // Height is the limiting factor
        gameHeight = Math.floor(availableHeight * 0.95);
        gameWidth = Math.floor(gameHeight * aspectRatio);
    } else {
        // Width is the limiting factor
        gameWidth = Math.floor(availableWidth * 0.95);
        gameHeight = Math.floor(gameWidth / aspectRatio);
    }
}
    
    // Apply the size to the container
    gameContainer.style.width = `${gameWidth}px`;
    gameContainer.style.height = `${gameHeight}px`;
    gameContainer.style.margin = '0 auto'; // Center horizontally
    
    // Add game container to center panel
    centerPanel.appendChild(gameContainer);
    
    // Right panel - Cover art/decoration
    const rightPanel = document.createElement('div');
    rightPanel.style.width = '20%';
    rightPanel.style.height = '100%';
    rightPanel.style.backgroundColor = '#111111';
    rightPanel.style.display = 'flex';
    rightPanel.style.flexDirection = 'column';
    rightPanel.style.justifyContent = 'center';
    rightPanel.style.alignItems = 'center';
    
    // Create image element for poster
    const coverArtImage = document.createElement('img');
    coverArtImage.src = 'assets/images/frogger_poster.jpg'; // Path to your image
    coverArtImage.alt = 'Frogger Poster'; // Alt text for accessibility
    coverArtImage.style.maxWidth = '80%';      // Use max-width instead of fixed width
    coverArtImage.style.maxHeight = '80%';     // Use max-height to maintain proportions
    coverArtImage.style.objectFit = 'contain'; // 'contain' ensures the whole image is visible
    coverArtImage.style.display = 'block';     // Block display for proper centering
    coverArtImage.style.margin = '0 auto';     // Center horizontally
    
    // Add elements to right panel
    rightPanel.appendChild(coverArtImage);
    
    // Assemble the layout
    overlay.appendChild(leftPanel);
    overlay.appendChild(centerPanel);
    overlay.appendChild(rightPanel);
    
    // Add the overlay to the document
    document.body.appendChild(overlay);
    
    // Make sure mobile controls stay visible
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
        mobileControls.style.zIndex = '3000'; // Higher than the game overlay
    }
    
    // Disable all background controls
    this.disableBackgroundControls();
    
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.style.display = 'none';
    }
    
 // Launch the Frogger game with the calculated dimensions
let game = null;
game = startFroggerGame(gameContainer, (score, result) => {
    console.log(`Game over! Final score: ${score}`);
    
    // Check if the game ended with a win or loss
    if (result === 'lost' || result === 'won') {
        // GAME OVER OVERLAY - ADD THIS ENTIRE SECTION
        if (result === 'lost') {
            // Create overlay for game over screen
            const gameOverOverlay = document.createElement('div');
            gameOverOverlay.style.position = 'absolute';
            gameOverOverlay.style.top = '0';
            gameOverOverlay.style.left = '0';
            gameOverOverlay.style.width = '100%';
            gameOverOverlay.style.height = '100%';
            gameOverOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            gameOverOverlay.style.color = '#FF0000';
            gameOverOverlay.style.fontFamily = "'Press Start 2P', monospace";
            gameOverOverlay.style.fontSize = '24px';
            gameOverOverlay.style.display = 'flex';
            gameOverOverlay.style.flexDirection = 'column';
            gameOverOverlay.style.justifyContent = 'center';
            gameOverOverlay.style.alignItems = 'center';
            gameOverOverlay.style.zIndex = '1000';
            
            // Game over text
            const gameOverText = document.createElement('div');
            gameOverText.textContent = 'GAME OVER';
            gameOverText.style.marginBottom = '20px';
            
            // Returning text
            const returningText = document.createElement('div');
            returningText.textContent = 'Returning to arcade...';
            returningText.style.fontSize = '16px';
            returningText.style.color = '#FFFFFF';
            
            // Add text to overlay
            gameOverOverlay.appendChild(gameOverText);
            gameOverOverlay.appendChild(returningText);
            
            // Add overlay to game container
            gameContainer.appendChild(gameOverOverlay);
            
            // Close after delay
            setTimeout(() => {
                // Close the game
                this.closeMiniGame();
                
                // Show game over message in arcade
                this.showInteractionFeedback('GAME OVER', true);
            }, 1500); // 1.5 second delay
        } else {
            // WIN OVERLAY - ADD THIS ENTIRE SECTION
            // Create overlay for win screen
            const winOverlay = document.createElement('div');
            winOverlay.style.position = 'absolute';
            winOverlay.style.top = '0';
            winOverlay.style.left = '0';
            winOverlay.style.width = '100%';
            winOverlay.style.height = '100%';
            winOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            winOverlay.style.color = '#00FF00'; // Green for win
            winOverlay.style.fontFamily = "'Press Start 2P', monospace";
            winOverlay.style.fontSize = '24px';
            winOverlay.style.display = 'flex';
            winOverlay.style.flexDirection = 'column';
            winOverlay.style.justifyContent = 'center';
            winOverlay.style.alignItems = 'center';
            winOverlay.style.zIndex = '1000';
            
            // Win text
            const winText = document.createElement('div');
            winText.textContent = 'YOU WIN!';
            winText.style.marginBottom = '20px';
            
            // Score text
            const scoreText = document.createElement('div');
            scoreText.textContent = `Final Score: ${score}`;
            scoreText.style.fontSize = '18px';
            scoreText.style.color = '#FFFFFF';
            scoreText.style.marginBottom = '20px';
            
            // Returning text
            const returningText = document.createElement('div');
            returningText.textContent = 'Returning to arcade...';
            returningText.style.fontSize = '16px';
            returningText.style.color = '#FFFFFF';
            
            // Add text to overlay
            winOverlay.appendChild(winText);
            winOverlay.appendChild(scoreText);
            winOverlay.appendChild(returningText);
            
            // Add overlay to game container
            gameContainer.appendChild(winOverlay);
            
            // Close after delay
            setTimeout(() => {
                // Close the game
                this.closeMiniGame();
                
                // Show win message in arcade
                this.showInteractionFeedback('YOU WIN!', false);
            }, 2000); // 2 second delay for win (slightly longer than loss)
        }
        // END OF GAME OVER OVERLAY SECTION
    }
}, gameWidth, gameHeight);
    
  
    // Store reference to the current mini-game being played
    this.currentMiniGame = {
        overlay: overlay,
        machine: arcadeMachine,
        game: game
    };


// Create an input bridge for mobile controls
if (mobileControls) {
    // Create an interval to check control states and dispatch events to the game
    const inputInterval = setInterval(() => {
        // Stop checking if the game is closed
        if (!this.currentMiniGame || !this.currentMiniGame.game) {
            clearInterval(inputInterval);
            return;
        }
        
        // Process arrow key controls
        if (this.keyStates['ArrowUp']) {
            const upEvent = new KeyboardEvent('keydown', { code: 'ArrowUp' });
            game.handleKeyDown(upEvent);
        }
        if (this.keyStates['ArrowDown']) {
            const downEvent = new KeyboardEvent('keydown', { code: 'ArrowDown' });
            game.handleKeyDown(downEvent);
        }
        if (this.keyStates['ArrowLeft']) {
            const leftEvent = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
            game.handleKeyDown(leftEvent);
        }
        if (this.keyStates['ArrowRight']) {
            const rightEvent = new KeyboardEvent('keydown', { code: 'ArrowRight' });
            game.handleKeyDown(rightEvent);
        }
        
        // Process Space key for shooting/jumping
        if (this.keyStates['Space']) {
            const spaceEvent = new KeyboardEvent('keydown', { code: 'Space' });
            game.handleKeyDown(spaceEvent);
        }
        
        // Process E key for any game that uses it
        if (this.keyStates['KeyE']) {
            const eEvent = new KeyboardEvent('keydown', { code: 'KeyE' });
            game.handleKeyDown(eEvent);
        }
    }, 50); // Check every 50ms
    
    // Store the interval ID to clear it later
    this.currentMiniGame.inputInterval = inputInterval;
}
    
    // Add keyboard event listener for ESC key only
    this.miniGameKeyHandler = (event) => {
        if (event.code === 'Escape') {
            this.closeMiniGame();
        }
    };
    
    // Register the event listener
    window.addEventListener('keydown', this.miniGameKeyHandler, true);
    
    console.log(`Frogger game launched with dimensions: ${gameWidth}x${gameHeight}`);
}
/**
 * Launch the Pong mini-game
 * @param {Object} arcadeMachine - The arcade machine object
 */
launchPongGame(arcadeMachine) {

    
    // Create the fullscreen overlay
    const overlay = document.createElement('div');
    overlay.id = 'mini-game-overlay';
    
    // Style the overlay - make it truly fullscreen
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = '#000000';
    overlay.style.display = 'flex';
    overlay.style.zIndex = '2000'; // Make sure it's above everything else
    
    // Create a three-column layout
    overlay.style.flexDirection = 'row'; // Horizontal layout
    overlay.style.justifyContent = 'space-between';
    
    // Left panel - Instructions
    const leftPanel = document.createElement('div');
    leftPanel.style.width = '20%';
    leftPanel.style.height = '100%';
    leftPanel.style.padding = '20px';
    leftPanel.style.paddingTop = '50px';
    leftPanel.style.backgroundColor = '#111111';
    leftPanel.style.display = 'flex';
    leftPanel.style.flexDirection = 'column';
    leftPanel.style.color = '#FFFFFF';
    leftPanel.style.fontFamily = "'Press Start 2P', monospace";
    
    // Title and game name
    const gameTitle = document.createElement('h2');
    gameTitle.textContent = 'Pong';
    gameTitle.style.color = '#FFFFFF';
    gameTitle.style.marginBottom = '30px';
    gameTitle.style.fontSize = '24px';
    
    // Instructions section
    const instructions = document.createElement('div');
    instructions.innerHTML = `
        <h3 style="color: #00AAFF; margin-bottom: 20px;">How To Play</h3>
        <p style="margin-bottom: 15px;">Use the <span style="color: #FFFF00;">Up/Down arrows</span> to move your paddle.</p>
        <p style="margin-bottom: 15px;">Prevent the ball from passing your paddle.</p>
        <p style="margin-bottom: 15px;">Score points by getting the ball past the AI's paddle.</p>
        <p style="margin-bottom: 15px;">First to 5 points wins!</p>
        <p style="margin-bottom: 15px;">Press <span style="color: #FFFF00;">ESC</span> to exit the game.</p>
    `;
    instructions.style.lineHeight = '1.5';
    instructions.style.fontSize = '14px';
    
    // Add elements to left panel
    leftPanel.appendChild(gameTitle);
    leftPanel.appendChild(instructions);
    
    // Center panel - Game container
    const centerPanel = document.createElement('div');
    centerPanel.style.flexGrow = '1';
    centerPanel.style.height = '100%';
    centerPanel.style.paddingTop = '50px';
    centerPanel.style.display = 'flex';
    centerPanel.style.justifyContent = 'center';
    centerPanel.style.alignItems = 'center';
    centerPanel.style.backgroundColor = '#000000';
    centerPanel.style.overflow = 'hidden'; // Prevent scrollbars
    
    // Game container
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.style.position = 'relative';
    gameContainer.style.height = '100%';
    
    // Add game container to center panel
    centerPanel.appendChild(gameContainer);
    
    // Right panel - Cover art/decoration
    const rightPanel = document.createElement('div');
    rightPanel.style.width = '20%';
    rightPanel.style.height = '100%';
    rightPanel.style.backgroundColor = '#111111';
    rightPanel.style.display = 'flex';
    rightPanel.style.flexDirection = 'column';
    rightPanel.style.justifyContent = 'center';
    rightPanel.style.alignItems = 'center';
    
// Create image element for poster
const coverArtImage = document.createElement('img');
coverArtImage.src = 'assets/images/pong_poster.jpg'; // Path to your image
coverArtImage.alt = 'Pong Poster'; // Alt text for accessibility
coverArtImage.style.maxWidth = '80%';      // Use max-width instead of fixed width
coverArtImage.style.maxHeight = '80%';     // Use max-height to maintain proportions
coverArtImage.style.objectFit = 'contain'; // 'contain' ensures the whole image is visible
coverArtImage.style.display = 'block';     // Block display for proper centering
coverArtImage.style.margin = '0 auto';     // Center horizontally

    
    // Add elements to right panel
    rightPanel.appendChild(coverArtImage);
    
    // Assemble the layout
    overlay.appendChild(leftPanel);
    overlay.appendChild(centerPanel);
    overlay.appendChild(rightPanel);
    
    // Add the overlay to the document
    document.body.appendChild(overlay);
    
    // Disable all background controls
    this.disableBackgroundControls();
    
// Calculate optimal game size based on device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let gameWidth = 600;
let gameHeight = 400;

// Add mobile-specific styling to left panel text
if (isMobile) {
    // Make game title smaller on mobile
    gameTitle.style.fontSize = '16px';
    gameTitle.style.marginBottom = '15px';
    
    // Make instructions text smaller
    const howToPlayHeading = instructions.querySelector('h3');
    if (howToPlayHeading) {
        howToPlayHeading.style.fontSize = '12px';
        howToPlayHeading.style.marginBottom = '10px';
    }
    
    // Make all paragraphs smaller
    const paragraphs = instructions.querySelectorAll('p');
    paragraphs.forEach(p => {
        p.style.fontSize = '10px';
        p.style.marginBottom = '8px';
        p.style.lineHeight = '1.2';
    });
    
    // Adjust the left panel width to give more space to the game
    leftPanel.style.width = '15%';
    leftPanel.style.padding = '10px';
    leftPanel.style.paddingTop = '30px';
}

if (isMobile) {
    // For mobile, calculate a size that fits the available space
    const availableWidth = window.innerWidth * 0.6; // Center panel is ~60% of screen width
    const availableHeight = window.innerHeight * 0.9; // Use 90% of screen height
    
    // Maintain the aspect ratio (3:2 for Pong)
    const aspectRatio = 600/400; // 1.5
    
    if (availableWidth / aspectRatio <= availableHeight) {
        // Width is the limiting factor
        gameWidth = Math.floor(availableWidth * 0.95);
        gameHeight = Math.floor(gameWidth / aspectRatio);
    } else {
        // Height is the limiting factor
        gameHeight = Math.floor(availableHeight * 0.95);
        gameWidth = Math.floor(gameHeight * aspectRatio);
    }
}

// Make sure mobile controls stay visible
const mobileControls = document.getElementById('mobile-controls');
if (mobileControls) {
    mobileControls.style.zIndex = '3000'; // Higher than the game overlay
}

    // Launch the Pong game
    let game = null;
    game = startPongGame(gameContainer, (score, result) => {
        console.log(`Game over! Final score: ${score}`);
        
        // Check if the game ended with a win or loss
        if (result === 'lost' || result === 'won') {
            // Close the game
            this.closeMiniGame();
            
            // Show appropriate message
            if (result === 'won') {
                // Show "YOU WIN!" in green
                this.showInteractionFeedback('YOU WIN!', false);
            } else {
                // Show "GAME OVER" in red
                this.showInteractionFeedback('GAME OVER', true);
            }
        }
    }, gameWidth, gameHeight);
    
    // Store reference to the current mini-game being played
    this.currentMiniGame = {
        overlay: overlay,
        machine: arcadeMachine,
        game: game
    };

// Create a custom input bridge for Pong
if (mobileControls) {
    const inputInterval = setInterval(() => {
        // Stop checking if game is closed
        if (!this.currentMiniGame || !this.currentMiniGame.game) {
            clearInterval(inputInterval);
            return;
        }
        
        const pongGame = this.currentMiniGame.game;
        
        // Initialize the keys object if it doesn't exist
        if (!pongGame.keys) {
            pongGame.keys = {};
        }
        
        // Directly synchronize our keyStates with the game's keys object
        pongGame.keys['ArrowUp'] = this.keyStates['ArrowUp'];
        pongGame.keys['ArrowDown'] = this.keyStates['ArrowDown'];
        pongGame.keys['Space'] = this.keyStates['Space'];
        
        // Special case for Space key - launch ball if needed
        if (this.keyStates['Space'] && pongGame.ballStuckToPaddle && !pongGame._spaceFired) {
            pongGame._spaceFired = true; // Flag to prevent multiple launches
            pongGame.launchBall();
        } else if (!this.keyStates['Space']) {
            pongGame._spaceFired = false; // Reset flag when key is released
        }
        
    }, 16);
    
    // Store the interval ID to clear it later
    this.currentMiniGame.inputInterval = inputInterval;
}

    // Add keyboard event listener for ESC key only
    this.miniGameKeyHandler = (event) => {
        if (event.code === 'Escape') {
            this.closeMiniGame();
        }
    };
    
    // Register the event listener
    window.addEventListener('keydown', this.miniGameKeyHandler, true);
    
    console.log(`Pong game launched`);
}
/**
 * Launch the Space Invaders mini-game
 * @param {Object} arcadeMachine - The arcade machine object
 */
launchSpaceInvadersGame(arcadeMachine) {
    // Create the fullscreen overlay
    const overlay = document.createElement('div');
    overlay.id = 'mini-game-overlay';
    
    // Style the overlay - make it truly fullscreen
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = '#000000';
    overlay.style.display = 'flex';
    overlay.style.zIndex = '2000'; // Make sure it's above everything else
    
    // Create a three-column layout
    overlay.style.flexDirection = 'row'; // Horizontal layout
    overlay.style.justifyContent = 'space-between';
    
    // Left panel - Instructions
    const leftPanel = document.createElement('div');
    leftPanel.style.width = '20%';
    leftPanel.style.height = '100%';
    leftPanel.style.padding = '20px';
    leftPanel.style.paddingTop = '50px';
    leftPanel.style.backgroundColor = '#111111';
    leftPanel.style.display = 'flex';
    leftPanel.style.flexDirection = 'column';
    leftPanel.style.color = '#FFFFFF';
    leftPanel.style.fontFamily = "'Press Start 2P', monospace";
    
    // Title and game name
    const gameTitle = document.createElement('h2');
    gameTitle.textContent = 'Space Invaders';
    gameTitle.style.color = '#FFFFFF';
    gameTitle.style.marginBottom = '30px';
    gameTitle.style.fontSize = '24px';
    
    // Instructions section
    const instructions = document.createElement('div');
    instructions.innerHTML = `
        <h3 style="color: #00AAFF; margin-bottom: 20px;">How To Play</h3>
        <p style="margin-bottom: 15px;">Use the <span style="color: #FFFF00;">Left/Right arrows</span> to move your cannon.</p>
        <p style="margin-bottom: 15px;">Press <span style="color: #FFFF00;">Space/Jump</span> to fire at the invaders.</p>
        <p style="margin-bottom: 15px;">Destroy all invaders before they reach the bottom.</p>
        <p style="margin-bottom: 15px;">Watch for UFOs for bonus points!</p>
        <p style="margin-bottom: 15px;">Press <span style="color: #FFFF00;">ESC</span> to exit the game.</p>
    `;
    instructions.style.lineHeight = '1.5';
    instructions.style.fontSize = '14px';
    
    // Add elements to left panel
    leftPanel.appendChild(gameTitle);
    leftPanel.appendChild(instructions);
    
    // Center panel - Game container
    const centerPanel = document.createElement('div');
    centerPanel.style.flexGrow = '1';
    centerPanel.style.height = '100%';
    centerPanel.style.paddingTop = '50px';
    centerPanel.style.display = 'flex';
    centerPanel.style.justifyContent = 'center';
    centerPanel.style.alignItems = 'center';
    centerPanel.style.backgroundColor = '#000000';
    centerPanel.style.overflow = 'hidden'; // Prevent scrollbars
    
    // Game container
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.style.position = 'relative';
    gameContainer.style.height = '100%';
    
    // Add game container to center panel
    centerPanel.appendChild(gameContainer);
    
    // Right panel - Cover art/decoration
    const rightPanel = document.createElement('div');
    rightPanel.style.width = '20%';
    rightPanel.style.height = '100%';
    rightPanel.style.backgroundColor = '#111111';
    rightPanel.style.display = 'flex';
    rightPanel.style.flexDirection = 'column';
    rightPanel.style.justifyContent = 'center';
    rightPanel.style.alignItems = 'center';
    
// Create image element for poster
const coverArtImage = document.createElement('img');
coverArtImage.src = 'assets/images/space_invaders_poster.jpg'; // Path to your image
coverArtImage.alt = 'Space Invaders Poster'; // Alt text for accessibility
coverArtImage.style.maxWidth = '80%';      // Use max-width instead of fixed width
coverArtImage.style.maxHeight = '80%';     // Use max-height to maintain proportions
coverArtImage.style.objectFit = 'contain'; // 'contain' ensures the whole image is visible
coverArtImage.style.display = 'block';     // Block display for proper centering
coverArtImage.style.margin = '0 auto';     // Center horizontally

    
    // Add elements to right panel
    rightPanel.appendChild(coverArtImage);
    
    // Assemble the layout
    overlay.appendChild(leftPanel);
    overlay.appendChild(centerPanel);
    overlay.appendChild(rightPanel);
    
    // Add the overlay to the document
    document.body.appendChild(overlay);
    
    // Disable all background controls
    this.disableBackgroundControls();
    
// Calculate optimal game size based on device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let gameWidth = 800;
let gameHeight = 600;

// Add mobile-specific styling to left panel text
if (isMobile) {
    // Make game title smaller on mobile
    gameTitle.style.fontSize = '16px';
    gameTitle.style.marginBottom = '15px';
    
    // Make instructions text smaller
    const howToPlayHeading = instructions.querySelector('h3');
    if (howToPlayHeading) {
        howToPlayHeading.style.fontSize = '12px';
        howToPlayHeading.style.marginBottom = '10px';
    }
    
    // Make all paragraphs smaller
    const paragraphs = instructions.querySelectorAll('p');
    paragraphs.forEach(p => {
        p.style.fontSize = '10px';
        p.style.marginBottom = '8px';
        p.style.lineHeight = '1.2';
    });
    
    // Adjust the left panel width to give more space to the game
    leftPanel.style.width = '15%';
    leftPanel.style.padding = '10px';
    leftPanel.style.paddingTop = '30px';
}
if (isMobile) {
    // For mobile, calculate a size that fits the available space
    const availableWidth = window.innerWidth * 0.6; // Center panel is ~60% of screen width
    const availableHeight = window.innerHeight * 0.9; // Use 90% of screen height
    
    // Maintain the aspect ratio (4:3 for Space Invaders)
    const aspectRatio = 800/600; // 4:3
    
    if (availableWidth / aspectRatio <= availableHeight) {
        // Width is the limiting factor
        gameWidth = Math.floor(availableWidth * 0.95);
        gameHeight = Math.floor(gameWidth / aspectRatio);
    } else {
        // Height is the limiting factor
        gameHeight = Math.floor(availableHeight * 0.95);
        gameWidth = Math.floor(gameHeight * aspectRatio);
    }
}

// Make sure mobile controls stay visible
const mobileControls = document.getElementById('mobile-controls');
if (mobileControls) {
    mobileControls.style.zIndex = '3000'; // Higher than the game overlay
}

    // Launch the Space Invaders game
    let game = null;
    game = startSpaceInvadersGame(gameContainer, (score, result) => {
        console.log(`Game over! Final score: ${score}`);
        
        // Check if the game ended with a win or loss
        if (result === 'lost' || result === 'won') {
            // Close the game
            this.closeMiniGame();
            
            // Show appropriate message
            if (result === 'won') {
                // Show "YOU WIN!" in green
                this.showInteractionFeedback('YOU WIN!', false);
            } else {
                // Show "GAME OVER" in red
                this.showInteractionFeedback('GAME OVER', true);
            }
        }
    }, gameWidth, gameHeight);
    
    // Store reference to the current mini-game being played
    this.currentMiniGame = {
        overlay: overlay,
        machine: arcadeMachine,
        game: game
    };

// Create an input bridge for Space Invaders
if (mobileControls) {
    // Create an interval to directly manipulate the game's key states
    const inputInterval = setInterval(() => {
        // Stop checking if the game is closed
        if (!this.currentMiniGame || !this.currentMiniGame.game) {
            clearInterval(inputInterval);
            return;
        }
        
        const invadersGame = this.currentMiniGame.game;
        
        // If the game has a keys object, directly manipulate it
        if (invadersGame.keys) {
            // Update the game's internal key state directly
            invadersGame.keys['ArrowLeft'] = this.keyStates['ArrowLeft'];
            invadersGame.keys['ArrowRight'] = this.keyStates['ArrowRight'];
            
            // Handle space key for firing
            if (this.keyStates['Space'] && !this._lastSpaceState) {
                // Space was just pressed
                if (invadersGame.isRunning && invadersGame.player && invadersGame.player.fire) {
                    invadersGame.player.fire(invadersGame.playerBullets);
                }
            }
            // Track space key state to only fire once per press
            this._lastSpaceState = this.keyStates['Space'];
        }
    }, 16); // Run at ~60fps for smoother control
    
    // Store the interval ID to clear it later
    this.currentMiniGame.inputInterval = inputInterval;
}

    // Add keyboard event listener for ESC key only
    this.miniGameKeyHandler = (event) => {
        if (event.code === 'Escape') {
            this.closeMiniGame();
        }
    };
    
    // Register the event listener
    window.addEventListener('keydown', this.miniGameKeyHandler, true);
    
    console.log(`Space Invaders game launched`);
}

/**
 * Calculate optimal game size based on device and screen dimensions
 * @returns {Object} - Object containing optimal width and height
 */
getOptimalGameSize() {
    // Detect if on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Default desktop game size
    const defaultWidth = 800;
    const defaultHeight = 600;
    
    // Get available screen dimensions
    const availableWidth = window.innerWidth * 0.6; // Center panel is ~60% of screen
    const availableHeight = window.innerHeight * 0.8; // Account for padding
    
    // On desktop, use default dimensions
    if (!isMobile) {
        return {
            width: defaultWidth,
            height: defaultHeight
        };
    }
    
    // For mobile, calculate smaller size
    const aspectRatio = defaultWidth / defaultHeight;
    
    // Determine limiting dimension
    let optimalWidth, optimalHeight;
    
    if (availableWidth / aspectRatio <= availableHeight) {
        // Width is the limiting factor
        optimalWidth = availableWidth * 0.9; // Use 90% of available width
        optimalHeight = optimalWidth / aspectRatio;
    } else {
        // Height is the limiting factor
        optimalHeight = availableHeight * 0.9; // Use 90% of available height
        optimalWidth = optimalHeight * aspectRatio;
    }
    
    return {
        width: Math.floor(optimalWidth),
        height: Math.floor(optimalHeight)
    };
}

/**
 * Launch the Snake mini-game
 * @param {Object} arcadeMachine - The arcade machine object
 */
launchSnakeGame(arcadeMachine) {
    // Create the fullscreen overlay
    const overlay = document.createElement('div');
    overlay.id = 'mini-game-overlay';
    
    // Style the overlay - make it truly fullscreen
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = '#000000';
    overlay.style.display = 'flex';
    overlay.style.zIndex = '2000'; // Make sure it's above everything else
    
    // Create a three-column layout
    overlay.style.flexDirection = 'row'; // Horizontal layout
    overlay.style.justifyContent = 'space-between';
    
    // Left panel - Instructions
    const leftPanel = document.createElement('div');
    leftPanel.style.width = '20%';
    leftPanel.style.height = '100%';
    leftPanel.style.padding = '20px';
    leftPanel.style.paddingTop = '50px';
    leftPanel.style.backgroundColor = '#111111';
    leftPanel.style.display = 'flex';
    leftPanel.style.flexDirection = 'column';
    leftPanel.style.color = '#FFFFFF';
    leftPanel.style.fontFamily = "'Press Start 2P', monospace";
    
    // Title and game name
    const gameTitle = document.createElement('h2');
    gameTitle.textContent = 'Snake';
    gameTitle.style.color = '#33FF33';
    gameTitle.style.marginBottom = '30px';
    gameTitle.style.fontSize = '24px';
    
    // Instructions section
    const instructions = document.createElement('div');
    instructions.innerHTML = `
        <h3 style="color: #00AAFF; margin-bottom: 20px;">How To Play</h3>
        <p style="margin-bottom: 15px;">Use the <span style="color: #FFFF00;">arrow keys</span> to control the snake.</p>
        <p style="margin-bottom: 15px;">Collect <span style="color: #FFCC00;">batteries</span> to grow and score points.</p>
        <p style="margin-bottom: 15px;">Avoid hitting walls or yourself.</p>
        <p style="margin-bottom: 15px;">Press <span style="color: #FFFF00;">SPACE</span> to activate FSD Mode.</p>
        <p style="margin-bottom: 15px;"><span style="color: #FFA500;">WARNING:</span> FSD is in beta.</p>
        <p style="margin-bottom: 15px;">Press <span style="color: #FFFF00;">ESC</span> to exit the game.</p>
    `;
    instructions.style.lineHeight = '1.5';
    instructions.style.fontSize = '14px';
    
    // Add elements to left panel
    leftPanel.appendChild(gameTitle);
    leftPanel.appendChild(instructions);
    
    // Center panel - Game container
    const centerPanel = document.createElement('div');
    centerPanel.style.flexGrow = '1';
    centerPanel.style.height = '100%';
    centerPanel.style.paddingTop = '50px';
    centerPanel.style.display = 'flex';
    centerPanel.style.justifyContent = 'center';
    centerPanel.style.alignItems = 'center';
    centerPanel.style.backgroundColor = '#000000';
    centerPanel.style.overflow = 'hidden'; // Prevent scrollbars
    
    // Game container
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.style.position = 'relative';
    gameContainer.style.height = '100%';
    
    // Add game container to center panel
    centerPanel.appendChild(gameContainer);
    
    // Right panel - Cover art/decoration
    const rightPanel = document.createElement('div');
    rightPanel.style.width = '20%';
    rightPanel.style.height = '100%';
    rightPanel.style.backgroundColor = '#111111';
    rightPanel.style.display = 'flex';
    rightPanel.style.flexDirection = 'column';
    rightPanel.style.justifyContent = 'center';
    rightPanel.style.alignItems = 'center';
    
   // Create image element for poster
   const coverArtImage = document.createElement('img');
   coverArtImage.src = 'assets/images/snake_poster.png'; // Path to your image
   coverArtImage.alt = 'Snake Poster'; // Alt text for accessibility
   coverArtImage.style.maxWidth = '80%';      // Use max-width instead of fixed width
   coverArtImage.style.maxHeight = '80%';     // Use max-height to maintain proportions
   coverArtImage.style.objectFit = 'contain'; // 'contain' ensures the whole image is visible
   coverArtImage.style.display = 'block';     // Block display for proper centering
   coverArtImage.style.margin = '0 auto';     // Center horizontally
   
       
       // Add elements to right panel
       rightPanel.appendChild(coverArtImage);
    
    // Assemble the layout
    overlay.appendChild(leftPanel);
    overlay.appendChild(centerPanel);
    overlay.appendChild(rightPanel);
    
    // Add the overlay to the document
    document.body.appendChild(overlay);
    
    // Disable all background controls
    this.disableBackgroundControls();
    
// Calculate optimal game size based on device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let gameWidth = 600;
let gameHeight = 600;

// Add mobile-specific styling to left panel text
if (isMobile) {
    // Make game title smaller on mobile
    gameTitle.style.fontSize = '16px';
    gameTitle.style.marginBottom = '15px';
    
    // Make instructions text smaller
    const howToPlayHeading = instructions.querySelector('h3');
    if (howToPlayHeading) {
        howToPlayHeading.style.fontSize = '12px';
        howToPlayHeading.style.marginBottom = '10px';
    }
    
    // Make all paragraphs smaller
    const paragraphs = instructions.querySelectorAll('p');
    paragraphs.forEach(p => {
        p.style.fontSize = '10px';
        p.style.marginBottom = '8px';
        p.style.lineHeight = '1.2';
    });
    
    // Adjust the left panel width to give more space to the game
    leftPanel.style.width = '15%';
    leftPanel.style.padding = '10px';
    leftPanel.style.paddingTop = '30px';
}

if (isMobile) {
    // For mobile, calculate a size that fits the available space
    const availableWidth = window.innerWidth * 0.6; // Center panel is ~60% of screen width
    const availableHeight = window.innerHeight * 0.9; // Use 90% of screen height
    
    // Maintain the aspect ratio (1:1 for Snake)
    const aspectRatio = 1; // Square aspect ratio
    
    if (availableWidth / aspectRatio <= availableHeight) {
        // Width is the limiting factor
        gameWidth = Math.floor(availableWidth * 0.95);
        gameHeight = Math.floor(gameWidth / aspectRatio);
    } else {
        // Height is the limiting factor
        gameHeight = Math.floor(availableHeight * 0.95);
        gameWidth = Math.floor(gameHeight * aspectRatio);
    }
}

// Make sure mobile controls stay visible
const mobileControls = document.getElementById('mobile-controls');
if (mobileControls) {
    mobileControls.style.zIndex = '3000'; // Higher than the game overlay
}

    // Launch the Snake game
    let game = null;
    game = startSnakeGame(gameContainer, (score, result) => {
        console.log(`Game over! Final score: ${score}`);
        
        // Check if the game ended with a win or loss
        if (result === 'lost' || result === 'won') {
            // Close the game
            this.closeMiniGame();
            
            // Show appropriate message
            if (result === 'won') {
                // Show "YOU WIN!" in green
                this.showInteractionFeedback('YOU WIN!', false);
            } else {
                // Show "GAME OVER" in red
                this.showInteractionFeedback('GAME OVER', true);
            }
        }
    }, gameWidth, gameHeight);
    
    // Store reference to the current mini-game being played
    this.currentMiniGame = {
        overlay: overlay,
        machine: arcadeMachine,
        game: game
    };

    // Create an input bridge for mobile controls
if (mobileControls) {
    // Create an interval to check control states and dispatch events to the game
    const inputInterval = setInterval(() => {
        // Stop checking if the game is closed
        if (!this.currentMiniGame || !this.currentMiniGame.game) {
            clearInterval(inputInterval);
            return;
        }
        
        // Process arrow key controls
        if (this.keyStates['ArrowUp']) {
            const upEvent = new KeyboardEvent('keydown', { code: 'ArrowUp' });
            game.handleKeyDown(upEvent);
        }
        if (this.keyStates['ArrowDown']) {
            const downEvent = new KeyboardEvent('keydown', { code: 'ArrowDown' });
            game.handleKeyDown(downEvent);
        }
        if (this.keyStates['ArrowLeft']) {
            const leftEvent = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
            game.handleKeyDown(leftEvent);
        }
        if (this.keyStates['ArrowRight']) {
            const rightEvent = new KeyboardEvent('keydown', { code: 'ArrowRight' });
            game.handleKeyDown(rightEvent);
        }
        
        // Process Space key for shooting/jumping
        if (this.keyStates['Space']) {
            const spaceEvent = new KeyboardEvent('keydown', { code: 'Space' });
            game.handleKeyDown(spaceEvent);
        }
        
        // Process E key for any game that uses it
        if (this.keyStates['KeyE']) {
            const eEvent = new KeyboardEvent('keydown', { code: 'KeyE' });
            game.handleKeyDown(eEvent);
        }
    }, 50); // Check every 50ms
    
    // Store the interval ID to clear it later
    this.currentMiniGame.inputInterval = inputInterval;
}
    
    // Add keyboard event listener for ESC key only
    this.miniGameKeyHandler = (event) => {
        if (event.code === 'Escape') {
            this.closeMiniGame();
        }
    };
    
    // Register the event listener
    window.addEventListener('keydown', this.miniGameKeyHandler, true);
    
    console.log(`Snake game launched`);
}

/**
 * Launch the Asteroids mini-game
 * @param {Object} arcadeMachine - The arcade machine object
 */
launchAsteroidsGame(arcadeMachine) {
    // Create the fullscreen overlay
    const overlay = document.createElement('div');
    overlay.id = 'mini-game-overlay';
    
    // Style the overlay - make it truly fullscreen
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = '#000000';
    overlay.style.display = 'flex';
    overlay.style.zIndex = '2000'; // Make sure it's above everything else
    
    // Create a three-column layout
    overlay.style.flexDirection = 'row'; // Horizontal layout
    overlay.style.justifyContent = 'space-between';
    
    // Left panel - Instructions
    const leftPanel = document.createElement('div');
    leftPanel.style.width = '20%';
    leftPanel.style.height = '100%';
    leftPanel.style.padding = '20px';
    leftPanel.style.paddingTop = '50px';
    leftPanel.style.backgroundColor = '#111111';
    leftPanel.style.display = 'flex';
    leftPanel.style.flexDirection = 'column';
    leftPanel.style.color = '#FFFFFF';
    leftPanel.style.fontFamily = "'Press Start 2P', monospace";
    
    // Title and game name
    const gameTitle = document.createElement('h2');
    gameTitle.textContent = 'Asteroids';
    gameTitle.style.color = '#FFFFFF';
    gameTitle.style.marginBottom = '30px';
    gameTitle.style.fontSize = '24px';
    
    // Instructions section
    const instructions = document.createElement('div');
    instructions.innerHTML = `
        <h3 style="color: #00AAFF; margin-bottom: 20px;">How To Play</h3>
        <p style="margin-bottom: 15px;">Use <span style="color: #FFFF00;">Arrow Keys</span> to control your ship.</p>
        <p style="margin-bottom: 15px;"><span style="color: #FFFF00;">LEFT / RIGHT arrow keys</span> rotate the ship.</p>
        <p style="margin-bottom: 15px;"><span style="color: #FFFF00;">UP arrow</span> applies thrust.</p>
        <p style="margin-bottom: 15px;">Press <span style="color: #FFFF00;">SPACE/JUMP</span> to fire.</p>
        <p style="margin-bottom: 15px;">Destroy all asteroids to advance.</p>
        <p style="margin-bottom: 15px;">Press <span style="color: #FFFF00;">ESC</span> to exit the game.</p>
    `;
    instructions.style.lineHeight = '1.5';
    instructions.style.fontSize = '14px';
    
    // Add elements to left panel
    leftPanel.appendChild(gameTitle);
    leftPanel.appendChild(instructions);
    
    // Center panel - Game container
    const centerPanel = document.createElement('div');
    centerPanel.style.flexGrow = '1';
    centerPanel.style.height = '100%';
    centerPanel.style.paddingTop = '50px';
    centerPanel.style.display = 'flex';
    centerPanel.style.justifyContent = 'center';
    centerPanel.style.alignItems = 'center';
    centerPanel.style.backgroundColor = '#000000';
    centerPanel.style.overflow = 'hidden'; // Prevent scrollbars
    
    // Game container
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.style.position = 'relative';
    gameContainer.style.height = '100%';
    
    // Add game container to center panel
    centerPanel.appendChild(gameContainer);
    
    // Right panel - Cover art/decoration
    const rightPanel = document.createElement('div');
    rightPanel.style.width = '20%';
    rightPanel.style.height = '100%';
    rightPanel.style.backgroundColor = '#111111';
    rightPanel.style.display = 'flex';
    rightPanel.style.flexDirection = 'column';
    rightPanel.style.justifyContent = 'center';
    rightPanel.style.alignItems = 'center';
    
   // Create image element for poster
   const coverArtImage = document.createElement('img');
   coverArtImage.src = 'assets/images/asteroids_poster.jpg'; // Path to your image
   coverArtImage.alt = 'Asteroids Poster'; // Alt text for accessibility
   coverArtImage.style.maxWidth = '80%';      // Use max-width instead of fixed width
   coverArtImage.style.maxHeight = '80%';     // Use max-height to maintain proportions
   coverArtImage.style.objectFit = 'contain'; // 'contain' ensures the whole image is visible
   coverArtImage.style.display = 'block';     // Block display for proper centering
   coverArtImage.style.margin = '0 auto';     // Center horizontally
   
       
       // Add elements to right panel
       rightPanel.appendChild(coverArtImage);
    
    // Assemble the layout
    overlay.appendChild(leftPanel);
    overlay.appendChild(centerPanel);
    overlay.appendChild(rightPanel);
    
    // Add the overlay to the document
    document.body.appendChild(overlay);
    
    // Disable all background controls
    this.disableBackgroundControls();
    
// Inside your launchAsteroidsGame method, right before calling startAsteroidsGame:

// Calculate optimal game size based on device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let gameWidth = 600;
let gameHeight = 600;

// Add mobile-specific styling to left panel text
if (isMobile) {
    // Make game title smaller on mobile
    gameTitle.style.fontSize = '16px';
    gameTitle.style.marginBottom = '15px';
    
    // Make instructions text smaller
    const howToPlayHeading = instructions.querySelector('h3');
    if (howToPlayHeading) {
        howToPlayHeading.style.fontSize = '12px';
        howToPlayHeading.style.marginBottom = '10px';
    }
    
    // Make all paragraphs smaller
    const paragraphs = instructions.querySelectorAll('p');
    paragraphs.forEach(p => {
        p.style.fontSize = '10px';
        p.style.marginBottom = '8px';
        p.style.lineHeight = '1.2';
    });
    
    // Adjust the left panel width to give more space to the game
    leftPanel.style.width = '15%';
    leftPanel.style.padding = '10px';
    leftPanel.style.paddingTop = '30px';
}

if (isMobile) {
    // For mobile, calculate a size that fits the available space
    const availableWidth = window.innerWidth * 0.6; // Center panel is ~60% of screen width
    const availableHeight = window.innerHeight * 0.9; // Use 90% of screen height
    
    // Maintain the aspect ratio (1:1 for Asteroids)
    const aspectRatio = 1; // Square aspect ratio
    
    if (availableWidth / aspectRatio <= availableHeight) {
        // Width is the limiting factor
        gameWidth = Math.floor(availableWidth * 0.95);
        gameHeight = Math.floor(gameWidth / aspectRatio);
    } else {
        // Height is the limiting factor
        gameHeight = Math.floor(availableHeight * 0.95);
        gameWidth = Math.floor(gameHeight * aspectRatio);
    }
}

// Make sure mobile controls stay visible
const mobileControls = document.getElementById('mobile-controls');
if (mobileControls) {
    mobileControls.style.zIndex = '3000'; // Higher than the game overlay
}

    // Launch the Asteroids game
    let game = null;
    game = startAsteroidsGame(gameContainer, (score, result) => {
        console.log(`Game over! Final score: ${score}`);
        
        // Close the game
        this.closeMiniGame();
        
        // Show appropriate message
        if (result === 'won') {
            this.showInteractionFeedback('YOU WIN!', false);
        } else {
            this.showInteractionFeedback('GAME OVER', true);
        }
    }, gameWidth, gameHeight);

    
    // Store reference to the current mini-game being played
    this.currentMiniGame = {
        overlay: overlay,
        machine: arcadeMachine,
        game: game
    };

 // Create an input bridge specifically for Asteroids
if (mobileControls) {
    // Create an interval to directly update the Asteroids game's key states
    const inputInterval = setInterval(() => {
        // Stop checking if the game is closed
        if (!this.currentMiniGame || !this.currentMiniGame.game) {
            clearInterval(inputInterval);
            return;
        }
        
        // Get reference to the Asteroids game instance
        const asteroidsGame = this.currentMiniGame.game;
        
        // Make sure the game has a keys object
        if (asteroidsGame.keys) {
            // Directly update the game's key states from our mobile controls
            asteroidsGame.keys['ArrowUp'] = this.keyStates['ArrowUp'] || false;
            asteroidsGame.keys['ArrowDown'] = this.keyStates['ArrowDown'] || false;
            asteroidsGame.keys['ArrowLeft'] = this.keyStates['ArrowLeft'] || false;
            asteroidsGame.keys['ArrowRight'] = this.keyStates['ArrowRight'] || false;
            asteroidsGame.keys['Space'] = this.keyStates['Space'] || false;
            
            // Handle Spacebar for firing - manually trigger the fire method if needed
            if (this.keyStates['Space'] && !asteroidsGame.gameOver && 
                asteroidsGame.ship && asteroidsGame.ship.fireBullet) {
                
                // We need to rate-limit firing to avoid too many bullets
                // Only fire if we haven't just fired recently
                const now = Date.now();
                if (!this.lastFireTime || now - this.lastFireTime > 250) { // Fire max 4 times per second
                    asteroidsGame.ship.fireBullet(asteroidsGame.bullets);
                    this.lastFireTime = now;
                }
            }
        } else {
            console.warn("Asteroids game doesn't have a keys object");
        }
    }, 16); // ~60fps for smooth control
    
    // Store the interval ID to clear it later
    this.currentMiniGame.inputInterval = inputInterval;
}

    
    // Add keyboard event listener for ESC key only
    this.miniGameKeyHandler = (event) => {
        if (event.code === 'Escape') {
            this.closeMiniGame();
        }
    };
    
    // Register the event listener
    window.addEventListener('keydown', this.miniGameKeyHandler, true);
    
    console.log(`Asteroids game launched`);
}
/**
 * Launch the Pac-Man mini-game
 * @param {Object} arcadeMachine - The arcade machine object
 */
launchPacManGame(arcadeMachine) {
    // Create the fullscreen overlay
    const overlay = document.createElement('div');
    overlay.id = 'mini-game-overlay';
    
    // Style the overlay - make it truly fullscreen
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = '#000000';
    overlay.style.display = 'flex';
    overlay.style.zIndex = '2000'; // Make sure it's above everything else
    
    // Create a three-column layout
    overlay.style.flexDirection = 'row'; // Horizontal layout
    overlay.style.justifyContent = 'space-between';
    
    // Left panel - Instructions
    const leftPanel = document.createElement('div');
    leftPanel.style.width = '20%';
    leftPanel.style.height = '100%';
    leftPanel.style.padding = '20px';
    leftPanel.style.paddingTop = '50px';
    leftPanel.style.backgroundColor = '#111111';
    leftPanel.style.display = 'flex';
    leftPanel.style.flexDirection = 'column';
    leftPanel.style.color = '#FFFFFF';
    leftPanel.style.fontFamily = "'Press Start 2P', monospace";
    
    // Title and game name
    const gameTitle = document.createElement('h2');
    gameTitle.textContent = 'Pac-Man';
    gameTitle.style.color = '#FFFF00'; // Yellow
    gameTitle.style.marginBottom = '30px';
    gameTitle.style.fontSize = '24px';
    
    // Instructions section
    const instructions = document.createElement('div');
    instructions.innerHTML = `
        <h3 style="color: #00AAFF; margin-bottom: 20px;">How To Play</h3>
        <p style="margin-bottom: 15px;">Use <span style="color: #FFFF00;">arrow keys</span> to control Pac-Man.</p>
        <p style="margin-bottom: 15px;">Eat all the pellets to complete the level.</p>
        <p style="margin-bottom: 15px;">Avoid the ghosts!</p>
        <p style="margin-bottom: 15px;">Power pellets (larger dots) let you eat ghosts temporarily.</p>
        <p style="margin-bottom: 15px;">Press <span style="color: #FFFF00;">ESC</span> to exit the game.</p>
    `;
    instructions.style.lineHeight = '1.5';
    instructions.style.fontSize = '14px';
    
    // Add elements to left panel
    leftPanel.appendChild(gameTitle);
    leftPanel.appendChild(instructions);
    
    // Center panel - Game container
    const centerPanel = document.createElement('div');
    centerPanel.style.flexGrow = '1';
    centerPanel.style.height = '100%';
    centerPanel.style.paddingTop = '50px';
    centerPanel.style.display = 'flex';
    centerPanel.style.justifyContent = 'center';
    centerPanel.style.alignItems = 'center';
    centerPanel.style.backgroundColor = '#000000';
    centerPanel.style.overflow = 'hidden'; // Prevent scrollbars
    
    // Game container
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.style.position = 'relative';
    gameContainer.style.height = '100%';
    
    // Add game container to center panel
    centerPanel.appendChild(gameContainer);
    
    // Right panel - Cover art/decoration
    const rightPanel = document.createElement('div');
    rightPanel.style.width = '20%';
    rightPanel.style.height = '100%';
    rightPanel.style.backgroundColor = '#111111';
    rightPanel.style.display = 'flex';
    rightPanel.style.flexDirection = 'column';
    rightPanel.style.justifyContent = 'center';
    rightPanel.style.alignItems = 'center';

   // Create image element for poster
   const coverArtImage = document.createElement('img');
   coverArtImage.src = 'assets/images/pacman_poster.jpg'; // Path to your image
   coverArtImage.alt = 'Pac-Man Poster'; // Alt text for accessibility
   coverArtImage.style.maxWidth = '80%';      // Use max-width instead of fixed width
   coverArtImage.style.maxHeight = '80%';     // Use max-height to maintain proportions
   coverArtImage.style.objectFit = 'contain'; // 'contain' ensures the whole image is visible
   coverArtImage.style.display = 'block';     // Block display for proper centering
   coverArtImage.style.margin = '0 auto';     // Center horizontally
   
       
       // Add elements to right panel
       rightPanel.appendChild(coverArtImage);
    
    // Assemble the layout
    overlay.appendChild(leftPanel);
    overlay.appendChild(centerPanel);
    overlay.appendChild(rightPanel);
    
    // Add the overlay to the document
    document.body.appendChild(overlay);
    
    // Disable all background controls
    this.disableBackgroundControls();
    
// Calculate optimal game size based on device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let gameWidth = 600;
let gameHeight = 620;
// Add mobile-specific styling to left panel text
if (isMobile) {
    // Make game title smaller on mobile
    gameTitle.style.fontSize = '16px';
    gameTitle.style.marginBottom = '15px';
    
    // Make instructions text smaller
    const howToPlayHeading = instructions.querySelector('h3');
    if (howToPlayHeading) {
        howToPlayHeading.style.fontSize = '12px';
        howToPlayHeading.style.marginBottom = '10px';
    }
    
    // Make all paragraphs smaller
    const paragraphs = instructions.querySelectorAll('p');
    paragraphs.forEach(p => {
        p.style.fontSize = '10px';
        p.style.marginBottom = '8px';
        p.style.lineHeight = '1.2';
    });
    
    // Adjust the left panel width to give more space to the game
    leftPanel.style.width = '15%';
    leftPanel.style.padding = '10px';
    leftPanel.style.paddingTop = '30px';
}

if (isMobile) {
    // For mobile, calculate a size that fits the available space
    const availableWidth = window.innerWidth * 0.6; // Center panel is ~60% of screen width
    const availableHeight = window.innerHeight * 0.9; // Use 90% of screen height
    
    // Maintain the aspect ratio (600:620 ≈ 0.968)
    const aspectRatio = 600/620;
    
    if (availableWidth / aspectRatio <= availableHeight) {
        // Width is the limiting factor
        gameWidth = Math.floor(availableWidth * 0.95);
        gameHeight = Math.floor(gameWidth / aspectRatio);
    } else {
        // Height is the limiting factor
        gameHeight = Math.floor(availableHeight * 0.95);
        gameWidth = Math.floor(gameHeight * aspectRatio);
    }
}

// Make sure mobile controls stay visible
const mobileControls = document.getElementById('mobile-controls');
if (mobileControls) {
    mobileControls.style.zIndex = '3000'; // Higher than the game overlay
}

    // Launch the Pac-Man game
    let game = null;
    game = startPacManGame(gameContainer, (score, result) => {
        console.log(`Game over! Final score: ${score}`);
        
        // Close the game
        this.closeMiniGame();
        
        // Show appropriate message
        if (result === 'won') {
            this.showInteractionFeedback('YOU WIN!', false);
        } else {
            this.showInteractionFeedback('GAME OVER', true);
        }
    }, gameWidth, gameHeight);
    
    // Store reference to the current mini-game being played
    this.currentMiniGame = {
        overlay: overlay,
        machine: arcadeMachine,
        game: game
    };
    // Create an input bridge for mobile controls
if (mobileControls) {
    // Create an interval to check control states and dispatch events to the game
    const inputInterval = setInterval(() => {
        // Stop checking if the game is closed
        if (!this.currentMiniGame || !this.currentMiniGame.game) {
            clearInterval(inputInterval);
            return;
        }
        
        // Process arrow key controls
        if (this.keyStates['ArrowUp']) {
            const upEvent = new KeyboardEvent('keydown', { code: 'ArrowUp' });
            game.handleKeyDown(upEvent);
        }
        if (this.keyStates['ArrowDown']) {
            const downEvent = new KeyboardEvent('keydown', { code: 'ArrowDown' });
            game.handleKeyDown(downEvent);
        }
        if (this.keyStates['ArrowLeft']) {
            const leftEvent = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
            game.handleKeyDown(leftEvent);
        }
        if (this.keyStates['ArrowRight']) {
            const rightEvent = new KeyboardEvent('keydown', { code: 'ArrowRight' });
            game.handleKeyDown(rightEvent);
        }
        
        // Process Space key for shooting/jumping
        if (this.keyStates['Space']) {
            const spaceEvent = new KeyboardEvent('keydown', { code: 'Space' });
            game.handleKeyDown(spaceEvent);
        }
        
        // Process E key for any game that uses it
        if (this.keyStates['KeyE']) {
            const eEvent = new KeyboardEvent('keydown', { code: 'KeyE' });
            game.handleKeyDown(eEvent);
        }
    }, 50); // Check every 50ms
    
    // Store the interval ID to clear it later
    this.currentMiniGame.inputInterval = inputInterval;
}


    // Add keyboard event listener for ESC key only
    this.miniGameKeyHandler = (event) => {
        if (event.code === 'Escape') {
            this.closeMiniGame();
        }
    };
    
    // Register the event listener
    window.addEventListener('keydown', this.miniGameKeyHandler, true);
    
    console.log(`Pac-Man game launched`);
}

/**
 * Detect if the device is a mobile device
 * @returns {boolean} True if the device is mobile
 */
isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Adjust mini-game overlay for mobile devices
 * @param {HTMLElement} overlay - The mini-game overlay element
 */
adjustMiniGameForMobile(overlay) {
    if (!this.isMobileDevice()) return;
    
    // Get overlay panel elements
    const leftPanel = overlay.querySelector('div:nth-child(1)');
    const centerPanel = overlay.querySelector('div:nth-child(2)');
    const rightPanel = overlay.querySelector('div:nth-child(3)');
    
    // Adjust layout for mobile
    if (window.innerHeight < 500 || window.innerWidth < 800) {
        // Fullscreen layout with smaller panels
        leftPanel.style.width = '15%';
        leftPanel.style.fontSize = '10px';
        
        rightPanel.style.width = '15%';
        
        // Center panel adjustments
        centerPanel.style.paddingTop = '10px';
        
        // Reduce font sizes
        const title = leftPanel.querySelector('h2');
        if (title) title.style.fontSize = '16px';
        
        const instructions = leftPanel.querySelector('div');
        if (instructions) instructions.style.fontSize = '10px';
        
        // Make sure exit button is visible
        const exitButton = document.getElementById('exit-button');
        if (exitButton) exitButton.style.display = 'flex';
    }
    
    // Scale game canvas to fit available space
    const gameContainer = overlay.querySelector('#game-container');
    if (gameContainer) {
        gameContainer.style.width = '100%';
        gameContainer.style.height = '100%';
        gameContainer.style.transform = 'scale(0.9)';
        gameContainer.style.transformOrigin = 'center center';
    }
}

disableBackgroundControls() {
    // Store original enabled state to restore later
    this.controlsWereEnabled = false;
    
    if (this.controls) {
        this.controlsWereEnabled = this.controls.enabled;
        this.controls.enabled = false;
    }
    
    // Reset vertical angle when disabling controls
    this.verticalAngle = 0;
    
    // Update camera rotation to reflect reset vertical angle
    const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
    euler.x = 0;
    this.camera.quaternion.setFromEuler(euler);
    
    // Disable our other keyboard and mouse handlers
    if (this.onKeyDown) {
        window.removeEventListener('keydown', this.onKeyDown);
    }
    
    if (this.onKeyUp) {
        window.removeEventListener('keyup', this.onKeyUp);
    
    }

    this.isJumping = false;
this.jumpVelocity = 0;
this.camera.position.y = this.groundLevel;
}

/**
 * Add this method to restore background controls
 */
restoreBackgroundControls() {
    // Re-enable orbit controls if they were enabled before
    if (this.controls && this.controlsWereEnabled) {
        this.controls.enabled = true;
    }
    
    // Re-add our keyboard handlers
    if (this.onKeyDown) {
        window.addEventListener('keydown', this.onKeyDown);
    }
    
    if (this.onKeyUp) {
        window.addEventListener('keyup', this.onKeyUp);
    }
}

/**
 * Create an FPS counter display with consistent UI styling
 */
createFpsCounter() {
    // Create the FPS display container
    const display = document.createElement('div');
    display.id = 'fps-display';
    display.style.position = 'fixed';
    display.style.top = '60px'; // Position below username display (which is at 20px)
    display.style.left = '20px';
    display.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    display.style.color = '#0F0'; // Same green color as username
    display.style.padding = '10px 15px';
    display.style.borderRadius = '5px';
    display.style.fontFamily = "'Press Start 2P', monospace";
    display.style.fontSize = '14px';
    display.style.zIndex = '1000';
    display.style.pointerEvents = 'none'; // Make it non-interactive
    
    // Initialize content
    display.textContent = 'FPS: --';
    
    // Add to document
    document.body.appendChild(display);
    
    // Store reference for updates
    this.fpsDisplay = display;
    
    // FPS calculation variables
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.fpsMeasurementPeriod = 500; // Update FPS every half second
    
    console.log('FPS counter created');
}

/**
 * Update the FPS counter
 * @param {number} now - Current timestamp
 */
updateFpsCounter(now) {
    // Increment frame count
    this.frameCount++;
    
    // Check if it's time to update the displayed FPS
    if (!this.lastFpsUpdate) {
        this.lastFpsUpdate = now;
    } else if (now - this.lastFpsUpdate > this.fpsMeasurementPeriod) {
        // Calculate FPS
        const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
        
        // Update display
        if (this.fpsDisplay) {
            this.fpsDisplay.textContent = `FPS: ${fps}`;
            
            // Change color based on FPS (red if low, yellow if medium, green if high)
            if (fps < 30) {
                this.fpsDisplay.style.color = '#FF0000'; // Red for low FPS
            } else if (fps < 50) {
                this.fpsDisplay.style.color = '#FFFF00'; // Yellow for medium FPS
            } else {
                this.fpsDisplay.style.color = '#00FF00'; // Green for high FPS
            }
        }
        
        // Reset counters
        this.frameCount = 0;
        this.lastFpsUpdate = now;
    }
}



/**
 * Close the currently active mini-game overlay
 * 
 * ADD THIS METHOD to your ArcadeApp class, after the launchMiniGame method
 */
// In your existing closeMiniGame method
closeMiniGame() {
    if (this.currentMiniGame) {
                   // Clear any input bridge interval
        if (this.currentMiniGame.inputInterval) {
            clearInterval(this.currentMiniGame.inputInterval);
        }
                // Reset all key states to prevent stuck inputs
                this.keyStates['ArrowUp'] = false;
                this.keyStates['ArrowDown'] = false;
                this.keyStates['ArrowLeft'] = false;
                this.keyStates['ArrowRight'] = false;
                this.keyStates['Space'] = false;
                this.keyStates['KeyE'] = false;
        
        // Stop the game if it exists
        if (this.currentMiniGame.game) {
            try {
                if (typeof this.currentMiniGame.game.stop === 'function') {
                    this.currentMiniGame.game.stop();
                } else if (this.currentMiniGame.game.running !== undefined) {
    
                }
            } catch (e) {
                console.error('Error stopping game:', e);
            }
        }
        
        // Remove the overlay from the document
        if (this.currentMiniGame.overlay && document.body.contains(this.currentMiniGame.overlay)) {
            document.body.removeChild(this.currentMiniGame.overlay);
        }
        
        // Remove the keyboard event listener
        if (this.miniGameKeyHandler) {
            window.removeEventListener('keydown', this.miniGameKeyHandler, true);
        }
        
        // Restore background controls
        this.restoreBackgroundControls();

        const usernameDisplay = document.getElementById('username-display');
if (usernameDisplay) {
    usernameDisplay.style.display = 'block';
}



        
        console.log('Mini-game closed');
        
        // Clear the reference
        this.currentMiniGame = null;
    }
}
/**
 * Handle keyup events to stop movement when keys are released
 * @param {KeyboardEvent} event - The keyboard event
 */
onKeyUp(event) {
    // Mark this key as no longer pressed
    this.keyStates[event.code] = false;
}

/**
 * Handle continuous movement and rotation based on currently pressed keys
 */
handleMovement() {
        // Don't process movement when in a mini-game
        if (this.currentMiniGame) {
            return;
        }
    
    // If no keys are pressed, skip vertical angle handling but still process auto-return
    const anyKeysPressed = Object.values(this.keyStates).some(state => state);
    
    // Get the camera's forward direction
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    
    // Calculate horizontal-only movement direction
    const movementDirection = cameraDirection.clone();
    movementDirection.y = 0;
    movementDirection.normalize();
    
    // Calculate the right vector for strafing
    const rightVector = new THREE.Vector3(0, 1, 0).cross(movementDirection).normalize();
    
    // Get the movement distance for this frame
    const moveDistance = this.moveSpeed;
    
    // Store current y position to preserve height
    const currentY = this.camera.position.y;
    
    // Create a new position that we'll update based on input
    let newPosition = this.camera.position.clone();
    let positionChanged = false;
    
    // Handle WASD keys for movement
    if (this.keyStates['KeyW']) {
        newPosition.addScaledVector(movementDirection, moveDistance);
        positionChanged = true;
    }
    
    if (this.keyStates['KeyS']) {
        newPosition.addScaledVector(movementDirection, -moveDistance);
        positionChanged = true;
    }
    
    if (this.keyStates['KeyA']) {
        newPosition.addScaledVector(rightVector, moveDistance);
        positionChanged = true;
    }
    
    if (this.keyStates['KeyD']) {
        newPosition.addScaledVector(rightVector, -moveDistance);
        positionChanged = true;
    }
    
    // Only check collisions if we're actually moving
    if (positionChanged) {
        // Get collision-adjusted position
        const adjustedPosition = this.checkCollision(newPosition);
        
        // Update camera position
        this.camera.position.copy(adjustedPosition);
        this.camera.position.y = currentY; // Maintain height
        
        // Update controls target
        if (this.controls) {
            // Calculate how much the position changed due to collision adjustment
            const movementVector = new THREE.Vector3().subVectors(adjustedPosition, this.camera.position);
            // Update target in the same way as the camera
            this.controls.target.add(movementVector);
        }

        // Inside handleMovement(), right after updating camera position due to movement:
if (positionChanged && !this.isJumping) {
    // Play footstep sounds while walking (not jumping) with a cooldown interval
    const now = performance.now();
    if (now - this.lastFootstepTime > this.footstepInterval) {
        this.playSound('footstep');
        this.lastFootstepTime = now;
    }
}
    }
    
    // --- IMPROVED ROTATION HANDLING ---
    
    // Extract current rotation components
    const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
    let yaw = euler.y;   // Horizontal rotation (left/right)
    let pitch = euler.x; // Vertical rotation (up/down)
    
    // Handle horizontal rotation (left/right arrows)
    const rotationSpeed = 0.028;
    if (this.keyStates['ArrowLeft']) {
        yaw += rotationSpeed;
    }
    if (this.keyStates['ArrowRight']) {
        yaw -= rotationSpeed;
    }
    
    // Handle vertical rotation (up/down arrows)
    if (this.keyStates['ArrowUp']) {
        pitch = Math.min(pitch + this.lookSpeed, this.maxLookUp);
    } else if (this.keyStates['ArrowDown']) {
        pitch = Math.max(pitch - this.lookSpeed, -this.maxLookDown);
    } else if (pitch !== 0) {
        // Auto-return pitch to neutral when no up/down keys are pressed
        if (Math.abs(pitch) < this.lookReturnSpeed) {
            pitch = 0; // Snap to zero if very close
        } else if (pitch > 0) {
            pitch -= this.lookReturnSpeed;
        } else {
            pitch += this.lookReturnSpeed;
        }
    }
    
    // Always force roll to zero to prevent tilting
    const roll = 0;
    
    // Apply the updated rotation
    euler.set(pitch, yaw, roll, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
    
    // Update orbit controls target based on new camera direction
    if (this.controls) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const targetPosition = this.camera.position.clone().add(forward.multiplyScalar(5));
        this.controls.target.copy(targetPosition);
    }
    
    // Handle jumping physics
    if (this.isJumping || this.camera.position.y > this.groundLevel) {
        // Apply gravity to velocity
        this.jumpVelocity -= this.gravity;
        
        // Update position based on velocity
        this.camera.position.y += this.jumpVelocity;
        
        // Update target position for controls
        if (this.controls) {
            this.controls.target.y += this.jumpVelocity;
        }
        
        // Check if we hit the ground
        if (this.camera.position.y <= this.groundLevel && this.jumpVelocity < 0) {
            // Land on the ground
            this.camera.position.y = this.groundLevel;
            if (this.controls) {
                this.controls.target.y = this.groundLevel + this.camera.getWorldDirection(new THREE.Vector3()).y * 5;
            }
            this.isJumping = false;
            this.jumpVelocity = 0;
        }
    }
}
}