const stringToArray = (stringToSplit, separator) => {

    const array = stringToSplit.split(separator); // split string by separator

    const trimmedArray = array.map((item) => item.trim()); // remove leading/trailing white spaces

    const validArray = trimmedArray.filter((item) => item); // remove empty strings

    const uniqueArray = [...new Set(validArray)]; // remove duplicates

    return uniqueArray;

};

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
const randomInteger = (min, max) => {

    min = Math.ceil(min);

    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;

}

export { stringToArray, randomInteger }