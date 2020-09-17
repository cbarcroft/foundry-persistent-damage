import { MODNAME } from './config.js';
import { toChat, tokenOrId, randomId, setStatus } from "./helpers.js";
import { bombAttack } from "./bombAttack.js";

const applyDamage = (actor, amt) => {
  let currentHp = actor.data.data.attributes.hp.value
  let maxHp = actor.data.data.attributes.hp.max

  let setHp = currentHp - amt
  
  setHp = Math.max(setHp, 0)
  setHp = Math.min(setHp, maxHp)

  console.log(`${currentHp}:  ${amt} => ${setHp}`)
  return actor.update({'data.attributes.hp': { value: setHp }})
}

const handleApplyPersistentDamage = (data) => {
  if (!game.user.isGM){ return }
  console.log(`${MODNAME} | Applying persistent damage`)
  let effect = {
    source: data.source,
    amt: data.amt,
    type: data.type,
    img: getEffectImage(data.type)
  }

  let tok = tokenOrId(data.token)
  if (!tok){ return }

  let effects = tok.getFlag(MODNAME, 'effects') || {}
  let qid = randomId()

  effects[qid] = effect

  tok.setFlag(MODNAME, 'effects', effects).then(() => {
    setStatus(tok, effect.img, true)
    let msg = `${tok.name} is now taking ${effect.amt} persistent ${effect.type} damage from ${effect.source}.`
    toChat(msg)  
  })
}

const handleRemovePersistentDamage = (data) => {
  if (!game.user.isGM){ return }
  console.log(`${MODNAME} | Applying persistent damage`)

  let tok = tokenOrId(data.token)
  if (!tok){ return }

  let effects = tok.getFlag(MODNAME, 'effects')
  let effect = effects[data.effectId]

  let msg = `${tok.name}: Persistent damage from ${effect.source} has ended.`  

  setStatus(tok, effect.img, false)

  delete effects[data.effectId]

  if (Object.keys(effects).length <= 0){
    tok.unsetFlag(MODNAME, 'effects').then( () => { toChat(msg) })
  } else {
    tok.setFlag(MODNAME, 'effects', effects).then( () => { toChat(msg) })
  }  
}

const handleApplyDirectDamage = (data) => {
  if (!game.user.isGM){ return }
  console.log(`${MODNAME} | Applying Direct damage`)

  let tok = canvas.tokens.get(data.token)
  let dmg = data.amt
  let type = data.type

  applyDamage(tok.actor, dmg).then( () => {
    let msg = `${tok.name} takes ${dmg} ${type} direct damage.`
    toChat(msg)
  })
}

const handleApplySplashDamage = (data) => {
  if (!game.user.isGM){ return }
  console.log(`${MODNAME} | Applying Splash damage`)

  let tok = canvas.tokens.get(data.token)
  let dmg = data.amt
  let type = data.type

  applyDamage(tok.actor, dmg).then( () => {
    let msg = `${tok.name} takes ${dmg} ${type} splash damage.`
    toChat(msg)
  })
}


export function init() {
  console.log(`${MODNAME} | Init`);

  game[MODNAME] = {}

  // game.settings.register(MODNAME, "default-frame-pc", {
  //   name: "A Test Setting",
  //   hint: "A test setting hint",
  //   type: ImagePicker.Image,
  //   default: "/modules/persistentdamage/img/default-frame-pc.png",
  //   scope: "world",
  //   config: true,
  // });

  // Set up handlers for socket messages
  game.socket.on(`module.${MODNAME}`, (data) => {
    if (data.action === 'applyPersistentDamage') handleApplyPersistentDamage(data)
    if (data.action === 'removePersistentDamage') handleRemovePersistentDamage(data)
    if (data.action === 'applyDirectDamage') handleApplyDirectDamage(data)
    if (data.action === 'applySplashDamage') handleApplySplashDamage(data)
  });  
}

