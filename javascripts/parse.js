$(document).ready(function() {
  parser.initialize();
});

var parser = {
  input: { form: null, regex: null, alphabet: null },
  initialize: function() {
    parser.input.form = $('main.parse form');
    parser.input.regex = $('main.parse form input[type="text"][name="regex"]');
    parser.input.alphabet = $('main.parse form input[type="text"][name="alphabet"]');

    parser.input.form.find('input[type="text"]').on('keydown', function(e) {
      parser.input.form.removeClass('invalid');
    });

    parser.input.regex.on('keyup', function(e) {
      if (!parser.input.alphabet.hasClass('modified')) {
        var value = $(this).val();
        var symbols = value.replace(/[+*()]/g, '').split('');
        var alphabet = [];
        symbols.map(function(symbol) {
          if (alphabet.indexOf(symbol) == -1) {
            alphabet.push(symbol);
          }
        });
        parser.input.alphabet.val(alphabet.join(','));
      }
    });

    parser.input.alphabet.on('change', function() {
      if ($(this).val().trim().length) {
        $(this).addClass('modified');
      }
    });

    parser.input.form.on('submit', function(e) {
      e.preventDefault();
      var regex = parser.input.regex.val();
      var alphabet = parser.input.alphabet.val().trim().split(',').join('');
      try {
        var nfa = RegexParser.parse(regex, alphabet);
        parser.input.form.addClass('hidden');
        NFAVisualizer.visualize('#container', nfa);
        $('#actions').removeClass('hidden');
      } catch (error) {
        parser.input.form.addClass('invalid');
      }
    });
  }
};