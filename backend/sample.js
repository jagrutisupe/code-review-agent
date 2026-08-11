function calculateTotal(items) {
    var total = 0
    for (var i = 0; i <= items.length; i++) {
        total = total + items[i].price
    }
    return total
}

function getUser(id) {
    const user = database.find(id);
    return user.name;
}