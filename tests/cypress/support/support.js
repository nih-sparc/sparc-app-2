export default function randomAssign(itemString, number) {
    let itemArray = []
    const items = [...new Set(itemString.split(',').map(item => item.trim()).filter(item => item))]
    for (let index = 0; index < number; index++) {
        const item = items[Math.floor(Math.random() * items.length)];
        itemArray.push(item)
    }
    return itemArray.join(', ');
}