const blockedPasswords = ['passw0rd', 'p@ssw0rd', '123456abc', '123abcdef', 'abc123456', 'abcdef123'];

function checkPasswordStrength(pass) {
  if (pass.length < 8) return "Your password must be at least 8 characters long.";
  var lower = false,
    upper = false,
    number = false;
  if (pass.includes(new Date().getFullYear())) {
    return "Your password cannot contain the current year, that's not secure!";
  }
  for (var i = 0; i < pass.length; i++) {
    const char = pass.charAt(i);
    if (isNumeric(char)) {
      number = true;
      continue;
    }
    if (char == char.toLowerCase()) {
      lower = true;
      continue;
    }
    if (char == char.toUpperCase()) {
      upper = true;
      continue;
    }
  }
  if (!lower || !upper || !number) {
    return "Your password must have lowercase characters, uppercase characters, and numbers.";
  }
  if (blockedPasswords.indexOf(pass.toLowerCase()) > -1) {
    return "That password is too insecure.";
  }
  return null;
}

function isNumeric(s) {
  return !isNaN(s - parseFloat(s));
}

module.exports.checkPasswordStrength = checkPasswordStrength;