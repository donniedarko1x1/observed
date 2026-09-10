# OBSERVED 0.14.1 — Mobile Adaptive Build

This build adds a mobile/touch input layer directly to the compiled web distribution while preserving keyboard/mouse controls.

## Touch controls
- Left analog stick: movement.
- Push the stick near its outer radius: sprint.
- Swipe on the right side of the screen: look around.
- ACTION: interact.
- FLASHLIGHT: toggle flashlight.
- CROUCH: toggle crouch/quiet movement.
- Pause button: opens the existing menu.
- Mobile menu includes Profile and Fullscreen (when the browser supports Fullscreen API).

## Adaptive layout
- Portrait and landscape layouts.
- Safe-area insets for notches, rounded corners, Dynamic Island / home indicator areas.
- Dynamic viewport sizing and responsive HUD/menu/dialogs.
- Touch targets are kept large enough for finger input.
- Desktop keyboard/mouse behavior remains available.

## Files modified
- dist/index.html
- dist/assets/index-ModelBreak0141.js
- dist/assets/index-ZTzNTUc9.css
