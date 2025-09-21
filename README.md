# TicTacToe React App with Supabase Integration

## Project Overview

This is a browser-based interactive TicTacToe game built using React and Tailwind CSS. It supports dynamic board sizes and persistent game storage using Supabase as the backend. The app features a game timer, undo functionality, theme switching, and a scoreboard with historical game view.

---

## Core Features

- **Dynamic Board Size**: User-selectable board size (default 3x3, supports larger boards dynamically).
- **Two-player Gameplay**: Players X and O alternate turns to place their marks.
- **Win Detection**: Automatically detects wins, draws, and highlights winning lines on the board.
- **Undo Move**: Ability to undo the last move.
- **Game Timer**: Displays elapsed time since game start.
- **Score Tracking**: Tracks wins, losses, and draws for each player (X and O).
- **Persistent Storage with Supabase**: Game state including board configuration and player turn is saved and loaded from Supabase database.
- **Historical Game View**: Displays last 10 finished games and allows viewing details in a popup.
- **Theme Switching**: Light and dark mode toggling for comfortable UI.
- **Visual Effects**: Confetti celebrations on wins; glowing highlight on current player.

---

## Additional Features

- Responsive UI with Tailwind CSS.
- Dynamic generation of winning line combinations for any board size.
- Popup component for finished game history visualization.

---

## Supabase Integration

- **Database Table**: `games`
- **Schema**:  
  | Column | Type | Description |
  |----------------|-----------------|---------------------------------------------|
  | id | integer (PK) | Auto-increment primary key |
  | board | array | Array representing the current board state |
  | current_player | string | Current player ('X' or 'O') |
  | status | string | Game status (e.g., 'start', 'in_progress', 'draw', 'Player X won', 'Player O won') |
  | created_at | timestamp | Auto-populated creation timestamp |

- Game states are saved asynchronously on every move via the Supabase JS client.
- Loads the last 10 finished games on app initialization for replay and review.
- Supabase client initialized with environment variables for project URL and anon key.

---

## Setup and Running Locally

### Prerequisites

- Node.js (version 14 or newer)
- npm package manager
- Supabase account and project with the `games` table configured according to the schema above.

### Steps

1. Clone the repository:  
   git clone https://github.com/Abhiifootie09/tictactoe-app
   cd tictactoe-app

2. Install dependencies:  
   npm install

3. Create a `.env` file in the root directory and add your Supabase credentials:  
   VITE_SUPABASE_URL=https://rqpoyonuvlhqcfwnmqnz.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxcG95b251dmxocWNmd25tcW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMzA1NjgsImV4cCI6MjA3MzgwNjU2OH0.9PajZ8fSRJgs7x3hMlf3xajOlzKbgk5lovHpbvIgxHQ

4. Start the development server:  
   npm run dev

5. Open [http://localhost:5173](http://localhost:5173) in your browser to play the game.

---

## Project Structure Highlights

- `App.tsx`: Main React component handling the gameplay logic, UI, state management, and Supabase synchronization.
- `supabaseClient.ts`: Configuration and export of Supabase client using environment variables.
- Components:
- `Scoreboard.tsx`: Shows 10 recent most game results.
- `BoardSizeSelector.tsx`: Allows changing the game board size dynamically.
- `PreviousGamePopup.tsx`: Popup modal to inspect and show finished games.
- Tailwind CSS is used for styling, responsive layout, and theming (light/dark mode).

---

## How the Game Works Internally

- The board is stored as a single-dimensional array representing the `n x n` game grid.
- Winning lines (rows, columns, diagonals) are generated dynamically based on the selected board size.
- Upon player moves, the app updates the board, checks for a winner or draw, and updates the state accordingly.
- The game timer starts on the first move and pauses when the game ends or resets.
- Moves can be undone to return to previous board states.
- Game states are immediately saved to Supabase for persistence and scoreboard updating.

---
