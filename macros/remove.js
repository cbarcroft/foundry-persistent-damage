if(!token) {
  ui.notifications.warn("No token selected.");
} else {
  game.persistentdamage.removeAllPersistentDamageFromToken(token)
}