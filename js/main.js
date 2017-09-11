/*
ALL SECTIONS RENDERING METHODS
*/

var renderElement = function(text, id, index) {
  var html = '';
  
  // spaces and section breaks
  if(id === 0 || id === 4) {
    return "";
  } 
  
  // all special characters
  else if (id > 0 && id < 7 ) {
    html = 
      "<span \
        class='element' \
        data-occurrence-id='"+id+"' \
        data-unique-id='"+index+"' \
      '>"
        +text.toString()+
      "</span>";
  } else {
    html = 
      "<span \
        class='element button imp-correct' \
        data-occurrence-id='"+id+"' \
        data-button-state='imp-correct' \
        data-unique-id='"+index+"' \
      '>"
        +text.toString()+
      "</span>";    
  }
  
    // occurrence Id Divs
    data.occurrence_groups.forEach(function(group){
  
        if(index === group[0]) {
          html = "<div class='occurrence-group'>" + html
        }
        if(index === group[group.length - 1]) {
          html = html + "</div>"
        }      
      
    })  
  
  return html;
  
}

var renderSections = function () {
  var html = "<div class='section section-1'>",
      sectionNumber = sectionNumber || 1;
  
  data.occurrences.forEach(function(occurrence, index){  
    var text = data.elements[occurrence].text,
        isSectionBreak = occurrence === 4 ? true : false;
    
    // section breaks
    if(isSectionBreak) { 
      sectionNumber += 1;
      var sectionBreak = 
          "</div><div class='section section-"+ sectionNumber +"'>"
          + renderElement(text, occurrence, index);            
      html = html + sectionBreak;
      return;      
    }
    
    html = html + renderElement(text, occurrence, index);
  })  
  return html + "</div>";
}

var render = function (container) {
    var div = document.createElement("div"),
        root = document.getElementById(container);
  
    div.classList.add("test-container");  
    div.innerHTML = renderSections();
    root.append(div);
  
    $(".section").hide();
    $(".section-1").show();
}

render("root");

/*
HASH CHANGE METHODS
*/

var onHashChange = function(event) {
  var url = new URL(event.newURL),
      hash = url.hash,
      payload;
  
  if(hash.match(/show_section/g)){
    payLoad = utils.getParameterByName("section_id", url);
    $(".section").hide();
    $(".section-" + payLoad).show();
   } 
  
  else if (hash.match(/set_state/g)){
    var $root = $("#root"),
    payLoad = utils.getParameterByName("new_state", url);
    
    if(payLoad.toString() === "true") {
      $root.removeClass("inactive")
      $('.button').unbind(); // unbind stopProp() function
    } else {
      $root.addClass("inactive");
      $('.button').bind('click', function(event){event.stopPropagation();})
    }
  }
  else if(hash.match(/post_results/g)){
    var payLoad = utils.getParameterByName("new_state", url);
    var answerBlob = {
      unique_misspoken_elements: [],
      unique_unspoken_elements: [],
      unspoken_occurrence_count: 0
    };
        
    $('[data-button-state="imp-incorrect"]').each(function(item) {
      var word = $(this).text();
      if(!answerBlob.unique_misspoken_elements.includes(word)){
        answerBlob.unique_misspoken_elements.push(word);
      }      
    });
    
    $('[data-button-state="exp-incorrect"]').each(function(item) {
      var word = $(this).text();
      if(!answerBlob.unique_misspoken_elements.includes(word)){
        answerBlob.unique_misspoken_elements.push(word);
      }      
    });    
        
    $('[data-button-state="omitted"]').each(function(item) {
      var word = $(this).text();
      answerBlob.unspoken_occurrence_count ++;
      if(!answerBlob.unique_unspoken_elements.includes(word)){
        answerBlob.unique_unspoken_elements.push(word);
      }      
    });    
    
    // Answer blob data. 
    // info on parsing/unparsing base64 with JS: https://developer.mozilla.org/en/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
    // you should remove the console logs and send data to
    // https://mydataendpoint.com/{base64ans}
    
    var strAns = JSON.stringify(answerBlob),
        base64Ans = btoa(strAns);
    console.log("raw JSON data: ", answerBlob);
    console.log("parsed to a base64 URL: ", base64Ans);
    
    $.get( payload + "?data=" + base64Ans, function(data) {
      console.log(data)
    });
    
   }   
}

