export const stringToArray = (stringToSplit, separator) => {

    const array = stringToSplit.split(separator); // split string by separator

    const trimmedArray = array.map((item) => item.trim()); // remove leading/trailing white spaces

    const validArray = trimmedArray.filter((item) => item); // remove empty strings

    const uniqueArray = [...new Set(validArray)]; // remove duplicates

    return uniqueArray;

};
