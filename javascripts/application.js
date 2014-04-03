$(document).ready(function() {
  parse.initialize();
});

var parse = {
  input: { regex: null, alphabet: null },
  initialize: function() {
    parse.input.regex = $('main.parse form input[type="text"][name="regex"]');
    parse.input.alphabet = $('main.parse form input[type="text"][name="alphabet"]');
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
  }
};