$(document).ready(function() {
  parse.initialize();
  parse.actions();
});

var parse = {
  input: { form: null, regex: null, alphabet: null },
  output: { nfa: null, dfa: null },
  initialize: function() {
    parse.input.form = $('main.parse form');
    parse.input.regex = $('main.parse form input[type="text"][name="regex"]');
    parse.input.alphabet = $('main.parse form input[type="text"][name="alphabet"]');

    parse.input.form.find('input[type="text"]').on('keydown', function(e) {
      parse.input.form.removeClass('invalid');
    });

    parse.input.regex.on('keyup', function(e) {
      if (!parse.input.alphabet.hasClass('modified')) {
        var value = $(this).val();
        var symbols = value.replace(/[+*()]/g, '').split('');
        var alphabet = [];
        symbols.map(function(symbol) {
          if (alphabet.indexOf(symbol) == -1) {
            alphabet.push(symbol);
          }
        });
        parse.input.alphabet.val(alphabet.join(','));
      }
    });

    parse.input.alphabet.on('change', function() {
      if ($(this).val().trim().length) {
        $(this).addClass('modified');
      }
    });

    parse.input.form.on('submit', function(e) {
      e.preventDefault();
      var regex = parse.input.regex.val();
      var alphabet = parse.input.alphabet.val().trim().split(',').join('');
      try {
        parse.output.nfa = RegexParser.parse(regex, alphabet);
        parse.input.form.addClass('hidden');
        NFAVisualizer.visualize('#container', parse.output.nfa);
        $('#actions').removeClass('hidden');
      } catch (error) {
        parse.input.form.addClass('invalid');
        var input = document.querySelector('.parse input[name="regex"]');
        input.setCustomValidadity(error.messages);
      }
    });
  },
  actions: function() {
    $('.button[data-action="test-string"]').on('click', function() {
      
    });

    $('.button[data-action="convert-to-dfa"]').on('click', function() {
      parse.output.dfa = NFAConverter.convert(parse.output.nfa);
      $('#container').empty();
      $('.labels[for="#container"]').remove();
      NFAVisualizer.visualize('#container', parse.output.dfa);
    });

    $('.button[data-action="replace"]').on('click', function() {
      parse.output.nfa = null;
      parse.output.dfa = null;
      $('#container').empty();
      $('.labels[for="#container"]').remove();
      parse.input.form.removeClass('hidden');
      $('#actions').addClass('hidden');
    });
  }
};