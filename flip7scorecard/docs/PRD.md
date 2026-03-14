# Product Requirements Document — Flip 7 Scorecard

**Date:** 2026-03-14
**Status:** Approved

---

## Overview

A mobile-first, single-page web app for tracking scores in the card game **Flip 7**. The app runs entirely in the browser with no backend — all state is persisted in `localStorage`. It is designed to be passed around a table on a phone while a game is in progress.

---

## Goals

- Replace pen-and-paper scorekeeping with a clean, fast mobile interface
- Zero friction to start: open URL, add players, play
- Survive accidental page refreshes without losing the game

---

## Game Rules Reference

| Rule | Detail |
|------|--------|
| Round score | Sum of number cards × (X2 if held) + flat modifiers (+2/+4/+6/+8/+10) + optional +15 Flip 7 bonus |
| Bust | Player scores **0** for the round |
| Win condition | First player to reach **200+ cumulative points**; highest total wins |

---

## Users

A group of 1–12 people sitting around a table playing Flip 7. One person (the "scorer") typically holds the phone and enters scores, though the phone may be passed around. Users have no expectation of creating accounts or syncing data across devices.

---

## Functional Requirements

| ID | Requirement |
|----|-------------|
| F1 | Support 1–12 players per game |
| F2 | Add and remove players at any point during the game |
| F3 | Enter a score for any player in any order each round |
| F4 | "Bust" shortcut sets a player's round score to 0 |
| F5 | Show each player's cumulative score prominently |
| F6 | Show all previous round totals per player, with strikethrough and low visual prominence |
| F7 | Current-round scores (including bust) remain editable until End Round is confirmed |
| F8 | An explicit "End Round" button advances the round; enabled once at least one score is entered and at least one player is in the game |
| F9 | After End Round, detect if any player has reached 200+ and display a winner banner |
| F10 | "New Game" resets the game (confirmation required) |
| F11 | Game state persists across page refreshes via `localStorage` |

---

## Non-Functional Requirements

- **Mobile-first**: Designed for phone screens; large touch targets; numeric keyboard on score input
- **Static**: No server, no backend, no accounts — deployable as a plain static site
- **Single page**: No navigation or routing
- **Performance**: Instant load; no external API calls

---

## User Stories

**Starting a game**
> As a player, I want to quickly add everyone's names and start tracking scores so we don't have to find a pen.

**Entering scores**
> As the scorer, I want to tap a player and enter their score for the round so I can record results in any order.

**Handling a bust**
> As the scorer, I want a one-tap "Bust" button so I don't have to type 0 every time someone busts.

**Reviewing history**
> As a player, I want to see all previous round totals at a glance so I can track how the game is going.

**Correcting a mistake**
> As the scorer, I want to re-open a player's score entry and change it before ending the round, so mistakes don't stick.

**Finishing the game**
> As a player, I want to see a clear winner announcement when someone hits 200 so the game ending is obvious.

**Recovering from refresh**
> As a player, I want the scores to still be there if someone accidentally refreshes the page.

---

## Out of Scope (MVP)

- Turn order enforcement
- Multiple simultaneous games
- Game history / statistics
- Undo/redo
- Backend, sync, or accounts
- PWA / install prompt
- **Card calculator** — post-MVP feature: a modal with tappable card buttons to assist with round score arithmetic

---

## Post-MVP: Card Calculator

A modal accessible from the score entry row. Players can tap number cards (0–12), modifier cards (+2/+4/+6/+8/+10), and the X2 multiplier to build their hand; the total is calculated automatically and can be applied to the score input. Keeps the main scoreboard uncluttered.
