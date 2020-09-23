import { toChat, tokenOrId, randomId } from "./helpers.js";

//Persistent damage is currently listed on bomb items under the 'property' fields
const getPersistentDamageFromBomb = (bomb) => {
  let props = ['property1', 'property2', 'property3']

  let pd = null
  for(let prop of props){
    if (bomb.data.data[prop].value.toLowerCase() == "persistent"){
      pd = JSON.parse(JSON.stringify(bomb.data.data[prop])); //break reference to actual property so we can modify it later
      break
    }
  }

  return pd
}

const getPersistentDamageFromBombForActor = (bomb, attacker, options = {}) => {
  let pd = getPersistentDamageFromBomb(bomb)

  if ( options.stickyBomb ){
    console.log("Applying sticky bomb")
  	if (!pd){ pd = { damageType: bomb.data.data.damage.damageType } } // Fix nulls for bombs without inherent persistence

  	let splashDamage = getSplashDamageFromBombForActor(bomb, attacker, options)
  	pd.bonusDamage = splashDamage
  } else {
    // Reset bonus damage
  }

  if (options.critical) {
    if (pd.bonusDamage){
      console.log(`Doubling bonus damage from ${pd.bonusDamage}`)
      pd.bonusDamage = 2 * pd.bonusDamage
      console.log(`Doubled to ${pd.bonusDamage}`)
    }

    if (pd.dice){
      console.log(`Doubling bonus dice from ${pd.dice}`)
      pd.dice = 2 * pd.dice
      console.log(`Doubled to ${pd.dice}`)
    }
  }

  return pd
}

const getDirectDamageFromBombForActor = (bomb, attacker, options = {}) => {
	let baseDamage = bomb.data.data.damage.dice + bomb.data.data.damage.die
	let rollString = `${baseDamage}`

	let bonusDamage = bomb.data.data.bonusDamage.value
	if (bonusDamage){
		rollString += `+ ${bonusDamage}`
	}

  if (options.critical){
    rollString = `2*(${rollString})`
  }

	let r = new Roll(rollString)

	r.roll()

	return r 
}

const getSplashDamageFromBombForActor = (bomb, attacker, options = {}) => {
	let splashDamage = null

	let baseSplash = bomb.data.data.splashDamage.value;

	if ( options.splash == "calculated" ){
		splashDamage = attacker.data.data.abilities.int.mod
	} else if ( options.splash == "expanded" ){
		splashDamage = attacker.data.data.abilities.int.mod + baseSplash
	}

	return splashDamage;
}

export function bombAttack(event, bombId, attacker, target, options){
  console.log("Persistent Damage | Making Bomb Attack");

  let bomb = attacker.items.find((i) => i._id === bombId )
  let splashDamage = getSplashDamageFromBombForActor(bomb, attacker, options)
  let pd = getPersistentDamageFromBombForActor(bomb, attacker, options)

  // attacker.name, bomb.name, target.name
  // pd.dice, pd.die, pd.damagetype
  const templateData = {
    actor: attacker,
    item: bomb.data,
    MAP: bomb.calculateMap(),
    token: target,
    pd: pd,
    options: JSON.stringify(options)
  };

  // Render the template
  renderTemplate("modules/persistentdamage/templates/bomb-attack-card.html", templateData)
  .then((rendered) => {
    toChat(rendered)
  });

}

const bombHit = (bombId, attackerId, targetId, options) => {
  let attacker = game.actors.find( a => a._id == attackerId)
  let target = canvas.tokens.get(targetId)
  let bomb = attacker.items.find((i) => i._id === bombId )

  let splashDamage = getSplashDamageFromBombForActor(bomb, attacker, options)
  let pd = getPersistentDamageFromBombForActor(bomb, attacker, options)

  // Roll damage
  let directDamageRoll = getDirectDamageFromBombForActor(bomb, attacker, options)

  let additionalEffects = []
  if(options.debilitating){
  	let attackerClassDC = attacker.data.data.attributes.classDC.value
  	additionalEffects.push(`Debilitating: Target makes a DC${attackerClassDC} fortitude save, or suffers the following: ${options.debilitating}`)
  }

  const templateData = {
  	id: randomId(),
    attacker: attacker,
    target: target,
    bomb: bomb,
    directDamage: directDamageRoll,
    pd: pd,
    splashDamage: splashDamage,
    additionalEffects: additionalEffects
  };

  // Render the template
  renderTemplate("modules/persistentdamage/templates/bomb-hit-damage-card.html", templateData)
  .then((rendered) => {
    toChat(rendered)
  });
}

