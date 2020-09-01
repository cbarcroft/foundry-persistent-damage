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