const allEffects = {
  "fire": {
    "img": "systems/pf2e/icons/spells/flaming-sphere.jpg"
  },
  "acid": {
    "img": "systems/pf2e/icons/spells/acidic-burst.jpg"
  },
  "cold": {
    "img": "systems/pf2e/icons/spells/wall-of-ice.jpg"
  },
  "electricity": {
    "img": "systems/pf2e/icons/spells/electric-arc.jpg"
  },
  "poison": {
    "img": "systems/pf2e/icons/spells/cloudkill.jpg"
  },
  "bleed": {
    "img": "systems/pf2e/icons/spells/blood-vendetta.jpg"
  },
  "sonic": {
    "img": "systems/pf2e/icons/spells/sound-burst.jpg"
  },
  "positive": {
    "img": "systems/pf2e/icons/spells/ki-blast.jpg"
  },
  "mental": {
    "img": "systems/pf2e/icons/spells/brain-drain.jpg"
  }
}

const getEffectImage = (type) => {
  let effectName = type.toLowerCase()

  let img = allEffects[effectName].img || ""

  return img
}

const applyPersistentDamage = (token, source, amt, type) => {
  let tok = tokenOrId(token)
  if (!tok){ return }

  let data =  {
    action: "applyPersistentDamage",
    token: tok.id,
    source: source,
    amt: amt,
    type: type
  }    

  if (!game.user.isGM){
    game.socket.emit(`module.${MODNAME}`, data) 
  } else {
    handleApplyPersistentDamage(data)
  }  
}

const applyDirectDamage = (token, amt, type) => {
  let tok = tokenOrId(token)
  if (!tok){ return }

  let data =  {
    action: "applyDirectDamage",
    token: tok.id,
    amt: amt,
    type: type
  }    

  if (!game.user.isGM){
    game.socket.emit(`module.${MODNAME}`, data) 
  } else {
    handleApplyDirectDamage(data)
  }  
}

const applySplashDamage = (token, amt, type) => {
  let tok = tokenOrId(token)
  if (!tok){ return }

  let data =  {
    action: "applySplashDamage",
    token: tok.id,
    amt: amt,
    type: type
  }    

  if (!game.user.isGM){
    game.socket.emit(`module.${MODNAME}`, data) 
  } else {
    handleApplySplashDamage(data)
  }  
}

const removePersistentDamage = (token, effectId) => {
  let tok = tokenOrId(token)
  if (!tok){ return }

  let data = {
    action: "removePersistentDamage",
    token: tok.id,
    effectId: effectId
  }

  if (!game.user.isGM){
    game.socket.emit(`module.${MODNAME}`, data)  
  } else {
    handleRemovePersistentDamage(data)
  }

}

const removeAllPersistentDamage = () => {
  let combatants = game.combat.data.combatants

  for (let c of combatants){
    removeAllPersistentDamageFromToken(c.tokenId)
  }
}

const removeAllPersistentDamageFromToken = (token) => {
  let tok = tokenOrId(token)
  if (!tok){ return }
  
  let effects = tok.getFlag(MODNAME, 'effects')

  if (effects){
    for (let key of Object.keys(effects)) {
      removePersistentDamage(tok, key)
    }
  }
}

export function ready() {
  console.log(`${MODNAME} | Ready from github`);

  // check for failed registered settings
  let hasErrors = false;

  for (let s of game.settings.settings.values()) {
    if (s.module !== MODNAME) continue;
    try {
      game.settings.get(s.module, s.key);
    } catch (err) {
      hasErrors = true;
      ui.notifications.info(`[${s.module}] Erroneous module settings found, resetting to default.`);
      game.settings.set(s.module, s.key, s.default);
    }
  }

  if (hasErrors) {
    ui.notifications.warn("Please review the module settings to re-adjust them to your desired configuration.");
  }

  // Register module functions for external use
  game[MODNAME].applyPersistentDamage = applyPersistentDamage
  game[MODNAME].applyDirectDamage = applyDirectDamage 
  game[MODNAME].applySplashDamage = applySplashDamage
  game[MODNAME].removePersistentDamage = removePersistentDamage
  game[MODNAME].removeAllPersistentDamage = removeAllPersistentDamage
  game[MODNAME].removeAllPersistentDamageFromToken = removeAllPersistentDamageFromToken
  game[MODNAME].randomId = randomId
  game[MODNAME].toChat = toChat
  game[MODNAME].bombAttack = bombAttack
}

