async function checkUsernameSpecifications(username) {
  if (username.length < 2) return "Your username must be at least 2 characters long.";
  if (username.length > 32) return "Your username can only be up to 32 characters long.";

  return null;
}

module.exports.checkUsernameSpecifications = checkUsernameSpecifications;