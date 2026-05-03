# 🌞 SunTrail: Eco Revival

A 2D Solar Punk game built with **Phaser + TypeScript** where the player restores a polluted world using clean energy and eco-friendly systems.

---

# 🎮 Game Concept

You play as a **Solar Ranger** 🌿 whose mission is to:

* Clean polluted land
* Generate renewable energy ⚡
* Build eco-structures
* Restore nature 🌱

No combat. Pure restoration gameplay.

---

# 🚀 Features

* 🌍 Procedurally generated map
* ⚡ Energy management system
* 🏗️ Building system (solar panels, batteries, etc.)
* 🌱 Tile restoration mechanics
* 🎨 Pixel-art styled visuals
* 🎧 Sound effects (start + movement)
* 🌫️ Ambient particle system
* 🎉 Win condition + celebration screen

---

# 🛠️ Tech Stack

* **Phaser 3**
* **TypeScript**
* **Vite**
* HTML5 Canvas

---

# 📁 Project Structure

```
src/
 ├── game/
 │    ├── GameScene.ts
 │    ├── Player.ts
 │    ├── TileMap.ts
 │    ├── BuildingSystem.ts
 │    ├── EnergySystem.ts
 │    ├── UISystem.ts
 │    └── TextureFactory.ts
 │
 ├── utils/
 │    └── (optional helpers)
 │
 ├── App.tsx
 └── main.tsx

public/
 └── sounds/
      ├── start.mp3
      └── step.mp3
```

---

# ⚙️ Installation & Setup

## 1. Clone project

```
git clone <your-repo-link>
cd project-folder
```

## 2. Install dependencies

```
npm install
```

## 3. Run project

```
npm run dev
```

## 4. Open in browser

```
http://localhost:5173
```

---

# 🔊 Sound Setup (IMPORTANT)

Sound files must be placed in:

```
public/sounds/
```

Required files:

```
start.mp3   → game start sound
step.mp3    → player movement sound
```

### ⚠️ Notes:

* File names must match EXACTLY
* Use `.mp3` format
* Browser requires user interaction (click) to play sound

---

# 🎮 Controls

| Action         | Input             |
| -------------- | ----------------- |
| Move           | Arrow Keys / WASD |
| Place Building | Left Click        |
| Deselect       | Right Click       |
| Restart        | R key             |

---

# 🏆 Win Condition

* Restore majority of polluted tiles
* Maintain energy balance
* Build sustainable ecosystem

---

# 🧠 Learning Outcomes

This project demonstrates:

* Game architecture (Phaser scenes)
* Modular system design
* Real-time updates & rendering
* Input handling
* Audio integration
* Optimization basics

---

# 🔥 Future Improvements

* 🎵 Background music
* 🌦️ Weather system
* 🧠 AI ecosystem growth
* 🗺️ Multiple levels
* 📱 Mobile support

---

# 👨‍💻 Author

Nazim
Game Developer & Student 🚀

---

# 💡 Note

If sound is not playing:

* Check file path: `/public/sounds/`
* Open sound file directly in browser
* Click on screen once (autoplay restriction)

---

# 🌟 Final Thought

> "Don’t fight the world. Heal it." 🌱

---
# SUNTRAIL-BY-GAMEMI9ER
SUNTRAIL BY GAMEMI9ER
