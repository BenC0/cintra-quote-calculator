export const reshapeArray = (inputArray, maxItemsPerRow) => {
    let result = [];
    for (let i = 0; i < inputArray.length; i += maxItemsPerRow) {
        result.push(inputArray.slice(i, i + maxItemsPerRow));
    }
    return result;
}