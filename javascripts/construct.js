$(document).ready(function() {
  construct.initialize();
  construct.actions();
});

var construct = {
  input: { form: { string: null }, string: null },
  output: { nfa: null, dfa: null },
  initialize: function() {
    construct.input.form.string = $('#string-input');
    construct.input.string = $('#string-input input[name="string"]');
    JSFlap.transform('#arena');
  },
  actions: function() {
    $('.button[data-action="test-string"]').on('click', function() {
      $('#string-input').toggleClass('hidden');
      $('#string-input input[type="text"]').focus();
    });

    $('.button[data-action="convert-to-dfa"]').on('click', function() {
      construct.output.nfa = JSFlap.getNFA('#arena');
      construct.output.dfa = NFAConverter.convert(construct.output.nfa);
      $('#arena').empty();
      $('#container').empty();
      $('.labels[for="#container"]').remove();
      NFAVisualizer.visualize('#container', construct.output.dfa);
    });

    construct.input.form.string.on('submit', function(e) {
      e.preventDefault();
      construct.output.nfa = JSFlap.getNFA('#arena');
      var start = $('circle[label="q0"]');
      $('#mover').removeClass('hidden').css({ 'top': start.offset().top - 5 + 'px', 'left': start.offset().left - 5 + 'px' });
      $('#input').removeClass('accepted rejected');
      $('#indicators').removeClass('hidden');
      var string = construct.input.string.val().trim();
      var events = [];
      construct.output[construct.output.dfa ? 'dfa' : 'nfa'].addEventListener('yield', function(e) {
        events.push(e);
      });
      var accepted = construct.output[construct.output.dfa ? 'dfa' : 'nfa'].accepts(string);

      display();
      function display() {
        if (events.length) {
          var event = events.shift();
          var state = $('circle[label="' + event.state.label + '"]');
          $('#mover').css({ 'top': state.offset().top - 6 + 'px', 'left': state.offset().left - 6 + 'px' });
          $('#input').text(event.input);
          setTimeout(display, 1000);
        } else {
          $('#input').text(accepted ? 'accepted' : 'rejected').addClass(accepted ? 'accepted' : 'rejected');
          $('#mover').addClass('hidden');
        }
      }
    });
  }
};