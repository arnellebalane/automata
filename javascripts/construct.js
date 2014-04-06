$(document).ready(function() {
  construct.initialize();
  construct.actions();
});

var construct = {
  initialize: function() {
    JSFlap.transform('#arena');
  },
  actions: function() {
    $('.button[data-action="test-string"]').on('click', function() {
      $('#string-input').toggleClass('hidden');
      $('#string-input input[type="text"]').focus();
    });

    $('.button[data-action="convert-to-dfa"]').on('click', function() {
      var nfa = JSFlap.getNFA('#arena');
      var dfa = NFAConverter.convert(nfa);
      $('#arena').addClass('hidden');
      $('#container').empty();
      $('.labels[for="#container"]').remove();
      NFAVisualizer.visualize('#container', dfa);
    });
  }
};