$(document).on('click', '.pd-dmg', function(){
  let tokId = $(this).attr("data-target")
  let effectId = $(this).attr("data-pd-effect")
  let dmgInputId = $(this).attr("data-pd-dmg-input")
  let dmg = $("#" + dmgInputId).val()

  let tok = canvas.tokens.get(tokId)
  let effects = tok.getFlag(MODNAME, 'effects')
  let effect = effects[effectId]

  let currentHp = tok.actor.data.data.attributes.hp.value

  let r = new Roll(dmg)
  r.roll()

  console.log(`${currentHp} - ${r.total}`)

  applyDamage(tok.actor, r.total).then( () => {
    let msg = `${tok.name} takes ${dmg} persistent ${effect.type} damage from ${effect.source}.`
    toChat(msg)
  })
  // tok.actor.update({'data.attributes.hp': {value: currentHp - dmg}})
})

$(document).on('click', '.pd-remove', function(){
  let tokId = $(this).attr("data-target")
  let effectId = $(this).attr("data-pd-effect")

  let tok = canvas.tokens.get(tokId)
  let effects = tok.getFlag(MODNAME, 'effects')
  let effect = effects[effectId]

  removePersistentDamage(tok, effectId)
})

// Basic flat check
let flatCheck = (dc = 15) => {
  let r = new Roll('d20');
  r.roll()

  let pass = false
  if (r.result >= dc){
    pass = true
  }

  return {pass: pass, result: r.result, color: pass ? 'green' : 'default'}
}

export function endOfTurn(combat, update) {
  console.log(`${MODNAME} | EOT`);
  
  if (combat.combatant) {
    let tokId = combat.combatant.tokenId
    let tok = canvas.tokens.get(tokId)
    let effects = tok.getFlag(MODNAME, 'effects')

    if (effects){
      console.log(effects)

      let msg = `<h4>Persistent Damage (${tok.name})</h4>`
      for (let key in effects){
        let effect = effects[key]

        // Calculate damage
        let r = new Roll(effect.amt)
        r.roll()

        // Run flat check
        let fc = flatCheck()

        let qid = randomId()

        msg += `<h5>${effect.source} (${effect.amt} ${effect.type})</h5>`
        msg += `Damage: ${r.result} ${effect.type}`
        msg += `<input type='text' value='${r.result}' id="${qid}-dmg" style="display: inline-block; width: 15%;"/>`
        //msg += `<button type='button' class='pd-dmg' data-target='${tokId}' data-pd-effect='${key}' data-pd-dmg-input='${qid}-dmg'>Apply</button>`

        msg += `<button class="dice-total-fullDamage-btn pd-dmg" data-target='${tokId}' data-pd-effect='${key}' data-pd-dmg-input='${qid}-dmg' style="width: 40px; height:16px; font-size:10px;line-height:1px">Apply</button>`

        msg += `<br>Flat check: <span style="color: ${fc.color}">${fc.result}</span>`
        msg += `&nbsp;<button class="dice-total-fullDamage-btn pd-remove" data-target='${tokId}' data-pd-effect='${key}' style="width: 22px; height:22px; font-size:10px;line-height:1px"><i class="fas fa-trash" title="Remove the effect."></i></button>`

      }
      toChat(msg)
    } else {
      console.log('No active effects for this token!')
    }
  }
}

export function deleteCombat(){
  console.log(`${MODNAME} | End Combat`);

  removeAllPersistentDamage()
}