const bombCrit = (bombId, attackerId, targetId, options) => {
  let attacker = game.actors.find( a => a._id == attackerId)
  let target = canvas.tokens.get(targetId)
  let bomb = attacker.items.find((i) => i._id === bombId )

  options.critical = true

  let splashDamage = getSplashDamageFromBombForActor(bomb, attacker, options)
  let pd = getPersistentDamageFromBombForActor(bomb, attacker, options)

  // Roll damage
  let directDamageRoll = getDirectDamageFromBombForActor(bomb, attacker, options)

  let additionalEffects = []
  if(options.debilitating){
    let attackerClassDC = attacker.data.data.attributes.classDC.value
    additionalEffects.push(`Debilitating: Target makes a DC${attackerClassDC} fortitude save, or suffers the following: ${options.debilitating}`)
  }

  const templateData = {
    id: randomId(),
    attacker: attacker,
    target: target,
    bomb: bomb,
    directDamage: directDamageRoll,
    pd: pd,
    splashDamage: splashDamage,
    additionalEffects: additionalEffects
  };

  // Render the template
  renderTemplate("modules/persistentdamage/templates/bomb-crit-damage-card.html", templateData)
  .then((rendered) => {
    toChat(rendered)
  });
}

const bombMiss = (bombId, attackerId, targetId, options) => {
  let attacker = game.actors.find( a => a._id == attackerId)
  let target = canvas.tokens.get(targetId)
  let bomb = attacker.items.find((i) => i._id === bombId )

  let splashDamage = getSplashDamageFromBombForActor(bomb, attacker, options)
  let pd = getPersistentDamageFromBombForActor(bomb, attacker, options)

  // Roll damage
  let directDamageRoll = getDirectDamageFromBombForActor(bomb, attacker, options)

  let additionalEffects = []
  if(options.debilitating){
    let attackerClassDC = attacker.data.data.attributes.classDC.value
    additionalEffects.push(`Debilitating: Target makes a DC${attackerClassDC} fortitude save, or suffers the following: ${options.debilitating}`)
  }

  const templateData = {
    id: randomId(),
    attacker: attacker,
    target: target,
    bomb: bomb,
    directDamage: directDamageRoll,
    pd: pd,
    splashDamage: splashDamage,
    additionalEffects: additionalEffects
  };

  // Render the template
  renderTemplate("modules/persistentdamage/templates/bomb-miss-damage-card.html", templateData)
  .then((rendered) => {
    toChat(rendered)
  });
}

$(document).on('click', '.bomb-hit', function(){
  let self = $(this)

  let bombId = self.data('bomb-id')
  let attacker = self.data('bomb-attacker')
  let target = self.data('bomb-target')
  let options = self.data('bomb-options')

  bombHit(bombId, attacker, target, options)
})

$(document).on('click', '.bomb-crit', function(){
  let self = $(this)

  let bombId = self.data('bomb-id')
  let attacker = self.data('bomb-attacker')
  let target = self.data('bomb-target')
  let options = self.data('bomb-options')

  bombCrit(bombId, attacker, target, options)
})

$(document).on('click', '.bomb-miss', function(){
  let self = $(this)
  let bombId = self.data('bomb-id')
  let attacker = self.data('bomb-attacker')
  let target = self.data('bomb-target')
  let options = self.data('bomb-options')

  bombMiss(bombId, attacker, target, options)
})

$(document).on('click', '.direct-apply', function(){
  let target = $(this).data("target")
  let dmgInputId = $(this).data("dmg-input")
  let dmg = $("#" + dmgInputId).val()
  let dmgType = $(this).data("dmg-type")

  game.persistentdamage.applyDirectDamage(target, dmg, dmgType)
})

$(document).on('click', '.splash-apply', function(){
  let target = $(this).data("target")
  let dmgInputId = $(this).data("dmg-input")
  let dmg = $("#" + dmgInputId).val()
  let dmgType = $(this).data("dmg-type")

  game.persistentdamage.applySplashDamage(target, dmg, dmgType)
})

$(document).on('click', '.pd-apply', function(){
  let target = $(this).data("target")
  let source = $(this).data("pd-source")
  let dmgInputId = $(this).data("pd-dmg-input")
  let dmg = $("#" + dmgInputId).val()
  let dmgType = $(this).data("pd-dmg-type")

  game.persistentdamage.applyPersistentDamage(target, source, dmg, dmgType)
})