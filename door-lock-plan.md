# Door Locking Mechanism Plan

This plan outlines the steps to implement a locking mechanism for the main arcade door in `js/app.js`. The door can be unlocked either by entering the Konami code or by attempting to interact ('E' key) with the locked door 9 times.

## 1. Add State Variables

In the `ArcadeApp` class constructor (`js/app.js`):

*   `this.doorLocked = true;` (Tracks if the door is locked)
*   `this.doorInteractionAttempts = 0;` (Counts 'E' presses on the locked door)

## 2. Implement Konami Code Listener

*   In the `ArcadeApp` constructor:
    *   `this.konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];` (Using `event.code`)
    *   `this.konamiCodeProgress = 0;`
*   Modify the `onKeyDown` method:
    *   Check if the pressed key (`event.code`) matches the expected key in `this.konamiCode` based on `this.konamiCodeProgress`.
    *   If match: Increment `this.konamiCodeProgress`. If sequence complete (`this.konamiCodeProgress === this.konamiCode.length`), set `this.doorLocked = false`, reset `this.konamiCodeProgress = 0`.
    *   If no match but matches first key: Reset `this.konamiCodeProgress = 1`.
    *   Otherwise (wrong key): Reset `this.konamiCodeProgress = 0`.

## 3. Modify 'E' Interaction Logic

*   In the `onKeyDown` method, locate the existing logic for the 'E' key (keyCode 69 or `event.code === 'KeyE'`).
*   Add a check: `if (this.doorLocked) { ... } else { ... }`.
*   **Inside `if (this.doorLocked)` block:**
    *   Perform existing proximity check for the door.
    *   If near:
        *   Increment `this.doorInteractionAttempts`.
        *   Display "LOCKED" message: `this.showInteractionFeedback("LOCKED");`
        *   Play locked door sound: `this.playSound('doorLocked');`
        *   Check if `this.doorInteractionAttempts >= 9`. If yes, set `this.doorLocked = false`.
    *   Prevent the original `openDoor()` call.
*   **Inside `else` block (door is unlocked):**
    *   Keep existing logic: check proximity and call `this.openDoor()` if near.

## 4. Add Audio

*   In the `loadAudio` method (`js/app.js`), add:
    *   `loadSound('doorLocked', 'assets/sounds/door_locked.mp3');`
*   **Sound Notes:**
    *   `door_locked.mp3` plays on each 'E' press while locked.
    *   No sound plays specifically when the door *unlocks*.
    *   `door_open.mp3` (already loaded) plays when the door actually opens via `openDoor()`.

## Visual Plan (Mermaid Diagram)

```mermaid
graph TD
    A[Start Game] --> B{Door State?};
    B -- Locked --> C{Input?};
    B -- Unlocked --> D[Handle 'E' Press];

    D --> E{Player Near Door?};
    E -- Yes --> F[Call openDoor()];
    E -- No --> G[Do Nothing];
    F --> H[Door Opens - Play door_open.mp3];

    C -- 'E' Key --> I{Player Near Door?};
    C -- Konami Key --> J[Check Konami Sequence];
    C -- Other Key --> R{Key is First Konami Key?};

    I -- Yes --> K[Increment Attempts];
    I -- No --> G;

    K --> L[Show "LOCKED" message];
    L --> M[Play "doorLocked" Sound];
    M --> N{Attempts >= 9?};
    N -- Yes --> O[Set doorLocked = false];
    N -- No --> G;

    J --> P{Correct Key in Sequence?};
    P -- Yes --> Q[Advance Sequence Progress];
    P -- No --> R;

    Q --> S{Sequence Complete?};
    S -- Yes --> O;
    S -- No --> G;

    R -- Yes --> T[Reset Progress to 1];
    R -- No --> U[Reset Progress to 0];
    T --> G;
    U --> G;

    O --> V[Door Unlocked State];
    V --> B;