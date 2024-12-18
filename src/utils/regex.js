const validateEmail = (email) => {
    return String(email)
    .toLowerCase()
    .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const validatePassword= (password) => {
    return String(password)
    .toLowerCase()
    .match(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
    );
};

const findKeywordIgnoreCase= (inputString, keyword) => {
    const regexPattern = new RegExp(keyword, 'i');
    // Use the regular expression to search for the keyword in the input string
    return regexPattern.test(inputString);
};

module.exports = {
    validateEmail,
    validatePassword,
    findKeywordIgnoreCase
};