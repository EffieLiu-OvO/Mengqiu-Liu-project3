const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "in_progress", "completed"],
      default: "waiting",
    },
    players: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        ready: {
          type: Boolean,
          default: false,
        },
      },
    ],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    created: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    gameData: {
      boards: {
        type: Object,
        default: {},
      },
      ships: {
        type: Object,
        default: {},
      },
      moves: [
        {
          player: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          row: Number,
          col: Number,
          isHit: Boolean,
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      currentTurn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
  },
  { timestamps: true }
);

const Game = mongoose.model("Game", GameSchema);

module.exports = Game;
