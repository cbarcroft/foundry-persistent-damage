if (!token){
  ui.notifications.warn("You must have a target selected.");
} else {
  let toChat = (content, rollString) => {
      let chatData = {
          user: game.user.id,
          content,
          speaker: ChatMessage.getSpeaker()
      }
      ChatMessage.create(chatData, {})
      if (rollString) {
          let roll = new Roll(rollString).roll();
          chatData = {
              ...chatData,
              flavor: "Skill Roll",
              type: CONST.CHAT_MESSAGE_TYPES.ROLL,
              roll
            }
          ChatMessage.create(chatData, {})
      }
      
  }

  const DAMAGE_TYPES = [
    'Acid',
    'Bleed',
    'Cold',
    'Fire',
    'Electricity',
    'Mental',
    'Poison',
    'Positive',
    'Sonic'
  ]

  let generateOptions = () => {
    let options = ''
    let currentChar = game.user.character
    for ( const t of DAMAGE_TYPES ) {
      let option = `<option value="${t}">${t}</option>`
      options += option
    }

    return options
  }

  let applyChanges = false;
  new Dialog({
    title: `Apply Persistent Damage`,
    content: `
      <div>Select a type and amount.<div>
      <hr/>
      <form>
        <div class="form-group">
          <label>Source:</label>
          <input type="text" name="pd_src" />
        </div>    
        <div class="form-group">
          <label>Amount:</label>
          <input type="text" name="pd_amt" />
        </div>
        <div class="form-group">
          <label>Type:</label>
          <select id="type" name="pd_type">
            ${generateOptions()}
          </select>
        </div>
      </form>
      `,
    buttons: {
      yes: {
        icon: "<i class='fas fa-check'></i>",
        label: `Apply`,
        callback: () => applyChanges = true
      },
      no: {
        icon: "<i class='fas fa-times'></i>",
        label: `Cancel`
      },
    },
    default: "yes",
    close: html => {
      if (applyChanges) {
        let pd_type = html.find('[name="pd_type"]')[0].value;
        let pd_amt = html.find('[name="pd_amt"]')[0].value;
        let pd_src = html.find('[name="pd_src"]')[0].value;

        game.persistentdamage.applyPersistentDamage(token, pd_src, pd_amt, pd_type)

        let msg = `${token.name} is now taking ${pd_amt} persistent ${pd_type} damage from ${pd_src}.`
        game.persistentdamage.toChat(msg)
      }
    }
  }).render(true);
}