window.addEventListener("hashchange", onHashChange, false);

/*
UI METHODS
*/

$('body').on('click', '.button', function(event){
  var $this = $(this),      
      buttonData = {
        uniqueId: parseInt(event.target.dataset.uniqueId),
        occurrenceId: parseInt(event.target.dataset.occurrenceId),
        targetState: event.target.dataset.buttonState
      }   
        
  switch(buttonData.targetState) {
      case "imp-correct": 
          
          // change target state
          $this.removeClass('imp-correct');
          $this.addClass('exp-incorrect');
          $this.attr('data-button-state', "exp-incorrect");
          
      
          // change subsequent buttons state
          var allButtonsArray = $('.button');
          allButtonsArray.each(function(index){ 
            
            var buttonState = $(this).attr('data-button-state'),
                occurrenceId = $(this).data('occurrence-id'),
                uniqueId = $(this).data('unique-id');
            
            // only iterate over subsequent occurrences
            if(uniqueId <= buttonData.uniqueId) {return;}             
                        
            if(buttonState === 'imp-correct' 
               && occurrenceId === buttonData.occurrenceId) 
            {
              $(this).removeClass('imp-correct');
              $(this).addClass('imp-incorrect');
              $(this).attr('data-button-state', "imp-incorrect");   

            } 
          })
          break;
      
      case "imp-incorrect":  
      
          // change target state to [omitted]
          $this.removeClass('imp-incorrect');
          $this.addClass('omitted');
          $this.attr('data-button-state', "omitted");
          break;
      
      case "omitted":  
      
          // change target state to [exp-correct]
          $this.removeClass('omitted');
          $this.addClass('exp-correct');
          $this.attr('data-button-state', "exp-correct");
      
          // change subsequent buttons state
          var allButtonsArray = $('.button');
          allButtonsArray.each(function(index){ 
            
            var buttonState = $(this).attr('data-button-state'), //Jquery attr
                occurrenceId = $(this).data('occurrence-id'),
                uniqueId = $(this).data('unique-id');            
            
            // only iterate over subsequent occurrences
            if(uniqueId <= buttonData.uniqueId) {return;}             
            if(buttonState === 'imp-incorrect' 
               && occurrenceId === buttonData.occurrenceId) 
            {
              $(this).removeClass('imp-incorrect');
              $(this).addClass('imp-correct');
              $(this).attr('data-button-state', "imp-correct");      
            } 
          })      
      
          break;      
      
      case "exp-incorrect": 
      
          // change target state to [omitted]
          $this.removeClass('exp-incorrect');
          $this.addClass('omitted');
          $this.attr('data-button-state', "omitted");
          break;     
      
      case "exp-correct": 
      
          // change target state to [imp-correct]
          $this.removeClass('exp-correct');
          $this.addClass('imp-correct');
          $this.attr('data-button-state', "imp-correct");
          break;         
      
      default:
          console.log("default")
  }
  
});

/*
HASH CHANGE EVENTS (simulation)
*/

$('body').on('click', '.trigger-show-section', function(event){
  var sectionToShow = event.target.dataset.showSection;
  window.dispatchEvent(
    new HashChangeEvent("hashchange", {
      newURL:"#action=show_section?section_id=" + sectionToShow
    })
  )
});

$('body').on('click', '.toggle-active-state', function(event){
  this.toggle = !this.toggle || false;
  window.dispatchEvent(
    new HashChangeEvent("hashchange", {
      newURL:"#action=set_state?new_state=" + this.toggle
    })
  )
});

$('body').on('click', '.submit-data', function(event){
  window.dispatchEvent(
    new HashChangeEvent("hashchange", {
      newURL:"#action=post_results?FMPurl="
    })
  )
});
