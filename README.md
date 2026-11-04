# Footgess Prediction Bot ??:soccer:

A Telegram bot integrated with the TON Blockchain and Football-Data.org API. This bot allows users to connect their TON wallets, check their Jetton (FOGS) balance, and predict football match results to earn points.

## :sparkles: Features

- TON Wallet Integration: Users can set their TON wallet address and check their real-time FOGS Jetton balance using @ton/ton.
- Live Football Data: Fetches upcoming matches from the English Premier League using the Football-Data.org API.
- Prediction System: Users can predict match winners using inline keyboards.
- Auto-Award System: Automatically checks match results and awards points to users with correct predictions.
- Leaderboard: Displays the top users based on their accumulated points.
- SQLite Database: Stores user predictions and points locally.

## ?? Tech Stack

- Bot Framework: Telegraf (Node.js)
- Blockchain: TON (The Open Network)
- TON SDK: @ton/ton, @ton/core
- API: Football-Data.org (v4)
- Database: SQLite3

## :rocket: How to Run

1. Clone the repository:
   `bash
   git clone https://github.com/YOUR_USERNAME/footgess-bot.git
   cd footgess-bot
## :link: Related Project
- Footgess Jetton Contract (TON): [https://github.com/kesafatttt-design/footgess-jetton-ton](https://github.com/kesafatttt-design/footgess-jetton-ton)
