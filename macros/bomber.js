const actor = game.actors.filter(a => { return a.name == "Naff"})[0]
const bombs = actor.items.filter((i) => i.data.data.traits.value.includes("bomb") )
const instanceId = game.persistentdamage.randomId()


let generateBombOptions = () => {
  let btns = ''
  for ( const bomb of bombs ) {
  	let btn = `<button type="button" class="bomb-selector-button-${instanceId}" data-bomb-id="${bomb._id}"><img height="20" width="20" src="${bomb.img}"> ${bomb.name}</button>`
    btns += btn
  }

  return btns
}

const debilitationConditions = [
	'dazzled',
	'deafened',
	'flatfooted',
	'-5 movement speed'
]
let generateDebilitatingOptions = () => {
  let options = ''

  for ( const condition of debilitationConditions ) {
    let option = `<option value="${condition}">${condition}</option>`
    options += option
  }

  return options
}

$(document).on('click', `.bomb-selector-button-${instanceId}`, function(){
	let bombId = $(this).data('bomb-id')

	$(this).css('background-color', 'gray')
	$(`#selected_bomb_${instanceId}`).val(bombId)
})

let applyChanges = false;
new Dialog({
  title: `Make Bomb Strike`,
  content: `
    <div>Select a type and amount.<div>
    <hr/>
    <form>
    	${generateBombOptions()}
    	<input type="hidden" id="selected_bomb_${instanceId}" />

    	<hr/>

    	<input type="checkbox" id="quick_alchemy_${instanceId}" value="true"> Quick Alchemy
    	<hr>

    	<label for="debilitating_${instanceId}">Debilitating</label>
    	<select id="debilitating_${instanceId}" name="debilitating_${instanceId}">
    		<option></option>
			${generateDebilitatingOptions()}
    	</select>
    </form>
    `,
  buttons: {
    yes: {
      icon: "<i class='fas fa-check'></i>",
      label: `Throw`,
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

      let bombId = $(`#selected_bomb_${instanceId}`).val();

      game.persistentdamage.bombAttack(event, bombId, actor, token)
    }
  }
}).render(true);
