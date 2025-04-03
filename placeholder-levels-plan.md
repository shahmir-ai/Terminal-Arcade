# Plan: Create Placeholder Levels for Corridor Doors (Revised)

This plan outlines the refined steps to create placeholder JavaScript files and integrate them for the remaining interactive doors (2, 3, 10, 9) in the corridor level, based on lessons learned from implementing the first placeholder (`real_space_invaders.js`).

**Key Considerations:**

*   **Avoid Global Constants:** Do not declare constants like `WALL_HEIGHT` or `ROOM_SIZE` in the global scope of the placeholder level files to prevent naming collisions when multiple level scripts are loaded. Use literal values or define constants within the class scope if necessary.
*   **Update Game Loop:** Ensure the main `animate` loop in `js/app.js` is updated to call the `update()` method of the newly added level class.

## Phase 1: Create Placeholder Level File (`js/real_<game_name>.js`)

*(Replace `<game_name>` with the specific game, e.g., `pong`, `asteroids`)*

1.  **Create File:** Create `js/real_<game_name>.js`.
2.  **Class Structure:** Define `class Real<GameName>Level`.
    *   **Constructor:**
        *   Accept the main `app` object.
        *   Store references (`app`, `scene`, `camera`, etc.).
        *   Initialize `this.roomObjects = []`, `this.roomLights = []`.
        *   Copy player properties (`moveSpeed`, `jumpHeight`, etc.) from `app`, set `this.groundLevel = 1.5`.
        *   Copy camera rotation limits.
        *   Copy footstep sound properties.
        *   Bind methods (`init`, `update`, `handleMovement`, `checkCollision`, `createPlaceholderRoom`, `setupPlaceholderLighting`, `unload`).
    *   **`init()` Method:**
        *   Log initialization.
        *   Set scene background (`0x000000`) and remove fog.
        *   Reset camera position (`0, this.groundLevel, 0`) and rotation/look direction.
        *   Call `this.createPlaceholderRoom()`.
        *   Call `this.setupPlaceholderLighting()`.
        *   Call `this.app.enableControls()`.
        *   Return `this`.
    *   **`createPlaceholderRoom()` Method:**
        *   Define local constant `const roomSize = 20;`.
        *   Create floor, ceiling, and wall geometries (`PlaneGeometry`).
        *   Use simple `MeshStandardMaterial`s.
        *   Create meshes, position them using `roomSize` and literal `8` for wall height (e.g., `position.y = 8 / 2`).
        *   Add meshes to `this.scene` and push wall/floor meshes to `this.roomObjects`.
    *   **`setupPlaceholderLighting()` Method:**
        *   Create `AmbientLight` and `HemisphereLight`.
        *   Position `HemisphereLight` using literal `8` for height (`position.set(0, 8, 0)`).
        *   Add lights to `this.scene` and `this.roomLights`.
    *   **`handleMovement()` Method:**
        *   Copy the *entire working* `handleMovement` method from `js/real_space_invaders.js`.
    *   **`checkCollision()` Method:**
        *   Copy the *entire working* `checkCollision` method from `js/real_space_invaders.js`. Ensure it iterates through `this.roomObjects` and calculates `playerHeight` using the literal `8` (e.g., `const playerHeight = 8 * 0.9;`).
    *   **`update()` Method:**
        *   Call `this.handleMovement()`.
    *   **`unload()` Method:**
        *   Implement cleanup logic: iterate `this.roomObjects` and `this.roomLights`, remove from scene, dispose geometry/materials, clear arrays.

## Phase 2: Integrate the New Level

1.  **Modify `js/app.js` - `transitionToLevel` function:**
    *   Add a new `else if (levelName === 'real_<game_name>')` block.
    *   Inside:
        *   Unload the previous level (usually `this.levelManager.corridorLevel.unload();`).
        *   Load the script if needed: `if (typeof window.Real<GameName>Level === 'undefined') { await this.loadScript('js/real_<game_name>.js'); }`.
        *   Instantiate and store on `levelManager`: `this.levelManager.real<GameName>Level = new Real<GameName>Level(this);`.
        *   Initialize: `this.levelManager.real<GameName>Level.init();`.
        *   Update state: `this.currentLevel = 'real_<game_name>';`.
2.  **Modify `js/app.js` - `animate` function:**
    *   Add a new `else if` block to handle the new level state:
        ```javascript
        } else if (this.currentLevel === 'real_<game_name>' && this.levelManager?.real<GameName>Level?.update) {
            this.levelManager.real<GameName>Level.update();
        }
        ```
3.  **Modify `js/corridor.js` - `onKeyDown` function:**
    *   Inside the `if (event.code === 'KeyE')` block's loop, add a new `else if` condition for the specific door ID (e.g., `door.userData.doorId === 'corridor-door-2'`).
    *   Inside:
        *   `console.log(...)` interaction message.
        *   `event.stopPropagation();`.
        *   Show entry message: `this.app.showInteractionFeedback('Entering <Game Name>, good luck...');`.
        *   Transition: `this.app.transitionToLevel('real_<game_name>');`.
        *   `event.preventDefault();`.
        *   `foundInteractive = true;`.

## Level Transition Flow Diagram (Conceptual)

```mermaid
sequenceDiagram
    participant Player
    participant CorridorLevel
    participant ArcadeApp
    participant Real<GameName>Level

    Player->>CorridorLevel: Presses 'E' near Door <ID>
    CorridorLevel->>CorridorLevel: Check distance and doorId ('corridor-door-<ID>')
    CorridorLevel->>ArcadeApp: showInteractionFeedback("Entering <Game Name>...")
    CorridorLevel->>ArcadeApp: transitionToLevel('real_<game_name>')
    ArcadeApp->>ArcadeApp: fadeToBlack()
    ArcadeApp->>CorridorLevel: unload()
    ArcadeApp->>ArcadeApp: Load script 'js/real_<game_name>.js'
    ArcadeApp->>Real<GameName>Level: new Real<GameName>Level(app)
    ArcadeApp->>Real<GameName>Level: init()
    Real<GameName>Level->>Real<GameName>Level: createPlaceholderRoom()
    Real<GameName>Level->>Real<GameName>Level: setupPlaceholderLighting()
    Real<GameName>Level->>ArcadeApp: enableControls()
    ArcadeApp->>ArcadeApp: fadeFromBlack()
    Note over ArcadeApp: Animate loop now checks for 'real_<game_name>'
    ArcadeApp->>Real<GameName>Level: update()
    Real<GameName>Level->>Real<GameName>Level: handleMovement()