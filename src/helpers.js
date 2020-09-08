export function toChat(content, rollString){
    let chatData = {
        user: game.user.id,
        content,
        speaker: ChatMessage.getSpeaker(),
    }
    ChatMessage.create(chatData, {})
    if (rollString) {
        let roll = new Roll(rollString).roll();
        chatData = {
            ...chatData,
            flavor: "Treat Wounds Result",
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            roll
          }
        ChatMessage.create(chatData, {})
    }
    
}

export function tokenOrId(token) {
  let tok = null
  if (token.constructor.name == "Token") {  tok = token }
  if (token.constructor.name == "String") {  tok = canvas.tokens.get(token) }
  return tok
}

export function randomId() {
   return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function setStatus(token, img, state){
  if (state === null) token.toggleEffect(img);
  // Forced state on
  else if (state && !token.data.effects.includes(img)) {
    token.toggleEffect(img);
  }
  // Forced state off
  else if (!state && token.data.effects.includes(img)) {
    token.toggleEffect(img);
  }
}