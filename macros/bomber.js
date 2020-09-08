const actor = game.user.character || token ? token.actor : null
const targets = game.user.targets

if(!actor) {
  ui.notifications.warn("No actor found; you must either have an owned character (players) or select a token (GM).");
}
else if (targets.size != 1){
  ui.notifications.warn("You must have one target selected.");
} else {
  const target = Array.from(targets)[0]
  const bombs = actor.items.filter((i) => i.data.data.traits.value.includes("bomb") )
  const instanceId = game.persistentdamage.randomId()

  let generateBombOptions = () => {
    let btns = ''
    let sortedBombs = bombs.sort((a, b) => (a.name > b.name) ? 1 : -1)
    for ( const bomb of bombs ) {
      let btn = `<button type="button" class="pd-bomb-option bomb-selector-button-${instanceId}" data-bomb-id="${bomb._id}"><img height="20" width="20" src="${bomb.img}" class="pd-bomb-icon"> ${bomb.name}</button>`
      btns += btn
    }

    return btns
  }

  let generateOptions = () => {
    let opts = ''

    opts += `<label class="pd-option-label"><input type="checkbox" id="quick_alchemy_${instanceId}" value="true"> Quick Alchemy</label>`

    // Splash options
    if (actor.items.find(i => i.name === "Calculated Splash")){
      opts += "<hr>Splash: "
      opts += `<label><input type="radio" name="splash_options_${instanceId}" value="normal">Normal</label>`
      opts += `<label><input type="radio" name="splash_options_${instanceId}" value="calculated" checked>Calculated</label>`
      if (actor.items.find(i => i.name === "Expanded Splash")){
        opts += `<label><input type="radio" name="splash_options_${instanceId}" value="expanded" checked>Expanded</label>`

      }
    }

    opts += "<hr>Additives <br>"
    if (actor.items.find(i => i.name === "Sticky Bomb")){
      opts += `<label class="pd-option-label"><input type="checkbox" id="sticky_bomb_${instanceId}" value="true"> Sticky Bomb</label>`
    }
    if (actor.items.find(i => i.name === "Debilitating Bomb")){
      opts += `
        <br>
        <label for="debilitating_${instanceId}">Debilitating</label>
        <select id="debilitating_${instanceId}" name="debilitating_${instanceId}">
          <option></option>
          ${generateDebilitatingOptions()}
        </select>
      `
    }
    
    return opts
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

    $('.pd-bomb-option').css('background-color', '')

    $(this).css('background-color', 'gray')
    $(`#selected_bomb_${instanceId}`).val(bombId)
  })

  let applyChanges = false;
  new Dialog({
    title: `Make Bomb Strike`,
    content: `
      <form>
        ${generateBombOptions()}
        <input type="hidden" id="selected_bomb_${instanceId}" />

        <hr/>

        ${generateOptions()}
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

        let options = {
          quickAlchemy:  $(`#quick_alchemy_${instanceId}`).is(":checked"),
          splash: $(`input[name=splash_options_${instanceId}]:checked`).val(),
          stickyBomb: $(`#sticky_bomb_${instanceId}`).is(":checked"),
          debilitating:  $(`#debilitating_${instanceId}`).val()
        }

        console.log(options)

        game.persistentdamage.bombAttack(event, bombId, actor, target, options)
      }
    }
  }).render(true);
}

