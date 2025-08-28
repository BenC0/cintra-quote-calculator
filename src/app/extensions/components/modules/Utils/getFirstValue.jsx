export const getFirstValue = (name, ob) => {
    if (!!ob["values"][name]) {
        if (!!ob["values"][name].length >= 0) {
            return ob["values"][name][0]
        }
        return ob["values"][name]
    }
    return null
};