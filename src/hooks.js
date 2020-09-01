import Tokenizer from "./tokenizer/index.js";
import ImagePicker from "./libs/ImagePicker.js";
import DirectoryPicker from "./libs/DirectoryPicker.js";

import { toChat, tokenOrId, randomId } from "./helpers.js";


export function init() {
  console.log("Persistent Damage | Init");

  game.persistentdamage = {}

  game.settings.register("persistentdamage", "default-frame-pc", {
    name: "A Test Setting",
    hint: "A test setting hint",
    type: ImagePicker.Image,
    default: "/modules/persistentdamage/img/default-frame-pc.png",
    scope: "world",
    config: true,
  });
}

const getEffectImage = (type) => {
  let img = ""
  switch(type.toLowerCase()) {
    case 'fire':
      img = "systems/pf2e/icons/spells/flaming-sphere.jpg"
      break;
    case "acid":
      img = "systems/pf2e/icons/spells/acidic-burst.jpg"
      break;
    case "cold":
      img = "systems/pf2e/icons/spells/wall-of-ice.jpg"
      break;     
    case "electricity":
      img = "systems/pf2e/icons/spells/electric-arc.jpg"
      break; 
    case "poison":
      img = "systems/pf2e/icons/spells/cloudkill.jpg"
      break; 
    case "bleed":
      img = "systems/pf2e/icons/spells/blood-vendetta.jpg"
      break;  
    case "sonic":
      img = "systems/pf2e/icons/spells/sound-burst.jpg"
      break;   
    case "positive":
      img = "systems/pf2e/icons/spells/ki-blast.jpg"
      break;        
    case "mental":
      img = "systems/pf2e/icons/spells/brain-drain.jpg"
      break;              
    default:
      // code block
  }
  return img
}

const applyPersistentDamage = (token, source, amt, type) => {
  let effect = {
    source: source,
    amt: amt,
    type: type,
    img: getEffectImage(type)
  }

  let tok = tokenOrId(token)
  if (!tok){ return }

  let effects = tok.getFlag('persistentdamage', 'effects') || {}
  let qid = randomId()

  effects[qid] = effect

  tok.setFlag('persistentdamage', 'effects', effects)
  token.toggleEffect(effect.img);
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
  
  let effects = tok.getFlag('persistentdamage', 'effects')
  if (!effects) { return }

  for (let key of Object.keys(effects)) {
    removeEffect(tok, key)
  }
}

const removeEffect = (token, effectId) => {
  let tok = tokenOrId(token)
  if (!tok){ return }

  let effects = tok.getFlag('persistentdamage', 'effects')
  let effect = effects[effectId] 

  if (tok.data.effects.includes(effect.img)) {
    tok.toggleEffect(effect.img);
  }

  delete effects[effectId]

  if (Object.keys(effects).length <= 0){
    return tok.unsetFlag('persistentdamage', 'effects')
  } else {
    return tok.setFlag('persistentdamage', 'effects', effects)
  }    
}

export function ready() {
  console.log("Persistent Damage | Ready from github");

  // check for failed registered settings
  let hasErrors = false;

  for (let s of game.settings.settings.values()) {
    if (s.module !== "persistentdamage") continue;
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
  game.persistentdamage.applyPersistentDamage = applyPersistentDamage 
  game.persistentdamage.removeAllPersistentDamage = removeAllPersistentDamage
  game.persistentdamage.randomId = randomId
  game.persistentdamage.toChat = toChat
  game.persistentdamage.bombAttack = bombAttack
}

$(document).on('click', '.pd-dmg', function(){
  let tokId = $(this).attr("data-target")
  let effectId = $(this).attr("data-pd-effect")
  let dmgInputId = $(this).attr("data-pd-dmg-input")
  let dmg = $("#" + dmgInputId).val()

  let tok = canvas.tokens.get(tokId)
  let effects = tok.getFlag('persistentdamage', 'effects')
  let effect = effects[effectId]

  let currentHp = tok.actor.data.data.attributes.hp.value

  console.log(`${currentHp} - ${dmg}`)
  tok.actor.update({'data.attributes.hp': {value: currentHp - dmg}}).then( () => {
    let msg = `${tok.name} takes ${dmg} persistent ${effect.type} damage from ${effect.source}.`
    toChat(msg)
  })
})

$(document).on('click', '.pd-remove', function(){
  let tokId = $(this).attr("data-target")
  let effectId = $(this).attr("data-pd-effect")

  let tok = canvas.tokens.get(tokId)
  let effects = tok.getFlag('persistentdamage', 'effects')
  let effect = effects[effectId]

  let msg = `${tok.name}: Persistent damage from ${effect.source} has ended.` 

  removeEffect(tok, effectId).then( () => { toChat(msg) })
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
  console.log("Persistent Damage | EOT");
  
  if (combat.combatant) {
    let tokId = combat.combatant.tokenId
    let tok = canvas.tokens.get(tokId)
    let effects = tok.getFlag('persistentdamage', 'effects')

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
  console.log("Persistent Damage | End Combat");

  removeAllPersistentDamage()
}

//Persistent damage is currently listed on bomb items under the 'property' fields
const getPersistentDamageFromBomb = (bomb) => {
  let props = ['property1', 'property2', 'property3']

  let pd = null
  for(let prop of props){
    if (bomb.data.data[prop].value.toLowerCase() == "persistent"){
      pd = bomb.data.data[prop]
      break
    }
  }

  return pd
}

const bombAttackRoll = (event, bomb, attacker) => {
  bomb.rollWeaponAttack(event)
}

export function bombAttack(event, bombId, attacker, target){
  console.log("Persistent Damage | Making Bomb Attack");

  let bomb = attacker.items.find((i) => i._id === bombId )
  let pd = getPersistentDamageFromBomb(bomb)

  let msg = ''
  msg += `${attacker.name} throws ${bomb.name} at ${target.name}.`
  msg += `<br> <input type="text" value="${pd.dice}${pd.die}"/> ${pd.damageType} <button type="button" class="apply-persistent-damage">Apply</button>`

  const templateData = {
    actor: attacker,
    item: bomb.data,
    token: target,
    pd: pd
  };

  // Render the template
  renderTemplate("modules/persistentdamage/templates/bomb-attack-card.html", templateData)
  .then((rendered) => {
    toChat(rendered)
  });

}
$(document).on('click', '.apply-persistent-damage', function(){
  let self = $(this)
  console.log(self.data('dmg-type'))
})
