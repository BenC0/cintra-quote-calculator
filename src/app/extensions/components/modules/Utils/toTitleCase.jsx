export const toTitleCase = (str = "") => str.replace(
   /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
)