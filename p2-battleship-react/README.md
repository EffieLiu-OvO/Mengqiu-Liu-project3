# Battleship Game - Project 2

This is an interactive Battleship game built with React as part of the CS5610 Web Development course at Northeastern University. This project transforms the static Battleship website from Project 1 into a fully interactive single-player game.

## Features

- **Two Game Modes**: 
  - Normal Mode: Standard turn-based gameplay against AI
  - Free Play Mode: Practice mode where only the player takes turns
  
- **Custom Ship Placement**:
  - Players can manually position their ships on the board
  - Alternatively, ships can be placed randomly

- **Interactive Gameplay**:
  - 10x10 game boards for both player and AI
  - Turn-based combat
  - Visual feedback for hits and misses
  - Game state tracking and win detection

- **Responsive Design**:
  - Works on both desktop and mobile devices
  - Sidebar navigation transforms to bottom navigation on small screens

- **State Management**:
  - Game state management using React Context API
  - Game state persistence using localStorage

## How to Run the Project

### Prerequisites

- Node.js (v14 or higher recommended)
- npm (v6 or higher)

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/EffieLiu-OvO/CS5610_Project2.git
cd CS5610_Project2/p2-battleship-react
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Building for Production

To create a production build:
```bash
npm run build
```

The build files will be generated in the `build` directory.

## How to Play

1. **Start a New Game**:
   - From the home page, choose either "Normal Game" or "Free Play"
   - You'll be directed to the ship placement page

2. **Place Your Ships**:
   - You can place ships manually by selecting a ship and clicking on the board
   - Click "Start Game" when ready

3. **During Gameplay**:
   - Click on cells in the enemy board to attack
   - In Normal mode, the AI will take turns attacking your board
   - In Free Play mode, only you can attack
   - The game status display shows whose turn it is and game progress

4. **Game End**:
   - The game ends when either all player ships or all enemy ships are sunk
   - Results page shows game statistics
   - You can start a new game from the results page
     
## Known Issues and Limitations

- The AI uses a simple random targeting strategy and does not employ advanced targeting algorithms
- Game statistics are not persistent between browser sessions (except for the current game state)
- Custom ship placement is limited to predefined ship sizes and quantities

## Browser Compatibility

This application has been tested on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Author

- Mengqiu Liu
- Email: liumengqiu23@gmail.com
- GitHub: [github.com/EffieLiu-OvO](https://github.com/EffieLiu-OvO)
